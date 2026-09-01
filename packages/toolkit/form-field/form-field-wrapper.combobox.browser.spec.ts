import { signal } from '@angular/core';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldWrapper } from './form-field-wrapper';

const mockField = () => {
  const fieldState = {
    invalid: signal(false),
    touched: signal(false),
    errors: signal([]),
    valid: signal(true),
    dirty: signal(false),
    value: signal(''),
    required: signal(false),
  };
  return signal(() => fieldState);
};

describe('NgxFormFieldWrapper — combobox field chrome', () => {
  it('keeps the field border on the wrapper content and strips inner combobox chrome', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field" appearance="outline">
        <label for="framework">Framework</label>
        <button id="framework" type="button" role="combobox">Angular</button>
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const content = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__content',
    );
    const trigger = container.querySelector<HTMLElement>('#framework');

    expect(content && trigger).toBeTruthy();

    const contentStyle = getComputedStyle(content!);
    expect(parseFloat(contentStyle.borderTopWidth)).toBeGreaterThan(0);

    const triggerStyle = getComputedStyle(trigger!);
    expect(parseFloat(triggerStyle.borderTopWidth)).toBe(0);
    expect(
      triggerStyle.outlineStyle === 'none' ||
        triggerStyle.outlineWidth === '0px',
    ).toBe(true);
  });
});
