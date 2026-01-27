# @ngx-signal-forms/toolkit/headless

> Renderless (headless) primitives for Angular Signal Forms - state-only directives that expose signals without rendering any UI.

## Why Headless?

Traditional form components couple **state management** with **visual presentation**. Headless directives separate these concerns:

| Approach                | State Logic | UI Rendering | Styling Control            |
| ----------------------- | ----------- | ------------ | -------------------------- |
| **Styled Components**   | ✅ Built-in | ✅ Built-in  | ⚠️ Limited (CSS overrides) |
| **Headless Directives** | ✅ Built-in | ❌ None      | ✅ Full control            |

**Use headless when you need:**

- 🎨 **Design system integration** - Build form components that match your exact design tokens
- 🔧 **Framework agnostic styling** - Works with Tailwind, Bootstrap, Material, or custom CSS
- 📦 **Minimal bundle size** - No UI code, just signals
- 🧩 **Composable architecture** - Combine primitives into custom components
- 🎯 **Host directive composition** - Use as `hostDirectives` in your own components

## Installation

Included with `@ngx-signal-forms/toolkit`:

```typescript
import {
  NgxHeadlessErrorStateDirective,
  NgxHeadlessCharacterCountDirective,
  NgxHeadlessFieldsetDirective,
  NgxHeadlessFieldNameDirective,
  NgxHeadlessToolkit,
} from '@ngx-signal-forms/toolkit/headless';
```

## Quick Start

### Basic Usage (Template Binding)

Apply a headless directive and use `exportAs` to access signals in your template:

```html
<div
  ngxSignalFormHeadlessErrorState
  #errorState="errorState"
  [field]="form.email"
  fieldName="email"
>
  <input [formField]="form.email" />

  @if (errorState.showErrors() && errorState.hasErrors()) {
  <div class="my-custom-error">
    @for (error of errorState.resolvedErrors(); track error.kind) {
    <span>{{ error.message }}</span>
    }
  </div>
  }
</div>
```

### Using as Host Directives (Composition API)

Headless directives are designed to work with Angular's [Directive Composition API](https://angular.dev/guide/directives/directive-composition-api):

```typescript
import { NgxHeadlessErrorStateDirective } from '@ngx-signal-forms/toolkit/headless';

@Component({
  selector: 'my-form-field',
  hostDirectives: [
    {
      directive: NgxHeadlessErrorStateDirective,
      inputs: ['field', 'fieldName', 'strategy'],
    },
  ],
  template: `
    <ng-content></ng-content>
    @if (errorState.showErrors()) {
      <div class="error-container">
        @for (error of errorState.resolvedErrors(); track error.kind) {
          <span class="error">{{ error.message }}</span>
        }
      </div>
    }
  `,
})
export class MyFormFieldComponent {
  // Inject the host directive to access its signals
  protected readonly errorState = inject(NgxHeadlessErrorStateDirective);
}
```

**Key benefits of host directive composition:**

- ✅ Cleaner component API - inputs exposed on your component
- ✅ Encapsulated logic - state management handled by the directive
- ✅ DI-based access - inject the directive to read signals
- ✅ Lifecycle ordering - directive initializes before your component

## Directives

### NgxHeadlessErrorStateDirective

Exposes error state signals for custom error display implementations.

| Selector  | `[ngxSignalFormHeadlessErrorState]` |
| --------- | ----------------------------------- |
| Export As | `errorState`                        |

**Inputs:**

| Input             | Type                   | Description                                           |
| ----------------- | ---------------------- | ----------------------------------------------------- |
| `field`           | `FieldTree<T>`         | The Signal Forms field to track                       |
| `fieldName`       | `string`               | Field name for ID generation                          |
| `strategy`        | `ErrorDisplayStrategy` | When to show errors (optional, inherits from context) |
| `submittedStatus` | `SubmittedStatus`      | Submission state for 'on-submit' strategy (optional)  |

**Signals (via `exportAs` or `inject()`):**

| Signal             | Type                        | Description                                 |
| ------------------ | --------------------------- | ------------------------------------------- |
| `showErrors`       | `Signal<boolean>`           | Whether to display errors based on strategy |
| `showWarnings`     | `Signal<boolean>`           | Whether to display warnings                 |
| `errors`           | `Signal<ValidationError[]>` | Raw blocking errors                         |
| `warnings`         | `Signal<ValidationError[]>` | Raw warning errors                          |
| `resolvedErrors`   | `Signal<ResolvedError[]>`   | Errors with resolved messages               |
| `resolvedWarnings` | `Signal<ResolvedError[]>`   | Warnings with resolved messages             |
| `hasErrors`        | `Signal<boolean>`           | Has any blocking errors                     |
| `hasWarnings`      | `Signal<boolean>`           | Has any warnings                            |
| `errorId`          | `Signal<string>`            | Generated ID for `aria-describedby`         |
| `warningId`        | `Signal<string>`            | Generated warning region ID                 |

**Example:**

```html
<div
  ngxSignalFormHeadlessErrorState
  #errorState="errorState"
  [field]="form.email"
  fieldName="email"
  [strategy]="'immediate'"
>
  <label for="email">Email</label>
  <input
    id="email"
    [formField]="form.email"
    [attr.aria-invalid]="errorState.hasErrors() ? 'true' : null"
    [attr.aria-describedby]="errorState.showErrors() ? errorState.errorId() : null"
  />

  @if (errorState.showErrors() && errorState.hasErrors()) {
  <ul [id]="errorState.errorId()" role="alert" class="error-list">
    @for (error of errorState.resolvedErrors(); track error.kind) {
    <li>{{ error.message }}</li>
    }
  </ul>
  }
</div>
```

---

### NgxHeadlessCharacterCountDirective

Provides character count signals with progressive limit states.

| Selector  | `[ngxSignalFormHeadlessCharacterCount]` |
| --------- | --------------------------------------- |
| Export As | `characterCount`                        |

**Inputs:**

| Input              | Type                | Default  | Description                       |
| ------------------ | ------------------- | -------- | --------------------------------- |
| `field`            | `FieldTree<string>` | required | The string field to track         |
| `maxLength`        | `number`            | required | Maximum character limit           |
| `warningThreshold` | `number`            | `0.8`    | Threshold for warning state (80%) |
| `dangerThreshold`  | `number`            | `0.95`   | Threshold for danger state (95%)  |

**Signals:**

| Signal              | Type                     | Description                                   |
| ------------------- | ------------------------ | --------------------------------------------- |
| `currentLength`     | `Signal<number>`         | Current value length                          |
| `resolvedMaxLength` | `Signal<number \| null>` | Maximum length                                |
| `remaining`         | `Signal<number \| null>` | Characters remaining (negative if exceeded)   |
| `limitState`        | `Signal<LimitState>`     | `'ok' \| 'warning' \| 'danger' \| 'exceeded'` |
| `hasLimit`          | `Signal<boolean>`        | Whether a limit is configured                 |
| `isExceeded`        | `Signal<boolean>`        | Whether limit was exceeded                    |
| `percentUsed`       | `Signal<number \| null>` | Percentage of limit used (0-100+)             |

**Limit States:**

| State        | Condition       | Typical Styling |
| ------------ | --------------- | --------------- |
| `'ok'`       | < 80% of limit  | Default/neutral |
| `'warning'`  | 80-94% of limit | Yellow/amber    |
| `'danger'`   | 95-99% of limit | Orange/red      |
| `'exceeded'` | ≥ 100% of limit | Red/error       |

**Example:**

```html
<div
  ngxSignalFormHeadlessCharacterCount
  #charCount="characterCount"
  [field]="form.bio"
  [maxLength]="500"
>
  <textarea [formField]="form.bio"></textarea>

  @if (charCount.hasLimit()) {
  <span
    class="char-count"
    [class.warning]="charCount.limitState() === 'warning'"
    [class.danger]="charCount.limitState() === 'danger'"
    [class.exceeded]="charCount.limitState() === 'exceeded'"
  >
    {{ charCount.currentLength() }} / {{ charCount.resolvedMaxLength() }} @if
    (charCount.isExceeded()) {
    <span class="over-limit">({{ charCount.remaining() }} over limit)</span>
    }
  </span>
  }
</div>
```

---

### NgxHeadlessFieldsetDirective

Aggregates error state across multiple fields for group validation display.

| Selector  | `[ngxSignalFormHeadlessFieldset]` |
| --------- | --------------------------------- |
| Export As | `fieldset`                        |

**Inputs:**

| Input           | Type                   | Description                                   |
| --------------- | ---------------------- | --------------------------------------------- |
| `fieldsetField` | `FieldTree<T>`         | Primary field group (uses `errorSummary()`)   |
| `fields`        | `FieldTree[]`          | Optional explicit list of fields to aggregate |
| `fieldsetId`    | `string`               | Optional ID for the fieldset                  |
| `strategy`      | `ErrorDisplayStrategy` | Error display strategy override               |

**Signals:**

| Signal                  | Type                        | Description                         |
| ----------------------- | --------------------------- | ----------------------------------- |
| `aggregatedErrors`      | `Signal<ValidationError[]>` | Deduplicated errors from all fields |
| `aggregatedWarnings`    | `Signal<ValidationError[]>` | Deduplicated warnings               |
| `hasErrors`             | `Signal<boolean>`           | Any field has errors                |
| `hasWarnings`           | `Signal<boolean>`           | Any field has warnings              |
| `shouldShowErrors`      | `Signal<boolean>`           | Show errors based on strategy       |
| `shouldShowWarnings`    | `Signal<boolean>`           | Show warnings (when no errors)      |
| `isInvalid` / `isValid` | `Signal<boolean>`           | Validation state                    |
| `isTouched` / `isDirty` | `Signal<boolean>`           | Interaction state                   |
| `isPending`             | `Signal<boolean>`           | Async validation pending            |
| `resolvedFieldsetId`    | `Signal<string>`            | Generated or provided ID            |

**Example:**

```html
<fieldset
  ngxSignalFormHeadlessFieldset
  #fieldset="fieldset"
  [fieldsetField]="form.address"
  fieldsetId="address"
  [class.has-errors]="fieldset.hasErrors()"
>
  <legend>Address</legend>

  <input [formField]="form.address.street" placeholder="Street" />
  <input [formField]="form.address.city" placeholder="City" />
  <input [formField]="form.address.zip" placeholder="ZIP" />

  @if (fieldset.shouldShowErrors()) {
  <div class="fieldset-errors" role="alert">
    @for (error of fieldset.aggregatedErrors(); track error.kind) {
    <span>{{ error.message }}</span>
    }
  </div>
  }
</fieldset>
```

---

### NgxHeadlessFieldNameDirective

Resolves field names and generates accessible IDs.

If `fieldName` is omitted, the directive uses the host element `id`. If no `id` is present, it generates a unique fallback.

| Selector  | `[ngxSignalFormHeadlessFieldName]` |
| --------- | ---------------------------------- |
| Export As | `fieldName`                        |

**Inputs:**

| Input       | Type                       | Description                                                      |
| ----------- | -------------------------- | ---------------------------------------------------------------- |
| `fieldName` | `string \| Signal<string>` | Optional field name (falls back to host `id` or generated value) |

**Signals:**

| Signal              | Type              | Description                 |
| ------------------- | ----------------- | --------------------------- |
| `resolvedFieldName` | `Signal<string>`  | Resolved field name         |
| `hasFieldName`      | `Signal<boolean>` | Has non-empty name          |
| `errorId`           | `Signal<string>`  | Generated error region ID   |
| `warningId`         | `Signal<string>`  | Generated warning region ID |

**Example:**

```html
<div
  ngxSignalFormHeadlessFieldName
  #fieldName="fieldName"
  [fieldName]="dynamicName()"
>
  <label [for]="fieldName.resolvedFieldName()">{{ labelText }}</label>
  <input
    [id]="fieldName.resolvedFieldName()"
    [formField]="form.field"
    [attr.aria-describedby]="fieldName.errorId()"
  />
  <div [id]="fieldName.errorId()" role="alert">
    <!-- Error display -->
  </div>
</div>
```

---

## Utility Functions

For programmatic use without directives:

### createErrorState()

```typescript
import { createErrorState } from '@ngx-signal-forms/toolkit/headless';

const errorState = createErrorState({
  field: form.email,
  fieldName: 'email',
});

// Access signals
effect(() => {
  if (errorState.showErrors() && errorState.hasErrors()) {
    console.log('Errors:', errorState.errors());
  }
});
```

### createCharacterCount()

```typescript
import { createCharacterCount } from '@ngx-signal-forms/toolkit/headless';

const charCount = createCharacterCount({
  field: form.bio,
  maxLength: 500,
  warningThreshold: 0.8,
  dangerThreshold: 0.95,
});

// Access signals
effect(() => {
  console.log(
    `${charCount.currentLength()} / ${charCount.resolvedMaxLength()}`,
  );
  console.log(`State: ${charCount.limitState()}`);
});
```

### readFieldFlag()

Safely reads boolean state flags from a FieldTree or FieldState-like object. Handles null/undefined gracefully.

```typescript
import { readFieldFlag } from '@ngx-signal-forms/toolkit/headless';

// Read state flags from any FieldTree or FieldState
const isInvalid = readFieldFlag(form.email(), 'invalid');
const isTouched = readFieldFlag(form.email(), 'touched');
const isDirty = readFieldFlag(form.email(), 'dirty');
const isPending = readFieldFlag(form.email(), 'pending');

// Safe with null/undefined - returns false
const safeRead = readFieldFlag(null, 'invalid'); // false
```

**Supported keys:** `'invalid'`, `'valid'`, `'touched'`, `'dirty'`, `'pending'`

### readErrors()

Reads validation errors from a FieldTree, preferring `errorSummary()` (aggregated errors) over `errors()` (single-field errors).

```typescript
import { readErrors } from '@ngx-signal-forms/toolkit/headless';

// For fieldsets/groups - uses errorSummary() for aggregated errors
const fieldsetErrors = readErrors(form.address());

// For single fields - falls back to errors()
const fieldErrors = readErrors(form.email());

// Safe with null - returns []
const safeRead = readErrors(null); // []
```

### dedupeValidationErrors()

Removes duplicate validation errors based on `kind` + `message` combination.

```typescript
import { dedupeValidationErrors } from '@ngx-signal-forms/toolkit/headless';

const errors = [
  { kind: 'required', message: 'Field required' },
  { kind: 'email', message: 'Invalid email' },
  { kind: 'required', message: 'Field required' }, // duplicate
];

const unique = dedupeValidationErrors(errors);
// Result: [{ kind: 'required', message: 'Field required' }, { kind: 'email', message: 'Invalid email' }]
```

### createUniqueId()

Generates sequential unique IDs with a prefix. Useful for ARIA attributes.

```typescript
import { createUniqueId } from '@ngx-signal-forms/toolkit/headless';

const fieldId = createUniqueId('field'); // 'field-1'
const errorId = createUniqueId('error'); // 'error-2'
const anotherField = createUniqueId('field'); // 'field-3'
```

**Note:** Counter is global across all prefixes to guarantee uniqueness

---

## Bundle Import

Import all directives at once:

```typescript
import { NgxHeadlessToolkit } from '@ngx-signal-forms/toolkit/headless';

@Component({
  imports: [NgxHeadlessToolkit],
  template: `...`,
})
export class MyComponent {}
```

---

## Host Directive Composition Patterns

### Pattern 1: Wrap with Exposed Inputs

Expose the directive's inputs on your component:

```typescript
@Component({
  selector: 'my-text-field',
  hostDirectives: [
    {
      directive: NgxHeadlessErrorStateDirective,
      inputs: ['field', 'fieldName', 'strategy'],
    },
    {
      directive: NgxHeadlessCharacterCountDirective,
      inputs: ['field:charField', 'maxLength'], // Alias to avoid conflict
    },
  ],
})
export class MyTextFieldComponent {
  errorState = inject(NgxHeadlessErrorStateDirective);
  charCount = inject(NgxHeadlessCharacterCountDirective);
}
```

### Pattern 2: Internal Configuration

Configure the directive internally, not exposing inputs:

```typescript
@Component({
  selector: 'my-email-field',
  hostDirectives: [NgxHeadlessErrorStateDirective],
})
export class MyEmailFieldComponent implements OnInit {
  errorState = inject(NgxHeadlessErrorStateDirective);

  readonly field = input.required<FieldTree<string>>();

  ngOnInit() {
    // Note: For required inputs, consider component-level inputs
    // that you forward to the directive
  }
}
```

### Pattern 3: Combining Multiple Directives

Compose multiple headless behaviors:

```typescript
@Directive({
  selector: '[formFieldBehavior]',
  hostDirectives: [
    {
      directive: NgxHeadlessErrorStateDirective,
      inputs: ['field', 'fieldName'],
    },
    { directive: NgxHeadlessFieldNameDirective, inputs: ['fieldName'] },
  ],
})
export class FormFieldBehaviorDirective {
  errorState = inject(NgxHeadlessErrorStateDirective);
  fieldNameDir = inject(NgxHeadlessFieldNameDirective);

  // Expose combined state
  readonly showErrors = this.errorState.showErrors;
  readonly errorId = this.fieldNameDir.errorId;
}
```

---

## Comparison: Headless vs Styled

| Feature            | Headless              | Styled (`form-field`) |
| ------------------ | --------------------- | --------------------- |
| Bundle size        | Minimal               | Larger (includes CSS) |
| Styling control    | Full                  | CSS custom properties |
| Setup effort       | Higher                | Lower                 |
| Design consistency | Manual                | Built-in              |
| Use case           | Custom design systems | Quick prototyping     |

**Choose headless when:**

- You have a design system with specific requirements
- You need complete styling control
- You want to minimize bundle size
- You're building a component library

**Choose styled when:**

- You want quick, accessible forms out of the box
- The default styling works for your project
- You prefer convention over configuration

---

## Related Documentation

- **[Toolkit Core](../README.md)** - Error strategies, ARIA, submission helpers
- **[Form Field Components](../form-field/README.md)** - Pre-styled form field wrappers
- **[Theming Guide](../form-field/THEMING.md)** - CSS custom properties for styled components
