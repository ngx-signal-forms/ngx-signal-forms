import {
  booleanAttribute,
  computed,
  Directive,
  input,
  type Signal,
} from '@angular/core';
import type { FieldTree, ValidationError } from '@angular/forms/signals';
import {
  createErrorVisibility,
  createUniqueId,
  createWarningVisibility,
  readDirectErrors,
  splitByKind,
  unwrapValue,
  type ErrorDisplayStrategy,
  type NgxReactiveOrStatic,
  type ResolvedErrorDisplayStrategy,
  type ResolvedWarningDisplayStrategy,
  type NgxSignalLike,
  type SubmittedStatus,
  type WarningDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import {
  resolveStrategyFromContext,
  resolveSubmittedStatusFromContext,
  resolveWarningStrategyFromContext,
  type ErrorMessageRegistry,
} from '@ngx-signal-forms/toolkit/core';

import { buildHeadlessContext } from './build-headless-context';
import { readErrors } from './field-state-utilities';
import {
  createFieldStateFlags,
  dedupeValidationErrors,
  resolveErrorMessage,
  type ResolvedError,
} from './utilities';

/**
 * Options for {@link createFieldsetAggregation}.
 *
 * `showErrors`/`showWarnings` are pre-resolved visibility signals, not raw
 * strategy inputs — per ADR-0005 (factories take DI-resolved values as
 * inputs and never call `inject()` themselves). `NgxHeadlessFieldset` keeps
 * owning the single `createErrorVisibility()` call (ADR-0006) and threads
 * the results in here; this factory only
 * combines them with the (visibility-independent) presence check.
 *
 * @group Reactive Primitives
 */
export interface CreateFieldsetAggregationOptions {
  /** Reactive reader for the fieldset's own field state (from `field()()`). */
  readonly fieldState: NgxSignalLike<unknown>;
  /**
   * Explicit field-list override. `null`/omitted means "not provided" —
   * aggregate `fieldState`'s own errors. See `NgxHeadlessFieldset.fields`
   * for the "not provided" vs "explicitly empty" distinction this preserves.
   */
  readonly fields?: NgxReactiveOrStatic<readonly FieldTree<unknown>[] | null>;
  /** Whether to aggregate nested field errors (`errorSummary()`) instead of direct ones (`errors()`). */
  readonly includeNestedErrors?: NgxReactiveOrStatic<boolean>;
  /** Pre-resolved blocking-error visibility (from the caller's own visibility seam call). */
  readonly showErrors: NgxSignalLike<boolean>;
  /** Pre-resolved warning visibility, timed independently of {@link showErrors}. */
  readonly showWarnings: NgxSignalLike<boolean>;
  /** Error message registry for 3-tier message resolution. */
  readonly errorMessages?: Readonly<ErrorMessageRegistry> | null;
}

/**
 * Fieldset error/warning aggregation result.
 *
 * @group Reactive Primitives
 */
export interface FieldsetAggregationResult {
  /** Aggregated and deduplicated blocking errors. */
  readonly aggregatedErrors: Signal<readonly ValidationError[]>;
  /** Aggregated and deduplicated warnings. */
  readonly aggregatedWarnings: Signal<readonly ValidationError[]>;
  /** {@link aggregatedErrors}, resolved to display messages. */
  readonly resolvedErrors: Signal<readonly ResolvedError[]>;
  /** {@link aggregatedWarnings}, resolved to display messages. */
  readonly resolvedWarnings: Signal<readonly ResolvedError[]>;
  /** Whether there are blocking errors. */
  readonly hasErrors: Signal<boolean>;
  /** Whether there are warnings. */
  readonly hasWarnings: Signal<boolean>;
  /** `showErrors() && hasErrors()`. */
  readonly shouldShowErrors: Signal<boolean>;
  /** `showWarnings() && hasWarnings()`. */
  readonly shouldShowWarnings: Signal<boolean>;
}

/**
 * Aggregates, deduplicates, and resolves field/warning errors for a
 * fieldset-shaped surface.
 *
 * Extracted from `NgxHeadlessFieldset`, which used to inline this pipeline
 * (issue #351). Deliberately pure — no `inject()` calls — so it is testable
 * with plain signal mocks and no `TestBed`, matching the other headless
 * factories (`createFieldStateFlags`, `createCharacterCount`). Visibility
 * timing is NOT resolved here; callers pass already-resolved `showErrors`/
 * `showWarnings` signals from their own `createErrorVisibility()` /
 * `createWarningVisibility()` calls (ADR-0006's single seam).
 *
 * @remarks Does not require an injection context — `fieldState`,
 * `showErrors`, and `showWarnings` must already be resolved. Building
 * `showErrors` / `showWarnings` with {@link createErrorVisibility} /
 * {@link createWarningVisibility} does need one.
 *
 * @example
 * ```typescript
 * import { createErrorVisibility, createWarningVisibility } from '@ngx-signal-forms/toolkit';
 * import { createFieldsetAggregation } from '@ngx-signal-forms/toolkit/headless';
 *
 * // Called inside an injection context, e.g. a component field initializer.
 * const aggregation = createFieldsetAggregation({
 *   fieldState: addressForm,
 *   showErrors: createErrorVisibility(addressForm),
 *   showWarnings: createWarningVisibility(addressForm),
 * });
 *
 * aggregation.aggregatedErrors(); // deduplicated blocking errors
 * ```
 *
 * @group Reactive Primitives
 */
export function createFieldsetAggregation(
  options: Readonly<CreateFieldsetAggregationOptions>,
): FieldsetAggregationResult {
  const {
    fieldState,
    fields,
    includeNestedErrors,
    showErrors,
    showWarnings,
    errorMessages,
  } = options;

  const allMessages = computed(() => {
    const override = fields === undefined ? null : unwrapValue(fields);
    const readFn = unwrapValue(includeNestedErrors ?? false)
      ? readErrors
      : readDirectErrors;

    // `null` means "not provided" → aggregate `fieldState`'s own errors. An
    // explicitly bound `[]` means "provided but empty" → aggregate nothing.
    if (override !== null) {
      const messages = override.flatMap((field) => readFn(field()));
      return dedupeValidationErrors(messages);
    }

    return dedupeValidationErrors(readFn(fieldState()));
  });

  const split = computed(() => splitByKind(allMessages()));

  const aggregatedErrors = computed(() => split().blocking);
  const aggregatedWarnings = computed(() => split().warnings);
  const hasErrors = computed(() => split().blocking.length > 0);
  const hasWarnings = computed(() => split().warnings.length > 0);

  const toResolved = (error: ValidationError): ResolvedError => ({
    kind: error.kind,
    message: resolveErrorMessage(error, errorMessages),
  });

  const resolvedErrors = computed(() => aggregatedErrors().map(toResolved));
  const resolvedWarnings = computed(() => aggregatedWarnings().map(toResolved));

  const shouldShowErrors = computed(() => showErrors() && hasErrors());
  const shouldShowWarnings = computed(() => showWarnings() && hasWarnings());

  return {
    aggregatedErrors,
    aggregatedWarnings,
    resolvedErrors,
    resolvedWarnings,
    hasErrors,
    hasWarnings,
    shouldShowErrors,
    shouldShowWarnings,
  };
}

/**
 * Fieldset state signals exposed by the headless directive.
 *
 * @group Directives
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
  readonly resolvedWarningStrategy: Signal<ResolvedWarningDisplayStrategy>;
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
 *   of blocking errors via `warningStrategy` (defaults to `'on-touch'`)
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
 *
 * @group Directives
 */
@Directive({
  selector: '[ngxHeadlessFieldset]',
  exportAs: 'fieldset',
})
export class NgxHeadlessFieldset<
  TFieldset = unknown,
> implements FieldsetStateSignals {
  readonly #context = buildHeadlessContext();
  readonly #formContext = this.#context.formContext;
  readonly #config = this.#context.config;
  readonly #errorMessagesRegistry = this.#context.errorMessagesRegistry;
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
   * (which only governs blocking errors). Mirrors the contract established
   * by `NgxFormFieldWrapper.warningStrategy` /
   * `NgxFormFieldError.warningStrategy`.
   *
   * Resolves through the warning cascade, which parallels {@link strategy}'s
   * cascade but never reaches into the error channel:
   *
   * 1. this input, when set and not `'inherit'`
   * 2. the ambient form context's `warningStrategy()`
   * 3. `NGX_SIGNAL_FORMS_CONFIG.defaultWarningStrategy`
   * 4. `'on-touch'`
   *
   * No tier consults `defaultErrorStrategy`, so an ambient `'on-submit'`
   * meant for blocking errors never silently gates warnings.
   *
   * @default `'on-touch'`
   */
  readonly warningStrategy = input<WarningDisplayStrategy | undefined>();

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
      this.#config.defaultErrorStrategy,
    ),
  );

  /**
   * Resolved warning display strategy. Uses the full warning cascade:
   * explicit input → form context warning strategy → config default →
   * `'on-touch'`.
   */
  readonly resolvedWarningStrategy = computed<ResolvedWarningDisplayStrategy>(
    () =>
      resolveWarningStrategyFromContext(
        this.warningStrategy(),
        this.#formContext,
        this.#config.defaultWarningStrategy,
      ),
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
   * Show errors signal based on strategy. Routes through the shared
   * `createErrorVisibility` seam (ADR-0006) rather than re-inlining
   * `createErrorVisibility` — {@link resolvedStrategy} /
   * {@link resolvedSubmittedStatus} stay separately computed above because
   * they are part of this directive's public surface, but the raw
   * `strategy`/`submittedStatus` inputs feed the seam directly so it applies
   * the identical cascade (same function, same `configDefault`) rather than
   * a parallel reimplementation.
   */
  readonly #showErrorsSignal = createErrorVisibility(this.#fieldsetState, {
    strategy: this.strategy,
    submittedStatus: this.submittedStatus,
    configDefault: this.#config.defaultErrorStrategy,
  });

  /**
   * Show warnings signal, timed independently of {@link resolvedStrategy}.
   * Without this, warnings would be stuck behind whatever timing the
   * blocking-error strategy uses (e.g. `'on-submit'`), the exact asymmetry
   * `warningStrategy` exists to fix.
   *
   * Routes through `createWarningVisibility` (ADR-0006) for the same reason
   * {@link #showErrorsSignal} routes through `createErrorVisibility`: the raw
   * inputs plus `configDefault` feed the seam, which re-runs the identical
   * warning cascade rather than reusing {@link resolvedWarningStrategy} —
   * that computed exists for the public API.
   *
   * `hasWarnings: true` because a fieldset's warnings live on its member
   * fields, not on its own `errors()`; {@link #aggregation} applies the
   * aggregated presence check. `errorVisibility` is omitted because this is
   * an aggregate surface — a blocking error on one member field must not
   * silence a warning on a sibling (see {@link shouldShowWarnings}).
   */
  readonly #showWarningsSignal = createWarningVisibility(this.#fieldsetState, {
    strategy: this.warningStrategy,
    submittedStatus: this.submittedStatus,
    configDefault: this.#config.defaultWarningStrategy,
    hasWarnings: true,
  });

  /**
   * Error/warning aggregation, delegated to {@link createFieldsetAggregation}
   * — this directive is a pure projection over its result. Pass the
   * already-resolved {@link #showErrorsSignal} / {@link #showWarningsSignal} rather
   * than raw strategy inputs: the factory itself never calls `inject()`
   * (ADR-0005), so visibility timing stays owned by this directive's single
   * `createErrorVisibility()` seam call
   * (ADR-0006).
   */
  readonly #aggregation = createFieldsetAggregation({
    fieldState: this.#fieldsetState,
    fields: this.fields,
    includeNestedErrors: this.includeNestedErrors,
    showErrors: this.#showErrorsSignal,
    showWarnings: this.#showWarningsSignal,
    errorMessages: this.#errorMessagesRegistry,
  });

  readonly aggregatedErrors = this.#aggregation.aggregatedErrors;
  readonly aggregatedWarnings = this.#aggregation.aggregatedWarnings;

  /**
   * {@link aggregatedErrors}, resolved to display messages. See the class
   * doc's usage note for why this (not `error.message`) is the recommended
   * rendering surface.
   */
  readonly resolvedErrors: Signal<readonly ResolvedError[]> =
    this.#aggregation.resolvedErrors;

  /** {@link aggregatedWarnings}, resolved the same way as {@link resolvedErrors}. */
  readonly resolvedWarnings: Signal<readonly ResolvedError[]> =
    this.#aggregation.resolvedWarnings;

  readonly hasErrors = this.#aggregation.hasErrors;
  readonly hasWarnings = this.#aggregation.hasWarnings;

  /**
   * Whether to show errors based on strategy.
   */
  readonly shouldShowErrors = this.#aggregation.shouldShowErrors;

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
  readonly shouldShowWarnings = this.#aggregation.shouldShowWarnings;

  readonly #flags = createFieldStateFlags(this.#fieldsetState);

  readonly isInvalid = this.#flags.isInvalid;
  readonly isValid = this.#flags.isValid;
  readonly isTouched = this.#flags.isTouched;
  readonly isDirty = this.#flags.isDirty;
  readonly isPending = this.#flags.isPending;
}
