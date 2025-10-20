# @ngx-signal-forms/toolkit/form-field

Form field components and directives for enhanced form layouts and accessibility.

## 🎨 Theming

**New simplified theming architecture available!** We've reduced the CSS custom properties from 60+ to just 20 with improved derivation patterns.

**[📖 Complete Theming Guide →](./THEMING.md)**

Quick examples:

- Dark mode theme (8 properties)
- Brand color customization
- Size scaling with unitless multipliers
- Material Design inspired theme

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
<ngx-signal-form-field [field]="form.email" fieldName="email">
  <label for="email">Email</label>
  <input id="email" [field]="form.email" />
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
<ngx-signal-form-field [field]="form.bio">
  <!-- Labels and inputs are projected -->
  <label for="bio">Bio</label>
  <textarea id="bio" [field]="form.bio"></textarea>

  <!-- Hints and character counts are projected in a separate slot -->
  <ngx-signal-form-field-hint>Max 500 characters</ngx-signal-form-field-hint>
  <ngx-signal-form-field-character-count [field]="form.bio" [maxLength]="500" />
</ngx-signal-form-field>
```

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
<ngx-signal-form-field [field]="form.email" outline>
  <label for="email">Email Address</label>
  <input
    id="email"
    type="email"
    [field]="form.email"
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
  [field]="form.email"
  outline
  [showRequiredMarker]="false"
>
  <label for="email">Email</label>
  <input id="email" [field]="form.email" required />
</ngx-signal-form-field>
```

**Custom required marker - "(required)":**

```html
<ngx-signal-form-field [field]="form.email" outline requiredMarker="(required)">
  <label for="email">Email</label>
  <input id="email" [field]="form.email" required />
</ngx-signal-form-field>
<!-- Result: "Email(required)" -->
```

**Custom required marker - dagger (†):**

```html
<ngx-signal-form-field [field]="form.email" outline requiredMarker=" †">
  <label for="email">Email</label>
  <input id="email" [field]="form.email" required />
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
    --ngx-form-field-outline-bg: #1f2937;
    --ngx-form-field-outline-border: 1px solid rgba(156, 163, 175, 0.25);
    --ngx-form-field-outline-label-color: rgba(209, 213, 219, 0.75);
    --ngx-form-field-outline-input-color: #f9fafb;
    --ngx-form-field-outline-placeholder-color: rgba(156, 163, 175, 0.5);
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

---

### NgxSignalFormFieldHintComponent

Displays helper text for form fields.

**Import:**

```typescript
import { NgxSignalFormFieldHintComponent } from '@ngx-signal-forms/toolkit/form-field';
```

**Usage:**

```html
<ngx-signal-form-field [field]="form.phone" outline>
  <label for="phone">Phone Number</label>
  <input id="phone" [field]="form.phone" />
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
<ngx-signal-form-field [field]="form.bio" outline>
  <label for="bio">Bio</label>
  <textarea id="bio" [field]="form.bio"></textarea>
  <ngx-signal-form-field-character-count [field]="form.bio" [maxLength]="500" />
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
  [field]="form.bio"
  [maxLength]="500"
  [showLimitColors]="false"
/>
```

**Custom thresholds:**

```html
<ngx-signal-form-field-character-count
  [field]="form.tweet"
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
  Field,
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
    Field,
    NgxSignalFormFieldComponent,
    NgxFloatingLabelDirective,
    NgxSignalFormFieldHintComponent,
    NgxSignalFormFieldCharacterCountComponent,
  ],
  template: `
    <form (ngSubmit)="save()">
      <!-- Outlined email field with custom required marker -->
      <ngx-signal-form-field
        [field]="contactForm.email"
        outline
        requiredMarker=" (required)"
      >
        <label for="email">Email Address</label>
        <input
          id="email"
          type="email"
          [field]="contactForm.email"
          required
          placeholder="you@example.com"
        />
        <ngx-signal-form-field-hint>
          We'll never share your email
        </ngx-signal-form-field-hint>
      </ngx-signal-form-field>

      <!-- Outlined message field with character count -->
      <ngx-signal-form-field [field]="contactForm.message" outline>
        <label for="message">Message</label>
        <textarea
          id="message"
          [field]="contactForm.message"
          required
          rows="4"
        ></textarea>
        <ngx-signal-form-field-character-count
          [field]="contactForm.message"
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

  protected save(): void {
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

### No Configuration Tokens

This package does not provide any configuration tokens. All customization is done via:

- Component inputs
- CSS custom properties
- Content projection

---

## Migration Guide

### From Standard Layout to Outlined Layout

**Before:**

```html
<ngx-signal-form-field [field]="form.email">
  <label for="email">Email</label>
  <input id="email" [field]="form.email" />
</ngx-signal-form-field>
```

**After:**

```html
<ngx-signal-form-field [field]="form.email" outline>
  <label for="email">Email</label>
  <input id="email" [field]="form.email" />
</ngx-signal-form-field>
```

### From ngxFloatingLabel to outline

If you used the previous `ngxFloatingLabel` selector, update to `outline`:

**Before:**

```html
<ngx-signal-form-field
  [field]="form.email"
  ngxFloatingLabel
></ngx-signal-form-field>
```

**After:**

```html
<ngx-signal-form-field [field]="form.email" outline></ngx-signal-form-field>
```

---

## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)
