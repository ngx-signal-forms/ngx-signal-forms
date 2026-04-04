import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import {
  form,
  FormField,
  required,
  schema,
  validateHttp,
} from '@angular/forms/signals';
import {
  type ErrorDisplayStrategy,
  type FormFieldAppearance,
  createOnInvalidHandler,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

interface Registration {
  username: string;
}

interface UsernameAvailabilityResponse {
  username: string;
  available: boolean;
}

const registrationSchema = schema<Registration>((path) => {
  required(path.username, { message: 'Username is required' });

  // Async validator simulating API check
  validateHttp(path.username, {
    request: ({ value }) =>
      value() ? `fake-api/check-user/${value()}` : undefined,
    onSuccess: (response: UsernameAvailabilityResponse, ctx) => {
      if (!response.available) {
        return {
          kind: 'usernameTaken',
          message: `The username "${ctx.value()}" is already taken`,
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
  imports: [FormField, NgxSignalFormToolkit, NgxFormField, JsonPipe],
  template: `
    <div class="px-6 pt-0 pb-6">
      <h2 class="mb-4 text-2xl font-bold">Async Validation Demo</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        Type "admin" to see async validation error (simulated).
      </p>

      <form
        [formRoot]="regForm"
        [errorStrategy]="errorDisplayMode()"
        class="max-w-md space-y-6"
      >
        <ngx-signal-form-field-wrapper
          [formField]="regForm.username"
          [appearance]="appearance()"
        >
          <label for="username">Username</label>
          <input
            id="username"
            type="text"
            [formField]="regForm.username"
            placeholder="Try typing 'admin'"
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
            [disabled]="regForm().submitting() || regForm().pending()"
          >
            @if (regForm().submitting()) {
              Registering...
            } @else if (regForm().pending()) {
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
  readonly errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');
  readonly appearance = input<FormFieldAppearance>('outline');

  readonly #model = signal({ username: '' });
  readonly regForm = form(this.#model, registrationSchema, {
    submission: {
      action: async (data) => {
        // Simulate actual registration delay
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 1000);
        });
        console.log('Registered:', data());
      },
      onInvalid: createOnInvalidHandler(),
    },
  });

  protected resetForm(): void {
    this.regForm().reset();
    this.#model.set({ username: '' });
  }
}
