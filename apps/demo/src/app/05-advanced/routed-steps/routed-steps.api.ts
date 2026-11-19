import { Injectable, signal } from '@angular/core';

import type { BookingValue } from './routed-steps.model';

/**
 * Fake workshop API for the routed-steps example.
 *
 * It is not real HTTP. Each call resolves after an in-memory delay, which is
 * sufficient to show the loading state and the failure of a step.
 */
const SIMULATED_LATENCY_MS = 400;

const TIME_SLOTS = ['09:00', '11:30', '14:00', '16:30'] as const;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

@Injectable()
export class WorkshopApiService {
  /**
   * While `true`, each {@link loadTimeSlots} call rejects. The page controls
   * set it, so a visitor or a test can make the time slot step fail and
   * recover.
   */
  readonly failTimeSlots = signal(false);

  /** Simulates `GET /workshop/time-slots`. */
  async loadTimeSlots(): Promise<readonly string[]> {
    const shouldFail = this.failTimeSlots();
    await delay(SIMULATED_LATENCY_MS);
    if (shouldFail) {
      throw new Error('The time slot service is unavailable.');
    }
    return TIME_SLOTS;
  }

  /** Simulates `POST /workshop/bookings`. */
  async book(_booking: BookingValue): Promise<void> {
    await delay(SIMULATED_LATENCY_MS);
  }
}
