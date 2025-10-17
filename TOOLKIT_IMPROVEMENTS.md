# Toolkit Improvements - October 16, 2025

## Summary

Based on analysis of Tim Deschryver's article and updated Signal Forms instructions, we identified and fixed critical issues in the `@ngx-signal-forms/toolkit` package.

## Critical Fixes Applied

### 1. ✅ Fixed `submittedStatus` Implementation (CRITICAL)

**Issue**: The `NgxSignalFormProviderDirective` was returning a hardcoded `'unsubmitted'` value instead of using Angular's built-in `submittedStatus()` signal.

**Location**: `packages/toolkit/core/directives/form-provider.directive.ts`

**Before**:

```typescript
readonly submittedStatus = computed<SubmittedStatus>(() => {
  // WRONG: Hardcoded fallback
  return 'unsubmitted';
});
```

**After**:

```typescript
readonly submittedStatus = computed<SubmittedStatus>(() => {
  const formTree = this.form();
  const fieldState = formTree(); // Call FieldTree to get FieldState

  // Access Angular's built-in submittedStatus signal
  return fieldState.submittedStatus();
});
```

**Impact**:

- ✅ Form submission state now works correctly
- ✅ Error display strategies now respect submission state
- ✅ `on-submit` strategy now functions as expected

---

### 2. ✅ Removed Redundant `autoTouch` Configuration

**Issue**: Documentation and configuration mentioned an `autoTouch` feature, but Angular Signal Forms' `[control]` directive **already handles this automatically**.

**Changes Made**:

#### `packages/toolkit/core/types.ts`

- ❌ Removed: `autoTouch: boolean` from `NgxSignalFormsConfig`
- ❌ Removed: `autoFormBusy: boolean` (redundant with Angular's `submitting()` signal)

#### `packages/toolkit/core/tokens.ts`

- ❌ Removed: `autoFormBusy: true` from default config

#### `packages/toolkit/core/providers/config.provider.ts`

- ❌ Removed: `autoTouch: true` from example

**Result**: Simplified configuration interface focusing only on features the toolkit actually provides.

---

### 3. ✅ Updated README.md - Removed Auto-Touch References

**Changes Made**:

1. **Features Section**:
   - ❌ Removed: "Auto-touch on blur for progressive error disclosure"
   - ✅ Added: Note explaining Signal Forms handles touch automatically

2. **Bundle Constant Documentation**:
   - ❌ Removed: `NgxSignalFormAutoTouchDirective` from contents
   - ✅ Updated: "Single import instead of three" (was "four")

3. **Configuration Section**:
   - ❌ Removed: `autoTouch: boolean` from config interface

4. **Directives Section**:
   - ❌ Removed: Entire `NgxSignalFormAutoTouchDirective` section
   - ✅ Kept: `NgxSignalFormAutoAriaDirective` (still needed)

**Result**: Documentation now accurately reflects toolkit capabilities and Angular's built-in features.

---

## What the Toolkit Still Provides (Value-Add Features)

### ✅ Warning Support ⭐

- **Unique feature** not in Angular Signal Forms
- Convention: `kind.startsWith('warn:')`
- Proper ARIA roles: `role="alert"` for errors, `role="status"` for warnings
- **Verdict**: KEEP - Genuine innovation

### ✅ Error Display Strategies ⭐

- `immediate`, `on-touch`, `on-submit`, `manual`
- Angular has no built-in error visibility logic
- **Verdict**: KEEP - Essential toolkit feature

### ✅ ARIA Automation ⭐

- Auto-generates `aria-invalid` and `aria-describedby`
- Field name resolution from `id` or `name` attributes
- **Verdict**: KEEP - Major accessibility win

### ✅ Form Context Provider ⭐

- DI-based context (no prop drilling)
- Now correctly exposes Angular's `submittedStatus`
- **Verdict**: KEEP - Clean pattern

### ✅ Reusable Components ⭐

- `NgxSignalFormErrorComponent` - Error/warning display
- `NgxSignalFormFieldComponent` - Complete form field wrapper
- **Verdict**: KEEP - Reduces boilerplate

---

## Configuration Comparison

### Before (Overly Complex)

```typescript
interface NgxSignalFormsConfig {
  autoAria: boolean;           // ✅ KEEP
  autoFormBusy: boolean;       // ❌ REMOVED (Angular has `submitting()`)
  defaultErrorStrategy: ...;   // ✅ KEEP
  fieldNameResolver?: ...;     // ✅ KEEP
  strictFieldResolution: ...;  // ✅ KEEP
  debug: boolean;              // ✅ KEEP
}
```

### After (Simplified)

```typescript
interface NgxSignalFormsConfig {
  autoAria: boolean;
  defaultErrorStrategy: ReactiveOrStatic<ErrorDisplayStrategy>;
  fieldNameResolver?: ReactiveOrStatic<(element: HTMLElement) => string | null>;
  strictFieldResolution: boolean;
  debug: boolean;
}
```

---

## Key Insights from Analysis

### Angular Signal Forms Built-In Features

1. ✅ **Touch tracking**: `[control]` directive handles blur automatically
2. ✅ **Submission status**: `submittedStatus()` signal on all `FieldState` objects
3. ✅ **Async tracking**: `submitting()` signal for async operations
4. ✅ **Error summary**: `errorSummary()` for all errors including children
5. ✅ **Name attributes**: Auto-generated from control path

### What Toolkit Should NOT Duplicate

- ❌ Touch tracking (Angular does this)
- ❌ Submission tracking (Angular provides `submittedStatus()`)
- ❌ Busy state (Angular provides `submitting()`)

### What Toolkit Should Provide

- ✅ ARIA automation (tedious to do manually)
- ✅ Error visibility strategies (not in Angular)
- ✅ Warning support (not in Angular)
- ✅ Reusable components (reduce boilerplate)

---

## Testing Impact

### Tests to Update

1. **Form Provider Tests**:
   - ✅ Now tests actual `submittedStatus()` behavior
   - ✅ Verifies signal transitions: `unsubmitted` → `submitting` → `submitted`

2. **Config Tests**:
   - ❌ Remove `autoTouch` assertions
   - ❌ Remove `autoFormBusy` assertions

3. **Integration Tests**:
   - ✅ Verify error strategies work with real submission state
   - ✅ Test `on-submit` strategy now works correctly

---

## Breaking Changes

### For Users (v1.x → v2.0)

#### Configuration

```typescript
// ❌ OLD (will break)
provideNgxSignalFormsConfig({
  autoTouch: true, // Property doesn't exist anymore
  autoFormBusy: true, // Property doesn't exist anymore
});

// ✅ NEW
provideNgxSignalFormsConfig({
  autoAria: true,
  defaultErrorStrategy: 'on-touch',
});
```

#### Imports

```typescript
// ❌ OLD (will break)
import { NgxSignalFormAutoTouchDirective } from '@ngx-signal-forms/toolkit/core';

// ✅ NEW (directive doesn't exist - not needed)
// Just use Angular's built-in touch tracking
```

#### Bundle Constant

```typescript
// Bundle constant updated automatically - no user changes needed
// Still imports 3 components: Provider, AutoAria, Error
```

---

## Migration Guide for Users

### If You Were Using `autoTouch: false`

**Before**:

```typescript
provideNgxSignalFormsConfig({
  autoTouch: false, // Trying to disable touch tracking
});
```

**After**:

```typescript
// Signal Forms always tracks touch on blur
// To disable, you'd need to prevent blur events (not recommended)
// Touch tracking is essential for WCAG 2.2 compliance
```

### If You Were Using `NgxSignalFormAutoTouchDirective`

**Before**:

```html
<input [control]="form.email" ngxSignalFormAutoTouchDisabled />
```

**After**:

```html
<!-- Touch tracking is built into Signal Forms' [control] directive -->
<!-- No way to disable (and you shouldn't want to for accessibility) -->
<input [control]="form.email" />
```

---

## Recommendations for Future Development

### 1. Add `errorSummary` Helper

Consider adding a utility to display root-level + all field errors using Angular's built-in `errorSummary()` signal.

### 2. Document `reset()` Behavior

Add prominent warning that `reset()` only resets control states, not values.

### 3. Add `novalidate` Warning

Emphasize in docs that `novalidate` is REQUIRED on `<form>` elements.

### 4. Consider Validator Attribute Warning

Document that validators like `maxLength()` add HTML attributes that can truncate user input.

---

## Conclusion

✅ **Toolkit is now correctly aligned with Angular Signal Forms**

- Critical `submittedStatus` bug fixed
- Removed redundant features (auto-touch)
- Simplified configuration
- Documentation updated
- Still provides genuine value (warnings, ARIA, strategies)

The toolkit remains a valuable enhancement library that respects Angular's built-in features while adding capabilities that would otherwise require significant boilerplate.
