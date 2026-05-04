import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { type FieldTree, form, FormField } from '@angular/forms/signals';
import {
  createOnInvalidHandler,
  hasOnlyWarnings,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormFieldHint } from '@ngx-signal-forms/toolkit/assistive';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { PrimeSelectControlComponent } from '../controls/prime-select-control';
import { NgxPrimeFormBundle } from '../form-field';
import {
  ROLE_OPTIONS,
  type ProfileFormModel,
  type RoleOption,
} from './profile-form.model';
import { profileFormSchema } from './profile-form.schema';

/**
 * Representative profile form rendered with the PrimeNG-flavoured wrapper.
 *
 * Contracts exercised in this template:
 *
 * 1. **Custom wrapper** (`<prime-form-field>`) provides `NGX_SIGNAL_FORM_FIELD_CONTEXT`
 *    and `NGX_SIGNAL_FORM_HINT_REGISTRY` to its projected children.
 * 2. **Renderer tokens** are configured at app bootstrap; the wrapper picks
 *    `PrimeFieldErrorComponent` up via `NGX_FORM_FIELD_ERROR_RENDERER` so
 *    errors render as PrimeNG's `<small class="p-error">` idiom.
 * 3. **`NgxSignalFormControlSemanticsDirective`** is declared on each control
 *    (text input via `pInputText`, the `prime-select-control` compatibility
 *    host, and `<p-checkbox>`)
 *    so the toolkit knows the control kind without DOM heuristics.
 * 4. **`NgxSignalFormAutoAria`** is in scope via `NgxSignalForm` / direct
 *    import so it can wire `aria-invalid` / `aria-describedby` on each
 *    bound control. The directive reads the wrapper's hint-registry token
 *    to chain hint IDs.
 * 5. **Toolkit submission helpers** (`createOnInvalidHandler` and
 *    `hasOnlyWarnings`) keep submit-time behaviour aligned with the
 *    Spartan/Material references: blockers focus the first invalid control,
 *    warnings stay visible but do not block a successful submit.
 *
 * Floating labels are rendered with the *simplest* PrimeNG variant — a plain
 * `<label>` shown above the control. The README documents that other Prime
 * floating-label modes are intentionally out of scope for this reference.
 */
@Component({
  selector: 'demo-primeng-profile-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    ButtonModule,
    CheckboxModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    PrimeSelectControlComponent,
    NgxSignalFormToolkit,
    NgxFormFieldHint,
    NgxPrimeFormBundle,
  ],
  template: `
    <form
      [formRoot]="profileForm"
      ngxSignalForm
      novalidate
      class="profile-form field-stack"
    >
      <header class="profile-form__intro">
        <p class="profile-form__eyebrow">PrimeNG reference form</p>
        <h2 class="profile-form__title">
          A profile flow that behaves like a real product form
        </h2>
        <p class="profile-form__copy">
          Blur reveals field-level issues, <strong>Save profile</strong> exposes
          untouched blockers, and advisory warnings stay visible without
          blocking submission.
        </p>
      </header>

      <div class="profile-form__grid">
        <!-- Text input + p-iconfield -->
        <prime-form-field
          [ngxPrimeFormField]="emailField"
          fieldName="profile-email"
          showRequiredMarker
        >
          <label for="profile-email">Email</label>
          <p-iconfield iconPosition="left">
            <p-inputicon styleClass="pi pi-envelope" />
            <input
              id="profile-email"
              pInputText
              type="email"
              placeholder="you@example.com"
              ngxSignalFormControl="input-like"
              [formField]="emailField"
            />
          </p-iconfield>
          <ngx-form-field-hint>
            Work addresses are best for recovery and team handoff.
          </ngx-form-field-hint>
        </prime-form-field>

        <!-- Select (PrimeNG compatibility shim; toolkit wiring still lives in the wrapper layer) -->
        <prime-form-field
          [ngxPrimeFormField]="roleField"
          fieldName="profile-role"
          showRequiredMarker
        >
          <label for="profile-role">Role</label>
          <prime-select-control
            inputId="profile-role"
            [options]="roleOptions"
            placeholder="Pick a role"
            ngxSignalFormControl="standalone-field-like"
            [formField]="roleField"
          />
          <ngx-form-field-hint>
            We use this to tailor examples and sensible defaults.
          </ngx-form-field-hint>
        </prime-form-field>
      </div>

      <!-- Checkbox -->
      <prime-form-field
        [ngxPrimeFormField]="newsletterField"
        fieldName="profile-newsletter"
      >
        <label for="profile-newsletter">Subscribe to the release notes</label>
        <p-checkbox
          inputId="profile-newsletter"
          [binary]="true"
          ngxSignalFormControl="checkbox"
          [formField]="newsletterField"
        />
        <ngx-form-field-hint>
          One concise digest when new toolkit features ship — no inbox confetti.
        </ngx-form-field-hint>
      </prime-form-field>

      <aside class="profile-form__status" aria-live="polite">
        <p class="profile-form__status-label">Validation rhythm</p>
        <p class="profile-form__status-copy">
          Blocking errors follow the form's on-touch strategy. Advisory warnings
          stay immediate so guidance lands while the user is still editing.
        </p>
      </aside>

      <div class="actions">
        <button
          pButton
          type="submit"
          label="Save profile"
          icon="pi pi-save"
          [loading]="isSubmitting()"
          [disabled]="isSubmitting()"
          data-testid="submit-button"
        ></button>
        <button
          pButton
          type="button"
          label="Reset"
          severity="secondary"
          icon="pi pi-refresh"
          (click)="reset()"
        ></button>
      </div>

      @if (lastSubmission()) {
        <section class="summary-panel">
          <p class="summary-panel__title">Submitted snapshot</p>
          <pre class="summary" data-testid="submission-summary">{{
            lastSubmission()
          }}</pre>
        </section>
      }
    </form>
  `,
})
export class ProfileFormComponent {
  readonly #onInvalid = createOnInvalidHandler();

  protected readonly roleOptions: RoleOption[] = Array.from(ROLE_OPTIONS);

  readonly #model = signal<ProfileFormModel>({
    email: '',
    role: '',
    newsletter: false,
  });

  protected readonly profileForm = form(this.#model, profileFormSchema, {
    submission: {
      ignoreValidators: 'all',
      action: () => {
        if (!hasOnlyWarnings(this.profileForm().errorSummary())) {
          this.#onInvalid(this.profileForm);
          return Promise.resolve(undefined);
        }

        this.lastSubmission.set(
          JSON.stringify(this.profileForm().value(), null, 2),
        );

        return Promise.resolve(undefined);
      },
    },
  });

  protected readonly emailField: FieldTree<ProfileFormModel['email']> =
    this.profileForm.email;

  protected readonly roleField: FieldTree<ProfileFormModel['role']> =
    this.profileForm.role;

  protected readonly newsletterField: FieldTree<
    ProfileFormModel['newsletter']
  > = this.profileForm.newsletter;

  protected readonly isSubmitting = computed(() =>
    this.profileForm().submitting(),
  );

  protected readonly lastSubmission = signal<string | null>(null);

  protected reset(): void {
    // Reset model first so the form derives its baseline from the cleared
    // value when reset() runs; otherwise the form would briefly snapshot
    // the previous model state.
    this.#model.set({ email: '', role: '', newsletter: false });
    this.profileForm().reset();
    this.lastSubmission.set(null);
  }
}
