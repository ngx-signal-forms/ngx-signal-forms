import { describe, it, expect } from 'vitest';
import { inputBinding, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { NgxSignalFormErrorComponent } from './form-error.component';

/**
 * Helper to create mock field state for testing
 */
const createMockFieldState = (
  invalid = false,
  touched = false,
  errors: Array<{ kind: string; message: string }> = [],
) => {
  return signal({
    invalid: () => invalid,
    touched: () => touched,
    errors: () => errors,
  });
};

describe('NgxSignalFormErrorComponent', () => {
  describe('error rendering', () => {
    it('should render errors when field is invalid and touched (on-touch strategy)', async () => {
      const fieldState = createMockFieldState(true, true, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldState),
          inputBinding('fieldName', () => 'email'),
          inputBinding('strategy', () => 'on-touch'),
          inputBinding('hasSubmitted', hasSubmitted),
        ],
      });

      const alert = screen.getByRole('alert');
      expect(alert).toBeTruthy();
      expect(alert.textContent).toContain('This field is required');
    });

    it('should not render errors when field is valid', async () => {
      const fieldState = createMockFieldState(false, true, []);
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldState),
          inputBinding('fieldName', () => 'email'),
          inputBinding('strategy', () => 'on-touch'),
          inputBinding('hasSubmitted', hasSubmitted),
        ],
      });

      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });

    it('should not render errors when field is invalid but not touched (on-touch strategy)', async () => {
      const fieldState = createMockFieldState(true, false, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldState),
          inputBinding('fieldName', () => 'email'),
          inputBinding('strategy', () => 'on-touch'),
          inputBinding('hasSubmitted', hasSubmitted),
        ],
      });

      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });

    it('should render multiple errors', async () => {
      const fieldState = createMockFieldState(true, true, [
        { kind: 'required', message: 'This field is required' },
        { kind: 'email', message: 'Must be a valid email' },
      ]);
      const hasSubmitted = signal(false);

      const { container } = await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldState),
          inputBinding('fieldName', () => 'email'),
          inputBinding('strategy', () => 'on-touch'),
          inputBinding('hasSubmitted', hasSubmitted),
        ],
      });

      const messages = container.querySelectorAll(
        '.ngx-signal-form-error__message',
      );
      expect(messages.length).toBe(2);
      expect(messages[0]?.textContent?.trim()).toBe('This field is required');
      expect(messages[1]?.textContent?.trim()).toBe('Must be a valid email');
    });
  });

  describe('strategy switching', () => {
    it('should show errors immediately with immediate strategy', async () => {
      const fieldState = createMockFieldState(true, false, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldState),
          inputBinding('fieldName', () => 'email'),
          inputBinding('strategy', () => 'immediate'),
          inputBinding('hasSubmitted', hasSubmitted),
        ],
      });

      const alert = screen.getByRole('alert');
      expect(alert).toBeTruthy();
      expect(alert.textContent).toContain('This field is required');
    });

    it('should only show errors after submit with on-submit strategy', async () => {
      const fieldState = createMockFieldState(true, true, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldState),
          inputBinding('fieldName', () => 'email'),
          inputBinding('strategy', () => 'on-submit'),
          inputBinding('hasSubmitted', hasSubmitted),
        ],
      });

      let alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();

      // After submission
      hasSubmitted.set(true);

      alert = await screen.findByRole('alert');
      expect(alert).toBeTruthy();
    });

    it('should never show errors with manual strategy', async () => {
      const fieldState = createMockFieldState(true, true, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(true);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldState),
          inputBinding('fieldName', () => 'email'),
          inputBinding('strategy', () => 'manual'),
          inputBinding('hasSubmitted', hasSubmitted),
        ],
      });

      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });

    it('should show errors after submit even if not touched (on-touch strategy)', async () => {
      const fieldState = createMockFieldState(true, false, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(true);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldState),
          inputBinding('fieldName', () => 'email'),
          inputBinding('strategy', () => 'on-touch'),
          inputBinding('hasSubmitted', hasSubmitted),
        ],
      });

      const alert = screen.getByRole('alert');
      expect(alert).toBeTruthy();
    });
  });

  describe('WCAG compliance', () => {
    it('should have role="alert" for screen reader announcements', async () => {
      const fieldState = createMockFieldState(true, true, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldState),
          inputBinding('fieldName', () => 'email'),
          inputBinding('strategy', () => 'on-touch'),
          inputBinding('hasSubmitted', hasSubmitted),
        ],
      });

      const alert = screen.getByRole('alert');
      expect(alert).toBeTruthy();
      expect(alert.getAttribute('role')).toBe('alert');
    });

    it('should have aria-live="assertive" for errors (immediate announcement)', async () => {
      const fieldState = createMockFieldState(true, true, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldState),
          inputBinding('fieldName', () => 'email'),
          inputBinding('strategy', () => 'on-touch'),
          inputBinding('hasSubmitted', hasSubmitted),
        ],
      });

      const alert = screen.getByRole('alert');
      expect(alert.getAttribute('aria-live')).toBe('assertive');
    });

    it('should have correct error ID for aria-describedby linking', async () => {
      const fieldState = createMockFieldState(true, true, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldState),
          inputBinding('fieldName', () => 'email'),
          inputBinding('strategy', () => 'on-touch'),
          inputBinding('hasSubmitted', hasSubmitted),
        ],
      });

      const alert = screen.getByRole('alert');
      expect(alert.getAttribute('id')).toBe('email-error');
    });

    it('should generate correct error ID for nested fields', async () => {
      const fieldState = createMockFieldState(true, true, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldState),
          inputBinding('fieldName', () => 'user.profile.email'),
          inputBinding('strategy', () => 'on-touch'),
          inputBinding('hasSubmitted', hasSubmitted),
        ],
      });

      const alert = screen.getByRole('alert');
      expect(alert.getAttribute('id')).toBe('user.profile.email-error');
    });
  });

  describe('edge cases', () => {
    it('should handle null field state gracefully', async () => {
      const fieldState = signal(null);
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldState),
          inputBinding('fieldName', () => 'email'),
          inputBinding('strategy', () => 'on-touch'),
          inputBinding('hasSubmitted', hasSubmitted),
        ],
      });

      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });

    it('should handle field state without errors method', async () => {
      const fieldState = signal({
        invalid: () => true,
        touched: () => true,
      });
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldState),
          inputBinding('fieldName', () => 'email'),
          inputBinding('strategy', () => 'on-touch'),
          inputBinding('hasSubmitted', hasSubmitted),
        ],
      });

      // No errors method means no errors to display
      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });

    it('should handle empty errors array', async () => {
      const fieldState = createMockFieldState(false, true, []);
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldState),
          inputBinding('fieldName', () => 'email'),
          inputBinding('strategy', () => 'on-touch'),
          inputBinding('hasSubmitted', hasSubmitted),
        ],
      });

      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });
  });
});
