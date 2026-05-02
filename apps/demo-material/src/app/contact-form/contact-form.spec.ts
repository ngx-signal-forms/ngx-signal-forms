import { provideZonelessChangeDetection } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ContactFormComponent } from './contact-form';

/**
 * Smoke spec for the Material reference contact form.
 *
 * Asserts the three things the issue's acceptance criteria call out for
 * this app's smoke spec:
 *
 * - invalid field → `mat-error` content visible
 * - `aria-invalid="true"` on the bound control
 * - `aria-describedby` points at the rendered error element
 *
 * Material owns `aria-describedby` for `<mat-error>`, so this spec is
 * effectively asking: "did the wrapper let Material wire the error
 * correctly while the toolkit drove visibility timing?"
 */
describe('ContactFormComponent (Material reference, smoke)', () => {
  async function setup() {
    const result = await render(ContactFormComponent, {
      providers: [
        provideZonelessChangeDetection(),
        provideAnimationsAsync('noop'),
        provideNgxSignalFormsConfig({
          defaultErrorStrategy: 'on-touch',
          autoAria: true,
        }),
      ],
    });
    return result;
  }

  it('renders mat-error content for an invalid field after blur (on-touch strategy)', async () => {
    const user = userEvent.setup();
    await setup();

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    expect(nameInput).toBeInTheDocument();

    // Tab away from the field to trigger touched-state under the default
    // 'on-touch' strategy (provided in main.ts via provideNgxSignalFormsConfig).
    await user.click(nameInput);
    await user.tab();

    // mat-error should now render the validation message.
    const matError = await screen.findByText(/please enter your name/i);
    expect(matError).toBeInTheDocument();

    // The toolkit's wrapper drives mat-error visibility — the rendered
    // node lives inside an Angular Material <mat-error> custom element.
    const matErrorHost = matError.closest('mat-error');
    expect(matErrorHost).not.toBeNull();
    expect(matErrorHost?.id).toBeTruthy();
  });

  it('writes aria-invalid="true" and aria-describedby to the bound control via Material', async () => {
    const user = userEvent.setup();
    await setup();

    // Use the email field — typing garbage triggers the `email` validator
    // which doesn't get suppressed by Material's "(empty && required) ? null"
    // shortcut for aria-invalid (that branch only protects empty required
    // fields from announcing as invalid before the user has typed anything).
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;

    await user.click(emailInput);
    await user.type(emailInput, 'not-an-email');
    await user.tab();

    // Material's matInput owns aria-invalid for the projected control —
    // Material's per-control directive (`ngxMatTextControl`) bakes
    // `ariaMode="manual"` so the toolkit's auto-aria stands aside. Wait for
    // zoneless CD + effect microtasks to flush before asserting attribute
    // state — `userEvent.tab()` schedules but does not await effects.
    await waitFor(() => {
      expect(emailInput.getAttribute('aria-invalid')).toBe('true');
    });

    // Material populates aria-describedby with the mat-error ID once the
    // slot directive stamps `<mat-error>`. The describedby write happens
    // in Material's own CD cycle after the slot directive's effect runs,
    // so wait for the chain to settle before asserting — synchronous reads
    // race the zoneless effect → query update → Material aggregation.
    let describedBy: string | null = null;
    await waitFor(() => {
      describedBy = emailInput.getAttribute('aria-describedby');
      expect(describedBy).not.toBeNull();
      expect(describedBy?.length ?? 0).toBeGreaterThan(0);
    });

    // Each ID listed in aria-describedby must resolve to an element in the DOM.
    // (No dangling references — that's the whole point of preserving Material's
    // describedby chain rather than overwriting it.)
    const ids = (describedBy ?? '').split(/\s+/).filter(Boolean);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(document.querySelector(`#${id}`)).not.toBeNull();
    }

    // At least one of the referenced IDs must belong to a <mat-error>
    // element — the toolkit's renderer drove the error message into
    // Material's slot and Material registered its own ID with the input.
    const referencedNodes = ids
      .map((id) => document.querySelector(`#${id}`))
      .filter((el): el is HTMLElement => el !== null);
    const hasMatError = referencedNodes.some(
      (el) =>
        el.tagName.toLowerCase() === 'mat-error' ||
        el.closest('mat-error') !== null,
    );
    expect(hasMatError).toBe(true);
  });

  it('renders warning content inside mat-hint without surfacing as an error', async () => {
    const user = userEvent.setup();
    await setup();

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;

    // 3 chars trips minLength==2 (no error) AND warn:short-name.
    await user.click(nameInput);
    await user.type(nameInput, 'Bob');
    await user.tab();

    // Warning copy lives in mat-hint, NOT mat-error.
    const warning = await screen.findByText(
      /short names are easy to mis-type/i,
    );
    const hintHost = warning.closest('mat-hint');
    const errorHost = warning.closest('mat-error');
    expect(hintHost).not.toBeNull();
    expect(errorHost).toBeNull();

    // No `<mat-error>` should be visible on the field — there are no
    // *blocking* errors at this point, only a warning. (Note that Material's
    // matInput will still report aria-invalid="true" because Angular Signal
    // Forms treats warnings as ValidationErrors that flip `invalid()` — see
    // README "Warnings rendering" for the framework limitation.)
    const nameField = nameInput.closest('mat-form-field');
    expect(nameField?.querySelector('mat-error:not([hidden])')).toBeFalsy();
  });
});
