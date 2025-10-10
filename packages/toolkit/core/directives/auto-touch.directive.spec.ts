import { Component, signal } from '@angular/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { NgxSignalFormAutoTouchDirective } from './auto-touch.directive';
import { NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import type { NgxSignalFormsConfig } from '../types';

/**
 * Test suite for NgxSignalFormAutoTouchDirective.
 *
 * Tests cover:
 * - Auto-touch on blur for supported input types
 * - Exclusion of radio and checkbox inputs
 * - Opt-out behavior with ngxSignalFormAutoTouchDisabled
 * - Integration with form config (debug mode)
 * - Edge cases (null control, missing markAsTouched method)
 */
describe('NgxSignalFormAutoTouchDirective', () => {
  /**
   * Creates a mock field control for testing.
   * Mimics the structure of a Signal Forms control.
   */
  const createMockControl = (touched = false) => {
    const markAsTouched = vi.fn();
    const fieldState = {
      touched: signal(touched),
      markAsTouched,
      invalid: signal(false),
      valid: signal(true),
      value: signal(''),
    };
    return signal(() => fieldState);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Auto-touch behavior', () => {
    it('should mark field as touched on blur for text input', async () => {
      const mockControl = createMockControl();
      const markAsTouchedSpy = mockControl()().markAsTouched;

      @Component({
        template: '<input id="email" type="text" [control]="emailControl()" />',
        imports: [NgxSignalFormAutoTouchDirective],
      })
      class TestComponent {
        emailControl = mockControl;
      }

      await render(TestComponent);

      const input = screen.getByRole('textbox');
      await input.focus();
      await input.blur();

      expect(markAsTouchedSpy).toHaveBeenCalledOnce();
    });

    it('should mark field as touched on blur for textarea', async () => {
      const mockControl = createMockControl();
      const markAsTouchedSpy = mockControl()().markAsTouched;

      @Component({
        template: '<textarea id="bio" [control]="bioControl()"></textarea>',
        imports: [NgxSignalFormAutoTouchDirective],
      })
      class TestComponent {
        bioControl = mockControl;
      }

      await render(TestComponent);

      const textarea = screen.getByRole('textbox');
      await textarea.focus();
      await textarea.blur();

      expect(markAsTouchedSpy).toHaveBeenCalledOnce();
    });

    it('should mark field as touched on blur for select', async () => {
      const mockControl = createMockControl();
      const markAsTouchedSpy = mockControl()().markAsTouched;

      @Component({
        template: `
          <select id="country" [control]="countryControl()">
            <option value="us">USA</option>
            <option value="uk">UK</option>
          </select>
        `,
        imports: [NgxSignalFormAutoTouchDirective],
      })
      class TestComponent {
        countryControl = mockControl;
      }

      await render(TestComponent);

      const select = screen.getByRole('combobox');
      await select.focus();
      await select.blur();

      expect(markAsTouchedSpy).toHaveBeenCalledOnce();
    });

    it('should mark field as touched on blur for email input', async () => {
      const mockControl = createMockControl();
      const markAsTouchedSpy = mockControl()().markAsTouched;

      @Component({
        template:
          '<input id="email" type="email" [control]="emailControl()" />',
        imports: [NgxSignalFormAutoTouchDirective],
      })
      class TestComponent {
        emailControl = mockControl;
      }

      await render(TestComponent);

      const input = screen.getByRole('textbox');
      await input.focus();
      await input.blur();

      expect(markAsTouchedSpy).toHaveBeenCalledOnce();
    });

    it('should mark field as touched multiple times on repeated blur', async () => {
      const mockControl = createMockControl();
      const markAsTouchedSpy = mockControl()().markAsTouched;

      @Component({
        template: '<input id="name" type="text" [control]="nameControl()" />',
        imports: [NgxSignalFormAutoTouchDirective],
      })
      class TestComponent {
        nameControl = mockControl;
      }

      await render(TestComponent);

      const input = screen.getByRole('textbox');

      // First blur
      await input.focus();
      await input.blur();

      // Second blur
      await input.focus();
      await input.blur();

      expect(markAsTouchedSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Element exclusions', () => {
    it('should NOT apply to radio inputs (excluded by selector)', async () => {
      const mockControl = createMockControl();
      const markAsTouchedSpy = mockControl()().markAsTouched;

      @Component({
        template:
          '<input id="option" type="radio" [control]="optionControl()" name="choice" />',
        imports: [NgxSignalFormAutoTouchDirective],
      })
      class TestComponent {
        optionControl = mockControl;
      }

      await render(TestComponent);

      const radio = screen.getByRole('radio');
      await radio.focus();
      await radio.blur();

      expect(markAsTouchedSpy).not.toHaveBeenCalled();
    });

    it('should NOT apply to checkbox inputs (excluded by selector)', async () => {
      const mockControl = createMockControl();
      const markAsTouchedSpy = mockControl()().markAsTouched;

      @Component({
        template:
          '<input id="agree" type="checkbox" [control]="agreeControl()" />',
        imports: [NgxSignalFormAutoTouchDirective],
      })
      class TestComponent {
        agreeControl = mockControl;
      }

      await render(TestComponent);

      const checkbox = screen.getByRole('checkbox');
      await checkbox.focus();
      await checkbox.blur();

      expect(markAsTouchedSpy).not.toHaveBeenCalled();
    });
  });

  describe('Opt-out behavior', () => {
    it('should NOT apply when ngxSignalFormAutoTouchDisabled attribute is present', async () => {
      const mockControl = createMockControl();
      const markAsTouchedSpy = mockControl()().markAsTouched;

      @Component({
        template:
          '<input id="custom" [control]="customControl()" ngxSignalFormAutoTouchDisabled />',
        imports: [NgxSignalFormAutoTouchDirective],
      })
      class TestComponent {
        customControl = mockControl;
      }

      await render(TestComponent);

      const input = screen.getByRole('textbox');
      await input.focus();
      await input.blur();

      expect(markAsTouchedSpy).not.toHaveBeenCalled();
    });

    it('should support opt-out for textarea', async () => {
      const mockControl = createMockControl();
      const markAsTouchedSpy = mockControl()().markAsTouched;

      @Component({
        template:
          '<textarea id="notes" [control]="notesControl()" ngxSignalFormAutoTouchDisabled></textarea>',
        imports: [NgxSignalFormAutoTouchDirective],
      })
      class TestComponent {
        notesControl = mockControl;
      }

      await render(TestComponent);

      const textarea = screen.getByRole('textbox');
      await textarea.focus();
      await textarea.blur();

      expect(markAsTouchedSpy).not.toHaveBeenCalled();
    });

    it('should support opt-out for select', async () => {
      const mockControl = createMockControl();
      const markAsTouchedSpy = mockControl()().markAsTouched;

      @Component({
        template: `
          <select
            id="status"
            [control]="statusControl()"
            ngxSignalFormAutoTouchDisabled
          >
            <option value="active">Active</option>
          </select>
        `,
        imports: [NgxSignalFormAutoTouchDirective],
      })
      class TestComponent {
        statusControl = mockControl;
      }

      await render(TestComponent);

      const select = screen.getByRole('combobox');
      await select.focus();
      await select.blur();

      expect(markAsTouchedSpy).not.toHaveBeenCalled();
    });
  });

  describe('Integration with form config', () => {
    it('should log debug messages when debug is enabled', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
        // Mock implementation
      });
      const mockControl = createMockControl();

      @Component({
        template: '<input id="test" [control]="testControl()" />',
        imports: [NgxSignalFormAutoTouchDirective],
      })
      class TestComponent {
        testControl = mockControl;
      }

      await render(TestComponent, {
        providers: [
          {
            provide: NGX_SIGNAL_FORMS_CONFIG,
            useValue: { debug: true } as NgxSignalFormsConfig,
          },
        ],
      });

      const input = screen.getByRole('textbox');
      await input.focus();
      await input.blur();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[NgxSignalFormAutoTouchDirective] Field marked as touched',
      );

      consoleLogSpy.mockRestore();
    });

    it('should NOT log debug messages when debug is disabled', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
        // Mock implementation
      });
      const mockControl = createMockControl();

      @Component({
        template: '<input id="test" [control]="testControl()" />',
        imports: [NgxSignalFormAutoTouchDirective],
      })
      class TestComponent {
        testControl = mockControl;
      }

      await render(TestComponent, {
        providers: [
          {
            provide: NGX_SIGNAL_FORMS_CONFIG,
            useValue: { debug: false } as NgxSignalFormsConfig,
          },
        ],
      });

      const input = screen.getByRole('textbox');
      await input.focus();
      await input.blur();

      expect(consoleLogSpy).not.toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should use default config when no provider is given', async () => {
      const mockControl = createMockControl();
      const markAsTouchedSpy = mockControl()().markAsTouched;

      @Component({
        template: '<input id="email" [control]="emailControl()" />',
        imports: [NgxSignalFormAutoTouchDirective],
      })
      class TestComponent {
        emailControl = mockControl;
      }

      // No custom providers - should use defaults
      await render(TestComponent);

      const input = screen.getByRole('textbox');
      await input.focus();
      await input.blur();

      expect(markAsTouchedSpy).toHaveBeenCalledOnce();
    });
  });

  describe('Edge cases', () => {
    it('should handle null control gracefully', async () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {
          // Mock implementation
        });

      @Component({
        template: '<input id="email" [control]="emailControl()" />',
        imports: [NgxSignalFormAutoTouchDirective],
      })
      class TestComponent {
        emailControl = signal(null);
      }

      await render(TestComponent, {
        providers: [
          {
            provide: NGX_SIGNAL_FORMS_CONFIG,
            useValue: { debug: true } as NgxSignalFormsConfig,
          },
        ],
      });

      const input = screen.getByRole('textbox');
      await input.focus();
      await input.blur();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[NgxSignalFormAutoTouchDirective] No control found',
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle control without markAsTouched method gracefully', async () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {
          // Mock implementation
        });

      @Component({
        template: '<input id="email" [control]="emailControl()" />',
        imports: [NgxSignalFormAutoTouchDirective],
      })
      class TestComponent {
        emailControl = signal(() => ({
          touched: signal(false),
          // markAsTouched is missing
        }));
      }

      await render(TestComponent, {
        providers: [
          {
            provide: NGX_SIGNAL_FORMS_CONFIG,
            useValue: { debug: true } as NgxSignalFormsConfig,
          },
        ],
      });

      const input = screen.getByRole('textbox');
      await input.focus();
      await input.blur();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[NgxSignalFormAutoTouchDirective] Field state does not support markAsTouched()',
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle control returning undefined field state', async () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {
          // Mock implementation
        });

      @Component({
        template: '<input id="email" [control]="emailControl()" />',
        imports: [NgxSignalFormAutoTouchDirective],
      })
      class TestComponent {
        emailControl = signal(() => undefined);
      }

      await render(TestComponent, {
        providers: [
          {
            provide: NGX_SIGNAL_FORMS_CONFIG,
            useValue: { debug: true } as NgxSignalFormsConfig,
          },
        ],
      });

      const input = screen.getByRole('textbox');
      await input.focus();
      await input.blur();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[NgxSignalFormAutoTouchDirective] Field state does not support markAsTouched()',
      );

      consoleWarnSpy.mockRestore();
    });
  });
});
