import type { Routes } from '@angular/router';
import { getRouteTitle } from '@ngx-signal-forms/demo-shared';

import { WorkshopApiService } from './routed-steps.api';
import { BookingForm } from './routed-steps.booking';
import { stepReachable } from './routed-steps.guard';
import { AttendeeStepComponent } from './steps/attendee-step';
import { ReviewStepComponent } from './steps/review-step';
import { StepErrorComponent } from './steps/step-error';
import { TimeSlotStepComponent } from './steps/time-slot-step';

/**
 * Lazy route config for the routed-steps example.
 *
 * - The parent route provides `BookingForm`. Each step is a child route, so
 *   the form is older than every step and stays when a step goes away.
 * - Each step route has an `errorComponent`. With `withErrorBoundaries()` in
 *   `main.ts`, the router shows it in place of a step that throws. A route
 *   without `errorComponent` keeps the fallback of the app shell.
 * - `withAutoCleanupInjectors()` destroys `BookingForm` when the visitor
 *   leaves the example.
 */
export default [
  {
    path: '',
    providers: [WorkshopApiService, BookingForm],
    loadComponent: () => import('./routed-steps.page'),
    title: getRouteTitle('/advanced-scenarios/routed-steps'),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'attendee' },
      {
        path: 'attendee',
        component: AttendeeStepComponent,
        errorComponent: StepErrorComponent,
      },
      {
        path: 'time-slot',
        component: TimeSlotStepComponent,
        errorComponent: StepErrorComponent,
        canActivate: [stepReachable('time-slot')],
      },
      {
        path: 'review',
        component: ReviewStepComponent,
        errorComponent: StepErrorComponent,
        canActivate: [stepReachable('review')],
      },
    ],
  },
] satisfies Routes;
