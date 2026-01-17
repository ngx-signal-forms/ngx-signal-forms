# Advanced Patterns (100% Toolkit)

> **Production Ready:** Global configuration and async submission patterns

## 🎯 Purpose

This section demonstrates **production-ready patterns** for real-world applications including global configuration, custom field resolvers, and async submission handling.

**Adoption Level:** 100% toolkit

- ✅ Global configuration
- ✅ Custom field name resolution
- ✅ Debug mode
- ✅ Async submission with loading states
- ✅ Server error handling
- ✅ WCAG 2.2 error announcements

**Key Focus:** Enterprise-grade forms with robust error handling and configuration.

## 📂 Examples

### global-configuration

**Focus:** Application-wide toolkit configuration

**What you'll learn:**

- `provideNgxSignalFormsConfig` setup
- Custom default error strategies
- Custom field name resolvers
- Debug mode for development
- Configuration inheritance

**Technologies:**

- App-level configuration providers
- Custom field resolution logic
- TypeScript configuration types

---

### submission-patterns

**Focus:** Async form submission with error handling

**What you'll learn:**

- `submit()` helper from Signal Forms
- Derived submission status tracking
- Loading state management
- Server error handling
- WCAG 2.2 error announcements
- Error recovery patterns

**Technologies:**

- Angular Signal Forms `submit()` function
- Toolkit-derived `submittedStatus` signal
- Async/await patterns
- Server error integration

## 🎨 Global Configuration

### provideNgxSignalFormsConfig

**Setup in app.config.ts:**

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      // Auto-ARIA (default: true)
      autoAria: true,

      // Default error strategy (default: 'on-touch')
      defaultErrorStrategy: 'on-touch',

      // Custom field name resolver
      fieldNameResolver: (element: HTMLElement) => {
        // Custom logic: use data-field-name if present
        return element.getAttribute('data-field-name') || null;
      },

      // Strict field resolution (default: false)
      strictFieldResolution: false,

      // Debug mode (default: false)
      debug: true,
    }),
  ],
};
```

### Configuration Options

| Option                  | Type                                  | Default      | Description                                  |
| ----------------------- | ------------------------------------- | ------------ | -------------------------------------------- |
| `autoAria`              | `boolean`                             | `true`       | Enable automatic ARIA attributes             |
| `defaultErrorStrategy`  | `ErrorDisplayStrategy`                | `'on-touch'` | Default error display strategy               |
| `fieldNameResolver`     | `(el: HTMLElement) => string \| null` | Built-in     | Custom field name resolution logic           |
| `strictFieldResolution` | `boolean`                             | `false`      | Throw error if field name cannot be resolved |
| `debug`                 | `boolean`                             | `false`      | Enable debug logging                         |

### Field Name Resolution Priority

When resolving field names for ARIA linking, the toolkit follows this priority:

1. **`data-signal-field` attribute** (explicit override)
2. **Custom resolver** (if configured)
3. **`id` attribute** (WCAG recommended) ✅
4. **`name` attribute** (fallback)

**Example:**

```html
<!-- Priority 1: Explicit override -->
<input
  id="firstName"
  data-signal-field="personalInfo.firstName"
  [formField]="form.personalInfo.firstName"
/>

<!-- Priority 3: Use id (most common) -->
<input id="email" [formField]="form.email" />

<!-- Priority 4: Fallback to name -->
<input name="phone" [formField]="form.phone" />
```

### Custom Field Resolver Example

**Use case:** You have a naming convention where form field IDs use kebab-case but form paths use camelCase.

```typescript
provideNgxSignalFormsConfig({
  fieldNameResolver: (element) => {
    const id = element.id;
    if (!id) return null;

    // Convert kebab-case to camelCase
    // e.g., "first-name" → "firstName"
    return id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  },
});
```

## 💡 Async Submission Patterns

### Using submit() Helper (Recommended)

Angular Signal Forms provides a built-in `submit()` helper that automatically manages submission state:

```typescript
import { submit } from '@angular/forms/signals';

@Component({
  template: `
    <form [ngxSignalForm]="registrationForm" (ngSubmit)="handleSubmit()">
      <!-- Form fields -->

      <button
        type="submit"
        [disabled]="registrationForm().invalid() || isSubmitting()"
      >
        @if (isSubmitting()) {
          Saving...
        } @else {
          Submit
        }
      </button>

      @if (serverError()) {
        <div role="alert">{{ serverError() }}</div>
      }
    </form>
  `,
})
export class RegistrationComponent {
  readonly #model = signal<RegistrationModel>({
    /* ... */
  });
  protected readonly registrationForm = form(this.#model, validators);

  // Track loading state
  protected readonly isSubmitting = signal(false);
  protected readonly serverError = signal<string | null>(null);

  // submit() helper automatically:
  // 1. Marks all fields as touched (shows all errors on submit)
  // 2. Derives submission status ('unsubmitted' → 'submitting' → 'submitted')
  //    using submitting() + touched()
  // 3. Handles async operations
  // 4. Returns server errors for display
  readonly #submitHandler = submit(this.registrationForm, async (formData) => {
    this.isSubmitting.set(true);
    this.serverError.set(null);

    try {
      await this.apiService.register(formData().value());

      // Success: navigate away or show success message
      this.router.navigate(['/success']);

      return null; // No errors
    } catch (error: any) {
      // Return server errors for display on form
      this.serverError.set(error.message || 'Registration failed');

      return [
        {
          kind: 'server_error',
          message: error.message || 'Registration failed',
          field: formData, // Attach to form root
        },
      ];
    } finally {
      this.isSubmitting.set(false);
    }
  });

  protected handleSubmit(): void {
    void this.#submitHandler();
  }
}
```

### Submission Status Tracking (derived)

Angular Signal Forms exposes `submitting()` and `touched()` signals on every field state, but it does **not** ship a native `submittedStatus()` API. The toolkit derives a `SubmittedStatus` value for you:

```typescript
type SubmittedStatus = 'unsubmitted' | 'submitting' | 'submitted';

// Derive manually (if you are not using the directive context)
const submittedStatus = computed<SubmittedStatus>(() => {
  const state = this.registrationForm();
  if (state.submitting()) return 'submitting';
  if (state.touched()) return 'submitted';
  return 'unsubmitted';
});
```

When you use the toolkit's `ngxSignalFormDirective`, the derived status is provided via DI for convenience:

```html
<form [ngxSignalForm]="registrationForm" (ngSubmit)="save()">
  <!-- NgxSignalFormErrorComponent automatically receives submittedStatus -->
  <ngx-signal-form-error [formField]="registrationForm.email" fieldName="email" />

  @if (formContext?.submittedStatus() === 'submitting') {
  <p role="status">Submitting…</p>
  }
</form>
```

The derived status resets to `'unsubmitted'` whenever `submitting()` is false and the form has no touched fields (for example, after calling `form().reset()` and clearing your model).

### Server Error Handling

#### Pattern 1: Form-level error banner

```html
@if (serverError()) {
<div role="alert" class="error-banner">
  <p>{{ serverError() }}</p>
</div>
}
```

#### Pattern 2: Field-level server errors

```typescript
// Return errors from submit handler
return [
  {
    kind: 'email_taken',
    message: 'This email is already registered',
    field: formData.email, // Attach to specific field
  },
];
```

#### Pattern 3: Multiple server errors

```typescript
return [
  {
    kind: 'email_taken',
    message: 'Email already in use',
    field: formData.email,
  },
  {
    kind: 'weak_password',
    message: 'Password does not meet security requirements',
    field: formData.password,
  },
];
```

### Loading States

**Button state management:**

```html
<button
  type="submit"
  [disabled]="registrationForm().invalid() || isSubmitting()"
>
  @if (isSubmitting()) {
  <span class="spinner"></span>
  Saving... } @else { Submit Registration }
</button>
```

**Form-wide loading indicator:**

```html
@if (isSubmitting()) {
<div class="loading-overlay" role="status" aria-live="polite">
  <p>Processing your registration...</p>
</div>
}
```

## 📊 WCAG 2.2 Error Announcements

### Live Region Best Practices

**Errors (Blocking):**

```html
<!-- Use role="alert" for critical errors -->
<div role="alert" aria-live="assertive">{{ serverError() }}</div>
```

**Status Updates (Non-blocking):**

```html
<!-- Use role="status" for non-critical updates -->
<div role="status" aria-live="polite">
  Registration successful! Redirecting...
</div>
```

### Error Summary Pattern

**For long forms with multiple errors:**

```html
@if (registrationForm().invalid() && formContext?.submittedStatus() ===
'submitted') {
<div role="alert" class="error-summary">
  <h2>Please fix the following errors:</h2>
  <ul>
    @for (field of invalidFields(); track field.name) {
    <li>
      <a [href]="'#' + field.name">{{ field.label }}: {{ field.error }}</a>
    </li>
    }
  </ul>
</div>
}
```

## 🔍 Advanced Use Cases

### Debug Mode

**Enable in development:**

```typescript
// app.config.ts (development only)
import { isDevMode } from '@angular/core';

provideNgxSignalFormsConfig({
  debug: isDevMode(), // Auto-enable in dev mode
});
```

**Debug output:**

```text
[NgxSignalForms] Field name resolved: email (via id attribute)
[NgxSignalForms] Auto-ARIA applied: aria-invalid="true"
[NgxSignalForms] Error display strategy: on-touch
[NgxSignalForms] Form submission state: submitting
```

### Custom Error Recovery

#### Pattern: Retry failed submissions

```typescript
protected readonly retryCount = signal(0);
protected readonly maxRetries = 3;

readonly #submitHandler = submit(this.form, async (formData) => {
  try {
    await this.apiService.save(formData().value());
    this.retryCount.set(0); // Reset on success
    return null;
  } catch (error: any) {
    if (this.retryCount() < this.maxRetries && error.status === 503) {
      this.retryCount.update(n => n + 1);
      // Retry after delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return this.#submitHandler(); // Recursive retry
    }

    return [{ kind: 'server_error', message: error.message, field: formData }];
  }
});
```

### Form Reset After Success

```typescript
protected async save(): Promise<void> {
  const result = await this.#submitHandler();

  if (result === null) {
    // Success: reset form
    this.#model.set({
      email: '',
      password: '',
      // ... reset all fields
    });

    // Submission state resets once submitting() is false and fields are untouched
  }
}
```

## ➡️ Production Checklist

### Before Deploying

- [ ] Global config set in `app.config.ts`
- [ ] Default error strategy chosen (`on-touch` recommended)
- [ ] Debug mode disabled in production
- [ ] Server error handling implemented
- [ ] Loading states for all async operations
- [ ] ARIA live regions for status updates
- [ ] Form reset logic after success
- [ ] Error recovery patterns tested
- [ ] Submission state properly tracked
- [ ] Field name resolution tested

### Performance Optimization

- [ ] Use `OnPush` change detection on all form components
- [ ] Lazy load form modules/routes
- [ ] Use `@defer` for non-critical form sections
- [ ] Minimize computed signals in templates
- [ ] Avoid deep nested form structures
- [ ] Test with large datasets (100+ fields)

### Accessibility Validation

- [ ] Test with screen readers (NVDA, JAWS, VoiceOver)
- [ ] Verify keyboard navigation works
- [ ] Check color contrast (4.5:1 minimum)
- [ ] Test with browser zoom (200%)
- [ ] Validate ARIA attributes in DevTools
- [ ] Test error announcements with live regions
- [ ] Verify focus management on submit

## 🤔 When to Use Advanced Patterns

### Use Global Configuration When

- ✅ You have multiple forms in your app
- ✅ You need consistent error UX
- ✅ You have custom field naming conventions
- ✅ You want centralized debug control
- ✅ You're building an enterprise application

### Use submit() Helper When

- ✅ You have async form submissions
- ✅ You need server error handling
- ✅ You want automatic submission state tracking
- ✅ You need loading indicators
- ✅ You're calling APIs on submit

### Use Custom Resolvers When

- ✅ Your field naming doesn't match form paths
- ✅ You have nested form structures
- ✅ You need dynamic field resolution
- ✅ You're migrating from legacy forms

## 🐛 Common Issues

### Configuration not applied

**Problem:** Global config not working

**Solution:** Verify provider is in app.config.ts

```typescript
// ❌ Wrong: In component providers
@Component({
  providers: [provideNgxSignalFormsConfig(...)], // Won't work globally
})

// ✅ Correct: In app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [provideNgxSignalFormsConfig(...)],
};
```

### Submission state not updating

**Problem:** `submittedStatus` always 'unsubmitted'

**Solution:** Use `(ngSubmit)` on form element

```html
<!-- ❌ Wrong: Manual submit handling -->
<form>
  <button (click)="save()">Submit</button>
</form>

<!-- ✅ Correct: Use ngSubmit event -->
<form (ngSubmit)="save()">
  <button type="submit">Submit</button>
</form>
```

### Server errors not displaying

**Problem:** Errors returned from `submit()` not showing

**Solution:** Ensure errors are returned in correct format

```typescript
// ❌ Wrong: Throwing errors
throw new Error('Server error');

// ✅ Correct: Return error array
return [
  {
    kind: 'server_error',
    message: 'Server error',
    field: formData,
  },
];
```

---

**Congratulations!** You've completed all 5 sections of the demo. You now understand the complete toolkit from 0% to 100% adoption! 🎉
