import { type Signal, signal } from '@angular/core';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldWrapper } from './form-field-wrapper';

/**
 * Regression coverage for #473: the checkbox and switch rows fed their
 * `column-gap` from the private `--_field-space-sm` / `--_field-space-md`
 * tokens directly, so a consumer could not retune the control-to-label gap
 * without overriding an implementation-private variable. This locks in the
 * public override — `--ngx-form-field-selection-row-gap`, shared default
 * `0.75rem` (12px) for both rows — and confirms it does not reach the
 * `--ngx-form-field-selection-group-gap` consumer (the gap between options
 * in a grouped selection surface), and that the logical row layout keeps
 * the configured gap under `dir="rtl"`.
 */
describe('NgxFormFieldWrapper — selection row gap (#473)', () => {
  type MockField = Signal<{
    invalid: () => boolean;
    touched: () => boolean;
    errors: () => { kind: string; message: string }[];
  }>;

  const validField = (): MockField =>
    signal({
      invalid: () => false,
      touched: () => false,
      errors: () => [],
    });

  /** Renders `controlHtml` inside a wrapper bound to `field` and locates the host row. */
  const renderRow = async (
    field: MockField,
    controlHtml: string,
    dir?: 'rtl',
  ) => {
    const template = dir
      ? `<div dir="${dir}"><ngx-form-field-wrapper [formField]="field">${controlHtml}</ngx-form-field-wrapper></div>`
      : `<ngx-form-field-wrapper [formField]="field">${controlHtml}</ngx-form-field-wrapper>`;

    const { container } = await render(template, {
      imports: [NgxFormFieldWrapper],
      componentProperties: { field },
    });

    return container.querySelector<HTMLElement>('ngx-form-field-wrapper')!;
  };

  const selectionRows = [
    {
      name: 'checkbox',
      html: `<label for="agree-gap">I agree to the terms</label>
        <input id="agree-gap" type="checkbox" />`,
    },
    {
      name: 'switch',
      html: `<label for="notify-gap">Enable notifications</label>
        <input id="notify-gap" type="checkbox" role="switch" />`,
    },
  ];

  describe.each(selectionRows)('$name row', ({ html }) => {
    it('defaults the column gap to 0.75rem (12px)', async () => {
      const wrapper = await renderRow(validField(), html);

      expect(getComputedStyle(wrapper).columnGap).toBe('12px');
    });

    it('resizes when --ngx-form-field-selection-row-gap is overridden on an ancestor', async () => {
      const wrapper = await renderRow(validField(), html);
      const ancestor = wrapper.parentElement!;
      ancestor.style.setProperty(
        '--ngx-form-field-selection-row-gap',
        '0.5rem',
      );

      expect(getComputedStyle(wrapper).columnGap).toBe('8px');
    });

    it('keeps the configured gap under dir="rtl"', async () => {
      const wrapper = await renderRow(validField(), html, 'rtl');

      expect(getComputedStyle(wrapper).columnGap).toBe('12px');

      const ancestor = wrapper.closest('[dir="rtl"]') as HTMLElement;
      ancestor.style.setProperty(
        '--ngx-form-field-selection-row-gap',
        '0.5rem',
      );

      expect(getComputedStyle(wrapper).columnGap).toBe('8px');
    });
  });

  it("leaves a grouped radio wrapper's option spacing (--ngx-form-field-selection-group-gap) unchanged when the row-gap token is overridden", async () => {
    const wrapper = await renderRow(
      validField(),
      `<span>Delivery method</span>
      <div class="delivery-options">
        <label>
          <input id="delivery-standard-gap" type="radio" name="deliveryMethod" value="standard" />
          Standard
        </label>
        <label>
          <input id="delivery-express-gap" type="radio" name="deliveryMethod" value="express" />
          Express
        </label>
      </div>`,
    );
    const main = wrapper.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__main',
    )!;
    // Guard: the fixture must engage selection-group mode, or the
    // assertions below would pass for the wrong reason.
    expect(wrapper).toHaveClass(
      'ngx-signal-form-field-wrapper--selection-group',
    );
    const before = getComputedStyle(main).rowGap;

    wrapper.style.setProperty('--ngx-form-field-selection-row-gap', '0.5rem');

    expect(getComputedStyle(main).rowGap).toBe(before);
    expect(getComputedStyle(main).rowGap).toBe('12px');
  });
});
