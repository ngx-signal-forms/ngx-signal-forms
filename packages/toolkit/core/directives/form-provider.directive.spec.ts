import { Component, signal, inject, viewChild } from '@angular/core';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@vitest/browser/context';
import type { FieldTree, SubmittedStatus } from '@angular/forms/signals';
import { NgxSignalFormProviderDirective } from './form-provider.directive';
import { NGX_SIGNAL_FORM_CONTEXT, NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import type { NgxSignalFormsConfig, ErrorDisplayStrategy } from '../types';

/**
 * Helper to create complete test config.
 */
const createTestConfig = (
  overrides: Partial<NgxSignalFormsConfig>,
): NgxSignalFormsConfig => ({
  autoAria: true,
  autoTouch: true,
  autoFormBusy: false,
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
   * FieldTree is a signal that returns a FieldState with submittedStatus.
   */
  const createMockForm = (): FieldTree<unknown> => {
    const mockFieldState = {
      submittedStatus: signal<SubmittedStatus>('unsubmitted'),
    };
    // FieldTree is a signal function that returns FieldState
    const mockFieldTree = signal(mockFieldState);
    return mockFieldTree as FieldTree<unknown>;
  };

  /**
   * Helper component that displays form context values.
   * This is what users "see" - the observable state.
   */
  @Component({
    selector: 'ngx-signal-form-context-display',
    standalone: true,
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

  describe('Submission state tracking (user-facing behavior)', () => {
    it('should show submission state as unsubmitted initially', async () => {
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

      // User sees form is not yet submitted
      expect(screen.getByTestId('submitted-status')).toHaveTextContent(
        'unsubmitted',
      );
    });

    it('should allow marking form as submitted programmatically', async () => {
      const mockForm = createMockForm();

      @Component({
        standalone: true,
        imports: [NgxSignalFormProviderDirective, ContextDisplayComponent],
        template: `
          <form [ngxSignalFormProvider]="form">
            <ngx-signal-form-context-display />
            <button type="button" (click)="customSubmit()">Save Draft</button>
          </form>
        `,
      })
      class TestComponent {
        form = mockForm;
        provider = viewChild.required(NgxSignalFormProviderDirective);

        customSubmit() {
          // App code: Mark as submitted for custom submission flows
          // e.g., save draft, multi-step form, custom validation
          this.provider().markAsSubmitted();
        }
      }

      const { fixture } = await render(TestComponent, {});

      expect(screen.getByTestId('submitted-status')).toHaveTextContent(
        'unsubmitted',
      );

      // User clicks custom action
      const draftButton = screen.getByRole('button', { name: /save draft/i });
      await userEvent.click(draftButton);

      // Wait for Angular to detect changes
      fixture.detectChanges();

      // User sees submission state updated
      expect(screen.getByTestId('submitted-status')).toHaveTextContent(
        'submitted',
      );
    });

    it('should allow resetting submission state', async () => {
      const mockForm = createMockForm();

      @Component({
        standalone: true,
        imports: [NgxSignalFormProviderDirective, ContextDisplayComponent],
        template: `
          <form [ngxSignalFormProvider]="form">
            <ngx-signal-form-context-display />
            <button type="button" (click)="submit()">Submit</button>
            <button type="button" (click)="reset()">Reset</button>
          </form>
        `,
      })
      class TestComponent {
        form = mockForm;
        provider = viewChild.required(NgxSignalFormProviderDirective);

        submit() {
          this.provider().markAsSubmitted();
        }

        reset() {
          // App code: Reset after successful save or explicit user action
          this.provider().resetSubmissionState();
        }
      }

      const { fixture } = await render(TestComponent, {});

      // User submits form
      const submitButton = screen.getByRole('button', { name: /submit/i });
      await userEvent.click(submitButton);

      // Wait for Angular to detect changes
      fixture.detectChanges();

      expect(screen.getByTestId('submitted-status')).toHaveTextContent(
        'submitted',
      );

      // User clicks reset (or form is successfully saved)
      const resetButton = screen.getByRole('button', { name: /reset/i });
      await userEvent.click(resetButton);

      // Wait for Angular to detect changes
      fixture.detectChanges();

      // User sees form is no longer marked as submitted
      expect(screen.getByTestId('submitted-status')).toHaveTextContent(
        'unsubmitted',
      );
    });

    /**
     * Note: Automatic (ngSubmit) tracking is tested in E2E tests.
     *
     * The directive listens to (ngSubmit) via host binding, which works in real apps
     * but requires ReactiveFormsModule/FormsModule in unit tests. Since our toolkit
     * is designed to work with Signal Forms (no modules needed), we test the public
     * API (markAsSubmitted/resetSubmissionState) instead.
     *
     * See TESTING_NOTES.md for details.
     */
  });

  describe('Nested forms', () => {
    it('should support nested forms with independent contexts', async () => {
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
