# @ngx-signal-forms/toolkit/form-field

Form field components and directives for enhanced form layouts and accessibility.

## ✨ Features

- ✅ **WCAG 2.2 Level AA Compliant** - All color combinations meet 4.5:1+ contrast ratios
- ✅ **Outlined Material Design Layout** - Floating labels with native HTML/CSS (no JavaScript)
- ✅ **Progressive Character Count** - Visual feedback with color states (ok → warning → danger → exceeded)
- ✅ **Automatic Error Display** - Integrated with toolkit's error strategies
- ✅ **Flexible Theming** - 20+ CSS custom properties for complete customization
- ✅ **System/App Theme Harmony** - Handles conflicts between OS preference and app theme selection

> **Note**: For technical details on WCAG compliance and theme override patterns, see [THEMING.md](./THEMING.md#handling-system-preference-vs-app-theme-conflicts).

## 🎨 Theming

**New simplified theming architecture available!** We've reduced the CSS custom properties from 60+ to just 20 with improved derivation patterns.

**[📖 Complete Theming Guide →](./THEMING.md)**

Quick examples:

- Dark mode theme (8 properties)
- Brand color customization
- Size scaling with unitless multipliers
- Material Design inspired theme

---

## 📦 Convenience Export Bundle

### NgxOutlinedFormField

A convenience bundle that includes all components needed for outlined form fields. Simplifies imports when using the outlined layout.

**Import:**

```typescript
import { NgxOutlinedFormField } from '@ngx-signal-forms/toolkit/form-field';
```

**Includes:**

- `NgxSignalFormFieldComponent` - Form field wrapper
- `NgxFloatingLabelDirective` - Outlined layout with floating label
- `NgxSignalFormFieldHintComponent` - Helper text
- `NgxSignalFormFieldCharacterCountComponent` - Character counter

**Usage:**

```typescript
import { Field } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit/core';
import { NgxOutlinedFormField } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  imports: [FormField, NgxSignalFormToolkit, NgxOutlinedFormField],
  template: `
    <form [ngxSignalForm]="contactForm">
      <ngx-signal-form-field [formField]="contactForm.email" outline>
        <label for="email">Email</label>
        <input id="email" [formField]="contactForm.email" />
        <ngx-signal-form-field-hint>We'll never share your email</ngx-signal-form-field-hint>
      </ngx-signal-form-field>
    </form>
  `,
})
```

**Benefits:**

- ✅ Single import instead of four separate imports
- ✅ Type-safe readonly tuple
- ✅ Cleaner component metadata
- ✅ Better developer experience

---

## Components & Directives

### NgxSignalFormFieldComponent

Reusable form field wrapper with automatic error display and consistent layout.

**Import:**

```typescript
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
```

**Basic Usage:**

```html
<ngx-signal-form-field [formField]="form.email" fieldName="email">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" />
</ngx-signal-form-field>
```

#### Inputs

| Input        | Type                           | Default                      | Description                                  |
| ------------ | ------------------------------ | ---------------------------- | -------------------------------------------- |
| `field`      | `FieldTree<TValue>`            | _required_                   | The Signal Forms field to display            |
| `fieldName`  | `string`                       | Auto-derived from input `id` | Field name for error IDs and ARIA attributes |
| `strategy`   | `ErrorDisplayStrategy \| null` | Inherited from form provider | Error display strategy                       |
| `showErrors` | `boolean`                      | `true`                       | Whether to show automatic error display      |

#### Content Projection

The component uses content projection to allow full customization:

```html
<ngx-signal-form-field [formField]="form.bio">
  <!-- Labels and inputs are projected -->
  <label for="bio">Bio</label>
  <textarea id="bio" [formField]="form.bio"></textarea>

  <!-- Hints and character counts are projected in a separate slot -->
  <ngx-signal-form-field-hint>Max 500 characters</ngx-signal-form-field-hint>
  <ngx-signal-form-field-character-count
    [formField]="form.bio"
    [maxLength]="500"
  />
</ngx-signal-form-field>
```

#### Prefix/Suffix Slots

Add icons, text, or interactive elements before or after the input using `prefix` and `suffix` attributes.

**Search icon prefix:**

```html
<ngx-signal-form-field [formField]="form.search">
  <span prefix aria-hidden="true">🔍</span>
  <label for="search">Search</label>
  <input id="search" [formField]="form.search" />
</ngx-signal-form-field>
```

**Show/hide password button suffix:**

```html
<ngx-signal-form-field [formField]="form.password">
  <label for="password">Password</label>
  <input
    id="password"
    [type]="showPassword() ? 'text' : 'password'"
    [formField]="form.password"
  />
  <button suffix type="button" (click)="togglePassword()">
    {{ showPassword() ? 'Hide' : 'Show' }}
  </button>
</ngx-signal-form-field>
```

**Currency symbols (both prefix and suffix):**

```html
<ngx-signal-form-field [formField]="form.amount">
  <span prefix aria-hidden="true">$</span>
  <label for="amount">Amount</label>
  <input id="amount" type="number" [formField]="form.amount" step="0.01" />
  <span suffix aria-hidden="true">.00</span>
</ngx-signal-form-field>
```

**Clear button with outlined layout:**

```html
<ngx-signal-form-field [formField]="form.query" outline>
  <span prefix aria-hidden="true">🔍</span>
  <label for="query">Search</label>
  <input id="query" [formField]="form.query" />
  @if (form.query().value()) {
  <button
    suffix
    type="button"
    (click)="clearSearch()"
    aria-label="Clear search"
  >
    ✕
  </button>
  }
</ngx-signal-form-field>
```

**Accessibility Notes:**

- Decorative prefix/suffix icons should use `aria-hidden="true"`
- Interactive suffix buttons need descriptive `aria-label` or visible text
- Suffix buttons should use `type="button"` to prevent form submission
- Prefix/suffix elements should not be focusable unless interactive

#### CSS Custom Properties

**Standard layout** (without `outline` directive):

```css
:root {
  /* Form field layout */
  --ngx-form-field-gap: 0.5rem;
  --ngx-form-field-margin-bottom: 1rem;
  --ngx-form-field-width: 100%;

  /* Label styling (optional) */
  --ngx-form-field-label-font-size: 0.875rem;
  --ngx-form-field-label-font-weight: 500;
  --ngx-form-field-label-line-height: 1.25rem;
  --ngx-form-field-label-color: #374151;
  --ngx-form-field-label-margin-bottom: 0.25rem;

  /* Input styling (optional) */
  --ngx-form-field-input-font-size: 0.875rem;
  --ngx-form-field-input-font-weight: 400;
  --ngx-form-field-input-line-height: 1.5;
  --ngx-form-field-input-color: #1f2937;
  --ngx-form-field-input-padding: 0.5rem 0.75rem;
  --ngx-form-field-input-border: 1px solid #d1d5db;
  --ngx-form-field-input-border-radius: 0.375rem;
  --ngx-form-field-input-bg: #ffffff;
  --ngx-form-field-input-transition:
    border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

  /* Input states */
  --ngx-form-field-input-focus-border-color: #3b82f6;
  --ngx-form-field-input-focus-box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  --ngx-form-field-input-invalid-border-color: #ef4444;
  --ngx-form-field-input-disabled-bg: #f9fafb;
    --ngx-form-field-input-disabled-opacity: 0.6;

  /* Prefix/Suffix */
  --ngx-form-field-prefix-gap: 0.5rem;
  --ngx-form-field-suffix-gap: 0.5rem;
  --ngx-form-field-prefix-color: #9ca3af;
  --ngx-form-field-suffix-color: #9ca3af;
}
  --ngx-form-field-input-placeholder-color: #9ca3af;
}
```

---

### NgxFloatingLabelDirective

Transforms `NgxSignalFormFieldComponent` into an outlined layout where the label sits inside the input border, matching Material Design outlined input patterns.

**Import:**

```typescript
import { NgxFloatingLabelDirective } from '@ngx-signal-forms/toolkit/form-field';
// Or via public_api.ts
```

**Basic Usage:**

```html
<ngx-signal-form-field [formField]="form.email" outline>
  <label for="email">Email Address</label>
  <input
    id="email"
    type="email"
    [formField]="form.email"
    required
    placeholder="you@example.com"
  />
</ngx-signal-form-field>
```

#### Inputs

| Input                | Type      | Default | Description                                             |
| -------------------- | --------- | ------- | ------------------------------------------------------- |
| `showRequiredMarker` | `boolean` | `true`  | Whether to show the required marker for required fields |
| `requiredMarker`     | `string`  | `' *'`  | Custom character(s) to display for required fields      |

#### Required Field Indicator

By default, the required marker (`*`) is automatically shown when the input has the `required` attribute or `aria-required="true"`.

**Hide required marker:**

```html
<ngx-signal-form-field
  [formField]="form.email"
  outline
  [showRequiredMarker]="false"
>
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" required />
</ngx-signal-form-field>
```

**Custom required marker - "(required)":**

```html
<ngx-signal-form-field
  [formField]="form.email"
  outline
  requiredMarker="(required)"
>
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" required />
</ngx-signal-form-field>
<!-- Result: "Email(required)" -->
```

**Custom required marker - dagger (†):**

```html
<ngx-signal-form-field [formField]="form.email" outline requiredMarker=" †">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" required />
</ngx-signal-form-field>
<!-- Result: "Email †" -->
```

#### CSS Custom Properties

**Outlined layout** (with `outline` directive):

```css
:root {
  /* Layout */
  --ngx-form-field-outline-gap: 0.125rem;
  --ngx-form-field-outline-padding: 0.5rem 0.75rem;
  --ngx-form-field-outline-min-height: 3.5rem;

  /* Container */
  --ngx-form-field-outline-bg: #ffffff;
  --ngx-form-field-outline-border: 1px solid rgba(50, 65, 85, 0.25);
  --ngx-form-field-outline-border-radius: 0.25rem;
  --ngx-form-field-outline-transition:
    border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;

  /* Label */
  --ngx-form-field-outline-label-font-family: 'Inter Variable', sans-serif;
  --ngx-form-field-outline-label-font-size: 0.75rem;
  --ngx-form-field-outline-label-font-weight: 400;
  --ngx-form-field-outline-label-line-height: 1rem;
  --ngx-form-field-outline-label-color: rgba(71, 91, 119, 0.75);

  /* Required marker */
  --ngx-form-field-outline-required-color: #dc2626;
  --ngx-form-field-outline-required-font-weight: 600;

  /* Input */
  --ngx-form-field-outline-input-font-family: 'Inter Variable', sans-serif;
  --ngx-form-field-outline-input-font-size: 0.875rem;
  --ngx-form-field-outline-input-font-weight: 400;
  --ngx-form-field-outline-input-line-height: 1.25rem;
  --ngx-form-field-outline-input-color: #324155;

  /* Placeholder */
  --ngx-form-field-outline-placeholder-color: rgba(71, 91, 119, 0.5);

  /* Focus state */
  --ngx-form-field-outline-focus-border-color: #005fcc;
  --ngx-form-field-outline-focus-box-shadow: 0 0 0 2px rgba(0, 95, 204, 0.25);

  /* Invalid state */
  --ngx-form-field-outline-invalid-border-color: #dc2626;
  --ngx-form-field-outline-invalid-focus-box-shadow: 0 0 0 2px
    rgba(220, 38, 38, 0.25);

  /* Disabled state */
  --ngx-form-field-outline-disabled-bg: #f3f4f6;
  --ngx-form-field-outline-disabled-opacity: 0.6;
}
```

**Example - Custom theme:**

```css
/* Brand colors for outlined layout */
:root {
  --ngx-form-field-outline-focus-border-color: #10b981; /* Green */
  --ngx-form-field-outline-focus-box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
  --ngx-form-field-outline-required-color: #ef4444; /* Red */
}

/* Dark mode for outlined layout */
@media (prefers-color-scheme: dark) {
  :root {
    --ngx-form-field-outline-bg: #111827; /* Dark input background */
    --ngx-form-field-outline-border: 1px solid rgba(156, 163, 175, 0.25); /* Subtle border */
    --ngx-form-field-outline-label-color: rgba(
      209,
      213,
      219,
      0.75
    ); /* Light gray label */
    --ngx-form-field-outline-input-color: #f9fafb; /* Almost white text */
    --ngx-form-field-outline-placeholder-color: rgba(
      156,
      163,
      175,
      0.35
    ); /* Lighter placeholder */
    --ngx-form-field-outline-focus-border-color: #60a5fa; /* Lighter blue for focus */
    --ngx-form-field-outline-focus-box-shadow: 0 0 0 2px
      rgba(96, 165, 250, 0.25); /* Lighter blue glow */
    --ngx-form-field-outline-disabled-bg: #1f2937; /* Slightly lighter for disabled */
    --ngx-form-field-outline-disabled-opacity: 0.5; /* Reduced opacity */
  }
}
```

#### Browser Support

Requires CSS `:has()` selector:

- Chrome 105+
- Firefox 121+
- Safari 15.4+
- Edge 105+

**Coverage:** 95%+ global browser support as of 2025.

#### Accessibility

- Focus state applied to container meets WCAG 2.2 Level AA
- Input outline removed safely (container provides visible focus indicator)
- Required fields automatically detected via CSS `:has()` selector
- ARIA attributes handled by parent `NgxSignalFormFieldComponent`

#### Error/Warning Alignment

The form field component automatically aligns error and warning messages with the input text for a polished, professional appearance.

**Standard layout:**

- Errors have 8px horizontal padding (`0.5rem`) for breathing room on both sides

**Outlined layout:**

- Errors inherit the same 8px horizontal padding to align perfectly with the outlined container's horizontal padding
- Ensures visual consistency and professional polish

**Automatic behavior:**

- No configuration needed - alignment is built-in via CSS custom property override
- Works seamlessly with `ngx-signal-form-error` component
- Responsive to both standard and outlined form field layouts
- No `::ng-deep` required - uses CSS custom properties for clean encapsulation

**Implementation details:**

The form-field component sets the `--ngx-signal-form-error-padding-horizontal` CSS custom property, which the form-error component consumes:

```scss
/* Form field component sets the custom property */
:host {
  --ngx-signal-form-error-padding-horizontal: 0.5rem; /* 8px */
}

/* Form error component consumes it */
.ngx-signal-form-error {
  padding-left: var(--ngx-signal-form-error-padding-horizontal);
  padding-right: var(--ngx-signal-form-error-padding-horizontal);
}
```

**To customize:** Override `--ngx-signal-form-error-padding-horizontal` in your component styles.

---

### NgxSignalFormFieldHintComponent

Displays helper text for form fields.

**Import:**

```typescript
import { NgxSignalFormFieldHintComponent } from '@ngx-signal-forms/toolkit/form-field';
```

**Usage:**

```html
<ngx-signal-form-field [formField]="form.phone" outline>
  <label for="phone">Phone Number</label>
  <input id="phone" [formField]="form.phone" />
  <ngx-signal-form-field-hint>Format: 123-456-7890</ngx-signal-form-field-hint>
</ngx-signal-form-field>
```

**Position control:**

```html
<ngx-signal-form-field-hint position="right">
  Optional field
</ngx-signal-form-field-hint>
```

#### CSS Custom Properties

```css
:root {
  --ngx-form-field-hint-font-size: 0.75rem;
  --ngx-form-field-hint-color: #6b7280;
}
```

---

### NgxSignalFormFieldCharacterCountComponent

Displays character count with progressive color states.

**Import:**

```typescript
import { NgxSignalFormFieldCharacterCountComponent } from '@ngx-signal-forms/toolkit/form-field';
```

**Usage:**

```html
<ngx-signal-form-field [formField]="form.bio" outline>
  <label for="bio">Bio</label>
  <textarea id="bio" [formField]="form.bio"></textarea>
  <ngx-signal-form-field-character-count
    [formField]="form.bio"
    [maxLength]="500"
  />
</ngx-signal-form-field>
```

#### Inputs

| Input             | Type                                  | Default                       | Description                                    |
| ----------------- | ------------------------------------- | ----------------------------- | ---------------------------------------------- |
| `field`           | `FieldTree<TValue>`                   | _required_                    | The Signal Forms field to count characters for |
| `maxLength`       | `number`                              | _required_                    | Maximum character limit                        |
| `showLimitColors` | `boolean`                             | `true`                        | Whether to use progressive color states        |
| `colorThresholds` | `{ warning: number; danger: number }` | `{ warning: 80, danger: 95 }` | Percentage thresholds for color changes        |

#### Color States

The component automatically changes color based on character count:

| State        | Percentage | Default Color            | Description       |
| ------------ | ---------- | ------------------------ | ----------------- |
| **ok**       | 0-80%      | Gray (#6b7280)           | Normal state      |
| **warning**  | 80-95%     | Amber (#f59e0b)          | Approaching limit |
| **danger**   | 95-100%    | Red (#dc2626)            | Near limit        |
| **exceeded** | >100%      | Dark red (#991b1b), bold | Over limit        |

**Disable color progression:**

```html
<ngx-signal-form-field-character-count
  [formField]="form.bio"
  [maxLength]="500"
  [showLimitColors]="false"
/>
```

**Custom thresholds:**

```html
<ngx-signal-form-field-character-count
  [formField]="form.tweet"
  [maxLength]="280"
  [colorThresholds]="{ warning: 90, danger: 98 }"
/>
```

#### CSS Custom Properties

```css
:root {
  --ngx-form-field-char-count-font-size: 0.75rem;
  --ngx-form-field-char-count-color-ok: #6b7280;
  --ngx-form-field-char-count-color-warning: #f59e0b;
  --ngx-form-field-char-count-color-danger: #dc2626;
  --ngx-form-field-char-count-color-exceeded: #991b1b;
}
```

---

## Complete Example

```typescript
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import {
  form,
  schema,
  required,
  email,
  maxLength,
  FormField,
} from '@angular/forms/signals';
import {
  NgxSignalFormFieldComponent,
  NgxFloatingLabelDirective,
  NgxSignalFormFieldHintComponent,
  NgxSignalFormFieldCharacterCountComponent,
} from '@ngx-signal-forms/toolkit/form-field';

interface ContactForm {
  email: string;
  message: string;
}

const contactSchema = schema<ContactForm>((path) => {
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Invalid email format' });
  required(path.message, { message: 'Message is required' });
  maxLength(path.message, 500, { message: 'Max 500 characters' });
});

@Component({
  selector: 'app-contact-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    NgxSignalFormFieldComponent,
    NgxFloatingLabelDirective,
    NgxSignalFormFieldHintComponent,
    NgxSignalFormFieldCharacterCountComponent,
  ],
  template: `
    <form (submit)="save($event)" novalidate>
      <!-- Outlined email field with custom required marker -->
      <ngx-signal-form-field
        [formField]="contactForm.email"
        outline
        requiredMarker=" (required)"
      >
        <label for="email">Email Address</label>
        <input
          id="email"
          type="email"
          [formField]="contactForm.email"
          required
          placeholder="you@example.com"
        />
        <ngx-signal-form-field-hint>
          We'll never share your email
        </ngx-signal-form-field-hint>
      </ngx-signal-form-field>

      <!-- Outlined message field with character count -->
      <ngx-signal-form-field [formField]="contactForm.message" outline>
        <label for="message">Message</label>
        <textarea
          id="message"
          [formField]="contactForm.message"
          required
          rows="4"
        ></textarea>
        <ngx-signal-form-field-character-count
          [formField]="contactForm.message"
          [maxLength]="500"
        />
      </ngx-signal-form-field>

      <button type="submit" [disabled]="contactForm().invalid()">
        Send Message
      </button>
    </form>
  `,
  styles: `
    /* Custom theme for outlined fields */
    :host {
      --ngx-form-field-outline-focus-border-color: #10b981;
      --ngx-form-field-outline-focus-box-shadow: 0 0 0 2px
        rgba(16, 185, 129, 0.25);
      --ngx-form-field-outline-required-color: #ef4444;
    }
  `,
})
export class ContactFormComponent {
  readonly #model = signal<ContactForm>({ email: '', message: '' });
  protected readonly contactForm = form(this.#model, contactSchema);

  protected save(event: Event): void {
    event.preventDefault();
    if (this.contactForm().valid()) {
      console.log('Form data:', this.#model());
    }
  }
}
```

---

## API Summary

### Public Exports

```typescript
// Components
export { NgxSignalFormFieldComponent } from './form-field.component';
export { NgxSignalFormFieldHintComponent } from './form-field-hint.component';
export { NgxSignalFormFieldCharacterCountComponent } from './form-field-character-count.component';

// Directives
export { NgxFloatingLabelDirective } from './floating-label.directive';
```

---

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)
