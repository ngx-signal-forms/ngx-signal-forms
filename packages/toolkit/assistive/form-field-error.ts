import {
  afterEveryRender,
  Component,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import {
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY,
} from '@ngx-signal-forms/toolkit';
import {
  createFieldMessageIdSignals,
  devWarnOnce,
  resolveFieldNameFromCandidates,
  type WarnOnceRef,
} from '@ngx-signal-forms/toolkit/core';
import { NgxHeadlessErrorState } from '@ngx-signal-forms/toolkit/headless';

export type NgxFormFieldListStyle = 'plain' | 'bullets';

/**
 * @deprecated Use {@link NgxFormFieldListStyle} instead.
 */
export type NgxFormFieldErrorListStyle = NgxFormFieldListStyle;

/**
 * Visual treatment for the rendered live regions.
 *
 * - `'inline'` (default) — bare messages under a single control, no card
 *   chrome. The shape `NgxFormFieldWrapper` and per-field usage render.
 * - `'panel'` — a bordered, padded card with its own theme tokens
 *   (`--ngx-signal-form-error-panel-*`). For grouped fieldset feedback and
 *   custom summary blocks — what `NgxFormFieldNotification` used to render
 *   as a standalone component, folded here as a presentation mode instead
 *   (pre-1.0, no alias kept — see `docs/migrations/`).
 */
export type NgxFormFieldErrorPresentation = 'inline' | 'panel';

/**
 * Reusable error and warning display component with WCAG 2.2 compliance.
 *
 * Accepts a FieldTree from Angular Signal Forms.
 *
 * ## Architecture
 *
 * `NgxFormFieldError` is a thin styled shell. All error-state logic
 * (strategy resolution, error splitting, message priority) lives exclusively
 * in `NgxHeadlessErrorState`, which is composed via `hostDirectives`. The
 * template renders that directive's `resolvedErrors()` / `resolvedWarnings()`
 * as-is; the component never re-resolves a message or re-runs a visibility
 * cascade. What it adds on top:
 *
 * - Template rendering (live regions, list/paragraph layouts)
 * - `fieldName` resolution from `NGX_SIGNAL_FORM_FIELD_CONTEXT` (parent
 *   wrapper), and the container IDs derived from it
 * - `listStyle` for visual layout choice
 * - The rendered-container booleans, published to
 *   `NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY` so auto-ARIA references only
 *   what is on screen
 *
 * `strategy` and `warningStrategy` are *forwarded* to the headless directive,
 * not redeclared here — the two cascades resolve in one place. See
 * `NgxHeadlessErrorState.warningStrategy` for the warning cascade.
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
 * strategy-based `shouldShowErrors` and error-split computation.
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
 * - Strategy-aware error/warning display — warnings follow their own cascade
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
    '[attr.data-presentation]': 'presentation()',
  },
  hostDirectives: [
    {
      directive: NgxHeadlessErrorState,
      inputs: [
        'strategy',
        // Warnings resolve on their own cascade: this input → form context
        // `warningStrategy()` → `defaultWarningStrategy` → `'on-touch'`.
        // No tier consults `defaultErrorStrategy`.
        'warningStrategy',
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
        @if (title()) {
          <p class="ngx-form-field-error__title">{{ title() }}</p>
        }

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
        @if (title()) {
          <p class="ngx-form-field-error__title">{{ title() }}</p>
        }

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
  styleUrls: ['../core/feedback-tokens.css', './form-field-error.css'],
})
export class NgxFormFieldError {
  /**
   * Injected headless error state directive (composed via hostDirectives).
   * All strategy resolution, error splitting, message priority, and resolved
   * message computation delegates to this instance.
   */
  protected readonly headless = inject(NgxHeadlessErrorState);

  /**
   * Try to inject field context (optional - provided by form field wrapper).
   * Used to automatically resolve field name when not explicitly provided.
   */
  readonly #fieldContext = inject(NGX_SIGNAL_FORM_FIELD_CONTEXT, {
    optional: true,
  });

  /**
   * Field-visibility registry contributed by the nearest `[ngxSignalForm]`
   * host, if any. Lets a standalone (wrapper-less) instance of this
   * component publish its own resolved `errorContainerVisible()` /
   * `warningContainerVisible()` so `NgxSignalFormAutoAria` — which has no
   * other channel to a sibling error component's field-level `strategy`/
   * `warningStrategy` overrides — can keep `aria-describedby` in lockstep.
   * `null` when there is no `[ngxSignalForm]` ancestor (registration is a
   * no-op in that case).
   */
  readonly #visibilityRegistry = inject(
    NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY,
    { optional: true },
  );

  /**
   * One-shot guard so the "missing field name" dev error fires at most once
   * per component instance.
   */
  readonly #warnedMissingName: WarnOnceRef = { current: false };

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
   * Visual layout for rendered validation messages.
   *
   * - `plain` (default): stacked paragraph messages for inline field feedback
   * - `bullets`: unordered list for grouped summaries such as fieldsets
   */
  readonly listStyle = input<NgxFormFieldListStyle>('plain');

  /**
   * Optional title rendered above the message list when a container is
   * visible. Additive to both presentation modes; most useful in
   * `presentation="panel"`, where the folded-in `NgxFormFieldNotification`
   * used it for grouped fieldset feedback and custom summary cards.
   */
  readonly title = input<string | null | undefined>();

  /**
   * Visual treatment for the rendered live regions — see
   * {@link NgxFormFieldErrorPresentation}.
   */
  readonly presentation = input<NgxFormFieldErrorPresentation>('inline');

  /**
   * Blocking errors and warnings, read straight off the host directive.
   *
   * Both signals are un-gated message lists: the directive splits the
   * field's (or `errorsOverride`'s) entries by kind and applies the 3-tier
   * message cascade, and nothing else. Timing lives in
   * `errorContainerVisible` / `warningContainerVisible` below, which read
   * the same directive's `shouldShowErrors()` / `shouldShowWarnings()`. One
   * cascade per channel, resolved once (ADR-0006).
   */
  protected readonly resolvedErrors = this.headless.resolvedErrors;
  protected readonly resolvedWarnings = this.headless.resolvedWarnings;

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
  /**
   * Tier 1 (explicit input) → tier 3 (inherited context) of the toolkit's
   * canonical field-name cascade — this component has no bound control of
   * its own, so it never participates in tier 2 (bound-control id). See
   * {@link resolveFieldNameFromCandidates} for the full cascade.
   */
  readonly #resolvedFieldName = computed<string | null>(() => {
    return resolveFieldNameFromCandidates(
      this.fieldName(),
      this.#fieldContext?.fieldName(),
    );
  });

  constructor() {
    // Bridge the `formField` class input to the headless directive so it can
    // compute strategy-based shouldShowErrors and split errors/warnings.
    // Cannot use `hostDirectives` input forwarding for `formField` because
    // Angular's FormField directive has selector `[formField]` and would try
    // to apply to this component, losing the `passThroughInput` guard.
    this.headless.connectFieldState(computed(() => this.formField()?.()));

    afterEveryRender(() => {
      if (this.#resolvedFieldName() === null) {
        devWarnOnce(
          this.#warnedMissingName,
          'error',
          '[ngx-signal-forms] ngx-form-field-error requires an explicit `fieldName` input or a parent ngx-form-field-wrapper context. The component will render without id/aria-describedby linking until one is provided.',
        );
      }
    });

    // Publishes this instance's resolved visibility into
    // `NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY` whenever the resolved
    // field name changes, and unregisters on the field name changing away
    // or on destroy. A no-op when no registry is present (no
    // `[ngxSignalForm]` ancestor) or no field name resolves — mirrors the
    // dev-mode "missing field name" guard above by simply not registering
    // rather than registering under a synthetic key.
    //
    // Registers `errorContainerVisible`/`warningContainerVisible`
    // themselves — the exact booleans that gate this component's
    // `[attr.id]` bindings — rather than a strategy for the registry's
    // readers to re-resolve, so the published value always matches what is
    // actually rendered.
    effect((onCleanup) => {
      const registry = this.#visibilityRegistry;
      const fieldName = this.#resolvedFieldName();

      if (!registry || fieldName === null) {
        return;
      }

      const unregister = registry.register({
        fieldName,
        errorContainerVisible: this.errorContainerVisible,
        warningContainerVisible: this.warningContainerVisible,
      });

      onCleanup(unregister);
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

  /**
   * Warning visibility now uses the headless directive's shouldShowWarnings
   * which follows the warning-specific strategy cascade, independent of errors.
   */
  protected readonly showWarnings = this.headless.shouldShowWarnings;

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
}
