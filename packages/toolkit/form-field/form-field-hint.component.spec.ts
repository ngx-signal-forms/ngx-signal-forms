import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxSignalFormFieldHintComponent } from './form-field-hint.component';

/**
 * Test suite for NgxSignalFormFieldHintComponent.
 *
 * Tests cover:
 * - Content projection functionality
 * - Position attribute binding (left, right, null)
 * - Host attribute presence/absence
 * - Simple text and HTML content projection
 * - Accessibility considerations
 */

describe('NgxSignalFormFieldHintComponent', () => {
  describe('Content projection', () => {
    it('should project simple text content', async () => {
      await render(
        `<ngx-signal-form-field-wrapper-hint>Enter your email address</ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    it('should project HTML content', async () => {
      await render(
        `<ngx-signal-form-field-wrapper-hint>
          <strong>Important:</strong> Use a valid email format
        </ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      expect(screen.getByText(/Important:/)).toBeInTheDocument();
      expect(screen.getByText(/Use a valid email format/)).toBeInTheDocument();
    });

    it('should project complex nested HTML', async () => {
      await render(
        `<ngx-signal-form-field-wrapper-hint>
          <ul>
            <li>At least 8 characters</li>
            <li>Include uppercase and lowercase</li>
            <li>Include numbers</li>
          </ul>
        </ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
      expect(
        screen.getByText('Include uppercase and lowercase'),
      ).toBeInTheDocument();
      expect(screen.getByText('Include numbers')).toBeInTheDocument();
    });

    it('should handle empty content', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper-hint></ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      const hint = container.querySelector(
        'ngx-signal-form-field-wrapper-hint',
      );
      expect(hint).toBeInTheDocument();
      expect(hint?.textContent?.trim()).toBe('');
    });

    it('should project whitespace-only content', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper-hint>   </ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      const hint = container.querySelector(
        'ngx-signal-form-field-wrapper-hint',
      );
      expect(hint).toBeInTheDocument();
    });
  });

  describe('Position attribute', () => {
    it('should not have position attribute when position is null (default)', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper-hint>Hint text</ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      const hint = container.querySelector(
        'ngx-signal-form-field-wrapper-hint',
      );
      expect(hint).not.toHaveAttribute('position');
    });

    it('should set position attribute to "left"', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper-hint [position]="position">Left hint</ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
          componentProperties: {
            position: 'left' as const,
          },
        },
      );

      const hint = container.querySelector(
        'ngx-signal-form-field-wrapper-hint',
      );
      expect(hint).toHaveAttribute('position', 'left');
    });

    it('should set position attribute to "right"', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper-hint [position]="position">Right hint</ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
          componentProperties: {
            position: 'right' as const,
          },
        },
      );

      const hint = container.querySelector(
        'ngx-signal-form-field-wrapper-hint',
      );
      expect(hint).toHaveAttribute('position', 'right');
    });

    it('should not have position attribute when explicitly set to null', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper-hint [position]="position">Null position</ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
          componentProperties: {
            position: null,
          },
        },
      );

      const hint = container.querySelector(
        'ngx-signal-form-field-wrapper-hint',
      );
      expect(hint).not.toHaveAttribute('position');
    });
  });

  describe('Dynamic position updates', () => {
    it('should update position attribute when input changes', async () => {
      const { container, rerender } = await render(
        `<ngx-signal-form-field-wrapper-hint [position]="position">Hint</ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
          componentProperties: {
            position: 'left' as const,
          },
        },
      );

      const hint = container.querySelector(
        'ngx-signal-form-field-wrapper-hint',
      );
      expect(hint).toHaveAttribute('position', 'left');

      // Change to right
      await rerender({
        componentProperties: {
          position: 'right' as const,
        },
      });

      expect(hint).toHaveAttribute('position', 'right');

      // Change to null
      await rerender({
        componentProperties: {
          position: null,
        },
      });

      expect(hint).not.toHaveAttribute('position');
    });

    it('should transition from null to positioned', async () => {
      const { container, rerender } = await render(
        `<ngx-signal-form-field-wrapper-hint [position]="position">Hint</ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
          componentProperties: {
            position: null,
          },
        },
      );

      const hint = container.querySelector(
        'ngx-signal-form-field-wrapper-hint',
      );
      expect(hint).not.toHaveAttribute('position');

      // Add position
      await rerender({
        componentProperties: {
          position: 'left' as const,
        },
      });

      expect(hint).toHaveAttribute('position', 'left');
    });

    it('should transition from positioned to null', async () => {
      const { container, rerender } = await render(
        `<ngx-signal-form-field-wrapper-hint [position]="position">Hint</ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
          componentProperties: {
            position: 'right' as const,
          },
        },
      );

      const hint = container.querySelector(
        'ngx-signal-form-field-wrapper-hint',
      );
      expect(hint).toHaveAttribute('position', 'right');

      // Remove position
      await rerender({
        componentProperties: {
          position: null,
        },
      });

      expect(hint).not.toHaveAttribute('position');
    });
  });

  describe('Multiple hints in same parent', () => {
    it('should render multiple hints with different positions', async () => {
      const { container } = await render(
        `<div>
          <ngx-signal-form-field-wrapper-hint [position]="'left'">Left hint</ngx-signal-form-field-wrapper-hint>
          <ngx-signal-form-field-wrapper-hint [position]="'right'">Right hint</ngx-signal-form-field-wrapper-hint>
          <ngx-signal-form-field-wrapper-hint>No position</ngx-signal-form-field-wrapper-hint>
        </div>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      const hints = container.querySelectorAll(
        'ngx-signal-form-field-wrapper-hint',
      );
      expect(hints).toHaveLength(3);

      expect(hints[0]).toHaveAttribute('position', 'left');
      expect(hints[1]).toHaveAttribute('position', 'right');
      expect(hints[2]).not.toHaveAttribute('position');
    });

    it('should independently manage content for multiple hints', async () => {
      await render(
        `<div>
          <ngx-signal-form-field-wrapper-hint>First hint</ngx-signal-form-field-wrapper-hint>
          <ngx-signal-form-field-wrapper-hint>Second hint</ngx-signal-form-field-wrapper-hint>
          <ngx-signal-form-field-wrapper-hint>Third hint</ngx-signal-form-field-wrapper-hint>
        </div>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      expect(screen.getByText('First hint')).toBeInTheDocument();
      expect(screen.getByText('Second hint')).toBeInTheDocument();
      expect(screen.getByText('Third hint')).toBeInTheDocument();
    });
  });

  describe('Component structure', () => {
    it('should have correct component tag name', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper-hint>Hint</ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      const hint = container.querySelector(
        'ngx-signal-form-field-wrapper-hint',
      );
      expect(hint?.tagName.toLowerCase()).toBe(
        'ngx-signal-form-field-wrapper-hint',
      );
    });

    it('should render as inline element by default', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper-hint>Hint</ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      const hint = container.querySelector(
        'ngx-signal-form-field-wrapper-hint',
      );
      expect(hint).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should preserve text content for screen readers', async () => {
      await render(
        `<ngx-signal-form-field-wrapper-hint>
          Your password must be at least 8 characters long
        </ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      const text = screen.getByText(
        /Your password must be at least 8 characters long/,
      );
      expect(text).toBeInTheDocument();
    });

    it('should allow semantic HTML for better accessibility', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper-hint>
          <span aria-label="Required format">Format: 123-456-7890</span>
        </ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      const span = container.querySelector(
        'span[aria-label="Required format"]',
      );
      expect(span).toBeInTheDocument();
      expect(span).toHaveTextContent('Format: 123-456-7890');
    });

    it('should support links in hint content', async () => {
      await render(
        `<ngx-signal-form-field-wrapper-hint>
          Need help? <a href="/support">Contact support</a>
        </ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      const link = screen.getByRole('link', { name: /Contact support/ });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/support');
    });
  });

  describe('Real-world use cases', () => {
    it('should work with form field format examples', async () => {
      await render(
        `<ngx-signal-form-field-wrapper-hint>Format: MM/DD/YYYY</ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      expect(screen.getByText('Format: MM/DD/YYYY')).toBeInTheDocument();
    });

    it('should work with validation requirements', async () => {
      await render(
        `<ngx-signal-form-field-wrapper-hint>
          Must contain at least one uppercase letter, one number, and one special character
        </ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      expect(
        screen.getByText(/Must contain at least one uppercase letter/),
      ).toBeInTheDocument();
    });

    it('should work with character count guidance', async () => {
      await render(
        `<ngx-signal-form-field-wrapper-hint [position]="'left'">
          Recommended: 150-300 characters
        </ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      expect(
        screen.getByText('Recommended: 150-300 characters'),
      ).toBeInTheDocument();
    });

    it('should work with security suggestions', async () => {
      await render(
        `<ngx-signal-form-field-wrapper-hint>
          <em>Tip:</em> Use a password manager for better security
        </ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      expect(screen.getByText(/Tip:/)).toBeInTheDocument();
      expect(
        screen.getByText(/Use a password manager for better security/),
      ).toBeInTheDocument();
    });

    it('should work with input examples', async () => {
      await render(
        `<ngx-signal-form-field-wrapper-hint>
          Example: <code>user@example.com</code>
        </ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      expect(screen.getByText(/Example:/)).toBeInTheDocument();
      expect(screen.getByText(/user@example.com/)).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle very long hint text', async () => {
      const longHint = 'a'.repeat(500);
      await render(
        `<ngx-signal-form-field-wrapper-hint>${longHint}</ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      expect(screen.getByText(longHint)).toBeInTheDocument();
    });

    it('should handle special characters in content', async () => {
      await render(
        `<ngx-signal-form-field-wrapper-hint>
          Special chars: &lt;, &gt;, &amp;, &quot;, &#39;
        </ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      expect(screen.getByText(/Special chars:/)).toBeInTheDocument();
    });

    it('should handle emoji in content', async () => {
      await render(
        `<ngx-signal-form-field-wrapper-hint>
          ✅ Valid format ❌ Invalid format
        </ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      expect(
        screen.getByText(/✅ Valid format ❌ Invalid format/),
      ).toBeInTheDocument();
    });

    it('should handle multiline content with line breaks', async () => {
      await render(
        `<ngx-signal-form-field-wrapper-hint>
          Line 1<br>
          Line 2<br>
          Line 3
        </ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      expect(screen.getByText(/Line 1/)).toBeInTheDocument();
      expect(screen.getByText(/Line 2/)).toBeInTheDocument();
      expect(screen.getByText(/Line 3/)).toBeInTheDocument();
    });

    it('should handle content with inline styles', async () => {
      const { container } = await render(
        `<ngx-signal-form-field-wrapper-hint>
          <span style="color: red;">Important note</span>
        </ngx-signal-form-field-wrapper-hint>`,
        {
          imports: [NgxSignalFormFieldHintComponent],
        },
      );

      const span = container.querySelector('span[style*="color"]');
      expect(span).toBeInTheDocument();
      expect(span).toHaveTextContent('Important note');
    });
  });
});
