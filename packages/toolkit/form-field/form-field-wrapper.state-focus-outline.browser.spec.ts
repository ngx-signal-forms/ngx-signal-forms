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

/**
 * WCAG relative luminance and contrast ratio (the same formula the toolkit's
 * own design comments use to justify its color defaults). Takes a computed
 * `rgb(r, g, b)` string, as `getComputedStyle` returns it.
 */
const relativeLuminance = (rgb: string): number => {
  const match = /rgb\((\d+), (\d+), (\d+)\)/u.exec(rgb);
  if (!match) {
    throw new Error(`Expected a computed "rgb(r, g, b)" color, got "${rgb}".`);
  }
  const [r, g, b] = [match[1], match[2], match[3]].map((channel) => {
    const fraction = Number(channel) / 255;
    return fraction <= 0.03928
      ? fraction / 12.92
      : ((fraction + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};

const contrastRatio = (foreground: string, background: string): number => {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
};

/**
 * The default border color has an alpha channel
 * (`--ngx-form-field-color-border: rgba(50, 65, 85, 0.7)`), so
 * `getComputedStyle` reports the un-blended `rgba(...)` value, not the pixel
 * color a viewer actually sees. Blend it over the surface it paints on top
 * of (border-color paints over the element's own background, since
 * `background-clip` defaults to `border-box`) to get the rendered color
 * before measuring contrast.
 */
const blendOverSurface = (rgbaOrRgb: string, surfaceRgb: string): string => {
  const fg = /rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/u.exec(rgbaOrRgb);
  const bg = /rgba?\((\d+), (\d+), (\d+)/u.exec(surfaceRgb);
  if (!fg || !bg) {
    throw new Error(
      `Expected computed "rgb(a)(...)" colors, got "${rgbaOrRgb}" over "${surfaceRgb}".`,
    );
  }
  const alpha = fg[4] === undefined ? 1 : Number(fg[4]);
  const [fr, fg2, fb] = [fg[1], fg[2], fg[3]].map(Number);
  const [br, bgG, bb] = [bg[1], bg[2], bg[3]].map(Number);
  const blend = (f: number, b: number) =>
    Math.round(alpha * f + (1 - alpha) * b);
  return `rgb(${blend(fr!, br!)}, ${blend(fg2!, bgG!)}, ${blend(fb!, bb!)})`;
};

describe('NgxFormFieldWrapper — state focus outline contrast (#495)', () => {
  const focusColor = 'rgb(120, 0, 80)'; // non-default, so a match proves the token is used

  @Component({
    selector: 'ngx-test-invalid-focus-outline',
    imports: [NgxFormFieldWrapper, NgxFormFieldError, FormField],
    template: `
      <div id="page" style="background-color: #ffffff; padding: 1rem;">
        <button type="button" id="anchor">Before</button>
        <ngx-form-field-wrapper
          appearance="outline"
          [formField]="field.username"
          fieldName="username"
        >
          <label for="username">Username</label>
          <input id="username" [formField]="field.username" />
          <ngx-form-field-error
            [formField]="field.username"
            fieldName="username"
          />
        </ngx-form-field-wrapper>
      </div>
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
        <ngx-form-field-error
          [formField]="field.username"
          fieldName="username"
        />
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

  it('meets 3:1 outline contrast against the page background with the default focus color', async () => {
    const { container } = await render(InvalidFocusOutlineComponent);
    // No `--ngx-form-field-focus-color` override here — this exercises the
    // shipped default (`#007bc7`), not a test-only stand-in.

    const input = page.getByRole('textbox', { name: 'Username' });
    await userEvent.click(input.element());
    await userEvent.tab();

    await tabIntoInput(container);
    expect(document.activeElement).toBe(input.element());

    const contentStyles = getComputedStyle(contentOf(container));
    // A missing outline (`outlineStyle: 'none'`) still reports a computed
    // `outlineColor` — asserting the contrast ratio alone would pass even if
    // the outline never rendered. Assert presence first.
    expect(contentStyles.outlineStyle).not.toBe('none');

    const pageBackground = getComputedStyle(
      container.querySelector<HTMLElement>('#page')!,
    ).backgroundColor;

    expect(
      contrastRatio(contentStyles.outlineColor, pageBackground),
    ).toBeGreaterThanOrEqual(3);
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

/**
 * Regression coverage for #495: the default border, unfocused.
 *
 * `--ngx-form-field-color-border` defaulted to `rgba(50, 65, 85, 0.25)`,
 * which blends to 1.55:1 against the field's white surface — the only
 * visible edge of an otherwise-borderless text input, below the WCAG 2.2
 * SC 1.4.11 (Non-text contrast) 3:1 floor. This covers the enabled,
 * unfocused, valid field only: SC 1.4.11 exempts disabled controls, and the
 * focused/invalid/warning cases are covered above.
 */
describe('NgxFormFieldWrapper — default border contrast (#495)', () => {
  @Component({
    selector: 'ngx-test-default-border-contrast',
    imports: [NgxFormFieldWrapper, FormField],
    template: `
      <div id="page" style="background-color: #ffffff; padding: 1rem;">
        <ngx-form-field-wrapper appearance="outline" [formField]="field.name">
          <label for="name">Name</label>
          <input id="name" [formField]="field.name" />
        </ngx-form-field-wrapper>
      </div>
    `,
  })
  class DefaultBorderContrastComponent {
    protected readonly field = form(signal({ name: '' }));
  }

  it('meets 3:1 border contrast against the field surface and the page, with default tokens', async () => {
    const { container } = await render(DefaultBorderContrastComponent);

    const content = contentOf(container);
    const contentStyles = getComputedStyle(content);
    // A field with no validators and no interaction is enabled, valid, and
    // unfocused — exactly the state the default border must cover.
    expect(
      container
        .querySelector('ngx-form-field-wrapper')!
        .classList.contains('ngx-signal-form-field-wrapper--invalid'),
    ).toBe(false);

    const surface = contentStyles.backgroundColor;
    const pageBackground = getComputedStyle(
      container.querySelector<HTMLElement>('#page')!,
    ).backgroundColor;
    const renderedBorder = blendOverSurface(contentStyles.borderColor, surface);

    expect(contrastRatio(renderedBorder, surface)).toBeGreaterThanOrEqual(3);
    expect(
      contrastRatio(renderedBorder, pageBackground),
    ).toBeGreaterThanOrEqual(3);
  });
});

/**
 * Dark side of the default border (#494). With `color-scheme: dark` on an
 * ancestor, the `light-dark()` border default resolves to
 * `rgba(249, 250, 251, 0.4)` over the dark field surface `#1f2937`. That
 * blends to 3.51:1 against the surface and 4.25:1 against a `#111827` page.
 * No class and no OS signal is involved: the ancestor's `color-scheme` alone
 * selects the dark pair.
 */
describe('NgxFormFieldWrapper — default border contrast in dark mode (#494)', () => {
  @Component({
    selector: 'ngx-test-default-border-contrast-dark',
    imports: [NgxFormFieldWrapper, FormField],
    template: `
      <div
        id="page"
        style="color-scheme: dark; background-color: #111827; padding: 1rem;"
      >
        <ngx-form-field-wrapper appearance="outline" [formField]="field.name">
          <label for="name">Name</label>
          <input id="name" [formField]="field.name" />
        </ngx-form-field-wrapper>
      </div>
    `,
  })
  class DarkDefaultBorderContrastComponent {
    protected readonly field = form(signal({ name: '' }));
  }

  it('meets 3:1 border contrast against the dark field surface and the page, with default tokens', async () => {
    const { container } = await render(DarkDefaultBorderContrastComponent);

    const contentStyles = getComputedStyle(contentOf(container));
    const surface = contentStyles.backgroundColor;
    // The dark surface proves the dark side of the pair is in use; without
    // it the check below would re-measure the light border.
    expect(surface).toBe('rgb(31, 41, 55)');

    const pageBackground = getComputedStyle(
      container.querySelector<HTMLElement>('#page')!,
    ).backgroundColor;
    const renderedBorder = blendOverSurface(contentStyles.borderColor, surface);

    expect(contrastRatio(renderedBorder, surface)).toBeGreaterThanOrEqual(3);
    expect(
      contrastRatio(renderedBorder, pageBackground),
    ).toBeGreaterThanOrEqual(3);
  });
});
