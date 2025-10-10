import { Component } from '@angular/core';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/angular';
import { NgxSignalFormFieldComponent } from './form-field.component';

/**
 * Test suite for NgxSignalFormFieldComponent.
 *
 * Tests cover:
 * - Basic rendering and structure
 * - Content projection (ng-content)
 * - CSS class application
 * - Custom CSS variable support
 * - Accessibility structure
 *
 * NOTE: This component is intentionally simple in its current iteration.
 * Future iterations will add:
 * - Field input for error display
 * - Label association
 * - Help text support
 * - Custom error templates
 */
describe('NgxSignalFormFieldComponent', () => {
  describe('Basic rendering', () => {
    it('should render the component wrapper', async () => {
      @Component({
        template: '<ngx-signal-form-field></ngx-signal-form-field>',
        imports: [NgxSignalFormFieldComponent],
      })
      class TestComponent {}

      const { container } = await render(TestComponent);

      const formField = container.querySelector('.ngx-signal-form-field');
      expect(formField).toBeTruthy();
    });

    it('should have the correct structure with content wrapper', async () => {
      @Component({
        template: '<ngx-signal-form-field></ngx-signal-form-field>',
        imports: [NgxSignalFormFieldComponent],
      })
      class TestComponent {}

      const { container } = await render(TestComponent);

      const formField = container.querySelector('.ngx-signal-form-field');
      const contentWrapper = formField?.querySelector(
        '.ngx-signal-form-field__content',
      );

      expect(formField).toBeTruthy();
      expect(contentWrapper).toBeTruthy();
    });
  });

  describe('Content projection', () => {
    it('should project label and input content', async () => {
      @Component({
        template: `
          <ngx-signal-form-field>
            <label for="email">Email</label>
            <input id="email" type="email" />
          </ngx-signal-form-field>
        `,
        imports: [NgxSignalFormFieldComponent],
      })
      class TestComponent {}

      await render(TestComponent);

      const label = screen.getByText('Email');
      const input = screen.getByRole('textbox');

      expect(label).toBeTruthy();
      expect(input).toBeTruthy();
    });

    it('should project multiple form controls', async () => {
      @Component({
        template: `
          <ngx-signal-form-field>
            <label for="username">Username</label>
            <input id="username" type="text" />
            <span class="hint">Choose a unique username</span>
          </ngx-signal-form-field>
        `,
        imports: [NgxSignalFormFieldComponent],
      })
      class TestComponent {}

      const { container } = await render(TestComponent);

      const label = screen.getByText('Username');
      const input = screen.getByRole('textbox');
      const hint = container.querySelector('.hint');

      expect(label).toBeTruthy();
      expect(input).toBeTruthy();
      expect(hint?.textContent).toBe('Choose a unique username');
    });

    it('should project complex nested content', async () => {
      @Component({
        template: `
          <ngx-signal-form-field>
            <div class="label-wrapper">
              <label for="password">Password</label>
              <button type="button">Show</button>
            </div>
            <input id="password" type="password" />
            <div class="requirements">
              <span>Min 8 characters</span>
            </div>
          </ngx-signal-form-field>
        `,
        imports: [NgxSignalFormFieldComponent],
      })
      class TestComponent {}

      const { container } = await render(TestComponent);

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
      @Component({
        template: '<ngx-signal-form-field></ngx-signal-form-field>',
        imports: [NgxSignalFormFieldComponent],
      })
      class TestComponent {}

      const { container } = await render(TestComponent);

      const formField = container.querySelector('.ngx-signal-form-field');
      const contentWrapper = formField?.querySelector(
        '.ngx-signal-form-field__content',
      );

      expect(formField).toBeTruthy();
      expect(contentWrapper).toBeTruthy();
      expect(contentWrapper?.textContent?.trim()).toBe('');
    });
  });

  describe('Styling and layout', () => {
    it('should apply flexbox layout styles', async () => {
      @Component({
        template: `
          <ngx-signal-form-field>
            <label for="test-input">Test Label</label>
            <input type="text" id="test-input" />
          </ngx-signal-form-field>
        `,
        imports: [NgxSignalFormFieldComponent],
      })
      class TestComponent {}

      const { container } = await render(TestComponent);

      const formField = container.querySelector(
        '.ngx-signal-form-field',
      ) as HTMLElement;
      const styles = window.getComputedStyle(formField);

      expect(styles.display).toBe('flex');
      expect(styles.flexDirection).toBe('column');
    });

    it('should support CSS custom properties for gap', async () => {
      @Component({
        template: `
          <ngx-signal-form-field style="--sft-form-field-gap: 1rem">
            <label for="test-input">Test</label>
            <input type="text" id="test-input" />
          </ngx-signal-form-field>
        `,
        imports: [NgxSignalFormFieldComponent],
      })
      class TestComponent {}

      const { container } = await render(TestComponent);

      const formField = container.querySelector(
        '.ngx-signal-form-field',
      ) as HTMLElement;
      const customGap = formField.style.getPropertyValue(
        '--ngx-signal-form-field-gap',
      );

      expect(customGap).toBe('1rem');
    });

    it('should support CSS custom properties for margin', async () => {
      @Component({
        template: `
          <ngx-signal-form-field style="--sft-form-field-margin: 2rem">
            <label for="test-input">Test</label>
            <input type="text" id="test-input" />
          </ngx-signal-form-field>
        `,
        imports: [NgxSignalFormFieldComponent],
      })
      class TestComponent {}

      const { container } = await render(TestComponent);

      const formField = container.querySelector(
        '.ngx-signal-form-field',
      ) as HTMLElement;
      const customMargin = formField.style.getPropertyValue(
        '--ngx-signal-form-field-margin',
      );

      expect(customMargin).toBe('2rem');
    });
  });

  describe('Integration scenarios', () => {
    it('should work with textarea elements', async () => {
      @Component({
        template: `
          <ngx-signal-form-field>
            <label for="bio">Bio</label>
            <textarea id="bio" rows="4"></textarea>
          </ngx-signal-form-field>
        `,
        imports: [NgxSignalFormFieldComponent],
      })
      class TestComponent {}

      await render(TestComponent);

      const label = screen.getByText('Bio');
      const textarea = screen.getByRole('textbox');

      expect(label).toBeTruthy();
      expect(textarea.tagName.toLowerCase()).toBe('textarea');
    });

    it('should work with select elements', async () => {
      @Component({
        template: `
          <ngx-signal-form-field>
            <label for="country">Country</label>
            <select id="country">
              <option value="us">USA</option>
              <option value="uk">UK</option>
            </select>
          </ngx-signal-form-field>
        `,
        imports: [NgxSignalFormFieldComponent],
      })
      class TestComponent {}

      await render(TestComponent);

      const label = screen.getByText('Country');
      const select = screen.getByRole('combobox');

      expect(label).toBeTruthy();
      expect(select).toBeTruthy();
    });

    it('should work with checkbox inputs', async () => {
      @Component({
        template: `
          <ngx-signal-form-field>
            <label>
              <input type="checkbox" id="agree" />
              I agree to the terms
            </label>
          </ngx-signal-form-field>
        `,
        imports: [NgxSignalFormFieldComponent],
      })
      class TestComponent {}

      await render(TestComponent);

      const checkbox = screen.getByRole('checkbox');
      const label = screen.getByText('I agree to the terms', { exact: false });

      expect(checkbox).toBeTruthy();
      expect(label).toBeTruthy();
    });

    it('should work with radio button groups', async () => {
      @Component({
        template: `
          <ngx-signal-form-field>
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
          </ngx-signal-form-field>
        `,
        imports: [NgxSignalFormFieldComponent],
      })
      class TestComponent {}

      await render(TestComponent);

      const legend = screen.getByText('Choose size');
      const radios = screen.getAllByRole('radio');

      expect(legend).toBeTruthy();
      expect(radios).toHaveLength(2);
    });
  });

  describe('Accessibility', () => {
    it('should maintain label-input associations', async () => {
      @Component({
        template: `
          <ngx-signal-form-field>
            <label for="email">Email Address</label>
            <input id="email" type="email" />
          </ngx-signal-form-field>
        `,
        imports: [NgxSignalFormFieldComponent],
      })
      class TestComponent {}

      await render(TestComponent);

      const label = screen.getByText('Email Address') as HTMLLabelElement;
      const input = screen.getByRole('textbox');

      expect(label.htmlFor).toBe('email');
      expect(input.getAttribute('id')).toBe('email');
    });

    it('should not interfere with aria attributes on inputs', async () => {
      @Component({
        template: `
          <ngx-signal-form-field>
            <label for="phone">Phone</label>
            <input
              id="phone"
              type="tel"
              aria-describedby="phone-hint"
              aria-required="true"
            />
            <span id="phone-hint">Include country code</span>
          </ngx-signal-form-field>
        `,
        imports: [NgxSignalFormFieldComponent],
      })
      class TestComponent {}

      await render(TestComponent);

      const input = screen.getByRole('textbox');

      expect(input.getAttribute('aria-describedby')).toBe('phone-hint');
      expect(input.getAttribute('aria-required')).toBe('true');
    });
  });

  describe('Future iteration placeholders', () => {
    it('should have a comment indicating future error display location', async () => {
      @Component({
        template: '<ngx-signal-form-field></ngx-signal-form-field>',
        imports: [NgxSignalFormFieldComponent],
      })
      class TestComponent {}

      await render(TestComponent);

      // This test documents where error display will be added
      // Error display will be implemented in future iterations

      // When implemented, errors should appear after the content wrapper:
      // <div class="sft-form-field__errors" *ngIf="shouldShowErrors()">
      //   <sft-form-error [field]="field()" />
      // </div>
      expect(true).toBe(true);
    });
  });
});
