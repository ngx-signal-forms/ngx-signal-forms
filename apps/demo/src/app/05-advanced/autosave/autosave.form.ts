import { JsonPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
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
 * `dirty()` and `valid()`, and `HttpClient` PATCHes that patch, one request
 * at a time. There is no submit button; saving *is* the interaction.
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
            An <code>effect</code> sends the patch with
            <code>HttpClient.patch()</code>, one request at a time. A save is a
            write, so it is never a resource: a resource would abort an
            in-flight PATCH whenever the patch changes.
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

  readonly #http = inject(HttpClient);

  protected readonly saveStatus = signal<SaveStatus>('idle');

  /** True while a PATCH is on the wire. A plain field: nothing renders it. */
  #saveInFlight = false;

  /** Set when the patch changed during a save; sent once that save settles. */
  #saveQueued = false;

  /**
   * Incremented by `resetDemo()`. A save records it when it starts, and a
   * save that settles after a reset leaves the status and the form alone:
   * it describes values the form no longer shows.
   */
  #resetGeneration = 0;

  constructor() {
    /// Save whenever the dirty+valid patch changes. `untracked` keeps the
    /// signals the save writes (`saveStatus`, and each field's `reset()` on
    /// success) from becoming dependencies of this effect.
    effect(() => {
      const patch = this.dirtyValidPatch();
      if (patch) {
        untracked(() => {
          this.#requestSave(patch);
        });
      }
    });
  }

  /**
   * Sends `patch`, or queues it when a save is already in flight. A save is
   * a write, so an in-flight PATCH is never aborted: the server may already
   * have applied it, and an aborted request can still land after the one
   * that replaced it. Instead, saves run one at a time, and the queued save
   * reads `dirtyValidPatch()` fresh once the current one settles, so edits
   * made in the meantime fold into a single follow-up request.
   */
  #requestSave(patch: Partial<AutosaveProfileModel>): void {
    if (this.#saveInFlight) {
      this.#saveQueued = true;
      return;
    }
    this.#save(patch);
  }

  #save(patch: Partial<AutosaveProfileModel>): void {
    const generation = this.#resetGeneration;
    this.#saveInFlight = true;
    this.saveStatus.set('saving');
    this.#http
      .patch<AutosavePatchResponse>(AUTOSAVE_ENDPOINT, patch)
      .subscribe({
        next: () => {
          if (generation === this.#resetGeneration) {
            this.saveStatus.set('saved');
            this.#reconcileAfterSave(patch);
          }
          this.#onSaveSettled();
        },
        error: () => {
          if (generation === this.#resetGeneration) {
            this.saveStatus.set('error');
          }
          this.#onSaveSettled();
        },
      });
  }

  #onSaveSettled(): void {
    this.#saveInFlight = false;
    if (!this.#saveQueued) return;

    this.#saveQueued = false;
    const next = this.dirtyValidPatch();
    if (next) {
      this.#save(next);
    }
  }

  /// Re-baseline after a successful save, but only for fields the save
  /// actually covered. A field can change again *after* its request was
  /// dispatched and before it resolves. Blindly resetting the whole form at
  /// that point would mark that field pristine even though the server never
  /// saw the newer value — a lost update. `fieldsSafeToMarkSaved` excludes
  /// exactly that field, leaving it dirty so the next debounce cycle saves
  /// it for real.
  #reconcileAfterSave(sentPatch: Partial<AutosaveProfileModel>): void {
    const safeFields = fieldsSafeToMarkSaved(
      sentPatch,
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

  /** Re-sends the current patch after a failure — the fields stay dirty until it succeeds. */
  protected retrySave(): void {
    const patch = this.dirtyValidPatch();
    if (patch) {
      this.#requestSave(patch);
    } else {
      this.saveStatus.set('idle');
    }
  }

  /** Restores the initial value and clears dirty/touched in one `reset(value)` call. */
  protected resetDemo(): void {
    this.profileForm().reset(createInitialAutosaveProfile());
    this.#resetGeneration += 1;
    this.saveStatus.set('idle');
  }
}
