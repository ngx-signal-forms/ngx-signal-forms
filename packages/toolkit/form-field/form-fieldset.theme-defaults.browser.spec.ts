import { signal } from '@angular/core';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldset } from './form-fieldset';

const invalidFieldset = () =>
  signal({
    invalid: () => true,
    valid: () => false,
    touched: () => true,
    dirty: () => false,
    pending: () => false,
    errors: () => [{ kind: 'required', message: 'Street required' }],
    errorSummary: () => [{ kind: 'required', message: 'Street required' }],
  });

/**
 * An invalid fieldset draws its border in the danger color (`#db1818`,
 * 5.05:1 on white) and shows its grouped errors in a notification card.
 * The card background follows `--ngx-signal-form-error-panel-bg`, the same
 * token that themes a standalone error panel, so one override themes both.
 *
 * The fieldset chrome and the error panel transition their colors, so each
 * assertion polls until the color settles.
 */
describe('NgxFormFieldset — theme defaults', () => {
  const renderFieldset = () =>
    render(
      `<div data-testid="theme-scope">
        <ngx-form-fieldset [field]="fieldset" fieldsetId="address">
          <div>Projected</div>
        </ngx-form-fieldset>
      </div>`,
      {
        imports: [NgxFormFieldset],
        componentProperties: { fieldset: invalidFieldset() },
      },
    );

  const requireElement = (root: ParentNode, selector: string): HTMLElement => {
    const element = root.querySelector<HTMLElement>(selector);
    if (element === null) {
      throw new Error(`Expected the fixture to render "${selector}".`);
    }
    return element;
  };

  it('draws an invalid fieldset border in the danger color by default', async () => {
    const { container } = await renderFieldset();

    const host = requireElement(container, 'ngx-form-fieldset');

    expect(host).toHaveClass('ngx-signal-form-fieldset--invalid');
    await expect
      .poll(() => getComputedStyle(host).borderTopColor)
      .toBe('rgb(219, 24, 24)');
  });

  it('fills the notification card with the soft danger background by default', async () => {
    const { container } = await renderFieldset();

    const card = requireElement(
      container,
      'ngx-form-field-error[data-presentation="panel"] .ngx-form-field-error--error',
    );

    await expect
      .poll(() => getComputedStyle(card).backgroundColor)
      .toBe('rgb(253, 235, 235)');
  });

  it('fills the notification card from --ngx-signal-form-error-panel-bg', async () => {
    const { container } = await renderFieldset();

    requireElement(container, '[data-testid="theme-scope"]').style.setProperty(
      '--ngx-signal-form-error-panel-bg',
      'rgb(1, 2, 3)',
    );
    const card = requireElement(
      container,
      'ngx-form-field-error[data-presentation="panel"] .ngx-form-field-error--error',
    );

    await expect
      .poll(() => getComputedStyle(card).backgroundColor)
      .toBe('rgb(1, 2, 3)');
  });
});
