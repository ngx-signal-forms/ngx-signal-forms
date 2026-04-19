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
  validateStandardSchema,
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
import { zodVestBusinessSuite } from './zod-vest-validation.rules';
import {
  createZodVestValidationModel,
  zodVestAccountSchema,
  type ZodVestValidationModel,
} from './zod-vest-validation.schemas';

/* oxlint-disable @typescript-eslint/prefer-readonly-parameter-types -- Angular Signal Forms schema callbacks use SchemaPathTree, which is framework-defined and not modeled as a readonly parameter type. */
const zodVestValidationSchema: SchemaFn<Readonly<ZodVestValidationModel>> = (
  path: Readonly<SchemaPathTree<Readonly<ZodVestValidationModel>>>,
) => {
  validateStandardSchema(path, zodVestAccountSchema);
  validateVest(path, zodVestBusinessSuite, { includeWarnings: true });
};
/* oxlint-enable @typescript-eslint/prefer-readonly-parameter-types */

@Component({
  selector: 'ngx-zod-vest-validation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <div class="px-6 pt-0 pb-6">
      <h2 class="mb-4 text-2xl font-bold">Zod + Vest Validation Demo</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        Zod covers the contract shape. Vest adds business policy. Angular Signal
        Forms and the toolkit present both layers through one form tree, while
        the first-class Vest adapter keeps blocking errors and warnings in the
        same Vest validation pass.
      </p>

      <div class="mb-6 grid gap-4">
        <section
          class="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-100"
        >
          <p class="font-semibold">Zod handles the baseline</p>
          <ul class="mt-2 list-disc space-y-1 pl-5">
            <li>Required text fields</li>
            <li>Email format</li>
            <li>Password length</li>
            <li>Allowed enum values</li>
          </ul>
        </section>

        <section
          class="rounded-lg border border-fuchsia-200 bg-fuchsia-50 p-4 text-sm text-fuchsia-950 dark:border-fuchsia-900/60 dark:bg-fuchsia-950/30 dark:text-fuchsia-100"
        >
          <p class="font-semibold">Vest handles business policy</p>
          <ul class="mt-2 list-disc space-y-1 pl-5">
            <li>Business accounts need a company name</li>
            <li>Business accounts need a work email domain</li>
            <li>EU business accounts need a VAT number</li>
            <li>Passwords cannot include the user name</li>
            <li>
              Warnings can suggest stronger passwords and better VAT formatting
            </li>
          </ul>
        </section>
      </div>

      <div
        class="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-100"
      >
        Try including your first or last name in the password to trigger a Vest
        business-policy error. Remove special characters or the VAT country
        prefix to see non-blocking Vest warnings rendered by the same
        wrapper-driven assistive UI used for blocking errors.
      </div>

      <form
        [formRoot]="accountForm"
        ngxSignalForm
        [errorStrategy]="errorDisplayMode()"
        class="max-w-3xl space-y-6"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <ngx-form-field-wrapper
            [formField]="accountForm.firstName"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="zod-vest-first-name">First name</label>
            <input
              id="zod-vest-first-name"
              type="text"
              [formField]="accountForm.firstName"
            />
          </ngx-form-field-wrapper>

          <ngx-form-field-wrapper
            [formField]="accountForm.lastName"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="zod-vest-last-name">Last name</label>
            <input
              id="zod-vest-last-name"
              type="text"
              [formField]="accountForm.lastName"
            />
          </ngx-form-field-wrapper>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <ngx-form-field-wrapper
            [formField]="accountForm.email"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="zod-vest-email">Email</label>
            <input
              id="zod-vest-email"
              type="email"
              [formField]="accountForm.email"
              placeholder="name@company.com"
            />
          </ngx-form-field-wrapper>

          <ngx-form-field-wrapper
            [formField]="accountForm.password"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="zod-vest-password">Password</label>
            <input
              id="zod-vest-password"
              type="password"
              [formField]="accountForm.password"
            />
            <ngx-form-field-hint> At least 12 characters. </ngx-form-field-hint>
          </ngx-form-field-wrapper>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <ngx-form-field-wrapper
            [formField]="accountForm.accountType"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="zod-vest-account-type">Account type</label>
            <select
              id="zod-vest-account-type"
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
            <label for="zod-vest-country">Country</label>
            <select id="zod-vest-country" [formField]="accountForm.country">
              <option value="">Choose one</option>
              <option value="US">United States</option>
              <option value="DE">Germany</option>
              <option value="NL">Netherlands</option>
              <option value="BE">Belgium</option>
            </select>
          </ngx-form-field-wrapper>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <ngx-form-field-wrapper
            [formField]="accountForm.companyName"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="zod-vest-company-name">Company name</label>
            <input
              id="zod-vest-company-name"
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
            <label for="zod-vest-vat-number">VAT number</label>
            <input
              id="zod-vest-vat-number"
              type="text"
              [formField]="accountForm.vatNumber"
              class="uppercase"
            />
            <ngx-form-field-hint>
              Required for business accounts in DE, NL, or BE.
            </ngx-form-field-hint>
          </ngx-form-field-wrapper>
        </div>

        <div
          class="rounded-lg border border-gray-200 bg-gray-50 p-4 font-mono text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <div class="font-semibold text-gray-800 dark:text-gray-100">
            Validation layering
          </div>
          <pre
            class="mt-2 overflow-x-auto text-gray-700 dark:text-gray-300"
          ><code>{{ layeringCode }}</code></pre>
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
              Provisioning...
            } @else {
              Provision account
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
export class ZodVestValidationComponent {
  readonly errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');
  readonly appearance = input<FormFieldAppearance>('outline');
  readonly orientation = input<FormFieldOrientation>('vertical');
  readonly #onInvalid = createOnInvalidHandler();

  readonly #model = signal(createZodVestValidationModel());
  protected readonly submissionMessage = signal<string | null>(null);

  readonly accountForm = form(this.#model, zodVestValidationSchema, {
    submission: {
      ignoreValidators: 'all',
      action: async () => {
        this.submissionMessage.set(null);

        // Angular submit() currently treats all ValidationErrors as blocking,
        // so we keep warnings advisory by checking the toolkit warn:* convention
        // after formRoot has marked the form as touched.
        if (!hasOnlyWarnings(this.accountForm().errorSummary())) {
          this.#onInvalid(this.accountForm);
          return;
        }

        await new Promise<void>((resolve) => {
          setTimeout(resolve, 800);
        });
        this.submissionMessage.set(
          'Account provisioned. Zod errors stayed blocking, and the first-class Vest adapter kept warnings advisory.',
        );
        console.log('Zod + Vest account saved', this.#model());
      },
    },
  });

  protected readonly layeringCode = `form(model, (path) => {
  validateStandardSchema(path, zodVestAccountSchema);
  validateVest(path, zodVestBusinessSuite, { includeWarnings: true });
    // Blocking errors and warn() guidance come from the same Vest run.
  });`;

  protected resetForm(): void {
    this.accountForm().reset();
    this.#model.set(createZodVestValidationModel());
    this.submissionMessage.set(null);
  }
}
