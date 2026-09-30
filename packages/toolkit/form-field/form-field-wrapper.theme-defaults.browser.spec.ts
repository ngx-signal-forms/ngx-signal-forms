import { signal } from '@angular/core';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldWrapper } from './form-field-wrapper';

/**
 * The warning color default was `#f59e0b` (Tailwind amber-500), 2.16:1 on
 * white. The same token drives warning text, so it failed WCAG 2.2 AA
 * (4.5:1). The default is now `#a16207` (amber-700). Consumers who never set
 * `--ngx-form-field-color-warning` get that value.
 */
describe('NgxFormFieldWrapper — theme defaults', () => {
  it('draws a warning field in the AA-compliant amber-700 by default', async () => {
    const warningField = signal({
      invalid: () => true,
      touched: () => true,
      errors: () => [
        { kind: 'warn:weak-value', message: 'Consider a stronger value' },
      ],
    });

    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field" fieldName="value">
        <label for="value">Value</label>
        <input id="value" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: warningField },
      },
    );

    const wrapper = container.querySelector('ngx-form-field-wrapper');
    const content = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__content',
    );
    if (content === null) {
      throw new Error('Expected the wrapper to render its content box.');
    }

    expect(wrapper).toHaveClass('ngx-signal-form-field-wrapper--warning');
    // Poll: the border color transitions for 150ms after the state class
    // lands.
    await expect
      .poll(() => getComputedStyle(content).borderTopColor)
      .toBe('rgb(161, 98, 7)');
  });
});
