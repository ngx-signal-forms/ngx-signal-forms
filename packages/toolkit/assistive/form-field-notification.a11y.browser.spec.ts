import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ValidationError } from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldNotification } from './form-field-notification';
import { expectNoA11yViolations } from '@ngx-signal-forms/toolkit/testing';

/**
 * WCAG 2.2 AA conformance gate for `NgxFormFieldNotification`.
 *
 * Rendered the way a custom summary block composes it — a `[errors]`-bound
 * card outside the `NgxFormFieldset` renderer outlet (per the class doc's
 * "grouped fieldset feedback" / "custom summary cards" usage). Scanned empty
 * (both live regions must already exist per WCAG 4.1.3 — see the wrapper
 * spec's twin), with blocking errors (role="alert"), and, separately, with
 * only warnings (role="status") — the two live regions carry a different
 * implicit role and only one is ever populated at a time.
 */
describe('NgxFormFieldNotification — WCAG 2.2 AA conformance', () => {
  it('the empty notification has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-notification-empty',
      imports: [NgxFormFieldNotification],
      template: `
        <ngx-form-field-notification [errors]="errors" fieldName="shipping" />
      `,
    })
    class TestComponent {
      readonly errors = signal<readonly ValidationError[]>([]);
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(container.querySelector('[role="alert"]')).toBeTruthy();
    expect(container.querySelector('[role="status"]')).toBeTruthy();
    await expectNoA11yViolations(container);
  });

  it('a populated error notification has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-notification-error',
      imports: [NgxFormFieldNotification],
      template: `
        <ngx-form-field-notification
          [errors]="errors"
          fieldName="shipping"
          title="Shipping address errors"
        />
      `,
    })
    class TestComponent {
      readonly errors = signal<readonly ValidationError[]>([
        { kind: 'required', message: 'Street is required' },
        { kind: 'required', message: 'City is required' },
      ]);
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const alert = container.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Street is required');
    await expectNoA11yViolations(container);
  });

  it('a populated warning notification has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-notification-warning',
      imports: [NgxFormFieldNotification],
      template: `
        <ngx-form-field-notification [errors]="warnings" fieldName="shipping" />
      `,
    })
    class TestComponent {
      readonly warnings = signal<readonly ValidationError[]>([
        { kind: 'warn:po-box', message: 'PO boxes may delay delivery' },
      ]);
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const status = container.querySelector('[role="status"]');
    expect(status?.textContent).toContain('PO boxes may delay delivery');
    await expectNoA11yViolations(container);
  });
});
