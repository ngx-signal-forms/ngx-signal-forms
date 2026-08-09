import { Injectable, isDevMode, signal } from '@angular/core';
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
 * instead of being discovered through a content query. Because the hint
 * registry's `hints` is itself a `Signal` (backed by `contentChildren`),
 * `NgxSignalFormAutoAria` reading it inside a `computed()` automatically
 * re-runs whenever a hint is added/removed. A plain `Map` has no such
 * signal to read, so `get()` bumps and reads a private version counter —
 * mirroring that same "the read establishes the dependency" idiom — to
 * make mount/unmount/rename of a registered surface reactive too. Without
 * it, a standalone `<ngx-form-field-error>` mounting (or changing field
 * name, or unmounting) after auto-aria's `computed()` first evaluated would
 * never trigger a re-run, leaving `aria-describedby` stale until an
 * unrelated signal happened to invalidate the same computed.
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
   * Bumped on every `register()`/unregister so `get()` can establish a
   * reactive dependency on registry membership itself, not just on the
   * descriptor's own `errorContainerVisible`/`warningContainerVisible`
   * signals. See the class docstring for why a plain `Map` needs this.
   */
  readonly #version = signal(0);

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
    this.#version.update((version) => version + 1);

    return () => {
      // Only remove the entry if it is still the one this call registered —
      // a second surface may have already replaced it for the same field
      // name (e.g. a fieldset-level and a field-level renderer sharing a
      // name), and this call's teardown must not clobber that newer entry.
      if (this.#entries.get(descriptor.fieldName) === descriptor) {
        this.#entries.delete(descriptor.fieldName);
        this.#version.update((version) => version + 1);
      }
    };
  }

  get(fieldName: string): NgxSignalFormFieldVisibilityDescriptor | undefined {
    // Read the version signal first (and unconditionally) so a `computed()`
    // calling `get()` re-evaluates on every register/unregister for ANY
    // field name — not just the one it's currently looking up. That over-
    // invalidation is intentional and cheap: the alternative (a per-field
    // signal) would need its own registry-of-signals bookkeeping for a
    // case that only fires on mount/unmount/rename, not on every render.
    this.#version();
    return this.#entries.get(fieldName);
  }
}
