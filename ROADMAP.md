# ngx-signal-forms Toolkit Enhancement Roadmap

> Enhancement plan based on Angular Signal Forms 21.0.0-rc.0 analysis
>
> **Last Updated:** November 1, 2025

## Overview

This roadmap outlines improvements to `@ngx-signal-forms/toolkit` to enhance developer experience, expand UX capabilities, and maintain alignment with Angular Signal Forms best practices.

**Current Status:**

- ✅ Core functionality complete (ARIA, error strategies, warnings, submission tracking)
- ✅ No duplication of Angular Signal Forms features
- ✅ WCAG 2.2 Level AA compliant
- ✅ Type-safe with full TypeScript inference

---

## High Priority (Should Implement Soon)

### 1. Field-Level Error Strategy Override ✅ COMPLETED

**Status:** ✅ Completed (November 1, 2025)
**Effort:** Small
**Files:** `packages/toolkit/core/components/form-error.component.ts`, `packages/toolkit/core/types.ts`

Allow per-field error strategy override for different UX requirements.

```html
<!-- Password shows errors immediately -->
<ngx-signal-form-error
  [formField]="form.password"
  fieldName="password"
  strategy="immediate"
/>

<!-- Other fields use form-level strategy (on-touch) -->
<ngx-signal-form-error [formField]="form.email" fieldName="email" />
```

**Implementation:**

- ✅ Added `'inherit'` to `ErrorDisplayStrategy` type
- ✅ Updated strategy resolution logic with 3-tier priority
- ✅ Enhanced documentation with field-level override examples
- ✅ All tests passing (19/19)

**Benefits:**

- Different fields have different validation UX needs
- No need for separate forms just for strategy differences
- Maintains backward compatibility (defaults to 'inherit')

---

### 2. Auto-Focus on First Invalid Field ✅ COMPLETED

**Status:** ✅ Completed (November 1, 2025)
**Effort:** Small
**Files:** `packages/toolkit/core/utilities/focus-first-invalid.ts`

Utility to focus first invalid field after failed submission.

```typescript
import { focusFirstInvalid } from '@ngx-signal-forms/toolkit';

protected save(): void {
  if (this.form().invalid()) {
    focusFirstInvalid(this.form);
  }
}
```

**Implementation:**

- ✅ Created `focusFirstInvalid()` utility function
- ✅ Recursive FieldTree traversal with depth-first search
- ✅ DOM focus targeting via `aria-invalid="true"` attribute
- ✅ Exported in public API

**Benefits:**

- Common UX pattern
- Improves accessibility (keyboard navigation)
- Reduces user frustration

---

### 3. Form Submission Helper Utilities ✅ COMPLETED

**Status:** ✅ Completed (November 1, 2025)
**Effort:** Small
**Files:** `packages/toolkit/core/utilities/submission-helpers.ts`

Computed signals for common submission states. Uses Angular 21.2's declarative `submission` config.

```typescript
import { hasSubmitted } from '@ngx-signal-forms/toolkit';

protected readonly hasSubmitted = hasSubmitted(this.form);
```

```html
<button type="submit" [disabled]="form().invalid() || form().submitting()">
  @if (form().submitting()) {
  <span>Saving...</span>
  } @else {
  <span>Submit</span>
  }
</button>
```

**Implementation:**

- ✅ Created `hasSubmitted()` - tracks submission completion via `submitting()` transitions
- ✅ Removed `canSubmit()` and `isSubmitting()` — use `form().valid()` and `form().submitting()` directly
- ✅ Type-safe with `FieldTree` from Angular Signal Forms
- ✅ Exported in public API

**Benefits:**

- Reduces template boilerplate
- Consistent naming across apps
- Type-safe computed signals

---

### 4. Character Count Auto-Detection ✅ COMPLETED

**Status:** ✅ Completed (November 1, 2025)
**Effort:** Small
**Files:** `packages/toolkit/form-field/form-field-character-count.component.ts`

Auto-derive `maxLength` from field validation instead of manual input.

**Before:**

```typescript
// Validation in schema
maxLength(path.bio, 500);
```

```html
<!-- Must repeat maxLength -->
<ngx-form-field-character-count [formField]="form.bio" [maxLength]="500" />
```

**After:**

```html
<!-- Auto-detects maxLength from validation -->
<ngx-form-field-character-count [formField]="form.bio" />

<!-- Can still override if needed -->
<ngx-form-field-character-count [formField]="form.bio" [maxLength]="300" />
```

**Implementation:**

- ✅ Made `maxLength` input optional with default `undefined`
- ✅ Created `#resolvedMaxLength` computed signal with 3-tier priority:
  1. Manual `maxLength` input (if provided)
  2. Auto-detected from `field().maxLength()` signal
  3. Fallback to 0 (no limit)
- ✅ Updated character count text to handle no-limit case
- ✅ Updated limit state logic for proper color progression
- ✅ Enhanced JSDoc documentation with examples

**Benefits:**

- DRY principle (single source of truth)
- Prevents desync between validation and display
- Backward compatible (explicit input overrides)
- Shows "42" instead of "42/0" when no limit detected

---

### 5. Error Message Fallback Registry (Optional Override) ✅ COMPLETED

**Status:** ✅ Completed (November 2, 2025)
**Effort:** Medium
**Files:** `packages/toolkit/core/providers/error-messages.provider.ts`, `packages/toolkit/core/components/form-error.component.ts`

**Philosophy:** Zero-config by default. Standard Schema libraries (Zod, Valibot, ArkType) already include error messages in their validation results. This registry provides **optional overrides** for centralization and i18n.

**Implementation:**

- ✅ Created `NGX_ERROR_MESSAGES` injection token with empty default
- ✅ Created `ErrorMessageRegistry` interface supporting string literals and factory functions
- ✅ Created `provideErrorMessages()` function accepting static config or dynamic factory
- ✅ Integrated 3-tier message priority in `NgxSignalFormErrorComponent`:
  1. Validator message (`error.message` property) - Highest priority
  2. Registry override (from provider) - Fallback
  3. Default toolkit message - Final fallback
- ✅ Added built-in fallback messages for Angular validators (required, email, minLength, etc.)
- ✅ Comprehensive JSDoc with 4 i18n integration patterns
- ✅ Demo example showcasing all 3 tiers
- ✅ Tests: 16 tests across 5 suites, all passing

**Benefits:**

- Zero boilerplate - Standard Schema messages work out of the box
- Opt-in override - Configure only when needed for centralization
- Framework agnostic - Works with Zod, Valibot, ArkType, or any Standard Schema library
- Standard i18n - Supports JSON files, ngx-translate, @angular/localize, TypeScript files
- No vendor lock-in - Don't need to map every Zod/Valibot error kind
- Backward compatible - Angular Signal Forms built-in validators get overrides

---

## Medium Priority (Nice to Have)

### 6. Additional Error Strategies

**Status:** ⚪ Not started
**Effort:** Medium
**Files:** `packages/toolkit/core/utilities/error-strategies.ts`, `packages/toolkit/core/types.ts`

Add more UX-focused error display strategies.

**New Strategies:**

- `on-dirty` - Show errors after field value changes (first keystroke)
- `after-delay` - Show errors N milliseconds after blur (default: 500ms)
- `progressive` - Start with warnings, escalate to errors on submit

```typescript
type ErrorDisplayStrategy =
  | 'immediate'
  | 'on-touch'
  | 'on-submit'
  | 'on-dirty'
  | 'after-delay'
  | 'progressive'
  | 'manual';
```

**Use Cases:**

- `on-dirty` - Real-time validation for passwords
- `after-delay` - Soft UX, wait for user to finish typing
- `progressive` - Password strength (warning → error)

---

### 7. Form Field Size Variants

**Status:** ⚪ Not started
**Effort:** Small
**Files:** `packages/toolkit/form-field/form-field-wrapper.component.ts`

Add size variants for visual hierarchy and mobile optimization.

```html
<ngx-signal-form-field-wrapper [formField]="form.email" size="small">
  <ngx-signal-form-field-wrapper [formField]="form.email" size="medium">
    <!-- default -->
    <ngx-signal-form-field-wrapper
      [formField]="form.email"
      size="large"
    ></ngx-signal-form-field-wrapper></ngx-signal-form-field-wrapper
></ngx-signal-form-field-wrapper>
```

**Implementation:**

- CSS custom property scaling (font-size, padding, min-height)
- Host attribute `[attr.data-size]="size()"`
- Maintain WCAG contrast ratios at all sizes

---

### 8. Prefix/Suffix Projection Slots ✅ COMPLETED

**Status:** ✅ Completed (November 3, 2025)
**Effort:** Medium
**Files:** `packages/toolkit/form-field/form-field-wrapper.component.ts`, `.scss`

Support icons and text before/after inputs (Material pattern).

```html
<ngx-signal-form-field-wrapper [formField]="form.search">
  <span prefix>🔍</span>
  <input [formField]="form.search" />
  <button suffix type="button">Clear</button>
</ngx-signal-form-field-wrapper>
```

**Implementation:**

- ✅ Add `<ng-content select="[prefix]">` and `[suffix]` slots
- ✅ Position with flexbox
- ✅ Ensure proper focus states
- ✅ Accessibility: prefix/suffix should not be focusable unless interactive
- ✅ Support for both standard and outlined layouts
- ✅ CSS custom properties for theming (gap, color)
- ✅ Interactive elements (buttons) support with proper focus indicators
- ✅ Empty slots hidden automatically via CSS :empty selector

**Benefits:**

- Modern input patterns (search with icon, password with show/hide, currency inputs)
- Flexible and composable (supports any content - icons, text, buttons)
- Accessible by default (decorative vs interactive handling)
- Consistent with Material Design and other design systems

---

### 9. Field Name from Field Binding Path

**Status:** ⚪ Not started
**Effort:** Large
**Files:** `packages/toolkit/core/utilities/field-resolution.ts`

Auto-derive `fieldName` from `[formField]` binding expression.

**Challenge:**

- Template expressions not accessible at runtime
- Would require directive to capture expression string
- AST analysis needed (complex)

**Alternative Approach:**

- Create directive that reads `[formField]="form.email"` and sets `fieldName="email"`
- Use DI to communicate with error component

**Decision:** Defer until clearer use case emerges

---

### 10. i18n Integration

**Status:** ⚪ Not started
**Effort:** Medium
**Dependencies:** Requires #5 (Centralized Error Messages)

Support for `@angular/localize` and third-party i18n libraries.

```typescript
provideErrorMessages({
  required: $localize`This field is required`,
  email: $localize`Please enter a valid email address`,
});
```

**Implementation:**

- Accept i18n-wrapped strings in error message registry
- Support runtime locale switching
- Documentation for ngx-translate, Transloco integration

---

## Low Priority (Future Considerations)

### 11. Built-in Input Components

**Status:** ⚪ Not started
**Effort:** Large
**Scope:** TBD (separate package?)

Advanced input components for common patterns.

**Potential Components:**

- `<ngx-date-picker>` - Native HTML5 date input with fallback
- `<ngx-file-upload>` - Drag-drop file upload with validation
- `<ngx-rich-text>` - Rich text editor integration

**Decision Needed:**

- Keep in toolkit or create `@ngx-signal-forms/components`?
- Third-party integration vs custom implementation?
- Maintenance burden vs value proposition

---

### 12. Filled & Underline Layouts

**Status:** ⚪ Not started
**Effort:** Medium

Material Design filled and underline-only layouts.

```html
<ngx-signal-form-field-wrapper [formField]="form.email" filled>
  <ngx-signal-form-field-wrapper
    [formField]="form.email"
    underline
  ></ngx-signal-form-field-wrapper
></ngx-signal-form-field-wrapper>
```

**Implementation:**

- New directives similar to `NgxFloatingLabelDirective`
- CSS architecture for each layout
- Maintain WCAG compliance

---

### 13. Form Field Groups

**Status:** ⚪ Not started
**Effort:** Medium

Group related fields with shared layout/styling.

```html
<ngx-signal-form-field-wrapper-group legend="Shipping Address">
  <ngx-signal-form-field-wrapper [formField]="form.street"
    >...</ngx-signal-form-field-wrapper
  >
  <ngx-signal-form-field-wrapper [formField]="form.city"
    >...</ngx-signal-form-field-wrapper
  >
</ngx-signal-form-field-wrapper-group>
```

---

### 14. Progressive Enhancement Strategy

**Status:** ⚪ Not started
**Effort:** Medium

Start with warnings, escalate to errors on submit.

**Use Case:**

- Password strength: "weak" warning → "too weak" error on submit
- Optional optimizations: suggestions → requirements

---

### 15. Stricter Type Safety

**Status:** ⚪ Not started
**Effort:** Medium to Large
**Breaking:** Potentially

Type system improvements:

- Nested path type checking for `fieldName`
- Error kind discriminated unions
- Strategy literal type inference
- Assertion functions for DI context

**Decision Needed:**

- Breaking changes acceptable for v2.0?
- Or wait for v3.0 major version?

---

## Completed Items

### ✅ Prefix/Suffix Projection Slots (November 3, 2025)

Material Design-inspired prefix/suffix slots with flexbox layout, automatic empty slot hiding, and full theming support.

### ✅ Field-Level Error Strategy Override (November 1, 2025)

Per-field strategy override with 'inherit' option for flexible error UX.

### ✅ Auto-Focus on First Invalid Field (November 1, 2025)

`focusFirstInvalid()` utility for accessibility and UX improvements.

### ✅ Form Submission Helper Utilities (November 1, 2025)

`hasSubmitted()` signal for tracking submission completion. Uses Angular 21.2's native `submitting()` and declarative submission config for validity/submitting checks.

### ✅ Character Count Auto-Detection (November 1, 2025)

Auto-derives `maxLength` from field validation with optional manual override.

### ✅ Error Message Fallback Registry (November 2, 2025)

3-tier priority system with zero-config by default, optional centralized overrides for i18n.

### ✅ WCAG 2.2 Level AA Compliance

Automatic ARIA attributes, proper roles, color contrast.

### ✅ Warning Support (Convention-Based)

`kind: 'warn:...'` prefix for non-blocking validation.

### ✅ Error Display Strategies

`immediate`, `on-touch`, `on-submit`, `manual`, `inherit`.

### ✅ Automatic Form Context Tracking

`ngxSignalForm` directive with submission state.

### ✅ Outlined Form Field Layout

Material Design outlined inputs with floating labels.

---

## Questions & Decisions

### Open Questions

1. **Error message registry scope**
   - Global provider only? ✅ Likely sufficient
   - Component-level overrides via DI hierarchy? 🤔 Future consideration

2. **Built-in input components**
   - Toolkit core? ❌ Too heavy
   - Separate package? 🤔 Needs research
   - Out of scope? ✅ Likely best

3. **Breaking changes tolerance**
   - Type safety improvements may break existing code
   - Acceptable for v2.0? 🤔 Community feedback needed
   - Require v3.0? ⏳ TBD

4. **Form field layout priority**
   - Material Design variants (filled, underline)? ✅ High demand
   - Other design systems (Bootstrap, Ant)? 🤔 Lower priority
   - Custom layout API? ⏳ Future

### Design Decisions

- ✅ No duplication of Angular Signal Forms core features
- ✅ Non-intrusive enhancement only
- ✅ Backward compatibility for all non-breaking features
- ✅ CSS custom properties for all theming
- ✅ Type-safe APIs with generics

---

## Version Planning

### v1.x (Current - Stable)

- All completed items above
- Bug fixes and documentation

### v2.0 (Next - Q1 2025?)

- ✅ High priority items (#1-5)
- ✅ Medium priority items (#6-8)
- 🤔 Low priority items (TBD based on feedback)

### v3.0 (Future - Q3 2025?)

- Breaking type safety improvements (#15)
- Built-in components (if separate package not created)
- Advanced layout system

---

## Contributing

To work on an item:

1. Comment on related GitHub issue (or create one)
2. Update status in this file to 🟡 IN PROGRESS
3. Create feature branch
4. Implement with tests
5. Update documentation
6. Submit PR with reference to roadmap item

---

## Notes

- This roadmap is living document - priorities may shift
- Community feedback welcome via GitHub issues
- Breaking changes require major version bump
- All features must maintain WCAG 2.2 Level AA compliance
