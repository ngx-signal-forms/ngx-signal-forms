import { JsonPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import {
  debounce,
  form,
  FormField,
  minLength,
  required,
  schema,
  validateHttp,
} from '@angular/forms/signals';
import {
  type ErrorDisplayStrategy,
  type FormFieldAppearance,
  type FormFieldOrientation,
  createOnInvalidHandler,
  NgxSignalFormToolkit,
  warningError,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

interface Registration {
  username: string;
  usernameOnBlur: string;
}

interface UsernameAvailabilityResponse {
  username: string;
  available: boolean;
}

const registrationSchema = schema<Registration>((path) => {
  required(path.username, { message: 'Username is required' });
  minLength(path.username, 3, {
    message: 'Enter at least 3 characters before checking availability',
  });

  // Async validator simulating API check
  validateHttp(path.username, {
    request: ({ value }) => {
      const username = value().trim();
      return username.length >= 3
        ? `fake-api/check-user/${username}`
        : undefined;
    },
    debounce: 350,
    onSuccess: (response: UsernameAvailabilityResponse, ctx) => {
      if (!response.available) {
        return {
          kind: 'usernameTaken',
          message: `The username "${ctx.value()}" is already taken`,
        };
      }
      return null;
    },
    onError: () =>
      warningError(
        'availabilityUnknown',
        'Could not verify availability — you can still submit, but the name may be taken.',
      ),
  });

  required(path.usernameOnBlur, { message: 'Username is required' });
  minLength(path.usernameOnBlur, 3, {
    message: 'Enter at least 3 characters before checking availability',
  });

  debounce(path.usernameOnBlur, 'blur');

  validateHttp(path.usernameOnBlur, {
    request: ({ value }) => {
      const username = value().trim();
      return username.length >= 3
        ? `fake-api/check-user/${username}`
        : undefined;
    },
    onSuccess: (response: UsernameAvailabilityResponse, ctx) => {
      if (!response.available) {
        return {
          kind: 'usernameTakenOnBlur',
          message: `The username "${ctx.value()}" is already taken`,
        };
      }
      return null;
    },
    onError: () =>
      warningError(
        'availabilityUnknown',
        'Could not verify availability — you can still submit, but the name may be taken.',
      ),
  });
});

@Component({
  selector: 'ngx-async-validation',

  imports: [FormField, NgxSignalFormToolkit, NgxFormField, JsonPipe],
  template: `
    <div class="px-6 pt-0 pb-6">
      <h2 class="mb-4 text-2xl font-bold">Async Validation Demo</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        Compare two remote-validation timings side by side: typed debounce vs
        blur debounce. Try "admin" in both fields.
      </p>

      <div
        class="mb-6 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100"
      >
        <p class="font-semibold">Angular 22 pattern in use</p>
        <ul class="mt-2 list-disc space-y-1 pl-5">
          <li>
            <code>validateHttp(..., &#123; debounce: 350 &#125;)</code>
            waits for typing to settle before issuing the remote check.
          </li>
          <li>
            For blur-only timing, Angular 22 supports
            <code>debounce(field, 'blur')</code> when the value itself should
            settle only after focus leaves the control.
          </li>
          <li>
            <code>reloadValidation()</code> lets the UI re-run async validators
            after something outside the field changes.
          </li>
          <li>
            <code>getError()</code> reads the latest async error without
            manually searching the error array.
          </li>
          <li>
            <code>onError</code> returns a
            <code>warningError()</code> instead of <code>null</code> — a
            network failure surfaces as a non-blocking advisory (prefixed
            <code>warn:</code>) so submission is never silently unblocked.
          </li>
        </ul>
      </div>

      <form
        [formRoot]="regForm"
        ngxSignalForm
        [errorStrategy]="errorDisplayMode()"
        class="max-w-md space-y-6"
      >
        <ngx-form-field-wrapper
          [formField]="regForm.username"
          [appearance]="appearance()"
          [orientation]="orientation()"
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

          <ngx-form-field-hint>
            Debounced while typing (350ms)
          </ngx-form-field-hint>
        </ngx-form-field-wrapper>

        <ngx-form-field-wrapper
          [formField]="regForm.usernameOnBlur"
          [appearance]="appearance()"
          [orientation]="orientation()"
        >
          <label for="usernameOnBlur">Username (blur debounce)</label>
          <input
            id="usernameOnBlur"
            type="text"
            [formField]="regForm.usernameOnBlur"
            placeholder="Type, then tab away"
          />

          @if (regForm.usernameOnBlur().pending()) {
            <span suffix class="animate-pulse text-sm text-gray-500">
              Checking...
            </span>
          }

          <ngx-form-field-hint>
            Updates on blur via <code>debounce(field, 'blur')</code>
          </ngx-form-field-hint>
        </ngx-form-field-wrapper>

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

          <button
            type="button"
            class="btn-secondary"
            [disabled]="!canReloadValidation()"
            (click)="reloadUsernameValidation()"
          >
            Recheck both
          </button>
        </div>

        @if (usernameTakenMessage(); as usernameTakenMessage) {
          <div
            class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
            role="status"
          >
            Typing debounce async error via <code>getError()</code>:
            {{ usernameTakenMessage }}
          </div>
        }

        @if (usernameTakenOnBlurMessage(); as usernameTakenOnBlurMessage) {
          <div
            class="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-100"
            role="status"
          >
            Blur debounce async error via <code>getError()</code>:
            {{ usernameTakenOnBlurMessage }}
          </div>
        }

        <!-- State Debugger -->
        <div
          class="mt-8 rounded bg-gray-100 p-4 font-mono text-xs dark:bg-gray-800"
        >
          <div>Typing-debounce pending: {{ regForm.username().pending() }}</div>
          <div>
            Blur-debounce pending: {{ regForm.usernameOnBlur().pending() }}
          </div>
          <div>Typing debounce: <code>validateHttp(..., &#123; debounce: 350 &#125;)</code></div>
          <div>Blur debounce: <code>debounce(field, 'blur')</code></div>
          <div>Typing-debounce errors: {{ regForm.username().errors() | json }}</div>
          <div>
            Blur-debounce errors: {{ regForm.usernameOnBlur().errors() | json }}
          </div>
        </div>
      </form>
    </div>
  `,
})
export class AsyncValidationComponent {
  readonly errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');
  readonly appearance = input<FormFieldAppearance>('outline');
  readonly orientation = input<FormFieldOrientation>('vertical');

  readonly #model = signal({ username: '', usernameOnBlur: '' });
  readonly regForm = form(this.#model, registrationSchema, {
    submission: {
      action: async (field) => {
        // Simulate actual registration delay
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 1000);
        });
        console.log('Registered:', field().value());
      },
      onInvalid: createOnInvalidHandler(),
    },
  });
  protected readonly usernameTakenMessage = computed(
    () => this.regForm.username().getError('usernameTaken')?.message ?? null,
  );
  protected readonly usernameTakenOnBlurMessage = computed(
    () =>
      this.regForm.usernameOnBlur().getError('usernameTakenOnBlur')?.message ??
      null,
  );
  protected readonly canReloadValidation = computed(() => {
    const model = this.#model();
    const username = model.username.trim();
    const usernameOnBlur = model.usernameOnBlur.trim();
    const canReloadTyping =
      username.length >= 3 && !this.regForm.username().pending();
    const canReloadBlur =
      usernameOnBlur.length >= 3 && !this.regForm.usernameOnBlur().pending();

    return canReloadTyping || canReloadBlur;
  });

  protected resetForm(): void {
    this.regForm().reset();
    this.#model.set({ username: '', usernameOnBlur: '' });
  }

  protected reloadUsernameValidation(): void {
    this.regForm.username().reloadValidation();
    this.regForm.usernameOnBlur().reloadValidation();
  }
}
