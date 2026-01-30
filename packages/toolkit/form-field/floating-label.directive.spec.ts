import { signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFloatingLabelDirective } from './floating-label.directive';
import { NgxSignalFormFieldWrapperComponent as NgxSignalFormFieldWrapper } from './form-field-wrapper.component';

/**
 * Test suite for NgxFloatingLabelDirective.
 *
 * Tests cover:
 * - Basic directive application and CSS class addition
 * - Required marker display (show/hide)
 * - Custom required marker characters
 * - Data attribute bindings for CSS styling
 * - Integration with NgxSignalFormFieldWrapperComponent
 * - Accessibility compliance (ARIA attributes preserved)
 */

const createMockFieldState = () =>
  signal({
    invalid: () => false,
    touched: () => false,
    errors: () => [],
  });

describe('NgxFloatingLabelDirective', () => {
  describe('Basic directive application', () => {
    it('should add ngx-signal-forms-outline class when outline attribute is present', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" outline>
          <label for="email">Email</label>
          <input id="email" type="email" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormFieldWrapper, NgxFloatingLabelDirective],
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

    it('should not add ngx-signal-forms-outline class without outline attribute', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field">
          <label for="email">Email</label>
          <input id="email" type="email" />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormFieldWrapper, NgxFloatingLabelDirective],
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
  });

  describe('Accessibility', () => {
    it('should preserve label for attribute', async () => {
      await render(
        `<ngx-signal-form-field-wrapper [formField]="field" outline>
          <label for="email">Email Address</label>
          <input id="email" type="email" required />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormFieldWrapper, NgxFloatingLabelDirective],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const label = screen.getByText('Email Address');
      const input = screen.getByLabelText('Email Address');

      expect(label).toHaveAttribute('for', 'email');
      expect(input).toHaveAttribute('id', 'email');
    });

    it('should preserve required attribute on input', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" outline>
          <label for="password">Password</label>
          <input id="password" type="password" required />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormFieldWrapper, NgxFloatingLabelDirective],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const input = container.querySelector('input#password');
      expect(input).toHaveAttribute('required');
    });
  });

  describe('Integration with form field component', () => {
    it('should work with textarea elements', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" outline>
          <label for="bio">Bio</label>
          <textarea id="bio" required></textarea>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormFieldWrapper, NgxFloatingLabelDirective],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const formField = container.querySelector(
        'ngx-signal-form-field-wrapper',
      );
      expect(formField).toHaveClass('ngx-signal-forms-outline');

      const textarea = container.querySelector('textarea#bio');
      expect(textarea).toHaveAttribute('required');
    });

    it('should work with select elements', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" outline>
          <label for="country">Country</label>
          <select id="country" required>
            <option value="">Select...</option>
            <option value="us">United States</option>
            <option value="ca">Canada</option>
          </select>
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormFieldWrapper, NgxFloatingLabelDirective],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const formField = container.querySelector(
        'ngx-signal-form-field-wrapper',
      );
      expect(formField).toHaveClass('ngx-signal-forms-outline');

      const select = container.querySelector('select#country');
      expect(select).toHaveAttribute('required');
    });

    it('should work with placeholder text', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper [formField]="field" outline>
          <label for="email">Email</label>
          <input id="email" type="email" placeholder="you@example.com" required />
        </ngx-signal-form-field-wrapper>`,
        {
          imports: [NgxSignalFormFieldWrapper, NgxFloatingLabelDirective],
          componentProperties: {
            field: createMockFieldState(),
          },
        },
      );

      const input = container.querySelector('input#email');
      expect(input).toHaveAttribute('placeholder', 'you@example.com');
    });
  });

  describe('Multiple outlined fields', () => {
    it('should apply directive to multiple fields independently', async () => {
      const { container } = await render(
        `<div>
          <ngx-signal-form-field-wrapper [formField]="field1" outline>
            <label for="email">Email</label>
            <input id="email" type="email" />
          </ngx-signal-form-field-wrapper>

          <ngx-signal-form-field-wrapper [formField]="field2" outline [showRequiredMarker]="false">
            <label for="username">Username</label>
            <input id="username" type="text" />
          </ngx-signal-form-field-wrapper>

          <ngx-signal-form-field-wrapper [formField]="field3">
            <label for="password">Password</label>
            <input id="password" type="password" />
          </ngx-signal-form-field-wrapper>
        </div>`,
        {
          imports: [NgxSignalFormFieldWrapper, NgxFloatingLabelDirective],
          componentProperties: {
            field1: createMockFieldState(),
            field2: createMockFieldState(),
            field3: createMockFieldState(),
          },
        },
      );

      const formFields = container.querySelectorAll(
        'ngx-signal-form-field-wrapper',
      );
      expect(formFields).toHaveLength(3);

      // First field: outline with default required marker
      expect(formFields[0]).toHaveClass('ngx-signal-forms-outline');
      expect(formFields[0]).toHaveAttribute('data-show-required', 'true');
      expect(formFields[0]).toHaveAttribute('data-required-marker', ' *');

      // Second field: outline without required marker
      expect(formFields[1]).toHaveClass('ngx-signal-forms-outline');
      expect(formFields[1]).not.toHaveAttribute('data-show-required', 'true');

      // Third field: no outline
      expect(formFields[2]).not.toHaveClass('ngx-signal-forms-outline');
    });
  });
});
