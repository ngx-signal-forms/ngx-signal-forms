/**
 * Shared selectors for the toolkit's ARIA live regions.
 *
 * `<ngx-form-field-error>` keeps its `role="alert"` and `role="status"`
 * containers mounted in the DOM even while empty so screen readers pick
 * up the live region on the first content insertion (WCAG 4.1.3 — NVDA
 * + Chrome can drop the announcement when the role and the content
 * arrive in the same tick). Empty shells are tagged with the
 * `ngx-form-field-error--empty` class; exclude them when counting or
 * asserting the alerts a user would actually perceive.
 */
export const ROLE_ALERT_SELECTOR =
  '[role="alert"]:not(.ngx-form-field-error--empty)';

export const ROLE_STATUS_SELECTOR =
  '[role="status"]:not(.ngx-form-field-error--empty)';
