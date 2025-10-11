import { Injector, signal, ElementRef } from '@angular/core';
import { describe, it, expect } from 'vitest';
import { injectFieldControl } from './inject-field-control';
import { NGX_SIGNAL_FORM_CONTEXT, NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import type { NgxSignalFormContext } from '../directives/form-provider.directive';
import type { NgxSignalFormsConfig } from '../types';

describe('injectFieldControl', () => {
  it('should resolve field control from form using id attribute', () => {
    const emailControl = signal({ value: '', invalid: () => false });
    const mockForm = { email: emailControl };
    const mockContext: NgxSignalFormContext = {
      form: mockForm,
      hasSubmitted: () => false,
      errorStrategy: () => 'on-touch',
    };
    const config: NgxSignalFormsConfig = { strictFieldResolution: false };

    const injector = Injector.create({
      providers: [
        { provide: NGX_SIGNAL_FORM_CONTEXT, useValue: mockContext },
        { provide: NGX_SIGNAL_FORMS_CONFIG, useValue: config },
      ],
    });

    const element = document.createElement('input');
    element.setAttribute('id', 'email');

    const result = injectFieldControl(element, injector);
    expect(result).toBe(emailControl);
  });

  it('should resolve nested field control using dot notation', () => {
    const cityControl = signal({ value: '', invalid: () => false });
    const mockForm = { address: { city: cityControl } };
    const mockContext: NgxSignalFormContext = {
      form: mockForm,
      hasSubmitted: () => false,
      errorStrategy: () => 'on-touch',
    };
    const config: NgxSignalFormsConfig = { strictFieldResolution: false };

    const injector = Injector.create({
      providers: [
        { provide: NGX_SIGNAL_FORM_CONTEXT, useValue: mockContext },
        { provide: NGX_SIGNAL_FORMS_CONFIG, useValue: config },
      ],
    });

    const element = document.createElement('input');
    element.setAttribute('data-signal-field', 'address.city');

    const result = injectFieldControl(element, injector);
    expect(result).toBe(cityControl);
  });

  it('should work with ElementRef', () => {
    const emailControl = signal({ value: '', invalid: () => false });
    const mockForm = { email: emailControl };
    const mockContext: NgxSignalFormContext = {
      form: mockForm,
      hasSubmitted: () => false,
      errorStrategy: () => 'on-touch',
    };
    const config: NgxSignalFormsConfig = { strictFieldResolution: false };

    const injector = Injector.create({
      providers: [
        { provide: NGX_SIGNAL_FORM_CONTEXT, useValue: mockContext },
        { provide: NGX_SIGNAL_FORMS_CONFIG, useValue: config },
      ],
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
      hasSubmitted: () => false,
      errorStrategy: () => 'on-touch',
    };
    const config: NgxSignalFormsConfig = { strictFieldResolution: false };

    const injector = Injector.create({
      providers: [
        { provide: NGX_SIGNAL_FORM_CONTEXT, useValue: mockContext },
        { provide: NGX_SIGNAL_FORMS_CONFIG, useValue: config },
      ],
    });

    const element = document.createElement('input');
    // No id, name, or data-signal-field

    expect(() => {
      injectFieldControl(element, injector);
    }).toThrow(/could not resolve field name/i);
  });

  it('should throw error when field not found in form', () => {
    const mockForm = { email: signal({ value: '' }) };
    const mockContext: NgxSignalFormContext = {
      form: mockForm,
      hasSubmitted: () => false,
      errorStrategy: () => 'on-touch',
    };
    const config: NgxSignalFormsConfig = { strictFieldResolution: false };

    const injector = Injector.create({
      providers: [
        { provide: NGX_SIGNAL_FORM_CONTEXT, useValue: mockContext },
        { provide: NGX_SIGNAL_FORMS_CONFIG, useValue: config },
      ],
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
      hasSubmitted: () => false,
      errorStrategy: () => 'on-touch',
    };
    const config: NgxSignalFormsConfig = { strictFieldResolution: false };

    const injector = Injector.create({
      providers: [
        { provide: NGX_SIGNAL_FORM_CONTEXT, useValue: mockContext },
        { provide: NGX_SIGNAL_FORMS_CONFIG, useValue: config },
      ],
    });

    const element = document.createElement('input');
    element.setAttribute('data-signal-field', 'address.city');

    expect(() => {
      injectFieldControl(element, injector);
    }).toThrow(/Field "address.city" not found in form/i);
  });

  it('should throw error when form instance is not available (required input)', () => {
    const config: NgxSignalFormsConfig = { strictFieldResolution: false };

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
            hasSubmitted: () => false,
            errorStrategy: () => 'on-touch',
          } satisfies NgxSignalFormContext,
        },
        { provide: NGX_SIGNAL_FORMS_CONFIG, useValue: config },
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
    const config: NgxSignalFormsConfig = { strictFieldResolution: false };
    const injector = Injector.create({
      providers: [{ provide: NGX_SIGNAL_FORMS_CONFIG, useValue: config }],
      // No NGX_SIGNAL_FORM_CONTEXT
    });

    const element = document.createElement('input');
    element.setAttribute('id', 'email');

    expect(() => {
      injectFieldControl(element, injector);
    }).toThrow(/requires NgxSignalFormProviderDirective/i);
  });
});
