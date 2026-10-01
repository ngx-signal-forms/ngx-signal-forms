import type { ValidationError } from '@angular/forms/signals';
import { resolveValidationErrorMessage } from '@ngx-signal-forms/toolkit';
import {
  humanizeFieldPath,
  stripAngularFormPrefix,
  type ErrorMessageRegistry,
  type FieldLabelResolver,
} from '@ngx-signal-forms/toolkit/core';

import type { ValidationErrorWithFieldTree } from './field-state-utilities';

/**
 * Error-summary mapping utilities, split out of `utilities.ts` (issue
 * #354): turning a raw `ValidationError` into a focusable, labeled,
 * message-resolved entry ready for an error-summary list. The aggregation
 * *pipeline* that calls these (`createErrorSummaryEntries`) lives in
 * `error-summary.ts`, next to `NgxHeadlessErrorSummary` (issue #512) — this
 * module holds only the per-error mapping functions it composes.
 */

// ============================================================================
// Error Summary Entry Utilities
// ============================================================================

/**
 * A resolved error-summary entry ready for rendering.
 *
 * @group Utility Functions
 */
export interface ErrorSummaryEntryData {
  /**
   * Identity of this entry, unique within one summary list. Use it as the
   * `@for` track key. Treat the value as opaque.
   *
   * Built from the field's unique name (not its label), the error `kind`
   * and the raw validator message. The message is in the key because one
   * field can keep two errors of one kind with different messages. A
   * message that comes from the error-message registry does not change the
   * key. An entry with
   * no bound field never shares a key with a bound one.
   */
  readonly key: string;
  readonly kind: string;
  readonly message: string;
  /** Display label for the field. Not unique: use {@link key} for identity. */
  readonly fieldName: string;
  readonly focus: () => void;
  /**
   * Whether {@link focus} can move focus to a real control.
   *
   * `false` for an error with no bound field (e.g. a custom validator that
   * does not run through `error.fieldTree()`, or a field whose state does
   * not expose `focusBoundControl()`). A consumer should render such an
   * entry as plain text — a link or button that calls a no-op `focus()`
   * looks interactive but does nothing, which fails WCAG 4.1.2.
   *
   * **Limit**: this only checks that `focusBoundControl` exists as a
   * function, not that it actually moves focus. A real field whose control
   * was never bound in the DOM (no `[formField]` rendered for it) still has
   * a working `fieldTree()`/`focusBoundControl()`, so `canFocus` is `true`
   * even though calling `focus()` is a silent no-op in that case. This
   * `false` path only catches errors with no `fieldTree` at all.
   */
  readonly canFocus: boolean;
}

/**
 * Deduplicate validation errors **per originating field** by kind + message
 * + field identity.
 *
 * This is deliberately distinct from `dedupeValidationErrors` (kept in
 * `utilities.ts`), which `NgxHeadlessFieldset` uses to collapse the *same*
 * message repeated across a group into one grouped entry — a documented
 * feature, not a bug. An error-summary entry, by contrast, represents one
 * field's error; two different fields that both fail `required()` with no
 * custom message (Angular's default `ValidationError.message` is
 * `undefined`) share the key `'required::'` under a message-blind dedupe
 * and one of them would be silently dropped from the summary, violating
 * WCAG 3.3.1 (the dropped field's error is never listed and never
 * reachable via `focus()`).
 *
 * Errors without a resolvable `fieldTree` (e.g. from custom validators)
 * fall back to the field-blind key so they still dedupe sensibly among
 * themselves.
 *
 * @param errors - Array of ValidationError to deduplicate
 * @returns Deduplicated array preserving first occurrence order
 *
 * @internal
 */
export function dedupeValidationErrorsByField(
  errors: readonly ValidationError[],
): ValidationError[] {
  const seen = new Set<string>();
  const result: ValidationError[] = [];

  for (const error of errors) {
    const key = errorSummaryEntryKey(error);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(error);
  }

  return result;
}

/**
 * The {@link ErrorSummaryEntryData.key} for an error: the field's unique
 * name (or `null` when there is no bound field), the kind and the raw
 * message. JSON encoding keeps the parts apart, so no field name or message
 * can make two different errors produce the same key.
 */
function errorSummaryEntryKey(error: ValidationError): string {
  return JSON.stringify([
    fieldIdentity(error),
    error.kind,
    error.message ?? '',
  ]);
}

function fieldIdentity(error: ValidationError): string | null {
  const e = error as ValidationErrorWithFieldTree;
  if (typeof e.fieldTree === 'function') {
    const fieldState = e.fieldTree();
    if (fieldState && typeof fieldState.name === 'function') {
      return fieldState.name();
    }
  }
  return null;
}

/**
 * Whether a `ValidationError` has a bound field that can actually receive
 * focus.
 *
 * `toErrorSummaryEntry()` calls this for `canFocus` and again before
 * `focus()` touches `fieldTree()`, so the two cannot drift apart. Kept internal:
 * `canFocus` on `ErrorSummaryEntryData` is the public surface consumers
 * should read instead of re-deriving this themselves.
 *
 * @internal
 */
export function errorHasFocusableTarget(error: ValidationError): boolean {
  const e = error as ValidationErrorWithFieldTree;
  if (typeof e.fieldTree !== 'function') return false;

  const fieldState = e.fieldTree();
  return !!fieldState && typeof fieldState.focusBoundControl === 'function';
}

/**
 * Maps a `ValidationError` into an `ErrorSummaryEntryData` with resolved
 * message, field name, and focus callback.
 *
 * The field name comes from the duck-typed `error.fieldTree().name()` with
 * the Angular internal prefix stripped. It falls back to the error's `kind`
 * when the field tree is not available. `focus()` calls
 * `error.fieldTree().focusBoundControl()`, guarded by
 * {@link errorHasFocusableTarget} so it never disagrees with `canFocus`.
 *
 * Public consumers reach this through `createErrorSummaryEntries()`.
 *
 * @param error - The validation error to map
 * @param registry - Error message registry for 3-tier message resolution
 * @param options - Settings (e.g. `{ stripWarningPrefix: true }`)
 * @param labelResolver - Optional field-label resolver; receives the field
 *   path **without** the Angular internal prefix. Falls back to
 *   `humanizeFieldPath` when `undefined`.
 *
 * @internal
 */
export function toErrorSummaryEntry(
  error: ValidationError,
  registry?: Readonly<ErrorMessageRegistry> | null,
  options?: Readonly<{ stripWarningPrefix?: boolean }>,
  labelResolver?: FieldLabelResolver | null,
): ErrorSummaryEntryData {
  const message = resolveValidationErrorMessage(error, registry, options);
  const resolve = labelResolver ?? humanizeFieldPath;
  const boundName = fieldIdentity(error);
  const fieldName = resolve(
    boundName === null ? error.kind : stripAngularFormPrefix(boundName),
  );

  return {
    key: errorSummaryEntryKey(error),
    kind: error.kind,
    message,
    fieldName,
    canFocus: errorHasFocusableTarget(error),
    focus: () => {
      if (!errorHasFocusableTarget(error)) return;

      (error as ValidationErrorWithFieldTree)
        .fieldTree?.()
        ?.focusBoundControl?.();
    },
  };
}
