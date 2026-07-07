import { signal } from '@angular/core';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldWrapper } from './form-field-wrapper';

/**
 * Regression coverage for the `[attr.hidden]` safety net documented at
 * form-field-wrapper.ts (`isFieldHidden`): the wrapper binds `hidden` on the
 * host whenever the bound field's `hidden()` schema logic reports `true`, as
 * a defensive net so a `hidden()` field stays out of the accessibility tree
 * and off-screen even if the consumer forgets `@if`.
 *
 * That net was silently defeated: `:host { display: flex }` is an
 * author-origin rule, and author-origin styles beat the UA stylesheet's
 * (non-`!important`) `[hidden] { display: none }` regardless of specificity.
 * jsdom does not implement the UA stylesheet cascade, so this can only be
 * caught in a real browser — hence a `.browser.spec.ts` rather than the
 * jsdom suite in `form-field-wrapper.spec.ts` (which already asserts the
 * `hidden` *attribute* is present, but not that it actually hides anything).
 */
describe('NgxFormFieldWrapper — [hidden] safety net (rendered display)', () => {
  it('renders with display:none when the bound field reports hidden() === true', async () => {
    const hiddenField = signal({
      invalid: () => false,
      touched: () => false,
      hidden: () => true,
      errors: () => [],
    });

    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field" fieldName="secret">
        <label for="secret">Secret</label>
        <input id="secret" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: hiddenField },
      },
    );

    const wrapper = container.querySelector<HTMLElement>(
      'ngx-form-field-wrapper',
    );
    expect(wrapper).toHaveAttribute('hidden', '');
    expect(getComputedStyle(wrapper!).display).toBe('none');
  });

  it('keeps display:flex when the bound field reports hidden() === false', async () => {
    const visibleField = signal({
      invalid: () => false,
      touched: () => false,
      hidden: () => false,
      errors: () => [],
    });

    const { container } = await render(
      `<ngx-form-field-wrapper [formField]="field" fieldName="visible">
        <label for="visible">Visible</label>
        <input id="visible" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: visibleField },
      },
    );

    const wrapper = container.querySelector<HTMLElement>(
      'ngx-form-field-wrapper',
    );
    expect(wrapper).not.toHaveAttribute('hidden');
    expect(getComputedStyle(wrapper!).display).not.toBe('none');
  });
});
