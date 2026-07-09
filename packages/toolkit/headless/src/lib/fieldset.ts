import {
  booleanAttribute,
  computed,
  Directive,
  inject,
  input,
  type Signal,
} from '@angular/core';
import type { FieldTree, ValidationError } from '@angular/forms/signals';
import {
  injectFormContext,
  NGX_SIGNAL_FORMS_CONFIG,
  readDirectErrors,
  resolveStrategyFromContext,
  resolveSubmittedStatusFromContext,
  showErrors,
  splitByKind,
  type ErrorDisplayStrategy,
  type ResolvedErrorDisplayStrategy,
  type SubmittedStatus,
} from '@ngx-signal-forms/toolkit';
import { NGX_ERROR_MESSAGES } from '@ngx-signal-forms/toolkit/core';

import type { ResolvedError } from './error-state';
import {
  createFieldStateFlags,
  createUniqueId,
  dedupeValidationErrors,
  readErrors,
  resolveErrorMessage,
} from './utilities';

/**
 * Fieldset state signals exposed by the headless directive.
 */
export interface FieldsetStateSignals {
  /** Aggregated and deduplicated errors from all fields */
  readonly aggregatedErrors: Signal<readonly ValidationError[]>;
  /** Aggregated and deduplicated warnings from all fields */
  readonly aggregatedWarnings: Signal<readonly ValidationError[]>;
  /**
   * {@link aggregatedErrors}, resolved to display messages via the same
   * 3-tier priority (validator message → `NGX_ERROR_MESSAGES` registry →
   * default) as `NgxHeadlessErrorState.resolvedErrors`. Framework-default
   * errors (e.g. `required(path.x)` with no `message` option) have an
   * `undefined` `ValidationError.message` — reach for this instead of
   * rendering `error.message` directly.
   */
  readonly resolvedErrors: Signal<readonly ResolvedError[]>;
  /** {@link aggregatedWarnings}, resolved the same way as {@link resolvedErrors}. */
  readonly resolvedWarnings: Signal<readonly ResolvedError[]>;
  /** Whether the fieldset has blocking errors */
  readonly hasErrors: Signal<boolean>;
  /** Whether the fieldset has warnings */
  readonly hasWarnings: Signal<boolean>;
  /** Whether to show errors based on strategy */
  readonly shouldShowErrors: Signal<boolean>;
  /** Whether to show warnings based on {@link resolvedWarningStrategy} */
  readonly shouldShowWarnings: Signal<boolean>;
  /**
   * Resolved error display strategy. Always a concrete strategy
   * (`'immediate'`, `'on-touch'`, or `'on-submit'`) — `'inherit'` is
   * resolved against the form context / config default before exposure.
   */
  readonly resolvedStrategy: Signal<ResolvedErrorDisplayStrategy>;
  /**
   * Resolved warning display strategy, independent of {@link resolvedStrategy}
   * (which only governs blocking errors). Always a concrete strategy.
   */
  readonly resolvedWarningStrategy: Signal<ResolvedErrorDisplayStrategy>;
  /** Resolved submitted status (from input override, form context, or default) */
  readonly resolvedSubmittedStatus: Signal<SubmittedStatus>;
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
 * - **Warning Support**: Non-blocking warnings (with `warn:` prefix), timed independently
 *   of blocking errors via `warningStrategy` (defaults to `'immediate'`)
 * - **Strategy Aware**: Respects error display strategy from form context
 * - **State Flags**: Exposes invalid, valid, touched, dirty, pending states
 * - **Nested Control**: `includeNestedErrors` toggles between aggregated and direct errors
 *
 * ## Usage
 *
 * ```html
 * <fieldset
 *   ngxHeadlessFieldset
 *   #fieldset="fieldset"
 *   [field]="form.address"
 *   fieldsetId="address"
 * >
 *   <legend>Address</legend>
 *
 *   <input [formField]="form.address.street" />
 *   <input [formField]="form.address.city" />
 *
 *   @if (fieldset.shouldShowErrors() && fieldset.hasErrors()) {
 *     <div class="errors">
 *       @for (error of fieldset.resolvedErrors(); track error.kind) {
 *         <span>{{ error.message }}</span>
 *       }
 *     </div>
 *   }
 * </fieldset>
 * ```
 *
 * Use {@link resolvedErrors} / {@link resolvedWarnings} (not
 * `aggregatedErrors()[i].message`) when rendering — `ValidationError.message`
 * is `undefined` for framework-default errors (e.g. `required(path.x)` with
 * no `message` option), so reading it directly renders an empty string for
 * the most common validator usage. `resolvedErrors`/`resolvedWarnings` apply
 * the same 3-tier message priority (validator message → `NGX_ERROR_MESSAGES`
 * registry → default) as `NgxHeadlessErrorState`.
 *
 * @template TFieldset The type of the fieldset field value
 */
@Directive({
  selector: '[ngxHeadlessFieldset]',
  exportAs: 'fieldset',
})
export class NgxHeadlessFieldset<
  TFieldset = unknown,
> implements FieldsetStateSignals {
  readonly #formContext = injectFormContext();
  readonly #config = inject(NGX_SIGNAL_FORMS_CONFIG, { optional: true });
  readonly #errorMessagesRegistry = inject(NGX_ERROR_MESSAGES, {
    optional: true,
  });
  readonly #generatedFieldsetId = createUniqueId('fieldset');

  /**
   * The primary fieldset field from Signal Forms.
   */
  readonly field = input.required<FieldTree<TFieldset>>();

  /**
   * Optional explicit list of fields to aggregate errors from.
   *
   * `null` (default/unbound) means "not provided" — the fieldset aggregates
   * its own field's errors (via `errorSummary()`/`errors()`, gated by
   * {@link includeNestedErrors}). An explicitly bound empty array (`[]`) is
   * a distinct, intentional state — "aggregate nothing" — for consumers that
   * dynamically compute the field list and it can legitimately become
   * empty; it does not fall back to the fieldset's own errors.
   */
  readonly fields = input<readonly FieldTree<unknown>[] | null>(null);

  /**
   * Unique identifier for the fieldset.
   */
  readonly fieldsetId = input<string | undefined>();

  /**
   * Error display strategy override.
   * If undefined, inherits from form context or defaults to 'on-touch'.
   */
  readonly strategy = input<ErrorDisplayStrategy | undefined>();

  /**
   * Warning display strategy override, independent of {@link strategy}
   * (which only governs blocking errors). Mirrors the contract already
   * established by `NgxFormFieldWrapper.warningStrategy` /
   * `NgxFormFieldError.warningStrategy`: non-blocking warnings default to
   * `'immediate'` so advisory feedback stays visible even while blocking
   * errors are gated by `'on-touch'` / `'on-submit'`.
   *
   * Resolution order differs from {@link strategy} on purpose:
   * - Explicitly set (including `'inherit'`) → resolved against the ambient
   *   form context (`resolveStrategyFromContext`), falling back to
   *   `'on-touch'` if there is none.
   * - Left unset (`undefined`) → `'immediate'` directly, WITHOUT consulting
   *   the form context or `NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy`.
   *
   * This asymmetry (vs. {@link strategy}'s context/config cascade) is
   * intentional and matches the wrapper/error-renderer contract exactly —
   * an unset `warningStrategy` must not silently inherit an ambient
   * `'on-submit'` strategy meant for blocking errors.
   *
   * @default `'immediate'`
   */
  readonly warningStrategy = input<ErrorDisplayStrategy | undefined>();

  /**
   * Form submission status override.
   * If not provided, inherits from form context.
   */
  readonly submittedStatus = input<SubmittedStatus | undefined>();

  /**
   * Whether to include nested field errors in the aggregated display.
   *
   * - `false` (default): Surface direct group-level errors via `errors()`.
   *   Matches the styled `NgxFormFieldset` default so composing the
   *   directive via `hostDirectives` keeps behavior identical. Use this
   *   when nested fields display their own errors (avoids duplication).
   * - `true`: Aggregate all errors via `errorSummary()`, including nested
   *   field errors. Use this when nested fields do not display their own
   *   errors (plain `<input>` without a wrapper).
   *
   * @default false
   */
  readonly includeNestedErrors = input(false, { transform: booleanAttribute });

  /**
   * Resolved fieldset ID.
   */
  readonly resolvedFieldsetId = computed(
    () => this.fieldsetId() ?? this.#generatedFieldsetId,
  );

  /**
   * Field state from the fieldset FieldTree.
   */
  readonly #fieldsetState = computed(() => this.field()());

  /**
   * Resolved error display strategy.
   */
  readonly resolvedStrategy = computed<ResolvedErrorDisplayStrategy>(() =>
    resolveStrategyFromContext(
      this.strategy(),
      this.#formContext,
      this.#config?.defaultErrorStrategy ?? 'on-touch',
    ),
  );

  /**
   * Resolved warning display strategy. See the {@link warningStrategy} input
   * doc for the resolution cascade — deliberately narrower than
   * {@link resolvedStrategy}'s: an unset input defaults straight to
   * `'immediate'` rather than falling through to the form context or global
   * config default.
   */
  readonly resolvedWarningStrategy = computed<ResolvedErrorDisplayStrategy>(
    () => {
      const explicit = this.warningStrategy();
      if (explicit !== undefined) {
        return resolveStrategyFromContext(explicit, this.#formContext);
      }
      return 'immediate';
    },
  );

  /**
   * Resolved submitted status, exposed as a concrete {@link SubmittedStatus}
   * on the public API. Falls back to `'unsubmitted'` when no explicit input
   * is provided and no form context is available — this keeps standalone
   * fieldsets (outside an `ngxSignalForm`) from surfacing errors under the
   * `'on-submit'` strategy until the consumer wires submission explicitly.
   *
   * Note: `NgxHeadlessErrorSummary` preserves `undefined` in its
   * internal computation; this directive narrows the surface to a concrete
   * value because consumer templates typically bind the result directly.
   */
  readonly resolvedSubmittedStatus = computed<SubmittedStatus>(
    () =>
      resolveSubmittedStatusFromContext(
        this.submittedStatus(),
        this.#formContext,
      ) ?? 'unsubmitted',
  );

  /**
   * Show errors signal based on strategy.
   */
  readonly #showErrorsSignal = showErrors(
    this.#fieldsetState,
    this.resolvedStrategy,
    this.resolvedSubmittedStatus,
  );

  /**
   * Show warnings signal based on {@link resolvedWarningStrategy}, timed
   * independently of {@link resolvedStrategy}. Without this, warnings would
   * be stuck behind whatever timing the blocking-error strategy uses (e.g.
   * `'on-submit'`), the exact asymmetry `warningStrategy` exists to fix.
   */
  readonly #showWarningsSignal = showErrors(
    this.#fieldsetState,
    this.resolvedWarningStrategy,
    this.resolvedSubmittedStatus,
  );

  /**
   * Aggregated and deduplicated validation messages.
   * Uses shared utilities from utilities.ts.
   */
  readonly #allMessages = computed(() => {
    const override = this.fields();
    const readFn = this.includeNestedErrors() ? readErrors : readDirectErrors;

    // `null` means "not provided" → aggregate the fieldset's own errors.
    // An explicitly bound `[]` means "provided but empty" → aggregate
    // nothing. Distinguishing these (instead of `override.length > 0`)
    // keeps a dynamically-computed field list that becomes empty from
    // silently falling back to the fieldset's own (possibly unrelated)
    // errors.
    if (override !== null) {
      const messages = override.flatMap((field) => readFn(field()));
      return dedupeValidationErrors(messages);
    }

    return dedupeValidationErrors(readFn(this.#fieldsetState()));
  });

  readonly #split = computed(() => splitByKind(this.#allMessages()));

  readonly aggregatedErrors = computed(() => this.#split().blocking);
  readonly aggregatedWarnings = computed(() => this.#split().warnings);
  readonly hasErrors = computed(() => this.#split().blocking.length > 0);
  readonly hasWarnings = computed(() => this.#split().warnings.length > 0);

  /**
   * {@link aggregatedErrors}, resolved to display messages. See the class
   * doc's usage note for why this (not `error.message`) is the recommended
   * rendering surface.
   */
  readonly resolvedErrors: Signal<readonly ResolvedError[]> = computed(() =>
    this.aggregatedErrors().map((error) => this.#toResolvedError(error)),
  );

  /** {@link aggregatedWarnings}, resolved the same way as {@link resolvedErrors}. */
  readonly resolvedWarnings: Signal<readonly ResolvedError[]> = computed(() =>
    this.aggregatedWarnings().map((error) => this.#toResolvedError(error)),
  );

  #toResolvedError(error: ValidationError): ResolvedError {
    return {
      kind: error.kind,
      message: resolveErrorMessage(error, this.#errorMessagesRegistry),
    };
  }

  /**
   * Whether to show errors based on strategy.
   */
  readonly shouldShowErrors = computed(
    () => this.#showErrorsSignal() && this.hasErrors(),
  );

  /**
   * Whether to show warnings, timed by {@link resolvedWarningStrategy}.
   *
   * **Independent of {@link shouldShowErrors}** — this directive used to
   * suppress warnings outright whenever blocking errors were visible. That
   * was inconsistent with `NgxHeadlessErrorSummary.shouldShowWarnings`
   * (`error-summary.ts`), which never gates warning visibility on error
   * presence because a summary aggregates across a whole subtree and a
   * warnings-only region shouldn't have its `hasErrors() === false` case
   * accidentally coupled to a sibling's blocking errors. Fieldsets aggregate
   * the same way, so this directive now matches that contract: consumers
   * that want "errors take visual priority" (e.g. a single message slot
   * that can only render one category at a time, or CSS state classes)
   * apply that priority themselves — see `NgxFormFieldset`'s
   * `filteredErrorsSignal` and its `--warning` host class, which explicitly
   * guard on `!shouldShowErrors()` for that reason.
   */
  readonly shouldShowWarnings = computed(
    () => this.#showWarningsSignal() && this.hasWarnings(),
  );

  readonly #flags = createFieldStateFlags(this.#fieldsetState);

  readonly isInvalid = this.#flags.isInvalid;
  readonly isValid = this.#flags.isValid;
  readonly isTouched = this.#flags.isTouched;
  readonly isDirty = this.#flags.isDirty;
  readonly isPending = this.#flags.isPending;
}
