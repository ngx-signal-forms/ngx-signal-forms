/**
 * Shared selectors for the toolkit's ARIA live regions.
 *
 * `<ngx-form-field-error>` (both its `inline` and `panel` presentations)
 * keeps its live region shells mounted in the DOM even while empty so screen
 * readers pick up the role on first content insertion (WCAG 4.1.3 — NVDA +
 * Chrome can drop the announcement when the role and the content arrive in
 * the same tick). Empty shells are tagged with `--empty`; exclude them when
 * counting or asserting the alerts a user would actually perceive.
 *
 * The demo's own success and banner regions (`ngx-submit-status`, the
 * server-integration banners) follow the same pattern without the class, so
 * `:not(:empty)` excludes those empty shells too.
 */
export const ROLE_ALERT_SELECTOR =
  '[role="alert"]:not(.ngx-form-field-error--empty):not(:empty)';

export const ROLE_STATUS_SELECTOR =
  '[role="status"]:not(.ngx-form-field-error--empty):not(:empty)';
