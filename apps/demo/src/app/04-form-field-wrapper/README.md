# Form Field Wrapper (100% Toolkit)

> **Production Ready:** Wrapper-based form composition with the live examples we want teams to copy

## 🎯 Purpose

This section demonstrates the batteries-included path using `NgxFormField` and related wrapper primitives.

The live examples also show how wrapper rendering now follows explicit control semantics instead of guessing from DOM shape alone, so switch rows, checkbox groups, and custom manual-ARIA controls stay predictable.

Instead of splitting wrapper basics, grouped fieldsets, and long-form behavior across multiple pages, the live demo now centers those lessons in two examples:

- `complex-forms` for nested/grouped/array-heavy forms
- `custom-controls` for non-native control integration

## 📂 Active Examples

### [complex-forms](./complex-forms/README.md)

**Focus:** Wrapper composition in realistic long forms

**What you'll learn:**

- Nested object structures
- Dynamic arrays
- Grouped fieldsets and aggregated section feedback
- Strategy + appearance controls in a realistic layout
- Switch, checkbox, and radio-group semantics inside one long form
- Long-form readability and wrapper consistency

### [custom-controls](./custom-controls/README.md)

**Focus:** Integrating custom controls with wrapper semantics

**What you'll learn:**

- `FormValueControl`-style custom control patterns
- How wrapper-driven labels/errors link to non-native controls
- How explicit semantics and component-scoped presets replace fragile wrapper heuristics
- When a custom control should stay in manual ARIA mode
- Mixed native + custom input composition in one form

## 📦 Consolidated Concepts

The following older demos are no longer part of the live route graph:

- **basic-usage** → core wrapper patterns are now shown inside `complex-forms`
- **fieldset-grouping** → grouped section summaries and placement behavior now live inside `complex-forms`

Those folders remain in the repo as archived implementation references if you need the earlier isolated examples.

## 🎨 API Reference

### NgxFormField

```typescript
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  imports: [FormField, NgxFormField],
  template: `
    <ngx-signal-form-field-wrapper [formField]="form.email">
      <label for="email">Email</label>
      <input id="email" [formField]="form.email" />
    </ngx-signal-form-field-wrapper>
  `,
})
```

#### Required Inputs

| Input   | Type           | Description                                |
| ------- | -------------- | ------------------------------------------ |
| `field` | `FieldTree<T>` | Form field from your Signal Forms instance |

#### Optional Inputs

| Input       | Type                   | Default                        | Description                                      |
| ----------- | ---------------------- | ------------------------------ | ------------------------------------------------ |
| `fieldName` | `string`               | Auto-derived from input's `id` | Field name for ARIA (optional when input has id) |
| `strategy`  | `ErrorDisplayStrategy` | Inherits from form provider    | When to show errors                              |

#### Content Projection

The component uses `<ng-content>` to project your custom content:

```html
<ngx-signal-form-field-wrapper [formField]="form.email">
  <!-- Everything here is projected -->
  <label for="email">Email Address</label>
  <input id="email" type="email" [formField]="form.email" />
  <p class="hint">We'll never share your email</p>
</ngx-signal-form-field-wrapper>
```

## 💡 Code Reduction Analysis

### Before: Manual Layout (Getting Started - 20% Toolkit)

```html
<!-- ~15 lines per field -->
<div class="form-field">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" />
  <ngx-form-field-error [formField]="form.email" fieldName="email" />
</div>

<div class="form-field">
  <label for="password">Password</label>
  <input id="password" type="password" [formField]="form.password" />
  <ngx-form-field-error [formField]="form.password" fieldName="password" />
</div>
```

### After: Form Field Wrapper (100% Toolkit)

```html
<!-- ~5 lines per field -->
<!-- fieldName is optional - auto-derived from input's id attribute -->
<ngx-signal-form-field-wrapper [formField]="form.email">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" />
</ngx-signal-form-field-wrapper>

<ngx-signal-form-field-wrapper [formField]="form.password">
  <label for="password">Password</label>
  <input id="password" type="password" [formField]="form.password" />
</ngx-signal-form-field-wrapper>
```

**Reduction:** ~67% less code per field ✅

### What's Included Automatically

1. **Error Display**
   - Automatic `NgxFormFieldErrorComponent` integration
   - Progressive disclosure based on strategy
   - Warning vs error separation

2. **Layout & Spacing**
   - Consistent vertical spacing
   - Responsive layout
   - CSS custom properties for theming

3. **ARIA Compliance**
   - Inherits auto-ARIA from toolkit core
   - Proper error linking
   - Live region announcements

4. **Strategy Inheritance**
   - Inherits from `NgxSignalFormDirective` (`ngxSignalForm`) if present
   - Can override per-field with `[strategy]` input
   - Falls back to global config

5. **Control-family semantics**

- Wrapper layout follows explicit `ngxSignalFormControl` metadata
- Component or app presets can provide family defaults
- Manual-ARIA controls keep ownership of `aria-describedby` when needed

## 🔍 Advanced Patterns

### Complex Form Structure

**Registration form with 8 fields:**

```typescript
interface RegistrationModel {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
  account: {
    password: string;
    confirmPassword: string;
  };
  preferences: {
    newsletter: boolean;
  };
  contacts: Array<{ type: 'email' | 'phone'; value: string }>;
}
```

### Cross-Field Validation

**Password confirmation:**

```typescript
validate(path, (ctx) => {
  const { password, confirmPassword } = ctx.value().account;
  if (password !== confirmPassword) {
    return customError({
      kind: 'password_mismatch',
      message: 'Passwords do not match',
    });
  }
  return null;
});
```

### Dynamic Arrays

**Contact methods:**

```html
@for (contact of form.contacts; track $index; let i = $index) {
<ngx-signal-form-field-wrapper
  [formField]="form.contacts[i].value"
  [fieldName]="'contact-' + i"
>
  <label [for]="'contact-' + i">Contact {{ i + 1 }}</label>
  <input [id]="'contact-' + i" [formField]="form.contacts[i].value" />
</ngx-signal-form-field-wrapper>
}
```

### Strategy Override

**Field-specific error strategy:**

```html
<!-- Form uses 'on-touch' by default -->
<form [formRoot]="form" ngxSignalForm errorStrategy="on-touch">
  <!-- But password confirmation shows immediately -->
  <ngx-signal-form-field-wrapper
    [formField]="form.confirmPassword"
    strategy="immediate"
  >
    <label for="confirmPassword">Confirm Password</label>
    <input
      id="confirmPassword"
      type="password"
      [formField]="form.confirmPassword"
    />
  </ngx-signal-form-field-wrapper>
</form>
```

## 📊 Comparison Table

| Feature                  | Manual (20%)     | Form Field Wrapper (100%) |
| ------------------------ | ---------------- | ------------------------- |
| **Lines per field**      | ~15              | ~5                        |
| **Error display**        | Manual component | Automatic ✅              |
| **Layout consistency**   | Manual CSS       | Built-in ✅               |
| **Spacing**              | Manual classes   | CSS custom properties ✅  |
| **Strategy inheritance** | N/A              | From provider ✅          |
| **Content projection**   | N/A              | Full support ✅           |
| **Warning support**      | Manual           | Automatic ✅              |
| **ARIA compliance**      | Via toolkit core | Via toolkit core ✅       |

## 🎯 Styling & Theming

### CSS Custom Properties

The component uses CSS custom properties for easy theming:

```css
:root {
  --ngx-signal-form-field-wrapper-gap: 0.5rem;
  --ngx-signal-form-error-color: #dc2626;
  --ngx-signal-form-warning-color: #f59e0b;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    --ngx-signal-form-error-color: #fca5a5;
    --ngx-signal-form-warning-color: #fcd34d;
  }
}
```

### Layout Customization

```scss
ngx-signal-form-field-wrapper {
  display: block;
  margin-bottom: var(--ngx-signal-form-field-wrapper-gap, 1rem);

  label {
    display: block;
    margin-bottom: 0.25rem;
    font-weight: 500;
  }

  input,
  select,
  textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
  }
}
```

## ➡️ Next Steps

### Level 5: Advanced Patterns

**Path:** `05-advanced/`

**What you'll learn:**

- Global configuration with `provideNgxSignalFormsConfig`
- App-level control presets with `provideNgxSignalFormControlPresets`
- Custom field name resolvers
- Async submission patterns with loading states
- Server error handling
- Production-ready error announcements

## 🤔 When to Use Form Field Wrapper

### Use NgxFormField When

- ✅ You need consistent form layouts
- ✅ You want automatic error display
- ✅ You're building production applications
- ✅ You want to reduce boilerplate (~80%)
- ✅ You need content projection flexibility

### Use Manual Layout When

- ✅ You need highly custom layouts
- ✅ You're building a design system
- ✅ You want complete control over structure
- ✅ You have unique spacing requirements

### Best Practices

1. **Use input `id` attribute** - fieldName is auto-derived when input has `id`
2. **Use strategy inheritance** - Set once on form provider, override when needed
3. **Leverage content projection** - Add hints, icons, or custom elements
4. **Theme with CSS variables** - Don't override component styles directly
5. **Keep IDs consistent** - Use same value for `id` and `for` attributes

## 🐛 Common Issues

### ARIA attributes not working

**Problem:** `aria-describedby` not linking to errors

**Solution:** Ensure input has `id` attribute:

```html
<!-- ✅ Correct: Input has id, fieldName auto-derived -->
<ngx-signal-form-field-wrapper [formField]="form.email">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" />
</ngx-signal-form-field-wrapper>

<!-- ✅ Also correct: Explicit fieldName for dynamic IDs -->
<ngx-signal-form-field-wrapper
  [formField]="form.contacts[i].value"
  [fieldName]="'contact-' + i"
>
  <label [for]="'contact-' + i">Contact</label>
  <input [id]="'contact-' + i" [formField]="form.contacts[i].value" />
</ngx-signal-form-field-wrapper>
```

### Errors not showing

**Problem:** Errors never appear

**Solution:** Check strategy and field state

```typescript
// Verify strategy is set
<form [formRoot]="form" ngxSignalForm errorStrategy="on-touch">

// Or check field state
{{ form.email().touched() }}  // Should be true after blur
{{ form.email().invalid() }}  // Should be true if errors exist
```

### Styling conflicts

**Problem:** Custom styles not applying

**Solution:** Use CSS custom properties

```css
/* ❌ Don't override component internals */
ngx-signal-form-field-wrapper > div {
  margin: 2rem;
}

/* ✅ Use CSS variables */
:root {
  --ngx-signal-form-field-wrapper-gap: 2rem;
}
```

---

**Next:** Explore `05-advanced/global-configuration` for app-level defaults and advanced composition patterns. 🚀
