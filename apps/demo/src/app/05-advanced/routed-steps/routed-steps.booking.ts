import { inject, Injectable, linkedSignal, signal } from '@angular/core';
import { form, type FieldTree } from '@angular/forms/signals';
import { focusFirstInvalid } from '@ngx-signal-forms/toolkit';

import { WorkshopApiService } from './routed-steps.api';
import {
  BOOKING_STEPS,
  type BookingStepId,
  type BookingValue,
  INITIAL_BOOKING_VALUE,
} from './routed-steps.model';
import { bookingSchema } from './routed-steps.validations';

/**
 * The booking form. The route of the example provides it, above the outlet
 * that shows the steps.
 *
 * A step component only binds its part of {@link form}. Thus the values, the
 * touched state and the validation state stay when the router destroys a
 * step, also when the step failed and the router shows its `errorComponent`.
 */
@Injectable()
export class BookingForm {
  readonly #api = inject(WorkshopApiService);
  readonly #model = signal<BookingValue>(INITIAL_BOOKING_VALUE);

  /** `true` after a successful submit, until the visitor changes a value. */
  readonly confirmed = linkedSignal({
    source: this.#model,
    computation: () => false,
  });

  readonly form = form(this.#model, bookingSchema, {
    submission: {
      action: async (tree) => {
        const submitted = tree().value();
        await this.#api.book(submitted);
        // A change during the request made a new value, which was not sent.
        if (tree().value() === submitted) this.confirmed.set(true);
      },
    },
  });

  /**
   * The first step before `target` that is not valid, or `null` when the
   * visitor can open `target`.
   */
  firstInvalidStepBefore(target: BookingStepId): BookingStepId | null {
    for (const step of BOOKING_STEPS) {
      if (step.id === target) return null;
      if (this.#stepField(step.id)?.().invalid() === true) return step.id;
    }
    return null;
  }

  /**
   * Shows the errors of a step and moves focus to its first invalid control.
   * The toolkit shows an error when its field is touched, so this marks the
   * part of the form that the step owns as touched.
   */
  revealErrors(step: BookingStepId): void {
    const stepField = this.#stepField(step);
    if (stepField === null) return;
    stepField().markAsTouched();
    focusFirstInvalid(stepField);
  }

  /** Clears the values and the interaction state for a new booking. */
  startOver(): void {
    this.form().reset(INITIAL_BOOKING_VALUE);
  }

  #stepField(step: BookingStepId): FieldTree<unknown> | null {
    if (step === 'attendee') return this.form.attendee;
    if (step === 'time-slot') return this.form.timeSlot;
    // The review step has no fields.
    return null;
  }
}
