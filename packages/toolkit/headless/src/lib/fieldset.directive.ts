import { computed, Directive, input, type Signal } from '@angular/core';
import type { FieldState, FieldTree } from '@angular/forms/signals';
import {
  injectFormConfig,
  injectFormContext,
  isBlockingError,
  isWarningError,
  showErrors,
  unwrapValue,
  type ErrorDisplayStrategy,
  type ReactiveOrStatic,
  type SubmittedStatus,
} from '@ngx-signal-forms/toolkit';

import type { ValidationError } from '@angular/forms/signals';
import {
  createUniqueId,
  dedupeValidationErrors,
  readErrors,
  readFieldFlag,
} from './utilities';

/**
 * Fieldset state signals exposed by the headless directive.
 */
export interface FieldsetStateSignals {
  /** Aggregated and deduplicated errors from all fields */
  readonly aggregatedErrors: Signal<ValidationError[]>;
  /** Aggregated and deduplicated warnings from all fields */
  readonly aggregatedWarnings: Signal<ValidationError[]>;
  /** Whether the fieldset has blocking errors */
  readonly hasErrors: Signal<boolean>;
  /** Whether the fieldset has warnings */
  readonly hasWarnings: Signal<boolean>;
  /** Whether to show errors based on strategy */
  readonly shouldShowErrors: Signal<boolean>;
  /** Whether to show warnings based on strategy */
  readonly shouldShowWarnings: Signal<boolean>;
  /** Resolved error display strategy */
  readonly resolvedStrategy: Signal<ErrorDisplayStrategy>;
  /** Resolved submitted status */
  readonly submittedStatus: Signal<SubmittedStatus>;
  /** Fieldset validation state flags */
  readonly isInvalid: Signal<boolean>;
  readonly isValid: Signal<boolean>;
  readonly isTouched: Signal<boolean>;
  readonly isDirty: Signal<boolean>;
  readonly isPending: Signal<boolean>;
  /** Resolved fieldset ID */
  readonly resolvedFieldsetId: Signal<string>;
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
  readonly #config = injectFormConfig();
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
  readonly strategy = input<ReactiveOrStatic<ErrorDisplayStrategy> | null>(
    null,
  );

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
    const provided = this.strategy();
    if (provided !== null && provided !== undefined) {
      const resolved = unwrapValue(provided);
      if (resolved !== 'inherit') {
        return resolved;
      }
    }

    const contextStrategy = this.#formContext?.errorStrategy?.();
    if (contextStrategy) {
      return contextStrategy;
    }

    const configured = this.#config.defaultErrorStrategy;
    return unwrapValue(configured);
  });

  /**
   * Resolved submitted status.
   */
  readonly submittedStatus = computed<SubmittedStatus>(
    () => this.#formContext?.submittedStatus?.() ?? 'unsubmitted',
  );

  /**
   * Show errors signal based on strategy.
   */
  readonly #showErrorsSignal = showErrors(
    this.#fieldsetState as () => FieldState<TFieldset>,
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

  /**
   * Blocking errors from all fields.
   */
  readonly aggregatedErrors = computed(() =>
    this.#allMessages().filter(isBlockingError),
  );

  /**
   * Warning errors from all fields.
   */
  readonly aggregatedWarnings = computed(() =>
    this.#allMessages().filter(isWarningError),
  );

  /**
   * Whether the fieldset has blocking errors.
   */
  readonly hasErrors = computed(() => this.aggregatedErrors().length > 0);

  /**
   * Whether the fieldset has warnings.
   */
  readonly hasWarnings = computed(() => this.aggregatedWarnings().length > 0);

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

  /**
   * Fieldset validation state flags.
   * Uses shared readFieldFlag utility.
   */
  readonly isInvalid = computed(() =>
    readFieldFlag(this.#fieldsetState(), 'invalid'),
  );

  readonly isValid = computed(() =>
    readFieldFlag(this.#fieldsetState(), 'valid'),
  );

  readonly isTouched = computed(() =>
    readFieldFlag(this.#fieldsetState(), 'touched'),
  );

  readonly isDirty = computed(() =>
    readFieldFlag(this.#fieldsetState(), 'dirty'),
  );

  readonly isPending = computed(() =>
    readFieldFlag(this.#fieldsetState(), 'pending'),
  );
}
