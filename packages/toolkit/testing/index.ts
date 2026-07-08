// Public entry point for `@ngx-signal-forms/toolkit/testing`.
//
// A small consumer-facing test harness for the toolkit's accessibility
// contract. `axe-core` is an optional peer dependency of the toolkit — it is
// only required if you import from this entry point.

export { expectNoA11yViolations, WCAG_22_AA_TAGS } from './a11y';
export type { WCAG_22_AA_TAG } from './a11y';
