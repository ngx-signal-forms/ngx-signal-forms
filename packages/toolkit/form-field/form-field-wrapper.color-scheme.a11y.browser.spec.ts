import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormField,
  form,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import {
  NgxFormFieldCharacterCount,
  NgxFormMarkingLegend,
} from '@ngx-signal-forms/toolkit/assistive';
import { expectNoA11yViolations } from '@ngx-signal-forms/toolkit/testing';
import { render } from '@testing-library/angular';
import { commands, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { NgxFormField } from './index';

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
 * character count and marking legend in each one.
 */

const LIGHT_ERROR = 'rgb(219, 24, 24)'; // #db1818
const DARK_ERROR = 'rgb(252, 165, 165)'; // #fca5a5

@Component({
  selector: 'ngx-test-color-scheme-fixture',
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormField,
    NgxFormFieldCharacterCount,
    NgxFormMarkingLegend,
  ],
  template: `
    <form [formRoot]="testForm" ngxSignalForm errorStrategy="immediate">
      <ngx-form-marking-legend
        [formTree]="testForm"
        showMarkerWhen="required"
      />

      <ngx-form-field-wrapper [formField]="testForm.name" fieldName="name">
        <label for="name">Full name</label>
        <input id="name" type="text" [formField]="testForm.name" />
      </ngx-form-field-wrapper>

      <ngx-form-field-wrapper
        [formField]="testForm.username"
        fieldName="username"
      >
        <label for="username">Username</label>
        <input id="username" type="text" [formField]="testForm.username" />
      </ngx-form-field-wrapper>

      <ngx-form-field-wrapper [formField]="testForm.bio" fieldName="bio">
        <label for="bio">Bio</label>
        <textarea id="bio" [formField]="testForm.bio"></textarea>
        <ngx-form-field-hint id="bio-hint"
          >A sentence or two.</ngx-form-field-hint
        >
        <ngx-form-field-character-count
          [formField]="testForm.bio"
          [maxLength]="100"
        />
      </ngx-form-field-wrapper>

      <ngx-form-field-wrapper [formField]="testForm.motto" fieldName="motto">
        <label for="motto">Motto</label>
        <input id="motto" type="text" [formField]="testForm.motto" />
        <ngx-form-field-character-count
          [formField]="testForm.motto"
          [maxLength]="10"
        />
      </ngx-form-field-wrapper>

      <ngx-form-field-wrapper
        [formField]="testForm.tagline"
        fieldName="tagline"
      >
        <label for="tagline">Tagline</label>
        <input id="tagline" type="text" [formField]="testForm.tagline" />
        <ngx-form-field-character-count
          [formField]="testForm.tagline"
          [maxLength]="10"
        />
      </ngx-form-field-wrapper>
    </form>
  `,
})
class ColorSchemeFixtureComponent {
  readonly testForm = form(
    signal({
      name: '',
      username: 'ab',
      bio: 'Short bio',
      // 9/10 = 90%: crosses the 80% warning threshold.
      motto: 'Carpe die',
      // Past the limit: the "exceeded" color.
      tagline: 'Way past the ten character limit',
    }),
    schema((path) => {
      required(path.name, { message: 'Full name is required' });
      validate(path.username, (ctx) =>
        ctx.value().length < 3
          ? { kind: 'warn:short-username', message: 'Consider 3+ characters' }
          : null,
      );
    }),
  );
}

/**
 * Renders the fixture inside a `#surface` element that carries the page
 * background (and, for an ancestor-scoped scheme, the `color-scheme`).
 * axe reads the background from the element tree, so the surface must paint
 * one for the contrast check to measure the right pair.
 */
async function renderFixture(surfaceStyle: string): Promise<HTMLElement> {
  const { container } = await render(
    `<div id="surface" style="${surfaceStyle}; padding: 1rem;"><ngx-test-color-scheme-fixture /></div>`,
    { imports: [ColorSchemeFixtureComponent] },
  );
  // Warnings show once the field is touched.
  await userEvent.click(
    container.querySelector<HTMLInputElement>('#username')!,
  );
  await userEvent.tab();
  await TestBed.inject(ApplicationRef).whenStable();

  // Every message kind must be on screen, or axe would pass on an empty tree.
  expect(container.textContent).toContain('Full name is required');
  expect(container.textContent).toContain('Consider 3+ characters');
  // The wrapper hides a hint while its field shows an error or warning, so
  // the hint sits on a valid field.
  expect(container.querySelector('#bio-hint')).toBeVisible();
  expect(container.querySelector('.ngx-form-marking-legend')).toBeTruthy();
  expect(container.querySelector('[data-limit-state="exceeded"]')).toBeTruthy();
  expect(container.querySelector('[data-limit-state="warning"]')).toBeTruthy();

  return container.querySelector<HTMLElement>('#surface')!;
}

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

const errorColor = (surface: HTMLElement): string =>
  getComputedStyle(surface.querySelector('.ngx-form-field-error--error')!)
    .color;

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
});
