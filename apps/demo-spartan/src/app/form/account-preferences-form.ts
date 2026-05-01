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
import {
  NgxSignalForm,
  NgxSignalFormAutoAria,
  NgxSignalFormControlSemanticsDirective,
} from '@ngx-signal-forms/toolkit';
import { NgxFormFieldHint } from '@ngx-signal-forms/toolkit/assistive';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import {
  HlmSelect,
  HlmSelectContent,
  HlmSelectItem,
  HlmSelectTrigger,
  HlmSelectValue,
} from '@spartan-ng/helm/select';
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
 * Single representative form: text input + select + checkbox composed
 * with real `@spartan-ng/helm` components scaffolded into `libs/ui`.
 *
 * Each control declares `NgxSignalFormControlSemanticsDirective` alongside
 * Spartan's helm directives — the toolkit reads semantics through DI
 * (not DOM heuristics), so combining `[hlmInput] ngxSignalFormControl="..."`
 * is the canonical "alongside" composition the PRD asks the reference to
 * exercise.
 */
@Component({
  selector: 'ngx-account-preferences-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    FormRoot,
    HlmCheckbox,
    HlmInput,
    HlmLabel,
    HlmSelect,
    HlmSelectContent,
    HlmSelectItem,
    HlmSelectTrigger,
    HlmSelectValue,
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
        <label hlmLabel for="display-name">Display name</label>
        <input
          hlmInput
          ngxSignalFormControl="input-like"
          id="display-name"
          type="text"
          placeholder="e.g. Ada Lovelace"
          [formField]="form.displayName"
        />
        <ngx-form-field-hint position="left">
          Public name shown on your profile
        </ngx-form-field-hint>
      </spartan-form-field>

      <!--
        Select. The hlm-select element hosts BrnSelect (the actual form
        control), so [formField] binds there. The native focusable surface
        lives on the hlm-select-trigger button.
      -->
      <spartan-form-field [formField]="form.plan" fieldName="plan">
        <label hlmLabel for="plan-trigger">Plan</label>
        <hlm-select ngxSignalFormControl="input-like" [formField]="form.plan">
          <hlm-select-trigger id="plan-trigger" class="w-full">
            <hlm-select-value placeholder="Select a plan" />
          </hlm-select-trigger>
          <hlm-select-content>
            <hlm-select-item value="starter">Starter</hlm-select-item>
            <hlm-select-item value="pro">Pro</hlm-select-item>
            <hlm-select-item value="enterprise">Enterprise</hlm-select-item>
          </hlm-select-content>
        </hlm-select>
      </spartan-form-field>

      <!-- Checkbox -->
      <spartan-form-field [formField]="form.newsletter" fieldName="newsletter">
        <div class="flex items-start gap-3">
          <hlm-checkbox
            ngxSignalFormControl="checkbox"
            inputId="newsletter"
            [formField]="form.newsletter"
          />
          <div class="flex flex-col gap-1">
            <label hlmLabel for="newsletter">Send me product updates</label>
            <ngx-form-field-hint position="left">
              You can unsubscribe at any time
            </ngx-form-field-hint>
          </div>
        </div>
      </spartan-form-field>

      <button
        type="submit"
        class="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring/40 mt-6 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium shadow-xs transition-colors outline-none focus-visible:ring-2"
        data-testid="submit-button"
      >
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
