import { signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldNotification } from './form-field-notification';

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

  it('defaults the light-theme error surface to the Figma background color token', async () => {
    const errors = signal([
      { kind: 'required', message: 'First name is required' },
    ]);

    const { container } = await render(
      `<ngx-form-field-notification
        [errors]="errors"
        fieldName="personal-info"
      />`,
      {
        imports: [NgxFormFieldNotification],
        componentProperties: { errors },
      },
    );

    const notificationHost = container.querySelector(
      'ngx-form-field-notification',
    );

    if (!(notificationHost instanceof HTMLElement)) {
      throw new Error('expected notification host element');
    }

    expect(
      getComputedStyle(notificationHost)
        .getPropertyValue('--_notification-clr-danger-soft')
        .trim(),
    ).toContain('#fdebeb');
    expect(
      getComputedStyle(notificationHost)
        .getPropertyValue('--_notification-error-bg')
        .trim(),
    ).toContain('--_notification-clr-danger-soft');
    expect(getComputedStyle(notificationHost).backgroundColor).toBe(
      'rgba(0, 0, 0, 0)',
    );
  });
});
