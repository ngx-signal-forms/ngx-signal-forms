import {
  sharedVestAdapter,
  type VestFieldExclusion,
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
  type VestFieldExclusion,
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
export interface ValidateVestOptions<
  TValue = unknown,
  F extends string = string,
> {
  /**
   * Include Vest warn-only tests as toolkit warnings.
   *
   * Warning messages are translated into Angular Signal Forms `ValidationError`
   * objects with a `kind` prefixed by `warn:` so existing toolkit components
   * render them as non-blocking guidance.
   *
   * While the suite has pending async tests, a sync warning is deferred (not
   * yet surfaced) and re-emitted together with the settled result once they
   * finish — see the vest README's "Async caveats" section for why.
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
   * Enable per-field focused runs. The callback receives the field context
   * for the current validation pass and returns a {@link VestFieldExclusion}:
   * a single field name, a list of field names, `undefined` for a
   * whole-suite run, or `false` to focus nothing.
   *
   * The adapter prefers the canonical `suite.only(field).run(value)` form.
   * When the suite does not expose `only`, it falls back to the legacy
   * `suite.run(value, fieldName)` form, which supports a single field name
   * only — a returned array collapses to its first element. Vest has no way
   * to express "focus nothing" through either form (an empty selection runs
   * the WHOLE suite, not zero tests — verified against vest@6.3.2), so a
   * `false` return throws a descriptive error instead of silently doing the
   * opposite of what was asked.
   *
   * @default undefined (full-suite run)
   */
  only?: VestOnlyFieldSelector<TValue, F>;
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
export function validateVestWarnings<TValue, F extends string = string>(
  path: VestFieldPath<TValue>,
  suite: VestRunnableSuite<TValue, F>,
  options: Pick<ValidateVestOptions<TValue, F>, 'resetOnDestroy' | 'only'> = {},
): void {
  sharedVestAdapter.register(path, suite, {
    includeErrors: false,
    includeWarnings: true,
    resetOnDestroy: options.resetOnDestroy ?? true,
    ...(options.only !== undefined && { only: options.only }),
  });
}

/**
 * Register a Vest suite as a first-class Angular Signal Forms validator.
 *
 * **The bound path's value is the suite input.** `path` and `suite` must
 * agree: binding the form root gives the suite the whole model (the common
 * case — a suite whose callback takes the model shape); binding a subtree is
 * equally legal when the suite is authored for that subtree's value (e.g. a
 * suite over `{ city: string }` bound to an `address` path). Binding a suite
 * authored for one shape to a path of a different shape is a compile error —
 * see ADR-0008 for why a second, mismatched value source is not offered as an
 * alternative.
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
export function validateVest<TValue, F extends string = string>(
  path: VestFieldPath<TValue>,
  suite: VestRunnableSuite<TValue, F>,
  options: ValidateVestOptions<TValue, F> = {},
): void {
  sharedVestAdapter.register(path, suite, {
    includeErrors: true,
    includeWarnings: options.includeWarnings ?? false,
    resetOnDestroy: options.resetOnDestroy ?? true,
    ...(options.only !== undefined && { only: options.only }),
  });
}
