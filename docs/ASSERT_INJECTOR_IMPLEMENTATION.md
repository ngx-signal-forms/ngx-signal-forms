# Assert Injector & Custom Inject Functions Implementation

## Summary

Successfully implemented the `assertInjector` pattern from ngxtension, along with three Custom Inject Functions (CIF) to improve the flexibility and testability of the ngx-signal-forms toolkit.

## What Was Implemented

### 1. Core Utility: `assertInjector`

**File**: `packages/toolkit/core/utilities/assert-injector.ts`

- Enables functions to work both inside and outside Angular injection context
- Supports two usage patterns:
  1. Return an Injector for manual use with `runInInjectionContext`
  2. Execute a runner function with guaranteed Injector access

- Inspired by and references ngxtension's implementation
- **Tests**: 17 tests (including ngxtension's original test patterns)

**Key Features**:

- Type-safe overloads for different usage patterns
- Proper error messages when used incorrectly
- Compatible with Angular 20+ DI system

### 2. Custom Inject Functions (CIF)

#### `injectFormConfig(injector?: Injector)`

**File**: `packages/toolkit/core/utilities/inject-form-config.ts`

- Retrieves global form configuration
- Returns default config when none provided
- **Tests**: 4 tests covering all scenarios

#### `injectFormContext(injector?: Injector)`

**File**: `packages/toolkit/core/utilities/inject-form-context.ts`

- Retrieves form context from `ngxSignalFormDirective`
- Provides access to form submission state and error strategy
- Throws helpful error when provider is missing
- **Tests**: 4 tests covering all scenarios

#### `injectFieldControl(element, injector?: Injector)`

**File**: `packages/toolkit/core/utilities/inject-field-control.ts`

- Resolves and returns a specific field control from the form
- Supports nested field paths (e.g., "address.city")
- Works with both `HTMLElement` and `ElementRef`
- **Tests**: 8 tests covering all scenarios

### 3. Refactored Existing Code

#### `field-resolution.ts`

**Changes**:

- Removed `config` parameter
- Added `injector?: Injector` parameter
- Now uses `injectFormConfig(injector)` internally
- More flexible and testable

#### `auto-aria.directive.ts`

**Changes**:

- Removed direct `inject(NGX_SIGNAL_FORMS_CONFIG)`
- Now uses `injectFormConfig()` for config
- Uses `inject(Injector)` to pass to utilities
- Cleaner dependency injection

#### Tests Updated

All tests updated to use the new injector-based API:

- `field-resolution.spec.ts` - 13 tests (all passing)
- Added new test for default config behavior

## Test Results

**Total Tests**: 41
**Passing**: 41 ✅
**Failing**: 0

### Test Coverage by File

| File                           | Tests | Status      |
| ------------------------------ | ----- | ----------- |
| `assert-injector.spec.ts`      | 17    | ✅ All pass |
| `field-resolution.spec.ts`     | 13    | ✅ All pass |
| `inject-form-config.spec.ts`   | 4     | ✅ All pass |
| `inject-form-context.spec.ts`  | 4     | ✅ All pass |
| `inject-field-control.spec.ts` | 8     | ✅ All pass |
| `config.provider.spec.ts`      | 3     | ✅ All pass |

## Benefits

1. **Testability**: All utilities can now be tested without `TestBed.runInInjectionContext`
2. **Flexibility**: Functions work in any context when an injector is provided
3. **Developer Experience**: Clear error messages and TypeScript type safety
4. **Consistency**: Follows ngxtension's proven patterns
5. **Maintainability**: Cleaner code with less coupling to Angular's DI

## Attribution

This implementation is inspired by and references [ngxtension's assertInjector utility](https://github.com/ngxtension/ngxtension-platform), following their Custom Inject Function (CIF) pattern.

## Next Steps

The assertInjector pattern and CIFs are now available for:

- [ ] Phase 1.6: Use in directive tests
- [ ] Phase 2.1: Error display strategies implementation
- [ ] Phase 2.2: Error message component
- [ ] Phase 3.1: Form field component

All future utilities and directives can leverage these patterns for improved testability and flexibility.
