import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  isDevMode,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import {
  injectFormContext,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  resolveStrategyFromContext,
  showErrors,
  type ErrorDisplayStrategy,
  type ResolvedErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import {
  createFieldMessageIdSignals,
  resolveFieldNameFromCandidates,
} from '@ngx-signal-forms/toolkit/core';
import { NgxHeadlessErrorState } from '@ngx-signal-forms/toolkit/headless';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
      announcement. We mark the container as aria-hidden="true" while empty
      so it is invisible to AT and contributes no whitespace text to the
      accessibility tree, but never toggle the role attribute itself.
    -->
    <div
      [id]="errorContainerVisible() ? errorId() : null"
      class="ngx-form-field-error ngx-form-field-error--error"
      [class.ngx-form-field-error--empty]="!errorContainerVisible()"
      role="alert"
      [attr.aria-hidden]="errorContainerVisible() ? null : 'true'"
      [hidden]="!errorContainerVisible()"
    >
      @if (errorContainerVisible()) {
        @if (usesBulletList()) {
          <ul class="ngx-form-field-error__list" role="list">
            @for (
              error of headless.resolvedErrors();
              track error.kind + ':' + error.message + ':' + $index
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
            error of headless.resolvedErrors();
            track error.kind + ':' + error.message + ':' + $index
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
      the alert container above.
    -->
    <div
      [id]="warningContainerVisible() ? warningId() : null"
      class="ngx-form-field-error ngx-form-field-error--warning"
      [class.ngx-form-field-error--empty]="!warningContainerVisible()"
      role="status"
      [attr.aria-hidden]="warningContainerVisible() ? null : 'true'"
      [hidden]="!warningContainerVisible()"
    >
      @if (warningContainerVisible()) {
        @if (usesBulletList()) {
          <ul class="ngx-form-field-error__list" role="list">
            @for (
              warning of headless.resolvedWarnings();
              track warning.kind + ':' + warning.message + ':' + $index
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
            warning of headless.resolvedWarnings();
            track warning.kind + ':' + warning.message + ':' + $index
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

  constructor() {
    // Bridge the `formField` class input to the headless directive so it can
    // compute strategy-based showErrors and split errors/warnings.
    // Cannot use `hostDirectives` input forwarding for `formField` because
    // Angular's FormField directive has selector `[formField]` and would try
    // to apply to this component, losing the `passThroughInput` guard.
    this.headless.connectFieldState(computed(() => this.formField()?.()));
  }

  // ── Field name / ID resolution ────────────────────────────────────────
  readonly #resolvedFieldName = computed<string | null>(() => {
    const resolvedFieldName = resolveFieldNameFromCandidates(
      this.fieldName(),
      this.#fieldContext?.fieldName(),
    );
    if (resolvedFieldName !== null) {
      return resolvedFieldName;
    }

    if (isDevMode() && !this.#warnedMissingName) {
      this.#warnedMissingName = true;
      // oxlint-disable-next-line no-console -- dev-mode misconfiguration signal
      console.error(
        '[ngx-signal-forms] ngx-form-field-error requires an explicit `fieldName` input or a parent ngx-form-field-wrapper context. The component will render without id/aria-describedby linking until one is provided.',
      );
    }
    return null;
  });

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
    () => this.headless.showErrors() && this.headless.hasErrors(),
  );

  /**
   * Same as `errorContainerVisible` but for the warnings live region.
   */
  protected readonly warningContainerVisible = computed(
    () => this.showWarnings() && this.headless.hasWarnings(),
  );
}
