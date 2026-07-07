import { Component, computed, input, signal } from '@angular/core';
import { form, required, schema, type FieldTree } from '@angular/forms/signals';
import { render, screen } from '@testing-library/angular';
import type { ValidationError } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import { provideFormFieldErrorRenderer } from '@ngx-signal-forms/toolkit';
import { NgxFormFieldWrapper } from './form-field-wrapper';
import { NgxFormFieldset } from './form-fieldset';

type ContactModel = { email: string };
type AddressModel = { street: string };

const contactSchema = schema<ContactModel>((path) => {
  required(path.email, { message: 'Email is required' });
});

const addressSchema = schema<AddressModel>((path) => {
  required(path.street, { message: 'Street is required' });
});

/**
 * Stub error renderer that emits a known marker so the integration tests can
 * assert the wrapper/fieldset instantiated this component via the renderer
 * token rather than the default `NgxFormFieldError`. Reading the actual error
 * count proves the wrapper passed real `FieldTree` state through the input
 * contract.
 */
@Component({
  selector: 'stub-error-renderer',
  template: `
    <span data-testid="stub-error">STUB-ERR:{{ errorCount() }}</span>
    <span data-testid="stub-field-name">{{ fieldName() ?? 'null' }}</span>
    <span data-testid="stub-warning-strategy">{{
      warningStrategy() ?? 'unset'
    }}</span>
  `,
  standalone: true,
})
class StubErrorRenderer {
  /** Bound by `NgxFormFieldWrapper` — the FieldTree is itself a signal. */
  readonly formField = input<FieldTree<unknown> | undefined>();
  /** Bound by `NgxFormFieldset` — pre-aggregated errors signal. */
  readonly errors = input<() => readonly ValidationError[]>();
  readonly fieldName = input<string | null | undefined>();
  readonly listStyle = input<unknown>();
  readonly strategy = input<unknown>();
  readonly submittedStatus = input<unknown>();
  /**
   * `NgxFormFieldWrapper` forwards its `warningStrategy` input here — an
   * extra beyond the minimal `{formField, strategy, submittedStatus}`
   * contract — so a custom renderer can honor independent warning timing
   * without its own DI lookup.
   */
  readonly warningStrategy = input<unknown>();

  protected readonly errorCount = computed(() => {
    const errorsSignal = this.errors();
    if (errorsSignal) {
      return errorsSignal().length;
    }

    const fieldTree = this.formField();
    if (!fieldTree) return 0;
    return fieldTree().errors().length;
  });
}

describe('form-field wrapper renderer seam', () => {
  it('renders the configured error renderer in place of the default for a real form() field', async () => {
    @Component({
      selector: 'host-component',
      standalone: true,
      imports: [NgxFormFieldWrapper],
      template: `
        <ngx-form-field-wrapper
          [formField]="contactForm.email"
          fieldName="email"
          strategy="immediate"
        >
          <label for="email">Email</label>
          <input id="email" type="email" [formField]="contactForm.email" />
        </ngx-form-field-wrapper>
      `,
    })
    class HostComponent {
      readonly contactForm = form(
        signal<ContactModel>({ email: '' }),
        contactSchema,
      );
    }

    await render(HostComponent, {
      providers: [
        provideFormFieldErrorRenderer({ component: StubErrorRenderer }),
      ],
    });

    // The stub renderer's marker text appears in the DOM, proving the wrapper
    // instantiated the configured component instead of the default
    // NgxFormFieldError. The error count probe (1 — the required validator
    // fires for the empty value) confirms the wrapper passed the bound
    // FieldTree through the renderer contract correctly.
    const stub = await screen.findByTestId('stub-error');
    expect(stub.textContent?.trim()).toBe('STUB-ERR:1');
  });

  it('forwards fieldName and warningStrategy to a custom renderer without requiring DI context lookups', async () => {
    // Regression coverage: a custom error-renderer contract previously only
    // documented `{formField, strategy, submittedStatus}`. A renderer that
    // needs to satisfy the `${fieldName}-error`/`-warning` id contract (see
    // NgxFormFieldErrorRenderer in core/tokens.ts) had to inject
    // NGX_SIGNAL_FORM_FIELD_CONTEXT itself to learn the field name — the
    // wrapper now passes it (and `warningStrategy`) directly as inputs.
    @Component({
      selector: 'host-component-fieldname-passthrough',
      standalone: true,
      imports: [NgxFormFieldWrapper],
      template: `
        <ngx-form-field-wrapper
          [formField]="contactForm.email"
          fieldName="email"
          strategy="immediate"
          warningStrategy="on-touch"
        >
          <label for="email">Email</label>
          <input id="email" type="email" [formField]="contactForm.email" />
        </ngx-form-field-wrapper>
      `,
    })
    class HostComponent {
      readonly contactForm = form(
        signal<ContactModel>({ email: '' }),
        contactSchema,
      );
    }

    await render(HostComponent, {
      providers: [
        provideFormFieldErrorRenderer({ component: StubErrorRenderer }),
      ],
    });

    const fieldNameEl = await screen.findByTestId('stub-field-name');
    expect(fieldNameEl.textContent?.trim()).toBe('email');

    const warningStrategyEl = await screen.findByTestId(
      'stub-warning-strategy',
    );
    expect(warningStrategyEl.textContent?.trim()).toBe('on-touch');
  });
});

describe('form-fieldset renderer seam', () => {
  it('renders the configured error renderer for the plain feedback branch and forwards aggregated inputs', async () => {
    @Component({
      selector: 'fieldset-host',
      standalone: true,
      imports: [NgxFormFieldset, NgxFormFieldWrapper],
      template: `
        <ngx-form-fieldset
          [fieldsetField]="addressForm"
          fieldsetId="address"
          feedbackAppearance="plain"
          listStyle="bullets"
          strategy="immediate"
          includeNestedErrors
        >
          <legend>Address</legend>
          <ngx-form-field-wrapper
            [formField]="addressForm.street"
            fieldName="street"
            strategy="immediate"
          >
            <label for="street">Street</label>
            <input id="street" type="text" [formField]="addressForm.street" />
          </ngx-form-field-wrapper>
        </ngx-form-fieldset>
      `,
    })
    class FieldsetHost {
      readonly addressForm = form(
        signal<AddressModel>({ street: '' }),
        addressSchema,
      );
    }

    await render(FieldsetHost, {
      providers: [
        provideFormFieldErrorRenderer({ component: StubErrorRenderer }),
      ],
    });

    // Two stub renderers should mount: one for the wrapper (errorCount 1) and
    // one for the fieldset's plain-feedback branch (errorCount 1, sourced from
    // the aggregated `errors` signal). Both must receive populated inputs from
    // their respective renderer contracts.
    const stubs = await screen.findAllByTestId('stub-error');
    expect(stubs.length).toBe(2);
    for (const stub of stubs) {
      expect(stub.textContent?.trim()).toBe('STUB-ERR:1');
    }
  });
});
