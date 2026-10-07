// Custom controls demo form - product review with rating, switch, checkbox controls
import { Component, computed, input, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import {
  buildAriaDescribedBy,
  createErrorVisibility,
  createOnInvalidHandler,
  createSubmittedStatusTracker,
  NgxSignalFormToolkit,
  provideNgxSignalFormControlPresetsForComponent,
  type ErrorVisibilityState,
  type ResolvedErrorDisplayStrategy,
  type FormFieldAppearance,
  type FormFieldOrientation,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import {
  LegacyDatepickerAdapterComponent,
  RatingControlComponent,
  SwitchControlComponent,
} from '../../shared/controls';
import {
  AriaAutocompleteComponent,
  AriaSelectComponent,
} from '@ngx-signal-forms/demo-shared/ui';
import { MockAutocompleteComponent } from './mock-autocomplete';
import { initialCustomControlsModel } from './custom-controls.model';
import { customControlsSchema } from './custom-controls.validations';
import { BusyButtonDirective } from '../../shared/busy-button.directive';

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

  providers: [
    ...provideNgxSignalFormControlPresetsForComponent({
      slider: {
        layout: 'custom',
        ariaMode: 'manual',
      },
    }),
  ],
  imports: [
    BusyButtonDirective,
    FormField,
    NgxSignalFormToolkit,
    NgxFormField,
    AriaAutocompleteComponent,
    AriaSelectComponent,
    LegacyDatepickerAdapterComponent,
    MockAutocompleteComponent,
    RatingControlComponent,
    SwitchControlComponent,
  ],
  templateUrl: './custom-controls.html',
  styles: `
    :host {
      display: block;
    }

    /* Keep room for the legacy widget's separate calendar action when the
       standard wrapper puts that action outside the bordered input surface. */
    .legacy-datepicker-field:not(.ngx-signal-forms-outline):not(
        .ngx-signal-forms-plain
      ) {
      padding-inline-end: 2.375rem;
    }
  `,
})
export class CustomControlsFormComponent {
  readonly #submitAttempted = signal(false);

  readonly #handleInvalidSubmission = createOnInvalidHandler();

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
    field: () => ErrorVisibilityState,
    fieldName: string,
    hintIds: readonly string[],
  ) {
    // `createErrorVisibility()` resolves `errorDisplayMode` and the submit
    // status through the toolkit, and reads any ambient `[ngxSignalForm]`.
    const showErrors = createErrorVisibility(field, {
      strategy: this.errorDisplayMode,
      submittedStatus: this.submittedStatus,
    });

    return computed(() =>
      buildAriaDescribedBy(fieldName, {
        baseIds: [...hintIds],
        showErrors: showErrors(),
      }),
    );
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
   * `LegacyDatepickerAdapterComponent` also runs in manual ARIA mode (its
   * internal widget owns the real `<input>`), so it needs the same
   * explicit described-by chain as the rating controls above.
   */
  protected readonly birthDateDescribedBy = this.#buildRatingDescribedBy(
    this.reviewForm.birthDate,
    'birthDate',
    ['birthDate-hint'],
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
