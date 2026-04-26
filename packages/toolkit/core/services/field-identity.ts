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
 * Centralized field identity service that owns field-name resolution,
 * ID generation, describedBy aggregation, control-element discovery, and
 * a shared visibility observer.
 *
 * Provided at the `NgxFormFieldWrapper` level via `providers: [NgxFieldIdentity]`.
 * `NgxSignalFormAutoAria` and hint directives inject it optionally, falling
 * back to their current behavior when absent.
 *
 * @internal
 */
@Injectable()
export class NgxFieldIdentity {
  readonly #fieldName = signal<string | null>(null);
  readonly #controlElement = signal<HTMLElement | null>(null);
  readonly #hintIds = signal<readonly string[]>([]);
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
  readonly controlId: Signal<string | null> = computed(() => {
    const el = this.#controlElement();
    return el && el.id.length > 0 ? el.id : null;
  });

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
   * Returns the currently bound control element, or null if not yet resolved.
   */
  resolveControlElement(): HTMLElement | null {
    return this.#controlElement();
  }

  /**
   * Subscribes to visibility changes of the bound control element via
   * `IntersectionObserver`. Returns a cleanup/disconnect function.
   *
   * Falls back to a no-op in environments where `IntersectionObserver` is
   * absent (SSR, some test environments).
   *
   * @param cb - Called with `true` when the element enters the viewport,
   *   `false` when it leaves.
   */
  onControlVisibilityChange(cb: (isVisible: boolean) => void): () => void {
    const el = this.#controlElement();
    if (!el || typeof IntersectionObserver === 'undefined') {
      return () => undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      const last = entries[entries.length - 1];
      if (last) {
        cb(last.isIntersecting);
      }
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
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
   * Called by `NgxFormFieldWrapper` in its `afterEveryRender` write phase.
   * Emits a dev-mode warning when the element has no `id` attribute and no
   * explicit `fieldName` override is present — the a11y gap is surfaced once
   * per instance without crashing production rendering.
   * @internal
   */
  _setControlElement(el: HTMLElement | null): void {
    if (el === this.#controlElement()) {
      return;
    }
    this.#controlElement.set(el);
    if (
      isDevMode() &&
      el &&
      !el.id &&
      !this.#fieldName() &&
      !this.#warnedNoId
    ) {
      this.#warnedNoId = true;
      // oxlint-disable-next-line no-console -- dev-only a11y diagnostic
      console.warn(
        '[ngx-signal-forms] NgxFieldIdentity: the bound control has no `id` ' +
          'attribute. Label-for and aria-describedby linking will not work ' +
          'until an `id` is set on the control element or an explicit ' +
          '`fieldName` input is added to the wrapper.',
        el,
      );
    }
  }

  /**
   * Updates the hint IDs visible to this field's identity.
   * Called by `NgxFormFieldWrapper` when its `hintDescriptors` signal changes.
   * @internal
   */
  _setHintIds(ids: readonly string[]): void {
    this.#hintIds.set(ids);
  }
}
