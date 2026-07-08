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
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import {
  createZodValidationModel,
  zodBaselineAccountSchema,
  type ZodValidationModel,
} from './zod-validation.schemas';

/* oxlint-disable @typescript-eslint/prefer-readonly-parameter-types -- Angular Signal Forms schema callbacks use SchemaPathTree, which is framework-defined and not modeled as a readonly parameter type. */
const zodValidationSchema: SchemaFn<Readonly<ZodValidationModel>> = (
  path: Readonly<SchemaPathTree<Readonly<ZodValidationModel>>>,
) => {
  validateStandardSchema(path, zodBaselineAccountSchema);
};
/* oxlint-enable @typescript-eslint/prefer-readonly-parameter-types */

@Component({
  selector: 'ngx-zod-validation',
  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  styles: `
    @media (min-width: 48rem) {
      .zod-validation-form__pair-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .zod-validation-form--single-column .zod-validation-form__pair-grid {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `,
  template: `
    <div class="px-6 pt-0 pb-6">
      <h2 class="mb-4 text-2xl font-bold">Zod-Only Validation Demo</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        This baseline keeps validation intentionally focused: one Zod schema
        supplies structural rules through Angular Signal Forms via
        <code>validateStandardSchema</code>. It is the clean reference before
        adding business policy layers like Vest.
      </p>

      <form
        [formRoot]="accountForm"
        ngxSignalForm
        [errorStrategy]="errorDisplayMode()"
        class="max-w-3xl space-y-6"
        [class.zod-validation-form--single-column]="useSingleColumnFieldRows()"
      >
        <div class="zod-validation-form__pair-grid grid gap-4 md:grid-cols-2">
          <ngx-form-field-wrapper
            [formField]="accountForm.firstName"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="zod-only-first-name">First name</label>
            <input
              id="zod-only-first-name"
              type="text"
              [formField]="accountForm.firstName"
            />
          </ngx-form-field-wrapper>

          <ngx-form-field-wrapper
            [formField]="accountForm.lastName"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="zod-only-last-name">Last name</label>
            <input
              id="zod-only-last-name"
              type="text"
              [formField]="accountForm.lastName"
            />
          </ngx-form-field-wrapper>
        </div>

        <div class="zod-validation-form__pair-grid grid gap-4 md:grid-cols-2">
          <ngx-form-field-wrapper
            [formField]="accountForm.email"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="zod-only-email">Email</label>
            <input
              id="zod-only-email"
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
            <label for="zod-only-password">Password</label>
            <input
              id="zod-only-password"
              type="password"
              [formField]="accountForm.password"
            />
            <ngx-form-field-hint> At least 12 characters. </ngx-form-field-hint>
          </ngx-form-field-wrapper>
        </div>

        <div class="zod-validation-form__pair-grid grid gap-4 md:grid-cols-2">
          <ngx-form-field-wrapper
            [formField]="accountForm.accountType"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="zod-only-account-type">Account type</label>
            <select
              id="zod-only-account-type"
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
            <label for="zod-only-country">Country</label>
            <select id="zod-only-country" [formField]="accountForm.country">
              <option value="">Choose one</option>
              <option value="US">United States</option>
              <option value="DE">Germany</option>
              <option value="NL">Netherlands</option>
              <option value="BE">Belgium</option>
            </select>
          </ngx-form-field-wrapper>
        </div>

        <div
          class="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100"
        >
          <p class="font-semibold">Zod baseline wiring</p>
          <pre
            class="mt-2 overflow-x-auto"
            tabindex="0"
          ><code>{{ baselineCode }}</code></pre>
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
              Save baseline form
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
export class ZodValidationComponent {
  readonly errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');
  readonly appearance = input<FormFieldAppearance>('outline');
  readonly orientation = input<FormFieldOrientation>('vertical');

  readonly #model = signal(createZodValidationModel());
  protected readonly submissionMessage = signal<string | null>(null);

  readonly accountForm = form(this.#model, zodValidationSchema, {
    submission: {
      onInvalid: createOnInvalidHandler(),
      action: async () => {
        this.submissionMessage.set(null);
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 500);
        });
        this.submissionMessage.set(
          'Saved. This route uses only Zod structural validation through validateStandardSchema.',
        );
      },
    },
  });

  protected readonly baselineCode = `form(model, (path) => {
  validateStandardSchema(path, zodBaselineAccountSchema);
});`;

  protected useSingleColumnFieldRows(): boolean {
    return (
      this.appearance() === 'standard' && this.orientation() === 'horizontal'
    );
  }

  protected resetForm(): void {
    this.accountForm().reset();
    this.#model.set(createZodValidationModel());
    this.submissionMessage.set(null);
  }
}
