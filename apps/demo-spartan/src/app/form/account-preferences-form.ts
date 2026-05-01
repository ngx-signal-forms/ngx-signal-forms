import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  minLength,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import { BrnLabel } from '@spartan-ng/brain/label';
import { BrnInput } from '@spartan-ng/brain/input';
import {
  NgxSignalForm,
  NgxSignalFormAutoAria,
  NgxSignalFormControlSemanticsDirective,
} from '@ngx-signal-forms/toolkit';
import { NgxFormFieldHint } from '@ngx-signal-forms/toolkit/assistive';
import { SpartanFormFieldComponent } from '../wrapper/spartan-form-field';

interface AccountPreferences {
  readonly displayName: string;
  readonly plan: '' | 'starter' | 'pro' | 'enterprise';
  readonly newsletter: boolean;
}

const accountSchema = schema<AccountPreferences>((path) => {
  required(path.displayName, { message: 'Display name is required' });
  minLength(path.displayName, 3, {
    message: 'Display name must be at least 3 characters',
  });

  // Warning rendered through `validate({ kind: 'warn:*' })`. Surfaces in
  // `<spartan-form-field-error>` via `isWarningError`. Showcases the toolkit's
  // warnings slot without blocking submission.
  validate(path.displayName, (ctx) => {
    const value = ctx.value();
    if (value.length >= 3 && value.length < 5) {
      return {
        kind: 'warn:short-display-name',
        message: 'Short names are accepted but easy to confuse with handles',
      };
    }
    return null;
  });

  required(path.plan, { message: 'Choose a plan' });
});

/**
 * Single representative form: text input + select + checkbox. Wires
 * warnings on the `displayName` field to demonstrate the warning slot.
 *
 * Each control declares `NgxSignalFormControlSemanticsDirective` alongside
 * the Spartan host directives — the toolkit reads semantics through DI
 * (not DOM heuristics), so combining `[brnInput] ngxSignalFormControl="..."`
 * is the canonical "alongside" composition the PRD asks the reference to
 * exercise.
 */
@Component({
  selector: 'ngx-account-preferences-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    BrnInput,
    BrnLabel,
    FormField,
    FormRoot,
    NgxFormFieldHint,
    NgxSignalForm,
    NgxSignalFormAutoAria,
    NgxSignalFormControlSemanticsDirective,
    SpartanFormFieldComponent,
  ],
  template: `
    <form
      [formRoot]="form"
      ngxSignalForm
      (submit)="$event.preventDefault(); handleSubmit()"
      novalidate
    >
      <!-- Text input -->
      <spartan-form-field
        [formField]="form.displayName"
        fieldName="display-name"
      >
        <label brnLabel for="display-name" class="hlm-form-field__label">
          Display name
        </label>
        <input
          brnInput
          ngxSignalFormControl="input-like"
          id="display-name"
          type="text"
          class="hlm-input"
          placeholder="e.g. Ada Lovelace"
          [formField]="form.displayName"
        />
        <ngx-form-field-hint position="left">
          Public name shown on your profile
        </ngx-form-field-hint>
      </spartan-form-field>

      <!-- Select -->
      <spartan-form-field [formField]="form.plan" fieldName="plan">
        <label brnLabel for="plan" class="hlm-form-field__label">Plan</label>
        <select
          ngxSignalFormControl="input-like"
          id="plan"
          class="hlm-select"
          [formField]="form.plan"
        >
          <option value="" disabled>Select a plan</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </spartan-form-field>

      <!-- Checkbox -->
      <spartan-form-field [formField]="form.newsletter" fieldName="newsletter">
        <div class="hlm-checkbox-row">
          <input
            ngxSignalFormControl="checkbox"
            id="newsletter"
            type="checkbox"
            class="hlm-checkbox"
            [formField]="form.newsletter"
          />
          <div class="hlm-checkbox-row__copy">
            <label for="newsletter" class="hlm-checkbox-row__label">
              Send me product updates
            </label>
            <ngx-form-field-hint position="left">
              You can unsubscribe at any time
            </ngx-form-field-hint>
          </div>
        </div>
      </spartan-form-field>

      <button type="submit" class="hlm-button" data-testid="submit-button">
        Save preferences
      </button>
    </form>

    @if (lastSubmission(); as snapshot) {
      <pre class="shell__result" data-testid="last-submission">{{
        snapshot
      }}</pre>
    }
  `,
})
export class AccountPreferencesFormComponent {
  protected readonly form = form(
    signal<AccountPreferences>({
      displayName: '',
      plan: '',
      newsletter: false,
    }),
    accountSchema,
  );

  protected readonly lastSubmission = signal<string | null>(null);

  protected handleSubmit(): void {
    const state = this.form();
    if (state.invalid()) {
      // Touch the form so on-touch error display kicks in for any field that
      // hasn't been blurred yet.
      state.markAsTouched();
      return;
    }
    this.lastSubmission.set(JSON.stringify(state.value(), null, 2));
  }
}
