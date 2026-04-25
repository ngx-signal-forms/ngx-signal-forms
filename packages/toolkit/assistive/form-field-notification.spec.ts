import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { signal } from '@angular/core';
import { provideErrorMessages } from '@ngx-signal-forms/toolkit/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldNotification } from './form-field-notification';

// jsdom does not compute custom-property values from emulated component
// stylesheets, so theme-default specs read the CSS source directly. Runtime
// resolution is covered by the *.browser.spec.ts suite and e2e snapshots.
const notificationCssSource = readFileSync(
  resolve(import.meta.dirname, './form-field-notification.css'),
  'utf8',
);

describe('NgxFormFieldNotification', () => {
  it('renders an optional title and bulleted grouped errors', async () => {
    const errors = signal([
      { kind: 'required', message: 'First name is required' },
      { kind: 'email', message: 'Email is required' },
    ]);

    const { container } = await render(
      `<ngx-form-field-notification
        [errors]="errors"
        fieldName="personal-info"
        title="Validation errors"
      />`,
      {
        imports: [NgxFormFieldNotification],
        componentProperties: { errors },
      },
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Validation errors');
    expect(container.querySelector('#personal-info-error')).toBeTruthy();
    expect(
      container.querySelectorAll('.ngx-form-field-notification__list li'),
    ).toHaveLength(2);
  });

  it('renders warnings as a polite stacked notification', async () => {
    const warnings = signal([
      { kind: 'warn:optional', message: 'Phone number is optional' },
    ]);

    const { container } = await render(
      `<ngx-form-field-notification
        [errors]="warnings"
        fieldName="contact-method"
        listStyle="plain"
      />`,
      {
        imports: [NgxFormFieldNotification],
        componentProperties: { warnings },
      },
    );

    const warning = screen.getByRole('status');

    expect(warning).toHaveTextContent('Phone number is optional');
    expect(container.querySelector('#contact-method-warning')).toBeTruthy();
    expect(
      container.querySelector('.ngx-form-field-notification__list'),
    ).toBeNull();
    expect(
      container.querySelectorAll('.ngx-form-field-notification__stack p'),
    ).toHaveLength(1);
  });

  it('treats a mixed warning+error list as an error in auto tone', async () => {
    const errors = signal([
      { kind: 'warn:soft', message: 'Soft warning' },
      { kind: 'required', message: 'This field is required' },
    ]);

    const { container } = await render(
      `<ngx-form-field-notification
        [errors]="errors"
        fieldName="mixed-group"
      />`,
      {
        imports: [NgxFormFieldNotification],
        componentProperties: { errors },
      },
    );

    // Mixed lists resolve to error: blocking wins over warnings.
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
    expect(container.querySelector('#mixed-group-error')).toBeTruthy();
    expect(container.querySelector('#mixed-group-warning')).toBeNull();
  });

  it('downgrades an explicit error tone to warning when every message is a warning', async () => {
    // Raising `role='alert'` over non-urgent warning text announces with
    // greater urgency than the content warrants. Content wins over explicit
    // tone only in this direction — see resolvedTone docs on the component.
    const warnings = signal([{ kind: 'warn:soft', message: 'Soft warning' }]);

    await render(
      `<ngx-form-field-notification
        [errors]="warnings"
        fieldName="forced-error"
        tone="error"
      />`,
      {
        imports: [NgxFormFieldNotification],
        componentProperties: { warnings },
      },
    );

    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('keeps alert semantics for blocking errors even when tone="warning"', async () => {
    // Downgrading a real blocking error to role="status" would bury the alert
    // in a polite live region. Content wins over explicit tone in both
    // directions — see resolvedTone docs on the component.
    const errors = signal([{ kind: 'required', message: 'Required' }]);

    await render(
      `<ngx-form-field-notification
        [errors]="errors"
        fieldName="forced-warning"
        tone="warning"
      />`,
      {
        imports: [NgxFormFieldNotification],
        componentProperties: { errors },
      },
    );

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('keeps the error container id while blocking errors exist, regardless of tone', async () => {
    const tone = signal<'error' | 'warning'>('error');
    const errors = signal([{ kind: 'required', message: 'Required' }]);

    const { container, fixture } = await render(
      `<ngx-form-field-notification
        [errors]="errors"
        fieldName="switch-tone"
        [tone]="tone()"
      />`,
      {
        imports: [NgxFormFieldNotification],
        componentProperties: { errors, tone },
      },
    );

    expect(container.querySelector('#switch-tone-error')).toBeTruthy();
    expect(container.querySelector('#switch-tone-warning')).toBeNull();

    tone.set('warning');
    await fixture.whenStable();

    // Blocking error still present → stays on the error id and role='alert'.
    expect(container.querySelector('#switch-tone-error')).toBeTruthy();
    expect(container.querySelector('#switch-tone-warning')).toBeNull();
  });

  it('accepts a signal wrapping a static readonly array of errors', async () => {
    const staticErrors = signal<readonly { kind: string; message: string }[]>([
      { kind: 'required', message: 'Required' },
      { kind: 'min', message: 'Too short' },
    ]);

    const { container } = await render(
      `<ngx-form-field-notification
        [errors]="staticErrors"
        fieldName="static-field"
      />`,
      {
        imports: [NgxFormFieldNotification],
        componentProperties: { staticErrors },
      },
    );

    expect(
      container.querySelectorAll('.ngx-form-field-notification__list li'),
    ).toHaveLength(2);
    expect(container.querySelector('#static-field-error')).toBeTruthy();
  });

  it('keeps an empty shell mounted with aria-hidden and no id when errors are undefined', async () => {
    const { container } = await render(
      `<ngx-form-field-notification fieldName="empty-shell" />`,
      { imports: [NgxFormFieldNotification] },
    );

    const shell = container.querySelector('.ngx-form-field-notification');
    expect(shell).toBeTruthy();
    expect(
      shell?.classList.contains('ngx-form-field-notification--empty'),
    ).toBe(true);
    expect(shell?.getAttribute('aria-hidden')).toBe('true');
    expect(shell?.id).toBe('');
    expect(container.querySelector('#empty-shell-error')).toBeNull();
  });

  it('keeps an empty shell mounted with aria-hidden when errors is an empty array', async () => {
    const errors = signal<readonly { kind: string; message: string }[]>([]);

    const { container } = await render(
      `<ngx-form-field-notification
        [errors]="errors"
        fieldName="empty-array"
      />`,
      {
        imports: [NgxFormFieldNotification],
        componentProperties: { errors },
      },
    );

    const shell = container.querySelector('.ngx-form-field-notification');
    expect(
      shell?.classList.contains('ngx-form-field-notification--empty'),
    ).toBe(true);
    expect(shell?.getAttribute('aria-hidden')).toBe('true');
    expect(shell?.id).toBe('');
  });

  it('omits the container id entirely when fieldName is missing', async () => {
    const errors = signal([{ kind: 'required', message: 'Required' }]);

    const { container } = await render(
      `<ngx-form-field-notification [errors]="errors" />`,
      {
        imports: [NgxFormFieldNotification],
        componentProperties: { errors },
      },
    );

    const shell = container.querySelector('.ngx-form-field-notification');
    // id attribute was never written because there is no fieldName to derive one.
    expect(shell?.id).toBe('');
  });

  it('resolves messages from NGX_ERROR_MESSAGES when the ValidationError lacks a message', async () => {
    const errors = signal([{ kind: 'custom-rule', message: '' }]);

    const { container } = await render(
      `<ngx-form-field-notification
        [errors]="errors"
        fieldName="registry-field"
      />`,
      {
        imports: [NgxFormFieldNotification],
        componentProperties: { errors },
        providers: [
          provideErrorMessages({
            'custom-rule': 'Message from registry',
          }),
        ],
      },
    );

    expect(container.textContent).toContain('Message from registry');
  });

  it('defaults the light-theme error surface to the Figma background color token', () => {
    // The light-theme error surface uses the soft-danger token (#fdebeb)
    // pulled from the Figma palette. The pseudo-private variable
    // `--_notification-error-bg` resolves through `--_notification-clr-danger-soft`,
    // so consumers can opt into a different surface via the public alias
    // without reaching into the implementation token. Runtime resolution is
    // covered by browser-mode specs.
    expect(notificationCssSource).toMatch(
      /--_notification-clr-danger-soft:\s*#fdebeb\b/,
    );
    expect(notificationCssSource).toMatch(
      /--_notification-error-bg:[^;]*--_notification-clr-danger-soft/,
    );
  });
});
