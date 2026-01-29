import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  form,
  FormField,
  required,
  schema,
  submit,
  validateHttp,
} from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxOutlinedFormField } from '@ngx-signal-forms/toolkit/form-field';

interface Registration {
  username: string;
}

const registrationSchema = schema<Registration>((path) => {
  required(path.username, { message: 'Username is required' });

  // Async validator simulating API check
  validateHttp(path.username, {
    request: ({ value }) =>
      value() ? `fake-api/check-user/${value()}` : undefined,
    onSuccess: (_response, ctx) => {
      // Simulate "admin" being taken (all other usernames available)
      if (ctx.value().toLowerCase() === 'admin') {
        return {
          kind: 'usernameTaken',
          message: 'This username is already taken',
        };
      }
      return null;
    },
    onError: () => null,
  });
});

@Component({
  selector: 'ngx-async-validation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxOutlinedFormField, JsonPipe],
  template: `
    <div class="px-6 pt-0 pb-6">
      <h2 class="mb-4 text-2xl font-bold">Async Validation Demo</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        Type "admin" to see async validation error (simulated).
      </p>

      <form (submit)="register($event)" class="max-w-md space-y-6">
        <ngx-signal-form-field-wrapper [formField]="regForm.username" outline>
          <label for="username">Username</label>
          <input
            id="username"
            type="text"
            [formField]="regForm.username"
            placeholder="Try typing 'admin'"
            class="form-input"
          />

          <!-- Custom suffix for loading state -->
          @if (regForm.username().pending()) {
            <span suffix class="animate-pulse text-sm text-gray-500">
              Checking...
            </span>
          }

          <ngx-signal-form-field-hint>
            Availability is checked automatically
          </ngx-signal-form-field-hint>
        </ngx-signal-form-field-wrapper>

        <div class="flex gap-4">
          <button
            type="submit"
            class="btn-primary"
            [disabled]="regForm().pending()"
          >
            @if (regForm().pending()) {
              Validating...
            } @else {
              Register
            }
          </button>

          <button type="button" (click)="resetForm()" class="btn-secondary">
            Reset
          </button>
        </div>

        <!-- State Debugger -->
        <div
          class="mt-8 rounded bg-gray-100 p-4 font-mono text-xs dark:bg-gray-800"
        >
          <div>Pending: {{ regForm.username().pending() }}</div>
          <div>Valid: {{ regForm.username().valid() }}</div>
          <div>Errors: {{ regForm.username().errors() | json }}</div>
        </div>
      </form>
    </div>
  `,
})
export class AsyncValidationComponent {
  readonly #model = signal<Registration>({ username: '' });
  readonly regForm = form(this.#model, registrationSchema);

  protected async register(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.regForm, async (data) => {
      // Simulate actual registration delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Registered:', data());
      return null;
    });
  }

  protected resetForm(): void {
    this.regForm().reset();
    this.#model.set({ username: '' });
  }
}
