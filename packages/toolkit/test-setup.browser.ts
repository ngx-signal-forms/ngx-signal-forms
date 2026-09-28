import '@angular/compiler';
import '@analogjs/vitest-angular/setup-snapshots';
import '@analogjs/vitest-angular/setup-serializers';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';

// No `@testing-library/jest-dom` import here: `@vitest/browser` ships the same
// DOM matchers (`toHaveClass`, `toHaveAttribute`, `toBeVisible`, ...) and adds
// them to `expect` in browser mode. The jsdom project imports jest-dom in
// `test-setup.ts`.

setupTestBed({
  teardown: { destroyAfterEach: true },
});
