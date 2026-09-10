import { signal } from '@angular/core';
import { NgxSignalFormControlSemanticsDirective } from '@ngx-signal-forms/toolkit';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldWrapper } from './form-field-wrapper';

/**
 * Computed-style regression coverage for public label tokens (#476).
 *
 * Issue #474 covered the outline-appearance projected label and the
 * checkbox/switch selection-row label. This suite covers the remaining
 * matrix cells:
 *
 * 1. Plain appearance projected label — standard label tokens apply.
 * 2. Native `<select>` associated label — standard label tokens apply.
 * 3. Radio-group legend — bare `<legend>` is consumer-owned; label tokens
 *    do NOT reach it (ownership boundary).
 * 4. Field-shaped custom control projected label — standard label tokens
 *    apply regardless of control kind.
 *
 * The wrapper's label CSS lives on `.ngx-signal-form-field-wrapper__label`
 * (the label div). In standard and plain modes the projected `<label>`
 * inherits typography from that div. In outline mode the outline label
 * tokens are applied directly to `:is(label, [ngxFormFieldLabel])` inside
 * the div — already covered by #474.
 */

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

describe('NgxFormFieldWrapper — label token coverage (#476)', () => {
  /**
   * Overrides all four asserted standard label tokens on the wrapper host
   * and verifies the projected `<label>` element picks them up via
   * inheritance from the label div.
   */
  const assertStandardLabelTokens = (
    label: HTMLElement,
    wrapper: HTMLElement,
  ) => {
    wrapper.style.setProperty('--ngx-form-field-label-size', '1.25rem');
    wrapper.style.setProperty('--ngx-form-field-label-weight', '700');
    wrapper.style.setProperty('--ngx-form-field-label-color', 'rgb(255, 0, 0)');
    wrapper.style.setProperty('--ngx-form-field-label-line-height', '2rem');

    const style = getComputedStyle(label);
    // 1.25rem at the default 16px root = 20px
    expect(style.fontSize).toBe('20px');
    expect(style.fontWeight).toBe('700');
    expect(style.color).toBe('rgb(255, 0, 0)');
    // 2rem at the default 16px root = 32px
    expect(style.lineHeight).toBe('32px');
  };

  it('plain appearance: standard label tokens reach the projected <label>', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field" appearance="plain">
        <label for="plain-input">Plain label</label>
        <input id="plain-input" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const wrapper = container.querySelector<HTMLElement>(
      'ngx-form-field-wrapper',
    )!;
    const label = container.querySelector<HTMLLabelElement>(
      'label[for="plain-input"]',
    )!;
    expect(label).toBeTruthy();

    assertStandardLabelTokens(label, wrapper);
  });

  it('native <select>: standard label tokens reach the associated <label>', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field">
        <label for="country">Country</label>
        <select id="country">
          <option value="us">United States</option>
          <option value="nl">Netherlands</option>
        </select>
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const wrapper = container.querySelector<HTMLElement>(
      'ngx-form-field-wrapper',
    )!;
    const label = container.querySelector<HTMLLabelElement>(
      'label[for="country"]',
    )!;
    expect(label).toBeTruthy();

    assertStandardLabelTokens(label, wrapper);
  });

  it('radio-group legend: label tokens do NOT reach a bare <legend> (consumer-owned ownership boundary)', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field">
        <legend>Choose delivery method</legend>
        <label>
          <input type="radio" value="standard" /> Standard
        </label>
        <label>
          <input type="radio" value="express" /> Express
        </label>
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const wrapper = container.querySelector<HTMLElement>(
      'ngx-form-field-wrapper',
    )!;
    const legend = container.querySelector<HTMLLegendElement>('legend')!;
    const labelDiv = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__label',
    )!;

    // A bare <legend> does not match the label slot's
    // `ng-content select="label, [ngxFormFieldLabel]"` selector, so it
    // falls through to the default content slot — not the label div.
    expect(labelDiv.contains(legend)).toBe(false);

    // Record the legend's computed style before overriding the tokens.
    const before = getComputedStyle(legend);
    const fontSizeBefore = before.fontSize;
    const fontWeightBefore = before.fontWeight;
    const colorBefore = before.color;
    const lineHeightBefore = before.lineHeight;

    // Override all standard label tokens on the wrapper host.
    wrapper.style.setProperty('--ngx-form-field-label-size', '1.25rem');
    wrapper.style.setProperty('--ngx-form-field-label-weight', '700');
    wrapper.style.setProperty('--ngx-form-field-label-color', 'rgb(255, 0, 0)');
    wrapper.style.setProperty('--ngx-form-field-label-line-height', '2rem');

    // The legend's computed style should NOT change — it is outside the
    // wrapper's label style encapsulation.
    const after = getComputedStyle(legend);
    expect(after.fontSize).toBe(fontSizeBefore);
    expect(after.fontWeight).toBe(fontWeightBefore);
    expect(after.color).toBe(colorBefore);
    expect(after.lineHeight).toBe(lineHeightBefore);
  });

  it('field-shaped custom control: standard label tokens reach the projected <label>', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field">
        <label for="framework">Framework</label>
        <button id="framework" type="button" ngxSignalFormControl="input-like">
          Select a framework
        </button>
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper, NgxSignalFormControlSemanticsDirective],
        componentProperties: { field: mockField() },
      },
    );

    const wrapper = container.querySelector<HTMLElement>(
      'ngx-form-field-wrapper',
    )!;
    const label = container.querySelector<HTMLLabelElement>(
      'label[for="framework"]',
    )!;
    expect(label).toBeTruthy();

    assertStandardLabelTokens(label, wrapper);
  });
});
