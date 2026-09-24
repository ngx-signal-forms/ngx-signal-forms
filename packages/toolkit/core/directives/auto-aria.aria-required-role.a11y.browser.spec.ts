import {
  ApplicationRef,
  Component,
  Directive,
  input as signalInput,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FORM_FIELD } from '@angular/forms/signals';
import { expectNoA11yViolations } from '@ngx-signal-forms/toolkit/testing';
import { render } from '@testing-library/angular';
import { describe, expect, it, vi } from 'vitest';
import { NgxSignalFormAutoAria } from './auto-aria';

/**
 * WCAG 2.2 AA conformance gate for #496: `aria-required` is only valid ARIA
 * on a handful of roles (WAI-ARIA 1.2, https://w3c.github.io/aria/#aria-required).
 * A role-less custom host has the generic role, which does not support it —
 * writing the attribute there is an `aria-allowed-attr` violation. A host
 * that opts into a supporting role (`combobox`) must still get it.
 */
@Directive({
  selector: '[formField]',
  providers: [{ provide: FORM_FIELD, useExisting: MockFormFieldDirective }],
})
class MockFormFieldDirective {
  readonly field = signalInput<unknown>(undefined, { alias: 'formField' });
  readonly state = signal<unknown>(undefined);
}

function createRequiredMockControl() {
  const fieldState = {
    invalid: signal(false),
    touched: signal(false),
    errors: signal<unknown[]>([]),
    valid: signal(true),
    dirty: signal(false),
    value: signal(''),
    required: signal(true),
    focusBoundControl: vi.fn(),
  };

  return signal(() => fieldState);
}

describe('NgxSignalFormAutoAria — aria-required role support (WCAG 2.2 AA)', () => {
  it('does not write aria-required to a role-less custom host', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    @Component({
      selector: 'ngx-test-aria-required-no-role',
      imports: [MockFormFieldDirective, NgxSignalFormAutoAria],
      template: `
        <label id="cluster-label">Cluster</label>
        <div
          id="cluster"
          aria-labelledby="cluster-label"
          [formField]="clusterControl()"
        ></div>
      `,
    })
    class TestComponent {
      readonly clusterControl = createRequiredMockControl();
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const cluster = container.querySelector('#cluster');
    expect(cluster).not.toHaveAttribute('aria-required');
    expect(warnSpy).toHaveBeenCalledTimes(1);

    await expectNoA11yViolations(container);

    warnSpy.mockRestore();
  });

  it('writes aria-required="true" to a custom host with role="combobox"', async () => {
    @Component({
      selector: 'ngx-test-aria-required-combobox-role',
      imports: [MockFormFieldDirective, NgxSignalFormAutoAria],
      template: `
        <label id="destination-label">Destination</label>
        <div
          id="destination"
          role="combobox"
          aria-expanded="false"
          aria-labelledby="destination-label"
          [formField]="destinationControl()"
        ></div>
      `,
    })
    class TestComponent {
      readonly destinationControl = createRequiredMockControl();
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const destination = container.querySelector('#destination');
    expect(destination).toHaveAttribute('aria-required', 'true');

    await expectNoA11yViolations(container);
  });
});
