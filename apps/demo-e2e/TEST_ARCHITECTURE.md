# E2E Test Architecture

## Overview

This directory contains end-to-end tests for the ngx-signal-forms demo application using Playwright. The tests are organized using the **Page Object Model (POM)** pattern with reusable fixtures for common test scenarios.

## Directory Structure

```
apps/demo-e2e/src/
├── fixtures/                          # Reusable test logic and helpers
│   └── form-validation.fixture.ts    # Common form validation patterns
├── page-objects/                      # Page Object Model classes
│   ├── base-form.page.ts             # Base class for all forms
│   └── your-first-form.page.ts       # Specific page objects
├── specs/                             # Test specifications (organized by feature)
│   └── getting-started/
│       └── your-first-form.spec.ts   # Example POM-based test
├── forms.spec.ts                      # Legacy monolithic test file (to be migrated)
├── accessibility.spec.ts              # Accessibility-focused tests
├── navigation.spec.ts                 # Navigation tests
└── responsive.spec.ts                 # Responsive design tests
```

## Architecture Patterns

### 1. Page Object Model (POM)

Page objects encapsulate page-specific locators and actions:

```typescript
// page-objects/your-first-form.page.ts
export class YourFirstFormPage extends ErrorStrategyFormPage {
  readonly nameInput: Locator;
  readonly emailInput: Locator;

  async fillValidData(): Promise<void> {
    await this.nameInput.fill('John Doe');
    await this.emailInput.fill('john@example.com');
  }
}
```

**Benefits:**

- Single source of truth for selectors
- Reusable actions across tests
- Easy maintenance when UI changes
- Type-safe with TypeScript

### 2. Test Fixtures

Fixtures provide reusable test patterns:

```typescript
// fixtures/form-validation.fixture.ts
export async function verifyNoErrorsOnInitialLoad(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  const alerts = page.locator('[role="alert"]');
  await expect(alerts).toHaveCount(0);
}
```

**Benefits:**

- DRY (Don't Repeat Yourself) principle
- Consistent test patterns across forms
- Easy to update common behaviors
- Improved test readability

### 3. Base Classes

Base classes provide common functionality:

```typescript
// page-objects/base-form.page.ts
export abstract class BaseFormPage {
  abstract goto(): Promise<void>;

  get errorAlerts(): Locator {
    return this.page.locator('[role="alert"]');
  }
}
```

**Benefits:**

- Shared functionality (getters, common actions)
- Polymorphism for different form types
- Enforces consistent structure

## Writing Tests

### Example: Using POM with Fixtures

```typescript
import { test, expect } from '@playwright/test';
import { YourFirstFormPage } from '../../page-objects/your-first-form.page';
import { verifyNoErrorsOnInitialLoad } from '../../fixtures/form-validation.fixture';

test.describe('Your First Form', () => {
  let formPage: YourFirstFormPage;

  test.beforeEach(async ({ page }) => {
    formPage = new YourFirstFormPage(page);
    await formPage.goto();
  });

  test('should NOT show errors on initial load', async ({ page }) => {
    await verifyNoErrorsOnInitialLoad(page, {
      visibleFieldSelectors: ['input#contact-name', 'input#contact-email'],
    });
  });

  test('should submit with valid data', async () => {
    await formPage.fillValidData();
    await formPage.submit();
    await expect(formPage.nameInput).toHaveValue('');
  });
});
```

## Available Fixtures

### Form Validation Fixtures (`form-validation.fixture.ts`)

| Function                           | Purpose                         | Example                          |
| ---------------------------------- | ------------------------------- | -------------------------------- |
| `verifyNoErrorsOnInitialLoad()`    | Ensures no errors on page load  | Critical for 'on-touch' strategy |
| `verifyErrorsAfterBlur()`          | Checks errors appear after blur | Tests 'on-touch' behavior        |
| `verifyErrorsClearWithValidData()` | Verifies error clearing         | Tests validation recovery        |
| `switchErrorMode()`                | Changes error display mode      | Tests mode switching             |
| `preventInvalidSubmission()`       | Verifies invalid form blocks    | Tests submission guard           |

## Migration Guide

### From Monolithic to POM

**Before (forms.spec.ts):**

```typescript
test('should submit form', async ({ page }) => {
  await page.goto('/getting-started/your-first-form');
  await page.locator('input#contact-name').fill('John');
  await page.locator('input#contact-email').fill('john@example.com');
  await page.getByRole('button', { name: /Send/i }).click();
  await expect(page.locator('input#contact-name')).toHaveValue('');
});
```

**After (your-first-form.spec.ts):**

```typescript
test('should submit form', async () => {
  await formPage.fillValidData();
  await formPage.submit();
  await expect(formPage.nameInput).toHaveValue('');
});
```

### Steps to Migrate a Form:

1. **Create Page Object:**

   ```typescript
   // page-objects/my-form.page.ts
   export class MyFormPage extends BaseFormPage {
     // Define locators and actions
   }
   ```

2. **Create Test File:**

   ```typescript
   // specs/my-feature/my-form.spec.ts
   import { MyFormPage } from '../../page-objects/my-form.page';
   ```

3. **Use Fixtures:**

   ```typescript
   import { verifyNoErrorsOnInitialLoad } from '../../fixtures/form-validation.fixture';
   ```

4. **Remove from forms.spec.ts:**
   - Delete the corresponding `test.describe` block
   - Update any shared setup if needed

## Best Practices

### 1. **Always Test Initial Load State**

Every form using toolkit should verify no errors on initial load:

```typescript
test('should NOT show errors on initial load', async ({ page }) => {
  await verifyNoErrorsOnInitialLoad(page);
});
```

### 2. **Use Descriptive Test Names**

```typescript
// ✅ Good
test('should show validation errors after blur (on-touch mode)', ...)

// ❌ Bad
test('test validation', ...)
```

### 3. **Leverage test.step() for Complex Tests**

```typescript
test('should handle form submission', async () => {
  await test.step('Fill form with valid data', async () => {
    await formPage.fillValidData();
  });

  await test.step('Submit and verify reset', async () => {
    await formPage.submit();
    await expect(formPage.nameInput).toHaveValue('');
  });
});
```

### 4. **Keep Page Objects Focused**

- One page object per route/component
- Only include locators and actions
- No test assertions in page objects
- Keep business logic in tests

### 5. **Make Fixtures Configurable**

```typescript
export async function verifyNoErrorsOnInitialLoad(
  page: Page,
  options: {
    waitForLoadState?: 'load' | 'domcontentloaded' | 'networkidle';
    visibleFieldSelectors?: string[];
  } = {},
) {
  // Implementation
}
```

## Running Tests

### Run All E2E Tests

```bash
pnpm nx e2e demo-e2e
```

### Run Specific Test File

```bash
pnpm nx e2e demo-e2e --grep "Your First Form"
```

### Run in Headed Mode (with browser UI)

```bash
pnpm nx e2e demo-e2e --headed
```

### Run in Debug Mode

```bash
pnpm nx e2e demo-e2e --debug
```

## Roadmap

### Phase 1: Infrastructure (✅ Complete)

- [x] Create fixtures directory with common patterns
- [x] Create page-objects directory with base classes
- [x] Create specs directory with organized structure
- [x] Build example POM test (Your First Form)

### Phase 2: Add Initial Load Tests (✅ Complete)

- [x] Add "no errors on initial load" test to Error Display Modes
- [x] Add "no errors on initial load" test to Warning Support
- [x] Add "no errors on initial load" test to Field States
- [x] Add "no errors on initial load" test to Form Field Wrapper

### Phase 3: Create Remaining POMs (In Progress)

- [ ] Create ErrorDisplayModesPage
- [ ] Create WarningSupportPage
- [ ] Create FieldStatesPage
- [ ] Create FormFieldWrapperPage
- [ ] Create page objects for advanced features

### Phase 4: Migrate All Tests

- [ ] Split forms.spec.ts into individual spec files
- [ ] Organize specs by feature area
- [ ] Update CI/CD pipeline if needed
- [ ] Remove forms.spec.ts after full migration

### Phase 5: Enhancements

- [ ] Add visual regression tests
- [ ] Add performance benchmarks
- [ ] Add cross-browser testing
- [ ] Add mobile viewport tests

## Contributing

When adding new forms to the demo:

1. Create a page object in `page-objects/`
2. Create a test file in `specs/<feature>/`
3. Use fixtures for common patterns
4. Always include initial load test
5. Update this README with new fixtures/patterns

## Questions?

See existing examples:

- **Complete POM Example:** `specs/getting-started/your-first-form.spec.ts`
- **Base Classes:** `page-objects/base-form.page.ts`
- **Fixtures:** `fixtures/form-validation.fixture.ts`
