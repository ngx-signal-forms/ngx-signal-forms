import {
  Directive,
  ElementRef,
  Injector,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  resolveFieldName,
  generateErrorId,
} from '../utilities/field-resolution';
import { injectFormConfig } from '../utilities/inject-form-config';

/**
 * Automatically manages ARIA attributes for Signal Forms controls.
 *
 * Adds:
 * - `aria-invalid`: Reflects the field's validation state
 * - `aria-describedby`: Links to error messages for screen readers
 *
 * **Selector Strategy**: Automatically applies to all form controls with `[control]` attribute,
 * except radio buttons and checkboxes (which require special handling).
 *
 * **Opt-out**: Add `ngxSignalFormAutoAriaDisabled` attribute to disable.
 *
 * @example
 * ```html
 * <!-- Automatic ARIA (enabled by default) -->
 * <label for="email">Email</label>
 * <input id="email" [control]="form.email" />
 * <!-- Result: aria-invalid="true" aria-describedby="email-error" when invalid -->
 *
 * <!-- Opt-out -->
 * <input [control]="form.custom" ngxSignalFormAutoAriaDisabled />
 * ```
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: `
    input[control]:not([ngxSignalFormAutoAriaDisabled]):not([type="radio"]):not([type="checkbox"]),
    textarea[control]:not([ngxSignalFormAutoAriaDisabled]),
    select[control]:not([ngxSignalFormAutoAriaDisabled])
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
   * The Signal Forms control for this field.
   * This should be passed from the parent form.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly control = input.required<any>();

  /**
   * Resolved field name for this control.
   */
  readonly #fieldName = signal<string | null>(null);

  /**
   * Computed ARIA invalid state.
   * Returns 'true' | 'false' | null based on field validity and error display strategy.
   */
  protected readonly ariaInvalid = computed(() => {
    const ctrl = this.control();
    if (!ctrl) return null;

    const fieldState = ctrl();
    if (!fieldState) return null;

    // Only show aria-invalid when errors should be displayed
    const invalid = fieldState.invalid();
    const touched = fieldState.touched();

    // TODO: Integrate with error display strategy from form context
    // For now, use simple logic: show invalid if touched and invalid
    return invalid && touched ? 'true' : 'false';
  });

  /**
   * Computed ARIA describedby attribute.
   * Links to the error message element for screen readers.
   */
  protected readonly ariaDescribedBy = computed(() => {
    const ctrl = this.control();
    if (!ctrl) return null;

    const fieldState = ctrl();
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
