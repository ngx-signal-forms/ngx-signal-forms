import { ElementRef, Injector, signal } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import type { SubmittedStatus } from '../types';
import type { NgxSignalFormContext } from '../directives/ngx-signal-form';
import { NGX_SIGNAL_FORM_CONTEXT } from '../tokens';
import { injectFieldControl } from './inject-field-control';

/**
 * Minimal `FieldTree`-shaped mock satisfying the runtime contract enforced by
 * `isFieldTree()` (callable, backing `FieldState` with the required methods
 * and a `.fieldTree` back-reference to itself).
 */
function createMockFieldTree<TValue>(value: TValue): FieldTree<TValue> {
  let fieldTree!: FieldTree<TValue>;
  fieldTree = (() => ({
    value: () => value,
    touched: () => false,
    errors: () => [],
    errorSummary: () => [],
    submitting: () => false,
    markAsTouched: () => {},
    invalid: () => false,
    get fieldTree() {
      return fieldTree;
    },
  })) as FieldTree<TValue>;
  return fieldTree;
}

/**
 * Callable `FieldTree`-shaped mock for a group node (e.g. `address`),
 * matching real Angular Signal Forms more faithfully than
 * `createMockFieldTree`'s plain-object test-fixture parents: in a real form
 * *every* node — the form root and every intermediate group, not just
 * leaves — is itself callable (`typeof node === 'function'`) and satisfies
 * `isFieldTree()`. Child fields are exposed as properties directly on the
 * callable function object (mirroring `formInstance.address.city`).
 *
 * This is the shape that exposed the pre-fix bug: `injectFieldControl`'s
 * path-navigation guard only accepted `typeof value === 'object'`, so it
 * rejected the (callable) `address` group on the second path segment of
 * `"address.city"` — and would have rejected `formInstance` itself on the
 * very first segment of any single-level path in a real, non-mocked form.
 */
function createGroupFieldTree<TValue extends Record<string, unknown>>(
  value: TValue,
  children: { [K in keyof TValue]: FieldTree<TValue[K]> },
): FieldTree<TValue> {
  let fieldTree!: FieldTree<TValue>;
  const call = () => ({
    value: () => value,
    touched: () => false,
    errors: () => [],
    errorSummary: () => [],
    submitting: () => false,
    markAsTouched: () => {},
    invalid: () => false,
    get fieldTree() {
      return fieldTree;
    },
  });
  fieldTree = Object.assign(call, children) as unknown as FieldTree<TValue>;
  return fieldTree;
}

describe('injectFieldControl', () => {
  it('should resolve field control from form using id attribute', () => {
    const emailControl = createMockFieldTree('');
    const mockForm = { email: emailControl };
    const mockContext: NgxSignalFormContext = {
      form: mockForm,
      submittedStatus: () => 'unsubmitted',
      errorStrategy: () => 'on-touch',
    };
    const injector = Injector.create({
      providers: [{ provide: NGX_SIGNAL_FORM_CONTEXT, useValue: mockContext }],
    });

    const element = document.createElement('input');
    element.setAttribute('id', 'email');

    const result = injectFieldControl(element, injector);
    expect(result).toBe(emailControl);
  });

  it('should resolve nested field control using dot notation', () => {
    const cityControl = createMockFieldTree('');
    const mockForm = { address: { city: cityControl } };
    const mockContext: NgxSignalFormContext = {
      form: mockForm,
      submittedStatus: () => 'unsubmitted',
      errorStrategy: () => 'on-touch',
    };

    const injector = Injector.create({
      providers: [{ provide: NGX_SIGNAL_FORM_CONTEXT, useValue: mockContext }],
    });

    const element = document.createElement('input');
    element.setAttribute('id', 'address.city');

    const result = injectFieldControl(element, injector);
    expect(result).toBe(cityControl);
  });

  it('should resolve nested field control when every ancestor node is a callable FieldTree (real form shape)', () => {
    // Regression for a bug where path navigation's guard only accepted
    // `typeof value === 'object'`, rejecting real (callable) FieldTree nodes
    // at every level above the leaf — including `formInstance` itself. Only
    // the plain-object mocks used elsewhere in this file (e.g. `{ address:
    // { city } }`, where `address` is a non-callable plain object) ever
    // passed. This test uses `createGroupFieldTree` so that both the form
    // root and the `address` group are callable, matching how Angular's
    // real Signal Forms `FieldTree` is shaped.
    const cityControl = createMockFieldTree('');
    const addressGroup = createGroupFieldTree(
      { city: '' },
      {
        city: cityControl,
      },
    );
    const mockForm = createGroupFieldTree(
      { address: { city: '' } },
      { address: addressGroup },
    );
    const mockContext: NgxSignalFormContext = {
      form: mockForm,
      submittedStatus: () => 'unsubmitted',
      errorStrategy: () => 'on-touch',
    };

    const injector = Injector.create({
      providers: [{ provide: NGX_SIGNAL_FORM_CONTEXT, useValue: mockContext }],
    });

    const element = document.createElement('input');
    element.setAttribute('id', 'address.city');

    const result = injectFieldControl(element, injector);
    expect(result).toBe(cityControl);
  });

  it('should work with ElementRef', () => {
    const emailControl = createMockFieldTree('');
    const mockForm = { email: emailControl };
    const mockContext: NgxSignalFormContext = {
      form: mockForm,
      submittedStatus: () => 'unsubmitted',
      errorStrategy: () => 'on-touch',
    };
    const injector = Injector.create({
      providers: [{ provide: NGX_SIGNAL_FORM_CONTEXT, useValue: mockContext }],
    });

    const element = document.createElement('input');
    element.setAttribute('id', 'email');
    const elementRef = new ElementRef(element);

    const result = injectFieldControl(elementRef, injector);
    expect(result).toBe(emailControl);
  });

  it('should throw error when field name cannot be resolved', () => {
    const mockContext: NgxSignalFormContext = {
      form: {},
      submittedStatus: () => 'unsubmitted',
      errorStrategy: () => 'on-touch',
    };

    const injector = Injector.create({
      providers: [{ provide: NGX_SIGNAL_FORM_CONTEXT, useValue: mockContext }],
    });

    const element = document.createElement('input');
    // No id attribute

    expect(() => {
      injectFieldControl(element, injector);
    }).toThrow(/could not resolve field name/i);
  });

  it('should throw error when field not found in form', () => {
    const mockForm = { email: signal({ value: '' }) };
    const mockContext: NgxSignalFormContext = {
      form: mockForm,
      submittedStatus: () => 'unsubmitted',
      errorStrategy: () => 'on-touch',
    };

    const injector = Injector.create({
      providers: [{ provide: NGX_SIGNAL_FORM_CONTEXT, useValue: mockContext }],
    });

    const element = document.createElement('input');
    element.setAttribute('id', 'nonexistent');

    expect(() => {
      injectFieldControl(element, injector);
    }).toThrow(/Field "nonexistent" not found in form/i);
  });

  it('should throw error when nested field path is invalid', () => {
    const mockForm = { address: { street: signal({ value: '' }) } };
    const mockContext: NgxSignalFormContext = {
      form: mockForm,
      submittedStatus: () => 'unsubmitted',
      errorStrategy: () => 'on-touch',
    };

    const injector = Injector.create({
      providers: [{ provide: NGX_SIGNAL_FORM_CONTEXT, useValue: mockContext }],
    });

    const element = document.createElement('input');
    element.setAttribute('id', 'address.city');

    expect(() => {
      injectFieldControl(element, injector);
    }).toThrow(/Field "address.city" not found in form/i);
  });

  it('should throw error when form instance is not available (required input)', () => {
    const injector = Injector.create({
      providers: [
        {
          provide: NGX_SIGNAL_FORM_CONTEXT,
          useValue: {
            get form() {
              throw new Error(
                'NG0950: Input is required but no value is available yet',
              );
            },
            submittedStatus: () => 'unsubmitted',
            errorStrategy: () => 'on-touch',
          } satisfies NgxSignalFormContext,
        },
      ],
    });

    const element = document.createElement('input');
    element.setAttribute('id', 'email');

    expect(() => {
      injectFieldControl(element, injector);
    }).toThrow(/Input is required but no value is available yet/i);
  });

  it('should throw when called outside injection context without injector', () => {
    const element = document.createElement('input');
    element.setAttribute('id', 'email');

    expect(() => {
      injectFieldControl(element);
    }).toThrow(/can only be used within an injection context/i);
  });

  it('should throw when form context not available', () => {
    const injector = Injector.create({
      providers: [],
    });

    const element = document.createElement('input');
    element.setAttribute('id', 'email');

    expect(() => {
      injectFieldControl(element, injector);
    }).toThrow(/requires form context/i);
  });

  it('should throw instead of returning an unsound cast when the resolved value is not a FieldTree', () => {
    // Regression: an id can collide with a non-field property on the form
    // object (e.g. plain metadata, not a control). Path navigation used to
    // validate only `isRecord(control) && part in control`, then blindly
    // cast the result to `FieldTree`, deferring the failure to a confusing
    // downstream call site instead of throwing here with a clear message.
    const mockForm = { metadata: { note: 'plain data, not a FieldTree' } };
    const mockContext: NgxSignalFormContext = {
      form: mockForm,
      submittedStatus: () => 'unsubmitted',
      errorStrategy: () => 'on-touch',
    };
    const injector = Injector.create({
      providers: [{ provide: NGX_SIGNAL_FORM_CONTEXT, useValue: mockContext }],
    });

    const element = document.createElement('input');
    element.setAttribute('id', 'metadata');

    expect(() => {
      injectFieldControl(element, injector);
    }).toThrow(/Field "metadata".*not.*(FieldTree|found)/is);
  });

  it('should throw when the resolved value is callable but does not satisfy the FieldState contract', () => {
    // A callable property (e.g. a plain function living on the form object)
    // passes a naive "is it a function" check but is not a real FieldTree —
    // calling it does not produce a conforming FieldState.
    const mockForm = { email: () => 'not a FieldState' };
    const mockContext: NgxSignalFormContext = {
      form: mockForm,
      submittedStatus: () => 'unsubmitted',
      errorStrategy: () => 'on-touch',
    };
    const injector = Injector.create({
      providers: [{ provide: NGX_SIGNAL_FORM_CONTEXT, useValue: mockContext }],
    });

    const element = document.createElement('input');
    element.setAttribute('id', 'email');

    expect(() => {
      injectFieldControl(element, injector);
    }).toThrow(/Field "email".*not.*(FieldTree|found)/is);
  });
});
