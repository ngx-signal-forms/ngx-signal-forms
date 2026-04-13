# End-to-End (E2E) Testing

> **Repository override.** This file has been customized for the `ngx-signal-forms` workspace. The upstream Angular `angular-developer` skill bundle ships a Cypress-oriented version of this reference; this repo uses **Playwright** instead. If you re-sync these skills from upstream, reapply the changes below or regenerate against the actual project.

This workspace uses [Playwright](https://playwright.dev/) for end-to-end (E2E) testing via the `@nx/playwright` plugin. E2E tests for the demo application live in the `apps/demo-e2e/` Nx project and run against the demo dev server.

## Running E2E Tests

E2E runs are wired through Nx targets on the `demo-e2e` project:

```shell
# Run all E2E tests (spins up `pnpm nx serve demo` automatically via webServer)
pnpm nx e2e demo-e2e

# CI target (same config, used in pipelines)
pnpm nx e2e-ci demo-e2e
```

Useful Playwright CLI flags (pass after `--`):

```shell
# Headed / UI mode for debugging
pnpm nx e2e demo-e2e -- --ui

# Run a single spec
pnpm nx e2e demo-e2e -- src/navigation.spec.ts

# Filter by test title
pnpm nx e2e demo-e2e -- -g "navigation"
```

## Test Structure

- **Configuration:** `apps/demo-e2e/playwright.config.ts` — uses `nxE2EPreset` and auto-starts `pnpm nx serve demo` on `http://localhost:4200` via the `webServer` option.
- **Specs:** Test files live in `apps/demo-e2e/src/*.spec.ts` (e.g. `navigation.spec.ts`, `responsive.spec.ts`).
- **Project config:** `apps/demo-e2e/project.json` declares the `e2e` and `e2e-ci` Nx targets and lists `demo` as an implicit dependency.

## Example E2E Test Snippet

A typical spec uses Playwright's `test`/`expect` API and `test.describe` / `test.step` for structure:

```typescript
// apps/demo-e2e/src/navigation.spec.ts
import { expect, test } from '@playwright/test';

test.describe('Demo Application - Navigation & Shell', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load home page successfully', async ({ page }) => {
    await test.step('Verify page title and main layout', async () => {
      const title = page.locator('h1').first();
      await expect(title).toBeVisible();
      await expect(title).toContainText('Your First Form');

      const sidebar = page.locator('nav, [role="navigation"]').first();
      await expect(sidebar).toBeVisible();
    });
  });
});
```

## Best Practices

- **Prefer role/label locators.** Use `page.getByRole(...)`, `page.getByLabel(...)`, and `page.getByText(...)` over CSS selectors where possible — this keeps tests resilient and exercises the accessibility tree, which is especially important for a forms/toolkit project.
- **Use `data-testid` as a fallback.** When an element cannot be located by role/label, add a `data-testid` attribute and select via `page.getByTestId(...)` instead of brittle CSS.
- **Avoid fixed waits.** Do not use `page.waitForTimeout(...)` in committed specs. Prefer `expect(locator).toBeVisible()`, `page.waitForLoadState(...)`, or `page.waitForResponse(...)`; Playwright's web-first assertions auto-retry.
- **Scope with `test.step`.** Group related assertions under `test.step('…', async () => { … })` so failures report a meaningful step name in the HTML reporter.
- **Reuse fixtures, not globals.** Share setup via Playwright [fixtures](https://playwright.dev/docs/test-fixtures) rather than module-level state or custom commands.
- **Let Nx manage the dev server.** The `webServer` block in `playwright.config.ts` starts `pnpm nx serve demo` automatically; do not start a separate server manually when running locally.
