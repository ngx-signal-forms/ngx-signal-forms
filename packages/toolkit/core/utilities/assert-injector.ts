import {
  Injector,
  assertInInjectionContext,
  inject,
  runInInjectionContext,
} from '@angular/core';

// `Function` is intentional here: Angular uses this value only as a named
// reference for diagnostic output.
// oxlint-disable-next-line @typescript-eslint/no-unsafe-function-type, @typescript-eslint/ban-types
type InjectionContextDebugFn = Function;

/**
 * Runs work in the current or supplied Angular injection context.
 *
 * @internal
 */
export function assertInjector<Runner extends () => unknown>(
  // oxlint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
  fn: InjectionContextDebugFn,
  // Angular's Injector is inherently mutable.
  // oxlint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types
  injector: Injector | undefined | null,
  runner: Runner,
): ReturnType<Runner> {
  if (!injector) {
    assertInInjectionContext(fn);
  }

  // Angular's helper returns `unknown` even when the runner is typed.
  return runInInjectionContext(
    injector ?? inject(Injector),
    runner,
  ) as ReturnType<Runner>;
}
