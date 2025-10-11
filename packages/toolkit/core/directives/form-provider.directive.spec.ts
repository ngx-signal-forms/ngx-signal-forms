import { Component, signal, inject } from '@angular/core';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { NgxSignalFormProviderDirective } from './form-provider.directive';
import { NGX_SIGNAL_FORM_CONTEXT, NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import type { NgxSignalFormsConfig, ErrorDisplayStrategy } from '../types';

/**
 * Test suite for NgxSignalFormProviderDirective.
 *
 * Tests observable behavior:
 * - Form context is provided to children via DI
 * - Error strategy is configurable
 * - Debug mode logs form state
 * - Nested forms have separate contexts
 */
describe('NgxSignalFormProviderDirective', () => {
  /**
   * Creates a mock Signal Forms instance for testing.
   */
  const createMockForm = () => ({
    email: signal(''),
    password: signal(''),
  });

  /**
   * Helper component that displays form context values.
   * Used to verify that the directive provides context correctly.
   */
  @Component({
    selector: 'ngx-signal-form-context-display',
    standalone: true,
    template: `
      <div data-testid="form-present">{{ hasForm() ? 'yes' : 'no' }}</div>
      <div data-testid="has-submitted">{{ context.hasSubmitted() }}</div>
      <div data-testid="error-strategy">{{ context.errorStrategy() }}</div>
    `,
  })
  class ContextDisplayComponent {
    readonly context = inject(NGX_SIGNAL_FORM_CONTEXT);
    readonly hasForm = () => this.context.form !== null;
  }

  describe('Form context provision', () => {
    it('should provide form context to child components', async () => {
      const mockForm = createMockForm();

      await render(
        `<form [ngxSignalFormProvider]="form">
          <ngx-signal-form-context-display />
        </form>`,
        {
          imports: [NgxSignalFormProviderDirective, ContextDisplayComponent],
          componentProperties: { form: mockForm },
        },
      );

      expect(screen.getByTestId('form-present')).toHaveTextContent('yes');
    });
  });

  describe('Error strategy configuration', () => {
    it('should use immediate error strategy when specified', async () => {
      const mockForm = createMockForm();

      await render(
        `<form [ngxSignalFormProvider]="form" [errorStrategy]="'immediate'">
          <ngx-signal-form-context-display />
        </form>`,
        {
          imports: [NgxSignalFormProviderDirective, ContextDisplayComponent],
          componentProperties: { form: mockForm },
        },
      );

      expect(screen.getByTestId('error-strategy')).toHaveTextContent(
        'immediate',
      );
    });

    it('should inherit strategy from global config', async () => {
      const mockForm = createMockForm();

      await render(
        `<form [ngxSignalFormProvider]="form">
            <ngx-signal-form-context-display />
          </form>`,
        {
          imports: [NgxSignalFormProviderDirective, ContextDisplayComponent],
          componentProperties: { form: mockForm },
          providers: [
            {
              provide: NGX_SIGNAL_FORMS_CONFIG,
              useValue: {
                defaultErrorStrategy: 'on-submit',
              } satisfies NgxSignalFormsConfig,
            },
          ],
        },
      );

      expect(screen.getByTestId('error-strategy')).toHaveTextContent(
        'on-submit',
      );
    });

    it('should use on-submit error strategy when specified', async () => {
      const mockForm = createMockForm();

      await render(
        `<form [ngxSignalFormProvider]="form" [errorStrategy]="'on-submit'">
          <ngx-signal-form-context-display />
        </form>`,
        {
          imports: [NgxSignalFormProviderDirective, ContextDisplayComponent],
          componentProperties: { form: mockForm },
        },
      );

      expect(screen.getByTestId('error-strategy')).toHaveTextContent(
        'on-submit',
      );
    });

    it('should default to on-touch when no strategy provided', async () => {
      const mockForm = createMockForm();

      await render(
        `<form [ngxSignalFormProvider]="form">
          <ngx-signal-form-context-display />
        </form>`,
        {
          imports: [NgxSignalFormProviderDirective, ContextDisplayComponent],
          componentProperties: { form: mockForm },
        },
      );

      expect(screen.getByTestId('error-strategy')).toHaveTextContent(
        'on-touch',
      );
    });

    it('should allow strategy to be changed dynamically', async () => {
      const mockForm = createMockForm();
      const strategy: ErrorDisplayStrategy = 'on-touch';

      const { rerender } = await render(
        `<form [ngxSignalFormProvider]="form" [errorStrategy]="strategy">
          <ngx-signal-form-context-display />
        </form>`,
        {
          imports: [NgxSignalFormProviderDirective, ContextDisplayComponent],
          componentProperties: { form: mockForm, strategy },
        },
      );

      expect(screen.getByTestId('error-strategy')).toHaveTextContent(
        'on-touch',
      );

      await rerender({
        componentProperties: { form: mockForm, strategy: 'immediate' },
      });

      expect(screen.getByTestId('error-strategy')).toHaveTextContent(
        'immediate',
      );
    });
  });

  describe('Submission state', () => {
    it('should initialize with hasSubmitted as false', async () => {
      const mockForm = createMockForm();

      await render(
        `<form [ngxSignalFormProvider]="form">
          <ngx-signal-form-context-display />
        </form>`,
        {
          imports: [NgxSignalFormProviderDirective, ContextDisplayComponent],
          componentProperties: { form: mockForm },
        },
      );

      expect(screen.getByTestId('has-submitted')).toHaveTextContent('false');
    });
  });

  describe('Debug mode integration', () => {
    it('should log form state when debug is enabled', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
        // Mock implementation
      });
      const mockForm = createMockForm();

      await render(
        `<form [ngxSignalFormProvider]="form">
          <div>Form</div>
        </form>`,
        {
          imports: [NgxSignalFormProviderDirective],
          componentProperties: { form: mockForm },
          providers: [
            {
              provide: NGX_SIGNAL_FORMS_CONFIG,
              useValue: { debug: true } as NgxSignalFormsConfig,
            },
          ],
        },
      );

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[NgxSignalFormProviderDirective] Form state:',
        expect.objectContaining({
          form: mockForm,
          hasSubmitted: false,
        }),
      );

      consoleLogSpy.mockRestore();
    });

    it('should NOT log form state when debug is disabled', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
        // Mock implementation
      });
      const mockForm = createMockForm();

      await render(
        `<form [ngxSignalFormProvider]="form">
          <div>Form</div>
        </form>`,
        {
          imports: [NgxSignalFormProviderDirective],
          componentProperties: { form: mockForm },
          providers: [
            {
              provide: NGX_SIGNAL_FORMS_CONFIG,
              useValue: { debug: false } as NgxSignalFormsConfig,
            },
          ],
        },
      );

      expect(consoleLogSpy).not.toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });
  });

  describe('Integration scenarios', () => {
    it('should support nested forms with different contexts', async () => {
      const outerForm = createMockForm();
      const innerForm = createMockForm();

      @Component({
        selector: 'ngx-signal-form-outer-display',
        standalone: true,
        template: `<div data-testid="outer-strategy">
          {{ context.errorStrategy() }}
        </div>`,
      })
      class OuterDisplay {
        readonly context = inject(NGX_SIGNAL_FORM_CONTEXT);
      }

      @Component({
        selector: 'ngx-signal-form-inner-display',
        standalone: true,
        template: `<div data-testid="inner-strategy">
          {{ context.errorStrategy() }}
        </div>`,
      })
      class InnerDisplay {
        readonly context = inject(NGX_SIGNAL_FORM_CONTEXT);
      }

      await render(
        `<form [ngxSignalFormProvider]="outer" [errorStrategy]="'on-touch'">
          <ngx-signal-form-outer-display />
          <div [ngxSignalFormProvider]="inner" [errorStrategy]="'immediate'">
            <ngx-signal-form-inner-display />
          </div>
        </form>`,
        {
          imports: [NgxSignalFormProviderDirective, OuterDisplay, InnerDisplay],
          componentProperties: { outer: outerForm, inner: innerForm },
        },
      );

      expect(screen.getByTestId('outer-strategy')).toHaveTextContent(
        'on-touch',
      );
      expect(screen.getByTestId('inner-strategy')).toHaveTextContent(
        'immediate',
      );
    });
  });
});
