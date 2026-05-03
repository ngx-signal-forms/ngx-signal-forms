import { computed, isDevMode, type Signal } from '@angular/core';

/**
 * Reactive reader of the bound control's host element. Returns `null` when
 * no control has been projected (or queried) yet. Typically a `computed`
 * over `contentChildren(NgxSignalFormControlSemanticsDirective)`.
 *
 * @public
 */
export type BoundControlElementReader = () => HTMLElement | null;

/**
 * Optional reader for a label's `for=` attribute. Useful for design systems
 * that ship labelable directives separate from native `<label for=…>`
 * (Spartan's `BrnLabel`, for instance).
 *
 * @public
 */
export type LabelForReader = () => string | null;

/**
 * Inputs for {@link createFieldNameResolver}.
 *
 * @public
 */
export interface CreateFieldNameResolverOptions {
  /**
   * Explicit consumer-supplied field name (typically a wrapper input).
   * Returns `undefined` when the consumer hasn't bound a value.
   */
  readonly explicit: Signal<string | undefined>;

  /**
   * Reader for the bound control's host element. Used to surface the
   * `id` attribute as the third-tier fallback. Returns `null` when no
   * bound control has been projected yet.
   */
  readonly boundControl: BoundControlElementReader;

  /**
   * Optional reader for a projected label's `for=` attribute. When present
   * AND the explicit name is empty, the resolver falls back to this value
   * before consulting the bound control's `id`. When omitted, the resolver
   * skips this tier.
   */
  readonly labelFor?: LabelForReader;

  /**
   * Identifier used in the dev-mode warning ("[<name>] could not resolve
   * a deterministic field name…"). Typically the wrapper component name
   * (e.g. `'spartan-form-field'` or `'mat-form-field'`).
   */
  readonly wrapperName: string;
}

/**
 * Pure-signal factory that resolves a deterministic `fieldName` for a
 * form-field wrapper. Mirrors the priority cascade in the canonical
 * `NgxFormFieldWrapper`:
 *
 *   1. Explicit consumer input (trimmed; non-empty).
 *   2. Optional label `for=` attribute reader (trimmed; non-empty).
 *   3. Bound control's `id` attribute.
 *   4. `null` (auto-ARIA gracefully no-ops; emits a one-shot dev warning).
 *
 * The dev-mode warning latches on first miss so it never spams. Once a
 * name resolves the latch is closed for the lifetime of the resolver.
 *
 * @example Spartan wrapper (uses tier-3 only, skips label `for=` tier)
 * ```ts
 * readonly resolvedFieldName = createFieldNameResolver({
 *   explicit: this.fieldName,
 *   labelFor: () => this.projectedLabels()[0]?.for() ?? null,
 *   boundControl: () => this.boundSemantics()[0]?.elementRef.nativeElement ?? null,
 *   wrapperName: 'spartan-form-field',
 * });
 * ```
 *
 * @public
 */
export function createFieldNameResolver(
  options: CreateFieldNameResolverOptions,
): Signal<string | null> {
  const { explicit, boundControl, labelFor, wrapperName } = options;

  let warned = false;

  return computed<string | null>(() => {
    const explicitValue = explicit()?.trim();
    if (explicitValue !== undefined && explicitValue.length > 0) {
      return explicitValue;
    }

    if (labelFor) {
      const target = labelFor()?.trim();
      if (target !== undefined && target.length > 0) {
        return target;
      }
    }

    const boundId = boundControl()?.id;
    if (boundId && boundId.length > 0) {
      return boundId;
    }

    if (isDevMode() && !warned) {
      warned = true;
      console.error(
        `[${wrapperName}] Could not resolve a deterministic field name. ` +
          `Add an explicit \`fieldName\` input, a labelable id (e.g. \`for=\`), ` +
          `or an \`id\` attribute on the bound control. ARIA wiring will be ` +
          `skipped until a name is available.`,
      );
    }

    return null;
  });
}
