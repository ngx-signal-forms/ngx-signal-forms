import { Component, inputBinding, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  NGX_SIGNAL_FORMS_CONFIG,
  NgxSignalFormControlSemanticsDirective,
  provideNgxSignalFormControlPresets,
  provideNgxSignalFormControlPresetsForComponent,
} from '@ngx-signal-forms/toolkit';
import { DEFAULT_NGX_SIGNAL_FORMS_CONFIG } from '@ngx-signal-forms/toolkit/core';
import { render, screen } from '@testing-library/angular';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NgxSignalFormFieldWrapperComponent as NgxSignalFormWrapperComponent } from './form-field-wrapper.component';

type MockValidationError = {
  kind?: string;
  key?: string;
  message: string;
};

type MockFieldState = {
  invalid: () => boolean;
  touched: () => boolean;
  errors: () => MockValidationError[];
};

/**
 * Test suite for NgxSignalFormWrapperComponent.
 *
 * Tests cover:
 * - Basic rendering and structure
 * - Content projection (ng-content)
 * - CSS custom property support
 * - Integration with various form elements
 * - Accessibility preservation
 *
 * Uses template-based rendering following Angular Testing Library best practices.
 */

/**
 * Creates a mock field state that matches Signal Forms field structure.
 * Returns a signal containing field state with invalid, touched, and errors methods.
 */
const createMockFieldState = () =>
  signal<MockFieldState>({
    invalid: () => false,
    touched: () => false,
    errors: () => [],
  });

const createWrapperComponent = (
  field: ReturnType<typeof createMockFieldState> = createMockFieldState(),
  fieldName?: string,
): NgxSignalFormWrapperComponent => {
  const bindings = [inputBinding('formField', () => field)];

  if (fieldName !== undefined) {
    bindings.push(inputBinding('fieldName', () => fieldName));
  }

  const fixture = TestBed.createComponent(NgxSignalFormWrapperComponent, {
    bindings,
  });

  return fixture.componentInstance;
};

describe('NgxSignalFormWrapperComponent', () => {
  describe('Field name generation', () => {
    it('should use explicit fieldName when provided', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="custom-email">
          <label for="email">Email</label>
          <input id="email" type="email" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      // When explicit fieldName is provided, error component should receive it
      const errorComponent = container.querySelector('ngx-form-field-error');
      expect(errorComponent).toBeTruthy();

      // The error ID should be based on the explicit fieldName
      const errorContainer = container.querySelector(
        '[id="custom-email-error"]',
      );
      expect(errorContainer).toBeTruthy();
    });

    it('should throw when neither fieldName nor bound control id is provided', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      const component = createWrapperComponent(invalidField);

      expect(() => component.resolvedFieldName()).toThrow(
        /Could not resolve a deterministic field name/u,
      );
    });

    it('should generate different unique IDs for multiple components without explicit fieldName', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      const { container } = await render(
        `<div>
          <ngx-signal-form-field-wrapper [formField]="field1">
            <input id="input1" type="text" />
          </ngx-signal-form-field-wrapper>
          <ngx-signal-form-field-wrapper [formField]="field2">
            <input id="input2" type="text" />
          </ngx-signal-form-field-wrapper>
          <ngx-signal-form-field-wrapper [formField]="field3">
            <input id="input3" type="text" />
          </ngx-signal-form-field-wrapper>
        </div>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field1: invalidField,
            field2: invalidField,
            field3: invalidField,
          },
        },
      );

      const errorComponents = container.querySelectorAll(
        'ngx-form-field-error',
      );
      expect(errorComponents).toHaveLength(3);

      // Each error element should have ID derived from input's id attribute
      expect(container.querySelector('[id="input1-error"]')).toBeTruthy();
      expect(container.querySelector('[id="input2-error"]')).toBeTruthy();
      expect(container.querySelector('[id="input3-error"]')).toBeTruthy();
    });

    it('should allow mixing explicit and auto-derived fieldNames', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      const { container } = await render(
        `<div>
          <ngx-signal-form-field-wrapper [formField]="field1" fieldName="email">
            <input id="email" type="email" />
          </ngx-signal-form-field-wrapper>
          <ngx-signal-form-field-wrapper [formField]="field2">
            <input id="password" type="password" />
          </ngx-signal-form-field-wrapper>
          <ngx-signal-form-field-wrapper [formField]="field3" fieldName="confirm">
            <input id="confirm" type="password" />
          </ngx-signal-form-field-wrapper>
        </div>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field1: invalidField,
            field2: invalidField,
            field3: invalidField,
          },
        },
      );

      const errorComponents = container.querySelectorAll(
        'ngx-form-field-error',
      );
      expect(errorComponents).toHaveLength(3);

      // Check explicit fieldNames created proper IDs
      expect(container.querySelector('[id="email-error"]')).toBeTruthy();
      expect(container.querySelector('[id="confirm-error"]')).toBeTruthy();

      // Check auto-derived ID from the bound control id attribute.
      expect(container.querySelector('[id="password-error"]')).toBeTruthy();
    });

    it('should handle empty string fieldName', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      const component = createWrapperComponent(invalidField, '');

      expect(() => component.resolvedFieldName()).toThrow(
        /Could not resolve a deterministic field name/u,
      );
    });

    it('should pass derived control id to error component for ARIA attribute generation', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <input id="derived-id" type="text" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      const errorComponent = container.querySelector('ngx-form-field-error');
      expect(errorComponent).toBeTruthy();

      const errorContainer = container.querySelector('[id="derived-id-error"]');
      expect(errorContainer).toBeTruthy();

      const errorId = errorContainer?.getAttribute('id');
      expect(errorId).toBe('derived-id-error');
    });

    it('should rebind to a new projected control when an @if branch swaps the bound element', async () => {
      // Regression guard for the DOM-query cache in `earlyRead`: when an
      // `@if` branch swaps which element carries the projected id, the
      // cache must release the old element (no longer contained in the
      // host after branch change) and re-query for the new one. The cache
      // uses `hostEl.contains(cached)` + `isConnected` to detect this.
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      @Component({
        template: `
          <ngx-signal-form-field-wrapper [formField]="field">
            <label for="branch-a">Branch</label>
            @if (useBranchA()) {
              <input id="branch-a" type="text" />
            } @else {
              <input id="branch-b" type="text" />
            }
          </ngx-signal-form-field-wrapper>
        `,
        imports: [NgxSignalFormWrapperComponent],
      })
      class TestComponent {
        readonly useBranchA = signal(true);
        readonly field = invalidField;
      }

      const { container, fixture } = await render(TestComponent);
      await fixture.whenStable();

      const branchA = container.querySelector('#branch-a');
      expect(branchA).toHaveAttribute('data-signal-field', 'branch-a');

      fixture.componentInstance.useBranchA.set(false);
      fixture.detectChanges();
      await fixture.whenStable();

      const branchB = container.querySelector('#branch-b');
      expect(branchB).toBeTruthy();
      expect(branchB).toHaveAttribute('data-signal-field', 'branch-b');
      // Old branch element is gone from the DOM, so there's nothing left
      // to carry the stale attribute — cache eviction worked.
      expect(container.querySelector('#branch-a')).toBeNull();
    });

    it('should clear stale projected control metadata when a custom control loses its id', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      @Component({
        template: `
          <ngx-signal-form-field-wrapper [formField]="field" fieldName="rating">
            <label for="rating-control">Rating</label>
            <div
              [attr.id]="controlId()"
              data-ngx-signal-form-control
              role="slider"
            ></div>
          </ngx-signal-form-field-wrapper>
        `,
        imports: [NgxSignalFormWrapperComponent],
      })
      class TestComponent {
        readonly controlId = signal('rating-control');
        readonly field = invalidField;
      }

      const { container, fixture } = await render(TestComponent);

      await fixture.whenStable();

      const control = container.querySelector('[role="slider"]');
      expect(control).toHaveAttribute('data-signal-field', 'rating');

      fixture.componentInstance.controlId.set(null);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(control?.hasAttribute('data-signal-field')).toBe(false);
    });
  });

  describe('Auto-resolution of field names from input elements', () => {
    it('should auto-resolve fieldName from input element id attribute', async () => {
      // The wrapper auto-resolves fieldName from the projected input element's id attribute.
      // This works via DOM querying in an effect when the component initializes.

      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Email is required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="email">Email</label>
          <input id="email" type="email" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      const input = container.querySelector('input#email');
      const label = container.querySelector('label[for="email"]');

      // Label and input are projected correctly
      expect(label).toBeTruthy();
      expect(input).toBeTruthy();

      // fieldName is auto-resolved from input id="email" → error id="email-error"
      const errorElement = container.querySelector('[id="email-error"]');
      expect(errorElement).toBeTruthy();
    });

    it('should use explicit fieldName when provided', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Email is required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="custom-email">
          <label for="email">Email</label>
          <input id="email" type="email" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      // Explicit fieldName always takes priority
      const errorWithExplicitName = container.querySelector(
        '[id="custom-email-error"]',
      );
      expect(errorWithExplicitName).toBeTruthy(); // ✅ Uses explicit fieldName
    });

    it('should work with implicit labels (input nested in label)', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Email is required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label>
            Email
            <input id="email" type="email" />
          </label>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      const input = container.querySelector('input#email');
      const label = container.querySelector('label');

      // Implicit label association (input nested in label)
      expect(label).toBeTruthy();
      expect(input).toBeTruthy();
      expect(input).toBeInstanceOf(Node);
      expect(label?.contains(input)).toBe(true);

      // fieldName is auto-resolved from input id="email" → error id="email-error"
      const errorElement = container.querySelector('[id="email-error"]');
      expect(errorElement).toBeTruthy();
    });

    it('should work with textarea elements (verifies query selector)', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [
          { kind: 'required', message: 'Description is required' },
        ],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="bio">Bio</label>
          <textarea id="bio"></textarea>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      // fieldName is auto-resolved from textarea id="bio" → error id="bio-error"
      const errorElement = container.querySelector('[id="bio-error"]');
      expect(errorElement).toBeTruthy();
    });

    it('should work with select elements (verifies query selector)', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Country is required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="country">Country</label>
          <select id="country">
            <option value="">Select...</option>
            <option value="us">USA</option>
          </select>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      // fieldName is auto-resolved from select id="country" → error id="country-error"
      const errorElement = container.querySelector('[id="country-error"]');
      expect(errorElement).toBeTruthy();
    });

    it('should work with button elements (verifies query selector)', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Selection required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="picker">Color Picker</label>
          <button id="picker" type="button">Pick Color</button>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      // fieldName is auto-resolved from button id="picker" → error id="picker-error"
      const errorElement = container.querySelector('[id="picker-error"]');
      expect(errorElement).toBeTruthy();
    });

    it('renders messages in the assistive row by default', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Email is required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="email-default">Email</label>
          <input id="email-default" type="email" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      const host = container.querySelector('ngx-signal-form-field-wrapper');
      const assistiveRow = host?.querySelector(
        'ngx-signal-form-field-assistive-row',
      );

      expect(host).toHaveAttribute('data-error-placement', 'bottom');
      expect(
        host?.classList.contains(
          'ngx-signal-form-field-wrapper--messages-bottom',
        ),
      ).toBe(true);
      expect(
        host?.querySelector('.ngx-signal-form-field-wrapper__messages'),
      ).toBeNull();
      expect(assistiveRow?.querySelector('ngx-form-field-error')).toBeTruthy();
    });

    it('renders messages above the control when errorPlacement is top', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Email is required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" errorPlacement="top">
          <label for="email-top">Email</label>
          <input id="email-top" type="email" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      const host = container.querySelector('ngx-signal-form-field-wrapper');
      const messages = host?.querySelector(
        '.ngx-signal-form-field-wrapper__messages',
      );
      const content = host?.querySelector(
        '.ngx-signal-form-field-wrapper__content',
      );
      const assistiveRow = host?.querySelector(
        'ngx-signal-form-field-assistive-row',
      );

      expect(host).toHaveAttribute('data-error-placement', 'top');
      expect(
        host?.classList.contains('ngx-signal-form-field-wrapper--messages-top'),
      ).toBe(true);
      expect(messages).toBeTruthy();
      expect(content).toBeTruthy();

      if (
        !(messages instanceof HTMLElement) ||
        !(content instanceof HTMLElement)
      ) {
        throw new Error('Expected messages and content containers to render.');
      }

      expect(
        messages.compareDocumentPosition(content) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
      expect(assistiveRow?.querySelector('ngx-form-field-error')).toBeFalsy();
      expect(messages?.querySelector('ngx-form-field-error')).toBeTruthy();
    });
  });

  describe('Basic rendering', () => {
    it('should render the component with host element', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="test-field">
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const formField = container.querySelector(
        'ngx-signal-form-field-wrapper',
      );
      expect(formField).toBeTruthy();
    });

    it('should have the correct structure with content wrapper', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="test-field">
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const formField = container.querySelector(
        'ngx-signal-form-field-wrapper',
      );
      const contentWrapper = formField?.querySelector(
        '.ngx-signal-form-field-wrapper__content',
      );

      expect(formField).toBeTruthy();
      expect(contentWrapper).toBeTruthy();
    });
  });

  describe('Content projection', () => {
    it('should project label and input content', async () => {
      await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="test-field">
          <label for="email">Email</label>
          <input id="email" type="email" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const label = screen.getByText('Email');
      const input = screen.getByRole('textbox');

      expect(label).toBeTruthy();
      expect(input).toBeTruthy();
    });

    it('should project multiple form controls', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="test-field">
          <label for="username">Username</label>
          <input id="username" type="text" />
          <span class="hint">Choose a unique username</span>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const label = screen.getByText('Username');
      const input = screen.getByRole('textbox');
      const hint = container.querySelector('.hint');

      expect(label).toBeTruthy();
      expect(input).toBeTruthy();
      expect(hint?.textContent).toBe('Choose a unique username');
    });

    it('should project complex nested content', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="test-field">
          <div class="label-wrapper">
            <label for="password">Password</label>
            <button type="button">Show</button>
          </div>
          <input id="password" type="password" />
          <div class="requirements">
            <span>Min 8 characters</span>
          </div>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const label = screen.getByText('Password');
      const showButton = screen.getByRole('button', { name: 'Show' });
      const input = container.querySelector('input[type="password"]');
      const requirements = container.querySelector('.requirements');

      expect(label).toBeTruthy();
      expect(showButton).toBeTruthy();
      expect(input).toBeTruthy();
      expect(requirements?.textContent).toContain('Min 8 characters');
    });

    it('should handle empty content gracefully', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="test-field">
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const formField = container.querySelector(
        'ngx-signal-form-field-wrapper',
      );
      const contentWrapper = formField?.querySelector(
        '.ngx-signal-form-field-wrapper__content',
      );

      expect(formField).toBeTruthy();
      expect(contentWrapper).toBeTruthy();
      expect(contentWrapper?.textContent?.trim()).toBe('');
    });
  });

  describe('Layout behavior', () => {
    it('should render form field wrapper that contains projected content', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="test-field">
          <label for="test-input">Test Label</label>
          <input type="text" id="test-input" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const formField = container.querySelector(
        'ngx-signal-form-field-wrapper',
      );
      const label = screen.getByText('Test Label');
      const input = screen.getByRole('textbox');

      expect(formField).toBeTruthy();
      expect(label).toBeTruthy();
      expect(input).toBeTruthy();
    });
  });

  describe('Required marker configuration', () => {
    it('should show required marker by default when outline is enabled', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" appearance="outline">
          <label for="email">Email</label>
          <input id="email" type="email" required />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const formField = container.querySelector(
        'ngx-signal-form-field-wrapper',
      );
      expect(formField).toHaveAttribute('data-show-required', 'true');
      expect(formField).toHaveAttribute('data-required-marker', ' *');
    });

    it('should hide required marker when showRequiredMarker is false', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper
          [formField]="field"
          appearance="outline"
          [showRequiredMarker]="false">
          <label for="email">Email</label>
          <input id="email" type="email" required />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const formField = container.querySelector(
        'ngx-signal-form-field-wrapper',
      );
      expect(formField).not.toHaveAttribute('data-show-required', 'true');
      expect(formField).not.toHaveAttribute('data-required-marker');
    });

    it('should use custom required marker when provided', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper
          [formField]="field"
          appearance="outline"
          requiredMarker="(required)">
          <label for="email">Email</label>
          <input id="email" type="email" required />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const formField = container.querySelector(
        'ngx-signal-form-field-wrapper',
      );
      expect(formField).toHaveAttribute('data-show-required', 'true');
      expect(formField).toHaveAttribute('data-required-marker', '(required)');
    });

    it('should not set marker when outline is disabled', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="email">Email</label>
          <input id="email" type="email" required />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const formField = container.querySelector(
        'ngx-signal-form-field-wrapper',
      );
      expect(formField).not.toHaveAttribute('data-show-required', 'true');
      expect(formField).not.toHaveAttribute('data-required-marker');
    });
  });

  describe('Integration scenarios', () => {
    it('should work with textarea elements', async () => {
      await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="test-field">
          <label for="bio">Bio</label>
          <textarea id="bio" rows="4"></textarea>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const label = screen.getByText('Bio');
      const textarea = screen.getByRole('textbox');

      expect(label).toBeTruthy();
      expect(textarea.tagName.toLowerCase()).toBe('textarea');
    });

    it('should work with select elements', async () => {
      await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="test-field">
          <label for="country">Country</label>
          <select id="country">
            <option value="us">USA</option>
            <option value="uk">UK</option>
          </select>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const label = screen.getByText('Country');
      const select = screen.getByRole('combobox');

      expect(label).toBeTruthy();
      expect(select).toBeTruthy();
    });

    it('should work with checkbox inputs', async () => {
      await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="test-field">
          <label>
            <input type="checkbox" id="agree" />
            I agree to the terms
          </label>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const checkbox = screen.getByRole('checkbox');
      const label = screen.getByText('I agree to the terms', { exact: false });

      expect(checkbox).toBeTruthy();
      expect(label).toBeTruthy();
    });

    it('should work with switch inputs', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Email updates required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="emailUpdates">Email updates</label>
          <input id="emailUpdates" type="checkbox" role="switch" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      const switchControl = screen.getByRole('switch');
      const errorElement = container.querySelector('[id="emailUpdates-error"]');
      const wrapper = container.querySelector('ngx-signal-form-field-wrapper');
      const assistiveRow = container.querySelector(
        'ngx-signal-form-field-assistive-row',
      );

      expect(switchControl).toBeTruthy();
      expect(errorElement).toBeTruthy();
      expect(assistiveRow?.querySelector('ngx-form-field-error')).toBeTruthy();
      expect(wrapper).toHaveAttribute('aria-invalid', 'true');
      expect(
        wrapper?.classList.contains('ngx-signal-form-field-wrapper--invalid'),
      ).toBe(true);
      expect(errorElement?.textContent).toContain('Email updates required');
    });

    it('should honor explicit switch semantics without relying on role heuristics', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Email updates required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="emailUpdates">Email updates</label>
          <input
            id="emailUpdates"
            type="checkbox"
            ngxSignalFormControl="switch"
          />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [
            NgxSignalFormWrapperComponent,
            NgxSignalFormControlSemanticsDirective,
          ],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      const wrapper = container.querySelector('ngx-signal-form-field-wrapper');

      expect(wrapper).toHaveAttribute(
        'data-ngx-signal-form-control-kind',
        'switch',
      );
      expect(wrapper).toHaveAttribute(
        'data-ngx-signal-form-control-layout',
        'inline-control',
      );
      expect(wrapper).toHaveAttribute(
        'data-ngx-signal-form-control-aria-mode',
        'auto',
      );
      expect(container.querySelector('[id="emailUpdates-error"]')).toBeTruthy();
    });

    it('should honor explicit checkbox semantics with grouped wrapper layout', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Consent required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" appearance="outline">
          <label for="consent">Consent</label>
          <input
            id="consent"
            type="checkbox"
            ngxSignalFormControl="checkbox"
          />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [
            NgxSignalFormWrapperComponent,
            NgxSignalFormControlSemanticsDirective,
          ],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      const wrapper = container.querySelector('ngx-signal-form-field-wrapper');

      expect(wrapper).toHaveAttribute(
        'data-ngx-signal-form-control-kind',
        'checkbox',
      );
      expect(wrapper).toHaveAttribute(
        'data-ngx-signal-form-control-layout',
        'group',
      );
      expect(wrapper).toHaveAttribute(
        'data-ngx-signal-form-control-aria-mode',
        'auto',
      );
      expect(wrapper).toHaveClass(
        'ngx-signal-form-field-wrapper--checkbox',
        'ngx-signal-form-field-wrapper--selection-group',
      );
      expect(wrapper).not.toHaveClass('ngx-signal-forms-outline');
      expect(wrapper).not.toHaveAttribute('outline');
      expect(container.querySelector('[id="consent-error"]')).toBeTruthy();
    });

    it('should work with radio button groups', async () => {
      await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="test-field">
          <fieldset>
            <legend>Choose size</legend>
            <label>
              <input type="radio" name="size" value="small" />
              Small
            </label>
            <label>
              <input type="radio" name="size" value="large" />
              Large
            </label>
          </fieldset>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const legend = screen.getByText('Choose size');
      const radios = screen.getAllByRole('radio');

      expect(legend).toBeTruthy();
      expect(radios).toHaveLength(2);
    });
  });

  describe('Accessibility', () => {
    it('should maintain label-input associations', async () => {
      await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="test-field">
          <label for="email">Email Address</label>
          <input id="email" type="email" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const label = screen.getByText('Email Address');
      const input = screen.getByRole('textbox');

      expect(label).toBeInstanceOf(HTMLLabelElement);

      if (!(label instanceof HTMLLabelElement)) {
        throw new Error('Expected rendered label to be an HTMLLabelElement.');
      }

      expect(label.htmlFor).toBe('email');
      expect(input.getAttribute('id')).toBe('email');
    });

    it('should not interfere with aria attributes on inputs', async () => {
      await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="test-field">
          <label for="phone">Phone</label>
          <input
            id="phone"
            type="tel"
            aria-describedby="phone-hint"
          />
          <span id="phone-hint">Include country code</span>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const input = screen.getByRole('textbox');

      expect(input.getAttribute('aria-describedby')).toBe('phone-hint');
      expect(input.getAttribute('aria-required')).toBeNull();
    });
  });

  describe('Error display', () => {
    it('should show error component when field is invalid and showErrors is true', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ key: 'required', message: 'This field is required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="test-field">
          <label for="test">Test</label>
          <input id="test" type="text" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      const errorComponent = container.querySelector('ngx-form-field-error');
      expect(errorComponent).toBeTruthy();
    });

    it('should mark the wrapper invalid when a native control has visible blocking errors', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'This field is required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="test-field">
          <label for="test">Test</label>
          <input id="test" type="text" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      const wrapper = container.querySelector('ngx-signal-form-field-wrapper');
      expect(wrapper).toHaveAttribute('aria-invalid', 'true');
      expect(
        wrapper?.classList.contains('ngx-signal-form-field-wrapper--invalid'),
      ).toBe(true);
    });

    it('should not mark the wrapper invalid before errors should be shown', async () => {
      const untouchedInvalidField = signal({
        invalid: () => true,
        touched: () => false,
        errors: () => [{ kind: 'required', message: 'This field is required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="test-field">
          <label for="test">Test</label>
          <input id="test" type="text" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: untouchedInvalidField,
          },
        },
      );

      const wrapper = container.querySelector('ngx-signal-form-field-wrapper');
      expect(wrapper).toHaveAttribute('aria-invalid', 'false');
      expect(
        wrapper?.classList.contains('ngx-signal-form-field-wrapper--invalid'),
      ).toBe(false);
    });

    it('should display errors WITHOUT [formRoot] context for on-touch strategy', async () => {
      /**
       * KEY CAPABILITY: NgxSignalFormWrapperComponent works WITHOUT [formRoot] directive
       * for the default 'on-touch' strategy.
       *
       * The 'on-touch' strategy only checks `field.invalid() && field.touched()`.
       * It does NOT require `submittedStatus` signal from form context.
       *
       * This means users can use <ngx-signal-form-field-wrapper> for simple forms without
       * needing to add [formRoot] to their <form> element.
       */
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Email is required' }],
      });

      // No [formRoot] context - just the component in isolation
      await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="email">
          <label for="email">Email</label>
          <input id="email" type="email" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      // Error should display because on-touch only needs invalid + touched
      expect(screen.getByRole('alert')).toHaveTextContent('Email is required');
    });
  });

  describe('Form element support', () => {
    it('should resolve field name from input element', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="username">Username</label>
          <input id="username" type="text" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const input = container.querySelector('input#username');
      expect(input).toBeTruthy();
      expect(input?.getAttribute('id')).toBe('username');
    });

    it('should resolve field name from textarea element', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="description">Description</label>
          <textarea id="description"></textarea>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const textarea = container.querySelector('textarea#description');
      expect(textarea).toBeTruthy();
      expect(textarea?.getAttribute('id')).toBe('description');
    });

    it('should resolve field name from select element', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="country">Country</label>
          <select id="country">
            <option value="us">United States</option>
            <option value="uk">United Kingdom</option>
          </select>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const select = container.querySelector('select#country');
      expect(select).toBeTruthy();
      expect(select?.getAttribute('id')).toBe('country');
    });

    it('should resolve field name from button element', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="custom-control">Custom Control</label>
          <button id="custom-control" type="button">Select Value</button>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const button = container.querySelector('button#custom-control');
      expect(button).toBeTruthy();
      expect(button?.getAttribute('id')).toBe('custom-control');
      expect(button?.getAttribute('type')).toBe('button');
    });
  });

  describe('Prefix/Suffix Projection', () => {
    it('should project prefix content', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <span prefix aria-hidden="true">🔍</span>
          <label for="search">Search</label>
          <input id="search" type="text" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const prefix = container.querySelector('[prefix]');
      expect(prefix).toBeTruthy();
      expect(prefix?.textContent).toBe('🔍');
      expect(prefix?.getAttribute('aria-hidden')).toBe('true');
    });

    it('should project suffix content', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="password">Password</label>
          <input id="password" type="password" />
          <button suffix type="button">Show</button>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const suffix = container.querySelector('[suffix]');
      expect(suffix).toBeTruthy();
      expect(suffix?.textContent).toBe('Show');
      expect(suffix?.getAttribute('type')).toBe('button');
    });

    it('should project both prefix and suffix content', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <span prefix aria-hidden="true">$</span>
          <label for="amount">Amount</label>
          <input id="amount" type="number" />
          <span suffix aria-hidden="true">.00</span>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const prefix = container.querySelector('[prefix]');
      const suffix = container.querySelector('[suffix]');

      expect(prefix?.textContent).toBe('$');
      expect(suffix?.textContent).toBe('.00');
    });

    it('should maintain proper layout with prefix', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <span prefix>Icon</span>
          <label for="email">Email</label>
          <input id="email" type="email" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const content = container.querySelector(
        '.ngx-signal-form-field-wrapper__content',
      );
      const prefix = container.querySelector(
        '.ngx-signal-form-field-wrapper__prefix',
      );
      const main = container.querySelector(
        '.ngx-signal-form-field-wrapper__main',
      );
      const suffix = container.querySelector(
        '.ngx-signal-form-field-wrapper__suffix',
      );

      expect(content).toBeTruthy();
      expect(prefix).toBeTruthy();
      expect(main).toBeTruthy();
      expect(suffix).toBeTruthy();

      // Verify DOM structure
      expect(content?.contains(prefix ?? null)).toBe(true);
      expect(content?.contains(main ?? null)).toBe(true);
      expect(content?.contains(suffix ?? null)).toBe(true);
    });

    it('should hide empty prefix slot', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="email">Email</label>
          <input id="email" type="email" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const prefix = container.querySelector(
        '.ngx-signal-form-field-wrapper__prefix',
      );
      expect(prefix).toBeTruthy();

      // Empty prefix should have no child elements
      expect(prefix?.children.length).toBe(0);
      expect(prefix?.textContent?.trim()).toBe('');
    });

    it('should hide empty suffix slot', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="email">Email</label>
          <input id="email" type="email" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const suffix = container.querySelector(
        '.ngx-signal-form-field-wrapper__suffix',
      );
      expect(suffix).toBeTruthy();

      // Empty suffix should have no child elements
      expect(suffix?.children.length).toBe(0);
      expect(suffix?.textContent?.trim()).toBe('');
    });

    it('should support interactive suffix elements', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="search">Search</label>
          <input id="search" type="text" />
          <button suffix type="button">Clear</button>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const suffixButton = container.querySelector(
        '[suffix] button, button[suffix]',
      );
      expect(suffixButton).toBeTruthy();
      expect(suffixButton?.getAttribute('type')).toBe('button');
    });

    it('should support multiple prefix elements', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <span prefix>@</span>
          <label for="username">Username</label>
          <input id="username" type="text" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const prefixes = container.querySelectorAll('[prefix]');
      expect(prefixes.length).toBeGreaterThan(0);
    });
  });

  describe('Warning Display', () => {
    it('should apply warning class when field has warnings but no errors', async () => {
      const warningField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [
          {
            kind: 'warn:weak-password',
            message: 'Consider a stronger password',
          },
        ],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="password">
          <label for="password">Password</label>
          <input id="password" type="password" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: warningField,
          },
        },
      );

      const formField = container.querySelector(
        'ngx-signal-form-field-wrapper',
      );
      expect(
        formField?.classList.contains('ngx-signal-form-field-wrapper--warning'),
      ).toBe(true);
    });

    it('should NOT apply warning class when field has both errors and warnings', async () => {
      const mixedField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [
          { kind: 'required', message: 'Password is required' },
          {
            kind: 'warn:weak-password',
            message: 'Consider a stronger password',
          },
        ],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="password">
          <label for="password">Password</label>
          <input id="password" type="password" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: mixedField,
          },
        },
      );

      const formField = container.querySelector(
        'ngx-signal-form-field-wrapper',
      );
      // Errors take priority - warning class should NOT be applied
      expect(
        formField?.classList.contains('ngx-signal-form-field-wrapper--warning'),
      ).toBe(false);
    });

    it('should NOT apply warning class when field has only errors', async () => {
      const errorField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Email is required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="email">
          <label for="email">Email</label>
          <input id="email" type="email" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: errorField,
          },
        },
      );

      const formField = container.querySelector(
        'ngx-signal-form-field-wrapper',
      );
      expect(
        formField?.classList.contains('ngx-signal-form-field-wrapper--warning'),
      ).toBe(false);
    });

    it('should NOT apply warning class when field has no errors or warnings', async () => {
      const validField = signal({
        invalid: () => false,
        touched: () => true,
        errors: () => [],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="email">
          <label for="email">Email</label>
          <input id="email" type="email" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: validField,
          },
        },
      );

      const formField = container.querySelector(
        'ngx-signal-form-field-wrapper',
      );
      expect(
        formField?.classList.contains('ngx-signal-form-field-wrapper--warning'),
      ).toBe(false);
    });

    it('should display warning messages in error component with role="status"', async () => {
      const warningField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [
          {
            kind: 'warn:weak-password',
            message: 'Consider a stronger password',
          },
        ],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="password">
          <label for="password">Password</label>
          <input id="password" type="password" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: warningField,
          },
        },
      );

      // Warning should be displayed with role="status" (polite announcement)
      const warningContainer = container.querySelector('[role="status"]');
      expect(warningContainer).toBeTruthy();
      expect(warningContainer?.textContent).toContain(
        'Consider a stronger password',
      );
    });

    it('should show errors with role="alert" when both errors and warnings exist', async () => {
      const mixedField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [
          { kind: 'required', message: 'Password is required' },
          {
            kind: 'warn:weak-password',
            message: 'Consider a stronger password',
          },
        ],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="password">
          <label for="password">Password</label>
          <input id="password" type="password" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: mixedField,
          },
        },
      );

      // Error should be displayed with role="alert" (assertive announcement)
      const errorContainer = container.querySelector('[role="alert"]');
      expect(errorContainer).toBeTruthy();
      expect(errorContainer?.textContent).toContain('Password is required');
    });

    it('should handle multiple warnings', async () => {
      const multiWarningField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [
          { kind: 'warn:short', message: 'Password is short' },
          { kind: 'warn:common', message: 'Password is commonly used' },
        ],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="password">
          <label for="password">Password</label>
          <input id="password" type="password" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: multiWarningField,
          },
        },
      );

      const formField = container.querySelector(
        'ngx-signal-form-field-wrapper',
      );
      expect(
        formField?.classList.contains('ngx-signal-form-field-wrapper--warning'),
      ).toBe(true);

      const warningContainer = container.querySelector('[role="status"]');
      expect(warningContainer?.textContent).toContain('Password is short');
      expect(warningContainer?.textContent).toContain(
        'Password is commonly used',
      );
    });

    it('should NOT apply warning class when field is not touched (respects display strategy)', async () => {
      const warningField = signal({
        invalid: () => true,
        touched: () => false, // Not yet touched
        errors: () => [
          {
            kind: 'warn:weak-password',
            message: 'Consider a stronger password',
          },
        ],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="password">
          <label for="password">Password</label>
          <input id="password" type="password" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: warningField,
          },
        },
      );

      // Warning class is still applied based on field state, independent of touch
      // Note: The error component uses strategy to control visibility, but
      // the warning CSS class is applied based on hasWarnings && !hasErrors
      const formField = container.querySelector(
        'ngx-signal-form-field-wrapper',
      );
      expect(
        formField?.classList.contains('ngx-signal-form-field-wrapper--warning'),
      ).toBe(true);
    });

    it('should handle edge case of error without kind property', async () => {
      const edgeCaseField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [
          { message: 'Error without kind' } as {
            kind?: string;
            message: string;
          },
        ],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="test">
          <label for="test">Test</label>
          <input id="test" type="text" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: edgeCaseField,
          },
        },
      );

      // Errors without kind are treated as blocking errors (not warnings)
      const formField = container.querySelector(
        'ngx-signal-form-field-wrapper',
      );
      expect(
        formField?.classList.contains('ngx-signal-form-field-wrapper--warning'),
      ).toBe(false);
    });

    it('should apply warning class when warnings are present from start (no blocking errors)', async () => {
      // Test that when a field transitions from having errors to only warnings,
      // the warning styling is applied. This simulates a user fixing blocking errors
      // but still having warnings.
      const warningsOnlyField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [
          { kind: 'warn:suggestion', message: 'Consider using more detail' },
        ],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="dynamic">
          <label for="dynamic">Dynamic</label>
          <input id="dynamic" type="text" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: warningsOnlyField,
          },
        },
      );

      const formField = container.querySelector(
        'ngx-signal-form-field-wrapper',
      );

      // With only warnings present, warning class should be applied
      expect(
        formField?.classList.contains('ngx-signal-form-field-wrapper--warning'),
      ).toBe(true);
    });

    it('should distinguish between warn: prefix variations', async () => {
      // Ensure that 'warning', 'warn', 'warned' etc. are NOT treated as warnings
      // Only 'warn:' (with colon) prefix should indicate a warning
      const notWarningField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [
          { kind: 'warning-message', message: 'This is NOT a warning' },
          { kind: 'warned', message: 'This is also NOT a warning' },
        ],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="test">
          <label for="test">Test</label>
          <input id="test" type="text" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: notWarningField,
          },
        },
      );

      const formField = container.querySelector(
        'ngx-signal-form-field-wrapper',
      );
      // These are blocking errors, not warnings (no 'warn:' prefix)
      expect(
        formField?.classList.contains('ngx-signal-form-field-wrapper--warning'),
      ).toBe(false);
    });
  });

  describe('Custom control support (FormValueControl pattern)', () => {
    /**
     * Tests for the expanded DOM selector that supports custom Angular Signal Forms
     * controls implementing FormValueControl<T>.
     *
     * Since FormValueControl is a TypeScript interface (erased at runtime),
     * the wrapper detects custom controls by looking for a projected bound-control
     * host with an `id` attribute.
     */

    it('should auto-resolve fieldName from custom control element with id attribute', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Rating is required' }],
      });

      // Simulate a custom control component element (e.g., <app-rating-control id="rating">)
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="rating">Rating</label>
          <div
            id="rating"
            data-ngx-signal-form-control
            role="slider"
            aria-label="Rating"
          ></div>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      // fieldName should be auto-resolved from custom control's id="rating" → error id="rating-error"
      const errorElement = container.querySelector('[id="rating-error"]');
      expect(errorElement).toBeTruthy();
    });

    it('should prioritize native form elements over custom controls', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Email is required' }],
      });

      // When both a native input and a custom element have ids, native should take priority
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="email">Email</label>
          <input id="email" type="email" />
          <div id="custom-helper" role="status"></div>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      // Should use native input's id, not the custom element's id
      const errorElement = container.querySelector('[id="email-error"]');
      expect(errorElement).toBeTruthy();

      // custom-helper-error should NOT exist
      const customError = container.querySelector('[id="custom-helper-error"]');
      expect(customError).toBeFalsy();
    });

    it('should fall back to custom control when native input lacks id', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Selection required' }],
      });

      // Native input without id, custom control with id
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label>Selection</label>
          <input type="hidden" />
          <div id="custom-picker" data-ngx-signal-form-control role="listbox"></div>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      // Should fall back to custom element's id
      const errorElement = container.querySelector(
        '[id="custom-picker-error"]',
      );
      expect(errorElement).toBeTruthy();
    });

    it('should ignore label elements when searching for custom controls', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      // Label has id but should be excluded from fallback query
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label id="my-label" for="control">Control</label>
          <div id="control" data-ngx-signal-form-control role="slider"></div>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      // Should use control's id, not label's id
      const errorElement = container.querySelector('[id="control-error"]');
      expect(errorElement).toBeTruthy();

      // my-label-error should NOT exist
      const labelError = container.querySelector('[id="my-label-error"]');
      expect(labelError).toBeFalsy();
    });

    it('should not resolve nested ngx-signal-form-field-wrapper as custom control', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      // Testing that nested wrappers don't interfere
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="outer">Outer</label>
          <div id="outer" data-ngx-signal-form-control role="slider"></div>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      // Error should be based on the custom control, not the wrapper
      const errorElement = container.querySelector('[id="outer-error"]');
      expect(errorElement).toBeTruthy();
    });

    it('should work with ARIA role attributes on custom controls', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'min', message: 'Minimum 1 star required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="stars">Rating</label>
          <div
            id="stars"
            data-ngx-signal-form-control
            role="slider"
            aria-valuemin="0"
            aria-valuemax="5"
            aria-valuenow="0"
            aria-label="Star rating"
            tabindex="0"
          ></div>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      // fieldName derived from accessible custom control
      const errorElement = container.querySelector('[id="stars-error"]');
      expect(errorElement).toBeTruthy();
      expect(errorElement?.textContent).toContain('Minimum 1 star required');
    });

    it('should mark the wrapper invalid for custom controls when blocking errors are visible', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'min', message: 'Minimum 1 star required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="stars">Rating</label>
          <div
            id="stars"
            data-ngx-signal-form-control
            role="slider"
            aria-valuemin="0"
            aria-valuemax="5"
            aria-valuenow="0"
            aria-label="Star rating"
            tabindex="0"
          ></div>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      const wrapper = container.querySelector('ngx-signal-form-field-wrapper');
      expect(wrapper).toHaveAttribute('aria-invalid', 'true');
      expect(
        wrapper?.classList.contains('ngx-signal-form-field-wrapper--invalid'),
      ).toBe(true);
    });

    it('should support outline appearance for custom controls', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'min', message: 'Minimum 1 star required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" appearance="outline">
          <label for="stars">Rating</label>
          <div
            id="stars"
            data-ngx-signal-form-control
            role="slider"
            aria-valuemin="0"
            aria-valuemax="5"
            aria-valuenow="0"
            aria-label="Star rating"
            tabindex="0"
          ></div>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      const wrapper = container.querySelector('ngx-signal-form-field-wrapper');
      const content = container.querySelector(
        '.ngx-signal-form-field-wrapper__content',
      );

      expect(wrapper?.classList.contains('ngx-signal-forms-outline')).toBe(
        true,
      );
      expect(wrapper).toHaveAttribute('outline', '');
      expect(content).toBeTruthy();
    });

    it('should allow explicit fieldName to override custom control id', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="explicit-name">
          <label for="custom">Custom</label>
          <div id="custom" data-ngx-signal-form-control role="slider"></div>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      // Explicit fieldName takes priority
      const errorElement = container.querySelector(
        '[id="explicit-name-error"]',
      );
      expect(errorElement).toBeTruthy();

      // custom-error should NOT exist
      const customError = container.querySelector('[id="custom-error"]');
      expect(customError).toBeFalsy();
    });

    it('should throw when custom control has no id', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      const component = createWrapperComponent(invalidField);

      expect(() => component.resolvedFieldName()).toThrow(
        /Could not resolve a deterministic field name/u,
      );
    });
  });

  describe('DI Context Provider (NGX_SIGNAL_FORM_FIELD_CONTEXT)', () => {
    it('should provide field context to child components via DI', async () => {
      /**
       * This test verifies the wrapper provides NGX_SIGNAL_FORM_FIELD_CONTEXT
       * which allows child components (like ngx-form-field-error) to inherit
       * the resolved field name without explicit input binding.
       *
       * The provider uses forwardRef because:
       * - The providers array is evaluated during class decoration
       * - NgxSignalFormFieldWrapperComponent isn't defined yet at that point
       * - forwardRef(() => Class) defers resolution until DI needs it
       */
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="email">Email</label>
          <input id="email" type="email" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      // The child error component should receive fieldName via DI context
      // and generate the correct error ID
      const errorElement = container.querySelector('[id="email-error"]');
      expect(errorElement).toBeTruthy();
    });

    it('should allow explicit fieldName to override context', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="custom-override">
          <label for="email">Email</label>
          <input id="email" type="email" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      // Explicit fieldName should take priority over input id derivation
      const errorElement = container.querySelector(
        '[id="custom-override-error"]',
      );
      expect(errorElement).toBeTruthy();
    });

    it('should update context when input id changes (via re-render)', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      // First render with id="first"
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="first">Field</label>
          <input id="first" type="text" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      // Context should derive from first input id
      expect(container.querySelector('[id="first-error"]')).toBeTruthy();
    });

    it('should throw when no input has id attribute and no fieldName is provided', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      const component = createWrapperComponent(invalidField);

      expect(() => component.resolvedFieldName()).toThrow(
        /Could not resolve a deterministic field name/u,
      );
    });

    it('should provide context signal that updates with resolvedFieldName', async () => {
      /**
       * The context provides a signal (not a static value) so child components
       * can react to changes. This is important for dynamic scenarios where
       * the field name might change based on configuration.
       */
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="dynamic-id">Dynamic</label>
          <input id="dynamic-id" type="text" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      // Error ID should match input id (derived via context signal)
      const errorElement = container.querySelector('[id="dynamic-id-error"]');
      expect(errorElement).toBeTruthy();
    });
  });

  describe('Appearance input', () => {
    describe('Stacked appearance', () => {
      it('should use stacked appearance by default (inherit from config default)', async () => {
        const { container } = await render(
          `<ngx-signal-form-field-wrapper [formField]="field">
            <label for="email">Email</label>
            <input id="email" type="email" />
          </ngx-signal-form-field-wrapper>`,
          {
            imports: [NgxSignalFormWrapperComponent],
            componentProperties: {
              field: createMockFieldState(),
            },
          },
        );

        const formField = container.querySelector(
          'ngx-signal-form-field-wrapper',
        );
        // Default config is 'stacked', so should NOT have outline class
        expect(formField).not.toHaveClass('ngx-signal-forms-outline');
        expect(formField).not.toHaveAttribute('outline');
      });

      it('should use stacked appearance when explicitly set', async () => {
        const { container } = await render(
          `<ngx-signal-form-field-wrapper [formField]="field" appearance="stacked">
            <label for="email">Email</label>
            <input id="email" type="email" />
          </ngx-signal-form-field-wrapper>`,
          {
            imports: [NgxSignalFormWrapperComponent],
            componentProperties: {
              field: createMockFieldState(),
            },
          },
        );

        const formField = container.querySelector(
          'ngx-signal-form-field-wrapper',
        );
        expect(formField).not.toHaveClass('ngx-signal-forms-outline');
      });

      it('should override global outline config with stacked appearance', async () => {
        const { container } = await render(
          `<ngx-signal-form-field-wrapper [formField]="field" appearance="stacked">
            <label for="email">Email</label>
            <input id="email" type="email" />
          </ngx-signal-form-field-wrapper>`,
          {
            imports: [NgxSignalFormWrapperComponent],
            providers: [
              {
                provide: NGX_SIGNAL_FORMS_CONFIG,
                useValue: {
                  ...DEFAULT_NGX_SIGNAL_FORMS_CONFIG,
                  defaultFormFieldAppearance: 'outline',
                },
              },
            ],
            componentProperties: {
              field: createMockFieldState(),
            },
          },
        );

        const formField = container.querySelector(
          'ngx-signal-form-field-wrapper',
        );
        // Should be stacked despite global config
        expect(formField).not.toHaveClass('ngx-signal-forms-outline');
      });
    });

    describe('Outline appearance', () => {
      it('should use outline appearance when explicitly set', async () => {
        const { container } = await render(
          `<ngx-signal-form-field-wrapper [formField]="field" appearance="outline">
            <label for="email">Email</label>
            <input id="email" type="email" />
          </ngx-signal-form-field-wrapper>`,
          {
            imports: [NgxSignalFormWrapperComponent],
            componentProperties: {
              field: createMockFieldState(),
            },
          },
        );

        const formField = container.querySelector(
          'ngx-signal-form-field-wrapper',
        );
        expect(formField).toHaveClass('ngx-signal-forms-outline');
        expect(formField).toHaveAttribute('outline', '');
      });

      it('should override global stacked config with outline appearance', async () => {
        const { container } = await render(
          `<ngx-signal-form-field-wrapper [formField]="field" appearance="outline">
            <label for="email">Email</label>
            <input id="email" type="email" />
          </ngx-signal-form-field-wrapper>`,
          {
            imports: [NgxSignalFormWrapperComponent],
            providers: [
              {
                provide: NGX_SIGNAL_FORMS_CONFIG,
                useValue: {
                  ...DEFAULT_NGX_SIGNAL_FORMS_CONFIG,
                  defaultFormFieldAppearance: 'stacked',
                },
              },
            ],
            componentProperties: {
              field: createMockFieldState(),
            },
          },
        );

        const formField = container.querySelector(
          'ngx-signal-form-field-wrapper',
        );
        // Should be outline despite global config
        expect(formField).toHaveClass('ngx-signal-forms-outline');
      });

      it('should ignore outline appearance for checkbox rows', async () => {
        const { container } = await render(
          `<ngx-signal-form-field-wrapper [formField]="field" appearance="outline">
            <label for="consent">Consent</label>
            <input id="consent" type="checkbox" />
          </ngx-signal-form-field-wrapper>`,
          {
            imports: [NgxSignalFormWrapperComponent],
            componentProperties: {
              field: createMockFieldState(),
            },
          },
        );

        const formField = container.querySelector(
          'ngx-signal-form-field-wrapper',
        );
        expect(formField).not.toHaveClass('ngx-signal-forms-outline');
        expect(formField).not.toHaveAttribute('outline');
      });

      it('should ignore outline appearance for switch rows', async () => {
        const { container } = await render(
          `<ngx-signal-form-field-wrapper [formField]="field" appearance="outline">
            <label for="updates">Updates</label>
            <input id="updates" type="checkbox" role="switch" />
          </ngx-signal-form-field-wrapper>`,
          {
            imports: [NgxSignalFormWrapperComponent],
            componentProperties: {
              field: createMockFieldState(),
            },
          },
        );

        const formField = container.querySelector(
          'ngx-signal-form-field-wrapper',
        );
        expect(formField).not.toHaveClass('ngx-signal-forms-outline');
        expect(formField).not.toHaveAttribute('outline');
      });
    });

    describe('Inherit appearance', () => {
      it('should inherit outline from global config', async () => {
        const { container } = await render(
          `<ngx-signal-form-field-wrapper [formField]="field" appearance="inherit">
            <label for="email">Email</label>
            <input id="email" type="email" />
          </ngx-signal-form-field-wrapper>`,
          {
            imports: [NgxSignalFormWrapperComponent],
            providers: [
              {
                provide: NGX_SIGNAL_FORMS_CONFIG,
                useValue: {
                  ...DEFAULT_NGX_SIGNAL_FORMS_CONFIG,
                  defaultFormFieldAppearance: 'outline',
                },
              },
            ],
            componentProperties: {
              field: createMockFieldState(),
            },
          },
        );

        const formField = container.querySelector(
          'ngx-signal-form-field-wrapper',
        );
        expect(formField).toHaveClass('ngx-signal-forms-outline');
      });

      it('should inherit stacked from global config', async () => {
        const { container } = await render(
          `<ngx-signal-form-field-wrapper [formField]="field" appearance="inherit">
            <label for="email">Email</label>
            <input id="email" type="email" />
          </ngx-signal-form-field-wrapper>`,
          {
            imports: [NgxSignalFormWrapperComponent],
            providers: [
              {
                provide: NGX_SIGNAL_FORMS_CONFIG,
                useValue: {
                  ...DEFAULT_NGX_SIGNAL_FORMS_CONFIG,
                  defaultFormFieldAppearance: 'stacked',
                },
              },
            ],
            componentProperties: {
              field: createMockFieldState(),
            },
          },
        );

        const formField = container.querySelector(
          'ngx-signal-form-field-wrapper',
        );
        expect(formField).not.toHaveClass('ngx-signal-forms-outline');
      });

      it('should use inherit by default when appearance not provided', async () => {
        const { container } = await render(
          `<ngx-signal-form-field-wrapper [formField]="field">
            <label for="email">Email</label>
            <input id="email" type="email" />
          </ngx-signal-form-field-wrapper>`,
          {
            imports: [NgxSignalFormWrapperComponent],
            providers: [
              {
                provide: NGX_SIGNAL_FORMS_CONFIG,
                useValue: {
                  ...DEFAULT_NGX_SIGNAL_FORMS_CONFIG,
                  defaultFormFieldAppearance: 'outline',
                },
              },
            ],
            componentProperties: {
              field: createMockFieldState(),
            },
          },
        );

        const formField = container.querySelector(
          'ngx-signal-form-field-wrapper',
        );
        // Should inherit outline from config
        expect(formField).toHaveClass('ngx-signal-forms-outline');
      });

      it('should ignore inherited outline config for checkbox rows', async () => {
        const { container } = await render(
          `<ngx-signal-form-field-wrapper [formField]="field" appearance="inherit">
            <label for="marketing">Marketing consent</label>
            <input id="marketing" type="checkbox" />
          </ngx-signal-form-field-wrapper>`,
          {
            imports: [NgxSignalFormWrapperComponent],
            providers: [
              {
                provide: NGX_SIGNAL_FORMS_CONFIG,
                useValue: {
                  ...DEFAULT_NGX_SIGNAL_FORMS_CONFIG,
                  defaultFormFieldAppearance: 'outline',
                },
              },
            ],
            componentProperties: {
              field: createMockFieldState(),
            },
          },
        );

        const formField = container.querySelector(
          'ngx-signal-form-field-wrapper',
        );
        expect(formField).not.toHaveClass('ngx-signal-forms-outline');
        expect(formField).not.toHaveAttribute('outline');
      });
    });

    describe('Required marker with appearance', () => {
      it('should show required marker with outline appearance', async () => {
        const { container } = await render(
          `<ngx-signal-form-field-wrapper [formField]="field" appearance="outline">
            <label for="email">Email</label>
            <input id="email" type="email" required />
          </ngx-signal-form-field-wrapper>`,
          {
            imports: [NgxSignalFormWrapperComponent],
            componentProperties: {
              field: createMockFieldState(),
            },
          },
        );

        const formField = container.querySelector(
          'ngx-signal-form-field-wrapper',
        );
        expect(formField).toHaveAttribute('data-show-required', 'true');
        expect(formField).toHaveAttribute('data-required-marker', ' *');
      });

      it('should not show required marker with stacked appearance', async () => {
        const { container } = await render(
          `<ngx-signal-form-field-wrapper [formField]="field" appearance="stacked">
            <label for="email">Email</label>
            <input id="email" type="email" required />
          </ngx-signal-form-field-wrapper>`,
          {
            imports: [NgxSignalFormWrapperComponent],
            componentProperties: {
              field: createMockFieldState(),
            },
          },
        );

        const formField = container.querySelector(
          'ngx-signal-form-field-wrapper',
        );
        expect(formField).not.toHaveAttribute('data-show-required', 'true');
        expect(formField).not.toHaveAttribute('data-required-marker');
      });

      it('should use plain appearance when explicitly set', async () => {
        const { container } = await render(
          `<ngx-signal-form-field-wrapper [formField]="field" appearance="plain">
            <label for="email">Email</label>
            <input id="email" type="email" />
          </ngx-signal-form-field-wrapper>`,
          {
            imports: [NgxSignalFormWrapperComponent],
            componentProperties: {
              field: createMockFieldState(),
            },
          },
        );

        const formField = container.querySelector(
          'ngx-signal-form-field-wrapper',
        );
        expect(formField).toHaveClass('ngx-signal-forms-plain');
        expect(formField).not.toHaveClass('ngx-signal-forms-outline');
      });

      it('should keep padded-control styling hooks for explicit slider semantics in plain appearance', async () => {
        const { container } = await render(
          `<ngx-signal-form-field-wrapper [formField]="field" appearance="plain">
            <label for="rating">Rating</label>
            <div
              id="rating"
              role="slider"
              tabindex="0"
              ngxSignalFormControl="slider"
            ></div>
          </ngx-signal-form-field-wrapper>`,
          {
            imports: [
              NgxSignalFormWrapperComponent,
              NgxSignalFormControlSemanticsDirective,
            ],
            componentProperties: {
              field: createMockFieldState(),
            },
          },
        );

        const formField = container.querySelector(
          'ngx-signal-form-field-wrapper',
        );

        expect(formField).toHaveAttribute(
          'data-ngx-signal-form-control-kind',
          'slider',
        );
        expect(formField).toHaveAttribute(
          'data-ngx-signal-form-control-layout',
          'stacked',
        );
        expect(formField).toHaveAttribute(
          'data-ngx-signal-form-control-aria-mode',
          'auto',
        );
        expect(formField).toHaveClass(
          'ngx-signal-form-field-wrapper--padded-control',
          'ngx-signal-forms-plain',
        );
        expect(formField).not.toHaveClass('ngx-signal-forms-outline');
      });

      it('should keep padded-control styling hooks for explicit composite semantics in plain appearance', async () => {
        const { container } = await render(
          `<ngx-signal-form-field-wrapper [formField]="field" appearance="plain">
            <label for="picker">Picker</label>
            <div
              id="picker"
              role="group"
              tabindex="0"
              ngxSignalFormControl="composite"
            ></div>
          </ngx-signal-form-field-wrapper>`,
          {
            imports: [
              NgxSignalFormWrapperComponent,
              NgxSignalFormControlSemanticsDirective,
            ],
            componentProperties: {
              field: createMockFieldState(),
            },
          },
        );

        const formField = container.querySelector(
          'ngx-signal-form-field-wrapper',
        );

        expect(formField).toHaveAttribute(
          'data-ngx-signal-form-control-kind',
          'composite',
        );
        expect(formField).toHaveAttribute(
          'data-ngx-signal-form-control-layout',
          'custom',
        );
        expect(formField).toHaveAttribute(
          'data-ngx-signal-form-control-aria-mode',
          'auto',
        );
        expect(formField).toHaveClass(
          'ngx-signal-form-field-wrapper--padded-control',
          'ngx-signal-forms-plain',
        );
        expect(formField).not.toHaveClass('ngx-signal-forms-outline');
      });
    });
  });

  describe('Preset overrides via provideNgxSignalFormControlPresets', () => {
    // The headline "dynamic wrapper extensibility" feature: consumers override
    // preset defaults through DI, and the wrapper must reflect that override
    // in its resolved semantics (layout, aria-mode). Unit tests on the
    // provider itself only cover the injector-tree merge; this test pins
    // end-to-end propagation into the rendered wrapper host attributes so a
    // regression in the `inject(NGX_SIGNAL_FORM_CONTROL_PRESETS)` wiring or
    // `resolveNgxSignalFormControlSemantics` cannot ship silently.
    it('should reflect environment-scoped preset overrides in wrapper host attributes', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="rating">Rating</label>
          <div
            id="rating"
            role="slider"
            tabindex="0"
            data-ngx-signal-form-control
          ></div>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          providers: [
            provideNgxSignalFormControlPresets({
              slider: { layout: 'inline-control', ariaMode: 'manual' },
            }),
          ],
          componentProperties: { field: createMockFieldState() },
        },
      );

      const wrapper = container.querySelector('ngx-signal-form-field-wrapper');

      // Heuristic still resolves `kind` from `role="slider"`, but layout and
      // ariaMode must come from the override, not the defaults.
      expect(wrapper).toHaveAttribute(
        'data-ngx-signal-form-control-kind',
        'slider',
      );
      expect(wrapper).toHaveAttribute(
        'data-ngx-signal-form-control-layout',
        'inline-control',
      );
      expect(wrapper).toHaveAttribute(
        'data-ngx-signal-form-control-aria-mode',
        'manual',
      );
    });

    it('should reflect component-scoped preset overrides independently of ancestors', async () => {
      // Pins the scoping guarantee: `provideNgxSignalFormControlPresetsForComponent`
      // applies to the wrapper's subtree only. A sibling wrapper outside the
      // component-scoped provider would still see defaults — a regression in
      // the Provider[] return type (vs EnvironmentProviders) or injector tree
      // traversal would break this.
      @Component({
        selector: 'ngx-preset-override-host',
        standalone: true,
        imports: [NgxSignalFormWrapperComponent],
        providers: [
          provideNgxSignalFormControlPresetsForComponent({
            slider: { layout: 'inline-control', ariaMode: 'manual' },
          }),
        ],
        template: `
          <ngx-signal-form-field-wrapper [formField]="field">
            <label for="rating">Rating</label>
            <div
              id="rating"
              role="slider"
              tabindex="0"
              data-ngx-signal-form-control
            ></div>
          </ngx-signal-form-field-wrapper>
        `,
      })
      class HostComponent {
        readonly field = createMockFieldState();
      }

      const { container } = await render(HostComponent);

      const wrapper = container.querySelector('ngx-signal-form-field-wrapper');
      expect(wrapper).toHaveAttribute(
        'data-ngx-signal-form-control-kind',
        'slider',
      );
      expect(wrapper).toHaveAttribute(
        'data-ngx-signal-form-control-layout',
        'inline-control',
      );
      expect(wrapper).toHaveAttribute(
        'data-ngx-signal-form-control-aria-mode',
        'manual',
      );
    });

    it('should let explicit directive inputs win over provider overrides', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="rating">Rating</label>
          <div
            id="rating"
            role="slider"
            tabindex="0"
            ngxSignalFormControlLayout="stacked"
          ></div>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [
            NgxSignalFormWrapperComponent,
            NgxSignalFormControlSemanticsDirective,
          ],
          providers: [
            provideNgxSignalFormControlPresets({
              slider: { layout: 'inline-control', ariaMode: 'manual' },
            }),
          ],
          componentProperties: { field: createMockFieldState() },
        },
      );

      const wrapper = container.querySelector('ngx-signal-form-field-wrapper');

      // Explicit `ngxSignalFormControlLayout` wins over the provider
      // override, but aria-mode (unset explicitly) still comes from the
      // provider. This pins the three-layer resolution order.
      expect(wrapper).toHaveAttribute(
        'data-ngx-signal-form-control-layout',
        'stacked',
      );
      expect(wrapper).toHaveAttribute(
        'data-ngx-signal-form-control-aria-mode',
        'manual',
      );
    });
  });

  describe('hidden() field behavior', () => {
    it('should suppress errors and apply the hidden host attr when field().hidden() is true', async () => {
      const hiddenField = signal({
        invalid: () => true,
        touched: () => true,
        hidden: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="secret">
          <label for="secret">Secret</label>
          <input id="secret" type="text" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: { field: hiddenField },
        },
      );

      const wrapper = container.querySelector('ngx-signal-form-field-wrapper');
      expect(wrapper).toHaveAttribute('hidden', '');

      // No error component should render even though the field is invalid + touched.
      expect(container.querySelector('ngx-form-field-error')).toBeNull();
    });

    it('should still render errors when field().hidden() is false', async () => {
      const visibleField = signal({
        invalid: () => true,
        touched: () => true,
        hidden: () => false,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="email">
          <label for="email">Email</label>
          <input id="email" type="email" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: { field: visibleField },
        },
      );

      const wrapper = container.querySelector('ngx-signal-form-field-wrapper');
      expect(wrapper).not.toHaveAttribute('hidden');
      expect(container.querySelector('ngx-form-field-error')).toBeTruthy();
    });

    it('should treat fields without a hidden() method as visible', async () => {
      const legacyField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="legacy">
          <label for="legacy">Legacy</label>
          <input id="legacy" type="text" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: { field: legacyField },
        },
      );

      const wrapper = container.querySelector('ngx-signal-form-field-wrapper');
      expect(wrapper).not.toHaveAttribute('hidden');
      expect(container.querySelector('ngx-form-field-error')).toBeTruthy();
    });
  });

  describe('Dev-mode diagnostics', () => {
    // An `<input type="file">` is discovered by the native-control selector
    // but fails every branch of `inferNgxSignalFormControlKind` (not a text-like
    // type, no role, no `data-ngx-signal-form-control`), so semantics resolve
    // to `kind: null` — the exact wiring-mistake path the warning exists for.

    const classificationWarningMarker = 'could not infer a control kind';
    const getClassificationWarnings = (
      spy: ReturnType<typeof vi.spyOn>,
    ): readonly string[] => {
      const messages: string[] = [];
      for (const call of spy.mock.calls) {
        const first: unknown = call[0];
        if (
          typeof first === 'string' &&
          first.includes(classificationWarningMarker)
        ) {
          messages.push(first);
        }
      }
      return messages;
    };

    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('should warn once when a bound control cannot be classified to a kind', async () => {
      const field = createMockFieldState();

      await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="upload">Upload</label>
          <input id="upload" type="file" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: { field },
        },
      );

      const warnings = getClassificationWarnings(warnSpy);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('ngxSignalFormControl="..."');
    });

    it('should NOT warn when the bound control resolves to a known kind', async () => {
      const field = createMockFieldState();

      await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="name">Name</label>
          <input id="name" type="text" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: { field },
        },
      );

      expect(getClassificationWarnings(warnSpy)).toHaveLength(0);
    });

    it('should keep the warning one-shot across re-renders of the same wrapper', async () => {
      const field = createMockFieldState();

      const { rerender } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="upload">Upload</label>
          <input id="upload" type="file" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: { field },
        },
      );

      // Trigger a re-render by toggling field state; the warning must not fire again.
      field.set({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'File is required' }],
      });
      await rerender({ componentProperties: { field } });

      expect(getClassificationWarnings(warnSpy)).toHaveLength(1);
    });
  });
});
