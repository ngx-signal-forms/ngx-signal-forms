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
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../../testing/a11y-internal';
import { NgxHeadlessErrorState } from './error-state';

/**
 * #586: a `strategy` or `warningStrategy` on `ngxHeadlessErrorState` decides
 * when the headless message shows. Auto-ARIA on the matching control must
 * follow the same timing. Otherwise sighted users see an error that screen
 * reader users do not hear, or `aria-describedby` points to an element that
 * has no content.
 *
 * The form stays on `on-touch` in every fixture, and no field is touched, so
 * only the directive's own strategy can make the message and the ARIA show.
 */
const FEEDBACK_TEMPLATE = (name: string, strategyAttrs: string) => `
  <div
    ngxHeadlessErrorState
    #${name}State="errorState"
    [field]="profileForm.${name}"
    fieldName="${name}"
    ${strategyAttrs}
  >
    <div
      role="alert"
      [attr.id]="${name}State.shouldShowErrors() && ${name}State.hasErrors() ? ${name}State.errorId() : null"
    >
      @if (${name}State.shouldShowErrors()) {
        @for (error of ${name}State.resolvedErrors(); track error.kind) {
          <p>{{ error.message }}</p>
        }
      }
    </div>
    <div
      role="status"
      [attr.id]="${name}State.shouldShowWarnings() && ${name}State.hasWarnings() ? ${name}State.warningId() : null"
    >
      @if (${name}State.shouldShowWarnings()) {
        @for (warning of ${name}State.resolvedWarnings(); track warning.kind) {
          <p>{{ warning.message }}</p>
        }
      }
    </div>
  </div>
`;

/**
 * The email starts empty, so it has a blocking error. An empty nickname has a
 * blocking error only. A nickname of one or two characters has a warning only.
 */
function createProfileForm(nickname: string) {
  return form(
    signal({ email: '', nickname }),
    schema((path) => {
      required(path.email, { message: 'Email is required' });
      required(path.nickname, { message: 'Nickname is required' });
      validate(path.nickname, (ctx) =>
        ctx.value().length > 0 && ctx.value().length < 3
          ? { kind: 'warn:short', message: 'Short nicknames are hard to find' }
          : null,
      );
    }),
  );
}

@Component({
  selector: 'ngx-test-headless-strategy-host',
  imports: [FormField, NgxSignalFormToolkit, NgxHeadlessErrorState],
  template: `
    <form [formRoot]="profileForm" ngxSignalForm errorStrategy="on-touch">
      <label for="email">Email</label>
      <input id="email" [formField]="profileForm.email" />
      ${FEEDBACK_TEMPLATE('email', 'strategy="immediate"')}

      <label for="nickname">Nickname</label>
      <input id="nickname" [formField]="profileForm.nickname" />
      ${FEEDBACK_TEMPLATE('nickname', '')}
    </form>
  `,
})
class ErrorStrategyHost {
  readonly profileForm = createProfileForm('');
}

@Component({
  selector: 'ngx-test-headless-warning-strategy-host',
  imports: [FormField, NgxSignalFormToolkit, NgxHeadlessErrorState],
  template: `
    <form
      [formRoot]="profileForm"
      ngxSignalForm
      errorStrategy="on-touch"
      warningStrategy="on-touch"
    >
      <label for="email">Email</label>
      <input id="email" [formField]="profileForm.email" />
      ${FEEDBACK_TEMPLATE('email', '')}

      <label for="nickname">Nickname</label>
      <input id="nickname" [formField]="profileForm.nickname" />
      ${FEEDBACK_TEMPLATE('nickname', 'warningStrategy="immediate"')}
    </form>
  `,
})
class WarningStrategyHost {
  readonly profileForm = createProfileForm('ab');
}

async function renderStable<T>(component: new () => T) {
  const result = await render(component);
  await TestBed.inject(ApplicationRef).whenStable();
  return result;
}

describe('NgxHeadlessErrorState — local strategy reaches auto-ARIA (#586)', () => {
  it('times aria-invalid and aria-describedby by the directive strategy', async () => {
    const { container } = await renderStable(ErrorStrategyHost);

    const email = container.querySelector<HTMLInputElement>('#email')!;

    expect(screen.getByText('Email is required')).toBeVisible();
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email.getAttribute('aria-describedby')).toContain('email-error');
    expect(container.querySelector('#email-error')).toHaveTextContent(
      'Email is required',
    );

    await expectNoA11yViolations(container);
  });

  it('leaves a second headless field on the form strategy', async () => {
    const { container } = await renderStable(ErrorStrategyHost);

    const nickname = container.querySelector<HTMLInputElement>('#nickname')!;

    // The empty nickname is invalid too. The `immediate` strategy on the
    // email feedback must not leak into the nickname field, which has no
    // local strategy and stays on `on-touch`.
    expect(nickname).toHaveAttribute('aria-required', 'true');
    expect(screen.queryByText('Nickname is required')).toBeNull();
    expect(nickname).toHaveAttribute('aria-invalid', 'false');
    expect(nickname.getAttribute('aria-describedby') ?? '').not.toContain(
      'nickname-error',
    );
  });

  it('times the warning id in aria-describedby by the directive warningStrategy', async () => {
    const { container } = await renderStable(WarningStrategyHost);

    // The nickname starts at 'ab': no blocking error, one warning.
    const nickname = container.querySelector<HTMLInputElement>('#nickname')!;

    expect(screen.getByText('Short nicknames are hard to find')).toBeVisible();
    expect(nickname.getAttribute('aria-describedby')).toContain(
      'nickname-warning',
    );

    // The email field has no local strategy, so it stays on `on-touch`.
    const email = container.querySelector<HTMLInputElement>('#email')!;
    expect(screen.queryByText('Email is required')).toBeNull();
    expect(email).toHaveAttribute('aria-invalid', 'false');

    await expectNoA11yViolations(container);
  });
});
