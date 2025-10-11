import { Directive, inject, input, HostListener } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { NGX_SIGNAL_FORMS_CONFIG } from '../tokens';

/**
 * Automatically triggers touch state on blur for Signal Forms controls.
 *
 * **Behavior**:
 * - Calls `field().markAsTouched()` when the control loses focus
 * - Only active when error strategy requires touch detection
 * - Respects global configuration
 *
 * **Selector Strategy**: Automatically applies to all form controls with `[control]` attribute,
 * except radio buttons and checkboxes (which have different UX patterns).
 *
 * **Opt-out**: Add `ngxSignalFormAutoTouchDisabled` attribute to disable.
 *
 * @example
 * ```html
 * <!-- Automatic touch state (enabled by default) -->
 * <input [control]="form.email" />
 * <!-- On blur: form.email().markAsTouched() is called -->
 *
 * <!-- Opt-out -->
 * <input [control]="form.custom" ngxSignalFormAutoTouchDisabled />
 * ```
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: `
    input[control]:not([type="checkbox"]):not([type="radio"]):not([ngxSignalFormAutoTouchDisabled]),
    textarea[control]:not([ngxSignalFormAutoTouchDisabled]),
    select[control]:not([ngxSignalFormAutoTouchDisabled])
  `,
})
export class NgxSignalFormAutoTouchDirective {
  readonly #config = inject(NGX_SIGNAL_FORMS_CONFIG);

  /**
   * The Signal Forms control for this field.
   * Accepts a FieldTree (callable function returning FieldState).
   */
  readonly control = input.required<FieldTree<unknown>>();

  /**
   * Handle blur event to mark field as touched.
   */
  @HostListener('blur')
  onBlur(): void {
    const ctrl = this.control();
    if (!ctrl) {
      if (this.#config.debug) {
        console.warn('[NgxSignalFormAutoTouchDirective] No control found');
      }
      return;
    }

    const fieldState = ctrl();
    if (!fieldState || typeof fieldState.markAsTouched !== 'function') {
      if (this.#config.debug) {
        console.warn(
          '[NgxSignalFormAutoTouchDirective] Field state does not support markAsTouched()',
        );
      }
      return;
    }

    fieldState.markAsTouched();

    if (this.#config.debug) {
      console.log('[NgxSignalFormAutoTouchDirective] Field marked as touched');
    }
  }
}
