// Custom controls demo form - product review with rating, switch, checkbox controls
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import {
  buildAriaDescribedBy,
  createOnInvalidHandler,
  createSubmittedStatusTracker,
  NgxSignalFormToolkit,
  provideNgxSignalFormControlPresetsForComponent,
  shouldShowErrors,
  type ErrorDisplayStrategy,
  type FormFieldAppearance,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import {
  RatingControlComponent,
  SwitchControlComponent,
} from '../../shared/controls';
import { initialCustomControlsModel } from './custom-controls.model';
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
 * <ngx-custom-controls errorDisplayMode="on-touch" />
 * ```
 */
@Component({
  selector: 'ngx-custom-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    ...provideNgxSignalFormControlPresetsForComponent({
      slider: {
        layout: 'custom',
        ariaMode: 'manual',
      },
    }),
  ],
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormField,
    RatingControlComponent,
    SwitchControlComponent,
  ],
  templateUrl: './custom-controls.html',
  styles: `
    :host {
      display: block;
    }
  `,
})
export class CustomControlsFormComponent {
  readonly #submitAttempted = signal(false);

  readonly #handleInvalidSubmission = createOnInvalidHandler();

  readonly sliderSemantics = {
    kind: 'slider',
    layout: 'stacked',
    ariaMode: 'auto',
  } as const;

  /**
   * Error display mode input - controls when errors are shown.
   */
  readonly errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');

  /**
   * Form field appearance input
   */
  readonly appearance = input<FormFieldAppearance>('stacked');

  /**
   * Form model signal with default values.
   */
  readonly #model = signal(initialCustomControlsModel);

  /**
   * Create form instance with validation schema.
   * Exposed as public for debugger access.
   */
  readonly reviewForm = form(this.#model, customControlsSchema, {
    submission: {
      action: async () => {
        console.log('Review submitted:', this.#model());
        return null;
      },
      onInvalid: (formTree) => {
        this.#submitAttempted.set(true);
        this.#handleInvalidSubmission(formTree);
      },
    },
  });

  protected readonly submittedStatus = createSubmittedStatusTracker(
    this.reviewForm,
    this.#submitAttempted,
  );

  protected readonly accessibilityAuditDescribedBy = computed(() => {
    const fieldState = this.reviewForm.accessibilityAudit();
    const mode = this.errorDisplayMode();
    const resolvedMode = mode === 'inherit' ? 'on-touch' : mode;

    return buildAriaDescribedBy('accessibilityAudit', {
      baseIds: ['accessibilityAudit-hint'],
      showErrors: shouldShowErrors(
        fieldState.invalid(),
        fieldState.touched(),
        resolvedMode,
        this.submittedStatus(),
      ),
    });
  });

  /**
   * Reset form to initial values.
   */
  protected resetForm(): void {
    this.reviewForm().reset();
    this.#submitAttempted.set(false);
    this.#model.set(initialCustomControlsModel);
  }
}
