import { Component, type ElementRef, inject, viewChild } from '@angular/core';
import { FormField } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormMarkingLegend } from '@ngx-signal-forms/toolkit/assistive';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

import { BookingForm } from '../routed-steps.booking';
import { focusHeadingOnStepChange } from './step-focus';

/** Step 1. Binds the `attendee` part of the booking form. */
@Component({
  selector: 'ngx-attendee-step',
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormField,
    NgxFormMarkingLegend,
    RouterLink,
  ],
  styleUrl: './step.scss',
  template: `
    <h2 #heading tabindex="-1" class="step-heading">Step 1 of 3: Attendee</h2>

    <div class="step-fields">
      <!-- No [formTree]: the legend finds the form through the toolkit form
           context of the <form> element above the outlet. -->
      <ngx-form-marking-legend />

      <ngx-form-field-wrapper [formField]="bookingForm.attendee.fullName">
        <label for="fullName">Full name</label>
        <input
          id="fullName"
          type="text"
          autocomplete="name"
          [formField]="bookingForm.attendee.fullName"
        />
      </ngx-form-field-wrapper>

      <ngx-form-field-wrapper [formField]="bookingForm.attendee.email">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          autocomplete="email"
          [formField]="bookingForm.attendee.email"
        />
        <ngx-form-field-hint>
          We send the booking confirmation to this address.
        </ngx-form-field-hint>
      </ngx-form-field-wrapper>
    </div>

    <div class="step-actions">
      <a class="btn-primary" routerLink="../time-slot">Next: Time slot</a>
    </div>
  `,
})
export class AttendeeStepComponent {
  protected readonly bookingForm = inject(BookingForm).form;

  // TS `private`, not `#`: see the note on AppComponent's queries.
  private readonly heading =
    viewChild.required<ElementRef<HTMLHeadingElement>>('heading');

  constructor() {
    focusHeadingOnStepChange(this.heading);
  }
}
