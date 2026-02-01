import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { FormField, form, submit } from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  type ErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { RatingControlComponent } from '../../shared/controls';
import {
  initialCustomControlsModel,
  type CustomControlsModel,
} from './custom-controls.model';
import { customControlsSchema } from './custom-controls.validations';

/**
 * Custom Controls Demo Form
 *
 * Demonstrates custom FormValueControl components (RatingControl) working
 * seamlessly with ngx-signal-form-field-wrapper.
 *
 * Key features:
 * - Custom RatingControl implementing FormValueControl<number>
 * - Auto-derivation of fieldName from custom control's id attribute
 * - Proper ARIA attributes for accessibility
 * - Error display integration
 *
 * @example
 * ```html
 * <ngx-custom-controls [errorDisplayMode]="'on-touch'" />
 * ```
 */
@Component({
  selector: 'ngx-custom-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormField,
    RatingControlComponent,
  ],
  templateUrl: './custom-controls.html',
})
export class CustomControlsComponent {
  /**
   * Error display mode input - controls when errors are shown.
   */
  errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');

  /**
   * Form model signal with default values.
   */
  readonly #model = signal<CustomControlsModel>(initialCustomControlsModel);

  /**
   * Create form instance with validation schema.
   * Exposed as public for debugger access.
   */
  readonly reviewForm = form(this.#model, customControlsSchema);

  /**
   * Form submission handler using submit() helper.
   */
  protected saveData(event: Event): void {
    event.preventDefault();
    submit(this.reviewForm, async () => {
      console.log('Review submitted:', this.#model());
      return null;
    });
  }

  /**
   * Reset form to initial values.
   */
  protected resetForm(): void {
    this.reviewForm().reset();
    this.#model.set(initialCustomControlsModel);
  }
}
