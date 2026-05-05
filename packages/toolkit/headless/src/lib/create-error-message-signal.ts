import { computed, inject, type Injector, type Signal } from '@angular/core';
import type { ValidationError } from '@angular/forms/signals';
import {
  assertInjector,
  createErrorVisibility,
  generateErrorId,
  NGX_ERROR_MESSAGES,
  readDirectErrors,
  resolveValidationErrorMessage,
  splitByKind,
  type CreateErrorVisibilityOptions,
  type ErrorDisplayStrategy,
  type ErrorMessageRegistry,
  type SubmittedStatus,
} from '@ngx-signal-forms/toolkit/core';

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
 */
export interface ResolvedFieldError {
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
 */
export type IncludeWarningsOption = boolean | 'only';

/**
 * Options for {@link createErrorMessageSignal}.
 *
 * @public
 */
export interface CreateErrorMessageSignalOptions {
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
  readonly strategy?:
    | ErrorDisplayStrategy
    | Signal<ErrorDisplayStrategy | undefined>;

  /**
   * Submission status override forwarded to {@link createErrorVisibility}.
   *
   * Only relevant for the `'on-submit'` strategy. Omit to inherit from the
   * form context.
   */
  readonly submittedStatus?:
    | SubmittedStatus
    | Signal<SubmittedStatus | undefined>;

  /**
   * Optional injector for use outside an Angular injection context (e.g.
   * unit tests, `runInInjectionContext` wrappers). When omitted the
   * function must be called inside a DI context.
   */
  // Angular's Injector is inherently mutable; Readonly<Injector> is not practical here.
  // oxlint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Angular's Injector is mutable by design
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
 * 1. {@link createErrorVisibility} — gate by the error display strategy
 *    cascade (DI context → `'on-touch'` default).
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
 */
export function createErrorMessageSignal(
  field: FieldStateAccessor,
  options?: CreateErrorMessageSignalOptions,
): Signal<readonly ResolvedFieldError[]> {
  return assertInjector(createErrorMessageSignal, options?.injector, () => {
    const registrySignal = options?.errorMessages;
    // Only auto-inject when no explicit registry is supplied. Calling
    // `inject()` when a registry is already provided would force callers to
    // wrap every test in `runInInjectionContext`, defeating the explicit
    // override.
    const injectedRegistry =
      registrySignal === undefined
        ? inject(NGX_ERROR_MESSAGES, { optional: true })
        : null;

    const visibilityOptions: CreateErrorVisibilityOptions = {
      strategy: options?.strategy,
      submittedStatus: options?.submittedStatus,
    };
    // `createErrorVisibility` is typed against Angular's `Partial<ErrorVisibilityState>`
    // (signal-branded `invalid` / `touched`). Our `FieldStateLike` keeps the
    // surface as plain getters because the runtime cascade only calls them.
    // Casting at the boundary is safe — tested via the visibility specs in
    // `create-error-message-signal.spec.ts`.
    const showErrors = createErrorVisibility(
      field as Parameters<typeof createErrorVisibility>[0],
      visibilityOptions,
    );

    const include = options?.includeWarnings ?? false;
    const stripWarningPrefix = options?.stripWarningPrefix ?? true;
    const fieldNameOption = options?.fieldName;

    const resolvedFieldName = computed<string>(() => {
      if (typeof fieldNameOption === 'string') return fieldNameOption;
      if (typeof fieldNameOption === 'function') {
        return fieldNameOption() ?? readNameFromField(field) ?? '';
      }
      return readNameFromField(field) ?? '';
    });

    return computed<readonly ResolvedFieldError[]>(() => {
      if (!showErrors()) return EMPTY;

      const errors = readDirectErrors(field());
      if (errors.length === 0) return EMPTY;

      const split = splitByKind(errors);
      const ordered = orderByInclude(split.blocking, split.warnings, include);
      if (ordered.length === 0) return EMPTY;

      const registry = registrySignal ? registrySignal() : injectedRegistry;
      const fieldName = resolvedFieldName();

      return ordered.map((error) => ({
        kind: error.kind,
        message: resolveValidationErrorMessage(error, registry, {
          stripWarningPrefix,
        }),
        id: generateErrorId(fieldName, error.kind),
        error,
      }));
    });
  });
}

const EMPTY: readonly ResolvedFieldError[] = Object.freeze([]);

function orderByInclude(
  blocking: readonly ValidationError[],
  warnings: readonly ValidationError[],
  include: IncludeWarningsOption,
): readonly ValidationError[] {
  if (include === 'only') return warnings;
  if (include) return [...blocking, ...warnings];
  return blocking;
}

function readNameFromField(accessor: FieldStateAccessor): string | null {
  const state = accessor();
  if (!state || typeof state !== 'object') return null;
  const name = state.name;
  return typeof name === 'function' ? name() : null;
}
