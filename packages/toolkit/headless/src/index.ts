/**
 * @ngx-signal-forms/toolkit/headless
 *
 * Headless (renderless) primitives for Angular Signal Forms.
 *
 * These directives expose state signals without rendering any UI,
 * enabling custom form implementations with full control over styling.
 *
 * @packageDocumentation
 */

// Import directives for bundle
import { NgxHeadlessCharacterCountDirective } from './lib/character-count.directive';
import { NgxHeadlessErrorStateDirective } from './lib/error-state.directive';
import { NgxHeadlessFieldNameDirective } from './lib/field-name.directive';
import { NgxHeadlessFieldsetDirective } from './lib/fieldset.directive';

// Directives
export {
  NgxHeadlessErrorStateDirective,
  type ErrorStateSignals,
  type ResolvedError,
} from './lib/error-state.directive';

export {
  NgxHeadlessFieldsetDirective,
  type FieldsetStateSignals,
} from './lib/fieldset.directive';

export {
  DEFAULT_DANGER_THRESHOLD,
  DEFAULT_WARNING_THRESHOLD,
  NgxHeadlessCharacterCountDirective,
  type CharacterCountLimitState,
  type CharacterCountStateSignals,
} from './lib/character-count.directive';

export {
  NgxHeadlessFieldNameDirective,
  type FieldNameStateSignals,
} from './lib/field-name.directive';

// Utility functions
export {
  createCharacterCount,
  createErrorState,
  createUniqueId,
  dedupeValidationErrors,
  readErrors,
  readFieldFlag,
  type BooleanStateKey,
  type CharacterCountResult,
  type CreateCharacterCountOptions,
  type CreateErrorStateOptions,
  type ErrorStateResult,
  type FieldStateLike,
} from './lib/utilities';

/**
 * Bundle of all headless directives for easy importing.
 *
 * @example
 * ```typescript
 * import { NgxHeadlessToolkit } from '@ngx-signal-forms/toolkit/headless';
 *
 * @Component({
 *   imports: [NgxHeadlessToolkit],
 *   template: `...`
 * })
 * export class MyComponent {}
 * ```
 */
export const NgxHeadlessToolkit = [
  NgxHeadlessErrorStateDirective,
  NgxHeadlessFieldsetDirective,
  NgxHeadlessCharacterCountDirective,
  NgxHeadlessFieldNameDirective,
] as const;
