import { NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  provideRouter,
  RouterOutlet,
  withComponentInputBinding,
  withErrorBoundaries,
} from '@angular/router';
import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';
import { render, screen, waitFor, within } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PageControlsService } from '../../ui';

/**
 * The routed-steps example keeps one `form()` above the outlet of its step
 * routes. These specs use the real route config of the example, with the
 * router features that `main.ts` turns on.
 */

/** As the app shell: an outlet, and the display controls of the page. */
@Component({
  imports: [NgTemplateOutlet, RouterOutlet],
  template: `
    <router-outlet />
    <ng-container [ngTemplateOutlet]="pageControls.template()" />
  `,
})
class HostComponent {
  protected readonly pageControls = inject(PageControlsService);
}

const STEP_FAILED = 'This step could not be shown';

async function setup(initialRoute: string = DEMO_PATHS.routedSteps) {
  const onError = vi.fn<(error: Error) => void>();
  const view = await render(HostComponent, {
    initialRoute,
    providers: [
      provideRouter(
        [
          {
            path: DEMO_PATHS.routedSteps.slice(1),
            loadChildren: () => import('./routed-steps.routes'),
          },
        ],
        withComponentInputBinding(),
        withErrorBoundaries({ onError }),
      ),
    ],
  });
  await view.fixture.whenStable();

  return { ...view, onError, user: userEvent.setup() };
}

function stepHeading(name: string | RegExp) {
  return screen.findByRole('heading', { level: 2, name });
}

function stepNavigation() {
  return within(screen.getByRole('navigation', { name: 'Booking steps' }));
}

/** The step whose route is active. */
function currentStep() {
  return stepNavigation().getByRole('link', { current: 'step' });
}

/** The display control that makes the time slot list fail to load. */
function failTimeSlotsControl() {
  return screen.getByRole('checkbox', { name: 'Fail the time slot list' });
}

async function fillAttendee(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Full name/u), 'Ada Lovelace');
  await user.type(screen.getByLabelText(/Email/u), 'ada@example.com');
}

describe('Routed steps example', () => {
  it('opens the first step, with the toolkit legend that needs the form context above the outlet', async () => {
    await setup();

    expect(await stepHeading('Step 1 of 3: Attendee')).toBeVisible();
    expect(currentStep()).toHaveTextContent('Attendee');
    expect(screen.getByText('* indicates a required field')).toBeVisible();
  });

  it('keeps the visitor on an invalid step, shows its errors and moves focus to the first invalid field', async () => {
    const { user } = await setup();

    expect(screen.queryByText('Enter your full name')).toBeNull();
    await user.click(screen.getByRole('link', { name: 'Next: Time slot' }));

    expect(await screen.findByText('Enter your full name')).toBeVisible();
    expect(screen.getByText('Enter your email address')).toBeVisible();
    expect(currentStep()).toHaveTextContent('Attendee');
    expect(screen.getByLabelText(/Full name/u)).toHaveFocus();
  });

  it('sends a deep link to a later step back to the first invalid step, without errors', async () => {
    await setup(`${DEMO_PATHS.routedSteps}/review`);

    expect(await stepHeading('Step 1 of 3: Attendee')).toBeVisible();
    expect(currentStep()).toHaveTextContent('Attendee');
    expect(screen.queryByText('Enter your full name')).toBeNull();
  });

  it('gives a step a link only when the earlier steps are valid', async () => {
    const { user } = await setup();

    expect(
      stepNavigation().queryByRole('link', { name: /Time slot/u }),
    ).toBeNull();
    expect(
      stepNavigation().getByText('(complete the earlier steps first)', {
        selector: 'li:nth-child(2) *',
      }),
    ).toBeInTheDocument();

    await fillAttendee(user);

    expect(
      stepNavigation().getByRole('link', { name: /Time slot/u }),
    ).toBeVisible();
    expect(
      stepNavigation().queryByRole('link', { name: /Review/u }),
    ).toBeNull();
  });

  it('shows the fallback in place of a step that fails, and keeps the form, the navigation and the entries', async () => {
    const { user, onError } = await setup();
    await fillAttendee(user);
    await user.click(failTimeSlotsControl());

    await user.click(screen.getByRole('link', { name: 'Next: Time slot' }));

    const fallback = await stepHeading(STEP_FAILED);
    expect(fallback).toBeVisible();
    expect(
      screen.getByText('Reason: The time slot service is unavailable.'),
    ).toBeVisible();
    expect(screen.queryByLabelText(/Time slot/u)).toBeNull();
    await waitFor(() => expect(fallback).toHaveFocus());
    expect(onError).toHaveBeenCalledTimes(1);

    // The frame above the outlet is still there, and so are the entries.
    await user.click(stepNavigation().getByRole('link', { name: /Attendee/u }));
    expect(await stepHeading('Step 1 of 3: Attendee')).toBeVisible();
    expect(screen.getByLabelText(/Full name/u)).toHaveValue('Ada Lovelace');
    expect(screen.getByLabelText(/Email/u)).toHaveValue('ada@example.com');
  });

  it('shows the fallback again when "Try again" fails again', async () => {
    const { user, onError } = await setup();
    await fillAttendee(user);
    await user.click(failTimeSlotsControl());
    await user.click(screen.getByRole('link', { name: 'Next: Time slot' }));
    const firstFallback = await stepHeading(STEP_FAILED);

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledTimes(2);
    });
    const secondFallback = await stepHeading(STEP_FAILED);
    expect(secondFallback).not.toBe(firstFallback);
    await waitFor(() => expect(secondFallback).toHaveFocus());
  });

  it('brings the step back with its earlier entries when "Try again" succeeds', async () => {
    const { user } = await setup();
    await fillAttendee(user);
    await user.click(screen.getByRole('link', { name: 'Next: Time slot' }));
    await user.selectOptions(
      await screen.findByLabelText(/Time slot/u),
      '11:30',
    );
    await user.type(screen.getByLabelText(/Notes/u), 'Vegetarian lunch');
    await user.click(screen.getByRole('link', { name: 'Back' }));
    await stepHeading('Step 1 of 3: Attendee');

    await user.click(failTimeSlotsControl());
    await user.click(screen.getByRole('link', { name: 'Next: Time slot' }));
    await stepHeading(STEP_FAILED);

    await user.click(failTimeSlotsControl());
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    const heading = await stepHeading('Step 2 of 3: Time slot');
    expect(await screen.findByLabelText(/Time slot/u)).toHaveValue('11:30');
    expect(screen.getByLabelText(/Notes/u)).toHaveValue('Vegetarian lunch');
    expect(screen.queryByRole('heading', { name: STEP_FAILED })).toBeNull();
    expect(heading).toHaveFocus();
  });

  it('submits the form above the outlet from the submit button in the review step', async () => {
    const { user } = await setup();
    await fillAttendee(user);
    await user.click(screen.getByRole('link', { name: 'Next: Time slot' }));
    await user.selectOptions(
      await screen.findByLabelText(/Time slot/u),
      '14:00',
    );
    await user.click(screen.getByRole('link', { name: 'Next: Review' }));
    await stepHeading('Step 3 of 3: Review');

    await user.click(screen.getByRole('button', { name: 'Confirm booking' }));

    const confirmation = await screen.findByText(/Your seat is booked/u);
    expect(confirmation).toHaveTextContent('ada@example.com');
    await waitFor(() => expect(confirmation).toHaveFocus());
    expect(
      screen.queryByRole('button', { name: 'Confirm booking' }),
    ).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Book another seat' }));

    expect(await stepHeading('Step 1 of 3: Attendee')).toBeVisible();
    expect(screen.getByLabelText(/Full name/u)).toHaveValue('');
    expect(screen.queryByText('Enter your full name')).toBeNull();
  });

  it('does not confirm a booking that the visitor changed during the request', async () => {
    const { user } = await setup();
    await fillAttendee(user);
    await user.click(screen.getByRole('link', { name: 'Next: Time slot' }));
    await user.selectOptions(
      await screen.findByLabelText(/Time slot/u),
      '14:00',
    );
    await user.click(screen.getByRole('link', { name: 'Next: Review' }));
    await stepHeading('Step 3 of 3: Review');

    // The request is in progress while the visitor changes the first step.
    await user.click(screen.getByRole('button', { name: 'Confirm booking' }));
    await user.click(stepNavigation().getByRole('link', { name: /Attendee/u }));
    await user.type(await screen.findByLabelText(/Full name/u), ' King');
    await user.click(stepNavigation().getByRole('link', { name: /Review/u }));
    await stepHeading('Step 3 of 3: Review');

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Confirm booking' }),
      ).not.toHaveAttribute('aria-disabled', 'true');
    });
    expect(screen.getByText('Ada Lovelace King')).toBeVisible();
    expect(screen.queryByText(/Your seat is booked/u)).toBeNull();
  });
});
