import {
  afterRenderEffect,
  Component,
  type ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { BusyButtonDirective } from '../../../shared/busy-button.directive';
import { BookingForm } from '../routed-steps.booking';
import { stepUrl } from '../routed-steps.guard';
import { focusHeadingOnStepChange } from './step-focus';

/**
 * Step 3. Shows the values of the other steps and submits the form.
 *
 * The submit button is in this component, and the `<form>` element is in
 * `RoutedStepsComponent`, above the outlet. The button submits that form.
 */
@Component({
  selector: 'ngx-review-step',
  imports: [BusyButtonDirective, RouterLink],
  styleUrl: './step.scss',
  template: `
    <h2 #heading tabindex="-1" class="step-heading">Step 3 of 3: Review</h2>

    @if (booking.confirmed()) {
      <p #success tabindex="-1" class="step-success">
        Your seat is booked. A confirmation is on its way to
        {{ bookingForm.attendee.email().value() }}.
      </p>
    }

    <dl class="step-summary">
      <div>
        <dt>Name</dt>
        <dd>{{ bookingForm.attendee.fullName().value() }}</dd>
      </div>
      <div>
        <dt>Email</dt>
        <dd>{{ bookingForm.attendee.email().value() }}</dd>
      </div>
      <div>
        <dt>Time slot</dt>
        <dd>{{ bookingForm.timeSlot.slot().value() }}</dd>
      </div>
      <div>
        <dt>Notes</dt>
        <dd>{{ bookingForm.timeSlot.notes().value() || 'None' }}</dd>
      </div>
    </dl>

    <div class="step-actions">
      @if (booking.confirmed()) {
        <button type="button" class="btn-secondary" (click)="bookAnother()">
          Book another seat
        </button>
      } @else {
        <a class="btn-secondary" routerLink="../time-slot">Back</a>
        <button
          type="submit"
          class="btn-primary"
          [ngxBusy]="bookingForm().submitting()"
        >
          Confirm booking
        </button>
      }
    </div>
  `,
})
export class ReviewStepComponent {
  readonly #router = inject(Router);

  protected readonly booking = inject(BookingForm);
  protected readonly bookingForm = this.booking.form;

  // TS `private`, not `#`: see the note on AppComponent's queries.
  private readonly heading =
    viewChild.required<ElementRef<HTMLHeadingElement>>('heading');
  private readonly success =
    viewChild<ElementRef<HTMLParagraphElement>>('success');

  constructor() {
    focusHeadingOnStepChange(this.heading);

    // The submit button goes away when the booking is confirmed. Move focus
    // to the confirmation, so it is announced and focus does not drop to
    // `<body>`. Not on a return to an already confirmed booking: the heading
    // takes focus then.
    let wasConfirmed = this.booking.confirmed();
    afterRenderEffect(() => {
      const confirmed = this.booking.confirmed();
      if (confirmed && !wasConfirmed) this.success()?.nativeElement.focus();
      wasConfirmed = confirmed;
    });
  }

  protected bookAnother(): void {
    this.booking.startOver();
    void this.#router.navigateByUrl(stepUrl('attendee'));
  }
}
