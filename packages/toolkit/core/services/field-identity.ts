import {
  computed,
  Injectable,
  isDevMode,
  signal,
  type Signal,
} from '@angular/core';
import {
  createFieldMessageIdSignals,
  normalizeFieldName,
  resolveFieldName,
} from '../utilities/field-resolution';

/**
 * Resolve whether an element is visible from a CSS perspective.
 *
 * Prefers `Element.checkVisibility()` (Chromium 105+, Firefox 125+,
 * Safari 17.4+) so `display: none`, `hidden`, and ancestor-collapse all
 * register as "not visible". Falls back to `offsetParent` on older
 * runtimes — sufficient to detect `display: none` in detached subtrees,
 * which is the common collapsed-fieldset case the issue calls out.
 *
 * Exposed publicly (re-exported from `@ngx-signal-forms/toolkit`) so custom
 * controls and third-party wrappers can apply the exact same visibility test
 * the canonical wrapper uses internally, keeping the native-binding and
 * CSS-fallback ARIA paths in lockstep.
 *
 * @public
 */
export function isElementCssVisible(el: HTMLElement): boolean {
  const checkVisibility = (
    el as HTMLElement & {
      checkVisibility?: (options?: { checkVisibilityCSS?: boolean }) => boolean;
    }
  ).checkVisibility;
  if (typeof checkVisibility === 'function') {
    return checkVisibility.call(el, { checkVisibilityCSS: true });
  }
  return el.offsetParent !== null;
}

/**
 * A `Signal<boolean>` that is ALSO a one-shot visibility probe.
 *
 * - Called with no argument it behaves exactly like the underlying readonly
 *   signal: it returns the cached "is the bound control laid out?" value and
 *   participates in reactive dependency tracking (so it can be threaded into
 *   `computed()` / `createAriaInvalidSignal` unchanged).
 * - Called with an `HTMLElement` it delegates to {@link isElementCssVisible}
 *   for an ad-hoc, NON-reactive check of an arbitrary element — useful for a
 *   custom control that wants to reuse the wrapper's exact visibility rule
 *   for its own probe without re-implementing the CSS test.
 *
 * @public
 */
export interface ControlVisibilitySignal extends Signal<boolean> {
  /** Ad-hoc CSS-visibility probe for an arbitrary element. Non-reactive. */
  (el: HTMLElement): boolean;
}

/**
 * Centralized, element-scoped field identity service that owns the load-bearing
 * a11y primitives every assistive/headless surface depends on:
 *
 * - **Name resolution** — the resolved {@link NgxFieldIdentity.fieldName} and
 *   the bound control's {@link NgxFieldIdentity.controlId}. This service stores
 *   the resolved name; it does not own the resolution cascade. The canonical
 *   wrapper computes the name (precedence: explicit → bound-control `id` →
 *   `null`) and feeds it in. Wrappers that opt into the label `for=` tier do so
 *   via `createFieldNameResolver`, which exposes the same cascade with the
 *   label tier as an opt-in middle step.
 * - **Visibility** — {@link NgxFieldIdentity.isControlVisible}, a callable
 *   signal that returns the cached visibility flag with no argument and probes
 *   an arbitrary element (via {@link isElementCssVisible}) when given one.
 * - **Stable ID generation** — {@link NgxFieldIdentity.errorId} (`{name}-error`)
 *   and {@link NgxFieldIdentity.warningId} (`{name}-warning`), derived from the
 *   resolved field name and `null` when no name is available.
 *
 * Provided at the `NgxFormFieldWrapper` level via `providers: [NgxFieldIdentity]`.
 * `NgxSignalFormAutoAria` and hint directives inject it optionally, falling
 * back to their current behavior when absent.
 *
 * Element-scoped: `providedIn: null` makes it a contract violation to
 * provide this service at the root injector. Each wrapper gets a fresh
 * instance keyed on its own DOM subtree.
 *
 * The class is part of the public API; the `set*` writer methods are tagged
 * `@internal` and must not be called from outside this package — consumers
 * read the resolved signals, they do not drive them.
 *
 * @public
 */
@Injectable({ providedIn: null })
export class NgxFieldIdentity {
  readonly #fieldName = signal<string | null>(null);
  readonly #controlElement = signal<HTMLElement | null>(null);
  readonly #controlId = signal<string | null>(null);
  readonly #hintIds = signal<readonly string[]>([]);
  readonly #isControlVisible = signal(true);
  #warnedNoId = false;

  /**
   * Resolved field name. Null when no field name can be determined.
   * Updated by `NgxFormFieldWrapper` via `setFieldName`.
   */
  readonly fieldName = this.#fieldName.asReadonly();

  /**
   * The bound control element's `id` attribute.
   * Null when no control is found or when the control has no `id`.
   */
  readonly controlId = this.#controlId.asReadonly();

  readonly #fieldMessageIds = createFieldMessageIdSignals(this.#fieldName);

  /**
   * Generated error element ID for the field (`{fieldName}-error`).
   * Null when no field name is available.
   */
  readonly errorId = this.#fieldMessageIds.errorId;

  /**
   * Generated warning element ID for the field (`{fieldName}-warning`).
   * Null when no field name is available.
   */
  readonly warningId = this.#fieldMessageIds.warningId;

  /**
   * Hint IDs contributed by the surrounding hint registry, filtered for
   * this field. Updated by `NgxFormFieldWrapper` when `hintDescriptors` changes.
   */
  readonly hintIds = this.#hintIds.asReadonly();

  /**
   * Whether the bound control currently has a CSS layout box that the
   * user would interact with. Flips to `false` when the control is inside
   * a collapsed `<details>`, hidden via the `hidden` attribute, or set
   * to `display: none`. Stays `true` for elements merely scrolled off
   * the viewport.
   *
   * Driven by the wrapper, which calls `setControlVisible` from its
   * `afterEveryRender` write phase using `Element.checkVisibility()`
   * (with an `offsetParent` fallback). Defaults to `true` so consumers
   * never strip ARIA attributes pre-visibility-eval.
   *
   * This member is a {@link ControlVisibilitySignal}: a real `Signal<boolean>`
   * (reactive, threadable into `computed()`) that additionally accepts an
   * `HTMLElement` argument to perform an ad-hoc, non-reactive visibility probe
   * via {@link isElementCssVisible}. Probing an element never mutates the
   * cached flag — only `setControlVisible` does.
   *
   * @example No-arg: read the cached, reactive flag.
   * ```ts
   * effect(() => console.log('laid out?', identity.isControlVisible()));
   * ```
   *
   * @example Element-arg: reuse the wrapper's exact visibility rule ad hoc.
   * ```ts
   * const laidOut = identity.isControlVisible(myEl);
   * ```
   */
  readonly isControlVisible: ControlVisibilitySignal =
    this.#createControlVisibilitySignal();

  /**
   * Builds the hybrid {@link ControlVisibilitySignal}: a function that probes
   * an arbitrary element when called with one, and otherwise defers to the
   * cached readonly signal. The readonly signal's own properties (including the
   * Angular signal brand and `SIGNAL` node) are copied onto the function so it
   * remains a fully-valid `Signal<boolean>` for reactive consumers.
   */
  #createControlVisibilitySignal(): ControlVisibilitySignal {
    const readonly = this.#isControlVisible.asReadonly();
    const probe = (el?: HTMLElement): boolean =>
      el === undefined ? readonly() : isElementCssVisible(el);
    for (const key of [
      ...Object.getOwnPropertyNames(readonly),
      ...Object.getOwnPropertySymbols(readonly),
    ]) {
      const descriptor = Object.getOwnPropertyDescriptor(readonly, key);
      if (descriptor) {
        Object.defineProperty(probe, key, descriptor);
      }
    }
    return probe as ControlVisibilitySignal;
  }

  /**
   * Aggregated `aria-describedby` ID chain for this field, derived from
   * `hintIds`. Returns `null` when no IDs apply.
   *
   * Consumers that need to append error / warning IDs based on visibility
   * strategy (e.g. auto-aria) build on top of this baseline; this aggregator
   * does not encode `shouldShowErrors` because that decision is owned by
   * the consumer, not the identity service.
   */
  readonly describedBy = computed<string | null>(() => {
    const ids = this.#hintIds();
    return ids.length > 0 ? ids.join(' ') : null;
  });

  /**
   * Returns the currently bound control element, or null if not yet resolved.
   */
  resolveControlElement(): HTMLElement | null {
    return this.#controlElement();
  }

  // -- Package-internal setters. `@internal`-tagged to signal non-public intent --

  /**
   * Updates the resolved field name.
   * Called by `NgxFormFieldWrapper` in its `afterEveryRender` write phase.
   * @internal
   */
  setFieldName(name: string | null): void {
    const normalizedName = normalizeFieldName(name);
    if (normalizedName !== this.#fieldName()) {
      this.#fieldName.set(normalizedName);
    }
  }

  /**
   * Updates the bound control element reference.
   *
   * Called by `NgxFormFieldWrapper` in its `afterEveryRender` write phase.
   * Callers should call `setFieldName` first so dev-only diagnostics evaluate
   * the latest explicit name state before checking id-less controls.
   * Emits a dev-mode warning when the element has no `id` attribute and no
   * explicit `fieldName` override is present — the a11y gap is surfaced once
   * per instance without crashing production rendering.
   *
   * @internal
   */
  setControlElement(el: HTMLElement | null): void {
    const nextControlId = el ? resolveFieldName(el) : null;
    if (nextControlId !== this.#controlId()) {
      this.#controlId.set(nextControlId);
    }

    if (el === this.#controlElement()) {
      return;
    }
    this.#controlElement.set(el);
    if (!el) {
      // No element to evaluate — assume visible so consumers do not strip
      // attributes based on stale "hidden" state from the previous element.
      this.#isControlVisible.set(true);
      return;
    }
    const isWrapperHosted = el.closest('ngx-form-field-wrapper') !== null;
    if (
      isDevMode() &&
      !el.id &&
      !this.#fieldName() &&
      !this.#warnedNoId &&
      !isWrapperHosted
    ) {
      this.#warnedNoId = true;
      // oxlint-disable-next-line no-console -- dev-only a11y diagnostic
      console.warn(
        '[ngx-signal-forms] NgxFieldIdentity: the bound control has no `id` ' +
          'attribute. `label[for]` and `aria-describedby` linking will not ' +
          'work until an `id` is set on the control element or an explicit ' +
          '`fieldName` input is added to the wrapper.',
        el,
      );
    }
  }

  /**
   * Updates the cached visibility of the bound control. Idempotent.
   *
   * The wrapper drives this from its `afterEveryRender` write phase using
   * `Element.checkVisibility()` (or `offsetParent` fallback). Polling the
   * visibility on each render rather than via `IntersectionObserver`
   * avoids both the spurious "scroll = hidden" semantics IO has and the
   * teardown/leak surface of long-lived observers.
   *
   * @internal
   */
  setControlVisible(isVisible: boolean): void {
    if (isVisible !== this.#isControlVisible()) {
      this.#isControlVisible.set(isVisible);
    }
  }

  /**
   * Updates the hint IDs visible to this field's identity. Idempotent —
   * shallow array equality short-circuits the write so consumers don't
   * re-run their describedBy computeds when the list is structurally
   * unchanged.
   *
   * @internal
   */
  setHintIds(ids: readonly string[]): void {
    const current = this.#hintIds();
    if (
      current.length === ids.length &&
      current.every((id, index) => id === ids[index])
    ) {
      return;
    }
    this.#hintIds.set(ids);
  }
}
