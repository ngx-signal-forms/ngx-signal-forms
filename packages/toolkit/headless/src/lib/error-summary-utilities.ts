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
 * *pipeline* that calls these (`createErrorSummaryEntries`) stays in
 * `utilities.ts` alongside the other factories — this module holds only the
 * per-error mapping functions it composes.
 */

// ============================================================================
// Error Summary Entry Utilities
// ============================================================================

/**
 * A resolved error-summary entry ready for rendering.
 */
export interface ErrorSummaryEntryData {
  readonly kind: string;
  readonly message: string;
  readonly fieldName: string;
  readonly focus: () => void;
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
    const key = `${fieldIdentityKey(error)}::${error.kind}::${error.message ?? ''}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(error);
  }

  return result;
}

function fieldIdentityKey(error: ValidationError): string {
  const e = error as ValidationErrorWithFieldTree;
  if (typeof e.fieldTree === 'function') {
    const fieldState = e.fieldTree();
    if (fieldState && typeof fieldState.name === 'function') {
      return fieldState.name();
    }
  }
  return '';
}

/**
 * Resolve the field name from a `ValidationError` via duck-typed access
 * to `error.fieldTree().name()`.
 *
 * Falls back to the error's `kind` when the field tree is not available.
 *
 * @param error - The validation error to extract a field name from
 * @param resolver - Optional custom resolver; receives the field path
 *   **without** the Angular internal prefix. Falls back to
 *   `humanizeFieldPath` when `undefined`.
 *
 * @public
 */
export function resolveFieldNameFromError(
  error: ValidationError,
  resolver?: FieldLabelResolver | null,
): string {
  const resolve = resolver ?? humanizeFieldPath;

  const e = error as ValidationErrorWithFieldTree;
  if (typeof e.fieldTree === 'function') {
    const fieldState = e.fieldTree();
    if (fieldState && typeof fieldState.name === 'function') {
      const stripped = stripAngularFormPrefix(fieldState.name());
      return resolve(stripped);
    }
  }

  return resolve(error.kind);
}

/**
 * Focus the form control bound to the field that produced a validation error.
 *
 * Uses duck-typed access to `error.fieldTree().focusBoundControl()`.
 *
 * @public
 */
export function focusBoundControlFromError(error: ValidationError): void {
  const e = error as ValidationErrorWithFieldTree;
  if (typeof e.fieldTree === 'function') {
    const fieldState = e.fieldTree();
    if (fieldState && typeof fieldState.focusBoundControl === 'function') {
      fieldState.focusBoundControl();
    }
  }
}

/**
 * Maps a `ValidationError` into an `ErrorSummaryEntryData` with resolved
 * message, field name, and focus callback.
 *
 * @param error - The validation error to map
 * @param registry - Error message registry for 3-tier message resolution
 * @param options - Settings (e.g. `{ stripWarningPrefix: true }`)
 * @param labelResolver - Optional field-label resolver; falls back to
 *   `humanizeFieldPath` when `undefined`
 *
 * @public
 */
export function toErrorSummaryEntry(
  error: ValidationError,
  registry?: Readonly<ErrorMessageRegistry> | null,
  options?: Readonly<{ stripWarningPrefix?: boolean }>,
  labelResolver?: FieldLabelResolver | null,
): ErrorSummaryEntryData {
  const message = resolveValidationErrorMessage(error, registry, options);
  const fieldName = resolveFieldNameFromError(error, labelResolver);

  return {
    kind: error.kind,
    message,
    fieldName,
    focus: () => {
      focusBoundControlFromError(error);
    },
  };
}
