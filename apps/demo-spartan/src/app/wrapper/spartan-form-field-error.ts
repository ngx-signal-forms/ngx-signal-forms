import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import type { FieldTree, ValidationError } from '@angular/forms/signals';
import {
  createShowErrorsComputed,
  generateErrorId,
  generateWarningId,
  isBlockingError,
  isWarningError,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  type ResolvedErrorDisplayStrategy,
  type SubmittedStatus,
} from '@ngx-signal-forms/toolkit';

/**
 * `hlm-error` look-alike. Bound by `NgxSpartanFormField` via the
 * `NGX_FORM_FIELD_ERROR_RENDERER` token. Reads `formField` and produces both
 * the blocking-error and warning slots, mirroring what
 * `<small data-slot="form-error">` would render in a hand-written Spartan
 * `hlm-error` component.
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
        {{ err.message ?? err.kind }}
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
      aria-live="polite"
      [attr.aria-hidden]="firstWarning() ? null : 'true'"
      [hidden]="!firstWarning()"
    >
      @if (firstWarning(); as warn) {
        {{ warn.message ?? warn.kind }}
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
   * Strategy resolved by the parent wrapper. Threaded into the live-region
   * visibility computed so blocking-error and warning containers stay in the
   * DOM but only "activate" once the strategy says messages should surface.
   */
  readonly strategy = input<ResolvedErrorDisplayStrategy>('on-touch');

  /**
   * Submission status forwarded from the wrapper. Required for the
   * `'on-submit'` strategy.
   */
  readonly submittedStatus = input<SubmittedStatus | undefined>();

  /**
   * Field name from the surrounding wrapper context. Used to generate the
   * stable error/warning IDs that `NgxSignalFormAutoAria` writes into
   * `aria-describedby` on the bound control.
   */
  readonly #fieldContext = inject(NGX_SIGNAL_FORM_FIELD_CONTEXT, {
    optional: true,
  });

  protected readonly errors = computed<readonly ValidationError[]>(() => {
    const tree = this.formField();
    if (!tree) return [];
    return tree().errors();
  });

  readonly #firstBlockingError = computed(() =>
    this.errors().find(isBlockingError),
  );

  readonly #firstWarning = computed(() => this.errors().find(isWarningError));

  /**
   * Strategy-aware visibility for the blocking-error live region. The <p>
   * element stays mounted regardless (so role="alert" preexists its first
   * content insertion - WCAG 4.1.3); this signal only gates whether the
   * region is "active" (has content + id, not aria-hidden).
   */
  readonly #fieldState = computed(() => this.formField()?.());
  readonly #showErrorsByStrategy = createShowErrorsComputed(
    this.#fieldState,
    this.strategy,
    this.submittedStatus,
  );

  protected readonly firstError = computed(() => {
    if (!this.#showErrorsByStrategy()) return undefined;
    return this.#firstBlockingError();
  });

  /**
   * Warnings surface immediately (matching the toolkit's
   * `NgxFormFieldError` default `warningStrategy: 'immediate'`) - they are
   * informational and not gated by the blocking-error strategy.
   */
  protected readonly firstWarning = this.#firstWarning;

  protected readonly errorId = computed(() => {
    const name = this.#fieldContext?.fieldName() ?? null;
    return name ? generateErrorId(name) : null;
  });

  protected readonly warningId = computed(() => {
    const name = this.#fieldContext?.fieldName() ?? null;
    return name ? generateWarningId(name) : null;
  });
}
