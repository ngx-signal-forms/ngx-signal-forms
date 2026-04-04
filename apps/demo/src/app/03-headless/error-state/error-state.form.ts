import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  FormRoot,
  maxLength,
  required,
  schema,
} from '@angular/forms/signals';
import { createOnInvalidHandler } from '@ngx-signal-forms/toolkit';
import {
  NgxHeadlessCharacterCountDirective,
  NgxHeadlessErrorStateDirective,
} from '@ngx-signal-forms/toolkit/headless';

interface HeadlessProfile {
  email: string;
  bio: string;
}

const headlessSchema = schema<HeadlessProfile>((path) => {
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Enter a valid email address' });
  required(path.bio, { message: 'Bio is required' });
  maxLength(path.bio, 160, { message: 'Bio must be 160 characters or less' });
});

@Component({
  selector: 'ngx-headless-error-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    NgxHeadlessErrorStateDirective,
    NgxHeadlessCharacterCountDirective,
    FormRoot, // Replaces manual novalidate/submit
  ],
  template: `
    <div class="px-6 pt-0 pb-6">
      <h2 class="mb-4 text-2xl font-bold">Headless Error State</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        Custom markup with headless directives for error visibility and
        character count.
      </p>

      <form [formRoot]="profileForm" class="max-w-xl space-y-6">
        <div
          ngxSignalFormHeadlessErrorState
          #emailState="errorState"
          [field]="profileForm.email"
          fieldName="email"
          class="space-y-2"
        >
          <label for="email" class="text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            [formField]="profileForm.email"
            class="form-input"
            [attr.aria-invalid]="emailState.hasErrors() ? 'true' : null"
            [attr.aria-describedby]="
              emailState.showErrors() && emailState.hasErrors()
                ? emailState.errorId()
                : null
            "
          />

          @if (emailState.showErrors() && emailState.hasErrors()) {
            <div
              [id]="emailState.errorId()"
              role="alert"
              class="headless-alert-error text-sm"
            >
              @for (error of emailState.resolvedErrors(); track error.kind) {
                <div>{{ error.message }}</div>
              }
            </div>
          }
        </div>

        <div
          ngxSignalFormHeadlessErrorState
          #bioState="errorState"
          [field]="profileForm.bio"
          fieldName="bio"
          class="space-y-2"
        >
          <label for="bio" class="text-sm font-medium">Bio</label>
          <textarea
            id="bio"
            rows="4"
            [formField]="profileForm.bio"
            class="form-textarea"
            [attr.aria-invalid]="bioState.hasErrors() ? 'true' : null"
            [attr.aria-describedby]="
              bioState.showErrors() && bioState.hasErrors()
                ? bioState.errorId()
                : null
            "
          ></textarea>

          <div
            ngxSignalFormHeadlessCharacterCount
            #bioCount="characterCount"
            [field]="profileForm.bio"
            [maxLength]="160"
            class="headless-counter"
          >
            <span
              [class.text-amber-600]="bioCount.limitState() === 'warning'"
              [class.text-orange-600]="bioCount.limitState() === 'danger'"
              [class.text-red-600]="bioCount.limitState() === 'exceeded'"
            >
              {{ bioCount.currentLength() }} /
              {{ bioCount.resolvedMaxLength() }}
            </span>
            @if (bioCount.remaining() !== null) {
              <span> {{ bioCount.remaining() }} remaining </span>
            }
          </div>

          @if (bioState.showErrors() && bioState.hasErrors()) {
            <div
              [id]="bioState.errorId()"
              role="alert"
              class="headless-alert-error text-sm"
            >
              @for (error of bioState.resolvedErrors(); track error.kind) {
                <div>{{ error.message }}</div>
              }
            </div>
          }
        </div>

        <div class="flex gap-4">
          <button
            type="submit"
            class="btn-primary"
            [disabled]="profileForm().submitting()"
          >
            @if (profileForm().submitting()) {
              Saving...
            } @else {
              Save Profile
            }
          </button>
          <button type="button" (click)="reset()" class="btn-secondary">
            Reset
          </button>
        </div>
      </form>
    </div>
  `,
})
export class HeadlessErrorStateComponent {
  readonly #initialData: HeadlessProfile = {
    email: '',
    bio: '',
  };

  readonly #model = signal(this.#initialData);
  readonly profileForm = form(this.#model, headlessSchema, {
    submission: {
      action: async (data) => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 600);
        });
        console.log('Saved profile:', data());
      },
      onInvalid: createOnInvalidHandler(),
    },
  });

  protected reset(): void {
    this.profileForm().reset();
    this.#model.set(this.#initialData);
  }
}
