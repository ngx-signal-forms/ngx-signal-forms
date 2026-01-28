# Toolkit Core (100% Toolkit)

> **Deep Dive:** Comprehensive toolkit features and patterns

## 🎯 Purpose

This section demonstrates **complete toolkit adoption** with focus on core features. Each example highlights a specific toolkit capability in isolation.

**Adoption Level:** 100% toolkit

- ✅ Full auto-ARIA implementation
- ✅ Error display component
- ✅ Error display strategies
- ✅ Warning support
- ✅ Field state visualization

**Key Focus:** Understanding toolkit features before combining them in production.

## 📂 Examples

### accessibility-comparison

**Focus:** Side-by-side comparison of manual vs toolkit ARIA

**What you'll learn:**

- Exact code reduction (~67%)
- ARIA attribute automation
- WCAG 2.2 compliance differences
- Screen reader behavior

**Key Takeaway:** Visualize the value proposition of auto-ARIA

---

### error-display-modes

**Focus:** Four error display strategies in action

**What you'll learn:**

- `immediate` - Show errors as user types
- `on-touch` - Show after blur/submit (WCAG recommended)
- `on-submit` - Show only after submission
- `manual` - Full programmatic control

**Key Takeaway:** Choose the right UX for your use case

---

### warning-support

**Focus:** Non-blocking validation messages

**What you'll learn:**

- Warnings vs errors (WCAG distinction)
- `warningError()` utility
- ARIA roles: `alert` vs `status`
- Progressive guidance patterns

**Key Takeaway:** Guide users without blocking submission

---

### field-states

**Focus:** Visualizing form field states

**What you'll learn:**

- `touched`, `dirty`, `pristine`, `valid`, `invalid`
- `pending` state (async validation)
- Signal-based state reactivity
- Debug visualization patterns

**Key Takeaway:** Understanding form state lifecycle

## 🎨 Detailed Feature Breakdown

### 1. Error Display Strategies

#### immediate

**When to use:** Real-time feedback for critical fields (passwords, credit cards)

```typescript
<form [ngxSignalForm]="form" [errorStrategy]="'immediate'">
  <!-- Errors show as user types -->
</form>
```

**UX Impact:**

- ✅ Fastest feedback
- ⚠️ Can be disruptive
- ⚠️ May frustrate users

#### on-touch (RECOMMENDED)

**When to use:** Most forms - balances UX and accessibility

```typescript
<form [ngxSignalForm]="form" [errorStrategy]="'on-touch'">
  <!-- Errors show after blur OR submit -->
</form>
```

**UX Impact:**

- ✅ WCAG 2.2 recommended pattern
- ✅ Less disruptive
- ✅ Progressive disclosure

**Note:** Angular Signal Forms' `[formField]` directive automatically marks fields as touched on blur.

#### on-submit

**When to use:** Long forms where field-level errors would be overwhelming

```typescript
<form [ngxSignalForm]="form" [errorStrategy]="'on-submit'">
  <!-- Errors show only after submit attempt -->
</form>
```

**UX Impact:**

- ✅ Clean initial experience
- ⚠️ Delayed feedback
- ⚠️ May require form-level summary

#### manual

**When to use:** Custom flows (wizards, conditional logic)

```typescript
const showErrors = computeShowErrors(
  form.field,
  'manual',
  signal<SubmittedStatus>('unsubmitted')
);

@if (showErrors() && customCondition()) {
  <ngx-signal-form-error ... />
}
```

**UX Impact:**

- ✅ Full control
- ⚠️ Requires manual state management
- ⚠️ Easy to miss edge cases

### 2. Warning Support

#### Warning vs Error

**Errors (Blocking):**

- Prevent form submission
- `role="alert"` + `aria-live="assertive"` (immediate announcement)
- Red styling convention
- Must be fixed

**Warnings (Non-Blocking):**

- Allow form submission
- `role="status"` + `aria-live="polite"` (non-intrusive announcement)
- Yellow/orange styling convention
- Provide guidance

#### Creating Warnings

```typescript
import { warningError } from '@ngx-signal-forms/toolkit';

validate(path.password, (ctx) => {
  const value = ctx.value();
  if (value && value.length < 12) {
    return warningError(
      'short-password',
      'Consider using 12+ characters for better security',
    );
  }
  return null;
});
```

#### WCAG Compliance

| Type    | ARIA Role | Live Region | Screen Reader      | User Action |
| ------- | --------- | ----------- | ------------------ | ----------- |
| Error   | `alert`   | `assertive` | Immediate announce | Must fix    |
| Warning | `status`  | `polite`    | Queued announce    | Can ignore  |

### 3. Field State Visualization

#### Built-in States (Angular Signal Forms)

```typescript
field().touched(); // User interacted (blur)
field().dirty(); // Value changed
field().valid(); // No errors
field().invalid(); // Has errors
field().pending(); // Async validation in progress
field().disabled(); // Disabled by validator
field().readonly(); // Readonly by validator
field().hidden(); // Hidden by validator (template controls visibility)
```

#### Toolkit Enhancements

```typescript
// Derive submitted status when not using the directive context
const submittedStatus = computed(() => {
  const state = form();
  if (state.submitting()) return 'submitting';
  if (state.touched()) return 'submitted';
  return 'unsubmitted';
});

// Computed error visibility
const showFieldErrors = showErrors(form.field, 'on-touch', submittedStatus);

// Warning vs error separation
const warnings = field().errors().filter(isWarningError);
const blockingErrors = field().errors().filter(isBlockingError);
```

#### Debug Visualization Pattern

```html
<div class="debug-panel">
  <p>Touched: {{ field().touched() }}</p>
  <p>Dirty: {{ field().dirty() }}</p>
  <p>Valid: {{ field().valid() }}</p>
  <p>Pending: {{ field().pending() }}</p>
  <p>Errors: {{ field().errors().length }}</p>
  <p>Warnings: {{ warnings().length }}</p>
</div>
```

## 📊 WCAG 2.2 Compliance Matrix

| Requirement                      | Without Toolkit           | With Toolkit                    |
| -------------------------------- | ------------------------- | ------------------------------- |
| **3.3.1 Error Identification**   | Manual templates          | Automatic ✅                    |
| **3.3.2 Labels or Instructions** | Manual `<label>` + `for`  | Supports + validates ✅         |
| **3.3.3 Error Suggestion**       | Manual messages           | Component + validation ✅       |
| **4.1.3 Status Messages**        | Manual `role`             | Automatic (alert/status) ✅     |
| **Live Regions**                 | Manual `aria-live`        | Automatic (assertive/polite) ✅ |
| **Field Linking**                | Manual `aria-describedby` | Automatic ✅                    |

## 🔍 Example Use Cases

### Accessibility Comparison

**Goal:** Show the exact code difference

**Value:**

- Convince stakeholders of toolkit ROI
- Training new developers
- Migration planning

**Pattern:**

```typescript
// Side-by-side components
@Component({ /* Manual implementation */ })
@Component({ /* Toolkit implementation */ })
```

### Error Display Modes

**Goal:** Choose the right strategy for your UX

**Value:**

- User testing different patterns
- Product demos
- A/B testing setup

**Pattern:**

```typescript
protected readonly errorStrategy = signal<ErrorDisplayStrategy>('on-touch');

// Toggle via UI
<select [(ngModel)]="errorStrategy">
  <option value="immediate">Immediate</option>
  <option value="on-touch">On Touch</option>
  <option value="on-submit">On Submit</option>
</select>
```

### Warning Support

**Goal:** Guide users without blocking submission

**Value:**

- Password strength indicators
- Data quality suggestions
- Performance hints

**Pattern:**

```typescript
// Blocking: Must fix
required(path.email, { message: 'Email is required' });

// Non-blocking: Nice to have
validate(path.email, (ctx) => {
  if (ctx.value()?.includes('@tempmail.com')) {
    return warningError(
      'disposable-email',
      'Consider a permanent email for better account recovery',
    );
  }
  return null;
});
```

### Field States

**Goal:** Debug form behavior during development

**Value:**

- Understanding state lifecycle
- Debugging validation timing
- Testing async validators

**Pattern:**

```typescript
// Debug panel component
@for (field of Object.entries(form()); track field[0]) {
  <div>{{ field[0] }}: {{ field[1]().value() }}</div>
}
```

## ➡️ Next Steps

### Level 4: Form Field Wrapper

**Path:** `03-form-field-wrapper/`

**What changes:**

- `NgxSignalFormFieldWrapperComponent` for layout
- Content projection (label + input)
- Automatic error display
- Consistent spacing
- ~80% code reduction

### Level 5: Advanced Patterns

**Path:** `04-advanced/`

**What changes:**

- Global configuration (`provideNgxSignalFormsConfig`)
- Custom field resolvers
- Async submission patterns
- Production-ready error handling

## 🤔 When to Use Each Feature

### Use Immediate Errors

- ✅ Field is critical (password confirmation)
- ✅ Feedback must be instant
- ⚠️ Be careful: can frustrate users

### Use On-Touch Errors

- ✅ Standard forms (90% of cases)
- ✅ WCAG compliance is required
- ✅ You want progressive disclosure

### Use On-Submit Errors

- ✅ Very long forms
- ✅ Wizard/multi-step flows
- ✅ Summary-based validation

### Use Warnings

- ✅ Guidance, not requirements
- ✅ Security suggestions (password strength)
- ✅ Data quality hints
- ✅ Performance tips

### Use Field States

- ✅ Debugging forms
- ✅ Understanding validation timing
- ✅ Testing async validators
- ✅ Building custom visualizations

---

**Next:** Try `03-form-field-wrapper/` for production-ready layouts! 🚀
