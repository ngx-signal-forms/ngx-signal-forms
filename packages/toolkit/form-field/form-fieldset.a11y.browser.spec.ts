import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, schema, validate } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from './index';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import {
  expectNoA11yViolations,
  findAlertContaining,
} from '@ngx-signal-forms/toolkit/testing';

/**
 * WCAG 2.2 AA conformance gate for `NgxFormFieldset`.
 *
 * Renders the fieldset the way it actually ships — a native `<fieldset>`
 * grouping real wrapped fields via `[ngxFormFieldset]`, aggregating a
 * cross-field error that lives on the group itself (the "passwords must
 * match" example from the component's own doc comment) rather than an empty
 * shell. Scanned in both the valid state and the group-error state, since
 * the notification card only mounts once the fieldset has something to show.
 */
describe('NgxFormFieldset — WCAG 2.2 AA conformance', () => {
  it('a valid group of fields has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-fieldset-valid',
      imports: [FormField, NgxSignalFormToolkit, NgxFormField],
      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="immediate">
          <fieldset ngxFormFieldset [field]="testForm.passwords">
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
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ passwords: { password: '', confirm: '' } });
      readonly testForm = form(
        this.#model,
        schema((path) => {
          validate(path.passwords, (ctx) => {
            const { password, confirm } = ctx.value();
            return password === confirm
              ? null
              : { kind: 'passwordMismatch', message: 'Passwords must match' };
          });
        }),
      );
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(container.querySelector('fieldset')).toBeTruthy();
    await expectNoA11yViolations(container);
  });

  it('a group-level cross-field error has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-fieldset-error',
      imports: [FormField, NgxSignalFormToolkit, NgxFormField],
      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="immediate">
          <fieldset ngxFormFieldset [field]="testForm.passwords">
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
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({
        passwords: { password: 'hunter2', confirm: 'hunter3' },
      });
      readonly testForm = form(
        this.#model,
        schema((path) => {
          validate(path.passwords, (ctx) => {
            const { password, confirm } = ctx.value();
            return password === confirm
              ? null
              : { kind: 'passwordMismatch', message: 'Passwords must match' };
          });
        }),
      );
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    // The fieldset notification is one of several role="alert" regions on the
    // page (each wrapped field also carries its own, empty, error region) —
    // find the one carrying the group-level message.
    const groupAlert = findAlertContaining(container, 'Passwords must match');
    expect(groupAlert).toBeTruthy();
    await expectNoA11yViolations(container);
  });
});
