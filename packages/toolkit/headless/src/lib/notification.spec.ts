import { Component, signal } from '@angular/core';
import type { ValidationError } from '@angular/forms/signals';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxHeadlessNotification } from './notification';

/**
 * Headless-level specs for `NgxHeadlessNotification`. These lock in the
 * tone-resolution rules and container-id behavior independent of the styled
 * `NgxFormFieldNotification` shell, so a regression in the directive is
 * caught even when the shell's spec passes.
 */
describe('NgxHeadlessNotification', () => {
  function setup(initial: {
    errors: readonly ValidationError[];
    fieldName?: string | null;
  }) {
    @Component({
      selector: 'ngx-test-notification',
      imports: [NgxHeadlessNotification],

      template: `
        <div
          ngxHeadlessNotification
          #n="notificationState"
          [errors]="errors"
          [fieldName]="fieldName()"
        >
          <span data-testid="resolved-tone">{{ n.resolvedTone() }}</span>
          <span data-testid="resolved-message">{{
            n.resolvedMessages()[0]?.message
          }}</span>
          @if (n.showErrorContainer()) {
            <div
              data-testid="error-container"
              [attr.id]="n.errorContainerId()"
            ></div>
          }
          @if (n.showWarningContainer()) {
            <div
              data-testid="warning-container"
              [attr.id]="n.warningContainerId()"
            ></div>
          }
        </div>
      `,
    })
    class TestComponent {
      readonly errors = signal(initial.errors);
      readonly fieldName = signal<string | null>(initial.fieldName ?? null);
    }

    return render(TestComponent);
  }

  describe('tone resolution', () => {
    // Tone is fully content-driven — there is no `tone` input to override it
    // (removed pre-1.0; see MIGRATING_BETA_TO_V1.md).
    it('routes blocking errors to the error container', async () => {
      await setup({
        errors: [{ kind: 'required', message: 'Street is required' }],
        fieldName: 'address',
      });

      expect(screen.getByTestId('resolved-tone').textContent).toBe('error');
      expect(screen.queryByTestId('error-container')).toBeTruthy();
      expect(screen.queryByTestId('warning-container')).toBeFalsy();
    });

    it('routes an all-warning list to the warning container by default', async () => {
      await setup({
        errors: [{ kind: 'warn:optional', message: 'Phone is optional' }],
        fieldName: 'address',
      });

      expect(screen.getByTestId('resolved-tone').textContent).toBe('warning');
      expect(screen.queryByTestId('warning-container')).toBeTruthy();
      expect(screen.queryByTestId('error-container')).toBeFalsy();
    });

    it('defaults to "error" tone for an empty messages list', async () => {
      await setup({ errors: [], fieldName: 'address' });

      // Tone resolves to 'error' but neither container renders because
      // hasMessages() is false.
      expect(screen.getByTestId('resolved-tone').textContent).toBe('error');
      expect(screen.queryByTestId('error-container')).toBeFalsy();
      expect(screen.queryByTestId('warning-container')).toBeFalsy();
    });
  });

  describe('resolvedMessages', () => {
    it('strips the internal "warn:" prefix from a message-less warning kind', async () => {
      // Angular's `ValidationError.message` is `undefined` by default. With
      // no validator-supplied message and no registry entry for the kind,
      // the fallback message is derived from the kind itself — the `warn:`
      // marker prefix must never leak into the rendered warning text.
      await setup({
        errors: [{ kind: 'warn:weak_password' }],
        fieldName: 'password',
      });

      const message = screen.getByTestId('resolved-message').textContent;
      expect(message).not.toContain('warn:');
      expect(message).toBe('weak password');
    });
  });

  describe('container ids', () => {
    it('generates deterministic ids from fieldName', async () => {
      await setup({
        errors: [{ kind: 'required', message: 'Street is required' }],
        fieldName: 'address',
      });

      const errorEl = screen.getByTestId('error-container');
      expect(errorEl.getAttribute('id')).toBe('address-error');
    });

    it('omits ids when fieldName is null or whitespace', async () => {
      await setup({
        errors: [{ kind: 'required', message: 'Street is required' }],
        fieldName: null,
      });

      const errorEl = screen.getByTestId('error-container');
      expect(errorEl.getAttribute('id')).toBeNull();
    });

    it('exposes warningContainerId for the warning route', async () => {
      await setup({
        errors: [{ kind: 'warn:optional', message: 'Phone is optional' }],
        fieldName: 'address',
      });

      const warningEl = screen.getByTestId('warning-container');
      expect(warningEl.getAttribute('id')).toBe('address-warning');
    });
  });
});
