import { Component, inject, signal } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NGX_SIGNAL_FORM_CONTEXT, NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import type { ErrorDisplayStrategy, NgxSignalFormsConfig } from '../types';
import { NgxSignalFormProviderDirective } from './form-provider.directive';

/**
 * Helper to create complete test config.
 */
const createTestConfig = (
  overrides: Partial<NgxSignalFormsConfig>,
): NgxSignalFormsConfig => ({
  autoAria: true,
  defaultErrorStrategy: 'on-touch',
  strictFieldResolution: false,
  debug: false,
  ...overrides,
});

/**
 * Test suite for NgxSignalFormProviderDirective.
 *
 * **Testing Philosophy:**
 * - Test what users SEE and DO, not implementation details
 * - Focus on observable behavior through the DOM
 * - Avoid accessing directive methods or internal state directly
 */
describe('NgxSignalFormProviderDirective', () => {
  /**
   * Create a minimal mock FieldTree for testing.
   * FieldTree is a signal that returns a FieldState with submitting() and touched() methods.
   *
   * Returns a tuple with the mock form and helper methods to control state.
   */
  const createMockForm = (): [
    FieldTree<unknown>,
    {
      setSubmitting: (value: boolean) => void;
      setTouched: (value: boolean) => void;
    },
  ] => {
    const submittingSignal = signal(false);
    const touchedSignal = signal(false);

    const mockFieldState = {
      submitting: () => submittingSignal(),
      touched: () => touchedSignal(),
    };

    // FieldTree is a signal function that returns FieldState
    const mockFieldTree = signal(mockFieldState);

    const helpers = {
      setSubmitting: (value: boolean) => submittingSignal.set(value),
      setTouched: (value: boolean) => touchedSignal.set(value),
    };

    return [mockFieldTree as FieldTree<unknown>, helpers];
  };

  /**
   * Helper component that displays form context values.
   * This is what users "see" - the observable state.
   */
  @Component({
    selector: 'ngx-signal-form-context-display',

    template: `
      <div data-testid="form-present">{{ hasForm() ? 'yes' : 'no' }}</div>
      <div data-testid="submitted-status">{{ context.submittedStatus() }}</div>
      <div data-testid="error-strategy">{{ context.errorStrategy() }}</div>
    `,
  })
  class ContextDisplayComponent {
    readonly context = inject(NGX_SIGNAL_FORM_CONTEXT);
    readonly hasForm = () => this.context.form !== null;
  }

  describe('Form context provision', () => {
    it('should provide form context to child components', async () => {
      const [mockForm] = createMockForm();

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
      const [mockForm] = createMockForm();

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
      const [mockForm] = createMockForm();

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
              useValue: createTestConfig({ defaultErrorStrategy: 'on-submit' }),
            },
          ],
        },
      );

      expect(screen.getByTestId('error-strategy')).toHaveTextContent(
        'on-submit',
      );
    });

    it('should default to on-touch when no strategy provided', async () => {
      const [mockForm] = createMockForm();

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
      const [mockForm] = createMockForm();
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

  describe('Submission state tracking (user-facing behavior)', () => {
    it('should show submission state as unsubmitted initially', async () => {
      const [mockForm] = createMockForm();

      await render(
        `<form [ngxSignalFormProvider]="form">
          <ngx-signal-form-context-display />
        </form>`,
        {
          imports: [NgxSignalFormProviderDirective, ContextDisplayComponent],
          componentProperties: { form: mockForm },
        },
      );

      // User sees form is not yet submitted
      expect(screen.getByTestId('submitted-status')).toHaveTextContent(
        'unsubmitted',
      );
    });

    it('should track submission completion automatically', async () => {
      const [mockForm, helpers] = createMockForm();

      await render(
        `<form [ngxSignalFormProvider]="form">
          <ngx-signal-form-context-display />
        </form>`,
        {
          imports: [NgxSignalFormProviderDirective, ContextDisplayComponent],
          componentProperties: { form: mockForm },
        },
      );

      expect(screen.getByTestId('submitted-status')).toHaveTextContent(
        'unsubmitted',
      );

      // Simulate submission: submitting goes true
      helpers.setSubmitting(true);
      await vi.waitFor(() => {
        expect(screen.getByTestId('submitted-status')).toHaveTextContent(
          'submitting',
        );
      });

      // Simulate completion: submitting goes false
      helpers.setSubmitting(false);
      await vi.waitFor(() => {
        expect(screen.getByTestId('submitted-status')).toHaveTextContent(
          'submitted',
        );
      });
    });

    it('should persist submitted state across multiple submissions', async () => {
      const [mockForm, helpers] = createMockForm();

      await render(
        `<form [ngxSignalFormProvider]="form">
          <ngx-signal-form-context-display />
        </form>`,
        {
          imports: [NgxSignalFormProviderDirective, ContextDisplayComponent],
          componentProperties: { form: mockForm },
        },
      );

      // First submission
      helpers.setSubmitting(true);
      await vi.waitFor(() => {
        expect(screen.getByTestId('submitted-status')).toHaveTextContent(
          'submitting',
        );
      });
      helpers.setSubmitting(false);
      await vi.waitFor(() => {
        expect(screen.getByTestId('submitted-status')).toHaveTextContent(
          'submitted',
        );
      });

      // Second submission
      helpers.setSubmitting(true);
      await vi.waitFor(() => {
        expect(screen.getByTestId('submitted-status')).toHaveTextContent(
          'submitting',
        );
      });
      helpers.setSubmitting(false);
      await vi.waitFor(() => {
        expect(screen.getByTestId('submitted-status')).toHaveTextContent(
          'submitted',
        );
      });

      // State persists as 'submitted'
      expect(screen.getByTestId('submitted-status')).toHaveTextContent(
        'submitted',
      );
    });

    it('should reset submission state when form is reset', async () => {
      const [mockForm, helpers] = createMockForm();

      await render(
        `<form [ngxSignalFormProvider]="form">
          <ngx-signal-form-context-display />
        </form>`,
        {
          imports: [NgxSignalFormProviderDirective, ContextDisplayComponent],
          componentProperties: { form: mockForm },
        },
      );

      // Submit form
      helpers.setSubmitting(true);
      await vi.waitFor(() => {
        expect(screen.getByTestId('submitted-status')).toHaveTextContent(
          'submitting',
        );
      });
      helpers.setSubmitting(false);
      await vi.waitFor(() => {
        expect(screen.getByTestId('submitted-status')).toHaveTextContent(
          'submitted',
        );
      });

      // Simulate form reset: touched becomes false
      helpers.setTouched(false);
      await vi.waitFor(() => {
        expect(screen.getByTestId('submitted-status')).toHaveTextContent(
          'unsubmitted',
        );
      });
    });

    /**
     * Note: Automatic (ngSubmit) tracking works via effect watching submitting() signal.
     * These tests verify the effect logic by simulating the state transitions that
     * would occur when using Angular's submit() helper.
     */
  });

  describe('Nested forms', () => {
    it('should support nested forms with independent contexts', async () => {
      const [outerForm] = createMockForm();
      const [innerForm] = createMockForm();

      @Component({
        selector: 'ngx-signal-form-outer-display',

        template: `<div data-testid="outer-strategy">
          {{ context.errorStrategy() }}
        </div>`,
      })
      class OuterDisplay {
        readonly context = inject(NGX_SIGNAL_FORM_CONTEXT);
      }

      @Component({
        selector: 'ngx-signal-form-inner-display',

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

      // Each form maintains its own strategy
      expect(screen.getByTestId('outer-strategy')).toHaveTextContent(
        'on-touch',
      );
      expect(screen.getByTestId('inner-strategy')).toHaveTextContent(
        'immediate',
      );
    });
  });
});
