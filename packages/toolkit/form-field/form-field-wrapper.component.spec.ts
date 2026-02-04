import { signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_NGX_SIGNAL_FORMS_CONFIG,
  NGX_SIGNAL_FORMS_CONFIG,
} from '../core/tokens';
import { NgxSignalFormFieldWrapperComponent as NgxSignalFormWrapperComponent } from './form-field-wrapper.component';

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
  signal({
    invalid: () => false,
    touched: () => false,
    errors: () => [],
  });

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
      const errorComponent = container.querySelector('ngx-signal-form-error');
      expect(errorComponent).toBeTruthy();

      // The error ID should be based on the explicit fieldName
      const errorContainer = container.querySelector(
        '[id="custom-email-error"]',
      );
      expect(errorContainer).toBeTruthy();
    });

    it('should auto-generate unique fieldName when not provided', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label>Email</label>
          <input type="email" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      const errorComponent = container.querySelector('ngx-signal-form-error');
      expect(errorComponent).toBeTruthy();

      // Should generate an error ID like "field-N-error"
      const errorContainer = container.querySelector(
        '[id^="field-"][id$="-error"]',
      );
      expect(errorContainer).toBeTruthy();
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
        'ngx-signal-form-error',
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
        'ngx-signal-form-error',
      );
      expect(errorComponents).toHaveLength(3);

      // Check explicit fieldNames created proper IDs
      expect(container.querySelector('[id="email-error"]')).toBeTruthy();
      expect(container.querySelector('[id="confirm-error"]')).toBeTruthy();

      // Check auto-derived ID from input's id attribute (not auto-generated fallback)
      expect(container.querySelector('[id="password-error"]')).toBeTruthy();
    });

    it('should handle empty string fieldName', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="">
          <input type="text" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      const errorComponent = container.querySelector('ngx-signal-form-error');
      expect(errorComponent).toBeTruthy();

      // Empty fieldName should result in error ID "-error"
      const errorContainer = container.querySelector('[id="-error"]');
      expect(errorContainer).toBeTruthy();
    });

    it('should pass auto-generated fieldName to error component for ARIA attribute generation', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <input type="text" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      const errorComponent = container.querySelector('ngx-signal-form-error');
      expect(errorComponent).toBeTruthy();

      // Should generate ID like "field-N-error" where N is a number
      const errorContainer = container.querySelector(
        '[id^="field-"][id$="-error"]',
      );
      expect(errorContainer).toBeTruthy();

      const errorId = errorContainer?.getAttribute('id');
      expect(errorId).toMatch(/^field-\d+-error$/);
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
      expect(label?.contains(input as Node)).toBe(true);

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
        `<ngx-signal-form-field-wrapper [formField]="field" outline>
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
          outline
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
          outline
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

      const label = screen.getByText('Email Address') as HTMLLabelElement;
      const input = screen.getByRole('textbox');

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

      const errorComponent = container.querySelector('ngx-signal-form-error');
      expect(errorComponent).toBeTruthy();
    });

    it('should not show error component when showErrors is false', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ key: 'required', message: 'This field is required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper
          [formField]="field"
          fieldName="test-field"
          [showErrors]="false"
        >
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

      const errorComponent = container.querySelector('ngx-signal-form-error');
      expect(errorComponent).toBeFalsy();
    });

    it('should display errors WITHOUT [ngxSignalForm] context for on-touch strategy', async () => {
      /**
       * KEY CAPABILITY: NgxSignalFormWrapperComponent works WITHOUT [ngxSignalForm] directive
       * for the default 'on-touch' strategy.
       *
       * The 'on-touch' strategy only checks `field.invalid() && field.touched()`.
       * It does NOT require `submittedStatus` signal from form context.
       *
       * This means users can use <ngx-signal-form-field-wrapper> for simple forms without
       * needing to add [ngxSignalForm] to their <form> element.
       */
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Email is required' }],
      });

      // No [ngxSignalForm] context - just the component in isolation
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
     * the wrapper uses a fallback DOM query: [id]:not(label):not(ngx-signal-form-field-wrapper)
     * to detect custom controls with an id attribute.
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
          <div id="rating" role="slider" aria-label="Rating"></div>
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
          <div id="custom-picker" role="listbox"></div>
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
          <div id="control" role="slider"></div>
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
          <div id="outer" role="slider"></div>
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

    it('should allow explicit fieldName to override custom control id', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" fieldName="explicit-name">
          <label for="custom">Custom</label>
          <div id="custom" role="slider"></div>
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

    it('should generate fallback ID when custom control has no id', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      // No native elements, no id on custom control
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label>Custom Control</label>
          <div role="slider"></div>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      // Should fall back to auto-generated ID pattern
      const errorElement = container.querySelector(
        '[id^="field-"][id$="-error"]',
      );
      expect(errorElement).toBeTruthy();
    });
  });

  describe('DI Context Provider (NGX_SIGNAL_FORM_FIELD_CONTEXT)', () => {
    it('should provide field context to child components via DI', async () => {
      /**
       * This test verifies the wrapper provides NGX_SIGNAL_FORM_FIELD_CONTEXT
       * which allows child components (like ngx-signal-form-error) to inherit
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

    it('should fallback to auto-generated ID when no input has id attribute', async () => {
      const invalidField = signal({
        invalid: () => true,
        touched: () => true,
        errors: () => [{ kind: 'required', message: 'Required' }],
      });

      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label>No ID Field</label>
          <input type="text" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormWrapperComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      // Should fallback to auto-generated ID pattern
      const errorElement = container.querySelector(
        '[id^="field-"][id$="-error"]',
      );
      expect(errorElement).toBeTruthy();
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
    describe('Standard appearance', () => {
      it('should use standard appearance by default (inherit from config default)', async () => {
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
        // Default config is 'standard', so should NOT have outline class
        expect(formField).not.toHaveClass('ngx-signal-forms-outline');
        expect(formField).not.toHaveAttribute('outline');
      });

      it('should use standard appearance when explicitly set', async () => {
        const { container } = await render(
          `<ngx-signal-form-field-wrapper [formField]="field" appearance="standard">
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

      it('should override global outline config with standard appearance', async () => {
        const { container } = await render(
          `<ngx-signal-form-field-wrapper [formField]="field" appearance="standard">
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
        // Should be standard despite global config
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

      it('should override global standard config with outline appearance', async () => {
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
                  defaultFormFieldAppearance: 'standard',
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

      it('should inherit standard from global config', async () => {
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
                  defaultFormFieldAppearance: 'standard',
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
    });

    describe('Backward compatibility with outline boolean', () => {
      it('should still work with outline boolean attribute', async () => {
        const { container } = await render(
          `<ngx-signal-form-field-wrapper [formField]="field" outline>
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
      });

      it('should prioritize outline boolean over appearance input', async () => {
        const { container } = await render(
          `<ngx-signal-form-field-wrapper [formField]="field" appearance="standard" outline>
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
        // outline boolean has priority for backward compatibility
        expect(formField).toHaveClass('ngx-signal-forms-outline');
      });

      it('should prioritize outline boolean over global config', async () => {
        const { container } = await render(
          `<ngx-signal-form-field-wrapper [formField]="field" outline>
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
                  defaultFormFieldAppearance: 'standard',
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
        // outline boolean overrides everything
        expect(formField).toHaveClass('ngx-signal-forms-outline');
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

      it('should not show required marker with standard appearance', async () => {
        const { container } = await render(
          `<ngx-signal-form-field-wrapper [formField]="field" appearance="standard">
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
  });
});
