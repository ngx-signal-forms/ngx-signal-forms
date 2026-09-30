import * as _angular_core from '@angular/core';
import { Signal, Injector } from '@angular/core';
import { FieldTree, ValidationError } from '@angular/forms/signals';
import { ReactiveOrStatic, ErrorReadableState, ErrorDisplayStrategy, WarningDisplayStrategy, SubmittedStatus, SignalLike, ResolvedErrorDisplayStrategy, ResolvedWarningDisplayStrategy } from '@ngx-signal-forms/toolkit';
export { ErrorMessageRegistry, createUniqueId, readDirectErrors } from '@ngx-signal-forms/toolkit';
import { FieldLabelResolver, ErrorMessageRegistry, ErrorDisplayStrategy as ErrorDisplayStrategy$1, WarningDisplayStrategy as WarningDisplayStrategy$1, SubmittedStatus as SubmittedStatus$1 } from './ngx-signal-forms-toolkit-core.js';
export { AriaDescribedByBridge, AriaDescribedByFieldNameReader, AriaDescribedByPreservedIdsReader, AriaRequiredFieldState, BoundControlElementReader, CreateAriaDescribedByBridgeOptions, CreateAriaDescribedBySignalOptions, CreateFieldNameResolverOptions, CreateHintIdsSignalOptions, HintIdsFieldNameReader, HintIdsIdentityLike, HintIdsRegistryLike, HintIdsSignal, LabelForReader, createAriaDescribedByBridge, createAriaDescribedBySignal, createAriaInvalidSignal, createAriaRequiredSignal, createFieldNameResolver, createHintIdsSignal, humanizeFieldPath } from './ngx-signal-forms-toolkit-core.js';

/**
 * Types and defaults for the character-count pair
 * (`NgxHeadlessCharacterCount` / `createCharacterCount`), both defined in
 * `character-count.ts`, which is the only file that imports this module
 * directly (everything else — `assistive/character-count.ts` included —
 * imports the re-exported names from `character-count.ts` or the public
 * `@ngx-signal-forms/toolkit/headless` barrel instead). Kept in its own file
 * to give these declarations one self-contained definition, separate from
 * the directive and the factory that consume them.
 */

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
type CharacterCountValue = string | readonly string[] | null | undefined;
/**
 * Character count limit state.
 *
 * @group Directives
 */
type CharacterCountLimitState = 'danger' | 'exceeded' | 'ok' | 'warning';
/**
 * Default warning threshold percentage.
 *
 * @group Directives
 */
declare const DEFAULT_WARNING_THRESHOLD = 0.8;
/**
 * Default danger threshold percentage.
 *
 * @group Directives
 */
declare const DEFAULT_DANGER_THRESHOLD = 0.95;
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
interface CharacterCountState {
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

/**
 * Options for creating character count signals.
 *
 * @group Reactive Primitives
 */
interface CreateCharacterCountOptions {
    /** Form field producing a {@link CharacterCountValue}. */
    readonly field: FieldTree<CharacterCountValue>;
    /**
     * Maximum length for the character count.
     *
     * `0` and negative numbers count as an explicit limit too. They are real
     * values, not "no limit" — see {@link createCharacterCount}'s non-positive
     * `maxLength` handling. An explicit value, of any sign, always wins and
     * blocks the `useValidatorMaxLength` fallback below.
     *
     * `undefined`, `null`, or omitting the option means "no explicit limit".
     * See `useValidatorMaxLength` for the fallback that applies then.
     */
    readonly maxLength?: ReactiveOrStatic<number | null>;
    /**
     * Falls back to the field's own `maxLength` validator signal when
     * `maxLength` resolves to no explicit limit. Only a present, positive
     * validator value counts. Lets a caller auto-detect the limit from the
     * form schema instead of passing an explicit `maxLength`.
     *
     * @default false
     */
    readonly useValidatorMaxLength?: boolean;
    /** Warning threshold (0-1), default 0.8 */
    readonly warningThreshold?: ReactiveOrStatic<number>;
    /** Danger threshold (0-1), default 0.95 */
    readonly dangerThreshold?: ReactiveOrStatic<number>;
    /**
     * Name reported in the unsupported-value-type dev warning, e.g.
     * `[ngx-signal-forms] <component>: unsupported value type — …`. Lets a
     * delegating caller (`NgxHeadlessCharacterCount`, `NgxFormFieldCharacterCount`)
     * report its own name instead of `'createCharacterCount'`, since the
     * message text is asserted in specs on both sides.
     *
     * @default 'createCharacterCount'
     */
    readonly component?: string;
}
/**
 * Creates character count signals for a form field.
 *
 * This utility provides the same state management as NgxHeadlessCharacterCount
 * but as standalone signals for programmatic use.
 *
 * @remarks Does not require an injection context (only creates `computed()`
 * signals internally).
 *
 * ## Usage
 *
 * ```typescript
 * const formData = signal({ bio: '' });
 * const bioField = form(formData).bio;
 *
 * const charCount = createCharacterCount({
 *   field: bioField,
 *   maxLength: 500,
 *   warningThreshold: 0.8,
 *   dangerThreshold: 0.95,
 * });
 *
 * // Use in templates
 * effect(() => {
 *   console.log(`${charCount.currentLength()} / ${charCount.resolvedMaxLength()}`);
 *   console.log(`State: ${charCount.limitState()}`);
 * });
 * ```
 *
 * @group Reactive Primitives
 */
declare function createCharacterCount(options: Readonly<CreateCharacterCountOptions>): CharacterCountState;
/**
 * Headless character count directive for form field length tracking.
 *
 * Provides signals for implementing custom character count displays
 * with progressive visual feedback (ok → warning → danger → exceeded).
 *
 * ## Features
 *
 * - **Progressive States**: ok, warning, danger, exceeded based on thresholds
 * - **Flexible Display**: Exposes all data for full UI customization
 * - **Configurable Thresholds**: Customize warning (80%) and danger (95%)
 *
 * ## Usage
 *
 * ```html
 * <div
 *   ngxHeadlessCharacterCount
 *   #charCount="characterCount"
 *   [field]="form.bio"
 *   [maxLength]="500"
 * >
 *   @if (charCount.hasLimit()) {
 *     <span [class]="charCount.limitState()">
 *       {{ charCount.currentLength() }} / {{ charCount.resolvedMaxLength() }}
 *       ({{ charCount.remaining() }} remaining)
 *     </span>
 *   }
 * </div>
 * ```
 *
 * ## Threshold Configuration
 *
 * The limit state transitions based on configurable thresholds:
 * - **ok**: Under warning threshold (default < 80%)
 * - **warning**: At/above warning, under danger (default 80-94%)
 * - **danger**: At/above danger, up to and including 100% (default 95-100%)
 * - **exceeded**: Over 100%
 *
 * @example Custom thresholds
 * ```html
 * <div
 *   ngxHeadlessCharacterCount
 *   #charCount="characterCount"
 *   [field]="form.title"
 *   [maxLength]="100"
 *   [warningThreshold]="0.7"
 *   [dangerThreshold]="0.9"
 * >
 *   <!-- Display with 70%/90% thresholds -->
 * </div>
 * ```
 *
 * @group Directives
 */
declare class NgxHeadlessCharacterCount implements CharacterCountState {
    #private;
    /**
     * The form field to track character count.
     */
    readonly field: _angular_core.InputSignal<FieldTree<CharacterCountValue>>;
    /**
     * Maximum length for the character count.
     */
    readonly maxLength: _angular_core.InputSignal<number>;
    /**
     * Warning threshold as percentage (0-1). Default: 0.8 (80%).
     */
    readonly warningThreshold: _angular_core.InputSignal<number>;
    /**
     * Danger threshold as percentage (0-1). Default: 0.95 (95%).
     */
    readonly dangerThreshold: _angular_core.InputSignal<number>;
    /**
     * Current value length.
     */
    readonly currentLength: Signal<number>;
    /**
     * Resolved maximum length.
     *
     * The directive requires a `maxLength` input, so `createCharacterCount()`
     * always resolves a real limit here — never `null`. Narrowed back to
     * `Signal<number>`, unlike `CharacterCountState.resolvedMaxLength` (which
     * is nullable for callers that allow no limit), so directive consumers
     * see no type change from before `createCharacterCount()` started
     * supporting an optional `maxLength`.
     */
    readonly resolvedMaxLength: Signal<number>;
    /**
     * Whether a limit is configured.
     *
     * The directive requires a `maxLength` input, so this always resolves to
     * `true`. Retained as a signal for API symmetry with
     * `createCharacterCount()` and for consumer templates that may swap
     * directive/factory wiring.
     */
    readonly hasLimit: Signal<boolean>;
    /**
     * Remaining characters until limit.
     */
    readonly remaining: Signal<number>;
    /**
     * Percentage of limit used (0-100+).
     *
     * @see {@link createCharacterCount} for the non-positive `maxLength`
     *   edge-case handling.
     */
    readonly percentUsed: Signal<number>;
    /**
     * Whether the limit has been exceeded.
     */
    readonly isExceeded: Signal<boolean>;
    /**
     * Current limit state based on thresholds (ok → warning → danger →
     * exceeded).
     *
     * @see {@link createCharacterCount} for the threshold/edge-case algorithm.
     */
    readonly limitState: Signal<CharacterCountLimitState>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<NgxHeadlessCharacterCount, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<NgxHeadlessCharacterCount, "[ngxHeadlessCharacterCount]", ["characterCount"], { "field": { "alias": "field"; "required": true; "isSignal": true; }; "maxLength": { "alias": "maxLength"; "required": true; "isSignal": true; }; "warningThreshold": { "alias": "warningThreshold"; "required": false; "isSignal": true; }; "dangerThreshold": { "alias": "dangerThreshold"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

/**
 * Error-summary mapping utilities, split out of `utilities.ts` (issue
 * #354): turning a raw `ValidationError` into a focusable, labeled,
 * message-resolved entry ready for an error-summary list. The aggregation
 * *pipeline* that calls these (`createErrorSummaryEntries`) lives in
 * `error-summary.ts`, next to `NgxHeadlessErrorSummary` (issue #512) — this
 * module holds only the per-error mapping functions it composes.
 */
/**
 * A resolved error-summary entry ready for rendering.
 *
 * @group Utility Functions
 */
interface ErrorSummaryEntryData {
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
 * @group Utility Functions
 */
declare function resolveFieldNameFromError(error: ValidationError, resolver?: FieldLabelResolver | null): string;
/**
 * Focus the form control bound to the field that produced a validation error.
 *
 * Uses duck-typed access to `error.fieldTree().focusBoundControl()`, guarded
 * by {@link errorHasFocusableTarget} so the two never disagree about
 * whether an error has a focusable target.
 *
 * @public
 * @group Utility Functions
 */
declare function focusBoundControlFromError(error: ValidationError): void;
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
 * @group Utility Functions
 */
declare function toErrorSummaryEntry(error: ValidationError, registry?: Readonly<ErrorMessageRegistry> | null, options?: Readonly<{
    stripWarningPrefix?: boolean;
}>, labelResolver?: FieldLabelResolver | null): ErrorSummaryEntryData;

/**
 * Field-state duck-typing utilities, split out of `utilities.ts` (issue
 * #354) so the ~900-line file's domains stop sharing one module boundary.
 * Everything here reads a `FieldTree`'s return value (or a
 * `ValidationError`'s `fieldTree()`) through loose, structural access
 * instead of Angular's exact `FieldState` type — the shared reason being
 * that toolkit consumers pass mock states in tests and adapters may expose
 * `CompatFieldState` variants that only partially match.
 */
/**
 * Boolean state keys available on FieldState.
 *
 * Angular Signal Forms exposes these as `Signal<boolean>` properties.
 * We define it locally for type-safe access via duck-typing.
 *
 * @group Utility Functions
 */
type BooleanStateKey = 'dirty' | 'invalid' | 'pending' | 'touched' | 'valid';
/**
 * Type representing the shape of FieldState for reading errors.
 * Used for duck-typing access to error properties.
 *
 * @group Utility Functions
 */
type FieldStateLike$1 = {
    invalid?: ErrorReadableState['invalid'];
    valid?: () => boolean;
    touched?: ErrorReadableState['touched'];
    dirty?: () => boolean;
    pending?: () => boolean;
    errorSummary?: () => ValidationError[];
    errors?: ErrorReadableState['errors'];
};
/**
 * Read a boolean flag from FieldState using duck-typing.
 *
 * Safely accesses FieldState boolean signals (invalid, valid, touched, dirty, pending)
 * without requiring exact type match. Useful when working with FieldTree
 * return types that may be FieldState or CompatFieldState.
 *
 * @param state - The field state object (from `fieldTree()`)
 * @param key - The boolean flag name to read
 * @returns The boolean value, or false if not accessible
 *
 * @example
 * ```typescript
 * const fieldState = myField();
 * const isInvalid = readFieldFlag(fieldState, 'invalid');
 * const isTouched = readFieldFlag(fieldState, 'touched');
 * ```
 *
 * @group Utility Functions
 */
declare function readFieldFlag(state: unknown, key: BooleanStateKey): boolean;
/**
 * Computed boolean state flags from a reactive field state signal.
 *
 * @group Reactive Primitives
 */
interface FieldStateFlags {
    readonly isInvalid: Signal<boolean>;
    readonly isValid: Signal<boolean>;
    readonly isTouched: Signal<boolean>;
    readonly isDirty: Signal<boolean>;
    readonly isPending: Signal<boolean>;
}
/**
 * Creates computed boolean state flags from a field state signal.
 *
 * Eliminates the repeated pattern of 5 individual `readFieldFlag` computeds
 * found in fieldset directives and components.
 *
 * @remarks Does not require an injection context (only creates `computed`s).
 *
 * @param fieldState - A signal/computed that returns the field state object
 * @returns Object with computed signals for each boolean flag
 *
 * @group Reactive Primitives
 */
declare function createFieldStateFlags(fieldState: () => unknown): FieldStateFlags;
/**
 * Read errors from FieldState using duck-typing.
 *
 * Tries `errorSummary()` first (aggregated errors from nested fields),
 * then falls back to `errors()` (direct field errors).
 *
 * @param state - The field state object (from `fieldTree()`)
 * @returns Array of ValidationError, empty if not accessible
 *
 * @example
 * ```typescript
 * const fieldState = addressField();
 * const allErrors = readErrors(fieldState); // Includes nested field errors
 * ```
 *
 * @group Utility Functions
 */
declare function readErrors(state: unknown): ValidationError[];

/**
 * A resolved error with kind and message.
 *
 * Canonical home for this type — `error-state.ts` re-exports it (the public
 * barrel resolves `ResolvedError` from `./lib/error-state` and stays
 * unchanged) so both `createFieldsetAggregation()` (`fieldset.ts`) and
 * `NgxHeadlessErrorState` (`error-state.ts`) share one definition.
 *
 * @group Directives
 */
interface ResolvedError {
    readonly kind: string;
    readonly message: string;
}
/**
 * Deduplicate validation errors by kind + message combination.
 *
 * Useful for fieldsets that aggregate errors from multiple fields -
 * the same validation error (e.g., "required") might appear multiple times.
 *
 * @param errors - Array of ValidationError to deduplicate
 * @returns Deduplicated array preserving first occurrence order
 *
 * @example
 * ```typescript
 * const errors = [
 *   { kind: 'required', message: 'Required' },
 *   { kind: 'email', message: 'Invalid email' },
 *   { kind: 'required', message: 'Required' }, // duplicate
 * ];
 * const unique = dedupeValidationErrors(errors);
 * // [{ kind: 'required', message: 'Required' }, { kind: 'email', message: 'Invalid email' }]
 * ```
 *
 * @group Utility Functions
 */
declare function dedupeValidationErrors(errors: readonly ValidationError[]): ValidationError[];

/**
 * Options for creating error state signals.
 *
 * @group Reactive Primitives
 */
interface CreateErrorStateOptions<TValue = unknown> {
    /** Form field FieldTree */
    readonly field: FieldTree<TValue>;
    /** Field name for ID generation. `null` disables ID generation. */
    readonly fieldName: ReactiveOrStatic<string | null>;
    /**
     * Error display strategy override.
     *
     * Resolution order: this option (when not `'inherit'`) → ambient
     * `NGX_SIGNAL_FORM_CONTEXT.errorStrategy` → the global
     * `NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy` → `'on-touch'`. This
     * mirrors `NgxHeadlessFieldset.resolvedStrategy`'s cascade so config-level
     * defaults apply consistently across headless surfaces even outside a
     * form context.
     */
    readonly strategy?: ReactiveOrStatic<ErrorDisplayStrategy>;
    /**
     * Warning display strategy override, independent of {@link strategy}.
     *
     * Resolution order: this option (when not `'inherit'`) → ambient
     * `NGX_SIGNAL_FORM_CONTEXT.warningStrategy` → the global
     * `NGX_SIGNAL_FORMS_CONFIG.defaultWarningStrategy` → `'on-touch'`. No tier
     * consults `defaultErrorStrategy`, so an ambient `'on-submit'` meant for
     * blocking errors never silently gates warnings (ADR-0007).
     */
    readonly warningStrategy?: ReactiveOrStatic<WarningDisplayStrategy>;
    /**
     * Submitted status override.
     *
     * Resolution order: this option (when not `undefined`) → ambient
     * `NGX_SIGNAL_FORM_CONTEXT.submittedStatus` → `undefined`.
     */
    readonly submittedStatus?: ReactiveOrStatic<SubmittedStatus | undefined>;
    /**
     * Optional injector for use outside an Angular injection context (e.g.
     * unit tests, `runInInjectionContext` wrappers). When omitted the
     * function must be called inside a DI context. Mirrors the `injector`
     * escape hatch on the sibling factories `createErrorVisibility()` and
     * `createErrorMessageSignal()`.
     */
    readonly injector?: Injector;
}
/**
 * Error state signals returned by createErrorState.
 *
 * @group Reactive Primitives
 */
interface ErrorStateResult {
    /** Whether to show errors */
    readonly shouldShowErrors: Signal<boolean>;
    /** Whether to show warnings */
    readonly shouldShowWarnings: Signal<boolean>;
    /** Raw blocking errors */
    readonly errors: Signal<readonly ValidationError[]>;
    /** Raw warning errors */
    readonly warnings: Signal<readonly ValidationError[]>;
    /** Whether there are blocking errors */
    readonly hasErrors: Signal<boolean>;
    /** Whether there are warnings */
    readonly hasWarnings: Signal<boolean>;
    /** Generated error region ID, or `null` when no fieldName is resolvable */
    readonly errorId: Signal<string | null>;
    /** Generated warning region ID, or `null` when no fieldName is resolvable */
    readonly warningId: Signal<string | null>;
    /** Resolved field name */
    readonly fieldName: Signal<string | null>;
}
/**
 * Creates error state signals for a form field.
 *
 * This utility provides the same state management as NgxHeadlessErrorState
 * but as standalone signals for programmatic use. When no `strategy` is
 * provided, it resolves from the ambient `NGX_SIGNAL_FORM_CONTEXT` (installed
 * by the parent form host directive, `NgxSignalForm` on
 * `form[formRoot][ngxSignalForm]`) and falls back to `'on-touch'`. The same
 * precedence applies to `submittedStatus`.
 *
 * @example
 * ```typescript
 * const formData = signal({ email: '' });
 * const contactForm = form(
 *   formData,
 *   schema((path) => {
 *     required(path.email);
 *     email(path.email);
 *   }),
 * );
 *
 * const errorState = createErrorState({
 *   field: contactForm.email,
 *   fieldName: 'email',
 * });
 *
 * // Use in templates
 * effect(() => {
 *   if (errorState.shouldShowErrors() && errorState.hasErrors()) {
 *     console.log('Errors:', errorState.errors());
 *   }
 * });
 * ```
 *
 * @remarks
 * **Injection context required, unless `options.injector` is passed.** This
 * factory creates `computed()` signals internally, so by default it must be
 * called inside an injection context (constructor, field initializer, or
 * `runInInjectionContext`). Pass `options.injector` to call it imperatively
 * outside one (tests, services) — mirrors the `injector` escape hatch on
 * `createErrorVisibility()` / `createErrorMessageSignal()`.
 *
 * @remarks
 * **Warnings run on their own cascade.** Toolkit warnings are
 * `ValidationError`s with `kind: 'warn:*'` produced by the same validator
 * pipeline as blocking errors, so Angular marks `field.invalid() === true`
 * for them like any other error — `invalid()` cannot tell the two channels
 * apart. `shouldShowWarnings` therefore does not reuse the error decision:
 * it runs the warning cascade (`warningStrategy` option → form context
 * `warningStrategy()` → `defaultWarningStrategy` → `'on-touch'`), gates on
 * warning *presence* from `splitByKind()` rather than on `invalid()`, and
 * stays `false` while a blocking error is visible on the same field
 * (ADR-0007).
 *
 * @see {@link splitByKind} and {@link isWarningError} for the warning
 *   convention.
 *
 * @group Reactive Primitives
 */
declare function createErrorState<TValue = unknown>(options: Readonly<CreateErrorStateOptions<TValue>>): ErrorStateResult;
/**
 * Error state signals exposed by the headless directive.
 *
 * These signals provide all the state needed for custom error display implementations.
 *
 * @group Directives
 */
interface ErrorStateSignals {
    /** Whether to show errors based on the current strategy */
    readonly shouldShowErrors: Signal<boolean>;
    /** Whether to show warnings based on the current strategy */
    readonly shouldShowWarnings: Signal<boolean>;
    /** Raw blocking errors from the field */
    readonly errors: Signal<readonly ValidationError[]>;
    /** Raw warning errors from the field */
    readonly warnings: Signal<readonly ValidationError[]>;
    /** Resolved errors with messages */
    readonly resolvedErrors: Signal<readonly ResolvedError[]>;
    /** Resolved warnings with messages */
    readonly resolvedWarnings: Signal<readonly ResolvedError[]>;
    /** Whether the field has blocking errors */
    readonly hasErrors: Signal<boolean>;
    /** Whether the field has warnings */
    readonly hasWarnings: Signal<boolean>;
    /** Generated error ID for aria-describedby, or `null` when no fieldName is resolvable */
    readonly errorId: Signal<string | null>;
    /** Generated warning ID for aria-describedby, or `null` when no fieldName is resolvable */
    readonly warningId: Signal<string | null>;
}
/**
 * Headless error state directive for custom error display implementations.
 *
 * Extracts error state logic from `NgxFormFieldError` into a renderless
 * directive that exposes signals for custom templates.
 *
 * ## Features
 *
 * - **Renderless**: No template output - use with custom templates
 * - **Strategy-aware**: Respects error display strategy (on-touch, immediate, etc.)
 * - **Warning support**: Separates blocking errors from non-blocking warnings
 * - **Message resolution**: 3-tier message priority (validator, registry, default)
 * - **ARIA IDs**: Auto-generates error/warning IDs for accessibility
 *
 * ## Usage
 *
 * ```html
 * <div
 *   ngxHeadlessErrorState
 *   #errorState="errorState"
 *   [field]="form.email"
 *   fieldName="email"
 * >
 *   @if (errorState.shouldShowErrors() && errorState.hasErrors()) {
 *     <my-custom-error-display [errors]="errorState.resolvedErrors()" />
 *   }
 * </div>
 * ```
 *
 * ## With Form Context (for on-submit strategy)
 *
 * ```html
 * <form [formRoot]="form" ngxSignalForm errorStrategy="on-submit">
 *   <div ngxHeadlessErrorState #errorState="errorState" [field]="form.email" fieldName="email">
 *     @if (errorState.shouldShowErrors()) {
 *       @for (error of errorState.resolvedErrors(); track error.kind) {
 *         <span class="error">{{ error.message }}</span>
 *       }
 *     }
 *   </div>
 * </form>
 * ```
 *
 * @template TValue The type of the field value
 *
 * @group Directives
 */
declare class NgxHeadlessErrorState<TValue = unknown> implements ErrorStateSignals {
    #private;
    /**
     * The Signal Forms field to track error state for.
     *
     * Optional when `errorsOverride` is provided (direct-errors mode) or when
     * the host component calls `connectFieldState()`. When neither is supplied
     * the directive renders as an empty, always-visible shell — the host
     * component controls visibility via its own conditions.
     */
    readonly field: _angular_core.InputSignal<FieldTree<TValue> | undefined>;
    /**
     * The field name for generating error/warning IDs.
     * Pass `null` (or omit) to disable ID generation (e.g. when the field name
     * cannot be resolved yet).
     *
     * @default null
     */
    readonly fieldName: _angular_core.InputSignal<string | null>;
    /**
     * Error display strategy override.
     * If undefined, inherits from form context or defaults to 'on-touch'.
     */
    readonly strategy: _angular_core.InputSignal<ErrorDisplayStrategy | undefined>;
    /**
     * Warning display strategy override, independent of {@link strategy}.
     *
     * Cascade: this input → form context `warningStrategy()` →
     * `NGX_SIGNAL_FORMS_CONFIG.defaultWarningStrategy` → `'on-touch'`. No tier
     * consults `defaultErrorStrategy`.
     */
    readonly warningStrategy: _angular_core.InputSignal<WarningDisplayStrategy | undefined>;
    /**
     * Form submission status (optional).
     * Only needed for 'on-submit' strategy.
     */
    readonly submittedStatus: _angular_core.InputSignal<SubmittedStatus | undefined>;
    /**
     * Pre-aggregated errors that replace field-based error extraction.
     *
     * Accepts a plain array or a reactive source (`Signal<…>` / `() => …`) —
     * unwrapped internally via {@link unwrapValue}. When provided, errors and
     * warnings are derived from this value rather than from `field`. Useful
     * for fieldsets or custom components that compute their own error lists
     * (e.g. `NgxFormFieldset.filteredErrorsSignal`). In this mode `field` is
     * not required and `shouldShowErrors` always returns `true` (the caller
     * controls visibility through `hasErrors`/`hasWarnings`).
     */
    readonly errorsOverride: _angular_core.InputSignal<ReactiveOrStatic<readonly ValidationError[]> | undefined>;
    /**
     * Resolved submission status after applying form-context defaults.
     * Exposed so that host components composing this directive via
     * `hostDirectives` can reuse the resolved value without re-calling
     * `resolveSubmittedStatusFromContext`.
     */
    readonly resolvedSubmittedStatus: Signal<SubmittedStatus | undefined>;
    readonly errorId: Signal<string | null>;
    readonly warningId: Signal<string | null>;
    readonly errors: Signal<readonly ValidationError[]>;
    readonly warnings: Signal<readonly ValidationError[]>;
    readonly hasErrors: Signal<boolean>;
    readonly hasWarnings: Signal<boolean>;
    /**
     * Whether errors should be shown based on strategy.
     *
     * Returns `true` unconditionally in two cases:
     * 1. **Direct-errors mode** — `errorsOverride` is bound. Strategy gating
     *    is intentionally bypassed here: callers using `errorsOverride` (e.g.
     *    `NgxFormFieldset.filteredErrorsSignal`) already aggregate and gate
     *    their own error lists upstream, so a second strategy filter here
     *    would double-gate. Visibility is delegated to the caller via
     *    `hasErrors`/`hasWarnings`.
     * 2. **No field state available** — neither `field` nor a bridged value
     *    via `connectFieldState()` is set. The host controls visibility
     *    through its own template conditions.
     *
     * The bridge slot is checked by *value*, not by presence: host components
     * that compose this directive via `hostDirectives` always call
     * `connectFieldState()` in their constructor, so the slot is non-null
     * even when the host's `[formField]` input is unbound.
     */
    readonly shouldShowErrors: Signal<boolean>;
    /**
     * Whether warnings should be shown, timed by {@link warningStrategy}'s own
     * cascade rather than the blocking-error one.
     *
     * The two unconditional-`true` cases are the same as
     * {@link shouldShowErrors}, and for the same reasons — direct-errors mode
     * delegates gating upstream, and with no field state the host owns
     * visibility. The strategy branch differs: it runs the warning cascade,
     * gates on warning presence rather than `invalid()`, and stays `false`
     * while a blocking error is visible on this field (ADR-0007).
     */
    readonly shouldShowWarnings: Signal<boolean>;
    /**
     * Resolved error messages using 3-tier priority.
     */
    readonly resolvedErrors: Signal<readonly ResolvedError[]>;
    /**
     * Resolved warning messages.
     */
    readonly resolvedWarnings: Signal<readonly ResolvedError[]>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<NgxHeadlessErrorState<any>, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<NgxHeadlessErrorState<any>, "[ngxHeadlessErrorState]", ["errorState"], { "field": { "alias": "field"; "required": false; "isSignal": true; }; "fieldName": { "alias": "fieldName"; "required": false; "isSignal": true; }; "strategy": { "alias": "strategy"; "required": false; "isSignal": true; }; "warningStrategy": { "alias": "warningStrategy"; "required": false; "isSignal": true; }; "submittedStatus": { "alias": "submittedStatus"; "required": false; "isSignal": true; }; "errorsOverride": { "alias": "errorsOverride"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

/**
 * A resolved error-summary entry with kind, message, and focus capability.
 *
 * @group Directives
 */
type ErrorSummaryEntry = ErrorSummaryEntryData;
/**
 * Options for {@link createErrorSummaryEntries}.
 *
 * `showErrors`/`showWarnings` are pre-resolved visibility signals, not raw
 * strategy inputs — mirrors {@link CreateFieldsetAggregationOptions}'s
 * contract (ADR-0005: factories take DI-resolved values as inputs, never
 * `inject()` themselves). Callers supply them from their own
 * `createErrorVisibility()` / `createWarningVisibility()` calls, which is
 * what keeps the two channels independently timed (ADR-0007).
 *
 * @group Reactive Primitives
 */
interface CreateErrorSummaryEntriesOptions {
    /** Reactive reader for the root field state (from `formTree()()`). */
    readonly fieldState: SignalLike<unknown>;
    /** Pre-resolved blocking-error visibility. */
    readonly showErrors: SignalLike<boolean>;
    /** Pre-resolved warning visibility, timed independently of {@link showErrors}. */
    readonly showWarnings: SignalLike<boolean>;
    /** Error message registry for 3-tier message resolution. */
    readonly errorMessages?: Readonly<ErrorMessageRegistry> | null;
    /** Optional field-label resolver; falls back to `humanizeFieldPath`. */
    readonly labelResolver?: FieldLabelResolver | null;
}
/**
 * Error-summary entry-mapping result.
 *
 * @group Reactive Primitives
 */
interface ErrorSummaryEntriesResult {
    /** Resolved blocking error entries ready for rendering. */
    readonly entries: Signal<readonly ErrorSummaryEntryData[]>;
    /** Resolved warning entries. */
    readonly warningEntries: Signal<readonly ErrorSummaryEntryData[]>;
    /** Whether there are any blocking errors. */
    readonly hasErrors: Signal<boolean>;
    /** Whether there are any warnings. */
    readonly hasWarnings: Signal<boolean>;
    /** `showErrors() && hasErrors()`. */
    readonly shouldShow: Signal<boolean>;
    /** `showWarnings() && hasWarnings()`. */
    readonly shouldShowWarnings: Signal<boolean>;
}
/**
 * Builds the `errorSummary()` entry-mapping pipeline: read → filter out
 * non-interactive (hidden/disabled) fields → dedupe per field → split by
 * kind → map to focusable {@link ErrorSummaryEntryData} entries.
 *
 * Extracted from `NgxHeadlessErrorSummary`, which used to inline this
 * pipeline (issue #351). Deliberately pure — no `inject()` calls — so it is
 * testable with plain signal mocks and no `TestBed`, matching the other
 * headless factories (`createFieldStateFlags`, `createCharacterCount`,
 * `createFieldsetAggregation`).
 *
 * @remarks Does not require an injection context — `fieldState`,
 * `showErrors`, and `showWarnings` must already be resolved. Building
 * `showErrors` / `showWarnings` with {@link createErrorVisibility} /
 * {@link createWarningVisibility} does need one.
 *
 * @example
 * ```typescript
 * import { createErrorVisibility, createWarningVisibility } from '@ngx-signal-forms/toolkit';
 * import { createErrorSummaryEntries } from '@ngx-signal-forms/toolkit/headless';
 *
 * // Called inside an injection context, e.g. a component field initializer.
 * const summary = createErrorSummaryEntries({
 *   fieldState: contactForm,
 *   showErrors: createErrorVisibility(contactForm),
 *   showWarnings: createWarningVisibility(contactForm),
 * });
 *
 * summary.entries(); // focusable error entries, ready to render
 * ```
 *
 * @group Reactive Primitives
 */
declare function createErrorSummaryEntries(options: Readonly<CreateErrorSummaryEntriesOptions>): ErrorSummaryEntriesResult;
/**
 * Error summary signals exposed by the headless directive.
 *
 * @group Directives
 */
interface ErrorSummarySignals {
    /** Resolved blocking error entries ready for rendering */
    readonly entries: Signal<readonly ErrorSummaryEntry[]>;
    /** Resolved warning entries */
    readonly warningEntries: Signal<readonly ErrorSummaryEntry[]>;
    /** Whether there are any blocking errors */
    readonly hasErrors: Signal<boolean>;
    /** Whether there are any warnings */
    readonly hasWarnings: Signal<boolean>;
    /** Whether the summary should be visible based on strategy */
    readonly shouldShow: Signal<boolean>;
    /**
     * Whether the warning list should be visible, timed by
     * {@link resolvedWarningStrategy}.
     *
     * Independent of {@link shouldShow} in both directions: a warnings-only
     * form has `hasErrors() === false`, so `shouldShow()` never gates
     * `warningEntries()`, and the warning cascade never consults the
     * blocking-error strategy (ADR-0007). Consumers rendering
     * `warningEntries()` should gate on this signal instead of `shouldShow()`.
     */
    readonly shouldShowWarnings: Signal<boolean>;
    /**
     * The fully-resolved error display strategy: explicit `strategy` input →
     * form context → `'on-touch'` default. Consumers that need to distinguish
     * a submit-driven appearance (e.g. to decide whether to move focus) from
     * an on-touch/immediate one should read this rather than the raw
     * `strategy` input, which may be `undefined`.
     */
    readonly resolvedStrategy: Signal<ResolvedErrorDisplayStrategy>;
    /**
     * The fully-resolved warning display strategy, independent of
     * {@link resolvedStrategy}: `warningStrategy` input → form context
     * `warningStrategy()` → `NGX_SIGNAL_FORMS_CONFIG.defaultWarningStrategy` →
     * `'on-touch'`.
     */
    readonly resolvedWarningStrategy: Signal<ResolvedWarningDisplayStrategy>;
    /** Focus the control for the first error entry */
    readonly focusFirst: () => void;
}
/**
 * Headless error-summary directive for form-level validation summaries.
 *
 * Aggregates errors from a form's `errorSummary()` and exposes them as
 * focusable entries for custom rendering.
 *
 * ## Features
 *
 * - **Angular-native**: Uses `errorSummary()` — never reimplements validation traversal
 * - **Click-to-focus**: Each entry exposes a `focus()` method via `focusBoundControl()`,
 *   and a `canFocus` flag — `false` when the error has no bound field, so `focus()`
 *   would be a silent no-op. Render such an entry as plain text, not a button.
 * - **Strategy-aware**: Respects error display strategy from form context
 * - **Warning support**: Separates blocking errors from warnings
 * - **Message resolution**: 3-tier message priority (validator, registry, default)
 * - **Deduplication**: Same error shown only once
 *
 * ## Usage
 *
 * The `role="alert"` container should be rendered UNCONDITIONALLY (even
 * while empty) rather than inserted together with its content — the same
 * always-mounted live-region pattern `NgxFormFieldError` uses (both its
 * inline and panel presentations). `role="alert"` only reliably fires on
 * content insertion into a *pre-existing* live region; mounting the
 * container and its content in the same tick risks the NVDA + Chrome
 * missed-first-announcement bug. Gate only the inner content on
 * `shouldShow()`/`hasErrors()`, not the container itself:
 *
 * ```html
 * <div ngxHeadlessErrorSummary #summary="errorSummary" [formTree]="myForm">
 *   <ul role="alert">
 *     @if (summary.shouldShow() && summary.hasErrors()) {
 *       @for (entry of summary.entries(); track entry.key) {
 *         <li>
 *           @if (entry.canFocus) {
 *             <button type="button" (click)="entry.focus()">
 *               {{ entry.fieldName }}: {{ entry.message }}
 *             </button>
 *           } @else {
 *             <span>{{ entry.fieldName }}: {{ entry.message }}</span>
 *           }
 *         </li>
 *       }
 *     }
 *   </ul>
 * </div>
 * ```
 *
 * @group Directives
 */
declare class NgxHeadlessErrorSummary implements ErrorSummarySignals {
    #private;
    /**
     * The root form FieldTree to aggregate errors from.
     */
    readonly formTree: _angular_core.InputSignal<FieldTree<unknown>>;
    /**
     * Error display strategy override.
     * If undefined, inherits from form context or defaults to 'on-touch'.
     */
    readonly strategy: _angular_core.InputSignal<ErrorDisplayStrategy | undefined>;
    /**
     * Warning display strategy override, independent of {@link strategy}
     * (which only governs blocking errors).
     *
     * Cascade: this input → the ambient form context's `warningStrategy()` →
     * `NGX_SIGNAL_FORMS_CONFIG.defaultWarningStrategy` → `'on-touch'`. No tier
     * consults `defaultErrorStrategy`, so a form that defers its errors to
     * submit still surfaces summary warnings on touch (ADR-0007).
     *
     * @default `'on-touch'`
     */
    readonly warningStrategy: _angular_core.InputSignal<WarningDisplayStrategy | undefined>;
    /**
     * Form submission status (optional).
     * If not provided, inherits from form context.
     */
    readonly submittedStatus: _angular_core.InputSignal<SubmittedStatus | undefined>;
    /**
     * Resolution order: `strategy` input (when not `'inherit'`) → ambient
     * form context → the global `NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy`
     * → `'on-touch'`. Mirrors `NgxHeadlessFieldset.resolvedStrategy`'s cascade
     * so standalone usage (no `[ngxSignalForm]` host) behaves consistently
     * regardless of which headless surface a consumer reaches for.
     */
    readonly resolvedStrategy: Signal<ResolvedErrorDisplayStrategy>;
    /**
     * Resolved warning display strategy — the warning cascade, run with the
     * same tiers `NgxHeadlessFieldset.resolvedWarningStrategy` uses so
     * `'inherit'` gives one answer across headless surfaces.
     */
    readonly resolvedWarningStrategy: Signal<ResolvedWarningDisplayStrategy>;
    readonly entries: Signal<readonly ErrorSummaryEntryData[]>;
    readonly warningEntries: Signal<readonly ErrorSummaryEntryData[]>;
    readonly hasErrors: Signal<boolean>;
    readonly hasWarnings: Signal<boolean>;
    readonly shouldShow: Signal<boolean>;
    readonly shouldShowWarnings: Signal<boolean>;
    readonly focusFirst: () => void;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<NgxHeadlessErrorSummary, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<NgxHeadlessErrorSummary, "[ngxHeadlessErrorSummary]", ["errorSummary"], { "formTree": { "alias": "formTree"; "required": true; "isSignal": true; }; "strategy": { "alias": "strategy"; "required": false; "isSignal": true; }; "warningStrategy": { "alias": "warningStrategy"; "required": false; "isSignal": true; }; "submittedStatus": { "alias": "submittedStatus"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

/**
 * Field name state signals exposed by the headless directive.
 *
 * @group Directives
 */
interface FieldNameStateSignals {
    /** Resolved field name from input or override; `null` when no name is resolvable. */
    readonly resolvedFieldName: Signal<string | null>;
    /** Generated error region ID; `null` when no field name is resolvable. */
    readonly errorId: Signal<string | null>;
    /** Generated warning region ID; `null` when no field name is resolvable. */
    readonly warningId: Signal<string | null>;
}
/**
 * Headless field name directive for label and ID resolution.
 *
 * Provides signals for resolving field names and generating accessible
 * IDs for error/warning description regions.
 *
 * ## Required input
 *
 * One of the following must be provided; otherwise `resolvedFieldName()`,
 * `errorId()`, and `warningId()` return `null` and the directive logs a
 * dev-mode `console.error` explaining the misconfiguration:
 *
 * - A non-empty `fieldName` input, or
 * - A non-empty `id` attribute on the host element.
 *
 * Downstream ARIA wiring is expected to handle `null` by skipping the
 * `aria-describedby` reference rather than producing unstable IDs like
 * `"-error"`.
 *
 * ## Features
 *
 * - **Name Resolution**: Resolves name from input or host element `id`
 * - **ID Generation**: Creates unique error/warning region IDs
 * - **ARIA Integration**: IDs suitable for `aria-describedby` usage
 *
 * ## Usage
 *
 * ```html
 * <div ngxHeadlessFieldName #fieldName="fieldName" fieldName="email">
 *   <label [for]="fieldName.resolvedFieldName()">Email</label>
 *   <input
 *     [id]="fieldName.resolvedFieldName()"
 *     [formField]="form.email"
 *     [attr.aria-describedby]="fieldName.errorId()"
 *   />
 *   <div [id]="fieldName.errorId()" role="alert">
 *     <!-- Error messages -->
 *   </div>
 * </div>
 * ```
 *
 * @example Override field name with signal
 * ```html
 * <div
 *   ngxHeadlessFieldName
 *   #fieldName="fieldName"
 *   [fieldName]="dynamicFieldName"
 * >
 *   <!-- Uses dynamic field name from signal or value -->
 * </div>
 * ```
 *
 * @example Auto-resolve from host element id
 * ```html
 * <div ngxHeadlessFieldName #fieldName="fieldName" id="email">
 *   <label [for]="fieldName.resolvedFieldName()">Email</label>
 * </div>
 * ```
 *
 * @group Directives
 */
declare class NgxHeadlessFieldName implements FieldNameStateSignals {
    #private;
    /**
     * The field name to use for ID generation.
     * If not provided, uses the host element `id`.
     */
    readonly fieldName: _angular_core.InputSignal<string | undefined>;
    /**
     * Resolved field name.
     *
     * Tier 1 (explicit input) → tier 2 (bound-control id) of the toolkit's
     * canonical field-name cascade — this directive is attached directly to
     * the control, so it never needs tier 3 (inherited context). See
     * {@link resolveFieldNameFromCandidates} for the full cascade.
     *
     * Returns `null` when neither a non-empty `fieldName` input nor a
     * non-empty host `id` is available. A `console.error` is emitted in
     * dev mode (once) to flag the misconfiguration — consumers should
     * gate ARIA wiring on a non-null value rather than producing unstable
     * IDs like `"-error"`.
     */
    readonly resolvedFieldName: Signal<string | null>;
    /**
     * Generated error region ID, or `null` when no field name is resolvable.
     */
    readonly errorId: Signal<string | null>;
    /**
     * Generated warning region ID, or `null` when no field name is resolvable.
     */
    readonly warningId: Signal<string | null>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<NgxHeadlessFieldName, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<NgxHeadlessFieldName, "[ngxHeadlessFieldName]", ["fieldName"], { "fieldName": { "alias": "fieldName"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

/**
 * Options for {@link createFieldsetAggregation}.
 *
 * `showErrors`/`showWarnings` are pre-resolved visibility signals, not raw
 * strategy inputs — per ADR-0005 (factories take DI-resolved values as
 * inputs and never call `inject()` themselves). `NgxHeadlessFieldset` keeps
 * owning the single `createErrorVisibility()`/`createShowErrorsComputed()`
 * seam call (ADR-0006) and threads the results in here; this factory only
 * combines them with the (visibility-independent) presence check.
 *
 * @group Reactive Primitives
 */
interface CreateFieldsetAggregationOptions {
    /** Reactive reader for the fieldset's own field state (from `field()()`). */
    readonly fieldState: SignalLike<unknown>;
    /**
     * Explicit field-list override. `null`/omitted means "not provided" —
     * aggregate `fieldState`'s own errors. See `NgxHeadlessFieldset.fields`
     * for the "not provided" vs "explicitly empty" distinction this preserves.
     */
    readonly fields?: ReactiveOrStatic<readonly FieldTree<unknown>[] | null>;
    /** Whether to aggregate nested field errors (`errorSummary()`) instead of direct ones (`errors()`). */
    readonly includeNestedErrors?: ReactiveOrStatic<boolean>;
    /** Pre-resolved blocking-error visibility (from the caller's own visibility seam call). */
    readonly showErrors: SignalLike<boolean>;
    /** Pre-resolved warning visibility, timed independently of {@link showErrors}. */
    readonly showWarnings: SignalLike<boolean>;
    /** Error message registry for 3-tier message resolution. */
    readonly errorMessages?: Readonly<ErrorMessageRegistry> | null;
}
/**
 * Fieldset error/warning aggregation result.
 *
 * @group Reactive Primitives
 */
interface FieldsetAggregationResult {
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
 * `createShowErrorsComputed()` call (ADR-0006's single seam).
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
declare function createFieldsetAggregation(options: Readonly<CreateFieldsetAggregationOptions>): FieldsetAggregationResult;
/**
 * Fieldset state signals exposed by the headless directive.
 *
 * @group Directives
 */
interface FieldsetStateSignals {
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
declare class NgxHeadlessFieldset<TFieldset = unknown> implements FieldsetStateSignals {
    #private;
    /**
     * The primary fieldset field from Signal Forms.
     */
    readonly field: _angular_core.InputSignal<FieldTree<TFieldset>>;
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
    readonly fields: _angular_core.InputSignal<readonly FieldTree<unknown>[] | null>;
    /**
     * Unique identifier for the fieldset.
     */
    readonly fieldsetId: _angular_core.InputSignal<string | undefined>;
    /**
     * Error display strategy override.
     * If undefined, inherits from form context or defaults to 'on-touch'.
     */
    readonly strategy: _angular_core.InputSignal<ErrorDisplayStrategy | undefined>;
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
    readonly warningStrategy: _angular_core.InputSignal<WarningDisplayStrategy | undefined>;
    /**
     * Form submission status override.
     * If not provided, inherits from form context.
     */
    readonly submittedStatus: _angular_core.InputSignal<SubmittedStatus | undefined>;
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
    readonly includeNestedErrors: _angular_core.InputSignalWithTransform<boolean, unknown>;
    /**
     * Resolved fieldset ID.
     */
    readonly resolvedFieldsetId: Signal<string>;
    /**
     * Resolved error display strategy.
     */
    readonly resolvedStrategy: Signal<ResolvedErrorDisplayStrategy>;
    /**
     * Resolved warning display strategy. Uses the full warning cascade:
     * explicit input → form context warning strategy → config default →
     * `'on-touch'`.
     */
    readonly resolvedWarningStrategy: Signal<ResolvedWarningDisplayStrategy>;
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
    readonly resolvedSubmittedStatus: Signal<SubmittedStatus>;
    readonly aggregatedErrors: Signal<readonly ValidationError[]>;
    readonly aggregatedWarnings: Signal<readonly ValidationError[]>;
    /**
     * {@link aggregatedErrors}, resolved to display messages. See the class
     * doc's usage note for why this (not `error.message`) is the recommended
     * rendering surface.
     */
    readonly resolvedErrors: Signal<readonly ResolvedError[]>;
    /** {@link aggregatedWarnings}, resolved the same way as {@link resolvedErrors}. */
    readonly resolvedWarnings: Signal<readonly ResolvedError[]>;
    readonly hasErrors: Signal<boolean>;
    readonly hasWarnings: Signal<boolean>;
    /**
     * Whether to show errors based on strategy.
     */
    readonly shouldShowErrors: Signal<boolean>;
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
    readonly shouldShowWarnings: Signal<boolean>;
    readonly isInvalid: Signal<boolean>;
    readonly isValid: Signal<boolean>;
    readonly isTouched: Signal<boolean>;
    readonly isDirty: Signal<boolean>;
    readonly isPending: Signal<boolean>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<NgxHeadlessFieldset<any>, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<NgxHeadlessFieldset<any>, "[ngxHeadlessFieldset]", ["fieldset"], { "field": { "alias": "field"; "required": true; "isSignal": true; }; "fields": { "alias": "fields"; "required": false; "isSignal": true; }; "fieldsetId": { "alias": "fieldsetId"; "required": false; "isSignal": true; }; "strategy": { "alias": "strategy"; "required": false; "isSignal": true; }; "warningStrategy": { "alias": "warningStrategy"; "required": false; "isSignal": true; }; "submittedStatus": { "alias": "submittedStatus"; "required": false; "isSignal": true; }; "includeNestedErrors": { "alias": "includeNestedErrors"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

/**
 * Resolved notification message with kind and human-facing message.
 *
 * @group Directives
 */
interface ResolvedNotificationMessage {
    readonly kind: string;
    readonly message: string;
}
/**
 * State signals exposed by the headless notification directive. A custom
 * styled component can render a complete grouped notification surface
 * (alert + status live regions, IDs, messages) using only these signals —
 * see the usage example below.
 *
 * @group Directives
 */
interface NotificationStateSignals {
    /** Whether any messages are present. */
    readonly hasMessages: Signal<boolean>;
    /** Resolved tone after applying content-driven semantics. */
    readonly resolvedTone: Signal<'error' | 'warning'>;
    /** Whether the error (`role="alert"`) container should expose content. */
    readonly showErrorContainer: Signal<boolean>;
    /** Whether the warning (`role="status"`) container should expose content. */
    readonly showWarningContainer: Signal<boolean>;
    /** Generated error container id, or `null` when no fieldName is resolvable. */
    readonly errorContainerId: Signal<string | null>;
    /** Generated warning container id, or `null` when no fieldName is resolvable. */
    readonly warningContainerId: Signal<string | null>;
    /** Resolved messages with applied 3-tier message priority. */
    readonly resolvedMessages: Signal<readonly ResolvedNotificationMessage[]>;
}
/**
 * Headless directive for grouped validation notifications.
 *
 * Owns the message-resolution, tone-routing, and ID-generation logic for
 * grouped fieldset feedback and custom summary cards. There is no in-tree
 * styled shell over this directive — `NgxFormFieldError`'s
 * `presentation="panel"` mode covers that case by composing
 * `NgxHeadlessErrorState`'s own error/warning override instead (same
 * tone-resolution outcome, one fewer headless directive in that
 * composition). Reach for this directive directly when building a custom
 * grouped-notification UI from scratch.
 *
 * ## Tone resolution rules
 *
 * Tone is fully content-driven — there is no `tone` input. The resolved
 * tone is:
 * - Any blocking (non-`warn:`) error → `'error'` (raises `role="alert"`).
 * - All-warning lists → `'warning'` (polite `role="status"`).
 * - Empty list → `'error'` (the container stays hidden anyway).
 *
 * Rationale: downgrading real errors to a polite region would bury the
 * alert; over-announcing warning-only text via `role="alert"` harms UX.
 *
 * ## Usage
 *
 * ```html
 * <div
 *   ngxHeadlessNotification
 *   #notification="notificationState"
 *   [errors]="aggregatedErrors"
 *   fieldName="address"
 * >
 *   @if (notification.showErrorContainer()) {
 *     <my-card role="alert" [id]="notification.errorContainerId()">
 *       @for (m of notification.resolvedMessages(); track m.kind) {
 *         <p>{{ m.message }}</p>
 *       }
 *     </my-card>
 *   }
 * </div>
 * ```
 *
 * @group Directives
 */
declare class NgxHeadlessNotification implements NotificationStateSignals {
    #private;
    /**
     * Grouped validation messages to present.
     *
     * Accepts a plain array or a reactive source (`Signal<…>` / `() => …`) —
     * unwrapped internally via {@link unwrapValue}, so a `computed()` fieldset
     * aggregation and a static array both work directly.
     */
    readonly errors: _angular_core.InputSignal<ReactiveOrStatic<readonly ValidationError[]> | undefined>;
    /**
     * Optional field/group identifier used to produce deterministic ids for
     * `aria-describedby` linkage. Pass `null` (or omit) to disable id output.
     */
    readonly fieldName: _angular_core.InputSignal<string | null | undefined>;
    readonly hasMessages: Signal<boolean>;
    readonly resolvedTone: Signal<'error' | 'warning'>;
    readonly showErrorContainer: Signal<boolean>;
    readonly showWarningContainer: Signal<boolean>;
    readonly errorContainerId: Signal<string | null>;
    readonly warningContainerId: Signal<string | null>;
    readonly resolvedMessages: Signal<readonly ResolvedNotificationMessage[]>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<NgxHeadlessNotification, never>;
    static ɵdir: _angular_core.ɵɵDirectiveDeclaration<NgxHeadlessNotification, "[ngxHeadlessNotification]", ["notificationState"], { "errors": { "alias": "errors"; "required": false; "isSignal": true; }; "fieldName": { "alias": "fieldName"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

/**
 * One resolved validation error, ready for rendering.
 *
 * - `kind` — convenience copy of `error.kind`, lifted to the top level so
 *   templates can write `entry.kind` instead of `entry.error.kind`.
 * - `message` — the resolved display string after the 3-tier cascade
 *   (validator message → registry → default).
 * - `id` — DOM ID built via `generateErrorId(fieldName, error.kind)`.
 *   Stable so external renderers and the in-tree wrapper can interoperate
 *   on `aria-describedby` without re-deriving IDs.
 * - `error` — the raw `ValidationError` from the field, kept for consumers
 *   that need access to validator-specific params, custom fields, or a
 *   non-stripped `message` override.
 *
 * @public
 * @group Reactive Primitives
 */
interface ResolvedFieldError {
    readonly kind: string;
    readonly message: string;
    readonly id: string;
    readonly error: ValidationError;
}
/**
 * Controls which subset of a field's errors `createErrorMessageSignal`
 * returns.
 *
 * - `false` (default) — blocking errors only
 * - `true` — blocking errors first, then warnings (preserves order)
 * - `'only'` — warnings only
 *
 * @public
 * @group Reactive Primitives
 */
type IncludeWarningsOption = boolean | 'only';
/**
 * Options for {@link createErrorMessageSignal}.
 *
 * @public
 * @group Reactive Primitives
 */
interface CreateErrorMessageSignalOptions {
    /**
     * Strip the `warn:` prefix from default messages for unknown kinds.
     *
     * Defaults to `true` because this primitive is display-oriented — users
     * shouldn't see internal `warn:` prefixes leaking into rendered text.
     * This is a small but deliberate divergence from
     * {@link resolveValidationErrorMessage}, whose default is `false`
     * (debugging-oriented).
     *
     * @default true
     */
    readonly stripWarningPrefix?: boolean;
    /**
     * Whether to include warnings in the resolved list.
     *
     * @default false
     * @see {@link IncludeWarningsOption}
     */
    readonly includeWarnings?: IncludeWarningsOption;
    /**
     * Explicit error-message registry override.
     *
     * When provided, the primitive uses this signal **instead of** injecting
     * `NGX_ERROR_MESSAGES`. Useful for tests, headless utilities, or call
     * sites that need a different registry per usage. Reactive: changes are
     * tracked.
     */
    readonly errorMessages?: Signal<ErrorMessageRegistry>;
    /**
     * Field name used to build per-error DOM IDs via
     * {@link generateErrorId}. When omitted the primitive falls back to the
     * field's own `name()` if the field state exposes one; otherwise IDs are
     * built from the empty string (yielding `-error-{kind}`), which is rarely
     * useful — supply `fieldName` explicitly when consumers care about
     * `aria-describedby` wiring.
     */
    readonly fieldName?: string | Signal<string | null | undefined>;
    /**
     * Error display strategy override forwarded to {@link createErrorVisibility}.
     *
     * Static value or `Signal<ErrorDisplayStrategy | undefined>`. Omit to
     * inherit from the form context (or fall back to `'on-touch'`).
     */
    readonly strategy?: ErrorDisplayStrategy$1 | Signal<ErrorDisplayStrategy$1 | undefined>;
    /**
     * Warning display strategy override forwarded to
     * {@link createWarningVisibility}. Only affects the entries selected by
     * {@link includeWarnings}.
     *
     * Static value or `Signal<WarningDisplayStrategy | undefined>`. Omit to
     * inherit from the form context's `warningStrategy()`, then
     * `NGX_SIGNAL_FORMS_CONFIG.defaultWarningStrategy`, then `'on-touch'`. No
     * tier consults the blocking-error strategy (ADR-0007).
     */
    readonly warningStrategy?: WarningDisplayStrategy$1 | Signal<WarningDisplayStrategy$1 | undefined>;
    /**
     * Submission status override forwarded to both {@link createErrorVisibility}
     * and {@link createWarningVisibility} — one status feeds both cascades.
     *
     * Only relevant for the `'on-submit'` strategy on either channel. Omit to
     * inherit from the form context.
     */
    readonly submittedStatus?: SubmittedStatus$1 | Signal<SubmittedStatus$1 | undefined>;
    /**
     * Optional injector for use outside an Angular injection context (e.g.
     * unit tests, `runInInjectionContext` wrappers). When omitted the
     * function must be called inside a DI context.
     */
    readonly injector?: Injector;
}
/**
 * Minimal field-state surface the primitive reads. Intentionally looser than
 * Angular's `FieldState`: we only need `invalid()`, `touched()`, and
 * `errors()`, plus an optional `name()` for fallback ID composition. Using
 * a loose shape lets host adapters (e.g. wrapper components projecting an
 * external errors signal) feed in synthesised states without a cast.
 *
 * Angular's `Signal<T>` is structurally `(() => T) & { ... brand }`; the
 * callable shape is enough at runtime, so the primitive types these as
 * plain getters and only the visibility-cascade adapter needs the brand.
 */
interface FieldStateLike {
    readonly invalid?: () => boolean;
    readonly touched?: () => boolean;
    readonly errors?: () => readonly ValidationError[];
    readonly name?: () => string;
}
type FieldStateInput = FieldStateLike | null | undefined;
type FieldStateAccessor = () => FieldStateInput;
/**
 * Reactive error-message resolution primitive for Angular Signal Forms.
 *
 * Produces a visibility-filtered, message-resolved view of a field's
 * validation errors. Combines three concerns the toolkit otherwise asks
 * consumers to compose by hand:
 *
 * 1. {@link createErrorVisibility} — gate blocking errors by the error
 *    display strategy cascade (explicit `strategy` option → form context →
 *    the global `NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy` →
 *    `'on-touch'`), and {@link createWarningVisibility} — gate the entries
 *    selected by `includeWarnings` by the separate warning cascade
 *    (`warningStrategy` option → form context `warningStrategy()` →
 *    `defaultWarningStrategy` → `'on-touch'`), so a form that defers errors
 *    to submit still shows warnings on touch (ADR-0007).
 * 2. {@link resolveValidationErrorMessage} — apply the 3-tier message
 *    cascade (validator message → registry → default).
 * 3. {@link generateErrorId} — produce per-error DOM IDs that match the
 *    in-tree wrapper, so `aria-describedby` wiring stays in lockstep.
 *
 * The registry is auto-injected from `NGX_ERROR_MESSAGES`. Pass
 * `options.errorMessages` to override (useful in tests or when running
 * outside a DI context).
 *
 * @param field A reactive accessor for the field state (e.g.
 *   `() => myFormField()`). Returning `null`/`undefined` yields an empty
 *   list. Mirrors the shape accepted by {@link createErrorVisibility}.
 * @param options Optional behavior overrides.
 * @returns A `Signal<readonly ResolvedFieldError[]>` that re-emits when
 *   the field, registry, or visibility changes. Empty when errors should
 *   not be displayed.
 *
 * @example Inside a component (DI auto-wired)
 * ```typescript
 * @Component({ ... })
 * export class EmailField {
 *   readonly field = input.required<FieldTree<string>>();
 *
 *   readonly errorMessages = createErrorMessageSignal(
 *     () => this.field()(),
 *     { fieldName: 'email' },
 *   );
 * }
 * ```
 *
 * @example With warnings rendered after errors
 * ```typescript
 * readonly all = createErrorMessageSignal(() => field(), {
 *   includeWarnings: true,
 *   fieldName: 'password',
 * });
 * ```
 *
 * @example Warnings only (e.g. an `<aside>` slot)
 * ```typescript
 * readonly warnings = createErrorMessageSignal(() => field(), {
 *   includeWarnings: 'only',
 *   fieldName: 'password',
 * });
 * ```
 *
 * @example Explicit registry (no DI)
 * ```typescript
 * const registry = signal<ErrorMessageRegistry>({ required: 'Required.' });
 * const messages = createErrorMessageSignal(() => field(), {
 *   errorMessages: registry,
 *   fieldName: 'name',
 *   injector: TestBed.inject(Injector),
 * });
 * ```
 *
 * @public
 * @group Reactive Primitives
 */
declare function createErrorMessageSignal(field: FieldStateAccessor, options?: CreateErrorMessageSignalOptions): Signal<readonly ResolvedFieldError[]>;

/**
 * Whether a form tree contains any required and/or any optional leaf field.
 *
 * Both flags can be `true` at once (a mixed form). An empty form — or one with
 * no leaf fields — reports `false` for both.
 *
 * @public
 * @group Reactive Primitives
 */
interface FieldOptionality {
    readonly hasRequired: boolean;
    readonly hasOptional: boolean;
}
type AnyFieldTree = FieldTree<unknown>;
/**
 * Synchronously summarise whether a form tree has any required / optional leaf
 * fields. Reads each leaf's `required()` signal, so calling this inside a
 * `computed()` (or `effect()`) makes the result reactive — conditionally
 * required fields update it automatically.
 *
 * @param tree A form `FieldTree` (typically a form root or a subtree).
 * @public
 * @group Reactive Primitives
 */
declare function summarizeFieldOptionality(tree: AnyFieldTree): FieldOptionality;
/**
 * Reactive summary of required / optional leaf fields across a form tree.
 *
 * Accepts a reader so the source tree can be reactive (e.g. an `input()` that
 * may be `undefined` until resolved). When the reader returns `null` /
 * `undefined`, both flags are `false`.
 *
 * Does not require an injection context (only creates `computed`s).
 *
 * @example
 * ```ts
 * const { hasRequired, hasOptional } = createFieldOptionalitySummary(
 *   () => this.formTree(),
 * );
 * ```
 *
 * @public
 * @group Reactive Primitives
 */
declare function createFieldOptionalitySummary(treeSource: () => AnyFieldTree | null | undefined): {
    readonly hasRequired: Signal<boolean>;
    readonly hasOptional: Signal<boolean>;
};

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
 *
 * @group Directives
 */
declare const NgxHeadlessToolkit: readonly [typeof NgxHeadlessErrorState, typeof NgxHeadlessErrorSummary, typeof NgxHeadlessFieldset, typeof NgxHeadlessCharacterCount, typeof NgxHeadlessFieldName, typeof NgxHeadlessNotification];

export { DEFAULT_DANGER_THRESHOLD, DEFAULT_WARNING_THRESHOLD, NgxHeadlessCharacterCount, NgxHeadlessErrorState, NgxHeadlessErrorSummary, NgxHeadlessFieldName, NgxHeadlessFieldset, NgxHeadlessNotification, NgxHeadlessToolkit, createCharacterCount, createErrorMessageSignal, createErrorState, createErrorSummaryEntries, createFieldOptionalitySummary, createFieldStateFlags, createFieldsetAggregation, dedupeValidationErrors, focusBoundControlFromError, readErrors, readFieldFlag, resolveFieldNameFromError, summarizeFieldOptionality, toErrorSummaryEntry };
export type { BooleanStateKey, CharacterCountLimitState, CharacterCountState, CharacterCountValue, CreateCharacterCountOptions, CreateErrorMessageSignalOptions, CreateErrorStateOptions, CreateErrorSummaryEntriesOptions, CreateFieldsetAggregationOptions, ErrorStateResult, ErrorStateSignals, ErrorSummaryEntriesResult, ErrorSummaryEntry, ErrorSummaryEntryData, ErrorSummarySignals, FieldNameStateSignals, FieldOptionality, FieldStateFlags, FieldStateLike$1 as FieldStateLike, FieldsetAggregationResult, FieldsetStateSignals, IncludeWarningsOption, NotificationStateSignals, ResolvedError, ResolvedFieldError, ResolvedNotificationMessage };
