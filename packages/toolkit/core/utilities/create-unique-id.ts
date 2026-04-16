import { inject, Injectable, InjectionToken, isDevMode } from '@angular/core';

/**
 * Per-injector counter used by {@link createUniqueId} to mint stable,
 * monotonically increasing ids for ARIA wiring (`aria-describedby`,
 * `aria-labelledby`, hint/error wiring).
 *
 * ## Why a service instead of a module-scoped counter?
 *
 * A module-scoped `let counter = 0` is shared across every Angular injector
 * that loads the module — including the server and the browser during SSR,
 * and every SSR request in a long-running Node process. That causes two
 * problems:
 *
 * 1. **Hydration mismatches**. Server-rendered HTML ships `hint-1`, `hint-2`,
 *    …; the browser bundle then re-evaluates the same directives from a
 *    non-zero counter (module-level state persists), so the `id` /
 *    `aria-describedby` pair never matches the server output.
 * 2. **Test pollution**. Each test's counter state leaks into the next,
 *    making assertions on concrete ids brittle.
 *
 * Scoping the counter to the root `EnvironmentInjector` — one per platform,
 * one per SSR request — means the server and the browser each start at the
 * same value (1) and walk through directives in the same order during
 * hydration, producing matching ids on both sides. Tests that create fresh
 * `TestBed` injectors likewise get a fresh counter.
 *
 * This is the same pattern Angular uses internally for `_IdGenerator`, which
 * we deliberately don't import because it is `@internal` and not part of
 * the public Angular API.
 *
 * @internal
 */
@Injectable({ providedIn: 'root' })
export class NgxSignalFormIdCounter {
  #counter = 0;

  /**
   * Returns the next id for `prefix`, starting at `1` on a fresh injector.
   */
  next(prefix: string): string {
    this.#counter += 1;
    return `${prefix}-${this.#counter}`;
  }
}

/**
 * Optional override token that lets tests (and niche composition roots)
 * inject a custom id strategy without subclassing {@link NgxSignalFormIdCounter}.
 *
 * When provided, {@link createUniqueId} delegates to this function instead of
 * the service. Consumers typically have no reason to override this.
 *
 * @internal
 */
export const NGX_SIGNAL_FORM_ID_STRATEGY = new InjectionToken<
  (prefix: string) => string
>('NGX_SIGNAL_FORM_ID_STRATEGY');

/**
 * Module-scoped fallback counter, used only when {@link createUniqueId} is
 * called outside an Angular injection context. Regular toolkit usage always
 * flows through the per-injector service and therefore stays SSR-safe.
 *
 * @internal
 */
let fallbackCounter = 0;
let warnedFallback = false;

/**
 * Mints a stable, per-injector unique id for ARIA wiring.
 *
 * **SSR guarantees**: when called from an Angular injection context (the
 * usage pattern every toolkit caller follows — class-field initializers,
 * constructors, provider factories), ids are minted by a service scoped to
 * the current `EnvironmentInjector`. The server and the browser each own a
 * distinct root injector during hydration, so both platforms start the
 * counter at `1` and — because directives evaluate in the same order on
 * both sides — emit the same id sequence. That eliminates the hydration
 * mismatches a module-scoped counter would cause.
 *
 * **Outside an injection context**: the function falls back to a
 * module-scoped counter. This branch exists for unit tests and utility-style
 * usage; it is NOT SSR-safe and a dev-mode warning is emitted the first
 * time it is hit. Real components/directives should keep calling this from
 * class-field initializers, `constructor`, or provider factories — the
 * injection-context path is unchanged for them.
 *
 * @param prefix - Short tag prepended to the generated id (e.g. `'hint'`,
 *   `'fieldset'`).
 * @returns A string of the form `${prefix}-${n}` where `n` is
 *   monotonically increasing per injector (or per module, in the fallback
 *   branch).
 *
 * @example Inside a component (SSR-safe)
 * ```typescript
 * @Component({ ... })
 * export class NgxFormFieldHintComponent {
 *   readonly #generatedId = createUniqueId('hint');
 * }
 * ```
 *
 * @public
 */
export function createUniqueId(prefix: string): string {
  // The try/catch is narrowed to the `inject()` calls only: those are the
  // only operations that throw specifically because we are outside an
  // injection context (the intended fallback trigger). Running the resolved
  // strategy — whether a user-provided `NGX_SIGNAL_FORM_ID_STRATEGY` or the
  // service's `next()` — must stay outside the catch so a genuine error
  // from either surfaces to the caller instead of being silently masked as
  // "missing injection context" and folded into the module-scoped counter.
  let strategy: (p: string) => string;
  try {
    const override = inject(NGX_SIGNAL_FORM_ID_STRATEGY, { optional: true });
    if (override) {
      strategy = override;
    } else {
      const counter = inject(NgxSignalFormIdCounter);
      strategy = (p) => counter.next(p);
    }
  } catch {
    // Outside an injection context — fall back to a module-scoped counter.
    // This is NOT SSR-safe; warn once in dev to flag non-component usage.
    if (isDevMode() && !warnedFallback) {
      warnedFallback = true;
      // oxlint-disable-next-line no-console -- dev-only diagnostic
      console.warn(
        '[ngx-signal-forms] createUniqueId() called outside an injection context. ' +
          'SSR-safe id generation requires calling this from a component/directive/provider ' +
          'injection context. Falling back to a module-scoped counter.',
      );
    }
    fallbackCounter += 1;
    return `${prefix}-${fallbackCounter}`;
  }
  return strategy(prefix);
}
