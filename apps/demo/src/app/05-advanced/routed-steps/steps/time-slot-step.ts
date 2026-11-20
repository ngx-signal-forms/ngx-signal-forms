import {
  Component,
  type ElementRef,
  inject,
  resource,
  viewChild,
} from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormMarkingLegend } from '@ngx-signal-forms/toolkit/assistive';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

import { WorkshopApiService } from '../routed-steps.api';
import { BookingForm } from '../routed-steps.booking';
import { focusHeadingOnStepChange } from './step-focus';

/**
 * Step 2. Binds the `timeSlot` part of the booking form and loads the time
 * slots from the server.
 *
 * The template has no branch for a failed load. `timeSlots.value()` throws
 * when the load failed, and the router then shows the `errorComponent` of
 * this route in place of the step.
 */
@Component({
  selector: 'ngx-time-slot-step',
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormField,
    NgxFormMarkingLegend,
    RouterLink,
  ],
  styleUrl: './step.scss',
  template: `
    <h2 #heading tabindex="-1" class="step-heading">Step 2 of 3: Time slot</h2>

    @if (timeSlots.isLoading()) {
      <p class="step-text">Loading the time slots…</p>
    } @else {
      <div class="step-fields">
        <ngx-form-marking-legend />

        <ngx-form-field-wrapper [formField]="bookingForm.timeSlot.slot">
          <label for="slot">Time slot</label>
          <select id="slot" [formField]="bookingForm.timeSlot.slot">
            <option value="">Choose a time slot</option>
            @for (slot of timeSlots.value(); track slot) {
              <option [value]="slot">{{ slot }}</option>
            }
          </select>
        </ngx-form-field-wrapper>

        <ngx-form-field-wrapper [formField]="bookingForm.timeSlot.notes">
          <label for="notes">Notes for the organiser</label>
          <textarea
            id="notes"
            rows="3"
            [formField]="bookingForm.timeSlot.notes"
          ></textarea>
          <ngx-form-field-character-count
            [formField]="bookingForm.timeSlot.notes"
          />
          <ngx-form-field-hint>Optional.</ngx-form-field-hint>
        </ngx-form-field-wrapper>
      </div>
    }

    <div class="step-actions">
      <a class="btn-secondary" routerLink="../attendee">Back</a>
      <a class="btn-primary" routerLink="../review">Next: Review</a>
    </div>
  `,
})
export class TimeSlotStepComponent {
  readonly #api = inject(WorkshopApiService);

  protected readonly bookingForm = inject(BookingForm).form;
  protected readonly timeSlots = resource({
    loader: () => this.#api.loadTimeSlots(),
  });

  // TS `private`, not `#`: see the note on AppComponent's queries.
  private readonly heading =
    viewChild.required<ElementRef<HTMLHeadingElement>>('heading');

  constructor() {
    focusHeadingOnStepChange(this.heading);
  }
}
