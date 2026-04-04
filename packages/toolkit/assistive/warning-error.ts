/**
 * Re-export warning utilities from the primary public entry point.
 *
 * These utilities are defined in core because they're pure functions
 * used by core directives (auto-aria, submission-helpers).
 * Assistive re-exports them for convenience.
 */
export {
  isBlockingError,
  isWarningError,
  warningError,
} from '@ngx-signal-forms/toolkit';
