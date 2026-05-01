import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import type { FieldTree, ValidationError } from '@angular/forms/signals';
import {
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  generateErrorId,
  generateWarningId,
  isBlockingError,
  isWarningError,
} from '@ngx-signal-forms/toolkit';

/**
 * `hlm-error` look-alike. Bound by `SpartanFormFieldComponent` via the
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
  imports: [NgClass],
  template: `
    @if (firstError(); as err) {
      <p
        class="hlm-error"
        [attr.id]="errorId()"
        [attr.data-warning]="false"
        [ngClass]="{ 'hlm-error--block': true }"
      >
        {{ err.message ?? err.kind }}
      </p>
    }
    @if (firstWarning(); as warn) {
      <p class="hlm-error" [attr.id]="warningId()" [attr.data-warning]="true">
        {{ warn.message ?? warn.kind }}
      </p>
    }
  `,
})
export class SpartanFormFieldErrorComponent {
  /**
   * Bound by `NgxFormFieldWrapper`-style consumers via `*ngComponentOutlet`'s
   * `inputs:` map. The Spartan wrapper passes the same shape — the `FieldTree`
   * is itself a signal, so we read errors as `formField()().errors()`.
   */
  readonly formField = input<FieldTree<unknown> | undefined>();

  /**
   * Declared so `*ngComponentOutlet` can pass them in without emitting an
   * NG0303 dev warning. The renderer ignores both — visibility timing lives
   * in the toolkit's auto-ARIA / wrapper, not the renderer component.
   */
  readonly strategy = input<unknown>();
  readonly submittedStatus = input<unknown>();

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

  protected readonly firstError = computed(() =>
    this.errors().find(isBlockingError),
  );

  protected readonly firstWarning = computed(() =>
    this.errors().find(isWarningError),
  );

  protected readonly errorId = computed(() => {
    const name = this.#fieldContext?.fieldName() ?? null;
    return name ? generateErrorId(name) : null;
  });

  protected readonly warningId = computed(() => {
    const name = this.#fieldContext?.fieldName() ?? null;
    return name ? generateWarningId(name) : null;
  });
}
