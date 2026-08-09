import { Injectable, isDevMode } from '@angular/core';
import type { NgxSignalFormFieldVisibilityDescriptor } from '../tokens';

/**
 * Default implementation of the field-visibility registry contract
 * (`NgxSignalFormFieldVisibilityRegistry`), provided per-form by
 * `NgxSignalForm`.
 *
 * A plain keyed map rather than a reactive `contentChildren`-derived list:
 * unlike the hint registry, there is no shared ancestor/descendant DOM
 * relationship between a standalone `<ngx-form-field-error>` and the sibling
 * control it describes, so publishers register and unregister imperatively
 * instead of being discovered through a content query.
 *
 * `providedIn: null` — this is never injected without an explicit provider,
 * matching `NgxFieldIdentity`'s and `NgxControlPresetRegistry`'s
 * element/directive-scoped contract. `NgxSignalForm` provides one instance
 * per `[ngxSignalForm]` host so fields in unrelated forms never collide on
 * field name.
 */
@Injectable({ providedIn: null })
export class NgxFieldVisibilityRegistry {
  readonly #entries = new Map<string, NgxSignalFormFieldVisibilityDescriptor>();

  /**
   * One-shot-per-field-name guard for the dev-mode "duplicate registration"
   * warning below — mirrors the codebase's other single-fire dev
   * diagnostics (e.g. `NgxFieldIdentity`'s missing-`id` warning) so a
   * genuinely ambiguous configuration doesn't spam the console on every
   * reactive re-registration.
   */
  readonly #warnedDuplicateFor = new Set<string>();

  register(descriptor: NgxSignalFormFieldVisibilityDescriptor): () => void {
    const existing = this.#entries.get(descriptor.fieldName);

    // A second live surface publishing for the same field name is exactly
    // the divergence this registry exists to prevent: `NgxSignalFormAutoAria`
    // reads a single entry per field name, so whichever descriptor is last
    // in silently wins and the other's visibility is never consulted.
    if (
      existing &&
      existing !== descriptor &&
      isDevMode() &&
      !this.#warnedDuplicateFor.has(descriptor.fieldName)
    ) {
      this.#warnedDuplicateFor.add(descriptor.fieldName);
      // oxlint-disable-next-line no-console -- dev-only a11y diagnostic
      console.warn(
        `[ngx-signal-forms] NgxFieldVisibilityRegistry: more than one ` +
          `message-rendering surface registered for field "${descriptor.fieldName}". ` +
          `Only the most recently registered surface's visibility is used by ` +
          `NgxSignalFormAutoAria, so the other's aria-describedby linking may ` +
          `be wrong. Ensure at most one standalone <ngx-form-field-error> (or ` +
          `equivalent) targets a given fieldName.`,
      );
    }

    this.#entries.set(descriptor.fieldName, descriptor);

    return () => {
      // Only remove the entry if it is still the one this call registered —
      // a second surface may have already replaced it for the same field
      // name (e.g. a fieldset-level and a field-level renderer sharing a
      // name), and this call's teardown must not clobber that newer entry.
      if (this.#entries.get(descriptor.fieldName) === descriptor) {
        this.#entries.delete(descriptor.fieldName);
      }
    };
  }

  get(fieldName: string): NgxSignalFormFieldVisibilityDescriptor | undefined {
    return this.#entries.get(fieldName);
  }
}
