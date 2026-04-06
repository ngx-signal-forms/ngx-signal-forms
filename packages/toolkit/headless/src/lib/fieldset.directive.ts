import { computed, Directive, inject, input } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import {
  injectFormContext,
  NGX_SIGNAL_FORMS_CONFIG,
  resolveErrorDisplayStrategy,
  showErrors,
  splitByKind,
  type ErrorDisplayStrategy,
  type SubmittedStatus,
} from '@ngx-signal-forms/toolkit';

import type { ValidationError } from '@angular/forms/signals';
import {
  createFieldStateFlags,
  createUniqueId,
  dedupeValidationErrors,
  readErrors,
} from './utilities';

/**
 * Fieldset state signals exposed by the headless directive.
 */
export interface FieldsetStateSignals {
  /** Aggregated and deduplicated errors from all fields */
  readonly aggregatedErrors: () => ValidationError[];
  /** Aggregated and deduplicated warnings from all fields */
  readonly aggregatedWarnings: () => ValidationError[];
  /** Whether the fieldset has blocking errors */
  readonly hasErrors: () => boolean;
  /** Whether the fieldset has warnings */
  readonly hasWarnings: () => boolean;
  /** Whether to show errors based on strategy */
  readonly shouldShowErrors: () => boolean;
  /** Whether to show warnings based on strategy */
  readonly shouldShowWarnings: () => boolean;
  /** Resolved error display strategy */
  readonly resolvedStrategy: () => ErrorDisplayStrategy;
  /** Resolved submitted status */
  readonly submittedStatus: () => SubmittedStatus;
  /** Fieldset validation state flags */
  readonly isInvalid: () => boolean;
  readonly isValid: () => boolean;
  readonly isTouched: () => boolean;
  readonly isDirty: () => boolean;
  readonly isPending: () => boolean;
  /** Resolved fieldset ID */
  readonly resolvedFieldsetId: () => string;
}

/**
 * Headless fieldset directive for aggregated error state across field groups.
 *
 * Extracts fieldset state logic into a renderless directive that exposes
 * signals for custom fieldset implementations.
 *
 * ## Features
 *
 * - **Aggregated Errors**: Collects errors from all nested fields via `errorSummary()`
 * - **Deduplication**: Same error shown only once even if multiple fields have it
 * - **Warning Support**: Non-blocking warnings (with `warn:` prefix)
 * - **Strategy Aware**: Respects error display strategy from form context
 * - **State Flags**: Exposes invalid, valid, touched, dirty, pending states
 *
 * ## Usage
 *
 * ```html
 * <fieldset
 *   ngxHeadlessFieldset
 *   #fieldset="fieldset"
 *   [fieldsetField]="form.address"
 *   fieldsetId="address"
 * >
 *   <legend>Address</legend>
 *
 *   <input [formField]="form.address.street" />
 *   <input [formField]="form.address.city" />
 *
 *   @if (fieldset.shouldShowErrors() && fieldset.hasErrors()) {
 *     <div class="errors">
 *       @for (error of fieldset.aggregatedErrors(); track error.kind) {
 *         <span>{{ error.message }}</span>
 *       }
 *     </div>
 *   }
 * </fieldset>
 * ```
 *
 * @template TFieldset The type of the fieldset field value
 */
@Directive({
  selector: '[ngxSignalFormHeadlessFieldset]',
  exportAs: 'fieldset',
})
export class NgxHeadlessFieldsetDirective<
  TFieldset = unknown,
> implements FieldsetStateSignals {
  readonly #formContext = injectFormContext();
  readonly #config = inject(NGX_SIGNAL_FORMS_CONFIG, { optional: true });
  readonly #generatedFieldsetId = createUniqueId('fieldset');

  /**
   * The primary fieldset field from Signal Forms.
   */
  readonly fieldsetField = input.required<FieldTree<TFieldset>>();

  /**
   * Optional explicit list of fields to aggregate errors from.
   */
  readonly fields = input<FieldTree<unknown>[] | null>(null);

  /**
   * Unique identifier for the fieldset.
   */
  readonly fieldsetId = input<string | undefined>(undefined);

  /**
   * Error display strategy override.
   */
  readonly strategy = input<ErrorDisplayStrategy | null>(null);

  /**
   * Resolved fieldset ID.
   */
  readonly resolvedFieldsetId = computed(
    () => this.fieldsetId() ?? this.#generatedFieldsetId,
  );

  /**
   * Field state from the fieldset FieldTree.
   */
  readonly #fieldsetState = computed(() => this.fieldsetField()());

  /**
   * Resolved error display strategy.
   */
  readonly resolvedStrategy = computed<ErrorDisplayStrategy>(() => {
    const contextStrategy = this.#formContext?.errorStrategy();

    return resolveErrorDisplayStrategy(
      this.strategy(),
      contextStrategy,
      this.#config?.defaultErrorStrategy ?? 'on-touch',
    );
  });

  /**
   * Resolved submitted status.
   */
  readonly submittedStatus = computed<SubmittedStatus>(
    () => this.#formContext?.submittedStatus() ?? 'unsubmitted',
  );

  /**
   * Show errors signal based on strategy.
   */
  readonly #showErrorsSignal = showErrors(
    this.#fieldsetState,
    this.resolvedStrategy,
    this.submittedStatus,
  );

  /**
   * Aggregated and deduplicated validation messages.
   * Uses shared utilities from utilities.ts.
   */
  readonly #allMessages = computed(() => {
    const override = this.fields();

    if (override && override.length > 0) {
      const messages = override.flatMap((field) => readErrors(field()));
      return dedupeValidationErrors(messages);
    }

    return dedupeValidationErrors(readErrors(this.#fieldsetState()));
  });

  readonly #split = computed(() => splitByKind(this.#allMessages()));

  readonly aggregatedErrors = computed(() => this.#split().blocking);
  readonly aggregatedWarnings = computed(() => this.#split().warnings);
  readonly hasErrors = computed(() => this.#split().blocking.length > 0);
  readonly hasWarnings = computed(() => this.#split().warnings.length > 0);

  /**
   * Whether to show errors based on strategy.
   */
  readonly shouldShowErrors = computed(
    () => this.#showErrorsSignal() && this.hasErrors(),
  );

  /**
   * Whether to show warnings (when no errors present).
   */
  readonly shouldShowWarnings = computed(() => {
    if (this.shouldShowErrors()) {
      return false;
    }
    return this.#showErrorsSignal() && this.hasWarnings();
  });

  readonly #flags = createFieldStateFlags(this.#fieldsetState);

  readonly isInvalid = this.#flags.isInvalid;
  readonly isValid = this.#flags.isValid;
  readonly isTouched = this.#flags.isTouched;
  readonly isDirty = this.#flags.isDirty;
  readonly isPending = this.#flags.isPending;
}
