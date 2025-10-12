import { Injector, signal } from '@angular/core';
import { describe, it, expect } from 'vitest';
import { injectFormContext } from './inject-form-context';
import { NGX_SIGNAL_FORM_CONTEXT } from '../tokens';
import type { NgxSignalFormContext } from '../directives/form-provider.directive';
import type { SubmittedStatus } from '@angular/forms/signals';

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

  it('should throw error when form context not found', () => {
    const injector = Injector.create({ providers: [] });

    expect(() => {
      injectFormContext(injector);
    }).toThrow(/requires NgxSignalFormProviderDirective/i);
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
