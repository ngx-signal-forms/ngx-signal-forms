/**
 * Shared types and defaults for the character-count pair
 * (`NgxHeadlessCharacterCount` / `createCharacterCount`), both defined in
 * `character-count.ts`. Split out into their own module so other headless
 * and assistive files that only need the shape (not the directive or the
 * factory) can import these without pulling in `character-count.ts` itself.
 */

import type { Signal } from '@angular/core';

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

/**
 * Character count state shared by `createCharacterCount()`,
 * `NgxHeadlessCharacterCount`, and `NgxFormFieldCharacterCount`.
 *
 * Replaces the former `CharacterCountResult` (factory) and
 * `CharacterCountStateSignals` (directive) types, which had identical
 * fields — one shared shape for one shared algorithm (issue #510).
 *
 * `resolvedMaxLength` is `null` when no limit is configured and none is
 * auto-detected from the field's `maxLength` validator — check `hasLimit`
 * first. The other signals stay non-nullable with neutral values in that
 * case: `remaining` is `0`, `isExceeded` is `false`, `percentUsed` is `0`,
 * and `limitState` is `'ok'`.
 *
 * @group Directives
 */
export interface CharacterCountState {
  /** Current value length. */
  readonly currentLength: Signal<number>;
  /** Resolved maximum length, or `null` when no limit applies. */
  readonly resolvedMaxLength: Signal<number | null>;
  /** Remaining characters until limit. `0` when no limit applies. */
  readonly remaining: Signal<number>;
  /** Current limit state. `'ok'` when no limit applies. */
  readonly limitState: Signal<CharacterCountLimitState>;
  /** Whether a limit is configured or auto-detected. */
  readonly hasLimit: Signal<boolean>;
  /** Whether the limit has been exceeded. `false` when no limit applies. */
  readonly isExceeded: Signal<boolean>;
  /** Percentage of limit used (0-100+). `0` when no limit applies. */
  readonly percentUsed: Signal<number>;
}
