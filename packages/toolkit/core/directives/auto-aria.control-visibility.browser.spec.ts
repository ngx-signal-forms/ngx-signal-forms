import { Component, input, signal } from '@angular/core';
import { FormField, form, minLength, schema } from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldError } from '../../assistive/form-field-error';
import { NgxFormFieldWrapper } from '../../form-field/form-field-wrapper';
import { NgxSignalFormToolkit } from '../../index';
import { NgxFieldIdentityProvider } from './field-identity-provider';

/**
 * `aria-invalid` must not go stale on a control that has no layout box.
 *
 * A control inside a collapsed `<details>`, an inactive tab panel, or a
 * non-current wizard step is not in the accessibility tree, so leaving
 * `aria-invalid="true"` on it means the attribute is wrong the instant the
 * container reopens with a different validation state. `NgxSignalFormAutoAria`
 * therefore probes its own host element each read phase and removes the
 * attribute while the control is not laid out.
 *
 * Browser-only by necessity: jsdom implements neither `checkVisibility()` nor
 * a real `offsetParent`, so the probe always reports "visible" there and every
 * assertion below would pass vacuously.
 */

function createForm() {
  const model = signal({ email: 'no' });
  return form(
    model,
    schema((path) => {
      minLength(path.email, 5, { message: 'At least 5 characters' });
    }),
  );
}

// ---------------------------------------------------------------------------
// Custom wrapper (the case with no workaround before this change)
// ---------------------------------------------------------------------------

@Component({
  selector: 'ngx-test-collapsible-custom-wrapper',
  hostDirectives: [
    { directive: NgxFieldIdentityProvider, inputs: ['fieldName'] },
  ],
  imports: [NgxFormFieldError],
  template: `
    <ng-content />
    <ngx-form-field-error
      [formField]="errorField()"
      fieldName="email"
      strategy="immediate"
    />
  `,
})
class CollapsibleCustomWrapper {
  readonly errorField = input.required<unknown>();
}

@Component({
  selector: 'ngx-test-collapsible-custom-host',
  imports: [CollapsibleCustomWrapper, FormField, NgxSignalFormToolkit],
  template: `
    <form [formRoot]="emailForm" ngxSignalForm>
      <details [open]="open()">
        <summary>Contact details</summary>
        <ngx-test-collapsible-custom-wrapper
          fieldName="email"
          [errorField]="emailForm.email"
        >
          <label for="widget-generated-7">Email</label>
          <input id="widget-generated-7" [formField]="emailForm.email" />
        </ngx-test-collapsible-custom-wrapper>
      </details>
    </form>
  `,
})
class CollapsibleCustomHost {
  readonly open = input.required<boolean>();
  readonly emailForm = createForm();
}

describe('auto-aria — aria-invalid on a control with no layout box (custom wrapper)', () => {
  it('sets aria-invalid while the control is laid out', async () => {
    const { container } = await render(CollapsibleCustomHost, {
      inputs: { open: true },
    });

    expect(
      container
        .querySelector('input#widget-generated-7')
        ?.getAttribute('aria-invalid'),
    ).toBe('true');
  });

  it('removes aria-invalid rather than leaving it stale when collapsed', async () => {
    const { fixture } = await render(CollapsibleCustomHost, {
      inputs: { open: true },
    });
    const control = fixture.nativeElement.querySelector<HTMLElement>(
      'input#widget-generated-7',
    );
    expect(control?.getAttribute('aria-invalid')).toBe('true');

    fixture.componentRef.setInput('open', false);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(control?.checkVisibility()).toBe(false);
    expect(control?.getAttribute('aria-invalid')).toBeNull();
  });

  it('restores aria-invalid when the container reopens', async () => {
    const { fixture } = await render(CollapsibleCustomHost, {
      inputs: { open: false },
    });
    const control = fixture.nativeElement.querySelector<HTMLElement>(
      'input#widget-generated-7',
    );

    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(control?.getAttribute('aria-invalid')).toBe('true');
  });
});

// ---------------------------------------------------------------------------
// Built-in wrapper (previously the only shape the fix covered)
// ---------------------------------------------------------------------------

@Component({
  selector: 'ngx-test-collapsible-builtin-host',
  imports: [NgxFormFieldWrapper, FormField, NgxSignalFormToolkit],
  template: `
    <form [formRoot]="emailForm" ngxSignalForm>
      <details [open]="open()">
        <summary>Contact details</summary>
        <ngx-form-field-wrapper
          [formField]="emailForm.email"
          strategy="immediate"
        >
          <label for="email">Email</label>
          <input id="email" [formField]="emailForm.email" />
        </ngx-form-field-wrapper>
      </details>
    </form>
  `,
})
class CollapsibleBuiltinHost {
  readonly open = input.required<boolean>();
  readonly emailForm = createForm();
}

describe('auto-aria — aria-invalid on a control with no layout box (built-in wrapper)', () => {
  it('keeps the pre-existing behavior after auto-aria took over the probe', async () => {
    const { fixture } = await render(CollapsibleBuiltinHost, {
      inputs: { open: true },
    });
    const control =
      fixture.nativeElement.querySelector<HTMLElement>('input#email');
    expect(control?.getAttribute('aria-invalid')).toBe('true');

    fixture.componentRef.setInput('open', false);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(control?.getAttribute('aria-invalid')).toBeNull();
  });
});
