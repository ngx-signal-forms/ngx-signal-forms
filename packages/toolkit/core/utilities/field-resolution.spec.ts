import { Injector } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import type { NgxSignalFormsConfig } from '../types';
import { generateErrorId, resolveFieldName } from './field-resolution';

describe('field-resolution', () => {
  describe('resolveFieldName', () => {
    it('should resolve field name from data-signal-field attribute (priority 1)', () => {
      const config: NgxSignalFormsConfig = {
        autoAria: true,
      };
      const injector = Injector.create({
        providers: [{ provide: NGX_SIGNAL_FORMS_CONFIG, useValue: config }],
      });

      const element = document.createElement('input');
      element.setAttribute('data-signal-field', 'address.city');
      element.setAttribute('id', 'city');
      element.setAttribute('name', 'cityName');

      const fieldName = resolveFieldName(element, injector);
      expect(fieldName).toBe('address.city');
    });

    it('should resolve field name from custom resolver (priority 2)', () => {
      const customResolver = vi.fn(() => 'custom-field');
      const config: NgxSignalFormsConfig = {
        fieldNameResolver: () => customResolver, // Wrap in SignalLike
      };
      const injector = Injector.create({
        providers: [{ provide: NGX_SIGNAL_FORMS_CONFIG, useValue: config }],
      });

      const element = document.createElement('input');
      element.setAttribute('id', 'email');
      element.setAttribute('name', 'emailName');

      const fieldName = resolveFieldName(element, injector);
      expect(fieldName).toBe('custom-field');
      expect(customResolver).toHaveBeenCalledWith(element);
    });

    it('should resolve field name from id attribute (priority 3)', () => {
      const config: NgxSignalFormsConfig = {
        autoAria: true,
      };
      const injector = Injector.create({
        providers: [{ provide: NGX_SIGNAL_FORMS_CONFIG, useValue: config }],
      });

      const element = document.createElement('input');
      element.setAttribute('id', 'email');
      element.setAttribute('name', 'emailName');

      const fieldName = resolveFieldName(element, injector);
      expect(fieldName).toBe('email');
    });

    it('should resolve field name from name attribute (priority 4)', () => {
      const config: NgxSignalFormsConfig = {
        autoAria: true,
      };
      const injector = Injector.create({
        providers: [{ provide: NGX_SIGNAL_FORMS_CONFIG, useValue: config }],
      });

      const element = document.createElement('input');
      element.setAttribute('name', 'phone');

      const fieldName = resolveFieldName(element, injector);
      expect(fieldName).toBe('phone');
    });

    it('should return null when no field name can be resolved (non-strict mode)', () => {
      const config: NgxSignalFormsConfig = {
        strictFieldResolution: false,
      };
      const injector = Injector.create({
        providers: [{ provide: NGX_SIGNAL_FORMS_CONFIG, useValue: config }],
      });

      const element = document.createElement('input');

      const fieldName = resolveFieldName(element, injector);
      expect(fieldName).toBeNull();
    });

    it('should throw error in strict mode when field name cannot be resolved', () => {
      const config: NgxSignalFormsConfig = {
        strictFieldResolution: true,
      };
      const injector = Injector.create({
        providers: [{ provide: NGX_SIGNAL_FORMS_CONFIG, useValue: config }],
      });

      const element = document.createElement('input');

      expect(() => resolveFieldName(element, injector)).toThrow(
        /Cannot resolve field name/,
      );
    });

    it('should log warning in debug mode when field name cannot be resolved', () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {
          // Mock implementation to suppress console output during tests
        });
      const config: NgxSignalFormsConfig = {
        strictFieldResolution: false,
        debug: true,
      };
      const injector = Injector.create({
        providers: [{ provide: NGX_SIGNAL_FORMS_CONFIG, useValue: config }],
      });

      const element = document.createElement('input');

      resolveFieldName(element, injector);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Could not resolve field name'),
        element,
      );

      consoleWarnSpy.mockRestore();
    });

    it('should prioritize data-signal-field over custom resolver', () => {
      const customResolver = vi.fn(() => 'custom-field');
      const config: NgxSignalFormsConfig = {
        fieldNameResolver: () => customResolver, // Wrap in SignalLike
      };
      const injector = Injector.create({
        providers: [{ provide: NGX_SIGNAL_FORMS_CONFIG, useValue: config }],
      });

      const element = document.createElement('input');
      element.setAttribute('data-signal-field', 'explicit-field');

      const fieldName = resolveFieldName(element, injector);
      expect(fieldName).toBe('explicit-field');
      expect(customResolver).not.toHaveBeenCalled();
    });

    it('should handle custom resolver returning null', () => {
      const customResolver = vi.fn(() => null);
      const config: NgxSignalFormsConfig = {
        fieldNameResolver: () => customResolver, // Wrap in SignalLike
      };
      const injector = Injector.create({
        providers: [{ provide: NGX_SIGNAL_FORMS_CONFIG, useValue: config }],
      });

      const element = document.createElement('input');
      element.setAttribute('id', 'fallback-id');

      const fieldName = resolveFieldName(element, injector);
      expect(fieldName).toBe('fallback-id');
      expect(customResolver).toHaveBeenCalled();
    });

    it('should use default config when no config is provided', () => {
      const injector = Injector.create({ providers: [] });

      const element = document.createElement('input');
      element.setAttribute('id', 'email');

      const fieldName = resolveFieldName(element, injector);
      expect(fieldName).toBe('email');
    });
  });

  describe('generateErrorId', () => {
    it('should generate error ID for simple field name', () => {
      expect(generateErrorId('email')).toBe('email-error');
    });

    it('should generate error ID for nested field path', () => {
      expect(generateErrorId('address.city')).toBe('address.city-error');
    });

    it('should generate error ID for array field', () => {
      expect(generateErrorId('items[0].name')).toBe('items[0].name-error');
    });
  });
});
