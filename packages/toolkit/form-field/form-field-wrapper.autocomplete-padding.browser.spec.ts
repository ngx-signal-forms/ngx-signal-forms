import { signal } from '@angular/core';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldWrapper } from './form-field-wrapper';

/**
 * Regression and recipe coverage for #475: a field-shaped autocomplete
 * adapter (naked `role="combobox"` trigger, wrapper-owned outline) must
 * line up pixel-for-pixel with a native input using the same public
 * tokens — with prefix/suffix content, a visible error, `dir="rtl"`, and
 * an open popup anchored to the field shell rather than the padded input
 * area. Every case here uses real rendered geometry
 * (`getBoundingClientRect()` / `getComputedStyle()`), not screenshots, so a
 * regression in the shared prefix/suffix/outline CSS fails a real
 * assertion instead of a visual diff.
 *
 * See docs/CUSTOM_CONTROLS.md and packages/toolkit/form-field/THEMING.md,
 * "Padding ownership recipe for field-shaped autocomplete adapters", for
 * the recipe this locks in.
 */

interface MockFieldOptions {
  readonly invalid?: boolean;
  readonly touched?: boolean;
  readonly errors?: readonly { kind: string; message: string }[];
  readonly value?: string;
}

const mockField = (options: MockFieldOptions = {}) => {
  const fieldState = {
    invalid: signal(options.invalid ?? false),
    touched: signal(options.touched ?? false),
    errors: signal(options.errors ?? []),
    valid: signal(!(options.invalid ?? false)),
    dirty: signal(false),
    value: signal(options.value ?? ''),
    required: signal(false),
  };
  return signal(() => fieldState);
};

const contentOf = (wrapper: Element): HTMLElement => {
  const content = wrapper.querySelector<HTMLElement>(
    '.ngx-signal-form-field-wrapper__content',
  );
  if (!content) {
    throw new Error('Expected the wrapper to render its content shell.');
  }
  return content;
};

describe('NgxFormFieldWrapper — autocomplete padding-ownership recipe (#475)', () => {
  it('aligns text start and the outline box between a native input and a role="combobox" autocomplete (LTR)', async () => {
    const { container } = await render(
      `<div style="inline-size: 320px">
        <ngx-form-field-wrapper [formField]="field" appearance="outline">
          <label for="country">Country</label>
          <input id="country" type="text" value="Netherlands" readonly />
        </ngx-form-field-wrapper>
        <ngx-form-field-wrapper [formField]="field" appearance="outline">
          <label for="countryAuto">Country</label>
          <input
            id="countryAuto"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="false"
            value="Netherlands"
            readonly
          />
        </ngx-form-field-wrapper>
      </div>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField({ value: 'Netherlands' }) },
      },
    );

    const nativeInput = container.querySelector<HTMLElement>('#country')!;
    const autoInput = container.querySelector<HTMLElement>('#countryAuto')!;
    const [nativeWrapper, autoWrapper] = container.querySelectorAll(
      'ngx-form-field-wrapper',
    );

    // Text start x: both controls get padding:0/border:none from the
    // wrapper's textual-content rule, so the rendered caret position is the
    // element's own left edge.
    expect(autoInput.getBoundingClientRect().left).toBeCloseTo(
      nativeInput.getBoundingClientRect().left,
      1,
    );

    // Outline box: the bordered field shell itself must match exactly.
    const nativeContentRect = contentOf(nativeWrapper).getBoundingClientRect();
    const autoContentRect = contentOf(autoWrapper).getBoundingClientRect();
    expect(autoContentRect.left).toBeCloseTo(nativeContentRect.left, 1);
    expect(autoContentRect.width).toBeCloseTo(nativeContentRect.width, 1);
    expect(autoContentRect.height).toBeCloseTo(nativeContentRect.height, 1);
  });

  it('aligns text start and the outline box under dir="rtl"', async () => {
    const { container } = await render(
      `<div dir="rtl" style="inline-size: 320px">
        <ngx-form-field-wrapper [formField]="field" appearance="outline">
          <label for="countryRtl">בלד</label>
          <input id="countryRtl" type="text" value="הולנד" readonly />
        </ngx-form-field-wrapper>
        <ngx-form-field-wrapper [formField]="field" appearance="outline">
          <label for="countryAutoRtl">בלד</label>
          <input
            id="countryAutoRtl"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="false"
            value="הולנד"
            readonly
          />
        </ngx-form-field-wrapper>
      </div>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField({ value: 'הולנד' }) },
      },
    );

    const nativeInput = container.querySelector<HTMLElement>('#countryRtl')!;
    const autoInput = container.querySelector<HTMLElement>('#countryAutoRtl')!;
    const [nativeWrapper, autoWrapper] = container.querySelectorAll(
      'ngx-form-field-wrapper',
    );

    // Under RTL the inline-start edge is the *right* edge of the box.
    expect(autoInput.getBoundingClientRect().right).toBeCloseTo(
      nativeInput.getBoundingClientRect().right,
      1,
    );

    const nativeContentRect = contentOf(nativeWrapper).getBoundingClientRect();
    const autoContentRect = contentOf(autoWrapper).getBoundingClientRect();
    expect(autoContentRect.right).toBeCloseTo(nativeContentRect.right, 1);
    expect(autoContentRect.width).toBeCloseTo(nativeContentRect.width, 1);
  });

  it('keeps text start aligned with a prefix icon and a suffix clear button present', async () => {
    const { container } = await render(
      `<div style="inline-size: 320px">
        <ngx-form-field-wrapper [formField]="field" appearance="outline">
          <label for="countryPrefixed">Country</label>
          <span prefix aria-hidden="true">🌐</span>
          <input id="countryPrefixed" type="text" value="Netherlands" readonly />
          <button suffix type="button" aria-label="Clear">✕</button>
        </ngx-form-field-wrapper>
        <ngx-form-field-wrapper [formField]="field" appearance="outline">
          <label for="countryAutoPrefixed">Country</label>
          <span prefix aria-hidden="true">🌐</span>
          <input
            id="countryAutoPrefixed"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="false"
            value="Netherlands"
            readonly
          />
          <button suffix type="button" aria-label="Clear">✕</button>
        </ngx-form-field-wrapper>
      </div>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField({ value: 'Netherlands' }) },
      },
    );

    const nativeInput =
      container.querySelector<HTMLElement>('#countryPrefixed')!;
    const autoInput = container.querySelector<HTMLElement>(
      '#countryAutoPrefixed',
    )!;

    expect(autoInput.getBoundingClientRect().left).toBeCloseTo(
      nativeInput.getBoundingClientRect().left,
      1,
    );

    const [nativeWrapper, autoWrapper] = container.querySelectorAll(
      'ngx-form-field-wrapper',
    );
    const nativeContentRect = contentOf(nativeWrapper).getBoundingClientRect();
    const autoContentRect = contentOf(autoWrapper).getBoundingClientRect();
    expect(autoContentRect.width).toBeCloseTo(nativeContentRect.width, 1);
    expect(autoContentRect.height).toBeCloseTo(nativeContentRect.height, 1);
  });

  it('keeps text start and the outline box aligned with a visible validation error', async () => {
    const erroredField = mockField({
      value: 'nl',
      invalid: true,
      touched: true,
      errors: [{ kind: 'required', message: 'Choose a country' }],
    });

    const { container } = await render(
      `<div style="inline-size: 320px">
        <ngx-form-field-wrapper [formField]="field" appearance="outline">
          <label for="countryError">Country</label>
          <input id="countryError" type="text" value="nl" readonly />
        </ngx-form-field-wrapper>
        <ngx-form-field-wrapper [formField]="field" appearance="outline">
          <label for="countryAutoError">Country</label>
          <input
            id="countryAutoError"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="false"
            value="nl"
            readonly
          />
        </ngx-form-field-wrapper>
      </div>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: erroredField },
      },
    );

    const nativeInput = container.querySelector<HTMLElement>('#countryError')!;
    const autoInput =
      container.querySelector<HTMLElement>('#countryAutoError')!;
    const [nativeWrapper, autoWrapper] = container.querySelectorAll(
      'ngx-form-field-wrapper',
    );

    expect(autoInput.getBoundingClientRect().left).toBeCloseTo(
      nativeInput.getBoundingClientRect().left,
      1,
    );

    const nativeContentRect = contentOf(nativeWrapper).getBoundingClientRect();
    const autoContentRect = contentOf(autoWrapper).getBoundingClientRect();
    expect(autoContentRect.width).toBeCloseTo(nativeContentRect.width, 1);
    expect(autoContentRect.height).toBeCloseTo(nativeContentRect.height, 1);
  });

  it('aligns the open popup inline-start edge with the field shell, not the padded input (LTR)', async () => {
    const { container } = await render(
      `<div style="inline-size: 320px">
        <ngx-form-field-wrapper appearance="outline" [formField]="field">
          <label for="countryPopup">Country</label>
          <input
            id="countryPopup"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls="countryPopupListbox"
            value="ne"
          />
          <!--
            The wrapper's ".ngx-signal-form-field-wrapper__content" (the
            field shell) is already position: relative, so a popup
            rendered inside the default slot uses it as its containing
            block without any extra positioning host. inset-inline-start
            resolves against the shell's padding edge, one border-width
            inside its border edge (the visible outline), hence the -1px
            offset -- see the padding-ownership recipe in
            docs/CUSTOM_CONTROLS.md and THEMING.md for why that offset is
            the field shell's fixed 1px border, not a padding value.
          -->
          <div
            id="countryPopupListbox"
            role="listbox"
            style="position: absolute; inset-inline-start: -1px; inset-block-start: 100%"
          >
            <div role="option">Netherlands</div>
          </div>
        </ngx-form-field-wrapper>
      </div>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField({ value: 'ne' }) },
      },
    );

    const wrapper = container.querySelector('ngx-form-field-wrapper')!;
    const popup = container.querySelector<HTMLElement>('#countryPopupListbox')!;

    const contentRect = contentOf(wrapper).getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();

    // The field shell is already `position: relative`, so the popup's
    // `-1px` inset (its fixed border width) lands the popup on the shell's
    // outer (border) edge — not inset by the input's own padding.
    expect(popupRect.left).toBeCloseTo(contentRect.left, 1);
  });

  it('aligns the open popup inline-start edge with the field shell under dir="rtl"', async () => {
    const { container } = await render(
      `<div dir="rtl" style="inline-size: 320px">
        <ngx-form-field-wrapper appearance="outline" [formField]="field">
          <label for="countryPopupRtl">בלד</label>
          <input
            id="countryPopupRtl"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls="countryPopupListboxRtl"
            value="ne"
          />
          <div
            id="countryPopupListboxRtl"
            role="listbox"
            style="position: absolute; inset-inline-start: -1px; inset-block-start: 100%"
          >
            <div role="option">הולנד</div>
          </div>
        </ngx-form-field-wrapper>
      </div>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField({ value: 'ne' }) },
      },
    );

    const wrapper = container.querySelector('ngx-form-field-wrapper')!;
    const popup = container.querySelector<HTMLElement>(
      '#countryPopupListboxRtl',
    )!;

    const contentRect = contentOf(wrapper).getBoundingClientRect();
    const popupRect = popup.getBoundingClientRect();

    expect(popupRect.right).toBeCloseTo(contentRect.right, 1);
  });

  it('applies --ngx-form-field-prefix-gap to the gap between prefix children', async () => {
    const { container } = await render(
      `<ngx-form-field-wrapper
        [formField]="field"
        appearance="outline"
        style="--ngx-form-field-prefix-gap: 1.5rem"
      >
        <label for="withMultiPrefix">Country</label>
        <span prefix aria-hidden="true">🌐</span>
        <span prefix aria-hidden="true">📍</span>
        <input id="withMultiPrefix" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const prefix = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__prefix',
    )!;

    expect(getComputedStyle(prefix).gap).toBe('24px');
  });
});
