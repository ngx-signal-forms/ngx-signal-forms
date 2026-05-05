import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import {
  generateErrorId,
  generateWarningId,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  type ResolvedErrorDisplayStrategy,
  type SubmittedStatus,
} from '@ngx-signal-forms/toolkit';
import { createErrorMessageSignal } from '@ngx-signal-forms/toolkit/headless';

/**
 * `hlm-error` look-alike. Bound by `NgxSpartanFormField` via the
 * `NGX_FORM_FIELD_ERROR_RENDERER` token. Reads `formField` and produces both
 * the blocking-error and warning slots, mirroring what
 * `<small data-slot="form-error">` would render in a hand-written Spartan
 * `hlm-error` component.
 *
 * Message resolution delegates to the public `createErrorMessageSignal`
 * primitive, so consumers that configure `NGX_ERROR_MESSAGES` see registry
 * values surface here through the same 3-tier cascade
 * (validator message → registry → default) as the in-tree
 * `NgxFormFieldError`.
 *
 * The toolkit hands the wrapper a single component for the error slot;
 * splitting blocking errors and warnings into separate `<p>` elements at
 * stable IDs lets `aria-describedby` chain to whichever one is currently
 * rendered.
 */
@Component({
  selector: 'spartan-form-field-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!--
      Blocking errors. role="alert" implies aria-live="assertive". The <p> is
      kept mounted (toggling [hidden] + [attr.aria-hidden]) so the live region
      preexists its first content insertion - some AT/browser combos miss the
      first announcement when role="alert" is created together with content.
      Mirrors the canonical toolkit pattern in NgxFormFieldError.
    -->
    <p
      class="text-destructive text-sm font-medium"
      [attr.id]="firstError() ? errorId() : null"
      [attr.data-warning]="false"
      role="alert"
      [attr.aria-hidden]="firstError() ? null : 'true'"
      [hidden]="!firstError()"
    >
      @if (firstError(); as err) {
        {{ err.message }}
      }
    </p>

    <!--
      Non-blocking warnings. role="status" implies aria-live="polite". Same
      mounted-toggle pattern as the alert container above.
    -->
    <p
      class="rounded-md bg-amber-100/60 px-2 py-1.5 text-sm font-medium text-amber-900 dark:bg-amber-900/20 dark:text-amber-200"
      [attr.id]="firstWarning() ? warningId() : null"
      [attr.data-warning]="true"
      role="status"
      [attr.aria-hidden]="firstWarning() ? null : 'true'"
      [hidden]="!firstWarning()"
    >
      @if (firstWarning(); as warn) {
        {{ warn.message }}
      }
    </p>
  `,
})
export class NgxSpartanFormFieldError {
  /**
   * Bound by `NgxFormFieldWrapper`-style consumers via `*ngComponentOutlet`'s
   * `inputs:` map. The Spartan wrapper passes the same shape — the `FieldTree`
   * is itself a signal, so we read errors as `formField()().errors()`.
   */
  readonly formField = input<FieldTree<unknown> | undefined>();

  /**
   * Strategy resolved by the parent wrapper. Forwarded to
   * `createErrorMessageSignal` so the primitive's visibility cascade matches
   * the wrapper's strategy. The `<p>` element stays mounted regardless (so
   * `role="alert"` preexists its first content insertion — WCAG 4.1.3); this
   * input only gates whether the region "activates" (has content + id, not
   * aria-hidden).
   */
  readonly strategy = input<ResolvedErrorDisplayStrategy>('on-touch');

  /**
   * Submission status forwarded from the wrapper. Required for the
   * `'on-submit'` strategy.
   */
  readonly submittedStatus = input<SubmittedStatus | undefined>();

  /**
   * Field name from the surrounding wrapper context. Used to generate the
   * stable error/warning container IDs that `NgxSignalFormAutoAria` writes
   * into `aria-describedby` on the bound control.
   */
  readonly #fieldContext = inject(NGX_SIGNAL_FORM_FIELD_CONTEXT, {
    optional: true,
  });

  readonly #fieldStateAccessor = computed(() => this.formField()?.());

  /**
   * Blocking errors, resolved through the public primitive. Strategy and
   * submission status are forwarded so visibility matches the wrapper's
   * cascade; the registry is auto-injected from `NGX_ERROR_MESSAGES`.
   */
  readonly #resolvedErrors = createErrorMessageSignal(
    this.#fieldStateAccessor,
    {
      strategy: this.strategy,
      submittedStatus: this.submittedStatus,
    },
  );

  /**
   * Warnings surface immediately (matching `NgxFormFieldError`'s default
   * `warningStrategy: 'immediate'`) — they are informational and not gated by
   * the blocking-error strategy.
   */
  readonly #resolvedWarnings = createErrorMessageSignal(
    this.#fieldStateAccessor,
    {
      strategy: 'immediate',
      includeWarnings: 'only',
    },
  );

  protected readonly firstError = computed(() => this.#resolvedErrors()[0]);
  protected readonly firstWarning = computed(() => this.#resolvedWarnings()[0]);

  /**
   * Container IDs use the kind-less `generateErrorId(name)` /
   * `generateWarningId(name)` shape so they stay in lockstep with the
   * `aria-describedby` chain produced by `NgxSignalFormAutoAria`. Do not
   * substitute `ResolvedFieldError.id` here — that ID embeds the validator
   * `kind` and would break the consumer's wiring.
   */
  protected readonly errorId = computed(() => {
    const name = this.#fieldContext?.fieldName() ?? null;
    return name !== null && name.length > 0 ? generateErrorId(name) : null;
  });

  protected readonly warningId = computed(() => {
    const name = this.#fieldContext?.fieldName() ?? null;
    return name !== null && name.length > 0 ? generateWarningId(name) : null;
  });
}
