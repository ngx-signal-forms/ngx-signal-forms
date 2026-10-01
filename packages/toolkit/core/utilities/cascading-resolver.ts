type Nullable<T> = T | null | undefined;

/**
 * Options for a cascading resolver.
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
 * @internal
 */
export function createCascadingResolver<T>(
  opts: StaticCascadingResolverOptions<T>,
): T {
  return opts.input ?? opts.context ?? opts.configDefault ?? opts.fallback;
}
