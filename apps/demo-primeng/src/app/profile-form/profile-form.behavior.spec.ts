import { ApplicationRef, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { provideNgxPrimeForms } from '../form-field';
import { ProfileFormComponent } from './profile-form';

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    value: vi.fn(),
    configurable: true,
    writable: true,
  });

  Object.defineProperty(window, 'matchMedia', {
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
    configurable: true,
    writable: true,
  });
});

async function renderProfileForm() {
  const result = await render(ProfileFormComponent, {
    providers: [
      provideZonelessChangeDetection(),
      provideAnimationsAsync(),
      providePrimeNG({
        theme: {
          preset: Aura,
          options: {
            prefix: 'p',
            darkModeSelector: 'system',
            cssLayer: false,
          },
        },
      }),
      provideNgxSignalFormsConfig({
        defaultErrorStrategy: 'on-touch',
        autoAria: true,
      }),
      ...provideNgxPrimeForms(),
    ],
  });

  // Wait for the zoneless app + PrimeNG's afterEveryRender plumbing to settle
  // before tests start asserting; helper is also returned so callers can
  // re-await stability after user interactions.
  const appRef = TestBed.inject(ApplicationRef);
  await appRef.whenStable();

  return { ...result, whenStable: () => appRef.whenStable() };
}

describe('ProfileFormComponent', () => {
  it('reveals untouched blocking errors when Save profile is clicked', async () => {
    const user = userEvent.setup();

    const { whenStable } = await renderProfileForm();

    expect(screen.queryByText(/email is required/i)).toBeNull();
    expect(screen.queryByText(/role is required/i)).toBeNull();

    await user.click(screen.getByTestId('submit-button'));
    await whenStable();

    expect(await screen.findByText(/email is required/i)).toBeTruthy();
    expect(await screen.findByText(/role is required/i)).toBeTruthy();

    const email = screen.getByLabelText(/email/i);
    expect(email.getAttribute('aria-invalid')).toBe('true');

    // The role control is the PrimeSelectControlComponent compatibility shim.
    // The shim provides NGX_SIGNAL_FORM_ARIA_MODE: 'manual' and binds toolkit
    // ARIA primitives directly onto the inner <p-select>. Verify the inner
    // focusable surface (PrimeNG's own [role="combobox"]) is what receives
    // aria-invalid, not just the outer shim host — that's the contract the
    // shim's whole reason-for-existing has to honour.
    //
    // The combobox's accessible name comes from the visible "Role" <label>
    // via aria-labelledby (not the transient "Pick a role" placeholder/
    // selected-value content) — see the aria-labelledby regression test
    // below for the dedicated assertion.
    const roleCombobox = screen.getByRole('combobox', { name: /^role$/i });
    expect(roleCombobox.getAttribute('aria-invalid')).toBe('true');
  });

  it("wires the visible 'Role' label to the select's inner combobox via aria-labelledby so the accessible name never derives from transient placeholder/selected-value content", async () => {
    await renderProfileForm();

    // Regression test for the audit #147 blocker: PrimeSelectControlComponent
    // put `inputId` on a non-labelable inner <span role="combobox">, so
    // `<label for="profile-role">Role</label>` never established a
    // programmatic label association — the accessible name was derived from
    // the placeholder ("Pick a role") or, once selected, the chosen option's
    // label instead. `getByRole` computing an accessible name of exactly
    // "Role" (not "Pick a role") is the whole point of this assertion.
    const roleCombobox = screen.getByRole('combobox', { name: /^role$/i });

    const labelledBy = roleCombobox.getAttribute('aria-labelledby');
    expect(labelledBy).not.toBeNull();

    const label = document.getElementById(labelledBy ?? '');
    expect(label).not.toBeNull();
    expect(label?.tagName).toBe('LABEL');
    expect(label?.textContent?.trim()).toBe('Role');
  });

  it('shows the personal-email warning and still submits once role is selected', async () => {
    const user = userEvent.setup();

    const { whenStable } = await renderProfileForm();

    const email = screen.getByLabelText(/email/i);
    await user.type(email, 'alex@gmail.com');
    await whenStable();

    expect(
      await screen.findByText(/personal email domains may complicate/i),
    ).toBeTruthy();

    await user.click(screen.getByRole('combobox', { name: /^role$/i }));
    await user.click(await screen.findByText(/^Designer$/));
    await user.click(screen.getByTestId('submit-button'));
    await whenStable();

    const submission = await screen.findByTestId('submission-summary');
    expect(submission.textContent).toContain('"email": "alex@gmail.com"');
    expect(submission.textContent).toContain('"role": "designer"');
  });

  it('wires aria-describedby/aria-invalid/aria-required onto the real native checkbox input, not the <p-checkbox> host', async () => {
    const user = userEvent.setup();

    const { whenStable } = await renderProfileForm();

    // Regression test for the audit #147 blocker: NgxSignalFormAutoAria's
    // selector catch-all wrote aria-describedby/aria-invalid/aria-required
    // onto the <p-checkbox> host element, but PrimeNG's compiled Checkbox
    // template renders a separate native <input type="checkbox"> as a child
    // with no host-to-input ARIA passthrough — the hint text was visible but
    // never linked to the real focusable checkbox input.
    const newsletterCheckbox = screen.getByRole('checkbox', {
      name: /subscribe to the release notes/i,
    });
    expect(newsletterCheckbox.tagName).toBe('INPUT');

    // Touch + blur so on-touch strategy lights up (newsletter has no
    // validators so aria-invalid should stay unset, but aria-describedby
    // must always carry the hint id regardless of validity).
    await user.click(newsletterCheckbox);
    await user.tab();
    await whenStable();

    const describedBy = newsletterCheckbox.getAttribute('aria-describedby');
    expect(describedBy).not.toBeNull();
    expect(describedBy?.split(/\s+/)).toContain('profile-newsletter-hint');
  });
});
