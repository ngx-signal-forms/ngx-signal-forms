import { Component, signal } from '@angular/core';
import {
  FormField,
  form,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldError } from '@ngx-signal-forms/toolkit/assistive';
import { NgxFormFieldWrapper } from './form-field-wrapper';

/**
 * Regression coverage for #495.
 *
 * An invalid or warning textual field kept the same border on focus and
 * only added a low-opacity box-shadow ring (25% state color) — 1.53:1 for
 * invalid, 1.40:1 for warning, both under the WCAG 2.2 SC 1.4.11 (Non-text
 * contrast) 3:1 floor. A keyboard user tabbing from the error summary into
 * an invalid field could not see where focus landed (SC 2.4.7).
 *
 * The fix adds a solid, offset outline in the focus color on
 * `:focus-within`, for every textual state (valid, invalid, warning). The
 * state-colored border and the low-contrast ring are unchanged in shape,
 * but the ring's default box-shadow is now `none` so it does not visually
 * collide with the new outline.
 */
const contentOf = (container: Element): HTMLElement => {
  const content = container.querySelector<HTMLElement>(
    '.ngx-signal-form-field-wrapper__content',
  );
  if (!content) {
    throw new Error('Expected the fixture to render a field content wrapper.');
  }
  return content;
};

describe('NgxFormFieldWrapper — state focus outline contrast (#495)', () => {
  const focusColor = 'rgb(120, 0, 80)'; // non-default, so a match proves the token is used

  @Component({
    selector: 'ngx-test-invalid-focus-outline',
    imports: [NgxFormFieldWrapper, NgxFormFieldError, FormField],
    template: `
      <button type="button" id="anchor">Before</button>
      <ngx-form-field-wrapper
        appearance="outline"
        [formField]="field.username"
        fieldName="username"
      >
        <label for="username">Username</label>
        <input id="username" [formField]="field.username" />
      </ngx-form-field-wrapper>
    `,
  })
  class InvalidFocusOutlineComponent {
    protected readonly field = form(
      signal({ username: '' }),
      schema((path) => {
        required(path.username, { message: 'Username is required' });
      }),
    );
  }

  @Component({
    selector: 'ngx-test-warning-focus-outline',
    imports: [NgxFormFieldWrapper, NgxFormFieldError, FormField],
    template: `
      <button type="button" id="anchor">Before</button>
      <ngx-form-field-wrapper
        appearance="outline"
        [formField]="field.username"
        fieldName="username"
      >
        <label for="username">Username</label>
        <input id="username" [formField]="field.username" />
      </ngx-form-field-wrapper>
    `,
  })
  class WarningFocusOutlineComponent {
    protected readonly field = form(
      signal({ username: 'ab' }),
      schema((path) => {
        validate(path.username, (ctx) => {
          const value = ctx.value();
          if (value.length > 0 && value.length < 3) {
            return {
              kind: 'warn:too-short',
              message: 'Consider 3+ characters',
            };
          }
          return null;
        });
      }),
    );
  }

  const tabIntoInput = async (container: HTMLElement) => {
    await userEvent.click(
      container.querySelector<HTMLButtonElement>('#anchor')!,
    );
    await userEvent.tab();
  };

  it('shows the field as invalid, then draws a solid outline on the container when focused', async () => {
    const { container } = await render(InvalidFocusOutlineComponent);

    const wrapper = container.querySelector<HTMLElement>(
      'ngx-form-field-wrapper',
    )!;
    wrapper.style.setProperty('--ngx-form-field-focus-color', focusColor);

    const input = page.getByRole('textbox', { name: 'Username' });
    // Touch and blur without typing, so the required error shows (on-touch).
    await userEvent.click(input.element());
    await userEvent.tab();

    expect(
      wrapper.classList.contains('ngx-signal-form-field-wrapper--invalid'),
    ).toBe(true);

    await tabIntoInput(container);
    expect(document.activeElement).toBe(input.element());

    const styles = getComputedStyle(contentOf(container));
    expect(styles.outlineStyle).not.toBe('none');
    expect(styles.outlineWidth).not.toBe('0px');
    expect(styles.outlineColor).toBe(focusColor);
    // The border keeps signaling the invalid state — the outline is an
    // additional, higher-contrast focus signal, not a replacement for it.
    expect(styles.borderColor).not.toBe(focusColor);
  });

  it('draws the same solid outline on a focused warning field', async () => {
    const { container } = await render(WarningFocusOutlineComponent);

    const wrapper = container.querySelector<HTMLElement>(
      'ngx-form-field-wrapper',
    )!;
    wrapper.style.setProperty('--ngx-form-field-focus-color', focusColor);

    const input = page.getByRole('textbox', { name: 'Username' });
    await userEvent.click(input.element());

    expect(
      wrapper.classList.contains('ngx-signal-form-field-wrapper--warning'),
    ).toBe(true);
    expect(document.activeElement).toBe(input.element());

    const styles = getComputedStyle(contentOf(container));
    expect(styles.outlineStyle).not.toBe('none');
    expect(styles.outlineWidth).not.toBe('0px');
    expect(styles.outlineColor).toBe(focusColor);
  });
});
