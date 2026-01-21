# End-to-End Test Plan for ngx-signal-forms Demo

## Application Overview

Comprehensive test plan for the ngx-signal-forms demo application, verifying the functionality, accessibility, and user experience of Angular Signal Forms enhanced by @ngx-signal-forms/toolkit.

This plan covers baseline functionality, toolkit core features (accessibility, error strategies, warnings), form field wrappers, and advanced form patterns including dynamic lists and async validation. All tests are designed to be run using Playwright against the local development environment.

## Test Scenarios

### 1. Baseline Functionality

**Seed:** `tests/seed.spec.ts`

#### 1.1. Pure Signal Form (No Toolkit)

**File:** `tests/baseline/pure-signal-form.spec.ts`

**Steps:**

1. Navigate to /signal-forms-only/pure-signal-form
2. Verify accessibility snapshot of the form
3. Enter invalid email "test" and blur field
4. Verify error message appears and input has aria-invalid="true"
5. Correct email to "test@example.com"
6. Verify error message disappears and input has aria-invalid="false"

**Expected Results:**

- Page loads with no accessibility violations
- Form validates input correctly
- Manual ARIA attributes function as expected

### 2. Toolkit Core Features

**Seed:** `tests/seed.spec.ts`

#### 2.1. Accessibility Comparison

**File:** `tests/toolkit/accessibility-comparison.spec.ts`

**Steps:**

1. Navigate to /toolkit-core/accessibility-comparison
2. Locate specific container for **Manual** implementation and capture accessibility snapshot
3. Locate specific container for **Minimal** implementation and capture accessibility snapshot
4. Locate specific container for **Full** toolkit implementation (`[ngxSignalForm]`) and capture accessibility snapshot
5. Compare all three snapshots to ensure semantic equivalence
6. Verify `aria-describedby` and `aria-invalid` relationships specifically on the Full toolkit implementation to ensure directive is active

**Expected Results:**

- All three forms (Manual, Minimal, Full) render identically visually
- Accessibility snapshots match across all three implementations
- Toolkit implementation correctly applies ARIA attributes without manual wiring

#### 2.2. Warning vs Error Support

**File:** `tests/toolkit/warning-support.spec.ts`

**Steps:**

1. Navigate to /toolkit-core/warning-support
2. Verify initial state: Form is valid, no messages visible checks
3. Type "user" into Username field to trigger warning (e.g., min-length warning)
4. Verify warning message is displayed with amber styling
5. Verify warning message container has ARIA `role="status"`
6. **Check Form Validity:** Verify form status is INVALID (Note: Angular treats warnings as errors by default)
7. Attempt form submission with warning present (verify blocking/non-blocking behavior)
8. Clear field to trigger hard validation error (required)
9. Verify error message has ARIA `role="alert"` and red styling

**Expected Results:**

- Warning message visually distinct from Error (Amber vs Red)
- Warning uses `role="status"`, Error uses `role="alert"`
- Submission behavior matches defined policy (Warning should distinct from Error blocking)
- Input updates reliably reflect in model (verify text entry works)

#### 2.3. Error Display Strategies

**File:** `tests/toolkit/error-strategies.spec.ts`

**Steps:**

1. Navigate to /toolkit-core/error-display-modes
2. **Test Default/On-Touch Strategy:**
   - Focus and blur empty required field
   - Verify error appears only after blur
3. **Test Immediate Strategy:**
   - (If runtime switching is fixed or via route param) Switch to Immediate
   - Type and delete character
   - Verify error appears immediately
4. **Test On-Submit Strategy:**
   - (If runtime switching is fixed or via route param) Switch to On-Submit
   - Focus and blur empty required field (expect no error)
   - Click Submit button
   - Verify error appears

**Expected Results:**

- Application respects the configured strategy for error visibility
- Runtime switching works or is documented as a limitation

### 3. Form Field Wrapper

**Seed:** `tests/seed.spec.ts`

#### 3.1. Basic Component Usage

**File:** `tests/wrapper/basic-usage.spec.ts`

**Steps:**

1. Navigate to /form-field-wrapper/basic-usage
2. Identify all field types: Text, Number, Date, Select, Checkbox, Radio, Range
3. Perform interaction with each field type
4. Submit form with empty required fields
5. Verify all errors appear simultaneously

**Expected Results:**

- All 7 field types render correctly
- Wrapper automatically handles label association
- Validation errors appear in correct location relative to input

#### 3.2. Complex/Nested Forms

**File:** `tests/wrapper/complex-forms.spec.ts`

**Steps:**

1. Navigate to /form-field-wrapper/complex-forms
2. Fill in nested address fields
3. Verify 'Street' is required in nested group
4. Check form validity summary

**Expected Results:**

- Nested object values update correctly in summary
- Validation propagates from nested fields to parent form

#### 3.3. Outline Form Field

**File:** `tests/wrapper/outline-field.spec.ts`

**Steps:**

1. Navigate to `outline-form-field` demo page
2. Verify visual rendering of outline style regarding label placement
3. Check label position (should float or be positioned for outline)
4. Interact with field (focus/blur)
5. Verify floating label behavior matches Material/Outline spec expectation (moves up on focus/value)

**Expected Results:**

- Distinct outline styling is applied
- Floating label works correctly
- Validation errors do not break layout

### 4. New & Advanced Demos

**Seed:** `tests/seed.spec.ts`

#### 4.1. Dynamic Form Arrays

**File:** `tests/new-demos/dynamic-list.spec.ts`

**Steps:**

1. Navigate to /new-demos/dynamic-list
2. Click 'Add Item' button
3. Fill details in new item row
4. Click 'Remove' on an item
5. Verify list count updates correctly
6. Submit form to check validation of all items
7. **Check Console:** Verify no "Could not resolve field name" warnings appear (regression check)

**Expected Results:**

- Can add new items to the list
- Can remove items from the list
- New items have correct validation state (pristine/untouched)
- Dynamic fields resolve names correctly for ARIA

#### 4.2. Async Validation Behavior

**File:** `tests/new-demos/async-validation.spec.ts`

**Pre-requisite:** Use MSW to mock API responses for deterministic testing.

**Steps:**

1. Navigate to /new-demos/async-validation
2. Type 'admin' in username field
3. Verify loading state (spinner/text) appears
4. Wait for async check to complete
5. Verify error 'Username is already taken' is displayed
6. Type 'uniqueUser'
7. Verify loading state
8. Verify field becomes valid

**Expected Results:**

- Input triggers async loading state visible to user
- 'admin' triggers "taken" error
- Valid username shows success state/no error

#### 4.3. Global Configuration

**File:** `tests/advanced/global-config.spec.ts`

**Steps:**

1. Navigate to /advanced/global-configuration
2. Check configured default strategy (e.g. text describing "Current: On-Submit")
3. Trigger validation according to that strategy (e.g. click submit)
4. Verify accessibility attributes are present (ensure config didn't break auto-ARIA)

**Expected Results:**

- Global configuration applies correct default error strategy
- Custom class names are applied if configured

#### 4.4. Cross-Field Validation

**File:** `tests/new-demos/cross-field-validation.spec.ts`

**Steps:**

1. Navigate to /new-demos/cross-field-validation (or password-confirm demo)
2. Enter "password123" in Password field
3. Enter "password456" in Confirm Password field
4. Verify error "Passwords do not match" appears on the group or confirm field
5. Correct Confirm Password to "password123"
6. Verify error disappears

**Expected Results:**

- Validation runs across multiple fields
- Error is cleared when condition is met

#### 4.5. Stepper / Multi-step Form

**File:** `tests/new-demos/stepper.spec.ts`

**Steps:**

1. Navigate to /new-demos/stepper
2. Try to click "Next" without filling Step 1
3. Verify navigation is blocked or errors appear
4. Fill Step 1 validly
5. Click "Next" -> Verify Step 2 is shown
6. Verify URL or UI state indicates Step 2

**Expected Results:**

- Validation prevents progress
- State is preserved between steps

#### 4.6. Nested Groups (Deeply Nested)

**File:** `tests/new-demos/nested-groups.spec.ts`

**Steps:**

1. Navigate to /new-demos/nested-groups
2. Interact with a deeply nested field (Level 3+)
3. Verify path resolution works for validation messages
4. Verify error summary at top (if present) reflects the nested error

**Expected Results:**

- Deeply nested fields function identical to top-level fields
- Error paths are correctly resolved

#### 4.7. Custom Error Messages

**File:** `tests/advanced/error-messages.spec.ts`

**Steps:**

1. Navigate to /advanced/error-messages
2. Trigger specific error (e.g., pattern mismatch) that has a custom message configured
3. Verify the text matches the specific custom message (not the default "Invalid format")

**Expected Results:**

- Custom messages take precedence over defaults
