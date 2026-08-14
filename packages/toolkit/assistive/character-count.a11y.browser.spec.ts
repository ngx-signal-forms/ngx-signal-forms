import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, maxLength } from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldCharacterCount } from './character-count';
import { expectNoA11yViolations } from '@ngx-signal-forms/toolkit/testing';

/**
 * WCAG 2.2 AA conformance gate for `NgxFormFieldCharacterCount`.
 *
 * Rendered next to the textarea it counts (its real shipped composition —
 * see the class doc's "Basic character count" example), with live
 * announcements enabled so the polite `aria-live` region is present in both
 * scanned states. The two states produce meaningfully different accessible
 * output: within the limit no announcement text is rendered, past it the
 * live region carries the "exceeded" message and the visible count changes
 * from a lighter to a bold, high-contrast color.
 */
describe('NgxFormFieldCharacterCount — WCAG 2.2 AA conformance', () => {
  it('a count within its limit has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-char-count-ok',
      imports: [FormField, NgxFormFieldCharacterCount],
      template: `
        <label for="bio">Bio</label>
        <textarea id="bio" [formField]="testForm.bio"></textarea>
        <ngx-form-field-character-count
          [formField]="testForm.bio"
          [liveAnnounce]="true"
        />
      `,
    })
    class TestComponent {
      readonly #model = signal({ bio: 'Hello there' });
      readonly testForm = form(this.#model, (path) => {
        maxLength(path.bio, 500);
      });
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(container.textContent).toContain('11/500');
    await expectNoA11yViolations(container);
  });

  it('a count past its limit has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-char-count-exceeded',
      imports: [FormField, NgxFormFieldCharacterCount],
      template: `
        <label for="tweet">Tweet</label>
        <textarea id="tweet" [formField]="testForm.tweet"></textarea>
        <ngx-form-field-character-count
          [formField]="testForm.tweet"
          [maxLength]="10"
          [liveAnnounce]="true"
        />
      `,
    })
    class TestComponent {
      readonly #model = signal({ tweet: '' });
      readonly testForm = form(this.#model);
    }

    const { container } = await render(TestComponent);
    const textarea = container.querySelector('textarea')!;
    await userEvent.click(textarea);
    await userEvent.type(textarea, 'Way past the ten character limit');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(container.textContent).toContain('/10');
    await expectNoA11yViolations(container);
  });
});

/**
 * Parses a `getComputedStyle(...).color` string into 0-255 RGB channels
 * (+ alpha 0-1). Browsers serialize `color-mix(in srgb, …)` output through
 * the `color(srgb r g b[ / a])` function notation (0-1 floats) rather than
 * `rgb()`/`rgba()` (0-255 ints) — this normalizes either so assertions don't
 * depend on which notation a given engine/version happens to emit.
 */
function parseComputedColor(color: string): {
  r: number;
  g: number;
  b: number;
  a: number;
} {
  // Accepts both the legacy comma-separated form (`rgb(1, 2, 3)`,
  // `rgba(1, 2, 3, 0.5)`) and the modern space-separated form
  // (`rgb(1 2 3)`, `rgb(1 2 3 / 0.5)`) — serialization differs across
  // engines and versions.
  const rgbMatch = color.match(
    /^rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*(?:[,/]\s*([\d.]+)\s*)?\)$/u,
  );
  if (rgbMatch) {
    return {
      r: Number(rgbMatch[1]),
      g: Number(rgbMatch[2]),
      b: Number(rgbMatch[3]),
      a: rgbMatch[4] === undefined ? 1 : Number(rgbMatch[4]),
    };
  }

  const srgbMatch = color.match(
    /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)$/u,
  );
  if (srgbMatch) {
    return {
      r: Number(srgbMatch[1]) * 255,
      g: Number(srgbMatch[2]) * 255,
      b: Number(srgbMatch[3]) * 255,
      a: srgbMatch[4] === undefined ? 1 : Number(srgbMatch[4]),
    };
  }

  throw new Error(`Unrecognized computed color format: "${color}"`);
}

/**
 * Asserts a computed `color` string matches an expected RGB(A) color within
 * a tolerance — survives serialization differences (`rgb()` vs
 * `color(srgb …)`, float rounding) instead of pinning one exact string.
 */
function expectColorClose(
  actualColor: string,
  expected: { r: number; g: number; b: number; a?: number },
  tolerance = 2,
): void {
  const actual = parseComputedColor(actualColor);
  // `a` defaults to 1 (fully opaque) — every design token under test here is
  // either explicitly opaque or explicitly `rgba(…, 0.75)`, so the default
  // always matches an intentional expectation; this also keeps every branch
  // below unconditional, which a bare `if (expected.a !== undefined)` guard
  // around a lone `expect()` call would not be (flagged by
  // vitest/no-conditional-expect).
  const expectedAlpha = expected.a ?? 1;
  expect(Math.abs(actual.r - expected.r)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(actual.g - expected.g)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(actual.b - expected.b)).toBeLessThanOrEqual(tolerance);
  expect(Math.abs(actual.a - expectedAlpha)).toBeLessThanOrEqual(0.02);
}

// Design tokens under test — see character-count.ts `styles` defaults.
const OK_COLOR = { r: 50, g: 65, b: 85, a: 0.75 }; // rgba(50, 65, 85, 0.75)
const WARNING_COLOR = { r: 161, g: 98, b: 7 }; // #a16207
const DANGER_COLOR = { r: 219, g: 24, b: 24 }; // #db1818

describe('NgxFormFieldCharacterCount — CSS custom property threshold contract (#355)', () => {
  // `colorThresholds` was removed pre-v1 — thresholds are CSS-only now via
  // `--ngx-form-field-char-count-warning-threshold` /
  // `-danger-threshold`. These assertions read real computed styles (only
  // possible in a real browser — jsdom does not evaluate `color-mix()` /
  // `clamp()`), so they are the only place the actual color-switching
  // contract is verified end to end.

  it('renders the neutral "ok" color below the default 80% warning threshold', async () => {
    // Regression guard for the clamp()/calc() toggle expression getting
    // "stuck at 1" (i.e. always reporting "threshold crossed") — 50% is
    // comfortably under both the 80% warning and 95% danger thresholds, so
    // both toggles must resolve to 0 and the color must stay the neutral
    // "ok" token, not warning or danger.
    @Component({
      selector: 'ngx-test-css-threshold-ok',
      imports: [FormField, NgxFormFieldCharacterCount],
      template: `
        <textarea aria-label="bio" [formField]="testForm.bio"></textarea>
        <ngx-form-field-character-count [formField]="testForm.bio" />
      `,
    })
    class TestComponent {
      readonly #model = signal({ bio: 'a'.repeat(50) });
      readonly testForm = form(this.#model, (path) => {
        maxLength(path.bio, 100);
      });
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const host = container.querySelector(
      'ngx-form-field-character-count',
    ) as HTMLElement;

    expectColorClose(getComputedStyle(host).color, OK_COLOR);
    expect(host).toHaveAttribute('data-limit-state', 'ok');
  });

  it('renders the default warning color at the default 80% threshold', async () => {
    @Component({
      selector: 'ngx-test-css-threshold-default',
      imports: [FormField, NgxFormFieldCharacterCount],
      template: `
        <textarea aria-label="bio" [formField]="testForm.bio"></textarea>
        <ngx-form-field-character-count [formField]="testForm.bio" />
      `,
    })
    class TestComponent {
      readonly #model = signal({ bio: 'a'.repeat(80) });
      readonly testForm = form(this.#model, (path) => {
        maxLength(path.bio, 100);
      });
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const host = container.querySelector(
      'ngx-form-field-character-count',
    ) as HTMLElement;

    expectColorClose(getComputedStyle(host).color, WARNING_COLOR);
    expect(host).toHaveAttribute('data-limit-state', 'warning');
  });

  it('renders the danger color at/above the 95% danger threshold — danger wins over warning', async () => {
    // At exactly 95%, both the warning toggle (>= 80%) and the danger toggle
    // (>= 95%) are "crossed" — the outer color-mix() must resolve fully to
    // the danger color, not a blend, proving danger takes priority over an
    // also-true warning condition.
    @Component({
      selector: 'ngx-test-css-threshold-danger',
      imports: [FormField, NgxFormFieldCharacterCount],
      template: `
        <textarea aria-label="bio" [formField]="testForm.bio"></textarea>
        <ngx-form-field-character-count [formField]="testForm.bio" />
      `,
    })
    class TestComponent {
      readonly #model = signal({ bio: 'a'.repeat(95) });
      readonly testForm = form(this.#model, (path) => {
        maxLength(path.bio, 100);
      });
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const host = container.querySelector(
      'ngx-form-field-character-count',
    ) as HTMLElement;

    expectColorClose(getComputedStyle(host).color, DANGER_COLOR);
    expect(host).toHaveAttribute('data-limit-state', 'danger');
  });

  it('shifts the warning color to fire earlier when the threshold custom property is overridden', async () => {
    @Component({
      selector: 'ngx-test-css-threshold-override',
      imports: [FormField, NgxFormFieldCharacterCount],
      styles: `
        ngx-form-field-character-count {
          --ngx-form-field-char-count-warning-threshold: 30;
        }
      `,
      template: `
        <textarea aria-label="bio" [formField]="testForm.bio"></textarea>
        <ngx-form-field-character-count [formField]="testForm.bio" />
      `,
    })
    class TestComponent {
      // 40% used — below the toolkit default 80% warning threshold (would
      // render the neutral "ok" color by default), but above the
      // CSS-overridden 30% threshold used by this component's own styles.
      readonly #model = signal({ bio: 'a'.repeat(40) });
      readonly testForm = form(this.#model, (path) => {
        maxLength(path.bio, 100);
      });
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const host = container.querySelector(
      'ngx-form-field-character-count',
    ) as HTMLElement;

    // The `data-limit-state` attribute stays 'ok' (fixed 80%/95% defaults —
    // see character-count.spec.ts), but the rendered *color* follows the
    // CSS-only threshold override, proving the two are decoupled.
    expectColorClose(getComputedStyle(host).color, WARNING_COLOR);
    expect(host).toHaveAttribute('data-limit-state', 'ok');
  });
});
