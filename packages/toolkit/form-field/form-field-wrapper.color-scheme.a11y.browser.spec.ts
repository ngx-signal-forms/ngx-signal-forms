import { expectNoA11yViolations } from '../testing/a11y-internal';
import { commands } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { renderFixture } from './form-field-wrapper.color-scheme.fixture';

declare module 'vitest/browser' {
  interface BrowserCommands {
    emulateColorScheme: (colorScheme: 'light' | 'dark' | null) => Promise<void>;
  }
}

/**
 * Regression coverage for #494.
 *
 * The wrapper and the feedback components used different dark-mode
 * triggers. The wrapper looked for a `.dark` class, the error component
 * looked at the OS setting, and the hint, character count and legend had no
 * dark colors. In a light app on a dark OS, error text was 1.90:1 on white.
 * In a `.dark` app, hint text was 1.29:1.
 *
 * All toolkit colors now come from `light-dark()` pairs. They follow the
 * `color-scheme` that the app declares, and nothing else. These specs cover
 * the three setups that THEMING.md documents, and run axe (which includes
 * the WCAG 1.4.3 contrast rule) over the wrapper, error, warning, hint,
 * character count, marking legend, fieldset (with its invalid surface and
 * grouped error) and error summary in each one.
 */

const LIGHT_ERROR = 'rgb(219, 24, 24)'; // #db1818
const DARK_ERROR = 'rgb(252, 165, 165)'; // #fca5a5

/**
 * Switches the emulated OS scheme, then waits for the components' color
 * transitions to end so axe measures the final colors.
 */
async function switchOsScheme(colorScheme: 'light' | 'dark'): Promise<void> {
  await commands.emulateColorScheme(colorScheme);
  await expect
    .poll(
      () =>
        document
          .getAnimations()
          .filter((animation) => animation.playState === 'running').length,
    )
    .toBe(0);
}

/** Color of the inline "Full name" error (the fieldset's panel has its own). */
const errorColor = (surface: HTMLElement): string => {
  const inlineError = Array.from(
    surface.querySelectorAll<HTMLElement>('.ngx-form-field-error--error'),
  ).find((element) => element.textContent?.includes('Full name is required'));
  if (!inlineError) {
    throw new Error('Expected the inline "Full name" error to render.');
  }
  return getComputedStyle(inlineError).color;
};

describe('toolkit colors follow the inherited color-scheme (#494)', () => {
  afterEach(async () => {
    document.documentElement.style.removeProperty('color-scheme');
    // `null` clears the emulation instead of forcing light.
    await commands.emulateColorScheme(null);
  });

  it('stays light and readable on a white page when the app declares no color-scheme and the OS is dark', async () => {
    await commands.emulateColorScheme('dark');
    // Precondition: nothing on the test page declares a color-scheme, so
    // this is the "light app, dark OS" case.
    expect(getComputedStyle(document.documentElement).colorScheme).toBe(
      'normal',
    );

    const surface = await renderFixture('background-color: #ffffff');

    expect(errorColor(surface)).toBe(LIGHT_ERROR);
    await expectNoA11yViolations(surface);
  });

  it('switches to dark colors under an ancestor with color-scheme: dark, with no class or OS signal', async () => {
    // The OS stays light: the ancestor's color-scheme alone must switch
    // every toolkit color.
    const surface = await renderFixture(
      'color-scheme: dark; background-color: #1f2937; color: #f9fafb',
      { tintInvalidSurface: true },
    );

    expect(errorColor(surface)).toBe(DARK_ERROR);
    await expectNoA11yViolations(surface);
  });

  it('follows the OS in both directions when :root declares color-scheme: light dark', async () => {
    document.documentElement.style.setProperty('color-scheme', 'light dark');
    // `Canvas` / `CanvasText` resolve per the used color-scheme, the way an
    // app that follows the OS paints its page.
    const surface = await renderFixture(
      'background-color: Canvas; color: CanvasText',
    );

    await switchOsScheme('dark');
    expect(errorColor(surface)).toBe(DARK_ERROR);
    await expectNoA11yViolations(surface);

    await switchOsScheme('light');
    expect(errorColor(surface)).toBe(LIGHT_ERROR);
    await expectNoA11yViolations(surface);
  });

  it('keeps the tinted invalid fieldset surface readable on a light page (#535)', async () => {
    const surface = await renderFixture('background-color: #ffffff', {
      tintInvalidSurface: true,
    });

    // The inline "Full name" error sits outside the tint and keeps its color.
    expect(errorColor(surface)).toBe(LIGHT_ERROR);
    await expectNoA11yViolations(surface);
  });

  it('keeps the tinted invalid fieldset surface readable when :root follows a dark OS', async () => {
    document.documentElement.style.setProperty('color-scheme', 'light dark');
    await commands.emulateColorScheme('dark');
    const surface = await renderFixture(
      'background-color: Canvas; color: CanvasText',
      { tintInvalidSurface: true },
    );

    expect(errorColor(surface)).toBe(DARK_ERROR);
    await expectNoA11yViolations(surface);
  });
});
