import {
  computed,
  Injectable,
  isDevMode,
  type Signal,
  signal,
} from '@angular/core';
import {
  generateErrorId,
  generateWarningId,
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
 * Exported so the wrapper can call it from its render hook to push
 * visibility into `_setControlVisible`.
 *
 * @internal
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
 * Centralized field identity service that owns field-name resolution,
 * ID generation, describedBy aggregation, control-element discovery, and
 * the shared visibility flag.
 *
 * Provided at the `NgxFormFieldWrapper` level via `providers: [NgxFieldIdentity]`.
 * `NgxSignalFormAutoAria` and hint directives inject it optionally, falling
 * back to their current behavior when absent.
 *
 * Element-scoped: `providedIn: null` makes it a contract violation to
 * provide this service at the root injector. Each wrapper gets a fresh
 * instance keyed on its own DOM subtree.
 *
 * The class is exported so the wrapper can list it in `providers`; the
 * `_set*` writer methods are tagged `@internal` and must not be called
 * from outside this package.
 *
 * @internal
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
   * Updated by `NgxFormFieldWrapper` via `_setFieldName`.
   */
  readonly fieldName: Signal<string | null> = this.#fieldName.asReadonly();

  /**
   * The bound control element's `id` attribute.
   * Null when no control is found or when the control has no `id`.
   */
  readonly controlId: Signal<string | null> = this.#controlId.asReadonly();

  /**
   * Generated error element ID for the field (`{fieldName}-error`).
   * Null when no field name is available.
   */
  readonly errorId: Signal<string | null> = computed(() => {
    const name = this.#fieldName();
    return name ? generateErrorId(name) : null;
  });

  /**
   * Generated warning element ID for the field (`{fieldName}-warning`).
   * Null when no field name is available.
   */
  readonly warningId: Signal<string | null> = computed(() => {
    const name = this.#fieldName();
    return name ? generateWarningId(name) : null;
  });

  /**
   * Hint IDs contributed by the surrounding hint registry, filtered for
   * this field. Updated by `NgxFormFieldWrapper` when `hintDescriptors` changes.
   */
  readonly hintIds: Signal<readonly string[]> = this.#hintIds.asReadonly();

  /**
   * Whether the bound control currently has a CSS layout box that the
   * user would interact with. Flips to `false` when the control is inside
   * a collapsed `<details>`, hidden via the `hidden` attribute, or set
   * to `display: none`. Stays `true` for elements merely scrolled off
   * the viewport.
   *
   * Driven by the wrapper, which calls `_setControlVisible` from its
   * `afterEveryRender` write phase using `Element.checkVisibility()`
   * (with an `offsetParent` fallback). Defaults to `true` so consumers
   * never strip ARIA attributes pre-visibility-eval.
   */
  readonly isControlVisible: Signal<boolean> =
    this.#isControlVisible.asReadonly();

  /**
   * Aggregated `aria-describedby` ID chain for this field, derived from
   * `hintIds`. Returns `null` when no IDs apply.
   *
   * Consumers that need to append error / warning IDs based on visibility
   * strategy (e.g. auto-aria) build on top of this baseline; this aggregator
   * does not encode `shouldShowErrors` because that decision is owned by
   * the consumer, not the identity service.
   */
  readonly describedBy: Signal<string | null> = computed(() => {
    const ids = this.#hintIds();
    return ids.length > 0 ? ids.join(' ') : null;
  });

  /**
   * Returns the currently bound control element, or null if not yet resolved.
   */
  resolveControlElement(): HTMLElement | null {
    return this.#controlElement();
  }

  // -- Package-internal setters. Prefixed with `_` to signal non-public intent --

  /**
   * Updates the resolved field name.
   * Called by `NgxFormFieldWrapper` in its `afterEveryRender` write phase.
   * @internal
   */
  _setFieldName(name: string | null): void {
    if (name !== this.#fieldName()) {
      this.#fieldName.set(name);
    }
  }

  /**
   * Updates the bound control element reference.
   *
   * Called by `NgxFormFieldWrapper` in its `afterEveryRender` write phase.
   * Callers should set `_setFieldName` first so dev-only diagnostics evaluate
   * the latest explicit name state before checking id-less controls.
   * Emits a dev-mode warning when the element has no `id` attribute and no
   * explicit `fieldName` override is present — the a11y gap is surfaced once
   * per instance without crashing production rendering.
   *
   * @internal
   */
  _setControlElement(el: HTMLElement | null): void {
    const nextControlId = el && el.id.length > 0 ? el.id : null;
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
  _setControlVisible(isVisible: boolean): void {
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
  _setHintIds(ids: readonly string[]): void {
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
