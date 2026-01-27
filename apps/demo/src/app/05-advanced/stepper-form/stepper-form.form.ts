import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  email,
  form,
  FormField,
  required,
  schema,
  submit,
} from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxOutlinedFormField } from '@ngx-signal-forms/toolkit/form-field';

interface WizardData {
  // Step 1
  email: string;
  password: string;
  // Step 2
  fullName: string;
  phone: string;
  // Step 3
  termsAccepted: boolean;
}

const wizardSchema = schema<WizardData>((path) => {
  // Step 1
  required(path.email, { message: 'Email required' });
  email(path.email, { message: 'Invalid email' });
  required(path.password, { message: 'Password required' });

  // Step 2
  required(path.fullName, { message: 'Full name required' });
  required(path.phone, { message: 'Phone required' });

  // Step 3
  // Checkbox often needs custom handling or simple true check
  // For now we assume the UI handles true/false
});

@Component({
  selector: 'ngx-stepper-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxOutlinedFormField],
  template: `
    <div class="p-6">
      <h2 class="mb-6 text-2xl font-bold">Multi-Step Registration</h2>

      <!-- Stepper Header -->
      <div class="mb-8 flex max-w-lg items-center justify-between">
        @for (step of [1, 2, 3]; track step) {
          <div class="relative z-10 flex flex-col items-center">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors"
              [class]="
                currentStep() >= step
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              "
            >
              {{ step }}
            </div>
            <span class="mt-1 text-xs text-gray-500">
              @if (step === 1) {
                Account
              }
              @if (step === 2) {
                Profile
              }
              @if (step === 3) {
                Review
              }
            </span>
          </div>
          @if (step < 3) {
            <div class="mx-2 h-0.5 flex-1 translate-y-[-10px] bg-gray-200">
              <div
                class="h-full bg-blue-600 transition-all duration-300"
                [style.width]="currentStep() > step ? '100%' : '0%'"
              ></div>
            </div>
          }
        }
      </div>

      <form
        (submit)="finishWizard($event)"
        class="max-w-lg space-y-6 rounded-lg border bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <!-- Step 1: Account -->
        @if (currentStep() === 1) {
          <div
            class="animate-in fade-in slide-in-from-right-4 space-y-4 duration-300"
          >
            <h3 class="text-lg font-semibold">Account Details</h3>

            <ngx-signal-form-field [formField]="wizardForm.email" outline>
              <label for="email">Email Address</label>
              <input
                id="email"
                type="email"
                [formField]="wizardForm.email"
                class="form-input"
              />
            </ngx-signal-form-field>

            <ngx-signal-form-field [formField]="wizardForm.password" outline>
              <label for="password">Password</label>
              <input
                id="password"
                type="password"
                [formField]="wizardForm.password"
                class="form-input"
              />
            </ngx-signal-form-field>
          </div>
        }

        <!-- Step 2: Profile -->
        @if (currentStep() === 2) {
          <div
            class="animate-in fade-in slide-in-from-right-4 space-y-4 duration-300"
          >
            <h3 class="text-lg font-semibold">Personal Profile</h3>

            <ngx-signal-form-field [formField]="wizardForm.fullName" outline>
              <label for="fullName">Full Name</label>
              <input
                id="fullName"
                [formField]="wizardForm.fullName"
                class="form-input"
              />
            </ngx-signal-form-field>

            <ngx-signal-form-field [formField]="wizardForm.phone" outline>
              <label for="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                [formField]="wizardForm.phone"
                class="form-input"
              />
            </ngx-signal-form-field>
          </div>
        }

        <!-- Step 3: Review -->
        @if (currentStep() === 3) {
          <div
            class="animate-in fade-in slide-in-from-right-4 space-y-4 duration-300"
          >
            <h3 class="text-lg font-semibold">Review & Terms</h3>

            <div
              class="space-y-2 rounded border bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <p><span class="font-medium">Email:</span> {{ model().email }}</p>
              <p>
                <span class="font-medium">Name:</span> {{ model().fullName }}
              </p>
            </div>

            <label class="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                [formField]="wizardForm.termsAccepted"
                class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span class="text-sm">I accept the terms and conditions</span>
            </label>
          </div>
        }

        <!-- Navigation -->
        <div class="flex justify-between border-t pt-4">
          <button
            type="button"
            (click)="prevStep()"
            [disabled]="currentStep() === 1"
            class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>

          @if (currentStep() < 3) {
            <button type="button" (click)="nextStep()" class="btn-primary">
              Next Step
            </button>
          } @else {
            <button
              type="submit"
              class="btn-primary bg-green-600 hover:bg-green-700"
              [disabled]="wizardForm().pending() || !model().termsAccepted"
            >
              @if (wizardForm().pending()) {
                Submitting...
              } @else {
                Complete Registration
              }
            </button>
          }
        </div>
      </form>
    </div>
  `,
})
export class StepperFormComponent {
  readonly currentStep = signal(1);

  readonly #model = signal<WizardData>({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    termsAccepted: false,
  });

  readonly model = this.#model.asReadonly();
  readonly wizardForm = form(this.#model, wizardSchema);

  nextStep(): void {
    const step = this.currentStep();
    if (step === 1) {
      this.wizardForm.email().markAsTouched();
      this.wizardForm.password().markAsTouched();
      if (
        this.wizardForm.email().invalid() ||
        this.wizardForm.password().invalid()
      )
        return;
    }
    if (step === 2) {
      this.wizardForm.fullName().markAsTouched();
      this.wizardForm.phone().markAsTouched();
      if (
        this.wizardForm.fullName().invalid() ||
        this.wizardForm.phone().invalid()
      )
        return;
    }

    if (step < 3) {
      this.currentStep.update((s) => s + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update((s) => s - 1);
    }
  }

  protected async finishWizard(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.wizardForm, async (data) => {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log('Wizard Completed:', data());
      alert('Registration Successful!');
      return null;
    });
  }
}
