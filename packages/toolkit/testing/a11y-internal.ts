// Internal-only variants of the public `@ngx-signal-forms/toolkit/testing`
// helpers, imported by this package's own browser specs via a relative path
// — never re-exported from `index.ts`, so this file never ships as part of
// the published `@ngx-signal-forms/toolkit/testing` package.
//
// `expectNoA11yViolations` is the public helper, except it defaults
// `incomplete` to `'warn'` instead of the public default `'ignore'` (see
// `a11y.ts`'s own doc on `IncompleteResultMode`). The toolkit's own test
// suite wants every axe `incomplete` result surfaced for review; a consumer
// importing the public entry point should see the exact pre-#501
// zero-incomplete-noise behavior unless they opt in themselves.
//
// `findAlertContaining` lives here because only the toolkit's own specs use it.

import type axe from 'axe-core';
import { expectNoA11yViolations as expectNoA11yViolationsPublic } from './a11y';
import type { A11yCheckOptions } from './a11y';

export function expectNoA11yViolations(
  context?: axe.ElementContext,
  options?: A11yCheckOptions,
): Promise<void> {
  return expectNoA11yViolationsPublic(context, {
    incomplete: 'warn',
    ...options,
  });
}

/**
 * Finds the `[role="alert"]` element within `container` whose text content
 * includes `text`, or `undefined` if none matches.
 *
 * Several toolkit surfaces (grouped fieldsets, error summaries) render
 * alongside per-field error regions that stay mounted-but-empty per the
 * WCAG 4.1.3 first-insertion pattern (see `expectNoA11yViolations`'s own
 * doc). A bare `getByRole('alert')` query is ambiguous whenever more than
 * one such region is present; this narrows to the one actually carrying the
 * expected message, for asserting on it before running the a11y scan.
 *
 * Internal to the toolkit's own browser specs. It is not part of the public
 * `@ngx-signal-forms/toolkit/testing` entry point.
 */
export function findAlertContaining(
  container: ParentNode,
  text: string,
): HTMLElement | undefined {
  return Array.from(
    container.querySelectorAll<HTMLElement>('[role="alert"]'),
  ).find((el) => el.textContent?.includes(text));
}

export {
  createA11yValidator,
  expectVisibleFocusIndicator,
  WCAG_22_AA_TAGS,
} from './a11y';
export type {
  A11yCheckOptions,
  A11yValidator,
  IncompleteResultMode,
  WCAG_22_AA_TAG,
} from './a11y';
