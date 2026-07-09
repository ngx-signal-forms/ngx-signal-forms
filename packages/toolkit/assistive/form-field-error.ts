import {
  afterEveryRender,
  Component,
  computed,
  inject,
  input,
  isDevMode,
} from '@angular/core';
import type { FieldTree, ValidationError } from '@angular/forms/signals';
import {
  injectFormContext,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  resolveStrategyFromContext,
  showErrors,
  unwrapValue,
  type ErrorDisplayStrategy,
  type ResolvedErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import {
  createFieldMessageIdSignals,
  resolveFieldNameFromCandidates,
} from '@ngx-signal-forms/toolkit/core';
import {
  createErrorMessageSignal,
  NgxHeadlessErrorState,
} from '@ngx-signal-forms/toolkit/headless';

export type NgxFormFieldListStyle = 'plain' | 'bullets';

/**
 * @deprecated Use {@link NgxFormFieldListStyle} instead.
 */
export type NgxFormFieldErrorListStyle = NgxFormFieldListStyle;

/**
 * Reusable error and warning display component with WCAG 2.2 compliance.
 *
 * Accepts a FieldTree from Angular Signal Forms.
 *
 * ## Architecture
 *
 * `NgxFormFieldError` is a thin styled shell. All error-state logic
 * (strategy resolution, error splitting, message priority, ID generation)
 * lives exclusively in `NgxHeadlessErrorState`, which is composed via
 * `hostDirectives`. The assistive component only adds:
 *
 * - Template rendering (live regions, list/paragraph layouts)
 * - `fieldName` resolution from `NGX_SIGNAL_FORM_FIELD_CONTEXT` (parent wrapper)
 * - `warningStrategy` with its `'immediate'` default
 * - `listStyle` for visual layout choice
 *
 * ## Bridge pattern for `formField`
 *
 * Angular's `FormField` directive uses `[formField]` as its CSS selector
 * (`selector: "[formField]"`) AND declares `passThroughInput: "formField"`.
 * Forwarding `field: formField` via `hostDirectives` `inputs` makes Angular
 * try to apply `FormField` to `ngx-form-field-error` and lose the
 * pass-through flag, throwing NG01914.
 *
 * Solution: keep `formField` as a **direct class input** (which preserves
 * `FormField`'s pass-through check) and bridge it to `NgxHeadlessErrorState`
 * by calling `headless.connectFieldState(computed(() => formField()?.()))`
 * in the constructor. The headless directive uses this bridged signal for
 * strategy-based `showErrors` and error-split computation.
 *
 * ## Signal Forms Limitation: No Native Warning Support
 *
 * Signal Forms only has "errors" - it doesn't have a built-in concept of "warnings".
 * This component provides warnings support using a **convention-based approach**:
 *
 * - **Errors** (blocking): `kind` does NOT start with `'warn:'`
 * - **Warnings** (non-blocking): `kind` starts with `'warn:'`
 *
 * @example Simplest Usage (no NgxSignalFormToolkit needed!)
 * ```html
 * <form (submit)="save($event)" novalidate>
 *   <input [formField]="form.email" />
 *   <ngx-form-field-error [formField]="form.email" fieldName="email" />
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 *
 * @example With Form-Level Strategy Override
 * ```html
 * <form [formRoot]="form" ngxSignalForm errorStrategy="immediate">
 *   <ngx-form-field-error [formField]="form.email" fieldName="email" />
 * </form>
 * ```
 *
 * Features:
 * - **Errors**: `role="alert"` (implies `aria-live="assertive"` + `aria-atomic="true"`)
 * - **Warnings**: `role="status"` (implies `aria-live="polite"` + `aria-atomic="true"`)
 * - Strategy-aware error/warning display — warnings default to `'immediate'`
 *   so informational feedback stays visible; override via `warningStrategy`
 * - Structured rendering from Signal Forms
 * - Auto-generated IDs for aria-describedby linking
 */
@Component({
  selector: 'ngx-form-field-error',

  host: {
    // The role="alert"/role="status" containers stay mounted (see the
    // template docs), and each collapses visually while empty via its own
    // `--empty` class — but that leaves `:host`'s own `margin-top`
    // (form-field-error.css) contributing stray vertical whitespace above
    // every field with no visible errors *or* warnings. This class lets the
    // CSS zero that margin too, without touching `[hidden]`/`aria-hidden`
    // (which stay off the inner containers for the WCAG 4.1.3 reasons
    // documented on the template).
    '[class.ngx-form-field-error-host--empty]': 'hostEmpty()',
  },
  hostDirectives: [
    {
      directive: NgxHeadlessErrorState,
      inputs: [
        'strategy',
        'submittedStatus',
        // `errorsOverride` exposed as `errors` for direct-errors mode
        // (e.g. NgxFormFieldset.filteredErrorsSignal).
        // `formField` is intentionally NOT forwarded — see class comment.
        'errorsOverride: errors',
      ],
    },
  ],
  template: `
    <!--
      Blocking Errors: role="alert" already implies aria-live="assertive"
      and aria-atomic="true". Setting them explicitly causes duplicate
      announcements on NVDA+Firefox, so we rely on the implicit semantics.

      The container is rendered UNCONDITIONALLY (even when empty) so that
      role="alert" — which only fires reliably on content insertion into a
      pre-existing live region — works the very first time an error appears.
      This satisfies WCAG 4.1.3 (Status Messages) and avoids the NVDA + Chrome
      timing edge case where a freshly-inserted live region misses its first
      announcement. We intentionally do NOT toggle aria-hidden/[hidden]
      while empty: the @if below already guarantees zero content (including
      whitespace text) when empty, so an empty live region announces nothing
      on its own — flipping aria-hidden off at the same tick the first
      error is inserted would prune-then-immediately-expose the node, which
      is functionally equivalent to inserting a brand-new live region and
      reintroduces the very missed-first-announcement bug this pattern exists
      to avoid. Visual collapse while empty is handled by the --empty CSS
      class alone.
    -->
    <div
      [attr.id]="errorContainerVisible() ? errorId() : null"
      class="ngx-form-field-error ngx-form-field-error--error"
      [class.ngx-form-field-error--empty]="!errorContainerVisible()"
      role="alert"
    >
      @if (errorContainerVisible()) {
        @if (usesBulletList()) {
          <ul class="ngx-form-field-error__list" role="list">
            @for (
              error of resolvedErrors();
              track \`\${error.kind}:\${$index}\`
            ) {
              <li
                class="ngx-form-field-error__message ngx-form-field-error__message--error"
              >
                {{ error.message }}
              </li>
            }
          </ul>
        } @else {
          @for (
            error of resolvedErrors();
            track \`\${error.kind}:\${$index}\`
          ) {
            <p
              class="ngx-form-field-error__message ngx-form-field-error__message--error"
            >
              {{ error.message }}
            </p>
          }
        }
      }
    </div>

    <!--
      Non-blocking Warnings: role="status" implies aria-live="polite" and
      aria-atomic="true"; the explicit attributes are intentionally omitted
      to avoid duplicate AT announcements. Same empty-live-region pattern as
      the alert container above (no aria-hidden/[hidden] toggling).
    -->
    <div
      [attr.id]="warningContainerVisible() ? warningId() : null"
      class="ngx-form-field-error ngx-form-field-error--warning"
      [class.ngx-form-field-error--empty]="!warningContainerVisible()"
      role="status"
    >
      @if (warningContainerVisible()) {
        @if (usesBulletList()) {
          <ul class="ngx-form-field-error__list" role="list">
            @for (
              warning of resolvedWarnings();
              track \`\${warning.kind}:\${$index}\`
            ) {
              <li
                class="ngx-form-field-error__message ngx-form-field-error__message--warning"
              >
                {{ warning.message }}
              </li>
            }
          </ul>
        } @else {
          @for (
            warning of resolvedWarnings();
            track \`\${warning.kind}:\${$index}\`
          ) {
            <p
              class="ngx-form-field-error__message ngx-form-field-error__message--warning"
            >
              {{ warning.message }}
            </p>
          }
        }
      }
    </div>
  `,
  styleUrls: ['../form-field/feedback-tokens.css', './form-field-error.css'],
})
export class NgxFormFieldError {
  /**
   * Injected headless error state directive (composed via hostDirectives).
   * All strategy resolution, error splitting, message priority, and resolved
   * message computation delegates to this instance.
   */
  protected readonly headless = inject(NgxHeadlessErrorState);

  /**
   * Form context is needed here for the warning-strategy computation,
   * which is an assistive-layer concern not shared with the headless directive.
   */
  readonly #injectedContext = injectFormContext();

  /**
   * Try to inject field context (optional - provided by form field wrapper).
   * Used to automatically resolve field name when not explicitly provided.
   */
  readonly #fieldContext = inject(NGX_SIGNAL_FORM_FIELD_CONTEXT, {
    optional: true,
  });

  /**
   * One-shot guard so the "missing field name" dev error fires at most once
   * per component instance.
   */
  #warnedMissingName = false;

  /**
   * The Signal Forms field to observe for errors and strategy-based visibility.
   *
   * Kept as a direct class input (not forwarded via `hostDirectives`) to
   * preserve Angular's `FormField` directive pass-through check
   * (`passThroughInput: "formField"`). The value is bridged to
   * `NgxHeadlessErrorState` via `headless.connectFieldState()` in the
   * constructor.
   */
  readonly formField = input<FieldTree<unknown>>();

  /**
   * The field name used for generating error/warning IDs.
   *
   * When omitted the field name is inherited from the parent
   * `ngx-form-field-wrapper` via `NGX_SIGNAL_FORM_FIELD_CONTEXT`.
   */
  readonly fieldName = input<string>();

  /**
   * Warning display strategy for this specific field.
   *
   * Warnings default to `'immediate'` so non-blocking guidance stays
   * visible even while errors are gated by `'on-touch'` or `'on-submit'`.
   *
   * @default `'immediate'`
   */
  readonly warningStrategy = input<ErrorDisplayStrategy | undefined>();

  /**
   * Visual layout for rendered validation messages.
   *
   * - `plain` (default): stacked paragraph messages for inline field feedback
   * - `bullets`: unordered list for grouped summaries such as fieldsets
   */
  readonly listStyle = input<NgxFormFieldListStyle>('plain');

  /**
   * Reactive accessor to the underlying field state, derived from the same
   * `[formField]` input the headless directive consumes. Used to drive the
   * `createErrorMessageSignal()` calls below so the in-tree wrapper and any
   * external headless consumer share one resolution code path.
   *
   * Override precedence matches `NgxHeadlessErrorState.showErrors`: when the
   * host binds `[errors]`/`errorsOverride`, synthesise a minimal field-state
   * shape from the override signal so the primitive's `createErrorVisibility`
   * cascade short-circuits to "visible" and `readDirectErrors` finds the
   * override entries. Only when no override is supplied do we fall through
   * to the `[formField]` input. Reversing this order would let the alert
   * container go visible (driven by `headless.showErrors`, which checks
   * `errorsOverride` first) while `resolvedErrors()` read messages from
   * `formField` instead.
   */
  readonly #fieldStateAccessor = computed(() => {
    const rawOverride = this.headless.errorsOverride();
    const override =
      rawOverride === undefined ? undefined : unwrapValue(rawOverride);
    if (override !== undefined) {
      // Synthesised field-state surface: only the three accessors the primitive
      // reads (`errors`, `invalid`, `touched`).
      return {
        errors: (): readonly ValidationError[] => override,
        invalid: (): boolean => override.length > 0,
        touched: (): boolean => true,
      };
    }
    return this.formField()?.();
  });

  // ── Field name / ID resolution ────────────────────────────────────────
  //
  // Pure by design: when nested inside `ngx-form-field-wrapper`,
  // `this.#fieldContext.fieldName()` is the wrapper's own `resolvedFieldName`
  // signal, which starts out `null` and only picks up the bound control's
  // `id` once the wrapper's `afterEveryRender` write phase runs (see
  // form-field-wrapper.ts). This component's template (`errorId()` /
  // `warningId()`, both derived from `#resolvedFieldName`) can render on
  // that very first pass whenever errors are already visible (e.g.
  // `strategy="immediate"`), which used to fire this component's own
  // `console.error` purely because of the one-render race — even for a
  // correctly configured field. The diagnostic is emitted from
  // `afterEveryRender` below instead, once the wrapper (if any) has had a
  // chance to settle.
  readonly #resolvedFieldName = computed<string | null>(() => {
    return resolveFieldNameFromCandidates(
      this.fieldName(),
      this.#fieldContext?.fieldName(),
    );
  });

  constructor() {
    // Bridge the `formField` class input to the headless directive so it can
    // compute strategy-based showErrors and split errors/warnings.
    // Cannot use `hostDirectives` input forwarding for `formField` because
    // Angular's FormField directive has selector `[formField]` and would try
    // to apply to this component, losing the `passThroughInput` guard.
    this.headless.connectFieldState(computed(() => this.formField()?.()));

    afterEveryRender(() => {
      if (
        isDevMode() &&
        !this.#warnedMissingName &&
        this.#resolvedFieldName() === null
      ) {
        this.#warnedMissingName = true;
        // oxlint-disable-next-line no-console -- dev-mode misconfiguration signal
        console.error(
          '[ngx-signal-forms] ngx-form-field-error requires an explicit `fieldName` input or a parent ngx-form-field-wrapper context. The component will render without id/aria-describedby linking until one is provided.',
        );
      }
    });
  }

  /**
   * Computed error / warning IDs for aria-describedby linking. Both return
   * `null` when no field name can be resolved, which keeps the rendered
   * `[id]` binding absent instead of producing broken ids like `"-error"`.
   */
  readonly #fieldMessageIds = createFieldMessageIdSignals(
    this.#resolvedFieldName,
  );
  protected readonly errorId = this.#fieldMessageIds.errorId;
  protected readonly warningId = this.#fieldMessageIds.warningId;

  // ── Warning strategy ──────────────────────────────────────────────────
  readonly #resolvedWarningStrategy = computed<ResolvedErrorDisplayStrategy>(
    () => {
      const explicit = this.warningStrategy();
      if (explicit !== undefined) {
        return resolveStrategyFromContext(explicit, this.#injectedContext);
      }
      return 'immediate';
    },
  );

  /**
   * Warning visibility uses `formField` directly (the class input) and the
   * headless's resolved submitted status, so warnings stay independent of
   * the error strategy while still sharing the same submission state.
   */
  readonly #warningFieldState = computed(() => this.formField()?.());

  readonly #showWarningsByStrategy = showErrors(
    this.#warningFieldState,
    this.#resolvedWarningStrategy,
    this.headless.resolvedSubmittedStatus,
  );

  protected readonly showWarnings = computed(() => {
    if (!this.formField()) return true;
    return this.#showWarningsByStrategy();
  });

  // ── Visibility ────────────────────────────────────────────────────────
  protected readonly usesBulletList = computed(
    () => this.listStyle() === 'bullets',
  );

  /**
   * True when the role="alert" container should expose its content.
   * The container always stays in the DOM for WCAG 4.1.3 live-region
   * first-insertion semantics.
   */
  protected readonly errorContainerVisible = computed(
    () => this.headless.shouldShowErrors() && this.headless.hasErrors(),
  );

  /**
   * Same as `errorContainerVisible` but for the warnings live region.
   *
   * Guarded by `!errorContainerVisible()` — the README's "Warning support"
   * section documents "blocking errors present → warnings hidden", and
   * `NgxFormFieldset` already enforces this ("UX best practice", see
   * `filteredErrorsSignal`). Without the guard, a field with both blocking
   * errors and warnings would render BOTH the `role="alert"` and
   * `role="status"` containers at once — an assertive *and* a polite
   * announcement for the same field — and `createAriaDescribedBySignal`
   * would still compose `${fieldName}-warning` into a control's
   * `aria-describedby` even while this container is visible, so the two
   * are guarded in lockstep.
   */
  protected readonly warningContainerVisible = computed(
    () =>
      this.showWarnings() &&
      this.headless.hasWarnings() &&
      !this.errorContainerVisible(),
  );

  /**
   * True when neither the alert nor the status container has visible
   * content. Drives the `ngx-form-field-error-host--empty` host class so
   * the CSS can zero `:host`'s own `margin-top` — see the `host` binding
   * above for why that margin needs a separate collapse from the inner
   * containers' `--empty` class.
   */
  protected readonly hostEmpty = computed(
    () => !this.errorContainerVisible() && !this.warningContainerVisible(),
  );

  // ── Resolved messages (delegate to the public createErrorMessageSignal) ──
  // Keep these field initializers AFTER `#resolvedFieldName` so that the
  // arrow-bodied `fieldName` accessor passed to the primitive can read the
  // private field at evaluation time without tripping a forward-reference.

  /**
   * Strategy passed to the resolved-errors primitive. Mirrors the headless
   * directive's own override-mode short-circuit: when `errorsOverride` is
   * bound the caller has already aggregated and gated the error list
   * upstream, so the primitive's visibility cascade must bypass strategy
   * (otherwise an `'on-submit'` strategy with no submitted status would
   * leave `resolvedErrors()` empty while `errorContainerVisible` is true,
   * rendering an empty live region).
   */
  readonly #resolvedErrorsStrategy = computed<ErrorDisplayStrategy | undefined>(
    () =>
      this.headless.errorsOverride() === undefined
        ? this.headless.strategy()
        : 'immediate',
  );

  /**
   * Blocking errors, resolved through the public {@link createErrorMessageSignal}
   * primitive. The strategy and submitted-status inputs are forwarded so the
   * primitive's visibility cascade matches the directive's `showErrors` —
   * `errorContainerVisible` still gates rendering, so an empty list during
   * hidden states is a no-op.
   */
  protected readonly resolvedErrors = createErrorMessageSignal(
    this.#fieldStateAccessor,
    {
      strategy: this.#resolvedErrorsStrategy,
      submittedStatus: this.headless.submittedStatus,
      fieldName: computed(() => this.#resolvedFieldName()),
    },
  );

  /**
   * Warnings, resolved through {@link createErrorMessageSignal} with
   * `includeWarnings: 'only'`. The primitive call pins `strategy: 'immediate'`
   * unconditionally — warnings are informational and never gated by the
   * blocking-error strategy, so the override-mode bypass that
   * `#resolvedErrorsStrategy` performs for blocking errors is unnecessary
   * here. `warningContainerVisible` (driven by `showWarnings`, which uses
   * the warning-specific strategy cascade) controls rendering, and the
   * primitive's immediate cascade ensures `resolvedWarnings()` is non-empty
   * whenever warning kinds are present.
   */
  protected readonly resolvedWarnings = createErrorMessageSignal(
    this.#fieldStateAccessor,
    {
      strategy: 'immediate',
      includeWarnings: 'only',
      fieldName: computed(() => this.#resolvedFieldName()),
    },
  );
}
