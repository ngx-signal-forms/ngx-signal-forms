# @ngx-signal-forms/toolkit/assistive

Styled assistive components for Angular Signal Forms. These provide visual feedback and supplementary information for form fields.

## Installation

```bash
npm install @ngx-signal-forms/toolkit
```

## Components

### NgxSignalFormErrorComponent

WCAG 2.2 compliant error and warning display component.

```html
<ngx-signal-form-error [formField]="form.email" fieldName="email" />
```

Features:

- **Errors**: `role="alert"` with `aria-live="assertive"` for immediate announcement
- **Warnings**: `role="status"` with `aria-live="polite"` for non-intrusive guidance
- Strategy-based display: `'on-touch'`, `'on-submit'`, `'immediate'`, `'manual'`
- 3-tier message resolution: validator → registry → defaults

### NgxFormFieldHintComponent

Displays helper text for form fields.

```html
<ngx-signal-form-field-hint>Format: 123-456-7890</ngx-signal-form-field-hint>
```

When used inside `ngx-signal-form-field-wrapper`, hints are automatically linked
to the input via `aria-describedby`.

### NgxFormFieldCharacterCountComponent

Displays character count with progressive color states.

```html
<ngx-signal-form-field-character-count
  [formField]="form.bio"
  [maxLength]="500"
/>
```

Optional live announcements:

```html
<ngx-signal-form-field-character-count
  [formField]="form.bio"
  [maxLength]="500"
  liveAnnounce
/>
```

### NgxFormFieldAssistiveRowComponent

Layout container for hint, error, and character count.

```html
<ngx-signal-form-field-assistive-row>
  <ngx-signal-form-field-hint>Enter your bio</ngx-signal-form-field-hint>
  <ngx-signal-form-field-character-count
    [formField]="form.bio"
    [maxLength]="500"
  />
</ngx-signal-form-field-assistive-row>
```

## Utilities

### Warning Support

Angular Signal Forms doesn't have native warning support. This package provides a convention-based approach:

```typescript
import {
  warningError,
  isWarningError,
  isBlockingError,
} from '@ngx-signal-forms/toolkit/assistive';

// Create a warning
const warning = warningError(
  'weak-password',
  'Consider using a stronger password',
);

// Check if an error is a warning
if (isWarningError(error)) {
  // Non-blocking validation message
}

// Check if an error is blocking
if (isBlockingError(error)) {
  // Prevents form submission
}
```

## Architecture

This package sits between `headless` and `form-field` in the dependency hierarchy:

```text
@ngx-signal-forms/toolkit           (core utilities)
@ngx-signal-forms/toolkit/headless  (unstyled primitives)
@ngx-signal-forms/toolkit/assistive (styled building blocks) ← You are here
@ngx-signal-forms/toolkit/form-field (complete wrapper)
```

## Theming

Components use CSS custom properties for theming:

```css
:root {
  /* Error/Warning */
  --ngx-signal-form-error-color: #db1818;
  --ngx-signal-form-error-bg: transparent;
  --ngx-signal-form-error-border: transparent;
  --ngx-signal-form-warning-color: #f59e0b;
  --ngx-signal-form-warning-bg: transparent;
  --ngx-signal-form-warning-border: transparent;
  --ngx-signal-form-error-message-spacing: 0.25rem;
  --ngx-signal-form-error-padding-horizontal: 0.5rem;
  --ngx-signal-form-error-animation: ngxStatusSlideIn 300ms
    cubic-bezier(0.2, 0.8, 0.2, 1) forwards;

  /* Shared feedback typography */
  --ngx-signal-form-feedback-font-size: 0.75rem;
  --ngx-signal-form-feedback-line-height: 1rem;
  --ngx-signal-form-feedback-margin-top: 0.125rem;
  --ngx-signal-form-feedback-padding-horizontal: 0.5rem;

  /* Assistive row */
  --ngx-form-field-assistive-min-height: 1.25rem;
  --ngx-form-field-assistive-gap: 0.5rem;
  --ngx-form-field-assistive-margin-top: 2px;

  /* Hint */
  --ngx-form-field-hint-font-size: 0.75rem;
  --ngx-form-field-hint-line-height: 1rem;
  --ngx-form-field-hint-color: rgba(50, 65, 85, 0.75);

  /* Character count */
  --ngx-form-field-char-count-color-ok: rgba(50, 65, 85, 0.75);
  --ngx-form-field-char-count-color-warning: #f59e0b;
  --ngx-form-field-char-count-color-danger: #db1818;
  --ngx-form-field-char-count-color-exceeded: #991b1b;
  --ngx-form-field-char-count-font-size: 0.75rem;
  --ngx-form-field-char-count-line-height: 1.25;
  --ngx-form-field-char-count-weight-exceeded: 600;
}
```

## License

MIT
