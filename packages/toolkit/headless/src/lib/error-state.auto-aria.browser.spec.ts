import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormField,
  form,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import {
  NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
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
    signal<{ email: string; nickname: string }>({ email: '', nickname }),
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

/**
 * The directive trims `fieldName` the same way every other field-name
 * surface does. Auto-ARIA looks the field up by the control's `id`, which is
 * never padded, so a padded name must register and build ids under the
 * trimmed name. A whitespace-only name is no name.
 */
@Component({
  selector: 'ngx-test-headless-padded-name-host',
  imports: [FormField, NgxSignalFormToolkit, NgxHeadlessErrorState],
  template: `
    <form [formRoot]="profileForm" ngxSignalForm errorStrategy="on-touch">
      <label for="email">Email</label>
      <input id="email" [formField]="profileForm.email" />
      <div
        ngxHeadlessErrorState
        #emailState="errorState"
        [field]="profileForm.email"
        fieldName=" email "
        strategy="immediate"
      >
        <div
          role="alert"
          [attr.id]="
            emailState.shouldShowErrors() && emailState.hasErrors()
              ? emailState.errorId()
              : null
          "
        >
          @if (emailState.shouldShowErrors()) {
            @for (error of emailState.resolvedErrors(); track error.kind) {
              <p>{{ error.message }}</p>
            }
          }
        </div>
      </div>

      <div
        ngxHeadlessErrorState
        [field]="profileForm.nickname"
        fieldName="   "
        strategy="immediate"
      ></div>
    </form>
  `,
})
class PaddedFieldNameHost {
  readonly profileForm = createProfileForm('');
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

  it('registers and builds ids under the trimmed fieldName', async () => {
    const { container, fixture } = await renderStable(PaddedFieldNameHost);

    const email = container.querySelector<HTMLInputElement>('#email')!;

    // Auto-ARIA finds the entry under `email`, so the local `immediate`
    // strategy wins over the form's `on-touch`, and the id it links is the
    // id the template rendered.
    expect(email).toHaveAttribute('aria-invalid', 'true');
    expect(email.getAttribute('aria-describedby')).toContain('email-error');
    expect(container.querySelector('#email-error')).toHaveTextContent(
      'Email is required',
    );

    const registry = fixture.debugElement
      .query((node) => node.name === 'form')
      .injector.get(NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY);

    expect(registry.get('email')).toBeDefined();
    expect(registry.get(' email ')).toBeUndefined();
    // A whitespace-only name must not register a phantom entry.
    expect(registry.get('   ')).toBeUndefined();
    expect(registry.get('')).toBeUndefined();

    await expectNoA11yViolations(container);
  });
});

/**
 * #644: a template that renders only the warning element sets
 * `renders="warnings"`. The accessibility tree must then describe the control
 * with the warning text alone, and still report the control as invalid when a
 * blocking error shows. The error element does not exist, so a link to it
 * would be an empty description.
 */
const WARNING_ONLY_TEMPLATE = `
  <div
    ngxHeadlessErrorState
    #nicknameState="errorState"
    [field]="profileForm.nickname"
    fieldName="nickname"
    strategy="immediate"
    warningStrategy="immediate"
    renders="warnings"
  >
    <div
      role="status"
      [attr.id]="nicknameState.shouldShowWarnings() && nicknameState.hasWarnings() ? nicknameState.warningId() : null"
    >
      @if (nicknameState.shouldShowWarnings()) {
        @for (warning of nicknameState.resolvedWarnings(); track warning.kind) {
          <p>{{ warning.message }}</p>
        }
      }
    </div>
  </div>
`;

@Component({
  selector: 'ngx-test-headless-warning-only-error-host',
  imports: [FormField, NgxSignalFormToolkit, NgxHeadlessErrorState],
  template: `
    <form [formRoot]="profileForm" ngxSignalForm errorStrategy="on-touch">
      <label for="nickname">Nickname</label>
      <input id="nickname" [formField]="profileForm.nickname" />
      ${WARNING_ONLY_TEMPLATE}
    </form>
  `,
})
class WarningOnlyBlockingErrorHost {
  readonly profileForm = createProfileForm('');
}

@Component({
  selector: 'ngx-test-headless-warning-only-warning-host',
  imports: [FormField, NgxSignalFormToolkit, NgxHeadlessErrorState],
  template: `
    <form [formRoot]="profileForm" ngxSignalForm errorStrategy="on-touch">
      <label for="nickname">Nickname</label>
      <input id="nickname" [formField]="profileForm.nickname" />
      ${WARNING_ONLY_TEMPLATE}
    </form>
  `,
})
class WarningOnlyWarningHost {
  readonly profileForm = createProfileForm('ab');
}

describe('NgxHeadlessErrorState — renders="warnings" in the accessibility tree (#644)', () => {
  it('reports the control invalid and describes it with no error text', async () => {
    const { container } = await renderStable(WarningOnlyBlockingErrorHost);

    const nickname = container.querySelector<HTMLInputElement>('#nickname')!;

    // Invalid: assistive tech still learns the field has an error (WCAG 3.3.1).
    expect(nickname).toBeInvalid();
    // No dangling `nickname-error` id, so the description is empty, not broken
    // (WCAG 1.3.1).
    expect(nickname).toHaveAccessibleDescription('');
    await expectNoA11yViolations(container);
  });

  it('describes the control with the warning text', async () => {
    const { container } = await renderStable(WarningOnlyWarningHost);

    const nickname = container.querySelector<HTMLInputElement>('#nickname')!;

    expect(nickname).toHaveAccessibleDescription(
      'Short nicknames are hard to find',
    );
    expect(nickname).toBeValid();
    await expectNoA11yViolations(container);
  });
});
