import { signal } from '@angular/core';
import { render } from '@testing-library/angular';
import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldWrapper } from './form-field-wrapper';

/**
 * Regression coverage for #557.
 *
 * `appearance="plain"` promises a textual field with no container chrome:
 * no border, background, padding, box-shadow or outline (THEMING.md, "Plain
 * layout"). The plain reset in `form-field-wrapper.selection.css` must beat
 * the textual chrome rules in `form-field-wrapper.css`. Before Angular 22.2,
 * a nested reset compiled one class lower than on 22.2 and lost, so a plain
 * field showed the standard border, background and focus ring. The local
 * suite runs one Angular version; the compat matrix runs this spec on the
 * 22.x floor and ceiling.
 */
const mockField = () =>
  signal({
    invalid: signal(false),
    touched: signal(false),
    errors: signal([]),
    valid: signal(true),
    dirty: signal(false),
    value: signal(''),
    required: signal(false),
  });

const renderPlainField = async () => {
  const { container } = await render(
    `<button type="button" id="plain-reset-anchor">Before</button>
    <ngx-form-field-wrapper [formField]="field" appearance="plain">
      <label for="plain-reset-input">Name</label>
      <input id="plain-reset-input" type="text" />
    </ngx-form-field-wrapper>`,
    {
      imports: [NgxFormFieldWrapper],
      componentProperties: { field: mockField() },
    },
  );

  const wrapper = container.querySelector<HTMLElement>(
    'ngx-form-field-wrapper',
  )!;
  // Guard: the textual chrome rules apply only to textual wrappers. Without
  // this class the reset has nothing to beat and the spec proves nothing.
  expect(wrapper).toHaveClass('ngx-signal-form-field-wrapper--textual');

  return {
    anchor: container.querySelector<HTMLButtonElement>('#plain-reset-anchor')!,
    content: container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__content',
    )!,
    input: container.querySelector<HTMLInputElement>('#plain-reset-input')!,
  };
};

const containerChrome = (content: HTMLElement) => {
  const styles = getComputedStyle(content);
  return {
    borderWidth: [
      styles.borderTopWidth,
      styles.borderRightWidth,
      styles.borderBottomWidth,
      styles.borderLeftWidth,
    ],
    backgroundColor: styles.backgroundColor,
    padding: [
      styles.paddingTop,
      styles.paddingRight,
      styles.paddingBottom,
      styles.paddingLeft,
    ],
    boxShadow: styles.boxShadow,
    outlineStyle: styles.outlineStyle,
  };
};

const noChrome = {
  borderWidth: ['0px', '0px', '0px', '0px'],
  backgroundColor: 'rgba(0, 0, 0, 0)',
  padding: ['0px', '0px', '0px', '0px'],
  boxShadow: 'none',
  outlineStyle: 'none',
};

/**
 * The container transitions its background and box-shadow, so a read right
 * after a state change can see a value in between. Poll until it settles.
 */
const expectNoContainerChrome = async (content: HTMLElement) => {
  await expect.poll(() => containerChrome(content)).toEqual(noChrome);
};

describe('NgxFormFieldWrapper — plain appearance container reset (#557)', () => {
  it('has no container chrome at rest', async () => {
    const { content } = await renderPlainField();

    expect(content.matches(':hover, :focus-within')).toBe(false);
    await expectNoContainerChrome(content);
  });

  it('has no container chrome when hovered', async () => {
    const { content, input } = await renderPlainField();

    await userEvent.hover(input);

    // Guard: the textual hover rule only applies when not focused.
    expect(content.matches(':hover:not(:focus-within)')).toBe(true);
    await expectNoContainerChrome(content);
  });

  it('has no container chrome when focused, and keeps the input outline', async () => {
    const { anchor, content, input } = await renderPlainField();

    // A real Tab press makes the browser apply `:focus-visible`, which the
    // container outline rule keys on.
    await userEvent.click(anchor);
    await userEvent.tab();

    expect(document.activeElement).toBe(input);
    expect(input.matches(':focus-visible')).toBe(true);
    await expectNoContainerChrome(content);

    // The plain appearance's own focus indicator stays on the input (#493).
    expect(getComputedStyle(input).outlineStyle).toBe('solid');
  });
});
