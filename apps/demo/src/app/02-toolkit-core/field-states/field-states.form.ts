import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { Field, form, submit } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit/core';

import {
  createInitialFieldStatesModel,
  type FieldStatesModel,
} from './field-states.model';
import { fieldStatesSchema } from './field-states.validations';

/**
 * Field State Management Demo Form
 * Demonstrates dirty, touched, invalid, valid states and programmatic control
 */
@Component({
  selector: 'ngx-field-states-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Field, NgxSignalFormToolkit],
  template: `
    <form
      [ngxSignalFormProvider]="userForm"
      (ngSubmit)="(save)"
      class="form-container"
      novalidate
    >
      @if (userForm().dirty()) {
        <div
          class="mb-4 rounded-lg border-l-4 border-amber-500 bg-amber-50 px-4 py-3 dark:border-amber-400 dark:bg-amber-900/20"
          role="status"
          aria-live="polite"
        >
          <div class="flex items-center gap-2">
            <span class="text-amber-600 dark:text-amber-400">⚠️</span>
            <span
              class="text-sm font-medium text-amber-800 dark:text-amber-300"
            >
              Unsaved changes
            </span>
          </div>
        </div>
      }

      <div class="form-field">
        <label class="form-label" for="email">Email Address *</label>
        <input
          id="email"
          type="email"
          class="form-input"
          [field]="userForm.email"
          placeholder="you@example.com"
          aria-required="true"
        />
        <ngx-signal-form-error [field]="userForm.email" fieldName="email" />
      </div>

      <div class="form-field">
        <label class="form-label" for="username">Username *</label>
        <input
          id="username"
          type="text"
          class="form-input"
          [field]="userForm.username"
          placeholder="johndoe"
          aria-required="true"
        />
        <ngx-signal-form-error
          [field]="userForm.username"
          fieldName="username"
        />
      </div>

      <div class="form-field">
        <label class="form-label" for="password">Password *</label>
        <input
          id="password"
          type="password"
          class="form-input"
          [field]="userForm.password"
          placeholder="••••••••"
          aria-required="true"
        />
        <ngx-signal-form-error
          [field]="userForm.password"
          fieldName="password"
        />

        <!-- Reserved space wrapper prevents layout shift when warnings appear/disappear -->
        <div class="min-h-[0px] transition-all duration-200">
          @if (showPasswordWarnings()) {
            <div
              class="mt-2 space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950"
            >
              <p
                class="text-xs font-semibold text-amber-800 dark:text-amber-200"
              >
                💡 Password Strength Suggestions:
              </p>
              @for (warning of passwordWarnings(); track warning) {
                <p
                  class="text-sm text-amber-700 dark:text-amber-300"
                  role="status"
                >
                  • {{ warning.message }}
                </p>
              }
              <p class="mt-2 text-xs text-amber-600 dark:text-amber-400">
                These are suggestions, not requirements
              </p>
            </div>
          }
        </div>
      </div>

      <div class="form-field">
        <p class="form-label">Programmatic State Control</p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            (click)="markAllTouched()"
            class="btn-secondary text-sm"
          >
            Mark All Touched
          </button>
          <button
            type="button"
            (click)="markAllDirty()"
            class="btn-secondary text-sm"
          >
            Mark All Dirty
          </button>
          <button
            type="button"
            (click)="prefillForm()"
            class="btn-secondary text-sm"
          >
            Prefill Form
          </button>
          <button
            type="button"
            (click)="resetForm()"
            class="btn-secondary text-sm"
          >
            Reset
          </button>
        </div>
        <p class="mt-2 text-xs text-gray-600 dark:text-gray-400">
          Try these buttons to see programmatic state control in action
        </p>
      </div>

      <div class="form-actions">
        <button
          type="submit"
          class="btn-primary"
          [disabled]="!userForm().valid() || userForm().pending()"
        >
          @if (userForm().pending()) {
            <span class="status-message">Submitting...</span>
          } @else {
            Submit
          }
        </button>

        @if (userForm().pending()) {
          <span class="text-sm text-gray-600 dark:text-gray-400">
            Validating...
          </span>
        }
      </div>
    </form>
  `,
})
export class FieldStatesForm {
  private readonly model = signal<FieldStatesModel>(
    createInitialFieldStatesModel(),
  );

  /** Public form instance for state tracking in parent page */
  readonly userForm = form(this.model, fieldStatesSchema);

  /** Computed signal for password warnings display */
  protected readonly showPasswordWarnings = computed(() => {
    const passwordField = this.userForm.password();
    return (
      passwordField.dirty() &&
      passwordField.errors().some((e) => e.kind.startsWith('warn:'))
    );
  });

  /** Computed signal for password warnings list */
  protected readonly passwordWarnings = computed(() => {
    return this.userForm
      .password()
      .errors()
      .filter((e) => e.kind.startsWith('warn:'));
  });

  /**
   * Mark all fields as touched programmatically
   * Use case: "Validate All" button, show all errors on submit
   *
   * Note: Signal Forms automatically marks fields as touched on blur,
   * so this is mainly for demonstration purposes
   */
  protected markAllTouched(): void {
    // Signal Forms handles touched state automatically via [field] directive
    // This method is kept for demonstration purposes
    console.log(
      'Fields are marked as touched automatically on blur in Signal Forms',
    );
  }

  /**
   * Mark all fields as dirty programmatically
   * Use case: After loading data from server, mark pre-filled fields
   *
   * Note: In Signal Forms, dirty state is tracked automatically
   */
  protected markAllDirty(): void {
    // Signal Forms tracks dirty state automatically when values change
    // This method is kept for demonstration purposes
    console.log('Dirty state is tracked automatically in Signal Forms');
  }

  /**
   * Simulate loading data from server and marking as dirty
   * Use case: Edit form - load existing data and mark as modified
   */
  protected prefillForm(): void {
    // Simulate server data - set values directly on model
    this.model.set({
      email: 'user@example.com',
      username: 'johndoe',
      password: 'securepass123',
    });
  }

  /**
   * Reset form to initial state
   */
  protected resetForm(): void {
    this.model.set(createInitialFieldStatesModel());
  }

  /**
   * Handle form submission using submit() helper
   */
  protected readonly save = submit(this.userForm, async (formData) => {
    console.log('✅ Form submitted successfully!', formData().value());
    alert('Form submitted! Check console for data.');
    return null;
  });
}
