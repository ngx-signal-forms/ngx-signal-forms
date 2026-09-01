import { signal } from '@angular/core';
import { NgxSignalFormControlSemanticsDirective } from '@ngx-signal-forms/toolkit';
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

  it('applies form-field input tokens to input-like custom hosts', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field" appearance="outline">
        <label for="productName">Product name</label>
        <input id="productName" type="text" placeholder="Acme" />
      </ngx-form-field-wrapper>
      <ngx-form-field-wrapper [formField]="field" appearance="outline">
        <label for="frameworkSelect">Framework</label>
        <button
          id="frameworkSelect"
          type="button"
          ngxSignalFormControl="input-like"
        >
          Select a framework
        </button>
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper, NgxSignalFormControlSemanticsDirective],
        componentProperties: { field: mockField() },
      },
    );

    const native = container.querySelector<HTMLElement>('#productName');
    const custom = container.querySelector<HTMLElement>('#frameworkSelect');
    expect(native && custom).toBeTruthy();

    const nativeStyle = getComputedStyle(native!);
    const customStyle = getComputedStyle(custom!);

    expect(customStyle.fontSize).toBe(nativeStyle.fontSize);
    expect(customStyle.lineHeight).toBe(nativeStyle.lineHeight);
    expect(customStyle.fontWeight).toBe(nativeStyle.fontWeight);
    expect(customStyle.fontFamily).toBe(nativeStyle.fontFamily);
    expect(custom.getAttribute('data-ngx-signal-form-control-kind')).toBe(
      'input-like',
    );
  });

  it('does not give explicit composite controls the textual outline shell', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field" appearance="outline">
        <label for="rating">Rating</label>
        <div
          id="rating"
          ngxSignalFormControl="composite"
        >
          ★★★☆☆
        </div>
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper, NgxSignalFormControlSemanticsDirective],
        componentProperties: { field: mockField() },
      },
    );

    const wrapper = container.querySelector<HTMLElement>(
      'ngx-form-field-wrapper',
    );
    const content = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__content',
    );

    expect(wrapper && content).toBeTruthy();
    expect(wrapper!.getAttribute('data-ngx-signal-form-control-kind')).toBe(
      'composite',
    );
    expect(wrapper).not.toHaveClass('ngx-signal-form-field-wrapper--textual');

    const contentStyle = getComputedStyle(content!);
    expect(parseFloat(contentStyle.borderTopWidth)).toBe(0);
  });
});
