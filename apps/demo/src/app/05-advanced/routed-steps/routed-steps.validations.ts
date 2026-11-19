import { email, maxLength, required, schema } from '@angular/forms/signals';

import { type BookingValue, NOTES_MAX_LENGTH } from './routed-steps.model';

/** One schema for the whole booking. Each step binds only its own part. */
export const bookingSchema = schema<BookingValue>((path) => {
  required(path.attendee.fullName, { message: 'Enter your full name' });
  required(path.attendee.email, { message: 'Enter your email address' });
  email(path.attendee.email, { message: 'Enter a valid email address' });

  required(path.timeSlot.slot, { message: 'Choose a time slot' });
  maxLength(path.timeSlot.notes, NOTES_MAX_LENGTH, {
    message: `Use ${NOTES_MAX_LENGTH} characters or fewer`,
  });
});
