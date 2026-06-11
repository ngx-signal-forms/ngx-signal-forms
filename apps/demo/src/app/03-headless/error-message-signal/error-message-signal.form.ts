import { Component, computed, signal } from '@angular/core';
import {
  form,
  FormField,
  FormRoot,
  minLength,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import { createOnInvalidHandler } from '@ngx-signal-forms/toolkit';
import {
  createErrorMessageSignal,
  type ResolvedFieldError,
} from '@ngx-signal-forms/toolkit/headless';

interface PasswordModel {
  password: string;
}

const passwordSchema = schema<PasswordModel>((path) => {
  required(path.password);
  minLength(path.password, 8);

  validate(path.password, (ctx) => {
    const value = ctx.value();
    if (value && value.length > 0 && value.length < 12) {
      return {
        kind: 'warn:weak-password',
        message: 'Consider using 12+ characters for a stronger password',
      };
    }
    return null;
  });

  validate(path.password, (ctx) => {
    const value = ctx.value();
    if (value && value.length > 0 && !/[^a-zA-Z0-9]/u.test(value)) {
      return {
        kind: 'warn:no-special-chars',
        message: 'Adding symbols (!, @, #…) improves password strength',
      };
    }
    return null;
  });
});

const REGISTRY_VERBOSE = {
  required: 'Password is required — please enter a value',
  minLength: (error: { minLength?: number }) =>
    `Password must be at least ${String(error.minLength)} characters long`,
  'warn:weak-password': 'Weak password — consider using 12 or more characters',
  'warn:no-special-chars':
    'No special characters detected — adding symbols (!, @, #) improves security',
} as const;

const REGISTRY_TERSE = {
  required: 'Required',
  minLength: (error: { minLength?: number }) =>
    `Min ${String(error.minLength)} chars`,
  'warn:weak-password': 'Weak password',
  'warn:no-special-chars': 'Add symbols for strength',
} as const;

function ariaDescribedBy(errors: readonly ResolvedFieldError[]): string | null {
  const ids = errors.map((e) => e.id);
  return ids.length > 0 ? ids.join(' ') : null;
}

@Component({
  selector: 'ngx-error-message-signal',

  imports: [FormField, FormRoot],
  templateUrl: './error-message-signal.form.html',
  styleUrl: './error-message-signal.form.scss',
})
export class ErrorMessageSignalComponent {
  readonly #initialData: PasswordModel = { password: '' };
  readonly #model = signal(this.#initialData);

  readonly passwordForm = form(this.#model, passwordSchema, {
    submission: {
      action: async (data) => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 400);
        });
        console.log('Submitted:', data());
      },
      onInvalid: createOnInvalidHandler(),
    },
  });

  protected readonly verboseRegistry = signal(true);
  protected readonly activeRegistry = signal<
    typeof REGISTRY_VERBOSE | typeof REGISTRY_TERSE
  >(REGISTRY_VERBOSE);

  // 1. Blocking errors only (default)
  protected readonly blockingErrors = createErrorMessageSignal(
    () => this.passwordForm.password(),
    { fieldName: 'password', errorMessages: this.activeRegistry },
  );

  // 2. Blocking + warnings
  protected readonly allErrors = createErrorMessageSignal(
    () => this.passwordForm.password(),
    {
      fieldName: 'password-all',
      includeWarnings: true,
      errorMessages: this.activeRegistry,
    },
  );

  // 3. Warnings only
  protected readonly warningsOnly = createErrorMessageSignal(
    () => this.passwordForm.password(),
    {
      fieldName: 'password-warnings',
      includeWarnings: 'only',
      errorMessages: this.activeRegistry,
    },
  );

  // aria-describedby for the password input — derived from blocking error IDs
  protected readonly ariaDescribedByBlocking = computed(() =>
    ariaDescribedBy(this.blockingErrors()),
  );

  protected toggleRegistry(): void {
    const next = this.verboseRegistry() ? REGISTRY_TERSE : REGISTRY_VERBOSE;
    this.activeRegistry.set(next);
    this.verboseRegistry.update((v) => !v);
  }

  protected reset(): void {
    this.passwordForm().reset();
    this.#model.set(this.#initialData);
  }
}
