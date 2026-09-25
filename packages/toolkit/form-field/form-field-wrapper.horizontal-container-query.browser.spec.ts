import { signal } from '@angular/core';
import { render } from '@testing-library/angular';
import { afterEach, describe, expect, it } from 'vitest';
import { NgxFormFieldWrapper } from './form-field-wrapper';

/**
 * Regression coverage for #523: the horizontal layout's fixed-width label
 * column squeezes the control down to ~50px at a 320px viewport and 200%
 * text zoom (WCAG 1.4.10, 1.4.4). A `@container` query on the wrapper's own
 * rendered width — not a viewport media query, since a horizontal wrapper
 * can also sit in a narrow column on a wide screen — switches the layout to
 * stacked (label above control) once that width drops below the fixed
 * `20rem` threshold (see form-field-wrapper.selection.css, "HORIZONTAL
 * LAYOUT", for why that threshold isn't a public, overridable token).
 */
describe('NgxFormFieldWrapper — horizontal layout container query (#523)', () => {
  const mockField = () =>
    signal({
      invalid: () => false,
      touched: () => false,
      errors: () => [],
      valid: () => true,
      dirty: () => false,
      value: () => '',
      required: () => false,
    });

  afterEach(() => {
    document.documentElement.style.fontSize = '';
  });

  it('stacks the label above a control at least as wide as the label, at a 320px container and 200% root font size', async () => {
    document.documentElement.style.fontSize = '32px'; // 200% of the 16px default

    const { container } = await render(
      `<div style="width: 320px;">
        <ngx-form-field-wrapper [formField]="field" orientation="horizontal">
          <label for="narrow-input">Name</label>
          <input id="narrow-input" type="text" />
        </ngx-form-field-wrapper>
      </div>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const label = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__label',
    )!;
    const input = container.querySelector<HTMLInputElement>('#narrow-input')!;
    const labelRect = label.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();

    // Stacked: the control renders below the label, not beside it.
    expect(inputRect.top).toBeGreaterThanOrEqual(labelRect.bottom);
    // The control is at least as wide as the label (the acceptance bar for
    // #523 — the pre-fix side-by-side layout left the control narrower than
    // the label at this size).
    expect(inputRect.width).toBeGreaterThanOrEqual(labelRect.width);
  });

  it('keeps the label and control side by side in a wide container', async () => {
    const { container } = await render(
      `<div style="width: 600px;">
        <ngx-form-field-wrapper [formField]="field" orientation="horizontal">
          <label for="wide-input">Name</label>
          <input id="wide-input" type="text" />
        </ngx-form-field-wrapper>
      </div>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const label = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__label',
    )!;
    const input = container.querySelector<HTMLInputElement>('#wide-input')!;
    const labelRect = label.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();

    // Side by side: same row, control to the right of the label.
    expect(Math.abs(inputRect.top - labelRect.top)).toBeLessThan(4);
    expect(inputRect.left).toBeGreaterThan(labelRect.right);
  });

  it('does not reserve an empty label row above a labelless control in a narrow container', async () => {
    const { container } = await render(
      `<div style="width: 200px;">
        <ngx-form-field-wrapper [formField]="field" orientation="horizontal">
          <input id="narrow-labelless-input" type="text" />
        </ngx-form-field-wrapper>
      </div>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const wrapper = container.querySelector<HTMLElement>(
      'ngx-form-field-wrapper',
    )!;
    const label = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__label',
    )!;
    const content = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__content',
    )!;

    // The empty label div is hidden, so it never reserves a grid row (or
    // the row-gap above it) once the narrow query stacks every item onto
    // its own row (#523). Measured against `.content` itself (the grid
    // item), not the projected `<input>`, so the assertion isn't muddied by
    // `.content`'s own border/padding chrome above the input.
    expect(getComputedStyle(label).display).toBe('none');
    const wrapperTop = wrapper.getBoundingClientRect().top;
    const contentTop = content.getBoundingClientRect().top;
    expect(contentTop - wrapperTop).toBe(0);
  });

  it('does not overlap a still-visible required marker with the control in a narrow plain labelless field', async () => {
    // Plain appearance never hides the `.label` div for a labelless field
    // (form-field-wrapper.css's labelless rules are scoped to
    // `--textual:not(.ngx-signal-forms-plain)`), so it keeps rendering the
    // required marker even with no projected `<label>`. The narrow-stacking
    // row-shift must not assume every labelless field has a hidden `.label`
    // — doing so put `.content` on row 1 directly under the still-visible
    // marker.
    const { container } = await render(
      `<div style="width: 200px;">
        <ngx-form-field-wrapper [formField]="field" orientation="horizontal" appearance="plain">
          <input id="plain-required-input" type="text" required />
        </ngx-form-field-wrapper>
      </div>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const label = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__label',
    )!;
    const marker = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__required-marker',
    )!;
    const input = container.querySelector<HTMLInputElement>(
      '#plain-required-input',
    )!;

    expect(getComputedStyle(label).display).not.toBe('none');
    expect(marker).toBeTruthy();
    const labelRect = label.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();

    // The marker sits above the control, not on top of it.
    expect(inputRect.top).toBeGreaterThanOrEqual(labelRect.bottom);
  });

  it('keeps a messages-top labelless field free of an empty label row in a narrow container', async () => {
    const invalidTouchedField = () =>
      signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
        valid: () => false,
        dirty: () => true,
        value: () => '',
        required: () => true,
      });

    const { container } = await render(
      `<div style="width: 200px;">
        <ngx-form-field-wrapper [formField]="field" orientation="horizontal" errorPlacement="top">
          <input id="messages-top-labelless-input" type="text" />
        </ngx-form-field-wrapper>
      </div>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: invalidTouchedField() },
      },
    );

    const wrapper = container.querySelector<HTMLElement>(
      'ngx-form-field-wrapper',
    )!;
    const messages = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__messages',
    )!;
    const content = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__content',
    )!;

    // The messages row renders above the control with no empty label row (or
    // its row-gap) in between.
    expect(messages).toBeTruthy();
    const wrapperTop = wrapper.getBoundingClientRect().top;
    const messagesTop = messages.getBoundingClientRect().top;
    const contentTop = content.getBoundingClientRect().top;
    expect(messagesTop - wrapperTop).toBe(0);
    expect(contentTop).toBeGreaterThanOrEqual(
      messages.getBoundingClientRect().bottom,
    );
  });
});
