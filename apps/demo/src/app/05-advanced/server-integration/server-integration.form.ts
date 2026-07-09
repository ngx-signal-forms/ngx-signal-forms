import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  resource,
  signal,
  untracked,
} from '@angular/core';
import {
  form,
  FormField,
  type TreeValidationResult,
} from '@angular/forms/signals';
import {
  type ResolvedErrorDisplayStrategy,
  type FormFieldAppearance,
  type FormFieldOrientation,
  createOnInvalidHandler,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

import { ProfileApiService, TAKEN_EMAIL } from './server-integration.api';
import {
  createEmptyProfileFormModel,
  type ProfileFormModel,
} from './server-integration.model';
import { profileSchema } from './server-integration.validations';

/**
 * Explicit, statically-typed key list for `ProfileFormModel` — used to walk
 * the server's `fieldErrors` payload without `Object.entries`/`Object.keys`,
 * which widen to `string` and would need an unsafe cast back to
 * `keyof ProfileFormModel`.
 */
const PROFILE_FIELD_KEYS: readonly (keyof ProfileFormModel)[] = [
  'name',
  'email',
];

/**
 * Server Integration Component
 *
 * The real-world "edit record" flow: `resource()` prefills the form from a
 * fake API, `[formRoot]`'s declarative `submission` sends it back, and the
 * `action` maps a rejected save onto both a field error (email) and a
 * form-level banner (general message) via a native `TreeValidationResult` —
 * no toolkit-specific glue required for that mapping.
 */
@Component({
  selector: 'ngx-server-integration',
  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <div class="px-6 pt-0 pb-6">
      <h2 class="mb-4 text-2xl font-bold">Server Integration Demo</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        Prefill from a server record, submit an edit, and map server-side
        field/form errors back onto the form — the flow behind almost every
        "edit profile" screen.
      </p>

      <div
        class="mb-6 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100"
      >
        <p class="font-semibold">Angular 22 pattern in use</p>
        <ul class="mt-2 list-disc space-y-1 pl-5">
          <li>
            <code>resource(&#123; loader &#125;)</code> fetches the record; an
            <code>effect()</code> pushes the resolved value into the form model
            signal and calls <code>reset(value)</code> so the freshly loaded
            record starts pristine (not dirty/touched).
          </li>
          <li>
            <code>form(model, schema, &#123; submission &#125;)</code>'s
            <code>action</code> returns a native
            <code>TreeValidationResult</code> — an array of
            <code>&#123; kind, message, fieldTree &#125;</code> — so Angular
            attaches each error to the right field itself, no toolkit-specific
            error-mapping API needed.
          </li>
          <li>
            An error with <strong>no</strong> <code>fieldTree</code>
            attaches to the submitted field itself (the form root here), which
            is how the form-level banner below is populated.
          </li>
          <li>
            Submit is disabled via
            <code>form().invalid() || form().submitting()</code> — the exact
            expression this demo's "Try This" panel asks you to watch.
          </li>
        </ul>
      </div>

      @if (isInitialLoad()) {
        <div
          class="mb-6 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900"
          role="status"
        >
          <span class="h-2 w-2 animate-pulse rounded-full bg-gray-400"></span>
          <span class="text-sm text-gray-600 dark:text-gray-400">
            Loading profile from server…
          </span>
        </div>
      } @else {
        <form
          [formRoot]="profileForm"
          ngxSignalForm
          [errorStrategy]="errorDisplayMode()"
          class="max-w-md space-y-6"
        >
          <!-- Success banner -->
          @if (saveSucceeded()) {
            <div
              role="status"
              class="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950"
            >
              <div class="flex items-start gap-3">
                <span class="text-2xl">✅</span>
                <div>
                  <h3
                    class="mb-1 font-semibold text-green-900 dark:text-green-100"
                  >
                    Profile saved
                  </h3>
                  <p class="text-sm text-green-800 dark:text-green-200">
                    The server accepted the update.
                    <code>reset(value)</code> cleared <code>dirty</code>/<code
                      >touched</code
                    >
                    without clearing the fields.
                  </p>
                </div>
              </div>
            </div>
          }

          <!-- Form-level banner: the "formError" half of the rejected save,
               attached to the root field (no fieldTree on the returned error). -->
          @if (formLevelError(); as formLevelErrorMessage) {
            <div
              role="alert"
              class="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950"
            >
              <div class="flex items-start gap-3">
                <span class="text-2xl">⚠️</span>
                <div>
                  <h3 class="mb-1 font-semibold text-red-900 dark:text-red-100">
                    Could not save profile
                  </h3>
                  <p class="text-sm text-red-800 dark:text-red-200">
                    {{ formLevelErrorMessage }}
                  </p>
                </div>
              </div>
            </div>
          }

          <ngx-form-field-wrapper
            [formField]="profileForm.name"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="server-integration-name">Name</label>
            <input
              id="server-integration-name"
              type="text"
              [formField]="profileForm.name"
            />
          </ngx-form-field-wrapper>

          <!-- Email field: renders the server's field error through the
               normal wrapper error UI — no special-case markup needed. -->
          <ngx-form-field-wrapper
            [formField]="profileForm.email"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="server-integration-email">Email</label>
            <input
              id="server-integration-email"
              type="email"
              [formField]="profileForm.email"
            />
            <ngx-form-field-hint>
              Try <code>{{ takenEmail }}</code> to trigger a server rejection.
              Editing this field afterwards clears its server error
              automatically.
            </ngx-form-field-hint>
          </ngx-form-field-wrapper>

          <div
            class="rounded-lg border border-gray-200 bg-gray-50 p-4 font-mono text-xs dark:border-gray-700 dark:bg-gray-900"
          >
            <div>invalid(): {{ profileForm().invalid() }}</div>
            <div>submitting(): {{ profileForm().submitting() }}</div>
            <div>dirty(): {{ profileForm().dirty() }}</div>
            <div>touched(): {{ profileForm().touched() }}</div>
          </div>

          <div class="flex flex-wrap gap-4">
            <button
              type="submit"
              class="btn-primary"
              [disabled]="profileForm().invalid() || profileForm().submitting()"
            >
              @if (profileForm().submitting()) {
                Saving…
              } @else {
                Save profile
              }
            </button>

            <button
              type="button"
              class="btn-secondary"
              [disabled]="profileForm().submitting()"
              (click)="resetForm()"
            >
              Reset
            </button>

            <button
              type="button"
              class="btn-secondary"
              [disabled]="
                profileForm().submitting() || profileResource.isLoading()
              "
              (click)="reloadFromServer()"
            >
              @if (profileResource.isLoading()) {
                Reloading…
              } @else {
                Reload from server
              }
            </button>
          </div>
        </form>
      }
    </div>
  `,
})
export class ServerIntegrationComponent {
  readonly errorDisplayMode = input<ResolvedErrorDisplayStrategy>('on-touch');
  readonly appearance = input<FormFieldAppearance>('outline');
  readonly orientation = input<FormFieldOrientation>('vertical');

  protected readonly takenEmail = TAKEN_EMAIL;

  readonly #api = inject(ProfileApiService);
  readonly #model = signal<ProfileFormModel>(createEmptyProfileFormModel());
  protected readonly model = this.#model.asReadonly();

  /**
   * `resource()` fetches the profile record. No `params` function is given,
   * so it loads once on creation and again only when `.reload()` is called
   * explicitly (the "Reload from server" button below).
   */
  protected readonly profileResource = resource({
    loader: () => this.#api.loadProfile(),
  });

  /** True only for the very first load — reloads reuse the form UI shell. */
  protected readonly isInitialLoad = computed(
    () =>
      this.profileResource.isLoading() &&
      this.profileResource.value() === undefined,
  );

  protected readonly saveSucceeded = signal(false);

  readonly #onInvalid = createOnInvalidHandler();

  readonly profileForm = form(this.#model, profileSchema, {
    submission: {
      action: async (formData) => {
        this.saveSucceeded.set(false);
        const result = await this.#api.saveProfile(formData().value());

        if (!result.ok) {
          /// Map the server's `{ fieldErrors, formError }` payload onto a
          /// native `TreeValidationResult`: one entry per field error (with
          /// `fieldTree` pointing at that field, resolved through the
          /// explicitly-typed `PROFILE_FIELD_KEYS` list rather than
          /// `Object.entries`, which would lose `keyof ProfileFormModel`
          /// precision and require an unsafe cast) plus one entry with *no*
          /// `fieldTree` for the general message, which lands on the field
          /// passed to `submit()` — the form root here.
          const fieldErrors = result.fieldErrors;
          const errors: TreeValidationResult = [
            ...PROFILE_FIELD_KEYS.flatMap((key) => {
              const message = fieldErrors[key];
              return message !== undefined && message !== ''
                ? [
                    {
                      kind: 'server-field-error',
                      message,
                      fieldTree: formData[key],
                    },
                  ]
                : [];
            }),
            { kind: 'server-error', message: result.formError },
          ];
          return errors;
        }

        this.saveSucceeded.set(true);
        /// `reset(value)` re-baselines the form at the just-saved value:
        /// dirty()/touched() clear, but the fields keep showing what the
        /// user typed (it's also what they just confirmed the server has).
        formData().reset(formData().value());
        return undefined;
      },
      onInvalid: this.#onInvalid,
    },
  });

  /** Root-only errors: the general "formError" lands here (no `fieldTree`). */
  protected readonly formLevelError = computed(
    () =>
      this.profileForm()
        .errors()
        .find((error) => error.kind === 'server-error')?.message ?? null,
  );

  constructor() {
    /// Prefill: whenever the resource resolves (initial load or a manual
    /// `.reload()`), copy the record into the form model and reset touched/
    /// dirty so the freshly loaded values read as pristine.
    effect(() => {
      const record = this.profileResource.value();
      if (!record) return;

      untracked(() => {
        this.#model.set(record);
        this.profileForm().reset(record);
        this.saveSucceeded.set(false);
      });
    });
  }

  protected resetForm(): void {
    this.profileForm().reset();
  }

  protected reloadFromServer(): void {
    this.saveSucceeded.set(false);
    this.profileResource.reload();
  }
}
