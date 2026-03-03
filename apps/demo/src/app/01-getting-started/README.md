# Getting Started (20% Toolkit)

> **First Steps:** Your introduction to `@ngx-signal-forms/toolkit`

## 🎯 Purpose

This section demonstrates your **first experience** with the toolkit - seeing immediate benefits while keeping the learning curve gentle.

**Adoption Level:** 20% toolkit

- ✅ Auto-ARIA directives
- ✅ Error display component
- ❌ No form field wrapper (manual layout)

**Key Focus:** Progressive error disclosure and automatic accessibility with minimal setup.

## 📂 Examples

### your-first-form

**Focus:** Contact form with name/email/message fields

**What you'll learn:**

- Import and use `NgxSignalFormToolkit` bundle
- Automatic ARIA attributes (no manual setup)
- Use `NgxSignalFormErrorComponent` for errors
- Progressive error disclosure (on-touch strategy)
- Form provider directive for submission tracking

**Technologies:**

- `@ngx-signal-forms/toolkit` - Core toolkit directives
- `NgxSignalFormDirective` (`[formRoot]`) - Form context
- `NgxSignalFormErrorComponent` - Error display
- `NgxSignalFormAutoAriaDirective` - Auto-ARIA

## 💡 What Changes from Signal Forms Only

### Before (0% Toolkit - Manual)

```typescript
// 00-signal-forms-only/pure-signal-form
@Component({
  imports: [Field],  // Only Angular Signal Forms
  template: `
    <input
      id="email"
      [formField]="form.email"
      [attr.aria-invalid]="form.email().invalid() ? 'true' : null"
      [attr.aria-describedby]="form.email().invalid() ? 'email-error' : null"
    />
    @if (form.email().invalid() && form.email().touched()) {
      <div id="email-error" role="alert">
        @for (error of form.email().errors(); track error.kind) {
          <p>{{ error.message }}</p>
        }
      </div>
    }
  `,
})
```

### After (20% Toolkit - First Enhancement)

```typescript
// 01-getting-started/your-first-form
@Component({
  imports: [FormField, NgxSignalFormToolkit],  // Added toolkit bundle
  template: `
    <form [formRoot]="form">
      <input id="email" [formField]="form.email" />
      <!-- Auto-ARIA applied ✅ -->

      <ngx-signal-form-error [formField]="form.email" fieldName="email" />
      <!-- Auto error display ✅ -->
    </form>
  `,
})
```

## 🎨 Key Concepts

### 1. NgxSignalFormToolkit Bundle (Recommended Import)

The toolkit provides a convenient bundle constant for all essential directives:

```typescript
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';

@Component({
  imports: [FormField, NgxSignalFormToolkit],  // Single import
})
```

**What's in the bundle:**

- `NgxSignalFormDirective` (`[formRoot]`) - Form context and submission tracking
- `NgxSignalFormAutoAriaDirective` - Automatic ARIA attributes

**Error display component:** Import `NgxSignalFormErrorComponent` from `@ngx-signal-forms/toolkit/assistive`.

#### Alternative: Individual Imports

```typescript
import {
  NgxSignalFormDirective,
  NgxSignalFormAutoAriaDirective,
} from '@ngx-signal-forms/toolkit';
import { NgxSignalFormErrorComponent } from '@ngx-signal-forms/toolkit/assistive';

@Component({
  imports: [FormField, NgxSignalFormDirective, NgxSignalFormAutoAriaDirective, NgxSignalFormErrorComponent],
})
```

### 2. Auto-ARIA Magic

**No manual attributes needed:**

```html
<!-- Before: Manual ARIA -->
<input
  id="email"
  [formField]="form.email"
  [attr.aria-invalid]="form.email().invalid() ? 'true' : null"
  [attr.aria-describedby]="form.email().invalid() ? 'email-error' : null"
/>

<!-- After: Automatic -->
<input id="email" [formField]="form.email" />
<!-- NgxSignalFormAutoAriaDirective adds:
     - aria-invalid="true" when invalid
     - aria-describedby="email-error" linking to error
-->
```

**Field Name Resolution:**

1. `data-signal-field` attribute (explicit override)
2. `id` attribute (WCAG preferred) ✅
3. `name` attribute (fallback)

### 3. Error Display Component

**Replaces manual error templates:**

```html
<!-- Before: Manual template (~10 lines) -->
@if (form.email().invalid() && form.email().touched()) {
<div id="email-error" role="alert">
  @for (error of form.email().errors(); track error.kind) {
  <p class="text-red-600">{{ error.message }}</p>
  }
</div>
}

<!-- After: Component (1 line) -->
<ngx-signal-form-error [formField]="form.email" fieldName="email" />
```

**Features:**

- WCAG 2.2 compliant `role="alert"` with `aria-live="assertive"`
- Progressive disclosure (on-touch by default)
- Separates warnings from errors
- Type-safe with field inference

### 4. Form Provider Directive

**Provides context to child components:**

```html
<form [formRoot]="contactForm">
  <!-- All child form-error components inherit submission state -->
  <ngx-signal-form-error [formField]="contactForm.name" fieldName="name" />
  <ngx-signal-form-error [formField]="contactForm.email" fieldName="email" />
</form>
```

**What it provides:**

- Form instance (via DI)
- Submission state tracking (toolkit-derived from `submitting()` + `touched()`)
- Error display strategy (inheritable)

**Note:** Angular Signal Forms exposes `submitting()` and `touched()` signals; the toolkit derives a `SubmittedStatus` value from them and shares it via dependency injection when you use `[formRoot]` (FormRoot-equivalent behavior plus toolkit enhancements).

## 📊 Code Reduction Analysis

### Template Comparison (Contact Form - 3 Fields)

**Without Toolkit (Pure Signal Forms):**

- Lines: ~75 (including ARIA, error templates, conditions)
- Manual ARIA: 6 attributes per field (18 total)
- Error templates: ~10 lines per field (30 total)
- Visibility logic: Repeated 3 times

**With 20% Toolkit:**

- Lines: ~25 (form provider + inputs + error components)
- Manual ARIA: 0 (automatic)
- Error templates: 0 (component)
- Visibility logic: 0 (built-in)

**Reduction:** ~67% less code ✅

### Accessibility Improvements

| Feature                | Without Toolkit       | With 20% Toolkit |
| ---------------------- | --------------------- | ---------------- |
| `aria-invalid`         | Manual binding        | Automatic ✅     |
| `aria-describedby`     | Manual ID linking     | Automatic ✅     |
| Error `role="alert"`   | Manual                | Automatic ✅     |
| Live regions           | Manual `aria-live`    | Automatic ✅     |
| Field name resolution  | N/A                   | 3 strategies ✅  |
| Progressive disclosure | Manual state tracking | Built-in ✅      |

## 🔍 What's Still Manual (At 20%)

1. **Form Layout**
   - You still write the form structure
   - Labels and inputs require manual layout
   - Spacing and styling are your responsibility

2. **Form Field Wrapper**
   - No automatic label/input grouping
   - No consistent spacing
   - No projection patterns

3. **Advanced Patterns**
   - No global configuration yet
   - No custom error strategies
   - No debug mode

## ➡️ Next Steps

### Level 3: Toolkit Core (100%)

**Path:** `02-toolkit-core/`

**What you'll learn:**

- Error display strategies (immediate, on-touch, on-submit, manual)
- Warning support (non-blocking validation)
- Field state visualization
- Accessibility comparison side-by-side

### Level 4: Form Field Wrapper

**Path:** `04-form-field-wrapper/`

**What changes:**

- `NgxFormField` for layout
- Content projection patterns
- Consistent spacing
- Even less boilerplate (~80% reduction)

### Level 5: Advanced Patterns

**Path:** `05-advanced/`

**What changes:**

- Global configuration
- Custom field resolvers
- Async submission patterns
- Production-ready forms

## 🤔 When to Use 20% Toolkit

**Use 20% toolkit when:**

- ✅ You're migrating from pure Signal Forms gradually
- ✅ You need custom form layouts
- ✅ You want ARIA but manual control over structure
- ✅ You're learning the toolkit step-by-step

**Upgrade to 100% when:**

- ✅ You want consistent form field layouts
- ✅ You need error display strategies
- ✅ You want warning support
- ✅ You're ready for production patterns

---

**Next:** Explore `02-toolkit-core/` for full toolkit features! 🚀
