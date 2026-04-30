import { Component, computed, input, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { provideFormFieldErrorRenderer } from '@ngx-signal-forms/toolkit';
import { NgxFormFieldWrapper } from './form-field-wrapper';

type MockFieldState = {
  invalid: () => boolean;
  touched: () => boolean;
  errors: () => { kind: string; message: string }[];
  hidden: () => boolean;
};

/**
 * Minimal stub error renderer used as the custom renderer under test.
 *
 * Emits a known marker element so the integration test can assert that the
 * wrapper instantiated this component via the renderer token, rather than the
 * default NgxFormFieldError.
 */
@Component({
  selector: 'stub-error-renderer',
  template: `<span data-testid="stub-error">STUB-ERR:{{ errorCount() }}</span>`,
  standalone: true,
})
class StubErrorRenderer {
  /**
   * Receives the FieldTree value from the wrapper's errorRendererInputs().
   * The FieldTree is itself a signal; calling it returns the field state.
   */
  readonly formField = input<unknown>();
  readonly strategy = input<unknown>();
  readonly submittedStatus = input<unknown>();

  /**
   * Reads the error count through the formField signal to verify the wrapper
   * passed the input through the renderer contract correctly.
   */
  protected readonly errorCount = computed(() => {
    const fieldTree = this.formField() as (() => MockFieldState) | undefined;
    if (!fieldTree) return 0;
    return fieldTree().errors().length;
  });
}

describe('form-field wrapper renderer seam', () => {
  it('renders the configured error renderer in place of the default', async () => {
    const field = signal<MockFieldState>({
      invalid: () => true,
      touched: () => true,
      errors: () => [{ kind: 'required', message: 'required' }],
      hidden: () => false,
    });

    @Component({
      selector: 'host-component',
      standalone: true,
      imports: [NgxFormFieldWrapper],
      template: `
        <ngx-form-field-wrapper
          [formField]="field"
          fieldName="email"
          strategy="immediate"
        >
          <label for="email">Email</label>
          <input id="email" />
        </ngx-form-field-wrapper>
      `,
    })
    class HostComponent {
      readonly field = field;
    }

    await render(HostComponent, {
      providers: [
        provideFormFieldErrorRenderer({ component: StubErrorRenderer }),
      ],
    });

    // The stub renderer's marker text appears in the DOM, proving the wrapper
    // instantiated the configured component instead of the default
    // NgxFormFieldError. The error count probe confirms the wrapper passed
    // the formField input through the renderer contract correctly.
    const stub = await screen.findByTestId('stub-error');
    expect(stub.textContent?.trim()).toBe('STUB-ERR:1');
  });
});
