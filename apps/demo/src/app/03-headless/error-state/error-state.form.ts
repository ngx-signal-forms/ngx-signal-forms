import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  maxLength,
  required,
  schema,
  submit,
} from '@angular/forms/signals';
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
  ],
  template: `
    <div class="px-6 pt-0 pb-6">
      <h2 class="mb-4 text-2xl font-bold">Headless Error State</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        Custom markup with headless directives for error visibility and
        character count.
      </p>

      <form novalidate (submit)="save($event)" class="max-w-xl space-y-6">
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
              class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
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
            class="flex items-center justify-between text-xs"
          >
            <span
              [class.text-amber-600]="bioCount.limitState() === 'warning'"
              [class.text-orange-600]="bioCount.limitState() === 'danger'"
              [class.text-red-600]="bioCount.limitState() === 'exceeded'"
              class="text-gray-500"
            >
              {{ bioCount.currentLength() }} /
              {{ bioCount.resolvedMaxLength() }}
            </span>
            @if (bioCount.remaining() !== null) {
              <span class="text-gray-500">
                {{ bioCount.remaining() }} remaining
              </span>
            }
          </div>

          @if (bioState.showErrors() && bioState.hasErrors()) {
            <div
              [id]="bioState.errorId()"
              role="alert"
              class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              @for (error of bioState.resolvedErrors(); track error.kind) {
                <div>{{ error.message }}</div>
              }
            </div>
          }
        </div>

        <div class="flex gap-4">
          <button type="submit" class="btn-primary">Save Profile</button>
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

  readonly #model = signal<HeadlessProfile>(this.#initialData);
  readonly profileForm = form(this.#model, headlessSchema);

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.profileForm, async (data) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      console.log('Saved profile:', data());
      return null;
    });
  }

  protected reset(): void {
    this.profileForm().reset();
    this.#model.set(this.#initialData);
  }
}
