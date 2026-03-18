# Advanced Patterns (100% Toolkit)

> **Production Ready:** Global configuration and async submission patterns

## 🎯 Purpose

This section demonstrates **production-ready patterns** for real-world applications including global configuration, deterministic field identity, and async submission handling.

**Adoption Level:** 100% toolkit

- ✅ Global configuration
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
- Form-level strategy overrides when one form needs different timing

**Technologies:**

- App-level configuration providers
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

---

### advanced-wizard

**Focus:** Canonical multi-step production wizard

**What you'll learn:**

- NgRx Signal Store feature composition for wizard state
- Form-per-step architecture with explicit commit boundaries
- Cross-step validation (traveler + trip constraints)
- Debounced autosave and step orchestration
- Zod-backed schema validation in a realistic workflow

**Technologies:**

- `@ngrx/signals` Signal Store
- Angular Signal Forms step factories
- Zod schema validation
- Deferred step rendering and focus management

---

### Consolidated examples (route cleanup)

The following overlapping demos were consolidated to reduce duplication:

- `advanced-scenarios/dynamic-list` → `form-field-wrapper/complex-forms`
- `advanced-scenarios/nested-groups` → `form-field-wrapper/complex-forms`
- `advanced-scenarios/stepper-form` → `advanced-scenarios/advanced-wizard`

Legacy paths are redirected so existing links keep working.

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

      // Default appearance for form fields
      defaultFormFieldAppearance: 'outline',
    }),
  ],
};
```

When one form needs a different display strategy, prefer a local template override:

```html
<form [formRoot]="registrationForm" errorStrategy="immediate">
  <!-- This form shows errors immediately without changing global defaults -->
</form>
```

### Configuration Options

| Option                       | Type                     | Default      | Description                      |
| ---------------------------- | ------------------------ | ------------ | -------------------------------- |
| `autoAria`                   | `boolean`                | `true`       | Enable automatic ARIA attributes |
| `defaultErrorStrategy`       | `ErrorDisplayStrategy`   | `'on-touch'` | Default error display strategy   |
| `defaultFormFieldAppearance` | `'default' \| 'outline'` | `undefined`  | Default form field appearance    |

### Field Identity

The toolkit resolves wrapper field identity from the projected control's `id` attribute. This is the WCAG-recommended approach and keeps error/hint linkage deterministic.

**Example:**

```html
<ngx-signal-form-field-wrapper [formField]="form.email">
  <label for="email">Email</label>
  <input id="email" [formField]="form.email" />
</ngx-signal-form-field-wrapper>
```

## 💡 Async Submission Patterns

### Using declarative submission (Recommended)

Angular Signal Forms provides a built-in `submit()` helper that automatically manages submission state:

```typescript
import { submit } from '@angular/forms/signals';

@Component({
  template: `
    <form [formRoot]="registrationForm">
      <!-- Form fields -->

      <button
        type="submit"
        [disabled]="
          registrationForm().invalid() || registrationForm().submitting()
        "
      >
        @if (registrationForm().submitting()) {
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
  protected readonly registrationForm = form(this.#model, validators, {
    submission: {
      action: async (formData) => {
        this.serverError.set(null);

        try {
          await this.apiService.register(formData().value());
          this.router.navigate(['/success']);
          return null;
        } catch (error: any) {
          this.serverError.set(error.message || 'Registration failed');
          return [
            {
              kind: 'server_error',
              message: error.message || 'Registration failed',
              field: formData,
            },
          ];
        }
      },
    },
  });

  protected readonly serverError = signal<string | null>(null);

  // Angular 21.2's declarative submission automatically:
  // 1. Marks all fields as touched (shows all errors on submit)
  // 2. Sets submitting() to true during the async action
  // 3. Handles async operations
  // 4. Returns server errors for display
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

When you use the toolkit's `NgxSignalFormDirective` (`[formRoot]`), the derived status is provided via DI for convenience:

```html
<form [formRoot]="registrationForm">
  <!-- NgxSignalFormErrorComponent automatically receives submittedStatus -->
  <ngx-signal-form-error
    [formField]="registrationForm.email"
    fieldName="email"
  />

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
<button type="submit" [disabled]="registrationForm().submitting()">
  @if (registrationForm().submitting()) {
  <span class="spinner"></span>
  Saving... } @else { Submit Registration }
</button>
```

**Form-wide loading indicator:**

```html
@if (registrationForm().submitting()) {
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
- ✅ You're building an enterprise application

### Use declarative submission When

- ✅ You have async form submissions
- ✅ You need server error handling
- ✅ You want automatic submission state tracking
- ✅ You need loading indicators
- ✅ You're calling APIs on submit

## 🐛 Common Issues

### Configuration not applied

**Problem:** Global config not working

**Solution:** Verify the provider is in `app.config.ts` for global defaults. For one-off differences, prefer per-form or per-field strategy inputs instead of subtree-level provider overrides.

```typescript
// ❌ Wrong: In component providers when you expect global defaults
@Component({
  providers: [provideNgxSignalFormsConfig(...)], // Won't work globally
})

// ✅ Correct: In app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [provideNgxSignalFormsConfig(...)],
};
```

```html
<!-- ✅ Correct: Override timing locally when only one form differs -->
<form [formRoot]="registrationForm" errorStrategy="immediate">...</form>
```

### Submission state not updating

**Problem:** `submittedStatus` always 'unsubmitted'

**Solution:** Use `[formRoot]` and configure declarative `submission` in `form()`

```html
<!-- ❌ Wrong: No form directive/context -->
<form>
  <button type="submit" class="btn-primary">Submit</button>
</form>

<!-- ✅ Correct: Use [formRoot] + declarative submission -->
<form [formRoot]="registrationForm">
  <button type="submit" class="btn-primary">Submit</button>
</form>
```

```typescript
readonly registrationForm = form(this.#model, schema, {
  submission: {
    action: async () => {
      // Handle form submission
      return null;
    },
  },
});
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
