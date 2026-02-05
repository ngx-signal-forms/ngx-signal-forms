# @ngx-signal-forms/toolkit/form-field

Form field components and directives for enhanced form layouts and accessibility.

## ✨ Features

- ✅ **WCAG 2.2 Level AA Compliant** - All color combinations meet 4.5:1+ contrast ratios
- ✅ **Outlined Material Design Layout** - Floating labels with native HTML/CSS (no JavaScript)
- ✅ **Progressive Character Count** - Visual feedback with color states (ok → warning → danger → exceeded)
- ✅ **Fieldset Grouping** - Group related fields with aggregated error/warning display
- ✅ **Automatic Error Display** - Integrated with toolkit's error strategies
- ✅ **Flexible Theming** - 20+ CSS custom properties for complete customization
- ✅ **System/App Theme Harmony** - Handles conflicts between OS preference and app theme selection

> **Note**: For technical details on WCAG compliance and theme override patterns, see [THEMING.md](./THEMING.md#handling-system-preference-vs-app-theme-conflicts).

## 🎨 Theming

All components in this entry point (`ngx-signal-form-field-wrapper`, `ngx-signal-form-fieldset`) and their dependencies (`ngx-signal-form-error`) share a unified theming system based on CSS Custom Properties.

**[📖 Read the Complete Theming Guide →](./THEMING.md)**

### Supported Components

- **`ngx-signal-form-field-wrapper`**: Outlined layout, borders, colors, spacing.
- **`ngx-signal-form-fieldset`**: Grouping gap and indentation.
- **`ngx-signal-form-error`**: Shared feedback typography and colors.
- **`ngx-signal-form-field-hint`**: Helper text colors and spacing.
- **`ngx-signal-form-field-character-count`**: Progressive color states.

### Quick Customization

Override these root variables to affect all components at once:

```css
:root {
  /* Scale the entire system */
  --ngx-signal-form-feedback-font-size: 0.875rem;

  /* Brand Colors */
  --ngx-form-field-color-primary: #007bc7; /* Focus rings & active borders */
  --ngx-form-field-color-error: #db1818; /* Error state */
}
```

For a full list of all 20+ variables including layout, typography, and dark mode support, see the [Theming Guide](./THEMING.md).

---

## 📦 Convenience Export Bundle

### NgxFormField

A single bundle that includes all form field components. The floating label directive is included, so outline works without extra imports.

**Import:**

```typescript
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
```

**Includes:**

- Form field wrapper component (`ngx-signal-form-field-wrapper`)
- `NgxFloatingLabelDirective` - Outlined layout with floating label
- `NgxFormFieldHintComponent` - Helper text
- `NgxFormFieldCharacterCountComponent` - Character counter
- `NgxFormFieldAssistiveRowComponent` - Assistive content row
- `NgxSignalFormErrorComponent` - Error and warning display
- `NgxSignalFormFieldset` - Grouped field validation

**Usage:**

```typescript
import { Field } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <form [ngxSignalForm]="contactForm">
      <ngx-signal-form-field-wrapper [formField]="contactForm.email" outline>
        <label for="email">Email</label>
        <input id="email" [formField]="contactForm.email" />
```

**Benefits:**

- ✅ Single import instead of multiple separate imports
- ✅ Type-safe readonly tuple
- ✅ Cleaner component metadata
- ✅ Better developer experience

---

## Components & Directives

### Form Field Wrapper Component

Reusable form field wrapper with automatic error display and consistent layout.

**Usage:**

```typescript
import { Field } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <form [ngxSignalForm]="contactForm">
      <ngx-signal-form-field-wrapper [formField]="contactForm.email" appearance="outline">
        <label for="email">Email</label>
        <input id="email" [formField]="contactForm.email" />
        <ngx-signal-form-field-hint>We'll never share your email</ngx-signal-form-field-hint>
      </ngx-signal-form-field-wrapper>
    </form>
  `,
})
```

```html
<ngx-signal-form-field-wrapper [formField]="form.bio">
  <!-- Labels and inputs are projected -->
  <label for="bio">Bio</label>
  <textarea id="bio" [formField]="form.bio"></textarea>

  <!-- Hints and character counts are projected in a separate slot -->
  <ngx-signal-form-field-hint>Max 500 characters</ngx-signal-form-field-hint>
  <ngx-signal-form-field-character-count
    [formField]="form.bio"
    [maxLength]="500"
  />
</ngx-signal-form-field-wrapper>
```

#### Prefix/Suffix Slots

Add icons, text, or interactive elements before or after the input using `prefix` and `suffix` attributes.

**Search icon prefix:**

```html
<ngx-signal-form-field-wrapper [formField]="form.search">
  <span prefix aria-hidden="true">🔍</span>
  <label for="search">Search</label>
  <input id="search" [formField]="form.search" />
</ngx-signal-form-field-wrapper>
```

**Show/hide password button suffix:**

```html
<ngx-signal-form-field-wrapper [formField]="form.password">
  <label for="password">Password</label>
  <input
    id="password"
    [type]="showPassword() ? 'text' : 'password'"
    [formField]="form.password"
  />
  <button suffix type="button" (click)="togglePassword()">
    {{ showPassword() ? 'Hide' : 'Show' }}
  </button>
</ngx-signal-form-field-wrapper>
```

**Currency symbols (both prefix and suffix):**

```html
<ngx-signal-form-field-wrapper [formField]="form.amount">
  <span prefix aria-hidden="true">$</span>
  <label for="amount">Amount</label>
  <input id="amount" type="number" [formField]="form.amount" step="0.01" />
  <span suffix aria-hidden="true">.00</span>
</ngx-signal-form-field-wrapper>
```

**Clear button with outlined layout:**

```html
<ngx-signal-form-field-wrapper [formField]="form.query" appearance="outline">
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
</ngx-signal-form-field-wrapper>
```

**Accessibility Notes:**

- Decorative prefix/suffix icons should use `aria-hidden="true"`
- Interactive suffix buttons need descriptive `aria-label` or visible text
- Suffix buttons should use `type="button"` to prevent form submission
- Prefix/suffix elements should not be focusable unless interactive

#### Warning Support

The form field component supports non-blocking warnings in addition to blocking errors. Warnings are displayed when:

1. The field has warnings (validation errors with `kind` starting with `'warn:'`)
2. The field has NO blocking errors (errors take visual priority)

**Warning convention:** Use the `'warn:'` prefix on the error `kind` to indicate a warning:

```typescript
// Error (blocks submission)
{ kind: 'required', message: 'Email is required' }

// Warning (does not block submission)
{ kind: 'warn:weak-password', message: 'Consider a stronger password' }
```

**Visual behavior:**

- **Errors present:** Error styling (red border), warnings hidden
- **Only warnings:** Warning styling (amber border), warnings shown
- **Neither:** Default styling

**Note:** If you don't want warnings, simply don't define validators that produce them. The validator controls what feedback is displayed.

#### CSS Custom Properties

**Standard layout** (without `outline` directive):

```css
:root {
  /* Layout */
  --ngx-form-field-gap: 0.125rem;

  /* Label */
  --ngx-form-field-label-size: 0.75rem;
  --ngx-form-field-label-line-height: 1rem;
  --ngx-form-field-label-weight: 400;
  --ngx-form-field-label-color: rgba(50, 65, 85, 0.75);
  --ngx-form-field-label-padding-start: 0.125rem;

  /* Input */
  --ngx-form-field-input-size: 0.875rem;
  --ngx-form-field-input-line-height: 1.25rem;
  --ngx-form-field-input-weight: 400;
  --ngx-form-field-input-padding: 0.25rem 0.5rem;

  /* Colors */
  --ngx-form-field-color-border: rgba(50, 65, 85, 0.25);
  --ngx-form-field-color-border-hover: #324155;
  --ngx-form-field-focus-color: #007bc7;
  --ngx-form-field-focus-box-shadow: 0 0 0 4px rgba(0, 123, 199, 0.25);
  --ngx-form-field-invalid-color: #db1818;
  --ngx-form-field-warning-color: #f59e0b;
}
```

---

### NgxFloatingLabelDirective

Enables the outlined layout where the label sits inside the input border, matching Material Design outlined input patterns.
When you import `NgxFormField`, the directive is already included.

**Recommended: Use `appearance` input**

```html
<ngx-signal-form-field-wrapper [formField]="form.email" appearance="outline">
  <label for="email">Email Address</label>
  <input
    id="email"
    type="email"
    [formField]="form.email"
    required
    placeholder="you@example.com"
  />
</ngx-signal-form-field-wrapper>
```

**Legacy: `outline` boolean attribute (still works)**

```html
<ngx-signal-form-field-wrapper [formField]="form.email" outline>
  <label for="email">Email Address</label>
  <input
    id="email"
    type="email"
    [formField]="form.email"
    required
    placeholder="you@example.com"
  />
</ngx-signal-form-field-wrapper>
```

**Override global config:**

```html
<!-- Force standard appearance even if global config sets outline -->
<ngx-signal-form-field-wrapper [formField]="form.notes" appearance="standard">
  <label for="notes">Notes</label>
  <textarea id="notes" [formField]="form.notes"></textarea>
</ngx-signal-form-field-wrapper>
```

#### Wrapper inputs (appearance)

| Input        | Type                                   | Default     | Description                                |
| ------------ | -------------------------------------- | ----------- | ------------------------------------------ |
| `appearance` | `'standard' \| 'outline' \| 'inherit'` | `'inherit'` | Visual style: standard, outline, or config |
| `outline`    | `boolean`                              | `false`     | Legacy: Forces outline (use appearance)    |

#### Wrapper inputs (outlined-specific)

| Input                | Type      | Default | Description                                             |
| -------------------- | --------- | ------- | ------------------------------------------------------- |
| `showRequiredMarker` | `boolean` | `true`  | Whether to show the required marker for required fields |
| `requiredMarker`     | `string`  | `' *'`  | Custom character(s) to display for required fields      |

#### Required Field Indicator

By default, the required marker (`*`) is automatically shown when the input has the `required` attribute or `aria-required="true"`.
You can set defaults in `provideNgxSignalFormsConfig`, then override per field with `showRequiredMarker` or `requiredMarker` inputs.

**Global defaults (app-level):**

```typescript
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      defaultFormFieldAppearance: 'outline',
      showRequiredMarker: true,
      requiredMarker: ' *',
    }),
  ],
};
```

**Component-level override:**

```typescript
import { provideNgxSignalFormsConfigForComponent } from '@ngx-signal-forms/toolkit';

@Component({
  providers: [
    provideNgxSignalFormsConfigForComponent({
      showRequiredMarker: false,
      requiredMarker: '(required)',
    }),
  ],
})
export class OutlineSectionComponent {}
```

**Hide required marker:**

```html
<ngx-signal-form-field-wrapper
  [formField]="form.email"
  outline
  [showRequiredMarker]="false"
>
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" required />
</ngx-signal-form-field-wrapper>
```

**Custom required marker - "(required)":**

```html
<ngx-signal-form-field-wrapper
  [formField]="form.email"
  outline
  requiredMarker="(required)"
>
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" required />
</ngx-signal-form-field-wrapper>
<!-- Result: "Email(required)" -->
```

**Custom required marker - dagger (†):**

```html
<ngx-signal-form-field-wrapper
  [formField]="form.email"
  outline
  requiredMarker=" †"
>
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" required />
</ngx-signal-form-field-wrapper>
<!-- Result: "Email †" -->
```

#### CSS Custom Properties

**Outlined layout** (with `outline` directive):

```css
:root {
  /* Label */
  --ngx-form-field-outline-label-size: 0.75rem;
  --ngx-form-field-outline-label-line-height: 1rem;
  --ngx-form-field-outline-label-weight: 400;
  --ngx-form-field-outline-label-color: rgba(50, 65, 85, 0.75);
  --ngx-form-field-outline-label-gap: 0rem;

  /* Input */
  --ngx-form-field-outline-input-size: 0.875rem;
  --ngx-form-field-outline-input-line-height: 1.25rem;
  --ngx-form-field-outline-input-weight: 400;
  --ngx-form-field-outline-input-color: #324155;

  /* Required marker */
  --ngx-form-field-required-marker-color: #db1818;
  --ngx-form-field-required-marker-weight: 600;

  /* Container + states */
  --ngx-form-field-color-surface: #ffffff;
  --ngx-form-field-color-border: rgba(50, 65, 85, 0.25);
  --ngx-form-field-color-border-hover: #324155;
  --ngx-form-field-focus-color: #007bc7;
  --ngx-form-field-focus-box-shadow: 0 0 0 4px rgba(0, 123, 199, 0.25);
}
```

**Example - Custom theme:**

```css
/* Brand colors for outlined layout */
:root {
  --ngx-form-field-focus-color: #10b981; /* Green */
  --ngx-form-field-focus-box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.25);
  --ngx-form-field-required-marker-color: #ef4444; /* Red */
}

/* Dark mode for outlined layout */
@media (prefers-color-scheme: dark) {
  :root {
    --ngx-form-field-color-surface: #111827; /* Dark input background */
    --ngx-form-field-color-border: rgba(
      249,
      250,
      251,
      0.25
    ); /* Subtle border */
    --ngx-form-field-outline-label-color: rgba(249, 250, 251, 0.75);
    --ngx-form-field-outline-input-color: #f9fafb; /* Almost white text */
    --ngx-form-field-focus-color: #60a5fa; /* Lighter blue for focus */
    --ngx-form-field-focus-box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.25);
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
- ARIA attributes handled by the form field wrapper component

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

### NgxFormFieldHintComponent

Displays helper text for form fields.

**Import:**

```typescript
import { NgxFormFieldHintComponent } from '@ngx-signal-forms/toolkit/form-field';
```

**Usage:**

```html
<ngx-signal-form-field-wrapper [formField]="form.phone" outline>
  <label for="phone">Phone Number</label>
  <input id="phone" [formField]="form.phone" />
  <ngx-signal-form-field-hint>Format: 123-456-7890</ngx-signal-form-field-hint>
</ngx-signal-form-field-wrapper>
```

When used inside `ngx-signal-form-field-wrapper`, hints are automatically linked
to the input via `aria-describedby`.

**Smart Positioning:**

- **Default:** Aligns to the **right** side of the footer.
- **With Character Count:** Automatically flips to the **left** to avoid collision.
- **Manual Override:** Force specific alignment using `position="left"` or `position="right"`.

```html
<!-- Default: Aligns right -->
<ngx-signal-form-field-hint>Optional</ngx-signal-form-field-hint>

<!-- Auto-flip: Aligns left because char count takes right spot -->
<ngx-signal-form-field-hint>Max 500 chars</ngx-signal-form-field-hint>
<ngx-signal-form-field-character-count
  [formField]="form.bio"
  [maxLength]="500"
/>

<!-- Manual override: Force left alignment -->
<ngx-signal-form-field-hint position="left">
  Start on the left
</ngx-signal-form-field-hint>
```

#### CSS Custom Properties

```css
:root {
  /* Inherits from shared feedback layer by default */
  --ngx-form-field-hint-font-size: var(
    --ngx-signal-form-feedback-font-size,
    0.75rem
  );
  --ngx-form-field-hint-color: #6b7280;
  --ngx-form-field-hint-align: right;
  --ngx-form-field-hint-padding-horizontal: 0.5rem;
}
```

---

### NgxFormFieldCharacterCountComponent

Displays character count with progressive color states.

**Import:**

```typescript
import { NgxFormFieldCharacterCountComponent } from '@ngx-signal-forms/toolkit/form-field';
```

**Usage:**

```html
<ngx-signal-form-field-wrapper [formField]="form.bio" outline>
  <label for="bio">Bio</label>
  <textarea id="bio" [formField]="form.bio"></textarea>
  <ngx-signal-form-field-character-count
    [formField]="form.bio"
    [maxLength]="500"
  />
</ngx-signal-form-field-wrapper>
```

#### Inputs

| Input             | Type                                  | Default                       | Description                                    |
| ----------------- | ------------------------------------- | ----------------------------- | ---------------------------------------------- |
| `field`           | `FieldTree<TValue>`                   | _required_                    | The Signal Forms field to count characters for |
| `maxLength`       | `number`                              | _required_                    | Maximum character limit                        |
| `showLimitColors` | `boolean`                             | `true`                        | Whether to use progressive color states        |
| `colorThresholds` | `{ warning: number; danger: number }` | `{ warning: 80, danger: 95 }` | Percentage thresholds for color changes        |
| `liveAnnounce`    | `boolean`                             | `false`                       | Enable polite live announcements               |

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
  /* Inherits from shared feedback layer by default */
  --ngx-form-field-char-count-font-size: var(
    --ngx-signal-form-feedback-font-size,
    0.75rem
  );
  --ngx-form-field-char-count-color-ok: #6b7280;
  --ngx-form-field-char-count-color-warning: #f59e0b;
  --ngx-form-field-char-count-color-danger: #dc2626;
  --ngx-form-field-char-count-color-exceeded: #991b1b;
}
```

---

### NgxSignalFormFieldset

Groups related form fields with aggregated error/warning display. Similar to HTML `<fieldset>`, but with validation message aggregation and deduplication.

**Import:**

```typescript
import { NgxSignalFormFieldset } from '@ngx-signal-forms/toolkit/form-field';
```

**Basic Usage:**

```html
<ngx-signal-form-fieldset [fieldsetField]="form.address" fieldsetId="address">
  <legend class="fieldset-legend">Shipping Address</legend>

  <ngx-signal-form-field-wrapper [formField]="form.address.street" outline>
    <label for="street">Street</label>
    <input id="street" [formField]="form.address.street" />
  </ngx-signal-form-field-wrapper>

  <ngx-signal-form-field-wrapper [formField]="form.address.city" outline>
    <label for="city">City</label>
    <input id="city" [formField]="form.address.city" />
  </ngx-signal-form-field-wrapper>

  <!-- Aggregated errors appear at bottom of fieldset -->
</ngx-signal-form-fieldset>
```

**Attribute Selector Usage (recommended for semantic fieldsets):**

```html
<fieldset
  ngxSignalFormFieldset
  [fieldsetField]="form.address"
  fieldsetId="address"
>
  <legend class="fieldset-legend">Shipping Address</legend>
  <!-- Fields content -->
</fieldset>
```

**Non-fieldset Wrapper Usage (when fieldset semantics do not apply):**

```html
<div ngxSignalFormFieldset [fieldsetField]="form.address" fieldsetId="address">
  <!-- Fields content -->
</div>
```

**Custom Field Collection:**

```html
<!-- Override which fields to aggregate errors from -->
<ngx-signal-form-fieldset
  [fieldsetField]="form"
  [fields]="[form.password, form.confirmPassword]"
  fieldsetId="passwords"
>
  <legend class="fieldset-legend">Password</legend>
  <!-- Fields content -->
</ngx-signal-form-fieldset>
```

#### Features

- ✅ **Group-Only Mode** (default): Shows only group-level errors to avoid duplication
- ✅ **Aggregated Mode**: Optionally collects errors from all nested fields via `errorSummary()`
- ✅ **Deduplication**: Same error message shown only once even if multiple fields have it
- ✅ **Warning Support**: Non-blocking warnings (with `warn:` prefix) shown when no errors exist
- ✅ **WCAG 2.2 Compliant**: Errors use `role="alert"`, warnings use `role="status"`
- ✅ **Strategy Aware**: Respects `ErrorDisplayStrategy` from form context or input

#### Error Display Modes

The `includeNestedErrors` input controls which errors are shown:

**Group-Only Mode** (`includeNestedErrors="false"`, default):
Shows ONLY group-level errors via `errors()`. Use when nested fields display their own errors via `NgxSignalFormField` to avoid duplicate error messages.

```html
<ngx-signal-form-fieldset [fieldsetField]="form.passwords">
  <ngx-signal-form-field-wrapper [formField]="form.passwords.password" outline>
    <!-- This field shows its own "required" error -->
  </ngx-signal-form-field-wrapper>
  <ngx-signal-form-field-wrapper [formField]="form.passwords.confirm" outline>
    <!-- This field shows its own errors -->
  </ngx-signal-form-field-wrapper>
  <!-- Fieldset shows ONLY cross-field error: "Passwords must match" -->
</ngx-signal-form-fieldset>
```

**Aggregated Mode** (`includeNestedErrors`):
Shows ALL errors including nested field errors via `errorSummary()`. Use when nested fields do NOT display their own errors (e.g., plain inputs without `NgxSignalFormField` wrappers).

```html
<fieldset
  ngxSignalFormFieldset
  [fieldsetField]="form.address"
  includeNestedErrors
>
  <legend>Shipping Address</legend>
  <!-- Plain inputs without error display -->
  <input [formField]="form.address.street" />
  <input [formField]="form.address.city" />
  <!-- Fieldset shows ALL errors: "Street required", "City required", etc. -->
</fieldset>
```

#### Inputs

| Input                 | Type                           | Default             | Description                                                               |
| --------------------- | ------------------------------ | ------------------- | ------------------------------------------------------------------------- |
| `fieldsetField`       | `FieldTree<TFieldset>`         | _required_          | The Signal Forms field tree to aggregate from                             |
| `fields`              | `FieldTree<unknown>[] \| null` | `null`              | Explicit list of fields for custom groupings                              |
| `fieldsetId`          | `string \| undefined`          | Auto-generated      | Unique identifier for generating error/warning IDs                        |
| `strategy`            | `ErrorDisplayStrategy \| null` | Inherited from form | Error display strategy                                                    |
| `showErrors`          | `boolean`                      | `true`              | Whether to display aggregated error messages                              |
| `includeNestedErrors` | `boolean`                      | `false`             | Include nested field errors (`true`) or only group-level errors (`false`) |

#### Host CSS Classes

- `.ngx-signal-form-fieldset` - Always applied
- `.ngx-signal-form-fieldset--invalid` - Applied when showing errors
- `.ngx-signal-form-fieldset--warning` - Applied when showing warnings (no errors)

#### CSS Custom Properties

```css
ngx-signal-form-fieldset {
  /* Layout */
  --ngx-signal-form-fieldset-gap: 1rem;
  --ngx-signal-form-fieldset-padding: 1rem;
  --ngx-signal-form-fieldset-border-radius: 0.5rem;

  /* Background */
  --ngx-signal-form-fieldset-bg: transparent;
  --ngx-signal-form-fieldset-invalid-bg: rgba(220, 38, 38, 0.05);
  --ngx-signal-form-fieldset-warning-bg: rgba(245, 158, 11, 0.05);

  /* Border */
  --ngx-signal-form-fieldset-invalid-border-color: #dc2626;
  --ngx-signal-form-fieldset-warning-border-color: #f59e0b;
}
```

#### Why use fieldsets over individual field errors?

- **Group validation**: Errors like "password must match confirm password" apply to multiple fields
- **Reduced visual noise**: Same validation rule message shown only once
- **Better UX for complex forms**: Related field groups (addresses, passwords, etc.) are clearly organized

#### Accessibility

- Uses `NgxSignalFormErrorComponent` internally for consistent ARIA attributes
- Errors use `role="alert"` with `aria-live="assertive"` for immediate screen reader announcement
- Warnings use `role="status"` with `aria-live="polite"`
- `aria-busy="true"` is set when the fieldset has pending validation
- `<legend>` is recommended but optional; when omitted, provide a programmatic group label via `aria-labelledby` or include the group name in the first label.

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
  submit,
} from '@angular/forms/signals';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

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
  imports: [FormField, NgxFormField],
  template: `
    <form (submit)="save($event)" novalidate>
      <!-- Outlined email field with custom required marker -->
      <ngx-signal-form-field-wrapper
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
      </ngx-signal-form-field-wrapper>

      <!-- Outlined message field with character count -->
      <ngx-signal-form-field-wrapper [formField]="contactForm.message" outline>
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
      </ngx-signal-form-field-wrapper>

      <button type="submit" [disabled]="contactForm().invalid()">
        Send Message
      </button>
    </form>
  `,
  styles: `
    /* Custom theme for outlined fields */
    :host {
      --ngx-form-field-focus-color: #10b981;
      --ngx-form-field-focus-box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.25);
      --ngx-form-field-required-marker-color: #ef4444;
    }
  `,
})
export class ContactFormComponent {
  readonly #model = signal<ContactForm>({ email: '', message: '' });
  protected readonly contactForm = form(this.#model, contactSchema);

  protected save(event: Event): void {
    event.preventDefault();
    submit(this.contactForm, async () => {
      console.log('Form data:', this.#model());
    });
  }
}
```

---

## API Summary

### Public Exports

```typescript
// Bundle
export { NgxFormField } from './public_api';
export { NgxSignalFormFieldset } from './form-fieldset.component';
## License

MIT © [ngx-signal-forms](https://github.com/ngx-signal-forms/ngx-signal-forms)
```
