import {
  Directive,
  ElementRef,
  Injector,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import {
  generateErrorId,
  resolveFieldName,
} from '../utilities/field-resolution';
import { injectFormConfig } from '../utilities/inject-form-config';
import { isBlockingError } from '../utilities/warning-error';

/**
 * Automatically manages ARIA attributes for Signal Forms controls.
 *
 * Adds:
 * - `aria-invalid`: Reflects the field's validation state
 * - `aria-describedby`: Links to error messages for screen readers
 *
 * **Selector Strategy**: Automatically applies to all form controls with `[field]` attribute,
 * except radio buttons and checkboxes (which require special handling).
 *
 * **Opt-out**: Add `ngxSignalFormAutoAriaDisabled` attribute to disable.
 *
 * @example
 * ```html
 * <!-- Automatic ARIA (enabled by default) -->
 * <label for="email">Email</label>
 * <input id="email" [field]="form.email" />
 * <!-- Result: aria-invalid="true" aria-describedby="email-error" when invalid -->
 *
 * <!-- Opt-out -->
 * <input [field]="form.custom" ngxSignalFormAutoAriaDisabled />
 * ```
 */
@Directive({
  selector: `
    input[field]:not([ngxSignalFormAutoAriaDisabled]):not([type="radio"]):not([type="checkbox"]),
    textarea[field]:not([ngxSignalFormAutoAriaDisabled]),
    select[field]:not([ngxSignalFormAutoAriaDisabled])
  `,
  host: {
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-describedby]': 'ariaDescribedBy()',
  },
})
export class NgxSignalFormAutoAriaDirective {
  readonly #element = inject(ElementRef<HTMLElement>);
  readonly #injector = inject(Injector);
  readonly #config = injectFormConfig();

  /**
   * The Signal Forms field for this field.
   * Accepts a FieldTree (callable function returning FieldState).
   */
  readonly field = input.required<FieldTree<unknown>>();

  /**
   * Resolved field name for this field.
   */
  readonly #fieldName = signal<string | null>(null);

  /**
   * Computed ARIA invalid state.
   * Returns 'true' | 'false' | null based on field validity and error display strategy.
   *
   * Only sets aria-invalid='true' if there are blocking errors (not just warnings).
   * Warnings have kind starting with 'warn:' and should not trigger invalid state.
   */
  protected readonly ariaInvalid = computed(() => {
    const field = this.field();
    if (!field) return null;

    const fieldState = field();
    if (!fieldState) return null;

    const touched = fieldState.touched();
    if (!touched) return 'false';

    // Check if field has blocking errors (not just warnings)
    const errors = fieldState.errors();
    const hasBlockingErrors = errors.some(isBlockingError);

    return hasBlockingErrors ? 'true' : 'false';
  });

  /**
   * Computed ARIA describedby attribute.
   * Links to the error message element for screen readers.
   */
  protected readonly ariaDescribedBy = computed(() => {
    const field = this.field();
    if (!field) return null;

    const fieldState = field();
    if (!fieldState) return null;

    const invalid = fieldState.invalid();
    const touched = fieldState.touched();

    // Only add aria-describedby when errors are present and should be shown
    if (invalid && touched) {
      const fieldName = this.#fieldName();
      if (fieldName) {
        return generateErrorId(fieldName);
      }
    }

    return null;
  });

  constructor() {
    // Resolve field name on initialization
    const fieldName = resolveFieldName(
      this.#element.nativeElement,
      this.#injector,
    );
    this.#fieldName.set(fieldName);

    if (this.#config.debug) {
      console.log(
        '[NgxSignalFormAutoAriaDirective] Initialized for field:',
        fieldName,
      );
    }
  }
}
