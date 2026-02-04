# Reusable Wizard Component

A generic wizard component that uses `ng-template` with `NgTemplateOutlet` for lazy step rendering.

## Why Template Projection?

Angular offers two main content projection patterns:

| Pattern                            | Instantiation    | When to Use                  |
| ---------------------------------- | ---------------- | ---------------------------- |
| `ng-content`                       | Always (eager)   | Static content, simple slots |
| `ng-template` + `NgTemplateOutlet` | On demand (lazy) | Conditional/dynamic content  |

From Angular docs:

> You should NOT conditionally include `<ng-content>` with `@if`, `@for`, or `@switch`. Angular always instantiates and creates DOM nodes for content rendered to a `<ng-content>` placeholder, even if that `<ng-content>` placeholder is hidden.

For wizards, we want **lazy instantiation** — only the active step should be created. This:

- Reduces initial load time
- Prevents loading resources (country lists, API calls) for steps not yet visited
- Enables `@defer` within step templates for further code-splitting

## Usage

### Basic Example

```html
<ngx-wizard
  [(currentStep)]="currentStep"
  [completedSteps]="completedSteps()"
  (stepChange)="onStepChange($event)"
  (wizardSubmit)="onSubmit($event)"
>
  <ng-template ngxWizardStep="personal" label="Personal Info">
    <app-personal-info-form />
  </ng-template>

  <ng-template ngxWizardStep="address" label="Address">
    <app-address-form />
  </ng-template>

  <ng-template ngxWizardStep="review" label="Review">
    <app-review />
  </ng-template>
</ngx-wizard>
```

### With @defer for Lazy Loading

Combine template projection with `@defer` for maximum lazy loading:

```html
<ngx-wizard [(currentStep)]="currentStep">
  <ng-template ngxWizardStep="step1" label="Basic Info">
    <!-- Instantiated when step is active -->
    <app-basic-form />
  </ng-template>

  <ng-template ngxWizardStep="step2" label="Advanced">
    <!-- Template instantiation is lazy, PLUS @defer splits the bundle -->
    @defer {
    <app-advanced-form />
    } @placeholder {
    <p>Loading...</p>
    }
  </ng-template>
</ngx-wizard>
```

### Validation with preventDefault

Use the `stepChange` event to validate before navigation:

```typescript
protected async onStepChange(event: WizardNavigationEvent): Promise<void> {
  // Validate current step before allowing navigation forward
  if (event.toIndex > event.fromIndex) {
    const isValid = await this.validateStep(event.fromStep);
    if (!isValid) {
      event.preventDefault();
      this.focusFirstError();
    }
  }
}
```

### Custom Navigation

Disable built-in navigation and provide your own:

```html
<ngx-wizard [(currentStep)]="currentStep" [showNavigation]="false">
  <ng-template ngxWizardStep="step1" label="Step 1">
    <app-step1 (validated)="moveToStep('step2')" />
  </ng-template>
</ngx-wizard>

<div class="my-custom-nav">
  <button (click)="wizard.previous()">Back</button>
  <button (click)="validateAndNext()">Continue</button>
</div>
```

## API Reference

### WizardComponent

#### WizardComponent Inputs

| Input            | Type       | Default      | Description                                |
| ---------------- | ---------- | ------------ | ------------------------------------------ |
| `currentStep`    | `string`   | `''`         | Current active step ID (two-way bindable)  |
| `completedSteps` | `string[]` | `[]`         | Array of completed step IDs                |
| `showNavigation` | `boolean`  | `true`       | Show built-in navigation buttons           |
| `previousLabel`  | `string`   | `'Previous'` | Previous button text                       |
| `nextLabel`      | `string`   | `'Next'`     | Next button text                           |
| `submitLabel`    | `string`   | `'Submit'`   | Submit button text                         |
| `allowStepClick` | `boolean`  | `true`       | Allow clicking step indicators to navigate |

#### WizardComponent Outputs

| Output         | Type                    | Description                                                    |
| -------------- | ----------------------- | -------------------------------------------------------------- |
| `stepChange`   | `WizardNavigationEvent` | Emitted before step change. Call `preventDefault()` to cancel. |
| `wizardSubmit` | `WizardSubmitEvent`     | Emitted when submit is clicked on last step                    |

#### WizardComponent Methods

| Method                              | Description                            |
| ----------------------------------- | -------------------------------------- |
| `goToStep(stepId: string)`          | Navigate to a specific step            |
| `next()`                            | Navigate to the next step              |
| `previous()`                        | Navigate to the previous step          |
| `submit()`                          | Trigger the submit event               |
| `isStepCompleted(stepId: string)`   | Check if a step is completed           |
| `canNavigateToStep(stepId: string)` | Check if navigation to step is allowed |

### WizardStepDirective

Applied to `<ng-template>` elements to define wizard steps.

#### WizardStepDirective Inputs

| Input           | Type      | Required | Description                            |
| --------------- | --------- | -------- | -------------------------------------- |
| `ngxWizardStep` | `string`  | Yes      | Unique step identifier                 |
| `label`         | `string`  | Yes      | Display label for step indicator       |
| `optional`      | `boolean` | No       | Whether the step can be skipped        |
| `icon`          | `string`  | No       | Icon to display instead of step number |

### WizardStepContext

Context available in step templates via `let-` syntax:

```html
<ng-template
  ngxWizardStep="step1"
  label="Step 1"
  let-stepNum
  let-isActive="isActive"
>
  <h2>Step {{ stepNum }}</h2>
  <p>Active: {{ isActive }}</p>
</ng-template>
```

| Property      | Type      | Description                            |
| ------------- | --------- | -------------------------------------- |
| `$implicit`   | `number`  | Zero-based step index                  |
| `stepNumber`  | `number`  | One-based step number                  |
| `isActive`    | `boolean` | Whether this step is currently active  |
| `isCompleted` | `boolean` | Whether this step is completed         |
| `canNavigate` | `boolean` | Whether user can navigate to this step |

## Styling

The component uses CSS custom properties for theming:

```css
:root {
  --wizard-color-primary: #3b82f6;
  --wizard-color-success: #22c55e;
}
```

Or override the component styles entirely using `::ng-deep` or by providing custom CSS classes.

## Comparison with @defer Alone

The advanced-wizard demo uses `@defer` directly in a `@switch`:

```html
@switch (store.currentStep()) { @case ('step1') { @defer { <step1 /> } } }
```

This works but:

- Step definitions are inline (less reusable)
- Navigation logic is in the parent component
- No built-in progress indicator

The reusable wizard component provides:

- Declarative step definitions via directives
- Built-in progress and navigation
- `stepChange` event for validation hooks
- Consistent patterns across features
