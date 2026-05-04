import { provideZonelessChangeDetection } from '@angular/core';
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
  return render(ProfileFormComponent, {
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
}

describe('ProfileFormComponent', () => {
  it('reveals untouched blocking errors when Save profile is clicked', async () => {
    const user = userEvent.setup();

    await renderProfileForm();

    expect(screen.queryByText(/email is required/i)).toBeNull();
    expect(screen.queryByText(/role is required/i)).toBeNull();

    await user.click(screen.getByTestId('submit-button'));

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
    const roleCombobox = screen.getByRole('combobox', {
      name: /pick a role/i,
    });
    expect(roleCombobox.getAttribute('aria-invalid')).toBe('true');
  });

  it('shows the personal-email warning and still submits once role is selected', async () => {
    const user = userEvent.setup();

    await renderProfileForm();

    const email = screen.getByLabelText(/email/i);
    await user.type(email, 'alex@gmail.com');

    expect(
      await screen.findByText(/personal email domains may complicate/i),
    ).toBeTruthy();

    await user.click(screen.getByRole('combobox', { name: /pick a role/i }));
    await user.click(await screen.findByText(/^Designer$/));
    await user.click(screen.getByTestId('submit-button'));

    const submission = await screen.findByTestId('submission-summary');
    expect(submission.textContent).toContain('"email": "alex@gmail.com"');
    expect(submission.textContent).toContain('"role": "designer"');
  });
});
