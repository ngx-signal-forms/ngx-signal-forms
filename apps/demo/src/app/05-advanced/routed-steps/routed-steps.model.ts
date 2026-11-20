/** Who attends. Step 1. */
export interface BookingAttendee {
  fullName: string;
  email: string;
}

/** When the attendee comes. Step 2. The time slots come from the server. */
export interface BookingTimeSlot {
  slot: string;
  notes: string;
}

/** The one `form()` model for all steps. */
export interface BookingValue {
  attendee: BookingAttendee;
  timeSlot: BookingTimeSlot;
}

export const INITIAL_BOOKING_VALUE: BookingValue = {
  attendee: { fullName: '', email: '' },
  timeSlot: { slot: '', notes: '' },
};

/**
 * The steps in their order. Each `id` is also the child route path of the
 * step.
 */
export const BOOKING_STEPS = [
  { id: 'attendee', label: 'Attendee' },
  { id: 'time-slot', label: 'Time slot' },
  { id: 'review', label: 'Review' },
] as const;

export type BookingStepId = (typeof BOOKING_STEPS)[number]['id'];

export const NOTES_MAX_LENGTH = 200;
