import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';

import { BookingForm } from './routed-steps.booking';
import type { BookingStepId } from './routed-steps.model';

/**
 * Lets the visitor open the `target` step only when all earlier steps are
 * valid.
 *
 * - "Next" on an invalid step: the navigation stops, and the step shows its
 *   errors.
 * - A deep link or a history entry to a later step: the router goes to the
 *   first step that is not valid. That step does not show errors, because
 *   the visitor did not try to leave it.
 */
export function stepReachable(target: BookingStepId): CanActivateFn {
  return () => {
    const booking = inject(BookingForm);
    const router = inject(Router);

    const blocker = booking.firstInvalidStepBefore(target);
    if (blocker === null) return true;

    const blockerUrl = stepUrl(blocker);
    if (router.url.split(/[?#]/u)[0] === blockerUrl) {
      booking.revealErrors(blocker);
      return false;
    }
    return router.parseUrl(blockerUrl);
  };
}

/** The URL of a step. */
export function stepUrl(step: BookingStepId): string {
  return `${DEMO_PATHS.routedSteps}/${step}`;
}
