import { provideZonelessChangeDetection } from '@angular/core';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CustomControlsFormComponent } from './custom-controls.form';

/**
 * Focused coverage for `LegacyDatepickerAdapterComponent` (issue #272), run
 * through the "Date of Birth" field on the custom-controls demo form.
 *
 * jsdom's tab-order computation across the widget's popover buttons is
 * unreliable, so this spec drives touched state with a direct `.blur()`
 * rather than `userEvent.tab()`. The popup's day-picking path — and real
 * focus traversal through the widget — is covered in
 * `apps/demo-e2e/src/forms/04-form-field-wrapper/custom-controls.spec.ts`
 * under a real browser.
 */
describe('LegacyDatepickerAdapterComponent (custom-controls demo)', () => {
  async function setup() {
    return render(CustomControlsFormComponent, {
      providers: [
        provideZonelessChangeDetection(),
        provideNgxSignalFormsConfig({
          defaultErrorStrategy: 'on-touch',
          autoAria: true,
        }),
      ],
    });
  }

  /**
   * Leaves the widget entirely (relatedTarget outside the host), the same
   * "exit" signal `onHostFocusOut` listens for — see the adapter's class doc.
   */
  function leaveWidget(dateInput: HTMLInputElement): void {
    dateInput.blur();
  }

  it('round-trips a valid typed date into the field value', async () => {
    const user = userEvent.setup();
    await setup();

    const dateInput = screen.getByLabelText(
      /date of birth/i,
    ) as HTMLInputElement;

    await user.type(dateInput, '2020-05-17');
    leaveWidget(dateInput);

    // No parse error for a well-formed, real calendar date.
    await waitFor(() => {
      expect(
        screen.queryByText(/is not a (?:date|real calendar date)/i),
      ).not.toBeInTheDocument();
    });
    expect(dateInput).toHaveValue('2020-05-17');
  });

  it('surfaces unparseable typed input as a `parse` error', async () => {
    const user = userEvent.setup();
    await setup();

    const dateInput = screen.getByLabelText(
      /date of birth/i,
    ) as HTMLInputElement;

    await user.type(dateInput, 'not-a-date');
    leaveWidget(dateInput);

    expect(
      await screen.findByText(/is not a date in yyyy-mm-dd format/i),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(dateInput.getAttribute('aria-invalid')).toBe('true');
    });
  });

  it('surfaces an impossible calendar date (e.g. Feb 30) as a `parse` error', async () => {
    const user = userEvent.setup();
    await setup();

    const dateInput = screen.getByLabelText(
      /date of birth/i,
    ) as HTMLInputElement;

    await user.type(dateInput, '2026-02-30');
    leaveWidget(dateInput);

    expect(
      await screen.findByText(/is not a real calendar date/i),
    ).toBeInTheDocument();
  });

  it('clears the parse error once the text becomes a valid date', async () => {
    const user = userEvent.setup();
    await setup();

    const dateInput = screen.getByLabelText(
      /date of birth/i,
    ) as HTMLInputElement;

    await user.type(dateInput, 'garbage');
    leaveWidget(dateInput);
    await screen.findByText(/is not a date in yyyy-mm-dd format/i);

    await user.clear(dateInput);
    await user.type(dateInput, '1999-12-31');
    leaveWidget(dateInput);

    await waitFor(() => {
      expect(
        screen.queryByText(/is not a date in yyyy-mm-dd format/i),
      ).not.toBeInTheDocument();
    });
  });

  it('does not mark the field touched while focus stays inside the widget, but does once focus truly leaves', async () => {
    const user = userEvent.setup();
    await setup();

    const dateInput = screen.getByLabelText(
      /date of birth/i,
    ) as HTMLInputElement;
    const triggerButton = screen.getByRole('button', { name: /choose date/i });
    const productNameInput = screen.getByLabelText(/product name/i);

    // Seed genuinely invalid text first, so a false-positive touch (e.g.
    // from a plain (blur) on the input, which is exactly what this
    // composite `focusout` + relatedTarget hook exists to avoid) would be
    // observable as a rendered `parse` error below. Testing this with an
    // empty, valid field would pass even with a naive (blur) adapter.
    await user.type(dateInput, 'bad-date');

    // Moving focus from the text input to the widget's own trigger button
    // is an internal transition, not an exit.
    dateInput.focus();
    triggerButton.focus();

    // aria-invalid mirrors the field's raw validity unconditionally (same
    // convention as RatingControlComponent elsewhere on this page) — it is
    // not gated by touched, so it is not the discriminating signal here.
    // The rendered error message is what the wrapper's 'on-touch' strategy
    // actually gates, so that is what proves (or disproves) a false-positive
    // touch from the internal input -> trigger hop above.
    expect(
      screen.queryByText(/is not a date in yyyy-mm-dd format/i),
    ).not.toBeInTheDocument();

    // Now actually leave the whole widget — this must fire `touch`.
    productNameInput.focus();

    expect(
      await screen.findByText(/is not a date in yyyy-mm-dd format/i),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(dateInput.getAttribute('aria-invalid')).toBe('true');
    });
  });

  it('clears an empty field back to no value without a parse error', async () => {
    const user = userEvent.setup();
    await setup();

    const dateInput = screen.getByLabelText(
      /date of birth/i,
    ) as HTMLInputElement;

    await user.type(dateInput, '2020-05-17');
    leaveWidget(dateInput);
    await user.click(dateInput);
    await user.clear(dateInput);
    leaveWidget(dateInput);

    await waitFor(() => {
      expect(
        screen.queryByText(/is not a (?:date|real calendar date)/i),
      ).not.toBeInTheDocument();
    });
    expect(dateInput).toHaveValue('');
  });

  it('formats an externally-reset model value back onto the widget', async () => {
    const user = userEvent.setup();
    await setup();

    const dateInput = screen.getByLabelText(
      /date of birth/i,
    ) as HTMLInputElement;

    await user.type(dateInput, '2020-05-17');
    leaveWidget(dateInput);
    expect(dateInput).toHaveValue('2020-05-17');

    // Programmatic reset (mirrors the demo's own Reset button, which calls
    // `reviewForm().reset()`): the widget's displayed text must follow the
    // model back to empty via `transformedValue`'s `format`.
    const resetButton = screen.getByRole('button', { name: /reset/i });
    await user.click(resetButton);

    await waitFor(() => {
      expect(dateInput).toHaveValue('');
    });
  });
});
