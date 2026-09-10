import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, required, schema } from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  generateErrorId,
  inferNgxSignalFormControlKind,
} from '@ngx-signal-forms/toolkit';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldWrapper } from '../../form-field/form-field-wrapper';

/** Fail fast with a clear message when a fixture element is missing. */
function requireElement<T extends Element>(
  root: ParentNode,
  selector: string,
): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Fixture is missing "${selector}"`);
  }
  return element;
}

/**
 * Regression coverage for issue #472: a native checkbox or radio infers a
 * wrapper kind (`checkbox` / `radio-group`), but auto-ARIA eligibility is a
 * separate decision — see CONTEXT.md's "Inferred control kind and
 * auto-ARIA eligibility are two decisions" and
 * `docs/decisions/0001-control-semantics-architecture.md#auto-aria-eligibility-boundary`.
 *
 * Every case below asserts BOTH halves for the same rendered control:
 * - the resolved wrapper/inference kind
 * - the real `aria-invalid` / `aria-required` / `aria-describedby`
 *   attributes once the field is required, touched, and invalid
 *
 * jsdom is enough here: `isElementCssVisible()` (auto-aria's layout gate for
 * `aria-invalid`) falls back to `true` whenever `Element.checkVisibility` is
 * unavailable, which is exactly the jsdom case — see
 * `packages/toolkit/core/services/field-identity.ts`. `aria-required` and
 * `aria-describedby` never depend on layout at all. Existing jsdom specs
 * (`form-field-wrapper.spec.ts`) already assert real `aria-required` on
 * wrapped inputs on this basis.
 */
describe('NgxSignalFormAutoAria — native checkbox/radio inference vs. eligibility (#472)', () => {
  it('(a) a native checkbox infers kind "checkbox" but receives no auto-ARIA attributes', async () => {
    @Component({
      selector: 'ngx-test-native-checkbox',
      imports: [FormField, NgxSignalFormToolkit],
      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <label for="agree">I agree to the terms</label>
          <input id="agree" type="checkbox" [formField]="testForm.agree" />
        </form>
      `,
    })
    class Host {
      readonly testForm = form(
        signal({ agree: false }),
        schema((path) => {
          required(path.agree, { message: 'Agreement is required' });
        }),
      );
    }

    const { container, fixture } = await render(Host);
    fixture.componentInstance.testForm.agree().markAsTouched();
    await TestBed.inject(ApplicationRef).whenStable();

    const input = requireElement<HTMLInputElement>(container, '#agree');
    expect(fixture.componentInstance.testForm.agree().invalid()).toBe(true);
    expect(inferNgxSignalFormControlKind(input)).toBe('checkbox');

    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-required');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('(b) a native checkbox-based switch infers kind "switch" and receives auto-ARIA attributes', async () => {
    @Component({
      selector: 'ngx-test-native-switch',
      imports: [FormField, NgxSignalFormToolkit],
      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <label for="emailUpdates">Email updates</label>
          <input
            id="emailUpdates"
            type="checkbox"
            role="switch"
            [formField]="testForm.emailUpdates"
          />
        </form>
      `,
    })
    class Host {
      readonly testForm = form(
        signal({ emailUpdates: false }),
        schema((path) => {
          required(path.emailUpdates, { message: 'Updates opt-in required' });
        }),
      );
    }

    const { container, fixture } = await render(Host);
    fixture.componentInstance.testForm.emailUpdates().markAsTouched();
    await TestBed.inject(ApplicationRef).whenStable();

    const input = requireElement<HTMLInputElement>(container, '#emailUpdates');
    expect(fixture.componentInstance.testForm.emailUpdates().invalid()).toBe(
      true,
    );
    expect(inferNgxSignalFormControlKind(input)).toBe('switch');

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute(
      'aria-describedby',
      generateErrorId('emailUpdates'),
    );
  });

  it('(c) native radio inputs infer kind "radio-group" but receive no per-input auto-ARIA attributes', async () => {
    @Component({
      selector: 'ngx-test-native-radio',
      imports: [FormField, NgxSignalFormToolkit],
      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <label>
            <input
              id="delivery-standard"
              type="radio"
              name="delivery"
              value="standard"
              [formField]="testForm.delivery"
            />
            Standard
          </label>
          <label>
            <input
              id="delivery-express"
              type="radio"
              name="delivery"
              value="express"
              [formField]="testForm.delivery"
            />
            Express
          </label>
        </form>
      `,
    })
    class Host {
      readonly testForm = form(
        signal({ delivery: '' }),
        schema((path) => {
          required(path.delivery, { message: 'Delivery method is required' });
        }),
      );
    }

    const { container, fixture } = await render(Host);
    fixture.componentInstance.testForm.delivery().markAsTouched();
    await TestBed.inject(ApplicationRef).whenStable();

    const standard = requireElement<HTMLInputElement>(
      container,
      '#delivery-standard',
    );
    const express = requireElement<HTMLInputElement>(
      container,
      '#delivery-express',
    );
    expect(fixture.componentInstance.testForm.delivery().invalid()).toBe(true);
    expect(inferNgxSignalFormControlKind(standard)).toBe('radio-group');
    expect(inferNgxSignalFormControlKind(express)).toBe('radio-group');

    for (const radio of [standard, express]) {
      expect(radio).not.toHaveAttribute('aria-invalid');
      expect(radio).not.toHaveAttribute('aria-required');
      expect(radio).not.toHaveAttribute('aria-describedby');
    }
  });

  it('(d) an explicit ngxSignalFormControl="checkbox" single control opts in to auto-ARIA', async () => {
    @Component({
      selector: 'ngx-test-explicit-checkbox',
      imports: [FormField, NgxSignalFormToolkit],
      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <label for="terms">I accept the terms</label>
          <input
            id="terms"
            type="checkbox"
            ngxSignalFormControl="checkbox"
            [formField]="testForm.terms"
          />
        </form>
      `,
    })
    class Host {
      readonly testForm = form(
        signal({ terms: false }),
        schema((path) => {
          required(path.terms, { message: 'Terms acceptance is required' });
        }),
      );
    }

    const { container, fixture } = await render(Host);
    fixture.componentInstance.testForm.terms().markAsTouched();
    await TestBed.inject(ApplicationRef).whenStable();

    const input = requireElement<HTMLInputElement>(container, '#terms');
    expect(fixture.componentInstance.testForm.terms().invalid()).toBe(true);
    expect(input).toHaveAttribute(
      'data-ngx-signal-form-control-kind',
      'checkbox',
    );

    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('aria-describedby', generateErrorId('terms'));
  });

  it('(e) a grouped radio wrapper owns group-level ARIA and per-input attributes stay absent', async () => {
    @Component({
      selector: 'ngx-test-grouped-radio-wrapper',
      imports: [FormField, NgxSignalFormToolkit, NgxFormFieldWrapper],
      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <ngx-form-field-wrapper
            [formField]="testForm.delivery"
            fieldName="delivery-method"
          >
            <span ngxFormFieldLabel>Delivery method</span>
            <div>
              <label>
                <input
                  id="delivery-standard"
                  type="radio"
                  name="delivery"
                  value="standard"
                  [formField]="testForm.delivery"
                />
                Standard
              </label>
              <label>
                <input
                  id="delivery-express"
                  type="radio"
                  name="delivery"
                  value="express"
                  [formField]="testForm.delivery"
                />
                Express
              </label>
            </div>
          </ngx-form-field-wrapper>
        </form>
      `,
    })
    class Host {
      readonly testForm = form(
        signal({ delivery: '' }),
        schema((path) => {
          required(path.delivery, { message: 'Delivery method is required' });
        }),
      );
    }

    const { container, fixture } = await render(Host);
    fixture.componentInstance.testForm.delivery().markAsTouched();
    await TestBed.inject(ApplicationRef).whenStable();

    const wrapper = requireElement<HTMLElement>(
      container,
      'ngx-form-field-wrapper',
    );
    const standard = requireElement<HTMLInputElement>(
      container,
      '#delivery-standard',
    );
    const express = requireElement<HTMLInputElement>(
      container,
      '#delivery-express',
    );

    expect(fixture.componentInstance.testForm.delivery().invalid()).toBe(true);

    // Kind resolves on the wrapper, not on the individual radios.
    expect(wrapper).toHaveAttribute(
      'data-ngx-signal-form-control-kind',
      'radio-group',
    );

    // Wrapper cluster ARIA: `NgxFormFieldWrapper` sets `role` and
    // `aria-labelledby` itself, in `resolveClusterAriaAttrs()`
    // (form-field-cluster-aria.ts).
    expect(wrapper).toHaveAttribute('role', 'radiogroup');
    expect(wrapper).toHaveAttribute('aria-labelledby', 'delivery-method-label');

    // Auto-ARIA on the wrapper host: the wrapper element is itself a
    // `[formField]` host (not `input`/`textarea`/`select`), so
    // `NgxSignalFormAutoAria`'s generic branch matches it directly and
    // writes `aria-invalid`, `aria-required`, and `aria-describedby` on it
    // the same way it would for any other bound control — overwriting the
    // wrapper's own `aria-describedby` host binding with the same computed
    // value.
    expect(wrapper).toHaveAttribute(
      'aria-describedby',
      generateErrorId('delivery-method'),
    );
    expect(wrapper).toHaveAttribute('aria-required', 'true');

    // Per-input ownership would duplicate the group container's contract,
    // so neither radio carries these attributes.
    for (const radio of [standard, express]) {
      expect(radio).not.toHaveAttribute('aria-invalid');
      expect(radio).not.toHaveAttribute('aria-required');
      expect(radio).not.toHaveAttribute('aria-describedby');
    }
  });
});
