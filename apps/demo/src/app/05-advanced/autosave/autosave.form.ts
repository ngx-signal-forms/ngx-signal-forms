import { JsonPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
  untracked,
} from '@angular/core';
import { form, FormField, type FieldState } from '@angular/forms/signals';
import {
  type ResolvedErrorDisplayStrategy,
  type FormFieldAppearance,
  type FormFieldOrientation,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

import { AUTOSAVE_ENDPOINT, AUTOSAVE_FAILURE_MARKER } from './autosave.api';
import {
  createInitialAutosaveProfile,
  type AutosaveProfileModel,
} from './autosave.model';
import { fieldsSafeToMarkSaved } from './autosave.save-reconciliation';
import { autosaveProfileSchema } from './autosave.validations';

/**
 * Idle/saving/saved/error status surfaced to the user. Not exported — this is
 * a small state machine local to this demo, not a general-purpose
 * announcement abstraction (that question belongs to the toolkit primitive
 * proposed in issue #267).
 */
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutosavePatchResponse {
  savedAt: string;
}

/**
 * Autosave Component
 *
 * Debounced, field-level autosave: `debounce(path, 500)` settles each field
 * independently, a computed patch collects only the fields that are both
 * `dirty()` and `valid()`, and `httpResource` PATCHes that patch — paused
 * (no request) whenever nothing qualifies. There is no submit button; saving
 * *is* the interaction.
 */
@Component({
  selector: 'ngx-autosave',
  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [FormField, NgxSignalFormToolkit, NgxFormField, JsonPipe],
  template: `
    <div class="px-6 pt-0 pb-6">
      <h2 class="mb-4 text-2xl font-bold">Autosave Demo</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        Edit a field and stop typing — there is no submit button. Each field
        debounces independently, then a changed, valid value is saved
        automatically.
      </p>

      <div
        class="mb-6 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100"
      >
        <p class="font-semibold">Angular 22 pattern in use</p>
        <ul class="mt-2 list-disc space-y-1 pl-5">
          <li>
            <code>debounce(path, 500)</code> delays writing a UI edit into the
            field's value signal until 500ms after typing stops — the delay
            autosave wants, with no hand-rolled RxJS.
          </li>
          <li>
            A computed patch includes a field only when it is both
            <code>dirty()</code> <strong>and</strong> <code>valid()</code> —
            never an untouched or invalid value.
          </li>
          <li>
            <code
              >httpResource(() =&gt; patch ? &#123; url, method: 'PATCH', body:
              patch &#125; : undefined)</code
            >
            — returning <code>undefined</code> pauses the resource, so there is
            no request while nothing qualifies.
          </li>
          <li>
            On a successful save, only the fields that are still unchanged since
            the request was sent are marked pristine, via each field's own
            no-argument <code>reset()</code> — a field edited again while the
            request was in flight stays dirty, so the next debounce cycle saves
            it instead of silently dropping it.
          </li>
        </ul>
      </div>

      <form
        [formRoot]="profileForm"
        ngxSignalForm
        [errorStrategy]="errorDisplayMode()"
        class="max-w-md space-y-6"
      >
        <ngx-form-field-wrapper
          [formField]="profileForm.displayName"
          [appearance]="appearance()"
          [orientation]="orientation()"
        >
          <label for="autosave-display-name">Display name</label>
          <input
            id="autosave-display-name"
            type="text"
            [formField]="profileForm.displayName"
          />
          <ngx-form-field-hint>
            Valid changes save automatically 500ms after you stop typing.
          </ngx-form-field-hint>
        </ngx-form-field-wrapper>

        <ngx-form-field-wrapper
          [formField]="profileForm.bio"
          [appearance]="appearance()"
          [orientation]="orientation()"
        >
          <label for="autosave-bio">Bio</label>
          <textarea
            id="autosave-bio"
            rows="3"
            [formField]="profileForm.bio"
          ></textarea>
          <ngx-form-field-hint>
            Type <code>{{ failureMarker }}</code> anywhere in this field to see
            the failure + retry path.
          </ngx-form-field-hint>
        </ngx-form-field-wrapper>

        <!--
          Save status: two fixed-role live regions, always present in the DOM.
          Only the content inside each is toggled via @if — the role itself
          never flips, which is what keeps NVDA + Chrome from missing the
          first announcement (same workaround NgxFormFieldError
          documents in packages/toolkit/assistive/form-field-error.ts).
          Polite ("Saving…"/"All changes saved") vs assertive (failure) is a
          deliberate split, not an accident: a save failure must interrupt,
          a save succeeding must not.
          TODO(#267): adopt the toolkit's save-status announcement primitive
          here once it lands, instead of this hand-rolled pair.
        -->
        <div
          role="status"
          class="min-h-6 text-sm text-gray-600 dark:text-gray-400"
        >
          @if (saveStatus() === 'saving') {
            <span>Saving…</span>
          } @else if (saveStatus() === 'saved') {
            <span>All changes saved.</span>
          }
        </div>

        <div role="alert" class="min-h-6">
          @if (saveStatus() === 'error') {
            <div
              class="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
            >
              <span>Could not save your changes.</span>
              <button type="button" class="btn-secondary" (click)="retrySave()">
                Retry save
              </button>
            </div>
          }
        </div>

        <div class="flex flex-wrap gap-4">
          <button type="button" class="btn-secondary" (click)="resetDemo()">
            Reset demo
          </button>
        </div>

        <div
          class="rounded-lg border border-gray-200 bg-gray-50 p-4 font-mono text-xs dark:border-gray-700 dark:bg-gray-900"
        >
          <div>
            displayName: dirty()={{
              profileForm.displayName().dirty()
            }}
            valid()={{ profileForm.displayName().valid() }}
          </div>
          <div>
            bio: dirty()={{ profileForm.bio().dirty() }} valid()={{
              profileForm.bio().valid()
            }}
          </div>
          <div>saveStatus(): {{ saveStatus() }}</div>
          <div>pending PATCH body: {{ dirtyValidPatch() | json }}</div>
        </div>
      </form>
    </div>
  `,
})
export class AutosaveComponent {
  readonly errorDisplayMode = input<ResolvedErrorDisplayStrategy>('on-touch');
  readonly appearance = input<FormFieldAppearance>('outline');
  readonly orientation = input<FormFieldOrientation>('vertical');

  protected readonly failureMarker = AUTOSAVE_FAILURE_MARKER;

  readonly #model = signal<AutosaveProfileModel>(
    createInitialAutosaveProfile(),
  );
  readonly profileForm = form(this.#model, autosaveProfileSchema);

  /**
   * Save only what should be saved: a field qualifies only when it is both
   * `dirty()` (changed since the last successful save or initial load) and
   * `valid()`. Written as two explicit checks rather than a loop over
   * `Object.keys` for the same `keyof` precision reason as
   * `server-integration.form.ts`'s `PROFILE_FIELD_KEYS` — there are only two
   * fields here, so the loop would cost more clarity than it saves.
   *
   * A third, easy-to-miss condition guards against a real race in
   * `debounce()`: writing to a control marks the field `dirty()`
   * *synchronously*, but `value()` only catches up once the debounce
   * elapses — see `ReadonlyFieldState.value`'s doc comment in
   * `@angular/forms/signals`: "updates from the UI control are eventually
   * reflected here, they may be delayed if debounced." Between those two
   * moments, `dirty()` is already `true` while `value()` is still the
   * field's *previous* settled value, not the edit the user just made.
   * Gating on `dirty()` and `valid()` alone would read that stale
   * `value()` and PATCH it — a save that fires before the user has even
   * stopped typing, carrying the wrong content (see #366).
   *
   * `field().controlValue()` is the undebounced counterpart — the literal
   * value of the bound control right now (`ReadonlyFieldState.controlValue`,
   * `@publicApi 22.0`). It equals `value()` exactly when nothing is
   * buffered behind the debounce, i.e. once the 500ms has elapsed and the
   * pending sync has copied it across. Peeking it with `untracked` keeps
   * every keystroke (which changes `controlValue()` on its own) from
   * re-running this computed — it still only re-runs when `dirty()`,
   * `valid()`, or `value()` actually change, exactly as before; by the
   * time any of those does, the peek tells us whether the debounce has
   * actually settled.
   */
  protected readonly dirtyValidPatch = computed<
    Partial<AutosaveProfileModel> | undefined
  >(() => {
    const displayName = this.profileForm.displayName();
    const bio = this.profileForm.bio();
    const patch: Partial<AutosaveProfileModel> = {};

    if (this.#isSettledDirtyValid(displayName)) {
      patch.displayName = displayName.value();
    }
    if (this.#isSettledDirtyValid(bio)) {
      patch.bio = bio.value();
    }

    return Object.keys(patch).length > 0 ? patch : undefined;
  });

  /**
   * The three-part gate `dirtyValidPatch()` applies to each field —
   * `dirty()`, `valid()`, and settled (see the doc comment above). Both
   * fields are strings, so one predicate covers both; the field's
   * `.value()` is still read at each call site (not returned from here),
   * to keep the `keyof`-precision assignment (`patch.displayName = …`,
   * `patch.bio = …`) explicit rather than routed through a generic key.
   */
  #isSettledDirtyValid(field: FieldState<string>): boolean {
    return (
      field.dirty() &&
      field.valid() &&
      untracked(field.controlValue) === field.value()
    );
  }

  /**
   * The patch actually included in the most recently issued PATCH — a plain
   * field, not a signal, written synchronously inside the `httpResource`
   * request builder below. It can never drift from what was truly sent,
   * unlike re-reading `dirtyValidPatch()` later from an effect (which could
   * already reflect a newer edit by the time that effect runs). Read back in
   * `#reconcileAfterSave()` to decide which fields a resolved save may mark
   * pristine.
   */
  #lastRequestedPatch: Partial<AutosaveProfileModel> | undefined;

  /**
   * PATCHes `dirtyValidPatch()` whenever it holds a value. Returning
   * `undefined` from the request function pauses `httpResource` — there is
   * no request while nothing dirty+valid is waiting to be saved, and no
   * separate "should I save?" flag to keep in sync.
   */
  protected readonly saveResource = httpResource<AutosavePatchResponse>(() => {
    const patch = this.dirtyValidPatch();
    if (!patch) return undefined;

    this.#lastRequestedPatch = patch;
    return { url: AUTOSAVE_ENDPOINT, method: 'PATCH', body: patch };
  });

  /**
   * Maps the resource's `ResourceStatus` onto the four states this demo
   * shows the user. `'reloading'` (the state during a manual retry) reads as
   * `'saving'` too — the user doesn't need a fifth word for that.
   */
  protected readonly saveStatus = computed<SaveStatus>(() => {
    switch (this.saveResource.status()) {
      case 'loading':
      case 'reloading':
        return 'saving';
      case 'resolved':
      case 'local':
        return 'saved';
      case 'error':
        return 'error';
      default:
        return 'idle';
    }
  });

  constructor() {
    /// Re-baseline on a successful save, but only for fields the save
    /// actually covered: `httpResource` is last-write-wins for *requests*
    /// (a new patch cancels an in-flight one), but a field can still change
    /// again *after* its request was already dispatched and before it
    /// resolves. Blindly resetting the whole form at that point would mark
    /// that field pristine even though the server never saw the newer
    /// value — a lost update. `fieldsSafeToMarkSaved` excludes exactly that
    /// field, leaving it dirty so the next debounce cycle saves it for real.
    /// `untracked` keeps each field's own `reset()` from re-triggering this
    /// effect.
    effect(() => {
      if (this.saveResource.status() === 'resolved') {
        untracked(() => {
          this.#reconcileAfterSave();
        });
      }
    });
  }

  #reconcileAfterSave(): void {
    const safeFields = fieldsSafeToMarkSaved(
      this.#lastRequestedPatch,
      this.profileForm().value(),
    );

    for (const key of safeFields) {
      const field = this.profileForm[key]();

      // Guard against the same debounce race `dirtyValidPatch()` guards
      // against, on the other side of the request: calling no-argument
      // `FieldState.reset()` on a field with a pending, not-yet-elapsed
      // debounce discards that buffered edit instead of letting it sync
      // normally. `fieldsSafeToMarkSaved()` only compares `value()` —
      // Angular's canonical, debounce-settled signal — against the sent
      // snapshot, so it cannot see an edit still buffered behind an
      // *unelapsed* debounce (`controlValue()` has moved on, `value()`
      // hasn't yet). Skipping the reset here leaves the field dirty;
      // once its debounce elapses, `dirtyValidPatch()` picks the newer
      // value up on the next cycle exactly like any other edit made
      // mid-flight (see #366).
      if (field.controlValue() !== field.value()) {
        continue;
      }

      // No-argument `reset()` clears touched/dirty for this field alone,
      // without touching its value or any sibling field — see
      // `FieldState.reset()` in `@angular/forms/signals`.
      field.reset();
    }
  }

  /** Re-issues the last PATCH after a failure — the fields stay dirty until it succeeds. */
  protected retrySave(): void {
    this.saveResource.reload();
  }

  /** Restores the initial value and clears dirty/touched in one `reset(value)` call. */
  protected resetDemo(): void {
    this.profileForm().reset(createInitialAutosaveProfile());
  }
}
