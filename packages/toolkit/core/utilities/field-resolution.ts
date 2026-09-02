import { computed, type Signal } from '@angular/core';

/**
 * Normalize a potential field name into the deterministic v1 identity form.
 *
 * Returns `null` for nullish or whitespace-only inputs, and trims leading
 * and trailing whitespace everywhere else. This is the single source of
 * truth for "is this a usable field name?" — wrappers, headless directives,
 * and consumer-built field-identity surfaces should call it before using
 * a name as the basis for an `id` or `aria-describedby` chain.
 *
 * @example
 * ```typescript
 * normalizeFieldName('email');      // 'email'
 * normalizeFieldName('  email  ');  // 'email'
 * normalizeFieldName('   ');        // null
 * normalizeFieldName('');           // null
 * normalizeFieldName(null);         // null
 * normalizeFieldName(undefined);    // null
 * ```
 */
export function normalizeFieldName(
  fieldName: string | null | undefined,
): string | null {
  if (fieldName == null) {
    return null;
  }

  const trimmed = fieldName.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Resolve the first usable field name from a list of candidates.
 *
 * Each candidate is run through {@link normalizeFieldName} and the first
 * non-null result wins. Returns `null` only when every candidate is
 * nullish, empty, or whitespace-only.
 *
 * Use this when assembling a field name from a precedence chain — explicit
 * input first, host element id second, parent context third — and you want
 * the same trimming/empty-collapse rules applied to every source.
 *
 * ## The canonical field-name cascade
 *
 * This is the toolkit's canonical statement of the field-name precedence
 * contract. `NgxFormFieldError` and `NgxHeadlessFieldName` call this
 * primitive directly; `NgxFormFieldWrapper.resolvedFieldName` and
 * `createFieldNameResolver` implement the same cascade semantics inline
 * (same trim/empty-collapse rules) rather than calling it. Reading top to
 * bottom, later tiers only run when every earlier tier resolved to `null`:
 *
 * 1. **Explicit input** — a `fieldName` (or equivalent) input the consumer
 *    bound directly on *this* component/directive. Always wins when
 *    non-empty, regardless of what any ancestor already resolved.
 * 2. **Bound-control `id`** — read via {@link resolveFieldName} from the
 *    element the component/directive is itself attached to or projecting.
 *    Only components that own (or are attached to) the control participate
 *    in this tier — `NgxFormFieldWrapper` and `NgxHeadlessFieldName` both
 *    do; a standalone `NgxFormFieldError` does not, because it has no
 *    control of its own.
 * 3. **Inherited context** — the nearest ancestor's *already-resolved*
 *    field name, read through `NGX_SIGNAL_FORM_FIELD_CONTEXT`. This is how
 *    a projected `<ngx-form-field-error>` (which has no bound control of
 *    its own) still ends up with the wrapper's tier-2 id-derived name: the
 *    wrapper resolves tiers 1–2 for itself, publishes the result as
 *    context, and the child's own cascade stops at tier 3.
 *
 * Concretely:
 * - `NgxFormFieldWrapper.resolvedFieldName` cascades 1 → 2 (it owns the
 *   projected control, so it never needs tier 3).
 * - `NgxFormFieldError.#resolvedFieldName` and `NgxHeadlessFieldName`'s
 *   directive-scoped resolution cascade 1 → 3 for `NgxFormFieldError`
 *   (no control of its own to read an id from) and 1 → 2 for
 *   `NgxHeadlessFieldName` (attached directly to the control, so it never
 *   needs context).
 * - `createFieldNameResolver` (in `core/utilities/`) is the one wrapper-
 *   authoring helper that inserts an *optional* fourth tier — a projected
 *   label's `for=` attribute — between explicit and bound-control-id, for
 *   design systems that want that additional fallback.
 *
 * A `null` result at the end of any of these cascades means the same thing
 * everywhere: ARIA wiring is skipped for that field until a name becomes
 * resolvable, never a thrown error or a synthetic `"-error"` id.
 *
 * @example
 * ```typescript
 * // explicit input wins, then host id, then context
 * resolveFieldNameFromCandidates(
 *   this.fieldName(),
 *   this.#elementRef.nativeElement.id,
 *   this.#fieldContext?.fieldName(),
 * );
 * ```
 */
export function resolveFieldNameFromCandidates(
  ...fieldNameCandidates: readonly (string | null | undefined)[]
): string | null {
  for (const candidate of fieldNameCandidates) {
    const resolved = normalizeFieldName(candidate);
    if (resolved !== null) {
      return resolved;
    }
  }

  return null;
}

/**
 * Resolves the field name from an HTML element's `id`.
 *
 * Field identity is deterministic: the bound control must have an `id`.
 * Standalone error/headless APIs require an explicit `fieldName` input;
 * wrappers may infer from the control's `id`.
 *
 * Resolution rules (frozen for v1):
 * - Reads `getAttribute('id')` first, then the `element.id` property as a
 *   fallback. The two are equivalent for normal HTML hosts; the property
 *   read covers attribute-less / detached cases.
 * - Whitespace is trimmed. `"  email  "` → `"email"`. Whitespace-only and
 *   empty strings collapse to `null`, treated as "no id".
 *
 * @param element - The HTML element to resolve the field name from
 * @returns The trimmed `id`, or `null` if the element has no usable id
 */
export function resolveFieldName(element: HTMLElement): string | null {
  return resolveFieldNameFromCandidates(element.getAttribute('id'), element.id);
}

/**
 * Generates an error ID for a field, following WCAG best practices.
 *
 * When `kind` is omitted the result identifies the *container* that holds
 * one or more error messages — the form returned by the toolkit's wrappers
 * and used as a single `aria-describedby` target. When `kind` is supplied
 * the result identifies a *specific error*, suitable for headless consumers
 * that render one DOM node per error and want each node addressable on its
 * own. Both forms remain stable so wrapper-rendered and headless-rendered
 * IDs interoperate without the call site re-deriving the format.
 *
 * @param fieldName - The field name
 * @param kind - Optional error kind (e.g. `'required'`); appended after the
 *   `-error` suffix when present
 * @returns `{fieldName}-error` (container form) or
 *   `{fieldName}-error-{kind}` (per-error form)
 *
 * @example
 * ```typescript
 * generateErrorId('email');                  // 'email-error'
 * generateErrorId('email', 'required');      // 'email-error-required'
 * generateErrorId('address.city', 'minLen'); // 'address.city-error-minLen'
 * ```
 */
export function generateErrorId(fieldName: string, kind?: string): string {
  return kind === undefined
    ? `${fieldName}-error`
    : `${fieldName}-error-${kind}`;
}

/**
 * Computed ID signals for a resolved field name.
 *
 * @internal
 */
export interface FieldMessageIdSignals {
  readonly errorId: Signal<string | null>;
  readonly warningId: Signal<string | null>;
}

/**
 * Create computed error / warning IDs for a resolved field name.
 *
 * @internal
 */
export function createFieldMessageIdSignals(
  fieldName: () => string | null,
): FieldMessageIdSignals {
  return {
    errorId: computed(() => {
      const name = fieldName();
      return name === null ? null : generateErrorId(name);
    }),
    warningId: computed(() => {
      const name = fieldName();
      return name === null ? null : generateWarningId(name);
    }),
  };
}

/**
 * Options for building an `aria-describedby` chain in manual ARIA mode.
 */
export interface AriaDescribedByChainOptions {
  /** Base IDs that are always included (e.g. hint elements). */
  readonly baseIds?: readonly string[];
  /** Whether the error ID should be appended. */
  readonly showErrors?: boolean;
  /** Whether the warning ID should be appended. */
  readonly showWarnings?: boolean;
}

/**
 * Builds an `aria-describedby` ID chain for a field, following the same
 * conventions as the auto-ARIA layer.
 *
 * Use this when a custom control opts into `ngxSignalFormControlAria="manual"`
 * and needs to assemble its own described-by chain without duplicating the
 * ID-generation logic.
 *
 * @param fieldName - The field name (must match the control's `id`)
 * @param options - Controls which IDs are included in the chain
 * @returns A space-separated ID string, or `null` if no IDs apply
 *
 * @example
 * ```typescript
 * protected readonly describedBy = computed(() =>
 *   buildAriaDescribedBy('accessibilityAudit', {
 *     baseIds: ['accessibilityAudit-hint'],
 *     showErrors: shouldShowErrors(
 *       fieldState.invalid(), fieldState.touched(), strategy, submittedStatus,
 *     ),
 *   }),
 * );
 * ```
 */
export function buildAriaDescribedBy(
  fieldName: string,
  options: AriaDescribedByChainOptions = {},
): string | null {
  const parts: string[] = options.baseIds ? [...options.baseIds] : [];

  if (options.showErrors) {
    parts.push(generateErrorId(fieldName));
  }

  if (options.showWarnings) {
    parts.push(generateWarningId(fieldName));
  }

  return parts.length > 0 ? parts.join(' ') : null;
}

/**
 * Generates a warning ID for a field, following WCAG best practices.
 *
 * @param fieldName - The field name
 * @returns The warning ID in format: `{fieldName}-warning`
 *
 * @example
 * ```typescript
 * generateWarningId('password') // Returns: 'password-warning'
 * generateWarningId('address.zipCode') // Returns: 'address.zipCode-warning'
 * ```
 */
export function generateWarningId(fieldName: string): string {
  return `${fieldName}-warning`;
}

/**
 * Generates the ID for a selection cluster's visually-hidden required hint.
 *
 * `role="group"` does not support `aria-required` (only `radiogroup` does),
 * so `NgxFormFieldWrapper` relocates required-ness for `group` clusters into
 * a visually-hidden node referenced by `aria-describedby` instead of an ARIA
 * state — see
 * https://github.com/ngx-signal-forms/ngx-signal-forms/issues/300.
 *
 * @param fieldName - The field name
 * @returns The required-hint ID in format: `{fieldName}-required-hint`
 *
 * @example
 * ```typescript
 * generateRequiredHintId('consent'); // Returns: 'consent-required-hint'
 * ```
 */
export function generateRequiredHintId(fieldName: string): string {
  return `${fieldName}-required-hint`;
}
