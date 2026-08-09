import { Injectable } from '@angular/core';
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
 * `providedIn: null` (the default) — this is never injected without an
 * explicit provider, matching `NgxFieldIdentity`'s element-scoped contract.
 * `NgxSignalForm` provides one instance per `[ngxSignalForm]` host so fields
 * in unrelated forms never collide on field name.
 */
@Injectable()
export class NgxFieldVisibilityRegistry {
  readonly #entries = new Map<string, NgxSignalFormFieldVisibilityDescriptor>();

  register(descriptor: NgxSignalFormFieldVisibilityDescriptor): () => void {
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
