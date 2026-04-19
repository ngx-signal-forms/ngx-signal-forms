import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import {
  form,
  FormField,
  type SchemaFn,
  type SchemaPathTree,
} from '@angular/forms/signals';
import {
  type ErrorDisplayStrategy,
  type FormFieldAppearance,
  type FormFieldOrientation,
  createOnInvalidHandler,
  hasOnlyWarnings,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { validateVest } from '@ngx-signal-forms/toolkit/vest';
import {
  createVestValidationModel,
  type VestValidationModel,
} from './vest-validation.model';
import { vestOnlyAccountSuite } from './vest-validation.validations';

/* oxlint-disable @typescript-eslint/prefer-readonly-parameter-types -- Angular Signal Forms schema callbacks use SchemaPathTree, which is framework-defined and not modeled as a readonly parameter type. */
const vestValidationSchema: SchemaFn<Readonly<VestValidationModel>> = (
  path: Readonly<SchemaPathTree<Readonly<VestValidationModel>>>,
) => {
  validateVest(path, vestOnlyAccountSuite, { includeWarnings: true });
};
/* oxlint-enable @typescript-eslint/prefer-readonly-parameter-types */

@Component({
  selector: 'ngx-vest-validation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  styles: `
    @media (min-width: 48rem) {
      .vest-validation-form__pair-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .vest-validation-form--single-column .vest-validation-form__pair-grid {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `,
  template: `
    <div class="px-6 pt-0 pb-6">
      <h2 class="mb-4 text-2xl font-bold">Vest-Only Validation Demo</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        This form uses the toolkit's first-class Vest adapter, so one Vest suite
        drives blocking rules and advisory warnings through the same Angular
        Signal Forms tree. Vest warnings stay advisory and render through the
        same assistive layer as blocking errors, so the form can still submit
        when only warning messages remain.
      </p>

      <form
        [formRoot]="accountForm"
        ngxSignalForm
        [errorStrategy]="errorDisplayMode()"
        class="max-w-3xl space-y-6"
        [class.vest-validation-form--single-column]="useSingleColumnFieldRows()"
      >
        <div class="vest-validation-form__pair-grid grid gap-4 md:grid-cols-2">
          <ngx-form-field-wrapper
            [formField]="accountForm.accountType"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="vest-account-type">Account type</label>
            <select
              id="vest-account-type"
              [formField]="accountForm.accountType"
            >
              <option value="">Choose one</option>
              <option value="personal">Personal</option>
              <option value="business">Business</option>
            </select>
          </ngx-form-field-wrapper>

          <ngx-form-field-wrapper
            [formField]="accountForm.country"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="vest-country">Billing country</label>
            <select id="vest-country" [formField]="accountForm.country">
              <option value="">Choose one</option>
              <option value="US">United States</option>
              <option value="DE">Germany</option>
              <option value="NL">Netherlands</option>
              <option value="BE">Belgium</option>
            </select>
          </ngx-form-field-wrapper>
        </div>

        <div class="vest-validation-form__pair-grid grid gap-4 md:grid-cols-2">
          <ngx-form-field-wrapper
            [formField]="accountForm.companyName"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="vest-company-name">Company name</label>
            <input
              id="vest-company-name"
              type="text"
              [formField]="accountForm.companyName"
            />
            <ngx-form-field-hint>
              Required for business accounts.
            </ngx-form-field-hint>
          </ngx-form-field-wrapper>

          <ngx-form-field-wrapper
            [formField]="accountForm.vatNumber"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="vest-vat-number">VAT number</label>
            <input
              id="vest-vat-number"
              type="text"
              [formField]="accountForm.vatNumber"
              class="uppercase"
            />
            <ngx-form-field-hint>
              Required for business accounts in DE, NL, or BE.
            </ngx-form-field-hint>
          </ngx-form-field-wrapper>
        </div>

        <div class="vest-validation-form__pair-grid grid gap-4 md:grid-cols-2">
          <ngx-form-field-wrapper
            [formField]="accountForm.workEmail"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="vest-work-email">Work email</label>
            <input
              id="vest-work-email"
              type="email"
              [formField]="accountForm.workEmail"
              placeholder="team@example.com"
            />
          </ngx-form-field-wrapper>

          <ngx-form-field-wrapper
            [formField]="accountForm.teamSize"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="vest-team-size">Team size</label>
            <input
              id="vest-team-size"
              type="text"
              inputmode="numeric"
              [formField]="accountForm.teamSize"
              placeholder="1-200"
            />
            <ngx-form-field-hint>
              Personal plans support up to 10 seats.
            </ngx-form-field-hint>
          </ngx-form-field-wrapper>
        </div>

        <ngx-form-field-wrapper
          [formField]="accountForm.referralCode"
          [appearance]="appearance()"
          [orientation]="orientation()"
        >
          <label for="vest-referral-code">Referral code</label>
          <input
            id="vest-referral-code"
            type="text"
            [formField]="accountForm.referralCode"
            placeholder="Try STARTER100"
            class="uppercase"
          />
          <ngx-form-field-hint>
            STARTER100 is valid only for personal accounts with up to 3 seats.
          </ngx-form-field-hint>
        </ngx-form-field-wrapper>

        <div
          class="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100"
        >
          <p class="font-semibold">Why this is a Vest-friendly example</p>
          <ul class="mt-2 list-disc space-y-1 pl-5">
            <li>The seat limit depends on account type.</li>
            <li>VAT is conditional on account type and country.</li>
            <li>Referral eligibility depends on account type and team size.</li>
            <li>Warnings suggest a company email and flag very large teams.</li>
            <li>Errors and warnings come from the same Vest run.</li>
          </ul>
        </div>

        <div
          class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
        >
          <p class="font-semibold">Try the warning path</p>
          <ul class="mt-2 list-disc space-y-1 pl-5">
            <li>
              Use <code>gmail.com</code> to see a non-blocking email warning.
            </li>
            <li>
              Use more than 50 seats to see an annual billing review warning.
            </li>
            <li>
              These messages render below the field through
              <code>ngx-form-field-wrapper</code>, which uses
              <code>ngx-form-field-error</code> for both alerts and warning
              status messages.
            </li>
          </ul>
        </div>

        @if (submissionMessage()) {
          <div
            class="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100"
            role="status"
          >
            {{ submissionMessage() }}
          </div>
        }

        <div class="flex gap-4">
          <button type="submit" class="btn-primary">
            @if (accountForm().submitting()) {
              Saving...
            } @else {
              Create account
            }
          </button>

          <button type="button" (click)="resetForm()" class="btn-secondary">
            Reset
          </button>
        </div>
      </form>
    </div>
  `,
})
export class VestValidationComponent {
  readonly errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');
  readonly appearance = input<FormFieldAppearance>('outline');
  readonly orientation = input<FormFieldOrientation>('vertical');
  readonly #onInvalid = createOnInvalidHandler();

  readonly #model = signal(createVestValidationModel());
  protected readonly submissionMessage = signal<string | null>(null);

  readonly accountForm = form(this.#model, vestValidationSchema, {
    submission: {
      ignoreValidators: 'all',
      action: async () => {
        this.submissionMessage.set(null);

        // Angular submit() does not distinguish warn:* messages from blocking
        // errors yet, so we gate the declarative submission action after
        // formRoot has revealed all validation feedback.
        if (!hasOnlyWarnings(this.accountForm().errorSummary())) {
          this.#onInvalid(this.accountForm);
          return;
        }

        await new Promise<void>((resolve) => {
          setTimeout(resolve, 800);
        });
        this.submissionMessage.set(
          'Account created. The first-class Vest adapter kept warnings visible without blocking submission.',
        );
        console.log('Vest-only account saved', this.#model());
      },
    },
  });

  protected useSingleColumnFieldRows(): boolean {
    return (
      this.appearance() === 'standard' && this.orientation() === 'horizontal'
    );
  }

  protected resetForm(): void {
    this.accountForm().reset();
    this.#model.set(createVestValidationModel());
    this.submissionMessage.set(null);
  }
}
