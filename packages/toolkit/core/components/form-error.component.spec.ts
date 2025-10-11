import { describe, it, expect } from 'vitest';
import { inputBinding, signal } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { NgxSignalFormErrorComponent } from './form-error.component';

/**
 * Helper to create mock FieldTree for testing.
 * FieldTree<T> is a callable that returns FieldState<T>
 */
const createMockFieldTree = (
  invalid = false,
  touched = false,
  errors: Array<{ kind: string; message: string }> = [],
) => {
  // Create a signal that wraps the FieldState-like object
  const fieldState = {
    invalid: () => invalid,
    touched: () => touched,
    errors: () => errors,
  };

  // FieldTree is a callable that returns FieldState
  const fieldTree = () => fieldState;

  // Return as a signal wrapping the fieldTree function
  return signal(fieldTree);
};

describe('NgxSignalFormErrorComponent', () => {
  describe('error rendering', () => {
    it('should render errors when field is invalid and touched (on-touch strategy)', async () => {
      const fieldTree = createMockFieldTree(true, true, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldTree),
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
      const fieldTree = createMockFieldTree(false, true, []);
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldTree),
          inputBinding('fieldName', () => 'email'),
          inputBinding('strategy', () => 'on-touch'),
          inputBinding('hasSubmitted', hasSubmitted),
        ],
      });

      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });

    it('should not render errors when field is invalid but not touched (on-touch strategy)', async () => {
      const fieldTree = createMockFieldTree(true, false, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldTree),
          inputBinding('fieldName', () => 'email'),
          inputBinding('strategy', () => 'on-touch'),
          inputBinding('hasSubmitted', hasSubmitted),
        ],
      });

      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });

    it('should render multiple errors', async () => {
      const fieldTree = createMockFieldTree(true, true, [
        { kind: 'required', message: 'This field is required' },
        { kind: 'email', message: 'Must be a valid email' },
      ]);
      const hasSubmitted = signal(false);

      const { container } = await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldTree),
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
      const fieldTree = createMockFieldTree(true, false, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldTree),
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
      const fieldTree = createMockFieldTree(true, true, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldTree),
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
      const fieldTree = createMockFieldTree(true, true, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(true);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldTree),
          inputBinding('fieldName', () => 'email'),
          inputBinding('strategy', () => 'manual'),
          inputBinding('hasSubmitted', hasSubmitted),
        ],
      });

      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });

    it('should show errors after submit even if not touched (on-touch strategy)', async () => {
      const fieldTree = createMockFieldTree(true, false, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(true);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldTree),
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
      const fieldTree = createMockFieldTree(true, true, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldTree),
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
      const fieldTree = createMockFieldTree(true, true, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldTree),
          inputBinding('fieldName', () => 'email'),
          inputBinding('strategy', () => 'on-touch'),
          inputBinding('hasSubmitted', hasSubmitted),
        ],
      });

      const alert = screen.getByRole('alert');
      expect(alert.getAttribute('aria-live')).toBe('assertive');
    });

    it('should have correct error ID for aria-describedby linking', async () => {
      const fieldTree = createMockFieldTree(true, true, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldTree),
          inputBinding('fieldName', () => 'email'),
          inputBinding('strategy', () => 'on-touch'),
          inputBinding('hasSubmitted', hasSubmitted),
        ],
      });

      const alert = screen.getByRole('alert');
      expect(alert.getAttribute('id')).toBe('email-error');
    });

    it('should generate correct error ID for nested fields', async () => {
      const fieldTree = createMockFieldTree(true, true, [
        { kind: 'required', message: 'This field is required' },
      ]);
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldTree),
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
      const fieldTree = signal(null);
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldTree),
          inputBinding('fieldName', () => 'email'),
          inputBinding('strategy', () => 'on-touch'),
          inputBinding('hasSubmitted', hasSubmitted),
        ],
      });

      const alert = screen.queryByRole('alert');
      expect(alert).toBeFalsy();
    });

    it('should handle field state without errors method', async () => {
      const fieldTree = signal(() => ({
        invalid: () => true,
        touched: () => true,
      }));
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldTree),
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
      const fieldTree = createMockFieldTree(false, true, []);
      const hasSubmitted = signal(false);

      await render(NgxSignalFormErrorComponent, {
        bindings: [
          inputBinding('field', fieldTree),
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
