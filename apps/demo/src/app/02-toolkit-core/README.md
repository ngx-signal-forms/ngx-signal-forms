# Toolkit Core (100% Toolkit)

> **Deep Dive:** Core toolkit behavior without extra route duplication

## 🎯 Purpose

This section now focuses on the two live examples that best explain the toolkit's core UX model:

- how validation feedback becomes visible
- how warnings differ from blocking errors

Concepts that used to live in standalone comparison/state pages are now taught through the onboarding page, strategy controls, and debugger views on active examples.

## 📂 Active Examples

### error-display-modes

**Focus:** Error visibility strategies in action

**What you'll learn:**

- `immediate` — show feedback as soon as validation fails
- `on-touch` — show feedback after blur or submit (default recommendation)
- `on-submit` — defer field-level feedback until submit attempt
- How the debugger reveals hidden vs visible errors under each mode

**Primary takeaway:** Choose timing intentionally, not ad hoc per template.

---

### warning-support

**Focus:** Non-blocking validation patterns

**What you'll learn:**

- `warningError()` and warning semantics
- `role="alert"` vs `role="status"`
- Why advisory guidance should not block submit
- How warning visibility interacts with the same error strategy model

**Primary takeaway:** Guide users without turning every suggestion into a hard stop.

## 📦 Consolidated Concepts

The following older demos are no longer routed, but their teaching goals were preserved:

- **Accessibility comparison** → folded into `getting-started/your-first-form` onboarding and the main project README/code comparison
- **Field states** → surfaced through debugger panels and strategy explanations in active demos

If you need the old implementation details, the source folders remain in the repo as archived references.

## 🎨 Detailed Feature Breakdown

### 1. Error Display Strategies

#### immediate

**When to use:** Real-time feedback for critical fields (passwords, credit cards)

```typescript
<form [formRoot]="form" [errorStrategy]="'immediate'">
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
<form [formRoot]="form" [errorStrategy]="'on-touch'">
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
<form [formRoot]="form" [errorStrategy]="'on-submit'">
  <!-- Errors show only after submit attempt -->
</form>
```

**UX Impact:**

- ✅ Clean initial experience
- ⚠️ Delayed feedback
- ⚠️ May require form-level summary

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

### Debugging State Through Active Demos

**Goal:** Understand field lifecycle without a dedicated state-only route.

**Value:**

- Inspect touched/dirty/invalid transitions in realistic forms
- See how hidden errors become visible under different strategies
- Verify warning vs blocking error separation in debugger output

## ➡️ Next Steps

### Level 4: Form Field Wrapper

**Path:** `04-form-field-wrapper/`

**What changes:**

- `NgxFormField` for layout
- Content projection (label + input)
- Automatic error display
- Consistent spacing
- ~80% code reduction

### Level 5: Advanced Patterns

**Path:** `05-advanced/`

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

**Next:** Continue to `04-form-field-wrapper/complex-forms` for wrapper-based long-form composition. 🚀
