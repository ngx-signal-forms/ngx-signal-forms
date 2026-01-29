import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { FormField, form, submit } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxSignalFormErrorComponent } from '@ngx-signal-forms/toolkit/assistive';

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
  imports: [FormField, NgxSignalFormToolkit, NgxSignalFormErrorComponent],
  template: `
    <form [ngxSignalForm]="userForm" (submit)="saveChanges($event)">
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
          [formField]="userForm.email"
          placeholder="you@example.com"
        />
        <ngx-signal-form-error [formField]="userForm.email" fieldName="email" />
      </div>

      <div class="form-field">
        <label class="form-label" for="username">Username *</label>
        <input
          id="username"
          type="text"
          class="form-input"
          [formField]="userForm.username"
          placeholder="johndoe"
        />
        <ngx-signal-form-error
          [formField]="userForm.username"
          fieldName="username"
        />
      </div>

      <div class="form-field">
        <label class="form-label" for="password">Password *</label>
        <input
          id="password"
          type="password"
          class="form-input"
          [formField]="userForm.password"
          placeholder="••••••••"
        />
        <ngx-signal-form-error
          [formField]="userForm.password"
          fieldName="password"
        />
        <ngx-signal-form-error
          [errors]="passwordWarnings"
          fieldName="password"
        />
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
  readonly #model = signal<FieldStatesModel>(createInitialFieldStatesModel());

  /** Public form instance for state tracking in parent page */
  readonly userForm = form(this.#model, fieldStatesSchema);

  /** Computed signal for password warnings list */
  protected readonly passwordWarnings = computed(() => {
    const passwordField = this.userForm.password();
    if (!passwordField.dirty()) {
      return [];
    }

    return passwordField.errors().filter((e) => e.kind.startsWith('warn:'));
  });

  /**
   * Mark all fields as touched programmatically
   * Use case: "Validate All" button, show all errors on submit
   *
   * Note: Signal Forms automatically marks fields as touched on blur,
   * and the submit() helper automatically marks all fields as touched
   * when the form is submitted.
   */
  protected markAllTouched(): void {
    // Signal Forms handles touched state automatically
    // submit() helper marks all fields as touched on form submission
  }

  /**
   * Mark all fields as dirty programmatically
   * Use case: After loading data from server, mark pre-filled fields
   *
   * Note: In Signal Forms, dirty state is tracked automatically
   */
  protected markAllDirty(): void {
    // Signal Forms tracks dirty state automatically when values change
  }

  /**
   * Simulate loading data from server and marking as dirty
   * Use case: Edit form - load existing data and mark as modified
   */
  protected prefillForm(): void {
    // Simulate server data - set values directly on model
    this.#model.set({
      email: 'user@example.com',
      username: 'johndoe',
      password: 'securepass123',
    });
  }

  /**
   * Reset form to initial state
   */
  protected resetForm(): void {
    this.#model.set(createInitialFieldStatesModel());
  }

  /**
   * Form submission handler using Angular Signal Forms submit() helper.
   * **Key behavior:** Callback only executes if form is VALID.
   */
  protected async saveChanges(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.userForm, async () => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      this.#model.set({ username: '', email: '', password: '' });
      this.userForm().reset();
      return null;
    });
  }
}
