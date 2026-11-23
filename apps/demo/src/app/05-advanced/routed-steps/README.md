# Routed Steps

## Intent

A three-step booking form (Attendee → Time slot → Review) where each step is a
**child route**, and each step route has a **router error boundary**. One
`form()` lives above the outlet. When a step throws, the router shows a
fallback in place of that step only. The form, the step navigation and the
entries of the other steps stay.

Router error boundaries are in developer preview in Angular 22.3
(`withErrorBoundaries()` and the `errorComponent` route property). Read the
[Angular guide](https://angular.dev/guide/routing/error-boundaries) for the
full contract.

This example is a sibling of
[`single-model-wizard`](../single-model-wizard/README.md), which has the same
one-model design without routes.

## Toolkit features showcased

- **Toolkit form context through the outlet.** `[formRoot]` and
  `ngxSignalForm` are on the `<form>` element around `<router-outlet>`. The
  router creates each step below that element, so toolkit components in a step
  get the form context. `<ngx-form-marking-legend />` in a step has no
  `[formTree]`: it finds the form through that context.
- **Nothing to restore after a failure.** `ngx-form-field-wrapper` reads the
  values, the touched state and the errors from the field state. That state
  lives in the form, not in the step component. A new instance of a step shows
  the same values and the same errors.
- **A step gate in a route guard.** `markAsTouched()` on the part of the form
  that a step owns makes the wrappers show the errors of that step.
  `focusFirstInvalid()` moves focus to the first invalid control.

## Form model

```ts
interface BookingValue {
  attendee: { fullName: string; email: string };
  timeSlot: { slot: string; notes: string };
}
```

`BookingForm` is an injectable that holds the model signal and the one
`form(model, bookingSchema, { submission })` call. The parent route provides
it, so each step route injects the same instance.

## Validation rules

### Errors

- Attendee: full name is required. Email is required and must be an email
  address.
- Time slot: a time slot is required. The notes can have 200 characters at
  most.

### Warnings

- None.

## How the routes are built

```ts
{
  path: '',
  providers: [WorkshopApiService, BookingForm], // older than every step
  loadComponent: () => import('./routed-steps.page'),
  children: [
    { path: '', pathMatch: 'full', redirectTo: 'attendee' },
    {
      path: 'time-slot',
      component: TimeSlotStepComponent,
      errorComponent: StepErrorComponent, // shown in place of a failed step
      canActivate: [stepReachable('time-slot')],
    },
    // attendee, review
  ],
}
```

`main.ts` turns the feature on for the app:

```ts
provideRouter(appRoutes, withErrorBoundaries({ onError: logRouteError }));
```

A route without `errorComponent` is not changed by this: its errors go to the
`@boundary` of the app shell, as before. `app.render-errors.spec.ts` runs with
the feature on and proves that.

## How a step fails

`TimeSlotStepComponent` loads the time slots with `resource()`. Its template
has no branch for a failed load:

```html
@for (slot of timeSlots.value(); track slot) {
<option [value]="slot">{{ slot }}</option>
}
```

`value()` of a failed resource throws. The router catches the error and
creates `StepErrorComponent` in the outlet. The component gets the error
through its `error` input.

The **Fail the time slot list** display control makes the fake API reject each
load, so you can see this state.

## How the fallback recovers

```ts
protected retry(): void {
  void this.#router.navigateByUrl(this.#router.url, {
    onSameUrlNavigation: 'reload',
  });
}
```

The router has no reset function for an error boundary. The same navigation
with `onSameUrlNavigation: 'reload'` makes the router destroy the fallback and
create the step again. A navigation to another step also removes the fallback.

## How the step gate works

`stepReachable(step)` makes the `canActivate` guard of the second and the
third step. It opens a step only when **all** earlier steps are valid:

- **Next on an invalid step:** the navigation stops. The guard marks the
  fields of the step as touched and moves focus to the first invalid control.
- **A deep link or a history entry to a later step:** the router goes to the
  first step that is not valid. That step shows no errors, because the visitor
  did not try to leave it.

The step navigation uses the same rule: a step is a link only when the visitor
can open it. Thus a visitor cannot skip an invalid step, also not through the
browser history.

## Keyboard and screen-reader behavior

- Each step, and the fallback, has a heading with `tabindex="-1"`. The
  heading takes focus when it replaces other step content: after a step
  change, after "Try again", and when a step fails. The control that the
  visitor used is gone at that moment, so focus would drop to `<body>`.
- The heading does not take focus when the visitor comes from another page.
  The app shell then moves focus to the page heading.
- The app shell treats a step change as the same page: it does not scroll to
  the top and does not move focus to the page heading. See `getExamplePath()`
  in `packages/demo/shared`.
- After a successful submit, focus moves to the confirmation, because the
  submit button goes away.

## What a router error boundary does not catch

- Errors in guards and resolvers. Those are navigation errors: use
  `withNavigationErrorHandler()`.
- Errors in the `errorComponent`. Those go to the `@boundary` of the app
  shell.
- The router does not send a caught error to `ErrorHandler`. Use the `onError`
  option of `withErrorBoundaries()` to log it.

## Key files

- [routed-steps.routes.ts](routed-steps.routes.ts): the route config with the
  providers, the guards and the `errorComponent` of each step.
- [routed-steps.booking.ts](routed-steps.booking.ts): `BookingForm`, the one
  `form()` and the step rules.
- [routed-steps.guard.ts](routed-steps.guard.ts): the step gate.
- [routed-steps.form.ts](routed-steps.form.ts) and
  [routed-steps.form.html](routed-steps.form.html): the `<form>` element, the
  step navigation and the outlet.
- [steps/time-slot-step.ts](steps/time-slot-step.ts): the step that can fail.
- [steps/step-error.ts](steps/step-error.ts): the fallback with "Try again".
- [steps/step-focus.ts](steps/step-focus.ts): the focus rule for step
  headings.

## How to test

1. Run the demo and go to `/advanced-scenarios/routed-steps`.
2. Select **Next** on the empty Attendee step. The step stays, the errors
   show, and focus moves to the first invalid field.
3. Fill in the step and go to **Time slot**. Choose a time slot and type a
   note. Go **Back**.
4. Select **Fail the time slot list** in the display controls and go to
   **Time slot**. The fallback shows in place of the step. The step
   navigation and the form state panel stay.
5. Clear **Fail the time slot list** and select **Try again**. The step comes
   back with your time slot and your note.
6. Go to **Review** and select **Confirm booking**.

Automated: `pnpm nx test demo -- routed-steps` and
`pnpm nx e2e demo-e2e -- src/forms/05-advanced/routed-steps.spec.ts --project=chromium`.

## Related

- [Single-Model Wizard](../single-model-wizard/README.md): one model with
  steps that are not routes.
- [Server Integration](../server-integration/README.md): a failed `resource()`
  load that the template handles itself, without a boundary.
