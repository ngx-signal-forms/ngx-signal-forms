import { Component, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import { NgxFormFieldWrapper } from './form-field-wrapper';

/**
 * Regression coverage for #567.
 *
 * A textual field draws a box of about 32–44px, but the `<input>` inside it
 * is one line tall. A click on the box padding used to leave focus where it
 * was, so the real target was much smaller than the box the user sees
 * (WCAG 2.5.8). A click anywhere inside the box now focuses the control, and
 * prefix/suffix buttons keep their own click behavior.
 */
type Appearance = 'standard' | 'outline' | 'plain';

const fieldBoxOf = (container: Element): HTMLElement => {
  const box = container.querySelector<HTMLElement>(
    '.ngx-signal-form-field-wrapper__content',
  );
  if (!box) {
    throw new Error('Expected the fixture to render a field box.');
  }
  return box;
};

async function renderField(appearance: Appearance) {
  const onSuffixClick = vi.fn();

  @Component({
    selector: 'ngx-test-field-box-click',
    imports: [FormField, NgxFormFieldWrapper],
    template: `
      <button id="elsewhere" type="button">Elsewhere</button>
      <ngx-form-field-wrapper
        [formField]="testForm.email"
        [appearance]="appearance"
      >
        <label for="email">Email</label>
        <input id="email" type="email" [formField]="testForm.email" />
        <button
          suffix
          id="clear"
          type="button"
          aria-label="Clear"
          (click)="onSuffixClick()"
        >
          ×
        </button>
      </ngx-form-field-wrapper>
    `,
  })
  class TestComponent {
    readonly appearance = appearance;
    readonly onSuffixClick = onSuffixClick;
    readonly #model = signal({ email: '' });
    readonly testForm = form(this.#model);
  }

  const result = await render(TestComponent);
  return { ...result, onSuffixClick };
}

describe('NgxFormFieldWrapper — click on the field box focuses the control (#567)', () => {
  it.each<Appearance>(['standard', 'outline', 'plain'])(
    'focuses the input after a click on the box padding (%s)',
    async (appearance) => {
      const { container } = await renderField(appearance);
      const input = container.querySelector<HTMLInputElement>('#email')!;
      const elsewhere = container.querySelector<HTMLElement>('#elsewhere')!;
      elsewhere.focus();

      const box = fieldBoxOf(container);
      const inputRect = input.getBoundingClientRect();
      const boxRect = box.getBoundingClientRect();

      // Bottom-left corner of the box, one pixel inside the border: below
      // the input's own line box whenever the box has vertical padding.
      const position = { x: 2, y: boxRect.height - 2 };

      await userEvent.click(box, { position });

      expect(document.activeElement).toBe(input);

      // Guard the fixture itself: the click point really sits outside the
      // input, so the test proves the new behavior rather than a click that
      // hit the input directly.
      expect(boxRect.top + position.y).toBeGreaterThan(inputRect.bottom);
    },
  );

  it('keeps a suffix button click on the button', async () => {
    const { container, onSuffixClick } = await renderField('standard');
    const input = container.querySelector<HTMLInputElement>('#email')!;
    const clear = container.querySelector<HTMLButtonElement>('#clear')!;

    await userEvent.click(clear);

    expect(onSuffixClick).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(clear);
    expect(document.activeElement).not.toBe(input);
  });

  it('does not steal focus from a click outside the field box', async () => {
    const { container } = await renderField('standard');
    const elsewhere = container.querySelector<HTMLElement>('#elsewhere')!;

    await userEvent.click(elsewhere);

    expect(document.activeElement).toBe(elsewhere);
  });
});
