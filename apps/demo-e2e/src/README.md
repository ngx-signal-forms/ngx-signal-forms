# Demo E2E Tests

## Test Organization

This directory contains end-to-end tests for the ngx-signal-forms demo application, organized into two main categories:

### 1. UI Tests (`ui/`)

These tests verify the **demo application's specific UI implementation**:

- **`navigation.spec.ts`** - Navigation system, theme switching, route handling
- **`responsive.spec.ts`** - Page loading, responsive design, scroll behavior
- **`page-chrome-content.spec.ts`** - App-shell/content contract across routes (sidenav, config bar, page titles)

### 2. Form Tests (`forms/`)

These tests verify **form/toolkit behavior** (validation, submission, debugger interactions, and display-control effects) provided by @ngx-signal-forms/toolkit, organized by demo app section:

- **`01-getting-started/`** - Onboarding and basic form examples
  - `nav-tree.spec.ts` - Navigation tree interaction
  - `your-first-form.spec.ts` - First form with toolkit

- **`02-toolkit-core/`** - Core toolkit features
  - `aria-attributes.spec.ts` - ARIA accessibility attributes
  - `aria-strategy-integration.spec.ts` - ARIA strategy integration
  - `error-display-modes.spec.ts` - Error display strategy modes
  - `form-accessibility.spec.ts` - Form accessibility features
  - `keyboard-navigation.spec.ts` - Keyboard navigation
  - `visual-accessibility.spec.ts` - Visual accessibility
  - `warning-support.spec.ts` - Warning support

- **`03-headless/`** - Headless primitives
  - `error-message-signal.spec.ts` - Error message signal
  - `fieldset-utilities.spec.ts` - Fieldset utilities

- **`04-form-field-wrapper/`** - Form field wrapper component
  - `complex-forms.spec.ts` - Complex forms with nested structures
  - `custom-controls.spec.ts` - Custom control integration
  - `fieldset-appearance.spec.ts` - Fieldset appearance
  - `labelless-fields.spec.ts` - Labelless field patterns
  - `signal-form-debugger.spec.ts` - Signal form debugger

- **`05-advanced/`** - Advanced scenarios
  - `advanced-wizard.spec.ts` - Multi-step wizard
  - `async-validation.spec.ts` - Async validation
  - `cross-field-validation.spec.ts` - Cross-field validation
  - `global-configuration.spec.ts` - Global toolkit configuration
  - `submission-patterns.spec.ts` - Form submission patterns
  - `vest-validation.spec.ts` - Vest validation
  - `zod-validation.spec.ts` - Zod validation
  - `zod-vest-validation.spec.ts` - Combined Zod + Vest validation

### 3. Accessibility Tests (`accessibility.spec.ts`)

- WCAG 2.2 AA compliance tests for all demo routes

### 4. Shared Fixtures (`fixtures/`)

- `aria-selectors.ts` - ARIA role selectors
- `form-validation.fixture.ts` - Reusable form validation helpers

### 5. Page Objects (`page-objects/`)

Page Object Model classes for major demo pages.

## Running Tests

Run all tests:

```bash
pnpm nx run demo-e2e:e2e
```

Run toolkit/form-functionality tests only:

```bash
pnpm nx run demo-e2e:e2e-toolkit
```

This lane excludes tests tagged with `@layout`, so large look-and-feel/layout
refactors should not fail toolkit behavior coverage.
The target includes a preflight port cleanup for `localhost:4200` before
starting Playwright.

Run demo app UI/look-and-feel/content tests only:

```bash
pnpm nx run demo-e2e:e2e-demo-app
```

This target includes the same preflight port cleanup before test startup.

Run all layout-sensitive checks (demo app UI + form tests tagged `@layout`):

```bash
pnpm nx run demo-e2e:e2e-layout
```

This target also performs preflight port cleanup.

Run WCAG route-sweep accessibility tests:

```bash
pnpm nx run demo-e2e:a11y
```

Run form tests for a specific section:

```bash
pnpm nx run demo-e2e:e2e -- forms/02-toolkit-core/error-display-modes.spec.ts
```

Run with headed mode for debugging:

```bash
pnpm nx run demo-e2e:e2e -- --headed
```

## Test Structure Best Practices

- Use `@layout` in test titles for layout/visual assertions (e.g. screenshot
  baselines, spacing/grid contracts).
- Keep form behavior tests focused on toolkit semantics (validation,
  submission, ARIA/debug state, display-control behavior) and avoid page-copy
  coupling.

- Use `test.describe()` to group related tests
- Use `test.beforeEach()` for common setup
- Use `test.step()` for logical groupings within a test
- Use `expect().toBeVisible()` for visibility checks
- Use `expect().toHaveCount()` for counting elements
- Use `expect().toContainText()` for text content verification
- Wait for appropriate load states with `waitForLoadState()`
- Verify ARIA attributes for accessibility
- Test keyboard navigation for interactive elements

## Playwright CLI Patterns

For debugging and manual testing, you can use the `playwright-cli` tool:

```bash
# Open browser and navigate
playwright-cli open http://localhost:4200
playwright-cli goto /getting-started/your-first-form

# Interact with elements
playwright-cli click e5
playwright-cli fill e10 "test value"
playwright-cli select e15 "option-value"

# Take screenshots
playwright-cli screenshot

# Close browser
playwright-cli close
```

## Recent Changes

The navigation tests were updated to work with the new nav-tree component structure:

- Category buttons are now in a nav with `aria-label="Documentation sections"`
- Tests updated to use `page.getByLabel('Documentation sections')` instead of `page.getByLabel('Site navigation')`
