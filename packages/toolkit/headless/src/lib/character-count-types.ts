/**
 * Shared types and defaults for the character-count pair
 * (`NgxHeadlessCharacterCount` / `createCharacterCount`).
 *
 * Split out so `character-count.ts` (the directive) and `utilities.ts` (the
 * factory, plus other unrelated headless utilities) can both import these
 * without a runtime-value import cycle between them: `character-count.ts`
 * delegates to `createCharacterCount()` from `utilities.ts`, so the reverse
 * edge (`utilities.ts` importing from `character-count.ts`) can't exist —
 * this module is the one-way source both sides depend on instead.
 */

/**
 * Value types supported by the character-count utilities.
 *
 * - `string` — character length
 * - `readonly string[]` — array length (e.g. token inputs where each entry is
 *   one token; reported as "X of N tokens" rather than combined string length)
 * - `null` / `undefined` — treated as length `0`
 *
 * Any other value type is treated as length `0`.
 *
 * Shared by the directive (`field: FieldTree<CharacterCountValue>`) and the
 * factory (`CreateCharacterCountOptions.field`) alike; grouped with its
 * three sibling exports from this module under the directive's section
 * (its primary/canonical consumer) rather than split across two groups.
 *
 * @group Directives
 */
export type CharacterCountValue = string | readonly string[] | null | undefined;

/**
 * Character count limit state.
 *
 * @group Directives
 */
export type CharacterCountLimitState = 'ok' | 'warning' | 'danger' | 'exceeded';

/**
 * Default warning threshold percentage.
 *
 * @group Directives
 */
export const DEFAULT_WARNING_THRESHOLD = 0.8;

/**
 * Default danger threshold percentage.
 *
 * @group Directives
 */
export const DEFAULT_DANGER_THRESHOLD = 0.95;
