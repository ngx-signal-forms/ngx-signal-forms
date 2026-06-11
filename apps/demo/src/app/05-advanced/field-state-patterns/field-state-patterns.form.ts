import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import {
  disabled,
  email,
  FormField,
  form,
  hidden,
  readonly,
  required,
  schema,
} from '@angular/forms/signals';
import {
  type ErrorDisplayStrategy,
  type FormFieldAppearance,
  type FormFieldOrientation,
  createOnInvalidHandler,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

type ContactPreference = 'email' | 'sms';

interface FieldStatePatternsModel {
  workEmail: string;
  contactPreference: ContactPreference;
  mobileNumber: string;
  inviteOnly: boolean;
  inviteCode: string;
  managedByIdentityProvider: boolean;
}

function createInitialFieldStatePatternsModel(): FieldStatePatternsModel {
  return {
    workEmail: 'ada@company.com',
    contactPreference: 'email',
    mobileNumber: '',
    inviteOnly: false,
    inviteCode: '',
    managedByIdentityProvider: false,
  };
}

const fieldStatePatternsSchema = schema<FieldStatePatternsModel>((path) => {
  required(path.workEmail, { message: 'Work email is required' });
  email(path.workEmail, { message: 'Enter a valid work email address' });
  readonly(path.workEmail, {
    when: (ctx) => ctx.valueOf(path.managedByIdentityProvider),
  });

  disabled(path.mobileNumber, {
    when: (ctx) => ctx.valueOf(path.contactPreference) !== 'sms',
  });
  required(path.mobileNumber, {
    when: (ctx) => ctx.valueOf(path.contactPreference) === 'sms',
    message: 'SMS notifications need a mobile number',
  });

  hidden(path.inviteCode, {
    when: (ctx) => !ctx.valueOf(path.inviteOnly),
  });
  required(path.inviteCode, {
    when: (ctx) => ctx.valueOf(path.inviteOnly),
    message: 'Enter the invite code from your onboarding email',
  });
});

@Component({
  selector: 'ngx-field-state-patterns',

  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <div class="px-6 pt-0 pb-6">
      <h2 class="mb-4 text-2xl font-bold">Field State Patterns Demo</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        Angular 22 made <code>&#123; when &#125;</code> the consistent way to
        drive
        dynamic field state. This demo shows when to hide, disable, or lock a
        field while keeping the toolkit wrappers and assistive UI unchanged.
      </p>

      <div class="mb-6 grid gap-4">
        <section
          class="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100"
        >
          <p class="font-semibold">Use cases</p>
          <ul class="mt-2 list-disc space-y-1 pl-5">
            <li>
              <strong>readonly:</strong> an identity provider owns the work
              email, so users can see it but cannot edit it.
            </li>
            <li>
              <strong>disabled:</strong> the SMS field stays visible to explain
              that it unlocks only when SMS notifications are selected.
            </li>
            <li>
              <strong>hidden:</strong> the invite code does not appear until the
              flow becomes invite-only.
            </li>
          </ul>
        </section>

        <section
          class="rounded-lg border border-gray-200 bg-gray-50 p-4 font-mono text-sm dark:border-gray-700 dark:bg-gray-900"
        >
          <div class="font-semibold text-gray-800 dark:text-gray-100">
            Angular 22 state wiring
          </div>
          <pre
            class="mt-2 overflow-x-auto text-gray-700 dark:text-gray-300"
            tabindex="0"
          ><code>{{ stateSchemaCode }}</code></pre>
        </section>
      </div>

      <form
        [formRoot]="stateForm"
        ngxSignalForm
        [errorStrategy]="errorDisplayMode()"
        class="max-w-3xl space-y-6"
      >
        <div class="grid gap-4 md:grid-cols-2">
          <ngx-form-field-wrapper
            [formField]="stateForm.workEmail"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="field-state-work-email">Work email</label>
            <input
              id="field-state-work-email"
              type="email"
              [formField]="stateForm.workEmail"
            />
            <ngx-form-field-hint>
              Toggle identity-provider management to switch between editable and
              readonly states.
            </ngx-form-field-hint>
          </ngx-form-field-wrapper>

          <ngx-form-field-wrapper
            [formField]="stateForm.contactPreference"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="field-state-contact-preference">
              Notification preference
            </label>
            <select
              id="field-state-contact-preference"
              [formField]="stateForm.contactPreference"
            >
              <option value="email">Email</option>
              <option value="sms">SMS</option>
            </select>
          </ngx-form-field-wrapper>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <ngx-form-field-wrapper
            [formField]="stateForm.mobileNumber"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="field-state-mobile-number">Mobile number</label>
            <input
              id="field-state-mobile-number"
              type="tel"
              [formField]="stateForm.mobileNumber"
              placeholder="Enabled only for SMS"
            />
            <ngx-form-field-hint>
              The field stays visible but disabled until the user chooses SMS.
            </ngx-form-field-hint>
          </ngx-form-field-wrapper>

          <div class="space-y-4">
            <ngx-form-field-wrapper
              [formField]="stateForm.managedByIdentityProvider"
              [appearance]="appearance()"
              [orientation]="orientation()"
            >
              <label for="field-state-managed-by-idp">
                Managed by identity provider
              </label>
              <input
                id="field-state-managed-by-idp"
                type="checkbox"
                ngxSignalFormControl="checkbox"
                [formField]="stateForm.managedByIdentityProvider"
              />
            </ngx-form-field-wrapper>

            <ngx-form-field-wrapper
              [formField]="stateForm.inviteOnly"
              [appearance]="appearance()"
              [orientation]="orientation()"
            >
              <label for="field-state-invite-only">Invite-only onboarding</label>
              <input
                id="field-state-invite-only"
                type="checkbox"
                ngxSignalFormControl="checkbox"
                [formField]="stateForm.inviteOnly"
              />
            </ngx-form-field-wrapper>
          </div>
        </div>

        <ngx-form-field-wrapper
          [formField]="stateForm.inviteCode"
          [appearance]="appearance()"
          [orientation]="orientation()"
        >
          <label for="field-state-invite-code">Invite code</label>
          <input
            id="field-state-invite-code"
            type="text"
            [formField]="stateForm.inviteCode"
            placeholder="Shown only for invite-only onboarding"
          />
          <ngx-form-field-hint>
            Hidden fields drop out of the rendered wrapper and out of invalid
            focus flows until they matter.
          </ngx-form-field-hint>
        </ngx-form-field-wrapper>

        <div
          class="rounded-lg border border-gray-200 bg-gray-50 p-4 font-mono text-xs dark:border-gray-700 dark:bg-gray-900"
        >
          <div>workEmail.readonly(): {{ stateForm.workEmail().readonly() }}</div>
          <div>
            mobileNumber.disabled(): {{ stateForm.mobileNumber().disabled() }}
          </div>
          <div>inviteCode.hidden(): {{ stateForm.inviteCode().hidden() }}</div>
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
            @if (stateForm().submitting()) {
              Saving...
            } @else {
              Save preferences
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
export class FieldStatePatternsComponent {
  readonly errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');
  readonly appearance = input<FormFieldAppearance>('outline');
  readonly orientation = input<FormFieldOrientation>('vertical');

  readonly #model = signal(createInitialFieldStatePatternsModel());
  protected readonly submissionMessage = signal<string | null>(null);

  readonly stateForm = form(this.#model, fieldStatePatternsSchema, {
    submission: {
      action: async () => {
        this.submissionMessage.set(null);
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 500);
        });
        this.submissionMessage.set(
          'Saved. Hidden fields stayed out of the way, disabled fields stayed visible, and readonly data remained reviewable.',
        );
      },
      onInvalid: createOnInvalidHandler(),
    },
  });

  protected readonly stateSchemaCode = `readonly(path.workEmail, {
  when: ({ valueOf }) => valueOf(path.managedByIdentityProvider),
});

disabled(path.mobileNumber, {
  when: ({ valueOf }) => valueOf(path.contactPreference) !== 'sms',
});

hidden(path.inviteCode, {
  when: ({ valueOf }) => !valueOf(path.inviteOnly),
});`;

  protected resetForm(): void {
    this.stateForm().reset();
    this.#model.set(createInitialFieldStatePatternsModel());
    this.submissionMessage.set(null);
  }
}
