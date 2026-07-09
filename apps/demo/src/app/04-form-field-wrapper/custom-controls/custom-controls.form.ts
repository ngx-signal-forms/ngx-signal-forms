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
  injectFormContext,
  NgxSignalFormToolkit,
  provideNgxSignalFormControlPresetsForComponent,
  resolveStrategyFromContext,
  shouldShowErrors,
  type ResolvedErrorDisplayStrategy,
  type FormFieldAppearance,
  type FormFieldOrientation,
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
 * seamlessly with ngx-form-field-wrapper.
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

  /**
   * Injected ngx form context. `undefined` when this component is the
   * outermost form (the normal case for this demo). Kept so the
   * `'inherit'` branch of `errorDisplayMode` resolves through the toolkit
   * if the demo is ever nested under another `[ngxSignalForm]`.
   */
  readonly #formContext = injectFormContext();

  /**
   * Error display mode input - controls when errors are shown.
   */
  readonly errorDisplayMode = input<ResolvedErrorDisplayStrategy>('on-touch');

  /**
   * Form field appearance input
   */
  readonly appearance = input<FormFieldAppearance>('standard');

  readonly orientation = input<FormFieldOrientation>('vertical');

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
      action: async (field) => {
        console.log('Review submitted:', field().value());
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

  /**
   * All four `ngx-rating-control` usages own their ARIA themselves (see the
   * host bindings in `RatingControlComponent`), so every one of them runs in
   * `ngxSignalFormControl="slider"` (manual ARIA, via the component-scoped
   * preset above) rather than the toolkit's auto-ARIA mode. This helper
   * builds the same explicit `aria-describedby` chain — hint id, plus the
   * error id only while the field's errors should be visible — for each of
   * them, mirroring the pattern once instead of four times.
   */
  #buildRatingDescribedBy(
    field: () => { invalid(): boolean; touched(): boolean },
    fieldName: string,
    hintIds: readonly string[],
  ) {
    return computed(() => {
      const fieldState = field();
      const resolvedMode = resolveStrategyFromContext(
        this.errorDisplayMode(),
        this.#formContext,
      );

      return buildAriaDescribedBy(fieldName, {
        baseIds: [...hintIds],
        showErrors: shouldShowErrors(
          fieldState.invalid(),
          fieldState.touched(),
          resolvedMode,
          this.submittedStatus(),
        ),
      });
    });
  }

  protected readonly ratingDescribedBy = this.#buildRatingDescribedBy(
    this.reviewForm.rating,
    'rating',
    ['rating-hint'],
  );

  protected readonly serviceRatingDescribedBy = this.#buildRatingDescribedBy(
    this.reviewForm.serviceRating,
    'serviceRating',
    [],
  );

  protected readonly wouldRecommendDescribedBy = this.#buildRatingDescribedBy(
    this.reviewForm.wouldRecommend,
    'wouldRecommend',
    ['wouldRecommend-hint'],
  );

  protected readonly accessibilityAuditDescribedBy =
    this.#buildRatingDescribedBy(
      this.reviewForm.accessibilityAudit,
      'accessibilityAudit',
      ['accessibilityAudit-hint'],
    );

  /**
   * Reset form to initial values.
   */
  protected resetForm(): void {
    this.reviewForm().reset();
    this.#submitAttempted.set(false);
    this.#model.set(initialCustomControlsModel);
  }
}
