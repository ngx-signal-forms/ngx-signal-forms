import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
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
    tone?: 'auto' | 'error' | 'warning';
  }) {
    @Component({
      selector: 'ngx-test-notification',
      imports: [NgxHeadlessNotification],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <div
          ngxHeadlessNotification
          #n="notificationState"
          [errors]="errors"
          [fieldName]="fieldName()"
          [tone]="tone()"
        >
          <span data-testid="resolved-tone">{{ n.resolvedTone() }}</span>
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
      readonly tone = signal<'auto' | 'error' | 'warning'>(
        initial.tone ?? 'auto',
      );
    }

    return render(TestComponent);
  }

  describe('tone resolution', () => {
    it('routes blocking errors to the error container even with tone="warning"', async () => {
      await setup({
        errors: [{ kind: 'required', message: 'Street is required' }],
        fieldName: 'address',
        tone: 'warning',
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

    it('honors explicit tone="warning" when no blocking error is present', async () => {
      await setup({
        errors: [{ kind: 'warn:optional', message: 'Phone is optional' }],
        fieldName: 'address',
        tone: 'warning',
      });

      expect(screen.getByTestId('resolved-tone').textContent).toBe('warning');
    });

    it('defaults to "error" tone for an empty messages list', async () => {
      await setup({ errors: [], fieldName: 'address' });

      // Tone resolves to 'error' but neither container renders because
      // hasMessages() is false.
      expect(screen.getByTestId('resolved-tone').textContent).toBe('error');
      expect(screen.queryByTestId('error-container')).toBeFalsy();
      expect(screen.queryByTestId('warning-container')).toBeFalsy();
    });

    it('defaults to "error" tone for an empty list even with explicit tone="warning"', async () => {
      await setup({ errors: [], fieldName: 'address', tone: 'warning' });

      expect(screen.getByTestId('resolved-tone').textContent).toBe('error');
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
