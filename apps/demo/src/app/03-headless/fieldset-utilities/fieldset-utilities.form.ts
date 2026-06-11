import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import {
  email,
  form,
  FormField,
  FormRoot,
  maxLength,
  minLength,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import {
  createOnInvalidHandler,
  type ErrorDisplayStrategy,
  NgxSignalForm,
} from '@ngx-signal-forms/toolkit';
import {
  createCharacterCount,
  createErrorState,
  createFieldStateFlags,
  NgxHeadlessToolkit,
} from '@ngx-signal-forms/toolkit/headless';
import { NgxFormFieldCharacterCount } from '@ngx-signal-forms/toolkit/assistive';

interface HeadlessDeliveryModel {
  contactEmail: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
  };
  deliveryNotes: string;
}

const deliverySchema = schema<HeadlessDeliveryModel>((path) => {
  required(path.contactEmail, { message: 'Email is required' });
  email(path.contactEmail, { message: 'Enter a valid email address' });

  required(path.address.street, { message: 'Street is required' });
  minLength(path.address.street, 3, {
    message: 'Street must be at least 3 characters',
  });

  required(path.address.city, { message: 'City is required' });
  minLength(path.address.city, 2, {
    message: 'City must be at least 2 characters',
  });

  required(path.address.postalCode, { message: 'Postal code is required' });
  minLength(path.address.postalCode, 5, {
    message: 'Postal code should be at least 5 characters',
  });

  validate(path.address.postalCode, (ctx) => {
    const value = ctx.value();
    if (value && !/^\d{5}(-\d{4})?$/.test(value)) {
      return {
        kind: 'warn:postal-format',
        message: 'Consider the 5-digit ZIP format (optional 4-digit suffix)',
      };
    }
    return null;
  });

  maxLength(path.deliveryNotes, 200, {
    message: 'Notes must be 200 characters or less',
  });

  validate(path.deliveryNotes, (ctx) => {
    const value = ctx.value();
    if (value && value.length > 0 && value.length < 20) {
      return {
        kind: 'warn:short-notes',
        message: 'Consider adding more detail (20+ characters)',
      };
    }
    return null;
  });
});

@Component({
  selector: 'ngx-headless-fieldset-utilities',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    FormRoot,
    NgxSignalForm,
    NgxHeadlessToolkit,
    NgxFormFieldCharacterCount,
  ],
  templateUrl: './fieldset-utilities.form.html',
  styleUrl: './fieldset-utilities.form.scss',
})
export class HeadlessFieldsetUtilitiesComponent {
  /**
   * Error display strategy for the form. Installed into form context via
   * `ngxSignalForm`, so every headless directive (error state, fieldset,
   * summary) inherits it. The `createErrorState` utility below sits in the
   * component injector — above the `<form>` context — so it receives the same
   * signal explicitly to stay in sync.
   */
  readonly errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');

  readonly #initialData: HeadlessDeliveryModel = {
    contactEmail: '',
    address: {
      street: '',
      city: '',
      postalCode: '',
    },
    deliveryNotes: '',
  };

  readonly #model = signal(this.#initialData);
  readonly deliveryForm = form(this.#model, deliverySchema, {
    submission: {
      action: async (data) => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 600);
        });
        console.log('Delivery request submitted:', data());
      },
      onInvalid: createOnInvalidHandler(),
    },
  });

  protected readonly notesCounterId = 'deliveryNotes-counter';

  protected readonly notesError = createErrorState({
    field: this.deliveryForm.deliveryNotes,
    fieldName: 'deliveryNotes',
    strategy: this.errorDisplayMode,
  });

  protected readonly notesCount = createCharacterCount({
    field: this.deliveryForm.deliveryNotes,
    maxLength: 200,
  });

  protected readonly notesFlags = createFieldStateFlags(
    this.deliveryForm.deliveryNotes,
  );

  protected readonly notesDescribedBy = computed(() => {
    const ids = [this.notesCounterId];
    if (this.notesError.showErrors() && this.notesError.hasErrors()) {
      const id = this.notesError.errorId();
      if (id !== null) ids.push(id);
    } else if (
      this.notesError.showWarnings() &&
      this.notesError.hasWarnings()
    ) {
      const id = this.notesError.warningId();
      if (id !== null) ids.push(id);
    }
    return ids.join(' ');
  });

  protected reset(): void {
    this.deliveryForm().reset();
    this.#model.set(this.#initialData);
  }
}
