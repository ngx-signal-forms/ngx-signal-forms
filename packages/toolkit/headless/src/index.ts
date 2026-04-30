/**
 * `@ngx-signal-forms/toolkit/headless`
 *
 * Headless (renderless) primitives for Angular Signal Forms.
 *
 * These directives expose state signals without rendering any UI,
 * enabling custom form implementations with full control over styling.
 *
 * @packageDocumentation
 */

// Import directives for bundle
import { NgxHeadlessCharacterCount } from './lib/character-count';
import { NgxHeadlessErrorState } from './lib/error-state';
import { NgxHeadlessErrorSummary } from './lib/error-summary';
import { NgxHeadlessFieldName } from './lib/field-name';
import { NgxHeadlessFieldset } from './lib/fieldset';
import { NgxHeadlessNotification } from './lib/notification';

// Directives
export {
  NgxHeadlessErrorState,
  type ErrorStateSignals,
  type ResolvedError,
} from './lib/error-state';

export { NgxHeadlessFieldset, type FieldsetStateSignals } from './lib/fieldset';

export {
  DEFAULT_DANGER_THRESHOLD,
  DEFAULT_WARNING_THRESHOLD,
  NgxHeadlessCharacterCount,
  type CharacterCountLimitState,
  type CharacterCountStateSignals,
} from './lib/character-count';

export {
  NgxHeadlessErrorSummary,
  type ErrorSummaryEntry,
  type ErrorSummarySignals,
} from './lib/error-summary';

export {
  NgxHeadlessFieldName,
  type FieldNameStateSignals,
} from './lib/field-name';

export {
  NgxHeadlessNotification,
  type NgxNotificationTone,
  type NotificationStateSignals,
  type ResolvedNotificationMessage,
} from './lib/notification';

// ARIA primitives — sourced from `/core` to keep the directive shell
// (`NgxSignalFormAutoAria`) and the headless re-export in lockstep without
// duplicating implementation or forming a cycle through this barrel.
export {
  createAriaDescribedBySignal,
  createAriaInvalidSignal,
  createAriaRequiredSignal,
  createHintIdsSignal,
  type AriaDescribedByFieldNameReader,
  type AriaDescribedByPreservedIdsReader,
  type AriaRequiredFieldState,
  type CreateAriaDescribedBySignalOptions,
  type CreateHintIdsSignalOptions,
  type HintIdsFieldNameReader,
  type HintIdsIdentityLike,
  type HintIdsRegistryLike,
  type HintIdsSignal,
} from '@ngx-signal-forms/toolkit/core';

// Utility functions
export {
  createCharacterCount,
  createErrorState,
  createFieldStateFlags,
  createUniqueId,
  dedupeValidationErrors,
  focusBoundControlFromError,
  humanizeFieldPath,
  readDirectErrors,
  readErrors,
  readFieldFlag,
  resolveFieldNameFromError,
  toErrorSummaryEntry,
  type BooleanStateKey,
  type CharacterCountResult,
  type CharacterCountValue,
  type CreateCharacterCountOptions,
  type CreateErrorStateOptions,
  type ErrorStateResult,
  type ErrorSummaryEntryData,
  type FieldStateLike,
  type FieldStateFlags,
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
  NgxHeadlessErrorState,
  NgxHeadlessErrorSummary,
  NgxHeadlessFieldset,
  NgxHeadlessCharacterCount,
  NgxHeadlessFieldName,
  NgxHeadlessNotification,
] as const;
