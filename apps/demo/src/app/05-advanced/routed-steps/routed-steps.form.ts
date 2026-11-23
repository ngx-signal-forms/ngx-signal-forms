import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';

import { BookingForm } from './routed-steps.booking';
import { BOOKING_STEPS } from './routed-steps.model';

/**
 * The frame of the booking form: the `<form>` element, the step navigation
 * and the outlet for the step routes.
 *
 * `[formRoot]` and `ngxSignalForm` are on the `<form>` element here. The
 * router creates each step below this element, so toolkit components in a
 * step get the toolkit form context from it, and the submit button of the
 * review step submits this form.
 *
 * When a step throws, the router replaces only the content of the outlet.
 * This component and the `BookingForm` stay.
 */
@Component({
  selector: 'ngx-routed-steps',
  imports: [NgxSignalFormToolkit, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './routed-steps.form.html',
  styleUrl: './routed-steps.form.scss',
})
export class RoutedStepsComponent {
  readonly #booking = inject(BookingForm);

  protected readonly bookingForm = this.#booking.form;

  /**
   * A step has a link only when all earlier steps are valid. The guard of
   * the step routes uses the same rule.
   */
  protected readonly steps = computed(() =>
    BOOKING_STEPS.map((step, index) => ({
      id: step.id,
      label: step.label,
      number: index + 1,
      reachable: this.#booking.firstInvalidStepBefore(step.id) === null,
    })),
  );
}
