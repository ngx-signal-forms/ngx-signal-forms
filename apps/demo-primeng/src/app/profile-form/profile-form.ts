import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormFieldHint } from '@ngx-signal-forms/toolkit/assistive';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { NgxPrimeFormBundle } from '../form-field';
import { ROLE_OPTIONS, type ProfileFormModel } from './profile-form.model';
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
 *    (text input via `pInputText`, the `<p-select>` host, and `<p-checkbox>`)
 *    so the toolkit knows the control kind without DOM heuristics.
 * 4. **`NgxSignalFormAutoAria`** is in scope via `NgxSignalForm` / direct
 *    import so it can wire `aria-invalid` / `aria-describedby` on each
 *    bound control. The directive reads the wrapper's hint-registry token
 *    to chain hint IDs.
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
    SelectModule,
    NgxSignalFormToolkit,
    NgxFormFieldHint,
    NgxPrimeFormBundle,
  ],
  template: `
    <form
      [formRoot]="profileForm"
      ngxSignalForm
      class="field-stack"
      (submit)="onSubmit($event)"
    >
      <!-- Text input + p-iconfield -->
      <prime-form-field
        [ngxPrimeFormField]="profileForm.email"
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
            [formField]="profileForm.email"
          />
        </p-iconfield>
        <ngx-form-field-hint>
          We'll never share your address.
        </ngx-form-field-hint>
      </prime-form-field>

      <!-- Select (p-select is the current PrimeNG primitive; v20+) -->
      <prime-form-field
        [ngxPrimeFormField]="profileForm.role"
        fieldName="profile-role"
        showRequiredMarker
      >
        <label for="profile-role">Role</label>
        <p-select
          inputId="profile-role"
          [options]="roleOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Pick a role"
          ngxSignalFormControl="standalone-field-like"
          [formField]="profileForm.role"
        />
      </prime-form-field>

      <!-- Checkbox -->
      <prime-form-field
        [ngxPrimeFormField]="profileForm.newsletter"
        fieldName="profile-newsletter"
      >
        <label for="profile-newsletter">Subscribe to the newsletter</label>
        <p-checkbox
          inputId="profile-newsletter"
          [binary]="true"
          ngxSignalFormControl="checkbox"
          [formField]="profileForm.newsletter"
        />
      </prime-form-field>

      <div class="actions">
        <p-button
          type="submit"
          label="Save profile"
          severity="primary"
          [disabled]="isSubmitting()"
        />
        <p-button
          type="button"
          label="Reset"
          severity="secondary"
          (click)="reset()"
        />
      </div>

      @if (lastSubmission()) {
        <pre class="summary" data-testid="submission-summary">{{
          lastSubmission()
        }}</pre>
      }
    </form>
  `,
})
export class ProfileFormComponent {
  protected readonly roleOptions = ROLE_OPTIONS;

  readonly #model = signal<ProfileFormModel>({
    email: '',
    role: '',
    newsletter: false,
  });

  protected readonly profileForm = form(this.#model, profileFormSchema);

  protected readonly isSubmitting = computed(() =>
    this.profileForm().submitting(),
  );

  protected readonly lastSubmission = signal<string | null>(null);

  protected onSubmit(event: Event): void {
    event.preventDefault();
    const root = this.profileForm();
    if (root.invalid()) {
      // markAsTouched cascades to every leaf so the on-touch strategy
      // lights up every invalid field at once. Keeps the renderer + the
      // wrapper's data-invalid attribute in lockstep without per-field
      // bookkeeping.
      root.markAsTouched();
      return;
    }
    this.lastSubmission.set(JSON.stringify(this.#model(), null, 2));
  }

  protected reset(): void {
    // Reset model first so the form derives its baseline from the cleared
    // value when reset() runs; otherwise the form would briefly snapshot
    // the previous model state.
    this.#model.set({ email: '', role: '', newsletter: false });
    this.profileForm().reset();
    this.lastSubmission.set(null);
  }
}
