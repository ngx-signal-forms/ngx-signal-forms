import { signal } from '@angular/core';
import { render } from '@testing-library/angular';
import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldWrapper } from './form-field-wrapper';

/**
 * Regression coverage for #493.
 *
 * A `plain` appearance wrapper relies on the container's `:focus-within`
 * ring for focus styling, but the plain rule in
 * `form-field-wrapper.selection.css` clears that ring
 * (`border-color: transparent; box-shadow: none`). The input's own
 * `:focus-visible` outline is also reset to `none` for every appearance in
 * `form-field-wrapper.css`. Together, a keyboard user tabbing into a plain
 * text field saw no focus indicator at all — a WCAG 2.2 SC 2.4.7 (Focus
 * Visible) failure.
 *
 * The fix restores a `:focus-visible` outline on the input itself, scoped
 * to plain only. `outline` and `standard` keep the input's own outline
 * suppressed and rely on the container's `:focus-within` ring, unchanged.
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

/**
 * Tabs from a preceding button into the field's input. A real Tab key
 * press (not `element.focus()` or a click on the input itself) is what
 * makes the browser apply `:focus-visible`.
 */
const tabIntoInput = async (container: HTMLElement, anchorId: string) => {
  await userEvent.click(
    container.querySelector<HTMLButtonElement>(`#${anchorId}`)!,
  );
  await userEvent.tab();
};

describe('NgxFormFieldWrapper — plain appearance focus indicator (#493)', () => {
  const focusColor = 'rgb(120, 0, 80)'; // non-default, so a match proves the token is used

  it('shows a visible outline on the input when a plain text field is tabbed into', async () => {
    const { container } = await render(
      `<button type="button" id="plain-anchor">Before</button>
      <ngx-form-field-wrapper [formField]="field" appearance="plain">
        <label for="plain-focus-input">Name</label>
        <input id="plain-focus-input" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const wrapper = container.querySelector<HTMLElement>(
      'ngx-form-field-wrapper',
    )!;
    wrapper.style.setProperty('--ngx-form-field-focus-color', focusColor);

    const input =
      container.querySelector<HTMLInputElement>('#plain-focus-input')!;

    await tabIntoInput(container, 'plain-anchor');
    expect(document.activeElement).toBe(input);

    const styles = getComputedStyle(input);
    expect(styles.outlineStyle).not.toBe('none');
    expect(styles.outlineWidth).not.toBe('0px');
    expect(styles.outlineColor).toBe(focusColor);
  });

  it('does not change the standard appearance focus style', async () => {
    const { container } = await render(
      `<button type="button" id="standard-anchor">Before</button>
      <ngx-form-field-wrapper [formField]="field">
        <label for="standard-focus-input">Name</label>
        <input id="standard-focus-input" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const wrapper = container.querySelector<HTMLElement>(
      'ngx-form-field-wrapper',
    )!;
    wrapper.style.setProperty('--ngx-form-field-focus-color', focusColor);

    const input = container.querySelector<HTMLInputElement>(
      '#standard-focus-input',
    )!;

    await tabIntoInput(container, 'standard-anchor');
    expect(document.activeElement).toBe(input);

    // Standard keeps relying on the container's `:focus-within` ring — the
    // input's own outline must stay suppressed.
    const styles = getComputedStyle(input);
    expect(styles.outlineStyle).toBe('none');
  });

  it('does not change the outline appearance focus style', async () => {
    const { container } = await render(
      `<button type="button" id="outline-anchor">Before</button>
      <ngx-form-field-wrapper [formField]="field" appearance="outline">
        <label for="outline-focus-input">Name</label>
        <input id="outline-focus-input" type="text" />
      </ngx-form-field-wrapper>`,
      {
        imports: [NgxFormFieldWrapper],
        componentProperties: { field: mockField() },
      },
    );

    const wrapper = container.querySelector<HTMLElement>(
      'ngx-form-field-wrapper',
    )!;
    wrapper.style.setProperty('--ngx-form-field-focus-color', focusColor);

    const input = container.querySelector<HTMLInputElement>(
      '#outline-focus-input',
    )!;

    await tabIntoInput(container, 'outline-anchor');
    expect(document.activeElement).toBe(input);

    // Outline keeps relying on the container's `:focus-within` ring — the
    // input's own outline must stay suppressed.
    const styles = getComputedStyle(input);
    expect(styles.outlineStyle).toBe('none');
  });
});
