import { ApplicationRef, Component, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, minLength, schema } from '@angular/forms/signals';
import { expectNoA11yViolations } from '@ngx-signal-forms/toolkit/testing';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldError } from '../../assistive/form-field-error';
import { NgxSignalFormToolkit } from '../../index';
import { NgxFieldIdentityProvider } from './field-identity-provider';

/**
 * WCAG 2.2 AA conformance gate for a third-party wrapper that owns its own
 * field identity — the shape `NgxFieldIdentityProvider` exists to support.
 *
 * Two things are under test that a jsdom spec cannot reach:
 *
 * 1. The control's DOM `id` is widget-generated and differs from the field
 *    name, so every `aria-describedby` target is one this wrapper rendered
 *    from the *declared* name. A mismatch is an axe `aria-valid-attr-value`
 *    failure (dangling id reference).
 * 2. The wrapper sits inside a collapsible container. Collapsing it must not
 *    leave ARIA state behind on a control that has no layout box.
 */
@Component({
  selector: 'ngx-test-a11y-identity-wrapper',
  hostDirectives: [
    { directive: NgxFieldIdentityProvider, inputs: ['fieldName'] },
  ],
  imports: [NgxFormFieldError],
  template: `
    <ng-content />
    <ngx-form-field-error
      [formField]="errorField()"
      fieldName="emailAddress"
      strategy="immediate"
    />
  `,
})
class A11yIdentityWrapper {
  readonly errorField = input.required<unknown>();
}

@Component({
  selector: 'ngx-test-a11y-identity-host',
  imports: [A11yIdentityWrapper, FormField, NgxSignalFormToolkit],
  template: `
    <form [formRoot]="emailForm" ngxSignalForm>
      <details [open]="open()">
        <summary>Contact details</summary>
        <ngx-test-a11y-identity-wrapper
          fieldName="emailAddress"
          [errorField]="emailForm.emailAddress"
        >
          <label for="widget-generated-7">Email address</label>
          <input id="widget-generated-7" [formField]="emailForm.emailAddress" />
        </ngx-test-a11y-identity-wrapper>
      </details>
    </form>
  `,
})
class A11yIdentityHost {
  readonly open = input.required<boolean>();
  readonly #model = signal({ emailAddress: 'no' });
  readonly emailForm = form(
    this.#model,
    schema((path) => {
      minLength(path.emailAddress, 5, { message: 'At least 5 characters' });
    }),
  );
}

describe('NgxFieldIdentityProvider — WCAG 2.2 AA conformance', () => {
  it('has no violations when the declared field name differs from the control id', async () => {
    const { container } = await render(A11yIdentityHost, {
      inputs: { open: true },
    });
    await TestBed.inject(ApplicationRef).whenStable();

    const describedBy =
      container
        .querySelector('input#widget-generated-7')
        ?.getAttribute('aria-describedby') ?? '';
    expect(describedBy).toContain('emailAddress-error');

    await expectNoA11yViolations(container);
  });

  it('has no violations once the container collapses around the control', async () => {
    const { container, fixture } = await render(A11yIdentityHost, {
      inputs: { open: true },
    });

    fixture.componentRef.setInput('open', false);
    await fixture.whenStable();
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(
      container
        .querySelector('input#widget-generated-7')
        ?.getAttribute('aria-invalid'),
    ).toBeNull();

    await expectNoA11yViolations(container);
  });
});
