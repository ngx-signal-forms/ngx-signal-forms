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
  validateVest,
  validateVestWarnings,
  type ValidateVestOptions,
} from './validate-vest';
