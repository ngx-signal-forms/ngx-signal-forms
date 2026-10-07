import { provideZonelessChangeDetection } from '@angular/core';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProfileApiService } from './server-integration.api';
import { ServerIntegrationComponent } from './server-integration.form';

/**
 * A failed profile load must not leave the visitor with an empty, editable
 * form. The form is replaced by an announced error and a Retry button, and
 * Retry brings back a prefilled, pristine form.
 */
describe('ServerIntegrationComponent — profile load failure', () => {
  const loadProfile = vi.fn();

  async function setup() {
    return render(ServerIntegrationComponent, {
      providers: [
        provideZonelessChangeDetection(),
        provideNgxSignalFormsConfig({
          defaultErrorStrategy: 'on-touch',
        }),
        {
          provide: ProfileApiService,
          useValue: { loadProfile, saveProfile: vi.fn() },
        },
      ],
    });
  }

  afterEach(() => {
    loadProfile.mockReset();
  });

  it('shows an announced error and Retry, not an empty form, when the load fails', async () => {
    let rejectLoad!: (reason: Error) => void;
    loadProfile.mockReturnValue(
      new Promise((_, reject) => {
        rejectLoad = reject;
      }),
    );
    await setup();

    // WCAG 4.1.3: the live region must already exist and be empty before the
    // failure. A host created together with its message can miss the first
    // screen-reader announcement.
    const alert = screen.getByRole('alert');
    expect(alert).toBeEmptyDOMElement();

    rejectLoad(new Error('boom'));

    await vi.waitFor(() =>
      expect(alert).toHaveTextContent('Could not load profile'),
    );
    expect(screen.getByRole('alert')).toBe(alert);
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('does not steal focus when the first load fails', async () => {
    loadProfile.mockRejectedValue(new Error('boom'));
    await setup();

    const retry = await screen.findByRole('button', { name: 'Retry' });
    expect(retry).not.toHaveFocus();
  });

  it('Retry reloads the profile and prefills a pristine form', async () => {
    const user = userEvent.setup();
    loadProfile.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce({
      name: 'Grace Hopper',
      email: 'grace@example.com',
    });
    await setup();

    await user.click(await screen.findByRole('button', { name: 'Retry' }));

    const name = await screen.findByRole('textbox', { name: 'Name' });
    expect(name).toHaveValue('Grace Hopper');
    // Retry was destroyed while focused; focus must land on the restored form.
    await vi.waitFor(() => expect(name).toHaveFocus());
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue(
      'grace@example.com',
    );
    expect(
      screen.queryByRole('button', { name: 'Retry' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('dirty(): false')).toBeInTheDocument();
    expect(screen.getByText('touched(): false')).toBeInTheDocument();
    expect(loadProfile).toHaveBeenCalledTimes(2);
  });
});
