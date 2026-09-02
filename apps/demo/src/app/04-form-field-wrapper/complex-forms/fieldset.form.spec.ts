import { provideZonelessChangeDetection } from '@angular/core';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { FieldsetFormComponent } from './fieldset.form';

/**
 * Regression coverage: the "Billing address is the same as shipping"
 * checkbox used to be a raw `<input type="checkbox">` with no id, no
 * `<label for>`, and no `ngx-form-field-wrapper`/`ngxSignalFormControl`
 * wiring -- unlike every other checkbox in the demo (e.g.
 * `preferences.notifications` in `complex-forms.form.html`). It must now
 * follow that same sibling pattern.
 */
describe('FieldsetFormComponent — billing-same-as-shipping checkbox', () => {
  async function setup() {
    const rendered = await render(FieldsetFormComponent, {
      providers: [
        provideZonelessChangeDetection(),
        provideNgxSignalFormsConfig({
          defaultErrorStrategy: 'on-touch',
          autoAria: true,
        }),
      ],
    });
    return rendered;
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
