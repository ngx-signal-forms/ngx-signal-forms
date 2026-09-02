import { Injector, signal } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import type { ResolvedErrorDisplayStrategy, SubmittedStatus } from '../types';
import type { NgxSignalFormContext } from '../directives/ngx-signal-form';
import { NGX_SIGNAL_FORM_CONTEXT } from '../tokens';
import { injectFormContext } from './inject-form-context';

/**
 * Callable `FieldTree`-shaped stand-in for a form root.
 *
 * In a real Signal Forms instance every node — the root included — is a
 * function carrying its children as properties, so a plain
 * `{ email: signal(...) }` object is not a `FieldTree` at all. These specs
 * only ever compare the context's `form` by identity, so the stand-in stays
 * minimal; the cast is confined to this one helper.
 */
function createRootFieldTree<TValue extends Record<string, unknown>>(
  value: TValue,
  children: { [K in keyof TValue]: unknown } = value,
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

describe('injectFormContext', () => {
  it('should return form context when available', () => {
    const mockForm = createRootFieldTree({ email: '' });
    const mockContext: NgxSignalFormContext = {
      form: mockForm,
      submittedStatus: signal<SubmittedStatus>('unsubmitted'),
      errorStrategy: signal<ResolvedErrorDisplayStrategy>('on-touch'),
    };

    const injector = Injector.create({
      providers: [{ provide: NGX_SIGNAL_FORM_CONTEXT, useValue: mockContext }],
    });

    const result = injectFormContext(injector);
    expect(result).toBe(mockContext);
    expect(result?.form).toBe(mockForm);
  });

  it('should return undefined when form context not found', () => {
    const injector = Injector.create({ providers: [] });

    const result = injectFormContext(injector);
    expect(result).toBeUndefined();
  });

  it('should throw when called outside injection context without injector', () => {
    expect(() => {
      injectFormContext();
    }).toThrow(/can only be used within an injection context/i);
  });

  it('should access submittedStatus signal from context', () => {
    const submittedStatusSignal = signal<SubmittedStatus>('submitted');
    const mockContext: NgxSignalFormContext = {
      form: createRootFieldTree({}),
      submittedStatus: submittedStatusSignal,
      errorStrategy: signal<ResolvedErrorDisplayStrategy>('immediate'),
    };

    const injector = Injector.create({
      providers: [{ provide: NGX_SIGNAL_FORM_CONTEXT, useValue: mockContext }],
    });

    const result = injectFormContext(injector);
    expect(result?.submittedStatus()).toBe('submitted');
  });
});
