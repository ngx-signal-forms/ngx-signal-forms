# Form Field Wrapper (100% Toolkit)

> **Production Ready:** Complete form field component with automatic error display

## 🎯 Purpose

This section demonstrates the **"batteries included"** approach using `NgxSignalFormFieldComponent` - a complete form field wrapper with automatic error display, consistent layout, and content projection.

**Adoption Level:** 100% toolkit

- ✅ Form field wrapper component
- ✅ Content projection (label + input)
- ✅ Automatic error display
- ✅ Consistent spacing and layout
- ✅ ~80% code reduction

**Key Focus:** Production-ready forms with minimal boilerplate.

## 📂 Examples

### basic-usage

**Focus:** Introduction to NgxSignalFormFieldComponent

**What you'll learn:**

- Component API and inputs
- Content projection patterns
- Automatic error display
- Layout consistency
- Strategy inheritance

**Technologies:**

- `@ngx-signal-forms/toolkit/form-field` - Form field component
- Content projection with `<ng-content>`
- Automatic error integration

---

### complex-forms

**Focus:** Real-world registration form (8 fields)

**What you'll learn:**

- Nested form structures
- Password confirmation validation
- Dynamic arrays (contacts)
- Terms and conditions checkbox
- Production patterns

**Technologies:**

- 8-field registration form
- Cross-field validation
- Nested objects and arrays
- Complete user journey

## 🎨 API Reference

### NgxSignalFormFieldComponent

```typescript
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  imports: [FormField, NgxSignalFormFieldComponent],
  template: `
    <ngx-signal-form-field [formField]="form.email" fieldName="email">
      <label for="email">Email</label>
      <input id="email" [formField]="form.email" />
    </ngx-signal-form-field>
  `,
})
```

#### Required Inputs

| Input       | Type           | Description                                     |
| ----------- | -------------- | ----------------------------------------------- |
| `field`     | `FieldTree<T>` | Form field from your Signal Forms instance      |
| `fieldName` | `string`       | Field name (must match `id` attribute for ARIA) |

#### Optional Inputs

| Input        | Type                   | Default                     | Description                    |
| ------------ | ---------------------- | --------------------------- | ------------------------------ |
| `strategy`   | `ErrorDisplayStrategy` | Inherits from form provider | When to show errors            |
| `showErrors` | `boolean`              | `true`                      | Toggle automatic error display |

#### Content Projection

The component uses `<ng-content>` to project your custom content:

```html
<ngx-signal-form-field [formField]="form.email" fieldName="email">
  <!-- Everything here is projected -->
  <label for="email">Email Address</label>
  <input id="email" type="email" [formField]="form.email" />
  <p class="hint">We'll never share your email</p>
</ngx-signal-form-field>
```

## 💡 Code Reduction Analysis

### Before: Manual Layout (Getting Started - 20% Toolkit)

```html
<!-- ~15 lines per field -->
<div class="form-field">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" />
  <ngx-signal-form-error [formField]="form.email" fieldName="email" />
</div>

<div class="form-field">
  <label for="password">Password</label>
  <input id="password" type="password" [formField]="form.password" />
  <ngx-signal-form-error [formField]="form.password" fieldName="password" />
</div>
```

### After: Form Field Wrapper (100% Toolkit)

```html
<!-- ~5 lines per field -->
<ngx-signal-form-field [formField]="form.email" fieldName="email">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" />
</ngx-signal-form-field>

<ngx-signal-form-field [formField]="form.password" fieldName="password">
  <label for="password">Password</label>
  <input id="password" type="password" [formField]="form.password" />
</ngx-signal-form-field>
```

**Reduction:** ~67% less code per field ✅

### What's Included Automatically

1. **Error Display**
   - Automatic `NgxSignalFormErrorComponent` integration
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
   - Inherits from `ngxSignalFormDirective` if present
   - Can override per-field with `[strategy]` input
   - Falls back to global config

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
<ngx-signal-form-field
  [formField]="form.contacts[i].value"
  [fieldName]="'contact-' + i"
>
  <label [for]="'contact-' + i">Contact {{ i + 1 }}</label>
  <input [id]="'contact-' + i" [formField]="form.contacts[i].value" />
</ngx-signal-form-field>
}
```

### Strategy Override

**Field-specific error strategy:**

```html
<!-- Form uses 'on-touch' by default -->
<form [ngxSignalForm]="form" [errorStrategy]="'on-touch'">
  <!-- But password confirmation shows immediately -->
  <ngx-signal-form-field
    [formField]="form.confirmPassword"
    fieldName="confirmPassword"
    [strategy]="'immediate'"
  >
    <label for="confirmPassword">Confirm Password</label>
    <input
      id="confirmPassword"
      type="password"
      [formField]="form.confirmPassword"
    />
  </ngx-signal-form-field>
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
  --ngx-signal-form-field-gap: 0.5rem;
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
ngx-signal-form-field {
  display: block;
  margin-bottom: var(--ngx-signal-form-field-gap, 1rem);

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

**Path:** `04-advanced/`

**What you'll learn:**

- Global configuration with `provideNgxSignalFormsConfig`
- Custom field name resolvers
- Async submission patterns with loading states
- Server error handling
- Production-ready error announcements

## 🤔 When to Use Form Field Wrapper

### Use NgxSignalFormFieldComponent When

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

1. **Always provide `fieldName`** - Must match `id` attribute for WCAG compliance
2. **Use strategy inheritance** - Set once on form provider, override when needed
3. **Leverage content projection** - Add hints, icons, or custom elements
4. **Theme with CSS variables** - Don't override component styles directly
5. **Keep field names consistent** - Use same value for `id`, `fieldName`, and form path

## 🐛 Common Issues

### ARIA attributes not working

**Problem:** `aria-describedby` not linking to errors

**Solution:**

```html
<!-- ❌ Wrong: fieldName doesn't match id -->
<ngx-signal-form-field [formField]="form.email" fieldName="userEmail">
  <input id="email" [formField]="form.email" />
</ngx-signal-form-field>

<!-- ✅ Correct: fieldName matches id -->
<ngx-signal-form-field [formField]="form.email" fieldName="email">
  <input id="email" [formField]="form.email" />
</ngx-signal-form-field>
```

### Errors not showing

**Problem:** Errors never appear

**Solution:** Check strategy and field state

```typescript
// Verify strategy is set
<form [ngxSignalForm]="form" [errorStrategy]="'on-touch'">

// Or check field state
{{ form.email().touched() }}  // Should be true after blur
{{ form.email().invalid() }}  // Should be true if errors exist
```

### Styling conflicts

**Problem:** Custom styles not applying

**Solution:** Use CSS custom properties

```css
/* ❌ Don't override component internals */
ngx-signal-form-field > div {
  margin: 2rem;
}

/* ✅ Use CSS variables */
:root {
  --ngx-signal-form-field-gap: 2rem;
}
```

---

**Next:** Explore `04-advanced/` for production patterns and global configuration! 🚀
