import {
  Injector,
  assertInInjectionContext,
  inject,
  runInInjectionContext,
} from '@angular/core';

// `Function` is intentional here: `assertInjector` forwards `fn` to Angular's
// `assertInInjectionContext`, which only uses it as a named reference for
// diagnostic output (it is never invoked with typed arguments). Tightening
// this alias to e.g. `(...args: readonly unknown[]) => unknown` or
// `(...args: never[]) => unknown` breaks downstream callers like
// `injectFormContext` / `injectFieldControl`, whose parameter types are not
// assignable to a stricter callable. We accept the two oxlint warnings here.
// oxlint-disable-next-line @typescript-eslint/no-unsafe-function-type, @typescript-eslint/ban-types -- see comment above
type InjectionContextDebugFn = Function;

/**
 * `assertInjector` extends Angular's `assertInInjectionContext` with an optional `Injector`.
 * After assertion, it runs the `runner` function with a guaranteed `Injector`,
 * whether it's the default one within the current Injection Context or a custom one passed in.
 *
 * This pattern is inspired by ngxtension's `assertInjector` utility.
 * @see https://github.com/ngxtension/ngxtension-platform
 *
 * @template Runner - A function that can return anything
 * @param fn - The function to pass to `assertInInjectionContext`
 * @param injector - Optional custom Injector
 * @param runner - The runner function to execute in the injection context
 * @returns The result of the runner function
 *
 * @example
 * ```typescript
 * export function injectFormConfig(injector?: Injector) {
 *   return assertInjector(injectFormConfig, injector, () => {
 *     return inject(NGX_SIGNAL_FORMS_CONFIG, { optional: true });
 *   });
 * }
 * ```
 */
export function assertInjector<Runner extends () => unknown>(
  // Passed through to Angular's assertInInjectionContext for diagnostics only.
  fn: InjectionContextDebugFn,
  // Angular's Injector is inherently mutable; Readonly<Injector> is not practical here.
  // eslint-disable-next-line typescript-eslint/prefer-readonly-parameter-types
  injector: Injector | undefined | null,
  runner: Runner,
): ReturnType<Runner>;

/**
 * `assertInjector` extends Angular's `assertInInjectionContext` with an optional `Injector`.
 * After assertion, it returns a guaranteed `Injector` whether it is the default one
 * within the current Injection Context or the custom one that was passed in.
 *
 * This pattern is inspired by ngxtension's `assertInjector` utility.
 * @see https://github.com/ngxtension/ngxtension-platform
 *
 * @param fn - The function to pass to `assertInInjectionContext`
 * @param injector - Optional custom Injector
 * @returns A guaranteed Injector
 *
 * @example
 * ```typescript
 * export function injectFormConfig(injector?: Injector) {
 *   injector = assertInjector(injectFormConfig, injector);
 *   return runInInjectionContext(injector, () => {
 *     return inject(NGX_SIGNAL_FORMS_CONFIG, { optional: true });
 *   });
 * }
 * ```
 */
export function assertInjector(
  // Passed through to Angular's assertInInjectionContext for diagnostics only.
  fn: InjectionContextDebugFn,
  // Angular's Injector is inherently mutable; Readonly<Injector> is not practical here.
  // eslint-disable-next-line typescript-eslint/prefer-readonly-parameter-types
  injector: Injector | undefined | null,
): Injector;

export function assertInjector(
  // Passed through to Angular's assertInInjectionContext for diagnostics only.
  fn: InjectionContextDebugFn,
  // Angular's Injector is inherently mutable; Readonly<Injector> is not practical here.
  // eslint-disable-next-line typescript-eslint/prefer-readonly-parameter-types
  injector: Injector | undefined | null,
  runner?: () => unknown,
) {
  if (!injector) {
    assertInInjectionContext(fn);
  }
  const assertedInjector = injector ?? inject(Injector);

  if (!runner) return assertedInjector;
  return runInInjectionContext(assertedInjector, runner);
}
