// Shared fixture for the dark-mode matrix (`form-field-wrapper.color-scheme.
// a11y.browser.spec.ts`) and any other browser spec that wants the same
// rich render (e.g. the `forced-colors: active` run in `form-field-wrapper.
// a11y.browser.spec.ts`). Kept in its own non-spec module — importing a
// `.spec.ts` file re-registers that file's `describe`/`it`/`afterEach`
// blocks a second time under the importing file's test run, which is not
// what either caller wants.

import { ApplicationRef, Component, input, signal } from '@angular/core';
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
  NgxFormFieldErrorSummary,
  NgxFormMarkingLegend,
} from '@ngx-signal-forms/toolkit/assistive';
import { render } from '@testing-library/angular';
import { userEvent } from 'vitest/browser';
import { expect } from 'vitest';
import { NgxFormField } from './index';

@Component({
  selector: 'ngx-test-color-scheme-fixture',
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormField,
    NgxFormFieldCharacterCount,
    NgxFormFieldErrorSummary,
    NgxFormMarkingLegend,
  ],
  template: `
    <form [formRoot]="testForm" ngxSignalForm errorStrategy="immediate">
      <ngx-form-field-error-summary
        [formTree]="testForm"
        [submittedStatus]="'submitted'"
        [autoFocus]="false"
        summaryLabel="Please fix the following errors:"
      />

      <ngx-form-marking-legend
        [formTree]="testForm"
        showMarkerWhen="required"
      />

      <fieldset
        ngxFormFieldset
        [field]="testForm.passwords"
        [validationSurface]="tintInvalidSurface() ? 'always' : 'never'"
      >
        <legend>Passwords</legend>
        <ngx-form-field-wrapper
          [formField]="testForm.passwords.password"
          fieldName="password"
        >
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            [formField]="testForm.passwords.password"
          />
        </ngx-form-field-wrapper>
        <ngx-form-field-wrapper
          [formField]="testForm.passwords.confirm"
          fieldName="confirm"
        >
          <label for="confirm">Confirm password</label>
          <input
            id="confirm"
            type="password"
            [formField]="testForm.passwords.confirm"
          />
        </ngx-form-field-wrapper>
      </fieldset>

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
export class ColorSchemeFixtureComponent {
  /**
   * Tints the invalid fieldset surface. Off for the light-scheme scans: the
   * light tint (#fbdddd, unchanged by #494) puts wrapper labels at 4.35:1,
   * a known light-mode gap that #494 does not change (#db1818 text on it is
   * 3.97:1). It needs a design decision and is tracked separately.
   */
  readonly tintInvalidSurface = input(false);
  readonly testForm = form(
    signal({
      name: '',
      username: 'ab',
      bio: 'Short bio',
      // 9/10 = 90%: crosses the 80% warning threshold.
      motto: 'Carpe die',
      // Past the limit: the "exceeded" color.
      tagline: 'Way past the ten character limit',
      passwords: { password: 'hunter2', confirm: 'hunter3' },
    }),
    schema((path) => {
      required(path.name, { message: 'Full name is required' });
      validate(path.passwords, (ctx) => {
        const { password, confirm } = ctx.value();
        return password === confirm
          ? null
          : { kind: 'passwordMismatch', message: 'Passwords must match' };
      });
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
export async function renderFixture(
  surfaceStyle: string,
  { tintInvalidSurface = false } = {},
): Promise<HTMLElement> {
  const { container } = await render(
    `<div id="surface" style="${surfaceStyle}; padding: 1rem;"><ngx-test-color-scheme-fixture [tintInvalidSurface]="${tintInvalidSurface}" /></div>`,
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
  // The fieldset shows its group error (and tints its surface when asked),
  // and the summary lists the field errors.
  expect(
    Boolean(
      container.querySelector('.ngx-signal-form-fieldset--surface-invalid'),
    ),
  ).toBe(tintInvalidSurface);
  expect(container.textContent).toContain('Passwords must match');
  expect(
    container.querySelector('.ngx-form-field-error-summary__link'),
  ).toBeVisible();

  return container.querySelector<HTMLElement>('#surface')!;
}
