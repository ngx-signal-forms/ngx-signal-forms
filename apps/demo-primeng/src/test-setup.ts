import '@angular/compiler';
import '@analogjs/vitest-angular/setup-snapshots';
import '@analogjs/vitest-angular/setup-serializers';
import { setupTestBed } from '@analogjs/vitest-angular/setup-testbed';
import '@testing-library/jest-dom/vitest';

// jsdom does not lay elements out, so `offsetParent` is `null` and
// `Element.checkVisibility` is unimplemented. The toolkit's
// `isElementCssVisible` helper (used by `NgxFieldIdentity` from the Prime
// wrapper's `afterEveryRender` hook) would therefore report every control as
// hidden, and `createAriaInvalidSignal` would yield `null` instead of `'true'`
// for a touched-and-invalid control. Stub `checkVisibility` to always report
// visible; real CSS-visibility regressions are caught by the Playwright
// e2e specs and the toolkit's browser-mode specs.
if (typeof HTMLElement !== 'undefined') {
  const proto = HTMLElement.prototype as HTMLElement & {
    checkVisibility?: () => boolean;
  };
  if (typeof proto.checkVisibility !== 'function') {
    proto.checkVisibility = () => true;
  }
}

setupTestBed();
