import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { NgxHeadlessNotification } from '@ngx-signal-forms/toolkit/headless';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldNotification } from './form-field-notification';

/**
 * Cross-surface spec: assert that `NgxFormFieldNotification` (styled shell)
 * and a custom component built directly over `NgxHeadlessNotification`
 * resolve the same tone, render the same messages, and produce the same
 * container IDs — proving behavioral parity by construction after the
 * `hostDirectives` composition refactor.
 */

/** Minimal custom notification UI built directly on NgxHeadlessNotification. */
@Component({
  selector: 'custom-notification',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: NgxHeadlessNotification,
      inputs: ['errors', 'fieldName', 'tone'],
    },
  ],
  template: `
    @if (headless.showErrorContainer()) {
      <div data-testid="custom-error" [attr.id]="headless.errorContainerId()">
        @for (m of headless.resolvedMessages(); track m.kind) {
          <span>{{ m.message }}</span>
        }
      </div>
    }
    @if (headless.showWarningContainer()) {
      <div
        data-testid="custom-warning"
        [attr.id]="headless.warningContainerId()"
      >
        @for (m of headless.resolvedMessages(); track m.kind) {
          <span>{{ m.message }}</span>
        }
      </div>
    }
  `,
})
class CustomNotificationComponent {
  protected readonly headless = inject(NgxHeadlessNotification);
}

describe('cross-surface: NgxFormFieldNotification vs NgxHeadlessNotification', () => {
  it('both surfaces render the same blocking-error messages', async () => {
    @Component({
      selector: 'test-notification-cross-surface-error',
      imports: [NgxFormFieldNotification, CustomNotificationComponent],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <ngx-form-field-notification
          [errors]="errors"
          fieldName="address"
          title="Errors"
        />
        <custom-notification [errors]="errors" fieldName="address" />
      `,
    })
    class TestComponent {
      readonly errors = signal([
        { kind: 'required', message: 'Street is required' },
      ]);
    }

    await render(TestComponent);

    const alert = screen.queryByRole('alert');
    expect(alert).toBeTruthy();
    expect(alert?.textContent).toContain('Street is required');

    const customError = screen.queryByTestId('custom-error');
    expect(customError).toBeTruthy();
    expect(customError?.textContent).toContain('Street is required');

    // Both surfaces produce the same generated id for the same fieldName
    // (proving ID generation lives in one place).
    expect(alert?.getAttribute('id')).toBe(customError?.getAttribute('id'));
  });

  it('both surfaces route an all-warning list to the status container', async () => {
    @Component({
      selector: 'test-notification-cross-surface-warning',
      imports: [NgxFormFieldNotification, CustomNotificationComponent],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <ngx-form-field-notification [errors]="warnings" fieldName="address" />
        <custom-notification [errors]="warnings" fieldName="address" />
      `,
    })
    class TestComponent {
      readonly warnings = signal([
        { kind: 'warn:optional', message: 'Phone is optional' },
      ]);
    }

    await render(TestComponent);

    const status = screen.queryByRole('status');
    expect(status).toBeTruthy();
    expect(status?.textContent).toContain('Phone is optional');

    const customWarning = screen.queryByTestId('custom-warning');
    expect(customWarning).toBeTruthy();
    expect(customWarning?.textContent).toContain('Phone is optional');

    // No `role="alert"` should be present — content drove tone resolution.
    expect(screen.queryByTestId('custom-error')).toBeFalsy();
  });

  it('explicit tone="warning" is honored by both surfaces when no blocking error is present', async () => {
    @Component({
      selector: 'test-notification-cross-surface-tone',
      imports: [NgxFormFieldNotification, CustomNotificationComponent],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <ngx-form-field-notification
          [errors]="warnings"
          fieldName="address"
          tone="warning"
        />
        <custom-notification
          [errors]="warnings"
          fieldName="address"
          tone="warning"
        />
      `,
    })
    class TestComponent {
      readonly warnings = signal([
        { kind: 'warn:optional', message: 'Phone is optional' },
      ]);
    }

    await render(TestComponent);

    expect(screen.queryByRole('status')).toBeTruthy();
    expect(screen.queryByTestId('custom-warning')).toBeTruthy();
  });

  it('blocking errors override caller tone="warning" on both surfaces', async () => {
    @Component({
      selector: 'test-notification-cross-surface-override',
      imports: [NgxFormFieldNotification, CustomNotificationComponent],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <ngx-form-field-notification
          [errors]="mixed"
          fieldName="address"
          tone="warning"
        />
        <custom-notification
          [errors]="mixed"
          fieldName="address"
          tone="warning"
        />
      `,
    })
    class TestComponent {
      readonly mixed = signal([
        { kind: 'warn:optional', message: 'Phone is optional' },
        { kind: 'required', message: 'Street is required' },
      ]);
    }

    await render(TestComponent);

    // Blocking error wins → role="alert" used on both surfaces
    expect(screen.queryByRole('alert')).toBeTruthy();
    expect(screen.queryByTestId('custom-error')).toBeTruthy();
    expect(screen.queryByTestId('custom-warning')).toBeFalsy();
  });

  it('empty error list keeps both live regions hidden but in DOM (WCAG 4.1.3)', async () => {
    @Component({
      selector: 'test-notification-cross-surface-empty',
      imports: [NgxFormFieldNotification],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <ngx-form-field-notification [errors]="empty" fieldName="address" />
      `,
    })
    class TestComponent {
      readonly empty = signal([]);
    }

    const { container } = await render(TestComponent);

    const alertEl = container.querySelector('[role="alert"]');
    const statusEl = container.querySelector('[role="status"]');
    expect(alertEl).toBeTruthy();
    expect(statusEl).toBeTruthy();
    expect(alertEl?.hasAttribute('hidden')).toBe(true);
    expect(statusEl?.hasAttribute('hidden')).toBe(true);
  });
});
