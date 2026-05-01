import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AccountPreferencesFormComponent } from './account-preferences-form';

/**
 * Smoke spec for the Spartan reference wrapper.
 *
 * Asserts the four contracts the renderer-token seam promises:
 *
 *   1. invalid field renders the `hlm-error` slot through the configured
 *      renderer (default: `SpartanFormFieldErrorComponent`),
 *   2. `aria-invalid='true'` lands on the bound control (toolkit owns this),
 *   3. `aria-describedby` on the bound control points at the rendered
 *      error element by id,
 *   4. warnings surface through the same slot when the warning validator
 *      fires (the `displayName` field has a `warn:short-display-name` rule).
 *
 * The spec deliberately avoids any DOM probing inside Spartan internals —
 * the seam under test is the toolkit's, not Spartan's.
 */
describe('Spartan reference wrapper — smoke', () => {
  it('renders hlm-error and wires aria-invalid + aria-describedby on blur with empty value', async () => {
    const user = userEvent.setup();

    await render(AccountPreferencesFormComponent);

    const displayName = screen.getByLabelText(/display name/i);
    expect(displayName).toBeInstanceOf(HTMLInputElement);

    // No errors before interaction (default `on-touch` strategy).
    expect(displayName.getAttribute('aria-invalid')).not.toBe('true');

    // Focus + blur with empty value → required validator fires + on-touch shows error.
    await user.click(displayName);
    await user.tab();

    // Toolkit's auto-aria writes aria-invalid=true on the bound control.
    expect(displayName.getAttribute('aria-invalid')).toBe('true');

    // hlm-error slot rendered the configured component, with the field-name-derived id.
    const errorElement = await screen.findByText(/display name is required/i);
    expect(errorElement).toBeTruthy();
    expect(errorElement.id).toBe('display-name-error');

    // aria-describedby on the bound control points at the rendered error id.
    const describedBy = displayName.getAttribute('aria-describedby') ?? '';
    expect(describedBy.split(/\s+/)).toContain('display-name-error');
  });

  it('renders the warning slot through the same renderer when a warn:* validator fires', async () => {
    const user = userEvent.setup();

    await render(AccountPreferencesFormComponent);

    const displayName = screen.getByLabelText(/display name/i);

    // Type a value that satisfies `required` + `minLength(3)` but fires the
    // `warn:short-display-name` rule (length 3-4).
    await user.type(displayName, 'Ada');
    await user.tab();

    // Warning copy reaches the DOM through the same `hlm-error` outlet.
    const warningElement = await screen.findByText(/short names are accepted/i);
    expect(warningElement).toBeTruthy();
    expect(warningElement.id).toBe('display-name-warning');

    // Warnings are non-blocking: aria-invalid stays "false" / unset because
    // there are no blocking errors. The toolkit chains the warning id into
    // aria-describedby instead.
    expect(displayName.getAttribute('aria-invalid')).not.toBe('true');
    const describedBy = displayName.getAttribute('aria-describedby') ?? '';
    expect(describedBy.split(/\s+/)).toContain('display-name-warning');
  });
});
