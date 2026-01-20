# Toolkit Critical Analysis & Improvement Plan

## Executive Summary

**Overall verdict:** The toolkit adds **genuine value** on top of Angular Signal Forms, but has **semantic bugs** and **unnecessary API complexity** that need attention.

**What Angular Signal Forms provides natively:**

- `form()`, `FieldTree`, `FieldState`, validators
- `touched()`, `dirty()`, `valid()`, `invalid()`, `submitting()`, `errors()`
- `submit()` helper that calls `markAllAsTouched()` before callback
- NO: `submittedStatus()`, NO: automatic ARIA, NO: error display strategies

**What the toolkit adds (legitimately):**

- ✅ Auto ARIA (`aria-invalid`, `aria-describedby`) — **HIGH VALUE**
- ✅ Error display strategies (`immediate`, `on-touch`, `on-submit`) — **MEDIUM-HIGH VALUE**
- ✅ CSS class alignment with error strategy — **HIGH VALUE**
- ✅ Form field wrapper component — **MEDIUM VALUE**
- ✅ `focusFirstInvalid()` — **HIGH VALUE**

---

## Part 1: Validated Strengths ✅

### 1.1 Auto ARIA Directive — HIGH VALUE

**File:** `core/directives/auto-aria.directive.ts`

**What it does:**

- Auto-adds `aria-invalid` respecting error display strategy
- Auto-links `aria-describedby` to error/warning IDs
- Preserves existing `aria-describedby` values

**Why it matters:**
Standard Angular Signal Forms pattern (from Context7 docs):

```html
@if(userForm.name().touched() || userForm.name().dirty()){ @for (item of
userForm.name().errors(); track item.kind) {
<p class="text-red-500">{{ item.message }}</p>
} }
```

This has **ZERO accessibility** — no ARIA linkage at all.

**Verdict:** ✅ KEEP — Core accessibility value, reduces 3+ lines per field.

### 1.2 Error Display Strategies — MEDIUM-HIGH VALUE

**Files:** `core/utilities/error-strategies.ts`, `core/utilities/show-errors.ts`

**What it does:**

- Centralizes "when to show errors" logic
- `'on-touch'` = show after blur OR submit (WCAG recommended)
- `'on-submit'` = show only after form submission
- `'immediate'` = real-time validation feedback

**Why it matters:**
The standard pattern `touched() || dirty()` is inconsistent:

- `dirty()` = user changed value (even if still typing)
- Some apps want errors only after submit, not mid-typing

**Verdict:** ✅ KEEP — But simplify API surface (see Part 2).

### 1.3 Status Class Alignment — HIGH VALUE

**File:** `core/utilities/status-classes.ts`

**What it does:**
Angular 21.1's `NG_STATUS_CLASSES` applies `ng-invalid` **immediately**.
Toolkit's default is `'on-touch'`. This creates UX mismatch:

- Red border appears while typing (from `ng-invalid`)
- Error message appears after blur (from `'on-touch'`)

`ngxStatusClasses()` aligns both to same strategy.

**Verdict:** ✅ KEEP — Solves real problem.

### 1.4 Focus First Invalid — HIGH VALUE

**File:** `core/utilities/focus-first-invalid.ts`

**What it does:**

- Uses Angular's `errorSummary()` + `focusBoundControl()`
- Single function call for submit failure UX

**Verdict:** ✅ KEEP — Clean wrapper, common pattern.

### 1.5 Form Field Wrapper — MEDIUM VALUE

**File:** `form-field/form-field.component.ts`

**What it does:**

- Consistent layout (label, input, hints, errors)
- Auto error display via embedded `<ngx-signal-form-error>`
- Optional Material Design outlined layout

**Verdict:** ✅ KEEP — Good turnkey solution.

---

## Part 2: Critical Issues to Address 🔴

### Issue #1: SubmittedStatus Derivation is WRONG — CRITICAL ⚠️

**Files:**

- `core/directives/ngx-signal-form.directive.ts:130-145`
- `core/utilities/submission-helpers.ts` (`deriveSubmittedStatus`)

**Current logic:**

```typescript
if (fieldState.touched()) {
  return 'submitted';
}
```

**Problem:**

- `touched()` becomes true **on blur**, not on submit
- User blurs email field → `submittedStatus` becomes `'submitted'` (WRONG!)
- `'on-submit'` strategy breaks: shows errors after blur instead of submit

**Evidence from Context7:**
The standard pattern uses `touched() || dirty()` for field-level visibility.
Angular's `submit()` does call `markAllAsTouched()`, but individual blurs also set `touched()`.

**Impact:** `'on-submit'` strategy is fundamentally broken.

**Fix Options:**

1. **Track submitting() transitions via effect (RECOMMENDED):**

   ```typescript
   export class NgxSignalFormDirective {
     readonly #hasSubmittedAtLeastOnce = signal(false);
     readonly #prevSubmitting = signal(false);

     constructor() {
       effect(() => {
         const form = this.form();
         if (!form) return;

         const wasSubmitting = this.#prevSubmitting();
         const isSubmitting = form().submitting();

         if (wasSubmitting && !isSubmitting) {
           // Submission completed (success or failure)
           this.#hasSubmittedAtLeastOnce.set(true);
         }

         this.#prevSubmitting.set(isSubmitting);
       });
     }

     readonly submittedStatus = computed<SubmittedStatus>(() => {
       if (this.form()?.().submitting()) return 'submitting';
       if (this.#hasSubmittedAtLeastOnce()) return 'submitted';
       return 'unsubmitted';
     });
   }
   ```

   **Why this is best:**
   - Reactive — observes state changes, no event handler conflicts
   - Works regardless of how the form is submitted
   - No race conditions with user's `(submit)="save($event)"` handler

2. ~~**Track via host `(submit)` binding:**~~ **REJECTED**

   ```typescript
   host: { '(submit)': 'onSubmit()' }
   ```

   **Problem:** Angular docs don't specify ordering when both directive and template bind to same event. Creates potential race condition with user's `(submit)` handler.

3. **Remove hasSubmitted entirely:** Force users to track submission themselves

**Recommendation:** Option 1 — effect-based `submitting()` transition tracking.

### Issue #2: Strategy Logic is Duplicated — MEDIUM

**Problem locations:**

- `error-strategies.ts:computeShowErrors()` — reactive version
- `error-strategies.ts:shouldShowErrors()` — imperative version
- `auto-aria.directive.ts:75-100` — **inline switch statement**

**Current state:**
Auto ARIA has its own strategy switch:

```typescript
switch (strategy) {
  case 'immediate':
    return true;
  case 'on-touch':
    return isTouched || hasSubmitted;
  case 'on-submit':
    return hasSubmitted;
  case 'manual':
    return false;
}
```

This is duplicated from `shouldShowErrors()`.

**Fix:** Auto ARIA should call `shouldShowErrors()` directly.

### Issue #3: Logic Inconsistency Between Reactive/Imperative — MEDIUM

**Problem:**
In `computeShowErrors()` (reactive):

```typescript
case 'on-touch':
  result = isInvalid && isTouched;  // ❌ No hasSubmitted check
```

In `shouldShowErrors()` (imperative):

```typescript
case 'on-touch':
  return isInvalid && (isTouched || hasSubmitted);  // ✅ Has hasSubmitted check
```

**Impact:** Different behavior depending on which function is used.

**Fix:** Unify logic — `'on-touch'` should consistently be `isTouched` only (since `submit()` marks as touched anyway).

### Issue #4: Field Name Resolution Can Desync — MEDIUM

**Files:**

- `core/utilities/field-resolution.ts` — 4-tier resolution
- `form-field/form-field.component.ts` — derives from input's `id`
- `core/directives/auto-aria.directive.ts` — uses `resolveFieldName()`

**Problem scenario:**

```html
<ngx-signal-form-field [formField]="form.email" fieldName="user-email">
  <input id="email" [formField]="form.email" />
</ngx-signal-form-field>
```

- Error component generates ID: `user-email-error`
- Auto ARIA links to: `email-error` (from input's `id`)
- **Broken ARIA linkage!**

**Fix options:**

1. Remove `fieldName` input — always derive from `id`
2. **FormFieldComponent sets `data-signal-field` on found input (RECOMMENDED):**
   ```typescript
   // In FormFieldComponent.ngAfterContentInit()
   const input = this.inputElement();
   if (input && this.#resolvedFieldName()) {
     input.setAttribute('data-signal-field', this.#resolvedFieldName());
   }
   ```
   This ensures Auto ARIA uses the same field name as the error component.
3. Auto ARIA prefers parent's resolved name when available via context

### Issue #5: SSR-Unsafe Debug Code — LOW

**File:** `core/utilities/error-strategies.ts:79-85`

```typescript
if ((window as { __DEBUG_SHOW_ERRORS__?: boolean }).__DEBUG_SHOW_ERRORS__) {
```

**Fix:** Guard with `typeof window !== 'undefined'`.

### Issue #6: Radio/Checkbox Excluded — LOW

**File:** `core/directives/auto-aria.directive.ts:40-44`

Selector excludes `[type="radio"]` and `[type="checkbox"]`.

**Impact:** Low — edge case. Document limitation or add dedicated directive.

---

## Part 3: Over-Engineering / Simplification 🔄

### 3.1 API Surface Too Large

**Current exports from `public_api.ts`:**

| Category         | Exports                                                                                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| Error visibility | `computeShowErrors`, `showErrors`, `createShowErrorsSignal`, `combineShowErrors`, `shouldShowErrors` (5!) |
| Submission       | `canSubmit`, `isSubmitting`, `hasSubmitted` (3)                                                           |
| Field resolution | `resolveFieldName`, `generateErrorId`, `generateWarningId` (3)                                            |
| Utilities        | `unwrapValue`, `injectFormContext`, `injectFormConfig`, `focusFirstInvalid` (4)                           |
| Warnings         | `warningError`, `isWarningError`, `isBlockingError` (3)                                                   |
| Config           | `provideNgxSignalFormsConfig`, `provideErrorMessages`, `ngxStatusClasses`, `provideNgxStatusClasses` (4)  |

**Problem:** 5 functions for error visibility is excessive.

**Recommendation:**
| Keep | Reason |
|------|--------|
| `showErrors()` | Primary reactive API |
| `shouldShowErrors()` | Imperative version |
| `combineShowErrors()` | Useful combiner |

| Remove/Internalize         | Reason                        |
| -------------------------- | ----------------------------- |
| `createShowErrorsSignal()` | Redundant with `showErrors()` |
| `computeShowErrors()`      | Implementation detail         |
| `unwrapValue()`            | Implementation detail         |

### 3.2 Submission Helpers — Consider Consolidating

**Current:** 3 separate functions (`canSubmit`, `isSubmitting`, `hasSubmitted`)

**Assessment:** These are trivial one-liners BUT:

- Provide consistent naming
- Reduce template boilerplate
- Self-documenting

**Alternative — Single `submissionState()` helper:**

```typescript
interface SubmissionState {
  canSubmit: boolean; // valid && !submitting
  isSubmitting: boolean; // submitting()
  hasSubmitted: boolean; // from tracked submit attempts
  status: SubmittedStatus;
}

function submissionState(form: FieldTree<unknown>): Signal<SubmissionState>;
```

**Trade-offs:**

- Single import vs 3 imports
- Object destructuring vs separate signals
- Slightly more overhead (computes all properties)

**Verdict:** KEEP separate for now — evaluate consolidation based on usage patterns.

### 3.3 Warnings Convention — Mark as Extension

**Current:** Errors with `kind.startsWith('warn:')` are non-blocking.

**Analysis:**

- Angular Signal Forms has NO warning concept
- Useful for password strength, suggestions, etc.
- But adds cognitive overhead

**Recommendation:**

- Keep but document clearly as "toolkit extension"
- Consider: should warnings auto-disappear after fix? Currently they don't.

---

## Part 4: Action Plan

### Phase 1: Critical Fixes (Must Do)

| Priority | Issue                 | Fix                                          |
| -------- | --------------------- | -------------------------------------------- |
| P0       | SubmittedStatus wrong | Track `submitting()` transitions via effect  |
| P0       | Logic inconsistency   | Unify reactive/imperative `'on-touch'` logic |
| P1       | Logic duplication     | Auto ARIA calls `shouldShowErrors()`         |
| P1       | SSR unsafe            | Add `typeof window` guard                    |

### Phase 2: Simplification (Should Do)

| Priority | Issue             | Fix                                                                      |
| -------- | ----------------- | ------------------------------------------------------------------------ |
| P2       | Too many exports  | Internalize `computeShowErrors`, `createShowErrorsSignal`, `unwrapValue` |
| P2       | Field name desync | Form-field provides context to children OR remove `fieldName` input      |

### Phase 3: Documentation (Nice to Have)

| Priority | Issue          | Fix                                 |
| -------- | -------------- | ----------------------------------- |
| P3       | Radio/checkbox | Document limitation in README       |
| P3       | Warnings       | Mark as "toolkit extension" in docs |

---

## Part 5: Keep/Remove Summary

### KEEP (Core Value)

| Export                           | Reason                       |
| -------------------------------- | ---------------------------- |
| `NgxSignalFormToolkit`           | Convenience bundle           |
| `NgxSignalFormDirective`         | Form context provider        |
| `NgxSignalFormAutoAriaDirective` | Accessibility automation     |
| `NgxSignalFormErrorComponent`    | Error display                |
| `NgxSignalFormFieldComponent`    | Form field wrapper           |
| `showErrors()`                   | Primary error visibility API |
| `shouldShowErrors()`             | Imperative version           |
| `combineShowErrors()`            | Combiner                     |
| `focusFirstInvalid()`            | Focus management             |
| `ngxStatusClasses()`             | CSS class alignment          |
| `canSubmit()`, `isSubmitting()`  | Submission helpers           |
| `provideNgxSignalFormsConfig()`  | Config provider              |
| `warningError()`                 | Warning helper               |

### INTERNALIZE (Not Public)

| Export                     | Reason                |
| -------------------------- | --------------------- |
| `computeShowErrors()`      | Implementation detail |
| `createShowErrorsSignal()` | Redundant             |
| `unwrapValue()`            | Implementation detail |

### FIX (Broken)

| Export                                   | Issue                                 |
| ---------------------------------------- | ------------------------------------- |
| `hasSubmitted()`                         | Wrong semantics (touched ≠ submitted) |
| `NgxSignalFormDirective.submittedStatus` | Same issue                            |

---

## Part 6: Value Assessment

### What Toolkit Does BETTER Than Raw Signal Forms

| Feature              | Raw Signal Forms            | With Toolkit      |
| -------------------- | --------------------------- | ----------------- |
| ARIA attributes      | Manual (0/10)               | Automatic (9/10)  |
| Error display timing | Manual `touched \|\| dirty` | Strategy-based    |
| Focus on error       | Manual traversal            | Single function   |
| CSS class timing     | Immediate only              | Strategy-aligned  |
| Form field layout    | DIY                         | Turnkey component |

### What Toolkit Adds That's NOT Needed

| Feature                          | Assessment                               |
| -------------------------------- | ---------------------------------------- |
| 5 error visibility functions     | Excessive — reduce to 3                  |
| `ReactiveOrStatic<T>` everywhere | Adds complexity, could simplify          |
| Warning convention               | Useful but niche — document as extension |

### Meta-Observation: Surface Area vs "Close to Core"

The toolkit currently exports ~25 public APIs. For a library claiming to be "close to core," this feels heavy.

**Target:** Reduce to ~15 essential exports:

- 3 directives/components (form, auto-aria, error)
- 1 form-field component + sub-components
- 3 error visibility functions (showErrors, shouldShowErrors, combineShowErrors)
- 3 submission helpers OR 1 consolidated
- 2 config providers
- 2 utility functions (focusFirstInvalid, warningError)

---

### Conclusion

**Keep the toolkit.** It solves real problems (ARIA, error timing, CSS alignment) that Angular Signal Forms doesn't address.

**Breaking changes are acceptable** (no release yet). Fix:

1. submittedStatus semantics (use host `(submit)` binding)
2. Error strategy centralization (single source of truth)
3. Field name alignment (auto-set `data-signal-field`)
4. API surface reduction (internalize implementation details)

The core value proposition is sound: accessibility and UX improvements with minimal new concepts.
