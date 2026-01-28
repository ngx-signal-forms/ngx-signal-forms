# Test.fixme Root Cause Analysis

## Summary

| Test File                   | Issue                     | Root Cause                                  | Location                |
| --------------------------- | ------------------------- | ------------------------------------------- | ----------------------- |
| warning-support.spec.ts     | Fields init as touched    | TOOLKIT: Signal Forms auto-touches on focus | TOOLKIT                 |
| warning-support.spec.ts     | Warnings block submission | SIGNAL FORMS: No native warning concept     | SIGNAL FORMS LIMITATION |
| warning-support.spec.ts     | Model empty after fill()  | E2E/ZONELESS: Timing/hydration issue        | TEST INFRASTRUCTURE     |
| async-validation.spec.ts    | Loading state too fast    | TEST: Needs MSW mocking                     | TEST                    |
| async-validation.spec.ts    | Admin username test       | TEST: Needs MSW mocking                     | TEST                    |
| async-validation.spec.ts    | Unique username test      | TEST: Needs MSW mocking                     | TEST                    |
| error-display-modes.spec.ts | Runtime strategy switch   | SIGNAL FORMS: No runtime strategy API       | SIGNAL FORMS LIMITATION |
| dynamic-list.spec.ts        | Field name resolution     | TOOLKIT: Console warning noise              | TOOLKIT                 |

---

## Detailed Analysis

### 1. warning-support.spec.ts - "should NOT show errors on initial load"

**Test Location:** [warning-support.spec.ts](apps/demo-e2e/src/forms/toolkit-core/warning-support.spec.ts#L13)

**Expected Behavior:** Fields should NOT show errors immediately on page load.

**Actual Behavior:** Fields appear with `touched()` === true on initial render, causing errors to show immediately with `on-touch` strategy.

**Root Cause Analysis:**

The toolkit's `showErrors()` function uses `field.touched()` for the default `on-touch` strategy:

```typescript
// From error-strategies.ts
case 'on-touch':
  return isInvalid && isTouched;
```

If Signal Forms initializes fields as touched (or the form-field wrapper is inadvertently calling `markAsTouched()`), errors will show immediately.

**Root Cause Location:** **TOOLKIT / SIGNAL FORMS BEHAVIOR**

**Investigation Needed:**

1. Check if `NgxSignalFormFieldWrapperComponent` calls any touch methods
2. Check if the demo form's `createPasswordForm()` is modifying state
3. Verify Signal Forms' default initialization of `touched()` signal

**Recommended Fix:**

- Add a `firstFocus` flag to only mark as touched after first blur
- Or change default strategy to `on-submit` for better UX
- Or file upstream issue if Signal Forms initializes `touched()` as true

---

### 2. warning-support.spec.ts - "should allow submission with warnings"

**Test Location:** [warning-support.spec.ts](apps/demo-e2e/src/forms/toolkit-core/warning-support.spec.ts#L103)

**Expected Behavior:** Form should submit successfully when only warnings (no blocking errors) are present.

**Actual Behavior:** Form submission is blocked because warnings are treated as validation errors.

**Root Cause Analysis:**

Angular Signal Forms has NO native concept of "warnings". The toolkit implements warnings using a **convention**:

- Errors: `kind` does NOT start with `'warn:'`
- Warnings: `kind` starts with `'warn:'`

However, Signal Forms' `submit()` helper checks `form().valid()` which returns `false` if ANY errors exist, including warnings:

```typescript
// From Angular Signal Forms submit() implementation (conceptual)
if (form().invalid()) {
  return; // Won't execute callback!
}
```

The toolkit's `form-error.component.ts` correctly separates warnings for display:

```typescript
// Errors (blocking)
protected readonly errors = computed(() => {
  return this.#allMessages().filter(
    (msg) => msg.kind && !msg.kind.startsWith('warn:'),
  );
});

// Warnings (non-blocking)
protected readonly warnings = computed(() => {
  return this.#allMessages().filter(
    (msg) => msg.kind && msg.kind.startsWith('warn:'),
  );
});
```

But there's no way to tell `submit()` to ignore warnings!

**Root Cause Location:** **SIGNAL FORMS LIMITATION**

Angular Signal Forms does not support:

1. Warning severity levels
2. Custom validity checks that ignore warnings
3. A "submit even if warnings present" option

**Workaround Options:**

1. **Custom submit wrapper** that checks only blocking errors:
   ```typescript
   async customSubmit(form, callback) {
     const blockingErrors = form().errorSummary().filter(e => !e.kind.startsWith('warn:'));
     if (blockingErrors.length === 0) {
       await callback(form);
     }
   }
   ```
2. **Don't use `submit()` helper** for forms with warnings
3. **Change warnings to be computed separately** (not as ValidationErrors)

**Recommended Action:**

- Document this as a known limitation
- Create `submitWithWarnings()` utility in toolkit
- File feature request with Angular Signal Forms team

---

### 3. warning-support.spec.ts - "should show success message after valid submission"

**Test Location:** [warning-support.spec.ts](apps/demo-e2e/src/forms/toolkit-core/warning-support.spec.ts#L218)

**Expected Behavior:** After filling valid data and submitting, success message appears.

**Actual Behavior:** Form model appears empty even after `userEvent.type()` fills the fields.

**Root Cause Analysis:**

This is likely a **zoneless Angular + E2E timing issue**. With zoneless change detection:

1. `userEvent.type()` triggers native DOM events
2. Signal Forms' `[formField]` directive updates the signal
3. But zoneless Angular may not trigger change detection before the test assertion

The test runs:

```typescript
await user.type(usernameInput, 'validuser'); // DOM updated
// But signal may not have propagated yet
await page.getByRole('button', { name: /create account/i }).click();
// Submit reads signal - potentially still empty!
```

**Root Cause Location:** **TEST INFRASTRUCTURE / ZONELESS TIMING**

**Investigation Needed:**

1. Add `await page.waitForLoadState('networkidle')` after typing
2. Use `expect.poll()` to wait for signal propagation
3. Check if adding delays helps (indicates timing issue)
4. Verify with non-zoneless build

**Recommended Fix:**

```typescript
// Add explicit wait for model update
await user.type(usernameInput, 'validuser');
await expect.poll(() => /* read signal value */).toBe('validuser');
```

---

### 4-6. async-validation.spec.ts - All 3 fixmes

**Test Locations:**

- [Line 52](apps/demo-e2e/src/forms/new-demos/async-validation.spec.ts#L52) - Loading state
- [Line 72](apps/demo-e2e/src/forms/new-demos/async-validation.spec.ts#L72) - Admin username
- [Line 95](apps/demo-e2e/src/forms/new-demos/async-validation.spec.ts#L95) - Unique username

**Expected Behavior:**

1. Loading state ("Checking...") visible during async validation
2. "admin" username shows "already taken" error
3. Other usernames validate as available

**Actual Behavior:**

- Loading state too fast to reliably detect
- Tests are flaky due to network timing

**Root Cause Analysis:**

The demo component uses `validateHttp()` which makes actual HTTP requests:

```typescript
validateHttp(path.username, {
  request: ({ value }) =>
    value() ? `fake-api/check-user/${value()}` : undefined,
  onSuccess: (_response, ctx) => {
    if (ctx.value().toLowerCase() === 'admin') {
      return {
        kind: 'usernameTaken',
        message: 'This username is already taken',
      };
    }
    return null;
  },
  onError: () => null,
});
```

The `fake-api/check-user/` endpoint either:

- Doesn't exist (404, caught by `onError`)
- Returns too fast (pending state invisible)

**Root Cause Location:** **TEST INFRASTRUCTURE**

The tests need **MSW (Mock Service Worker)** to:

1. Intercept the HTTP request
2. Add artificial delay for loading state testing
3. Return controlled responses

**Recommended Fix:**

1. **Set up MSW in Playwright:**

```typescript
// playwright.config.ts
import { setupMockServer } from './fixtures/mock-server';

export default defineConfig({
  use: {
    beforeEach: setupMockServer,
  },
});
```

2. **Create mock handler:**

```typescript
// fixtures/mock-handlers.ts
import { http, HttpResponse, delay } from 'msw';

export const asyncValidationHandlers = [
  http.get('/fake-api/check-user/:username', async ({ params }) => {
    await delay(500); // Ensure loading state is visible

    if (params.username === 'admin') {
      return HttpResponse.json({ available: false, message: 'Username taken' });
    }
    return HttpResponse.json({ available: true });
  }),
];
```

3. **Use in test:**

```typescript
test('should show loading state', async ({ page }) => {
  await page.route('**/fake-api/check-user/**', async (route) => {
    await new Promise((r) => setTimeout(r, 500));
    await route.fulfill({ json: { available: true } });
  });

  // Now loading state is reliably visible
  await expect(page.getByText('Checking...')).toBeVisible();
});
```

---

### 7. error-display-modes.spec.ts - "should switch strategy at runtime"

**Test Location:** [error-display-modes.spec.ts](apps/demo-e2e/src/forms/toolkit-core/error-display-modes.spec.ts#L46)

**Expected Behavior:** Changing error strategy dropdown should immediately update error visibility.

**Actual Behavior:** Strategy changes don't affect already-displayed errors.

**Root Cause Analysis:**

Looking at the demo component:

```typescript
@Component({
  template: `
    <form
      [ngxSignalForm]="productForm"
      [errorStrategy]="errorDisplayMode()"
      ...
    >
```

The `errorDisplayMode()` is an input that can change, but the toolkit's `ngxSignalFormDirective` may not be reactive to runtime changes.

Checking `showErrors()`:

```typescript
export function computeShowErrors<T>(
  field: ReactiveOrStatic<FieldState<T>>,
  strategy: ReactiveOrStatic<ErrorDisplayStrategy>,
  ...
): Signal<boolean> {
  return computed(() => {
    const strategyValue = unwrapValue(strategy);
    // Strategy IS reactive...
  });
}
```

The computed signal DOES unwrap strategy reactively. However, the issue may be that:

1. The form context provider doesn't update when strategy changes
2. Error components cache their initial strategy
3. The directive doesn't re-emit context on input changes

**Root Cause Location:** **TOOLKIT IMPLEMENTATION**

Looking at the toolkit's directive, it likely needs to:

```typescript
// ngx-signal-form.directive.ts
readonly errorStrategy = input<ErrorDisplayStrategy>('on-touch');

// This signal should be provided to context
readonly #context = computed(() => ({
  errorStrategy: this.errorStrategy,  // Should be reactive!
  submittedStatus: this.#submittedStatus,
}));
```

**Recommended Fix:**

1. Ensure directive provides a **signal** not a **value** for strategy
2. Error components should read from the signal, not cache the value
3. Add a test case for this specific scenario

**Workaround for test:**

- Mark as fixme with note that runtime strategy switching is not supported
- Document this as a limitation in README

---

### 8. dynamic-list.spec.ts - "should NOT show console warnings for field name resolution"

**Test Location:** [dynamic-list.spec.ts](apps/demo-e2e/src/forms/new-demos/dynamic-list.spec.ts#L118)

**Expected Behavior:** No console warnings about "Could not resolve field name" when working with dynamic arrays.

**Actual Behavior:** Console shows warnings for dynamically added form array items.

**Root Cause Analysis:**

The toolkit's `generateFieldId()` or `field-resolution.ts` utilities try to resolve human-readable field names for:

1. Error message IDs (`generateErrorId()`)
2. Warning message IDs (`generateWarningId()`)
3. ARIA describedby linking

For dynamic arrays like `tasksForm.tasks[0].title`, the toolkit may not properly handle:

1. Array index paths
2. Newly added items that don't exist yet
3. Items removed from the middle of the array

**Root Cause Location:** **TOOLKIT IMPLEMENTATION**

Looking at [field-resolution.ts](packages/toolkit/core/utilities/field-resolution.ts):

```typescript
export function generateErrorId(fieldName: string): string {
  return `${fieldName}-error`;
}
```

The warning likely comes from trying to resolve field names when:

1. The `@for` loop creates new items
2. The field reference `tasksForm.tasks[i].title` is evaluated
3. But the field doesn't exist in the form tree yet

**Recommended Fix:**

1. Add null/undefined checks in field resolution
2. Suppress warnings for known-safe scenarios (dynamic arrays)
3. Use `try-catch` or optional chaining
4. Consider using `track` function to stabilize IDs

---

## Action Items

### Immediate (Can Fix Now)

| Priority | Issue                           | Fix                                                    |
| -------- | ------------------------------- | ------------------------------------------------------ |
| HIGH     | Async validation tests need MSW | Set up MSW fixture for controlled async testing        |
| HIGH     | Dynamic list console warnings   | Add defensive checks in field-resolution utilities     |
| MEDIUM   | Runtime strategy switching      | Document as limitation OR fix directive to be reactive |

### Requires Upstream Changes

| Priority | Issue                     | Action                                        |
| -------- | ------------------------- | --------------------------------------------- |
| HIGH     | Warnings block submission | Create `submitWithWarnings()` toolkit utility |
| LOW      | Initial touched state     | Investigate Signal Forms initialization       |

### Test Infrastructure

| Priority | Issue                 | Action                                       |
| -------- | --------------------- | -------------------------------------------- |
| HIGH     | E2E + zoneless timing | Add proper signal propagation waits in tests |
| MEDIUM   | MSW integration       | Document MSW setup for async E2E tests       |

---

## Recommended Order of Resolution

1. **Set up MSW** - Enables 3 async-validation tests to pass
2. **Fix field-resolution warnings** - Removes console noise, 1 test passes
3. **Document runtime strategy limitation** - Keep fixme with explanation
4. **Create submitWithWarnings()** - Enables warning-support tests
5. **Investigate touched initialization** - May require upstream change
