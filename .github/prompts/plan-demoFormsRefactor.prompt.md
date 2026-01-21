# Plan: Demo Forms Refactor & New Use Cases

**TL;DR:** Apply naming conventions (descriptive event handlers like `save()`, `register()`) and consistent button UX (disabled with progress text) across all demos. Fix existing issues. Add 5 new demos to cover missing toolkit and Signal Forms features.

---

## Part 1: Updates to Existing Forms

### 1. [pure-signal-form.form.ts](apps/demo/src/app/00-signal-forms-only/pure-signal-form/pure-signal-form.form.ts)

- Rename `handleSubmit()` → `saveContact()`
- Add "Saving..." text to button while submitting

### 2. [your-first-form.form.ts](apps/demo/src/app/01-getting-started/your-first-form/your-first-form.form.ts)

- Rename `handleSubmit()` → `sendMessage()`
- Add "Sending..." text to button while submitting

### 3. [accessibility-comparison.manual.form.ts](apps/demo/src/app/02-toolkit-core/accessibility-comparison/accessibility-comparison.manual.form.ts)

- Rename `handleSubmit()` → `subscribe()`
- Add "Subscribing..." text to button

### 4. [accessibility-comparison.minimal.form.ts](apps/demo/src/app/02-toolkit-core/accessibility-comparison/accessibility-comparison.minimal.form.ts)

- Rename `handleSubmit()` → `subscribe()`
- Add "Subscribing..." text to button

### 5. [accessibility-comparison.toolkit.form.ts](apps/demo/src/app/02-toolkit-core/accessibility-comparison/accessibility-comparison.toolkit.form.ts)

- Rename `handleSubmit()` → `subscribe()`
- Add "Subscribing..." text to button

### 6. [error-display-modes.form.ts](apps/demo/src/app/02-toolkit-core/error-display-modes/error-display-modes.form.ts)

- Rename `handleSubmit()` → `submitFeedback()`
- Remove unused `onSubmitAttempt()` method
- Add "Submitting..." text to button

### 7. [field-states.form.ts](apps/demo/src/app/02-toolkit-core/field-states/field-states.form.ts)

- Rename `handleSubmit()` → `saveUser()`
- Add "Saving..." text to button

### 8. [warning-support.form.ts](apps/demo/src/app/02-toolkit-core/warning-support/warning-support.form.ts)

- Rename `handleSubmit()` → `updateSettings()`
- Add "Updating..." text to button

### 9. [basic-usage.form.ts](apps/demo/src/app/03-form-field-wrapper/basic-usage/basic-usage.form.ts)

- Rename `handleSubmit()` → `saveProfile()`
- Add "Saving..." text to button

### 10. [complex-forms.form.ts](apps/demo/src/app/03-form-field-wrapper/complex-forms/complex-forms.form.ts)

- Rename `handleSubmit()` → `submitProject()`
- Add "Submitting..." text to button

### 11. [outline-form-field.form.ts](apps/demo/src/app/03-form-field-wrapper/outline-form-field/outline-form-field.form.ts)

- Rename `handleSubmit()` → `submitOrder()`
- Add "Processing..." text to button

### 12. [error-messages.form.ts](apps/demo/src/app/04-advanced/error-messages/error-messages.form.ts)

- Rename `handleSubmit()` → `createAccount()`
- Add "Creating..." text to button

### 13. [global-configuration.form.ts](apps/demo/src/app/04-advanced/global-configuration/global-configuration.form.ts)

- Rename `handleSubmit()` → `saveConfiguration()`
- Fix `resetForm()` to also call `configForm().reset()`
- Fix displayed field resolution order: `data-signal-field → resolver → id → name`
- Add "Saving..." text to button

### 14. [submission-patterns.form.ts](apps/demo/src/app/04-advanced/submission-patterns/submission-patterns.form.ts)

- Rename `handleSubmit()` → `register()`
- Remove unused `errorDisplayMode` input (form hardcodes `'on-submit'`)
- Update template to show "Creating account..." during submission

---

## Part 2: New Demo Forms

### 1. **Async Validation** (`04-advanced/async-validation/`)

- Use case: Username availability check with pending indicator
- Features: `validateHttp()`, `pending()` state, debounce pattern
- Event handler: `checkUsername()` for blur-triggered check, `register()` for submit

### 2. **Conditional Validation** (`04-advanced/conditional-validation/`)

- Use case: Newsletter signup with optional email (required only when subscribed)
- Features: `when` option in validators, `disabled()` for conditional fields
- Event handler: `subscribeNewsletter()`

### 3. **Schema Composition** (`04-advanced/schema-composition/`)

- Use case: Multi-address order form reusing address schema
- Features: `apply()`, `applyEach()`, `applyWhenValue()` for type-guarded schemas
- Event handler: `placeOrder()`

### 4. **Custom Form Control** (`04-advanced/custom-control/`)

- Use case: Star rating component implementing `FormValueControl`
- Features: Custom control with `writeValue`, `focus()`, signal inputs
- Event handler: `submitReview()`

### 5. **Status Classes Alignment** (`02-toolkit-core/status-classes/`)

- Use case: Bootstrap/Tailwind-style form with `is-invalid` classes
- Features: `ngxStatusClasses()`, `provideNgxStatusClasses()`, CSS synced with error strategy
- Event handler: `saveDetails()`

---

## Further Considerations

1. **Button state pattern**: Create a shared snippet/pattern for the `@if (isSubmitting()) { <span>Saving...</span> } @else { <span>Save</span> }` pattern to ensure consistency across all demos?

2. **Submission helpers coverage**: Should `hasSubmitted()` be added to the existing `submission-patterns` demo, or do we create a separate "Submission State Helpers" demo showing `canSubmit()`, `isSubmitting()`, and `hasSubmitted()` together?

3. **Auto ARIA opt-out demo**: Should this be a standalone demo, or can it be added as an example toggle within the existing `accessibility-comparison` page?
