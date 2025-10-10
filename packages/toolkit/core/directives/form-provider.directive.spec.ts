import { Component, signal } from '@angular/core';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { NgxSignalFormProviderDirective } from './form-provider.directive';
import { NGX_SIGNAL_FORM_CONTEXT, NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import type { NgxSignalFormsConfig, ErrorDisplayStrategy } from '../types';
import { inject } from '@angular/core';

/**
 * Test suite for NgxSignalFormProviderDirective.
 *
 * Tests cover:
 * - Form context provision via DI
 * - Submission state tracking
 * - Error strategy management
 * - Form reset handling
 * - Debug mode integration
 */
describe('NgxSignalFormProviderDirective', () => {
  /**
   * Creates a mock Signal Forms instance for testing.
   */
  const createMockForm = () => {
    return signal({
      valid: signal(true),
      invalid: signal(false),
      touched: signal(false),
      dirty: signal(false),
      value: signal({ email: '', password: '' }),
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form context provision', () => {
    it('should provide form context to child components via DI', async () => {
      const mockForm = createMockForm();
      let contextForm: unknown = null;

      @Component({
        selector: 'child-component',
        template: '<div>Child</div>',
        standalone: true,
      })
      class ChildComponent {
        constructor() {
          const context = inject(NGX_SIGNAL_FORM_CONTEXT);
          contextForm = context.form;
        }
      }

      @Component({
        template: `
          <form [ngxSignalFormProvider]="userForm">
            <child-component />
          </form>
        `,
        imports: [NgxSignalFormProviderDirective, ChildComponent],
      })
      class TestComponent {
        userForm = mockForm;
      }

      await render(TestComponent);

      expect(contextForm).toBe(mockForm);
    });

    it('should provide hasSubmitted signal to child components', async () => {
      const mockForm = createMockForm();
      let hasSubmittedFn: () => boolean = () => false;

      @Component({
        selector: 'child-component',
        template: '<div>Child</div>',
        standalone: true,
      })
      class ChildComponent {
        constructor() {
          const context = inject(NGX_SIGNAL_FORM_CONTEXT);
          hasSubmittedFn = context.hasSubmitted;
        }
      }

      @Component({
        template: `
          <form [ngxSignalFormProvider]="userForm">
            <child-component />
          </form>
        `,
        imports: [NgxSignalFormProviderDirective, ChildComponent],
      })
      class TestComponent {
        userForm = mockForm;
      }

      await render(TestComponent);

      expect(hasSubmittedFn()).toBe(false);
    });

    it('should provide errorStrategy signal to child components', async () => {
      const mockForm = createMockForm();
      let errorStrategyFn: () => ErrorDisplayStrategy = () => 'on-touch';

      @Component({
        selector: 'child-component',
        template: '<div>Child</div>',
        standalone: true,
      })
      class ChildComponent {
        constructor() {
          const context = inject(NGX_SIGNAL_FORM_CONTEXT);
          errorStrategyFn = context.errorStrategy;
        }
      }

      @Component({
        template: `
          <form
            [ngxSignalFormProvider]="userForm"
            [errorStrategy]="'immediate'"
          >
            <child-component />
          </form>
        `,
        imports: [NgxSignalFormProviderDirective, ChildComponent],
      })
      class TestComponent {
        userForm = mockForm;
      }

      await render(TestComponent);

      expect(errorStrategyFn()).toBe('immediate');
    });
  });

  describe('Error strategy configuration', () => {
    it('should use provided error strategy', async () => {
      const mockForm = createMockForm();
      let errorStrategyFn: () => ErrorDisplayStrategy = () => 'on-touch';

      @Component({
        selector: 'child-component',
        template: '<div>Child</div>',
        standalone: true,
      })
      class ChildComponent {
        constructor() {
          const context = inject(NGX_SIGNAL_FORM_CONTEXT);
          errorStrategyFn = context.errorStrategy;
        }
      }

      @Component({
        template: `
          <form
            [ngxSignalFormProvider]="userForm"
            [errorStrategy]="'on-submit'"
          >
            <child-component />
          </form>
        `,
        imports: [NgxSignalFormProviderDirective, ChildComponent],
      })
      class TestComponent {
        userForm = mockForm;
      }

      await render(TestComponent);

      expect(errorStrategyFn()).toBe('on-submit');
    });

    it('should default to on-touch when no strategy provided and no global config', async () => {
      const mockForm = createMockForm();
      let errorStrategyFn: () => ErrorDisplayStrategy = () => 'on-touch';

      @Component({
        selector: 'child-component',
        template: '<div>Child</div>',
        standalone: true,
      })
      class ChildComponent {
        constructor() {
          const context = inject(NGX_SIGNAL_FORM_CONTEXT);
          errorStrategyFn = context.errorStrategy;
        }
      }

      @Component({
        template: `
          <form [ngxSignalFormProvider]="userForm">
            <child-component />
          </form>
        `,
        imports: [NgxSignalFormProviderDirective, ChildComponent],
      })
      class TestComponent {
        userForm = mockForm;
      }

      await render(TestComponent);

      expect(errorStrategyFn()).toBe('on-touch');
    });

    it('should use global config default error strategy when provided', async () => {
      const mockForm = createMockForm();
      let errorStrategyFn: () => ErrorDisplayStrategy = () => 'on-touch';

      @Component({
        selector: 'child-component',
        template: '<div>Child</div>',
        standalone: true,
      })
      class ChildComponent {
        constructor() {
          const context = inject(NGX_SIGNAL_FORM_CONTEXT);
          errorStrategyFn = context.errorStrategy;
        }
      }

      @Component({
        template: `
          <form [ngxSignalFormProvider]="userForm">
            <child-component />
          </form>
        `,
        imports: [NgxSignalFormProviderDirective, ChildComponent],
      })
      class TestComponent {
        userForm = mockForm;
      }

      await render(TestComponent, {
        providers: [
          {
            provide: NGX_SIGNAL_FORMS_CONFIG,
            useValue: {
              defaultErrorStrategy: signal('immediate'),
            } as unknown as NgxSignalFormsConfig,
          },
        ],
      });

      expect(errorStrategyFn()).toBe('immediate');
    });

    it('should allow strategy to be changed dynamically', async () => {
      const mockForm = createMockForm();
      const strategy = signal<ErrorDisplayStrategy>('on-touch');
      let errorStrategyFn: () => ErrorDisplayStrategy = () => 'on-touch';

      @Component({
        selector: 'child-component',
        template: '<div>Child</div>',
        standalone: true,
      })
      class ChildComponent {
        constructor() {
          const context = inject(NGX_SIGNAL_FORM_CONTEXT);
          errorStrategyFn = context.errorStrategy;
        }
      }

      @Component({
        template: `
          <form [ngxSignalFormProvider]="userForm" [errorStrategy]="strategy()">
            <child-component />
          </form>
        `,
        imports: [NgxSignalFormProviderDirective, ChildComponent],
      })
      class TestComponent {
        userForm = mockForm;
        strategy = strategy;
      }

      const { fixture } = await render(TestComponent);

      expect(errorStrategyFn()).toBe('on-touch');

      strategy.set('immediate');
      fixture.detectChanges();

      expect(errorStrategyFn()).toBe('immediate');
    });
  });

  describe('Submission state management', () => {
    it('should initialize with hasSubmitted as false', async () => {
      const mockForm = createMockForm();

      @Component({
        template: `
          <form [ngxSignalFormProvider]="userForm">
            <div>{{ directive.hasSubmitted() }}</div>
          </form>
        `,
        imports: [NgxSignalFormProviderDirective],
      })
      class TestComponent {
        userForm = mockForm;
        directive!: NgxSignalFormProviderDirective;
      }

      await render(TestComponent);

      const formElement = screen.getByText('false');
      expect(formElement).toBeTruthy();
    });

    it('should allow marking form as submitted via markAsSubmitted method', async () => {
      const mockForm = createMockForm();
      let directiveInstance: NgxSignalFormProviderDirective | undefined;

      @Component({
        selector: 'child-component',
        template: '<div>Child</div>',
        standalone: true,
      })
      class ChildComponent {
        constructor() {
          directiveInstance = inject(NgxSignalFormProviderDirective);
        }
      }

      @Component({
        template: `
          <form [ngxSignalFormProvider]="userForm">
            <child-component />
            <div data-testid="submitted">{{ directive.hasSubmitted() }}</div>
          </form>
        `,
        imports: [NgxSignalFormProviderDirective, ChildComponent],
      })
      class TestComponent {
        userForm = mockForm;
        directive = inject(NgxSignalFormProviderDirective);
      }

      const { fixture } = await render(TestComponent);

      expect(screen.getByTestId('submitted').textContent).toBe('false');

      directiveInstance?.markAsSubmitted();
      fixture.detectChanges();

      expect(screen.getByTestId('submitted').textContent).toBe('true');
    });

    it('should allow resetting submission state via resetSubmissionState method', async () => {
      const mockForm = createMockForm();
      let directiveInstance: NgxSignalFormProviderDirective | undefined;

      @Component({
        selector: 'child-component',
        template: '<div>Child</div>',
        standalone: true,
      })
      class ChildComponent {
        constructor() {
          directiveInstance = inject(NgxSignalFormProviderDirective);
        }
      }

      @Component({
        template: `
          <form [ngxSignalFormProvider]="userForm">
            <child-component />
            <div data-testid="submitted">{{ directive.hasSubmitted() }}</div>
          </form>
        `,
        imports: [NgxSignalFormProviderDirective, ChildComponent],
      })
      class TestComponent {
        userForm = mockForm;
        directive = inject(NgxSignalFormProviderDirective);
      }

      const { fixture } = await render(TestComponent);

      directiveInstance?.markAsSubmitted();
      fixture.detectChanges();
      expect(screen.getByTestId('submitted').textContent).toBe('true');

      directiveInstance?.resetSubmissionState();
      fixture.detectChanges();
      expect(screen.getByTestId('submitted').textContent).toBe('false');
    });
  });

  describe('Debug mode integration', () => {
    it('should log form state when debug is enabled', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {
        // Mock implementation
      });
      const mockForm = createMockForm();

      @Component({
        template: `
          <form [ngxSignalFormProvider]="userForm">
            <div>Form</div>
          </form>
        `,
        imports: [NgxSignalFormProviderDirective],
      })
      class TestComponent {
        userForm = mockForm;
      }

      await render(TestComponent, {
        providers: [
          {
            provide: NGX_SIGNAL_FORMS_CONFIG,
            useValue: { debug: true } as NgxSignalFormsConfig,
          },
        ],
      });

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

      @Component({
        template: `
          <form [ngxSignalFormProvider]="userForm">
            <div>Form</div>
          </form>
        `,
        imports: [NgxSignalFormProviderDirective],
      })
      class TestComponent {
        userForm = mockForm;
      }

      await render(TestComponent, {
        providers: [
          {
            provide: NGX_SIGNAL_FORMS_CONFIG,
            useValue: { debug: false } as NgxSignalFormsConfig,
          },
        ],
      });

      expect(consoleLogSpy).not.toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });
  });

  describe('Integration scenarios', () => {
    it('should work with multiple child components accessing the same context', async () => {
      const mockForm = createMockForm();
      const contexts: unknown[] = [];

      @Component({
        selector: 'child-one',
        template: '<div>Child One</div>',
        standalone: true,
      })
      class ChildOne {
        constructor() {
          contexts.push(inject(NGX_SIGNAL_FORM_CONTEXT));
        }
      }

      @Component({
        selector: 'child-two',
        template: '<div>Child Two</div>',
        standalone: true,
      })
      class ChildTwo {
        constructor() {
          contexts.push(inject(NGX_SIGNAL_FORM_CONTEXT));
        }
      }

      @Component({
        template: `
          <form [ngxSignalFormProvider]="userForm">
            <child-one />
            <child-two />
          </form>
        `,
        imports: [NgxSignalFormProviderDirective, ChildOne, ChildTwo],
      })
      class TestComponent {
        userForm = mockForm;
      }

      await render(TestComponent);

      expect(contexts).toHaveLength(2);
      expect(contexts[0]).toBeTruthy();
      expect(contexts[1]).toBeTruthy();
    });

    it('should support nested forms with different contexts', async () => {
      const outerForm = createMockForm();
      const innerForm = createMockForm();
      let outerContext: unknown = null;
      let innerContext: unknown = null;

      @Component({
        selector: 'outer-child',
        template: '<div>Outer</div>',
        standalone: true,
      })
      class OuterChild {
        constructor() {
          outerContext = inject(NGX_SIGNAL_FORM_CONTEXT);
        }
      }

      @Component({
        selector: 'inner-child',
        template: '<div>Inner</div>',
        standalone: true,
      })
      class InnerChild {
        constructor() {
          innerContext = inject(NGX_SIGNAL_FORM_CONTEXT);
        }
      }

      @Component({
        template: `
          <form [ngxSignalFormProvider]="outer">
            <outer-child />
            <div [ngxSignalFormProvider]="inner">
              <inner-child />
            </div>
          </form>
        `,
        imports: [NgxSignalFormProviderDirective, OuterChild, InnerChild],
      })
      class TestComponent {
        outer = outerForm;
        inner = innerForm;
      }

      await render(TestComponent);

      expect(outerContext).toBeTruthy();
      expect(innerContext).toBeTruthy();
      expect(outerContext).not.toBe(innerContext);
    });
  });

  describe('Edge cases', () => {
    it('should handle form being replaced with a different instance', async () => {
      const initialForm = createMockForm();
      const formSignal = signal(initialForm);
      let contextForm: unknown = null;

      @Component({
        selector: 'child-component',
        template: '<div>Child</div>',
        standalone: true,
      })
      class ChildComponent {
        constructor() {
          const context = inject(NGX_SIGNAL_FORM_CONTEXT);
          contextForm = context.form;
        }
      }

      @Component({
        template: `
          <form [ngxSignalFormProvider]="currentForm()">
            <child-component />
          </form>
        `,
        imports: [NgxSignalFormProviderDirective, ChildComponent],
      })
      class TestComponent {
        currentForm = formSignal;
      }

      const { fixture } = await render(TestComponent);

      expect(contextForm).toBe(initialForm);

      const newForm = createMockForm();
      formSignal.set(newForm);
      fixture.detectChanges();

      expect(contextForm).toBe(newForm);
    });
  });
});
