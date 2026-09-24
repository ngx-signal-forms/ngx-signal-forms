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
});
