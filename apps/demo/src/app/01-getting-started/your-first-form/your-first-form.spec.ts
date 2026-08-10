import { provideZonelessChangeDetection } from '@angular/core';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { YourFirstFormComponent } from './your-first-form.form';

/**
 * Runnable example for `docs/TESTING.md`.
 *
 * This is what a *consumer* writes to unit-test a component built with
 * `form()` plus the toolkit's wrapper-free `NgxFormFieldError`. It imports
 * only from the published entry points (`@ngx-signal-forms/toolkit`,
 * `@testing-library/angular`) and drives the DOM through native events —
 * typing, tabbing, clicking — never by writing to the form's signals
 * directly, because that is what exercises the touched/dirty/submitted
 * path a real user triggers.
 *
 * See `docs/TESTING.md` for the walkthrough this spec backs.
 */
describe('YourFirstFormComponent (unit-testing guide example)', () => {
  async function setup() {
    return render(YourFirstFormComponent, {
      providers: [
        provideZonelessChangeDetection(),
        // Matches apps/demo/src/main.ts: 'on-touch' errors become visible
        // once a field is blurred, not on every keystroke.
        provideNgxSignalFormsConfig({
          defaultErrorStrategy: 'on-touch',
          autoAria: true,
        }),
      ],
    });
  }

  it('shows no error before the field is touched', async () => {
    await setup();

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;

    // Blocking-error live region stays mounted (WCAG 4.1.3) but empty, so
    // assert on the visible text rather than the container's presence.
    expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
    expect(nameInput.getAttribute('aria-invalid')).not.toBe('true');
  });

  it('reveals the rendered error and wires aria-invalid/aria-describedby after a native blur', async () => {
    const user = userEvent.setup();
    await setup();

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;

    // Drive the control the way a real user does: focus in, tab out. This
    // is what flips the field's `touched` signal — writing `model.set(...)`
    // directly would change the value but never touch `touched`, so the
    // 'on-touch' strategy would never reveal the error.
    await user.click(nameInput);
    await user.tab();

    // Flushes zoneless change detection + effects so the assertions below
    // see settled state rather than racing the write.
    const errorText = await screen.findByText(/name is required/i);
    expect(errorText).toBeInTheDocument();

    // Stable id/attribute contract documented in docs/FAQ.md §"How do I
    // unit-test a form component…": error containers use
    // `{fieldName}-error`, the control carries aria-invalid="true" and an
    // aria-describedby that chains to that id.
    await waitFor(() => {
      expect(nameInput.getAttribute('aria-invalid')).toBe('true');
    });
    expect(nameInput.getAttribute('aria-describedby')).toBe(
      'contact-name-error',
    );

    // The message renders inside the toolkit's role="alert" live region.
    const errorContainer = document.querySelector('#contact-name-error');
    expect(errorContainer).not.toBeNull();
    expect(errorContainer).toHaveAttribute('role', 'alert');
    expect(errorContainer).toContainElement(errorText);
  });

  it('clears the error and aria-invalid once the field becomes valid', async () => {
    const user = userEvent.setup();
    await setup();

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;

    await user.click(nameInput);
    await user.tab();
    await screen.findByText(/name is required/i);

    await user.type(nameInput, 'Ada Lovelace');

    await waitFor(() => {
      expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(nameInput.getAttribute('aria-invalid')).not.toBe('true');
    });
  });

  it('marks every field touched and shows all errors on submit', async () => {
    const user = userEvent.setup();
    await setup();

    // Submitting an untouched, empty form must reveal every field's error
    // at once, matching the toolkit's `createOnInvalidHandler()` wiring.
    const submitButton = screen.getByRole('button', { name: /send message/i });
    await user.click(submitButton);

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/message is required/i)).toBeInTheDocument();
  });

  it('starts the declarative submission action once every field is valid', async () => {
    const user = userEvent.setup();
    await setup();

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const messageInput = screen.getByLabelText(/message/i) as HTMLInputElement;

    await user.type(nameInput, 'Ada Lovelace');
    await user.type(emailInput, 'ada@example.com');
    await user.type(messageInput, 'Hello from a unit test!');

    const submitButton = screen.getByRole('button', { name: /send message/i });
    await user.click(submitButton);

    // A valid submit must not surface any field error…
    expect(screen.queryByText(/is required/i)).not.toBeInTheDocument();

    // …and the form's submission.action (an async fn with a real delay) must
    // have actually started — the button's pending label is the observable
    // proof, without this spec waiting out the delay itself.
    expect(
      await screen.findByRole('button', { name: /sending/i }),
    ).toBeInTheDocument();
  });
});
