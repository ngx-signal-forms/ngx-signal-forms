import { signal } from '@angular/core';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { NgxSignalFormFieldComponent } from './form-field.component';

/**
 * Test suite for NgxSignalFormFieldComponent.
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

describe('NgxSignalFormFieldComponent', () => {
  describe('Basic rendering', () => {
    it('should render the component with host element', async () => {
      const { container } = await render(
        `<ngx-signal-form-field [field]="field" fieldName="test-field">
        </ngx-signal-form-field>`,
        {
          imports: [NgxSignalFormFieldComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const formField = container.querySelector('ngx-signal-form-field');
      expect(formField).toBeTruthy();
    });

    it('should have the correct structure with content wrapper', async () => {
      const { container } = await render(
        `<ngx-signal-form-field [field]="field" fieldName="test-field">
        </ngx-signal-form-field>`,
        {
          imports: [NgxSignalFormFieldComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const formField = container.querySelector('ngx-signal-form-field');
      const contentWrapper = formField?.querySelector(
        '.ngx-signal-form-field__content',
      );

      expect(formField).toBeTruthy();
      expect(contentWrapper).toBeTruthy();
    });
  });

  describe('Content projection', () => {
    it('should project label and input content', async () => {
      await render(
        `<ngx-signal-form-field [field]="field" fieldName="test-field">
          <label for="email">Email</label>
          <input id="email" type="email" />
        </ngx-signal-form-field>`,
        {
          imports: [NgxSignalFormFieldComponent],
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
        `<ngx-signal-form-field [field]="field" fieldName="test-field">
          <label for="username">Username</label>
          <input id="username" type="text" />
          <span class="hint">Choose a unique username</span>
        </ngx-signal-form-field>`,
        {
          imports: [NgxSignalFormFieldComponent],
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
        `<ngx-signal-form-field [field]="field" fieldName="test-field">
          <div class="label-wrapper">
            <label for="password">Password</label>
            <button type="button">Show</button>
          </div>
          <input id="password" type="password" />
          <div class="requirements">
            <span>Min 8 characters</span>
          </div>
        </ngx-signal-form-field>`,
        {
          imports: [NgxSignalFormFieldComponent],
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
        `<ngx-signal-form-field [field]="field" fieldName="test-field">
        </ngx-signal-form-field>`,
        {
          imports: [NgxSignalFormFieldComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const formField = container.querySelector('ngx-signal-form-field');
      const contentWrapper = formField?.querySelector(
        '.ngx-signal-form-field__content',
      );

      expect(formField).toBeTruthy();
      expect(contentWrapper).toBeTruthy();
      expect(contentWrapper?.textContent?.trim()).toBe('');
    });
  });

  describe('Layout behavior', () => {
    it('should render form field wrapper that contains projected content', async () => {
      const { container } = await render(
        `<ngx-signal-form-field [field]="field" fieldName="test-field">
          <label for="test-input">Test Label</label>
          <input type="text" id="test-input" />
        </ngx-signal-form-field>`,
        {
          imports: [NgxSignalFormFieldComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const formField = container.querySelector('ngx-signal-form-field');
      const label = screen.getByText('Test Label');
      const input = screen.getByRole('textbox');

      expect(formField).toBeTruthy();
      expect(label).toBeTruthy();
      expect(input).toBeTruthy();
    });
  });

  describe('Integration scenarios', () => {
    it('should work with textarea elements', async () => {
      await render(
        `<ngx-signal-form-field [field]="field" fieldName="test-field">
          <label for="bio">Bio</label>
          <textarea id="bio" rows="4"></textarea>
        </ngx-signal-form-field>`,
        {
          imports: [NgxSignalFormFieldComponent],
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
        `<ngx-signal-form-field [field]="field" fieldName="test-field">
          <label for="country">Country</label>
          <select id="country">
            <option value="us">USA</option>
            <option value="uk">UK</option>
          </select>
        </ngx-signal-form-field>`,
        {
          imports: [NgxSignalFormFieldComponent],
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
        `<ngx-signal-form-field [field]="field" fieldName="test-field">
          <label>
            <input type="checkbox" id="agree" />
            I agree to the terms
          </label>
        </ngx-signal-form-field>`,
        {
          imports: [NgxSignalFormFieldComponent],
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
        `<ngx-signal-form-field [field]="field" fieldName="test-field">
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
        </ngx-signal-form-field>`,
        {
          imports: [NgxSignalFormFieldComponent],
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
        `<ngx-signal-form-field [field]="field" fieldName="test-field">
          <label for="email">Email Address</label>
          <input id="email" type="email" />
        </ngx-signal-form-field>`,
        {
          imports: [NgxSignalFormFieldComponent],
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
        `<ngx-signal-form-field [field]="field" fieldName="test-field">
          <label for="phone">Phone</label>
          <input
            id="phone"
            type="tel"
            aria-describedby="phone-hint"
            aria-required="true"
          />
          <span id="phone-hint">Include country code</span>
        </ngx-signal-form-field>`,
        {
          imports: [NgxSignalFormFieldComponent],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const input = screen.getByRole('textbox');

      expect(input.getAttribute('aria-describedby')).toBe('phone-hint');
      expect(input.getAttribute('aria-required')).toBe('true');
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
        `<ngx-signal-form-field [field]="field" fieldName="test-field">
          <label for="test">Test</label>
          <input id="test" type="text" />
        </ngx-signal-form-field>`,
        {
          imports: [NgxSignalFormFieldComponent],
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
        `<ngx-signal-form-field
          [field]="field"
          fieldName="test-field"
          [showErrors]="false"
        >
          <label for="test">Test</label>
          <input id="test" type="text" />
        </ngx-signal-form-field>`,
        {
          imports: [NgxSignalFormFieldComponent],
          componentProperties: {
            field: invalidField,
          },
        },
      );

      const errorComponent = container.querySelector('ngx-signal-form-error');
      expect(errorComponent).toBeFalsy();
    });
  });
});
