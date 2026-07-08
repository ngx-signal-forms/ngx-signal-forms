import {
  metadata,
  REQUIRED,
  type FieldContext,
  type LogicFn,
  type PathKind,
  type SchemaPath,
  type SchemaPathRules,
} from '@angular/forms/signals';

/**
 * Minimal structural contract for a Standard Schema (v1) compatible
 * validator — e.g. a Zod, Valibot, or ArkType schema.
 *
 * Deliberately narrower than `@standard-schema/spec`'s `StandardSchemaV1`
 * (which also requires `vendor`/`version`/`types`): this toolkit only ever
 * *calls* `~standard.validate`, so keeping the contract to that single method
 * avoids importing an extra runtime type-only dependency while remaining
 * structurally assignable from any real Standard Schema implementation.
 *
 * @public
 */
export interface StandardSchemaLike<TInput = unknown> {
  readonly '~standard': {
    readonly validate: (
      value: unknown,
    ) =>
      | StandardSchemaLikeResult<TInput>
      | PromiseLike<StandardSchemaLikeResult<TInput>>;
  };
}

/**
 * A single Standard Schema validation issue, narrowed to the fields this
 * toolkit reads (`path`, to target the failing key).
 *
 * @public
 */
export interface StandardSchemaLikeIssue {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }>;
}

/**
 * Result shape returned by `~standard.validate`. A successful validation
 * omits `issues` (or returns an empty array); a failed one returns a
 * non-empty `issues` array.
 *
 * @public
 */
export interface StandardSchemaLikeResult<TInput> {
  readonly issues?: ReadonlyArray<StandardSchemaLikeIssue>;
  readonly value?: TInput;
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

function issueTargetsKey(issue: StandardSchemaLikeIssue, key: string): boolean {
  const [firstSegment] = issue.path ?? [];

  if (firstSegment === undefined) {
    return false;
  }

  const firstKey =
    typeof firstSegment === 'object' ? firstSegment.key : firstSegment;

  return firstKey === key;
}

/**
 * Probes a Standard Schema to determine whether a given top-level object key
 * is required, using only the public `~standard.validate` contract (Standard
 * Schema has no runtime shape/keys introspection, so this is the only
 * library-agnostic signal available).
 *
 * The probe validates `{ [key]: undefined }` — an otherwise-empty object with
 * only `key` present-but-undefined — and reports the key as required when the
 * result contains an issue whose path targets it. Other keys are left absent
 * from the probe object; any issues they produce are irrelevant and ignored.
 *
 * Known limitations (documented, not silently papered over):
 * - Async validators (`~standard.validate` returning a `Promise`) can't be
 *   resolved synchronously, so the probe reports `false` rather than block
 *   the reactive metadata graph on an async result.
 * - A schema that throws synchronously when probed (e.g. a `.refine()` that
 *   assumes other fields are present) is treated as `false` rather than
 *   propagating the exception into form compilation.
 * - Required-ness that only exists via cross-field refinement (e.g. "email is
 *   required only when phone is empty") cannot be captured by a single-key
 *   probe; this reports the key's *unconditional* base-schema requiredness.
 */
function isStandardSchemaKeyRequired(
  schema: StandardSchemaLike,
  key: string,
): boolean {
  let result:
    | StandardSchemaLikeResult<unknown>
    | PromiseLike<StandardSchemaLikeResult<unknown>>;

  try {
    result = schema['~standard'].validate({ [key]: undefined });
  } catch {
    return false;
  }

  if (isPromiseLike(result)) {
    return false;
  }

  return (result.issues ?? []).some((issue) => issueTargetsKey(issue, key));
}

/**
 * Derives `aria-required` for a Standard Schema (Zod, Valibot, ArkType, …)
 * validated field by wiring Angular Signal Forms' `REQUIRED` metadata key
 * from the schema, mirroring what the native `required()` validator does for
 * hand-written Signal Forms validation.
 *
 * **Why this exists**: `validateStandardSchema()` (from
 * `@angular/forms/signals`) only registers tree-level validation errors — it
 * never touches `REQUIRED` metadata, because the Standard Schema spec has no
 * runtime way to ask "is this key required?" directly. Without `REQUIRED`
 * metadata, `FieldState.required()` stays `false`, so `NgxSignalFormAutoAria`
 * never writes `aria-required`, and `ngx-form-field-wrapper`'s
 * `showMarkerWhen: 'required'` auto-marker never fires — see
 * [#118](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/118).
 *
 * This function closes that gap with the only library-agnostic technique
 * available: probing the schema with the field's own key set to `undefined`
 * (see {@link isStandardSchemaKeyRequired}) and registering the result as
 * `REQUIRED` metadata. `REQUIRED` is an OR-reducing metadata key, so this
 * composes safely alongside other `required()`/`metadata(path, REQUIRED, …)`
 * registrations on the same field.
 *
 * **Call this once per field**, bound directly to that field's own path, next
 * to the `validateStandardSchema()` call that validates the object owning it.
 * Standard Schema doesn't expose an object's keys at runtime, so there's no
 * way to derive every required field from a single root-level call — this
 * mirrors calling `required()` per field in hand-written schemas.
 *
 * @param path The field's own `SchemaPath` (e.g. `path.firstName`) — required-ness
 *   is registered on this exact field.
 * @param schema The same Standard Schema (or `LogicFn` resolving to one) passed to
 *   `validateStandardSchema()` for the object that owns `path`.
 *
 * @example
 * ```typescript
 * import { form, validateStandardSchema } from '@angular/forms/signals';
 * import { requiredFromStandardSchema } from '@ngx-signal-forms/toolkit/core';
 *
 * const travelerForm = form(model, (path) => {
 *   validateStandardSchema(path, TravelerSchema);
 *   requiredFromStandardSchema(path.firstName, TravelerSchema);
 *   requiredFromStandardSchema(path.lastName, TravelerSchema);
 * });
 * ```
 *
 * @public
 */
export function requiredFromStandardSchema<
  TValue,
  TModel = unknown,
  TPathKind extends PathKind = PathKind.Root,
>(
  // oxlint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- SchemaPath is an Angular Signal Forms framework type, not modeled as readonly.
  path: SchemaPath<TValue, SchemaPathRules.Supported, TPathKind>,
  schema:
    | StandardSchemaLike<TModel>
    | LogicFn<TValue, StandardSchemaLike<TModel> | undefined, TPathKind>,
): void {
  metadata(path, REQUIRED, (ctx: FieldContext<TValue, TPathKind>) => {
    const resolvedSchema = typeof schema === 'function' ? schema(ctx) : schema;

    if (!resolvedSchema) {
      return false;
    }

    const pathKeys = ctx.pathKeys();
    const key = pathKeys.at(-1);

    if (key === undefined) {
      return false;
    }

    return isStandardSchemaKeyRequired(resolvedSchema, key);
  });
}
