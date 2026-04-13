# Custom Controls integration

## Overview

Angular Signal Forms changes how we handle custom inputs. We no longer use `ControlValueAccessor`. Instead, we rely on standard **Signals** and **Inputs/Outputs** (or Models).

This demo shows how to build a custom "Star Rating" component that integrates seamlessly with `@ngx-signal-forms/toolkit`.

## Feature Spotlight: `FormValueControl` Interface

To make a custom component play nicely with the toolkit's auto-ARIA and wrapper features, it typically implements a lightweight contract (often just exposing the right signals).

### No More `writeValue` / `registerOnChange`

The legacy forms API required complex boilerplate. With Signal Forms, your custom control simply needs:

1. An Input for the value (or Model).
2. A way to notify changes (updating the model).
3. Optional: handling of "blur" for touched state.

```typescript
// Simplified Concept
@Component(...)
export class RatingControl {
  // The form field signal passed from parent
  readonly formField = input.required<FormField<number>>();

  // Update value directly through the signal API
  setRating(val: number) {
    this.formField().controls.setValue(val);
  }
}
```

## Feature Spotlight: Auto-Discovery

When wrapped in `ngx-signal-form-field-wrapper`, the toolkit attempts to automatically link labels and error messages to your custom control, provided it uses standard identifiers or `[formField]` bindings correctly.

## Feature Spotlight: Explicit control semantics

This demo now shows three distinct semantics paths side by side:

1. a native checkbox switch that declares `ngxSignalFormControl="switch"`
2. a standard checkbox that opts into toolkit checkbox handling with `ngxSignalFormControl="checkbox"`
3. a slider-style custom control that declares `ngxSignalFormControl="slider"` and inherits component-scoped slider presets for `layout: 'custom'` and `ariaMode: 'manual'`

That combination demonstrates both one-off explicit semantics and provider-scoped defaults without changing Angular Signal Forms' underlying control contracts.

## Key Files

- [custom-controls.form.ts](custom-controls.form.ts): The consuming form.
- `apps/demo/src/app/shared/controls/rating-control`: The implementation of the reusable component.

## How to Test

1. **Interaction**: Click the stars to set a value. Watch the debug panel update instantly.
2. **Keyboard**: Tab into the rating control. Use arrow keys. Notice the "touched" state updates on blur/exit.
3. **Validation**: Clear the rating (if allowed). See the standard `NgxFormFieldError` render below the custom component.
4. **Checkbox opt-in**: Blur the public-review checkbox without checking it and verify the wrapper/error linkage comes from explicit checkbox semantics.
5. **Manual ARIA slider**: Blur the accessibility-audit slider empty and verify it keeps its own `aria-describedby` chain while still rendering wrapper errors.
