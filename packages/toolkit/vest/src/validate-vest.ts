import {
  sharedVestAdapter,
  type VestFieldPath,
  type VestOnlyFieldSelector,
  type VestRunnableSuite,
} from './vest-adapter';

// Re-export the moved public contracts and constants so existing import sites
// that targeted `./validate-vest` keep resolving unchanged. The canonical home
// for these symbols is now `./vest-adapter`.
export {
  VEST_ERROR_KIND_PREFIX,
  VEST_WARNING_KIND_PREFIX,
  type VestOnlyFieldSelector,
  type VestResultLike,
  type VestRunnableSuite,
  type VestFieldPath,
} from './vest-adapter';

/**
 * Options accepted by {@link validateVest} (and the focus/reset subset by
 * {@link validateVestWarnings}). Controls warning surfacing, suite-state reset
 * on destroy, and per-field focused runs.
 */
export interface ValidateVestOptions<TValue = unknown> {
  /**
   * Include Vest warn-only tests as toolkit warnings.
   *
   * Warning messages are translated into Angular Signal Forms `ValidationError`
   * objects with a `kind` prefixed by `warn:` so existing toolkit components
   * render them as non-blocking guidance.
   *
   * @default false
   */
  includeWarnings?: boolean;

  /**
   * Call `suite.reset()` when the injection context that registered the
   * validator is destroyed.
   *
   * Vest suites created with `create()` retain state across runs (last result,
   * pending async tests, test memoization). When consumers declare suites at
   * module scope (the recommended pattern), that state leaks across component
   * mounts. The toolkit registers a `DestroyRef.onDestroy()` hook **by default**
   * that clears suite state when the hosting component tears down.
   *
   * Set to `false` only when you deliberately want suite state to persist
   * across mounts.
   *
   * @default true
   */
  resetOnDestroy?: boolean;

  /**
   * Enable per-field focused runs by passing a field name as the second
   * argument to `suite.run(value, fieldName)`. When provided as a function,
   * the callback receives the field context for the current validation pass
   * and should return the Vest field name(s) to focus, or `undefined` for a
   * whole-suite run.
   *
   * Works with suite callbacks that use `only(fieldName)` or with the
   * `suite.only(field).run(...)` shorthand. Default behavior remains a full
   * suite run for backward compatibility.
   *
   * @default undefined (full-suite run)
   */
  only?: VestOnlyFieldSelector<TValue>;

  /**
   * Derive the Vest field name to focus automatically from the field this
   * validator is bound to, giving you Vest's per-field focused run with zero
   * wiring. When `true` and {@link only} is not provided, the adapter resolves
   * the current field's dotted Vest name from `ctx.pathKeys()` and passes it to
   * the focused run (`suite.only(name).run(value)` or
   * `suite.run(value, name)`).
   *
   * Bind `validateVest` to the specific field path you want focused (e.g.
   * `validateVest(path.email, suite, { focusCurrentField: true })`) so the
   * derived name targets that field. When the validator is bound to the form
   * root the derived path is empty and the run falls back to a whole-suite run.
   *
   * Ignored when {@link only} is provided — an explicit selector always wins so
   * existing wiring keeps working unchanged.
   *
   * @default false (full-suite run)
   */
  focusCurrentField?: boolean;
}

/**
 * Register only the warning bridge for a Vest suite.
 *
 * Use this when blocking validation comes from another validator but Vest
 * `warn()` guidance should still render through the toolkit's warning UX.
 *
 * Implemented on top of the public {@link sharedVestAdapter}, so passing the
 * same suite to a blocking `validateVest` (or to
 * `sharedVestAdapter.runVestSuite(...)`) reuses a single suite execution.
 */
export function validateVestWarnings<TValue>(
  path: VestFieldPath<TValue>,
  suite: VestRunnableSuite<TValue>,
  options: Pick<
    ValidateVestOptions<TValue>,
    'resetOnDestroy' | 'only' | 'focusCurrentField'
  > = {},
): void {
  sharedVestAdapter.register(path, suite, {
    includeErrors: false,
    includeWarnings: true,
    resetOnDestroy: options.resetOnDestroy ?? true,
    only: options.only,
    focusCurrentField: options.focusCurrentField,
  });
}

/**
 * Register a Vest suite as a first-class Angular Signal Forms validator.
 *
 * Vest 6 suites remain Standard Schema-compatible, but this adapter consumes the
 * suite through Vest's richer `run()` result so Angular Signal Forms can map
 * blocking errors and optional `warn()` output in a single validation pass.
 *
 * Pass `{ includeWarnings: true }` to also surface Vest `warn()` results through
 * the toolkit's `warn:*` convention so `ngx-form-field-error`,
 * `ngx-form-field-wrapper`, and related components can render them as
 * polite, non-blocking guidance.
 *
 * By default the adapter calls `suite.reset()` when the hosting injection
 * context is destroyed, so module-scope suites (the documented Vest pattern)
 * do not bleed state across component mounts. Pass `{ resetOnDestroy: false }`
 * to opt out when you deliberately want suite state to persist.
 *
 * Pass `{ only: (ctx) => fieldName }` to enable per-field focused runs. The
 * adapter then invokes `suite.run(value, fieldName)` (or
 * `suite.only(fieldName).run(value)` where supported) rather than a full-suite
 * run. Works with suite callbacks that use `only(fieldName)` internally.
 *
 * Pass `{ focusCurrentField: true }` (without `only`) to get the same focused
 * run with zero wiring: the adapter derives the Vest field name from the field
 * this validator is bound to. Bind to the specific field path you want focused,
 * e.g. `validateVest(path.email, suite, { focusCurrentField: true })`.
 *
 * Built on the public {@link sharedVestAdapter}; advanced consumers can wire
 * the same machinery manually via `createVestAdapter` /
 * `sharedVestAdapter.runVestSuite`.
 *
 * @example
 * ```typescript
 * import { form } from '@angular/forms/signals';
 * import { create, enforce, only, test } from 'vest';
 * import { validateVest } from '@ngx-signal-forms/toolkit/vest';
 *
 * interface LoginModel {
 *   email: string;
 * }
 *
 * const loginSuite = create((data: LoginModel, field?: string) => {
 *   only(field);
 *   test('email', 'Email is required', () => {
 *     enforce(data.email).isNotBlank();
 *   });
 * });
 *
 * const loginModel = signal<LoginModel>({ email: '' });
 * const loginForm = form(loginModel, (path) => {
 *   validateVest(path, loginSuite); // resets on destroy by default
 * });
 * ```
 */
export function validateVest<TValue>(
  path: VestFieldPath<TValue>,
  suite: VestRunnableSuite<TValue>,
  options: ValidateVestOptions<TValue> = {},
): void {
  sharedVestAdapter.register(path, suite, {
    includeErrors: true,
    includeWarnings: options.includeWarnings ?? false,
    resetOnDestroy: options.resetOnDestroy ?? true,
    only: options.only,
    focusCurrentField: options.focusCurrentField,
  });
}
