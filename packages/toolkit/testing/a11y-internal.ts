// Internal-only variants of the public `@ngx-signal-forms/toolkit/testing`
// helpers, imported by this package's own browser specs via a relative path
// — never re-exported from `index.ts`, so this file never ships as part of
// the published `@ngx-signal-forms/toolkit/testing` package.
//
// Identical to the public exports, except `expectNoA11yViolations` and
// `createA11yValidator` default `incomplete` to `'warn'` instead of the
// public default `'ignore'` (see `a11y.ts`'s own doc on `IncompleteResultMode`).
// The toolkit's own test suite wants every axe `incomplete` result surfaced
// for review; a consumer importing the public entry point should see the
// exact pre-#501 zero-incomplete-noise behavior unless they opt in
// themselves.

import type axe from 'axe-core';
import {
  createA11yValidator as createA11yValidatorPublic,
  expectNoA11yViolations as expectNoA11yViolationsPublic,
} from './a11y';
import type { A11yCheckOptions, A11yValidator, WCAG_22_AA_TAG } from './a11y';

export function expectNoA11yViolations(
  context?: axe.ElementContext,
  options?: A11yCheckOptions,
): Promise<void> {
  return expectNoA11yViolationsPublic(context, {
    incomplete: 'warn',
    ...options,
  });
}

export function createA11yValidator(
  options: { tags?: readonly WCAG_22_AA_TAG[] } = {},
): A11yValidator {
  const validator = createA11yValidatorPublic(options);
  return (context, runOptions) =>
    validator(context, { incomplete: 'warn', ...runOptions });
}

export {
  expectVisibleFocusIndicator,
  findAlertContaining,
  WCAG_22_AA_TAGS,
} from './a11y';
export type {
  A11yCheckOptions,
  A11yValidator,
  IncompleteResultMode,
  WCAG_22_AA_TAG,
} from './a11y';
