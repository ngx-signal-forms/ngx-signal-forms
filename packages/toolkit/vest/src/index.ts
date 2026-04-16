/**
 * `@ngx-signal-forms/toolkit/vest`
 *
 * Optional convenience helpers for using Vest with Angular Signal Forms.
 *
 * Vest 6 suites implement the Standard Schema interface, so Angular Signal Forms
 * can validate them directly. This entry point provides a discoverable helper API
 * for toolkit consumers without coupling the primary toolkit entry point to Vest.
 *
 * @packageDocumentation
 */

export {
  VEST_ERROR_KIND_PREFIX,
  VEST_WARNING_KIND_PREFIX,
  validateVest,
  validateVestWarnings,
  type ValidateVestOptions,
  type VestOnlyFieldSelector,
} from './validate-vest';
