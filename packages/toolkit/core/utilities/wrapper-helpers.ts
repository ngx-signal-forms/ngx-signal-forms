import { computed, type Signal } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import type { NgxSignalFormHintDescriptor } from '../tokens';
import type { ResolvedErrorDisplayStrategy, SubmittedStatus } from '../types';

/**
 * Structural shape of a hint primitive consumed by
 * {@link toHintDescriptors}. Matches `NgxFormFieldHint` from
 * `@ngx-signal-forms/toolkit/assistive` but is declared structurally so
 * `/core` does not depend on `/assistive`.
 *
 * @public
 */
export interface HintLike {
  resolvedId: () => string;
  resolvedFieldName: () => string | null;
}

/**
 * Maps a `Signal<readonly HintLike[]>` (typically the output of
 * `contentChildren(NgxFormFieldHint)`) to the wire format consumed by
 * {@link import('../field-context-token').NGX_SIGNAL_FORM_HINT_REGISTRY}
 * and {@link import('./aria/create-hint-ids-signal').createHintIdsSignal}.
 *
 * Replaces the ad-hoc `computed(() => hints().map(h => ({ id, fieldName })))`
 * boilerplate that every form-field wrapper otherwise reimplements.
 *
 * @example
 * ```ts
 * protected readonly hintChildren = contentChildren(NgxFormFieldHint, {
 *   descendants: true,
 * });
 *
 * readonly hintDescriptors = toHintDescriptors(this.hintChildren);
 * ```
 *
 * @public
 */
export function toHintDescriptors(
  hints: Signal<readonly HintLike[]>,
): Signal<readonly NgxSignalFormHintDescriptor[]> {
  return computed(() =>
    hints().map((hint) => ({
      id: hint.resolvedId(),
      fieldName: hint.resolvedFieldName(),
    })),
  );
}

/**
 * Inputs handed to a renderer-token-resolved error component (the
 * `NGX_FORM_FIELD_ERROR_RENDERER` contract). Exposed as a named type so
 * custom renderers and {@link createErrorRendererInputs} stay in lockstep.
 *
 * @public
 */
export interface NgxFormFieldErrorRendererInputs<TValue = unknown> {
  readonly formField: FieldTree<TValue>;
  readonly strategy: ResolvedErrorDisplayStrategy;
  readonly submittedStatus: SubmittedStatus;
}

/**
 * Inputs for {@link createErrorRendererInputs}.
 *
 * @public
 */
export interface CreateErrorRendererInputsOptions<TValue = unknown> {
  readonly formField: Signal<FieldTree<TValue>>;
  readonly strategy: Signal<ResolvedErrorDisplayStrategy>;
  readonly submittedStatus: Signal<SubmittedStatus>;
}

/**
 * Builds the `inputs:` map handed to `*ngComponentOutlet` when mounting a
 * renderer-token-resolved error component. Returns a `Signal<Record<string,
 * unknown>>` (the shape `*ngComponentOutlet` expects) backed by a strongly-
 * typed {@link NgxFormFieldErrorRendererInputs} value.
 *
 * Replaces the ad-hoc `computed<Record<string, unknown>>(() => ({
 * formField: …, strategy: …, submittedStatus: … }))` boilerplate that
 * every form-field wrapper otherwise reimplements. Keeping a single
 * canonical builder prevents drift between wrappers if the renderer
 * contract evolves.
 *
 * @example
 * ```ts
 * protected readonly errorInputs = createErrorRendererInputs({
 *   formField: this.formField,
 *   strategy: this.effectiveStrategy,
 *   submittedStatus: this.submittedStatus,
 * });
 * ```
 *
 * @public
 */
export function createErrorRendererInputs<TValue>(
  options: CreateErrorRendererInputsOptions<TValue>,
): Signal<Record<string, unknown>> {
  const { formField, strategy, submittedStatus } = options;
  return computed<Record<string, unknown>>(() => ({
    formField: formField(),
    strategy: strategy(),
    submittedStatus: submittedStatus(),
  }));
}
