import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  linkedSignal,
  type WritableSignal,
} from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import {
  type FormFieldAppearance,
  type FormFieldOrientation,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

import { type Settings, SettingsStore } from './settings.store';

@Component({
  selector: 'ngx-store-binding-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <div class="px-6 pt-0 pb-6">
      <h2 class="mb-4 text-2xl font-bold">Live Store Binding Demo</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        This form's model is a native
        <code>linkedSignal({{ '{' }} source, computation, set {{ '}' }})</code>
        handle over an <code>@ngrx/signals</code> store. Every edit flows
        straight back into the store via <code>patchState</code> — there is no
        draft buffer and no commit button.
      </p>

      <div
        class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100"
      >
        Edit any field and watch the live store snapshot below update on every
        keystroke. Press <strong>Simulate remote sync</strong> to mutate the
        store from outside the form and watch the inputs reflect it — the read
        seam keeps the binding two-way.
      </div>

      <form [formRoot]="settingsForm" ngxSignalForm class="max-w-2xl space-y-6">
        <div class="grid gap-4 md:grid-cols-2">
          <ngx-form-field-wrapper
            [formField]="settingsForm.displayName"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="store-binding-display-name">Display name</label>
            <input
              id="store-binding-display-name"
              type="text"
              [formField]="settingsForm.displayName"
            />
          </ngx-form-field-wrapper>

          <ngx-form-field-wrapper
            [formField]="settingsForm.email"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="store-binding-email">Email</label>
            <input
              id="store-binding-email"
              type="email"
              [formField]="settingsForm.email"
            />
          </ngx-form-field-wrapper>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <ngx-form-field-wrapper
            [formField]="settingsForm.theme"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="store-binding-theme">Theme</label>
            <select id="store-binding-theme" [formField]="settingsForm.theme">
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </ngx-form-field-wrapper>

          <ngx-form-field-wrapper
            [formField]="settingsForm.newsletter"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="store-binding-newsletter">Newsletter</label>
            <input
              id="store-binding-newsletter"
              type="checkbox"
              [formField]="settingsForm.newsletter"
            />
          </ngx-form-field-wrapper>
        </div>

        <section
          class="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100"
        >
          <p class="mb-2 font-semibold">
            Live store snapshot (source of truth)
          </p>
          <dl class="grid grid-cols-2 gap-x-4 gap-y-1 font-mono">
            <dt>displayName</dt>
            <dd>{{ store.displayName() }}</dd>
            <dt>email</dt>
            <dd>{{ store.email() }}</dd>
            <dt>theme</dt>
            <dd>{{ store.theme() }}</dd>
            <dt>newsletter</dt>
            <dd>{{ store.newsletter() }}</dd>
          </dl>
        </section>

        <div class="flex flex-wrap gap-4">
          <button
            type="button"
            (click)="simulateRemoteSync()"
            class="btn-primary"
          >
            Simulate remote sync
          </button>
          <button type="button" (click)="reset()" class="btn-secondary">
            Reset store
          </button>
        </div>
      </form>
    </div>
  `,
})
export class StoreBindingFormComponent {
  readonly appearance = input<FormFieldAppearance>('outline');
  readonly orientation = input<FormFieldOrientation>('vertical');

  protected readonly store = inject(SettingsStore);

  /**
   * The form model is a native `linkedSignal({ source, computation, set })`
   * handle: reads stay reactive to the store slice through `source` /
   * `computation`, and writes go straight back through `updateSettings`
   * (which calls `patchState`) via the native `set` callback. No draft/commit
   * buffer, and no custom delegated-write helper.
   *
   * The `set` callback intentionally does not call `rawSet`: the local linked
   * value only needs to reflect the store, and it already does because
   * `source` reactively re-reads the store's own signals. Once
   * `store.updateSettings` writes through `patchState`, the store's state
   * signal changes, so the next read of this linked signal re-runs
   * `computation` against the fresh `source` value — no local mirror is
   * needed to stay coherent.
   */
  readonly #model: WritableSignal<Settings> = linkedSignal<Settings, Settings>({
    source: () => ({
      displayName: this.store.displayName(),
      email: this.store.email(),
      theme: this.store.theme(),
      newsletter: this.store.newsletter(),
    }),
    computation: (slice) => slice,
    set: (value) => {
      this.store.updateSettings(value);
    },
  });

  readonly settingsForm = form(this.#model);

  protected simulateRemoteSync(): void {
    this.store.simulateRemoteSync({
      displayName: 'Remote Admin',
      theme: 'dark',
      newsletter: false,
    });
  }

  protected reset(): void {
    this.store.updateSettings({
      displayName: 'Ada Lovelace',
      email: 'ada@example.com',
      theme: 'system',
      newsletter: true,
    });
  }
}
