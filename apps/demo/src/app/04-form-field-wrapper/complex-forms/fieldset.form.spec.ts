import { provideZonelessChangeDetection } from '@angular/core';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { FieldsetFormComponent } from './fieldset.form';

describe('Fieldset preview feedback', () => {
  const cases = [
    {
      mode: 'on-touch' as const,
      initialInvalid: false,
      reveal: async (
        user: ReturnType<typeof userEvent.setup>,
        street: HTMLElement,
      ) => {
        await user.click(street);
        await user.tab();
      },
    },
    {
      mode: 'immediate' as const,
      initialInvalid: true,
      reveal: () => Promise.resolve(),
    },
    {
      mode: 'on-submit' as const,
      initialInvalid: false,
      reveal: (user: ReturnType<typeof userEvent.setup>) =>
        user.click(screen.getByRole('button', { name: 'Validate preview' })),
    },
  ];

  it.each(cases)(
    'keeps grouped feedback and control ARIA consistent in $mode mode',
    async ({ mode, initialInvalid, reveal }) => {
      const user = userEvent.setup();
      const { container } = await render(FieldsetFormComponent, {
        inputs: {
          example: 'feedback',
          includeNestedErrors: true,
          errorDisplayMode: mode,
        },
        providers: [provideZonelessChangeDetection()],
      });
      const street = screen.getByRole('textbox', { name: 'Street' });
      const groupError = () =>
        container.querySelector('#placement-preview-address-error');

      await waitFor(() => {
        expect(groupError() !== null).toBe(initialInvalid);
        expect(street).toHaveAttribute('aria-invalid', String(initialInvalid));
      });
      await reveal(user, street);

      await waitFor(() => {
        expect(groupError()).toHaveTextContent('Street is required');
        expect(street).toHaveAttribute('aria-invalid', 'true');
        expect(
          street.getAttribute('aria-describedby')?.split(/\s+/u),
        ).toContain('placementPreviewStreet-error');
      });

      await user.click(
        screen.getByRole('button', { name: 'Fill valid values' }),
      );
      await waitFor(() => {
        expect(groupError()).toBeNull();
        expect(street).toHaveAttribute('aria-invalid', 'false');
      });

      await user.click(screen.getByRole('button', { name: 'Reset preview' }));
      await waitFor(() => {
        expect(street).toHaveValue('');
        expect(street).toHaveAttribute('aria-invalid', String(initialInvalid));
      });
    },
  );

  it('validates the appearance example without requiring controls from the feedback example', async () => {
    const user = userEvent.setup();
    const { container } = await render(FieldsetFormComponent, {
      inputs: { example: 'appearance' },
      providers: [provideZonelessChangeDetection()],
    });
    await user.click(screen.getByRole('button', { name: 'Fill valid values' }));
    await user.click(screen.getByRole('button', { name: 'Validate preview' }));

    expect(screen.queryByRole('textbox', { name: 'Email address' })).toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
    await waitFor(() => {
      const alerts = Array.from(container.querySelectorAll('[role="alert"]'));
      expect(alerts.every((el) => !el.textContent?.trim())).toBe(true);
    });
  });
});

describe('FieldsetFormComponent — billing-same-as-shipping checkbox', () => {
  function setup() {
    return render(FieldsetFormComponent, {
      providers: [
        provideZonelessChangeDetection(),
        provideNgxSignalFormsConfig({
          defaultErrorStrategy: 'on-touch',
        }),
      ],
    });
  }

  it('is a labelled checkbox reachable by its accessible name', async () => {
    await setup();

    const checkbox = screen.getByRole('checkbox', {
      name: /billing address is the same as shipping/iu,
    }) as HTMLInputElement;

    expect(checkbox).toBeInTheDocument();
    expect(checkbox.type).toBe('checkbox');
    // Checked by the model's default (`billingSameAsShipping: true`).
    expect(checkbox.checked).toBe(true);
  });

  it('has an id and is associated with its <label for>', async () => {
    const { container } = await setup();

    const checkbox = screen.getByRole('checkbox', {
      name: /billing address is the same as shipping/iu,
    }) as HTMLInputElement;

    expect(checkbox.id).toBeTruthy();

    const label = container.querySelector(`label[for="${checkbox.id}"]`);
    expect(label).toBeTruthy();
    expect(label?.textContent).toMatch(
      /billing address is the same as shipping/iu,
    );
  });

  it('carries the toolkit control-directive semantics of a wrapped checkbox', async () => {
    const { container } = await setup();

    const checkbox = screen.getByRole('checkbox', {
      name: /billing address is the same as shipping/iu,
    }) as HTMLInputElement;

    const wrapper = checkbox.closest('ngx-form-field-wrapper');
    expect(wrapper).toBeTruthy();
    expect(wrapper).toHaveAttribute(
      'data-ngx-signal-form-control-kind',
      'checkbox',
    );
    expect(wrapper).toHaveClass('ngx-signal-form-field-wrapper--checkbox');

    // Sanity: this is the same wrapper markup used elsewhere in this demo
    // for `preferences`-style checkboxes, not a bespoke one-off.
    expect(
      container.querySelectorAll('ngx-form-field-wrapper').length,
    ).toBeGreaterThan(1);
  });
});
