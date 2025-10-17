import { Injector, signal } from '@angular/core';
import type { SubmittedStatus } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import type { NgxSignalFormContext } from '../directives/form-provider.directive';
import { NGX_SIGNAL_FORM_CONTEXT } from '../tokens';
import { injectFormContext } from './inject-form-context';

describe('injectFormContext', () => {
  it('should return form context when available', () => {
    const mockForm = { email: signal({ value: '', invalid: () => false }) };
    const mockContext: NgxSignalFormContext = {
      form: mockForm,
      submittedStatus: () => 'unsubmitted',
      errorStrategy: () => 'on-touch',
    };

    const injector = Injector.create({
      providers: [{ provide: NGX_SIGNAL_FORM_CONTEXT, useValue: mockContext }],
    });

    const result = injectFormContext(injector);
    expect(result).toBe(mockContext);
    expect(result.form).toBe(mockForm);
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
      form: {},
      submittedStatus: submittedStatusSignal,
      errorStrategy: () => 'immediate',
    };

    const injector = Injector.create({
      providers: [{ provide: NGX_SIGNAL_FORM_CONTEXT, useValue: mockContext }],
    });

    const result = injectFormContext(injector);
    expect(result.submittedStatus()).toBe('submitted');
  });
});
