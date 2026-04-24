import { computed, isDevMode, isSignal, type Signal } from '@angular/core';

/**
 * The tier that produced the resolved value in a cascading resolver.
 *
 * Attached to the resolved object in dev mode via {@link CASCADING_SOURCE}.
 *
 * @internal
 */
export type CascadingTier = 'input' | 'context' | 'configDefault' | 'fallback';

/**
 * Symbol used to attach the winning tier to resolved objects in dev mode.
 *
 * Only present when `isDevMode()` returns true and the resolved value is a
 * non-null object. Attach point is enumerable-false so it remains invisible
 * to serializers and `Object.keys()`.
 *
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Symbol-keyed property
export const CASCADING_SOURCE: unique symbol = Symbol(
  'ngxSignalForms.cascadingSource',
);

type Nullable<T> = T | null | undefined;
type MaybeSignal<T> = Signal<T> | T;

/**
 * Options for a fully static cascading resolver (no signals).
 *
 * Tiers are evaluated in order: `input` → `context` → `configDefault` →
 * `fallback`. The first non-nullish value wins. `fallback` is always
 * non-nullish so the resolver never returns `undefined`.
 *
 * @internal
 */
export interface StaticCascadingResolverOptions<T> {
  /** Highest-priority tier. Wins when non-nullish. */
  readonly input: Nullable<T>;
  /** Optional second tier (e.g. form context). Wins when `input` is nullish. */
  readonly context?: Nullable<T>;
  /**
   * Optional third tier (e.g. injected config default). Wins when `input` and
   * `context` are both nullish.
   */
  readonly configDefault?: Nullable<T>;
  /** Lowest-priority tier. Always non-nullish — the ultimate hardcoded default. */
  readonly fallback: T;
}

/**
 * Options for a reactive cascading resolver (at least one Signal tier).
 *
 * Any tier may be a `Signal<T | null | undefined>`. When any tier is
 * reactive the resolver returns a `Signal<T>` instead of a plain `T`.
 *
 * @internal
 */
export interface ReactiveCascadingResolverOptions<T> {
  readonly input: MaybeSignal<Nullable<T>>;
  readonly context?: MaybeSignal<Nullable<T>>;
  readonly configDefault?: MaybeSignal<Nullable<T>>;
  readonly fallback: MaybeSignal<T>;
}

// oxlint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- MaybeSignal<T> includes Signal<T> (a function) which cannot be Readonly<>-wrapped
function readNullable<T>(tier: MaybeSignal<Nullable<T>>): Nullable<T> {
  return isSignal(tier) ? tier() : tier;
}

// oxlint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- same Signal<T> footgun as readNullable above
function readRequired<T>(tier: MaybeSignal<T>): T {
  // Signal<T> is callable: tier() returns T. TypeScript narrows from Signal<T> | T.
  return isSignal(tier) ? tier() : tier;
}

function resolveTiers<T>(
  // oxlint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- all properties are already readonly; Readonly<ReactiveCascadingResolverOptions<T>> is redundant
  opts: ReactiveCascadingResolverOptions<T>,
): { value: T; source: CascadingTier } {
  const input = readNullable(opts.input);
  // eslint-disable-next-line eqeqeq -- intentional: single check accepts both null and undefined
  if (input != null) return { value: input, source: 'input' };

  if (opts.context !== undefined) {
    const context = readNullable(opts.context);
    // eslint-disable-next-line eqeqeq -- intentional: single check accepts both null and undefined
    if (context != null) return { value: context, source: 'context' };
  }

  if (opts.configDefault !== undefined) {
    const configDefault = readNullable(opts.configDefault);
    // eslint-disable-next-line eqeqeq -- intentional: single check accepts both null and undefined
    if (configDefault != null)
      return { value: configDefault, source: 'configDefault' };
  }

  return { value: readRequired(opts.fallback), source: 'fallback' };
}

function attachSource<T>(value: T, source: CascadingTier): T {
  if (isDevMode() && value !== null && typeof value === 'object') {
    Object.defineProperty(value, CASCADING_SOURCE, {
      configurable: true,
      enumerable: false,
      value: source,
      writable: true,
    });
  }
  return value;
}

/**
 * Resolves a value from an ordered cascade of up to four tiers, using
 * nullish-only short-circuit semantics: `null` and `undefined` fall through;
 * any other value — including `''`, `0`, and `false` — wins.
 *
 * ## Tiers (highest to lowest priority)
 * 1. `input` — explicit consumer override
 * 2. `context` — form/component context injection (optional)
 * 3. `configDefault` — injected provider default (optional)
 * 4. `fallback` — hardcoded toolkit default (always non-nullish)
 *
 * ## Return type
 * - **All tiers static** (`T | null | undefined`) → returns `T` directly.
 * - **At least one tier is a `Signal`** → returns `Signal<T>` wrapping a
 *   `computed()` that re-evaluates whenever reactive tiers change.
 *
 * ## Dev-mode introspection
 * When `isDevMode()` is true and the resolved value is a non-null object, a
 * non-enumerable {@link CASCADING_SOURCE} symbol property is attached reporting
 * the winning tier name. Zero overhead in production (tree-shaken via
 * `isDevMode()` guard).
 *
 * @example Static cascade
 * ```typescript
 * const value = createCascadingResolver({
 *   input: userConfig.requiredMarker,      // '' → wins (preserves empty string)
 *   configDefault: parentConfig?.requiredMarker,
 *   fallback: DEFAULT_CONFIG.requiredMarker,
 * });
 * // value: string
 * ```
 *
 * @example Reactive cascade
 * ```typescript
 * const value$ = createCascadingResolver({
 *   input: inputSignal,          // Signal<string | null | undefined>
 *   configDefault: configSignal, // Signal<string | null | undefined>
 *   fallback: 'default',
 * });
 * // value$: Signal<string>
 * ```
 *
 * @internal
 */
// oxlint-disable @typescript-eslint/prefer-readonly-parameter-types -- all option interfaces use `readonly` properties; the outer Readonly<> wrapper is structurally equivalent and would add noise at call sites
export function createCascadingResolver<T>(
  opts: StaticCascadingResolverOptions<T>,
): T;
export function createCascadingResolver<T>(
  opts: ReactiveCascadingResolverOptions<T>,
): Signal<T>;
export function createCascadingResolver<T>(
  opts: StaticCascadingResolverOptions<T> | ReactiveCascadingResolverOptions<T>,
): T | Signal<T> {
  const hasReactive =
    isSignal(opts.input) ||
    (opts.context !== undefined && isSignal(opts.context)) ||
    (opts.configDefault !== undefined && isSignal(opts.configDefault)) ||
    isSignal(opts.fallback);

  if (hasReactive) {
    return computed(() => {
      const { value, source } = resolveTiers(
        opts as ReactiveCascadingResolverOptions<T>,
      );
      return attachSource(value, source);
    });
  }

  const { value, source } = resolveTiers(
    opts as ReactiveCascadingResolverOptions<T>,
  );
  return attachSource(value, source);
}
// oxlint-enable @typescript-eslint/prefer-readonly-parameter-types
