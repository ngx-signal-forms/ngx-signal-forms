import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import {
  email,
  form,
  FormField,
  maxLength,
  minLength,
  required,
  schema,
  submit,
  validate,
} from '@angular/forms/signals';
import {
  createCharacterCount,
  createErrorState,
  NgxHeadlessToolkit,
} from '@ngx-signal-forms/toolkit/headless';

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
  imports: [FormField, NgxHeadlessToolkit],
  template: `
    <div class="px-6 pt-0 pb-6">
      <h2 class="mb-4 text-2xl font-bold">Headless Fieldset + Utilities</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        Use headless directives for field grouping and field-name resolution,
        plus headless utilities for fully custom UI.
      </p>

      <form novalidate (submit)="save($event)" class="max-w-2xl space-y-6">
        <div class="headless-card">
          <div
            ngxSignalFormHeadlessFieldName
            #emailName="fieldName"
            class="space-y-2"
          >
            <div
              ngxSignalFormHeadlessErrorState
              #emailState="errorState"
              [field]="deliveryForm.contactEmail"
              [fieldName]="emailName.resolvedFieldName()"
              class="space-y-2"
            >
              <label
                [for]="emailName.resolvedFieldName()"
                class="text-sm font-medium"
              >
                Contact email *
              </label>
              <input
                [id]="emailName.resolvedFieldName()"
                type="email"
                class="form-input"
                [formField]="deliveryForm.contactEmail"
                placeholder="you@example.com"
                autocomplete="email"
                [attr.aria-invalid]="emailState.hasErrors() ? 'true' : null"
                [attr.aria-describedby]="
                  emailState.showErrors() && emailState.hasErrors()
                    ? emailState.errorId()
                    : emailState.showWarnings() && emailState.hasWarnings()
                      ? emailState.warningId()
                      : null
                "
              />

              @if (emailState.showErrors() && emailState.hasErrors()) {
                <div
                  [id]="emailState.errorId()"
                  role="alert"
                  class="headless-alert-error text-xs"
                >
                  @for (
                    error of emailState.resolvedErrors();
                    track error.kind
                  ) {
                    <div>{{ error.message }}</div>
                  }
                </div>
              }
            </div>
          </div>
        </div>

        <div class="headless-card">
          <fieldset
            ngxSignalFormHeadlessFieldset
            #addressFieldset="fieldset"
            [fieldsetField]="deliveryForm.address"
            fieldsetId="address"
            class="space-y-4"
            [attr.aria-describedby]="
              addressFieldset.shouldShowErrors() ||
              addressFieldset.shouldShowWarnings()
                ? addressFieldset.resolvedFieldsetId()
                : null
            "
          >
            <legend
              class="text-base font-semibold text-gray-900 dark:text-gray-100"
            >
              Shipping address
            </legend>

            <div
              class="flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400"
            >
              <span>touched: {{ addressFieldset.isTouched() }}</span>
              <span>dirty: {{ addressFieldset.isDirty() }}</span>
              <span>invalid: {{ addressFieldset.isInvalid() }}</span>
              <span>pending: {{ addressFieldset.isPending() }}</span>
            </div>

            @if (addressFieldset.shouldShowErrors()) {
              <div
                [id]="addressFieldset.resolvedFieldsetId()"
                role="alert"
                class="headless-alert-error text-sm"
              >
                @for (
                  error of addressFieldset.aggregatedErrors();
                  track error.kind
                ) {
                  <div>{{ error.message }}</div>
                }
              </div>
            } @else if (addressFieldset.shouldShowWarnings()) {
              <div
                [id]="addressFieldset.resolvedFieldsetId()"
                role="status"
                aria-live="polite"
                class="headless-alert-warning text-sm"
              >
                @for (
                  warning of addressFieldset.aggregatedWarnings();
                  track warning.kind
                ) {
                  <div>{{ warning.message }}</div>
                }
              </div>
            }

            <div class="grid gap-4 sm:grid-cols-2">
              <div
                ngxSignalFormHeadlessFieldName
                #streetName="fieldName"
                class="space-y-2"
              >
                <div
                  ngxSignalFormHeadlessErrorState
                  #streetState="errorState"
                  [field]="deliveryForm.address.street"
                  [fieldName]="streetName.resolvedFieldName()"
                  class="space-y-2"
                >
                  <label
                    [for]="streetName.resolvedFieldName()"
                    class="text-sm font-medium"
                  >
                    Street *
                  </label>
                  <input
                    [id]="streetName.resolvedFieldName()"
                    type="text"
                    class="form-input"
                    [formField]="deliveryForm.address.street"
                    placeholder="123 Main St"
                    [attr.aria-invalid]="
                      streetState.hasErrors() ? 'true' : null
                    "
                    [attr.aria-describedby]="
                      streetState.showErrors() && streetState.hasErrors()
                        ? streetState.errorId()
                        : streetState.showWarnings() &&
                            streetState.hasWarnings()
                          ? streetState.warningId()
                          : null
                    "
                  />

                  @if (streetState.showErrors() && streetState.hasErrors()) {
                    <div
                      [id]="streetState.errorId()"
                      role="alert"
                      class="headless-alert-error text-xs"
                    >
                      @for (
                        error of streetState.resolvedErrors();
                        track error.kind
                      ) {
                        <div>{{ error.message }}</div>
                      }
                    </div>
                  } @else if (
                    streetState.showWarnings() && streetState.hasWarnings()
                  ) {
                    <div
                      [id]="streetState.warningId()"
                      role="status"
                      aria-live="polite"
                      class="headless-alert-warning text-xs"
                    >
                      @for (
                        warning of streetState.resolvedWarnings();
                        track warning.kind
                      ) {
                        <div>{{ warning.message }}</div>
                      }
                    </div>
                  }
                </div>
              </div>

              <div
                ngxSignalFormHeadlessFieldName
                #cityName="fieldName"
                class="space-y-2"
              >
                <div
                  ngxSignalFormHeadlessErrorState
                  #cityState="errorState"
                  [field]="deliveryForm.address.city"
                  [fieldName]="cityName.resolvedFieldName()"
                  class="space-y-2"
                >
                  <label
                    [for]="cityName.resolvedFieldName()"
                    class="text-sm font-medium"
                  >
                    City *
                  </label>
                  <input
                    [id]="cityName.resolvedFieldName()"
                    type="text"
                    class="form-input"
                    [formField]="deliveryForm.address.city"
                    placeholder="Springfield"
                    [attr.aria-invalid]="cityState.hasErrors() ? 'true' : null"
                    [attr.aria-describedby]="
                      cityState.showErrors() && cityState.hasErrors()
                        ? cityState.errorId()
                        : cityState.showWarnings() && cityState.hasWarnings()
                          ? cityState.warningId()
                          : null
                    "
                  />

                  @if (cityState.showErrors() && cityState.hasErrors()) {
                    <div
                      [id]="cityState.errorId()"
                      role="alert"
                      class="headless-alert-error text-xs"
                    >
                      @for (
                        error of cityState.resolvedErrors();
                        track error.kind
                      ) {
                        <div>{{ error.message }}</div>
                      }
                    </div>
                  }
                </div>
              </div>

              <div
                ngxSignalFormHeadlessFieldName
                #postalName="fieldName"
                class="space-y-2"
              >
                <div
                  ngxSignalFormHeadlessErrorState
                  #postalState="errorState"
                  [field]="deliveryForm.address.postalCode"
                  [fieldName]="postalName.resolvedFieldName()"
                  class="space-y-2"
                >
                  <label
                    [for]="postalName.resolvedFieldName()"
                    class="text-sm font-medium"
                  >
                    Postal code *
                  </label>
                  <input
                    [id]="postalName.resolvedFieldName()"
                    type="text"
                    class="form-input"
                    [formField]="deliveryForm.address.postalCode"
                    placeholder="12345"
                    [attr.aria-invalid]="
                      postalState.hasErrors() ? 'true' : null
                    "
                    [attr.aria-describedby]="
                      postalState.showErrors() && postalState.hasErrors()
                        ? postalState.errorId()
                        : postalState.showWarnings() &&
                            postalState.hasWarnings()
                          ? postalState.warningId()
                          : null
                    "
                  />

                  @if (postalState.showErrors() && postalState.hasErrors()) {
                    <div
                      [id]="postalState.errorId()"
                      role="alert"
                      class="headless-alert-error text-xs"
                    >
                      @for (
                        error of postalState.resolvedErrors();
                        track error.kind
                      ) {
                        <div>{{ error.message }}</div>
                      }
                    </div>
                  } @else if (
                    postalState.showWarnings() && postalState.hasWarnings()
                  ) {
                    <div
                      [id]="postalState.warningId()"
                      role="status"
                      aria-live="polite"
                      class="headless-alert-warning text-xs"
                    >
                      @for (
                        warning of postalState.resolvedWarnings();
                        track warning.kind
                      ) {
                        <div>{{ warning.message }}</div>
                      }
                    </div>
                  }
                </div>
              </div>
            </div>
          </fieldset>
        </div>

        <div class="headless-card">
          <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">
            Delivery notes (utilities)
          </h3>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            This section uses createErrorState and createCharacterCount without
            headless directives.
          </p>

          <div class="mt-4 space-y-2">
            <label for="deliveryNotes" class="text-sm font-medium">
              Notes
            </label>
            <textarea
              id="deliveryNotes"
              rows="4"
              class="form-textarea"
              [formField]="deliveryForm.deliveryNotes"
              placeholder="Gate code, delivery window, or special instructions"
              [attr.aria-invalid]="notesError.hasErrors() ? 'true' : null"
              [attr.aria-describedby]="notesDescribedBy()"
            ></textarea>

            <div [id]="notesCounterId" class="headless-counter">
              <span
                [class.text-amber-600]="notesCount.limitState() === 'warning'"
                [class.text-orange-600]="notesCount.limitState() === 'danger'"
                [class.text-red-600]="notesCount.limitState() === 'exceeded'"
              >
                {{ notesCount.currentLength() }} /
                {{ notesCount.resolvedMaxLength() }}
              </span>
              <span>{{ notesCount.remaining() }} remaining</span>
            </div>

            @if (notesError.showErrors() && notesError.hasErrors()) {
              <div
                [id]="notesError.errorId()"
                role="alert"
                class="headless-alert-error text-xs"
              >
                @for (error of notesError.errors(); track error.kind) {
                  <div>{{ error.message }}</div>
                }
              </div>
            } @else if (notesError.showWarnings() && notesError.hasWarnings()) {
              <div
                [id]="notesError.warningId()"
                role="status"
                aria-live="polite"
                class="headless-alert-warning text-xs"
              >
                @for (warning of notesError.warnings(); track warning.kind) {
                  <div>{{ warning.message }}</div>
                }
              </div>
            }
          </div>
        </div>

        <div class="flex gap-4">
          <button type="submit" class="btn-primary">Submit request</button>
          <button type="button" (click)="reset()" class="btn-secondary">
            Reset
          </button>
        </div>
      </form>
    </div>
  `,
})
export class HeadlessFieldsetUtilitiesComponent {
  readonly #initialData: HeadlessDeliveryModel = {
    contactEmail: '',
    address: {
      street: '',
      city: '',
      postalCode: '',
    },
    deliveryNotes: '',
  };

  readonly #model = signal<HeadlessDeliveryModel>(this.#initialData);
  readonly deliveryForm = form(this.#model, deliverySchema);

  protected readonly notesCounterId = 'deliveryNotes-counter';

  protected readonly notesError = createErrorState({
    field: this.deliveryForm.deliveryNotes,
    fieldName: 'deliveryNotes',
  });

  protected readonly notesCount = createCharacterCount({
    field: this.deliveryForm.deliveryNotes,
    maxLength: 200,
  });

  protected readonly notesDescribedBy = computed(() => {
    const ids = [this.notesCounterId];
    if (this.notesError.showErrors() && this.notesError.hasErrors()) {
      ids.push(this.notesError.errorId());
    } else if (
      this.notesError.showWarnings() &&
      this.notesError.hasWarnings()
    ) {
      ids.push(this.notesError.warningId());
    }
    return ids.join(' ');
  });

  protected async save(event: Event): Promise<void> {
    event.preventDefault();
    await submit(this.deliveryForm, async (data) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      console.log('Delivery request submitted:', data());
      return null;
    });
  }

  protected reset(): void {
    this.deliveryForm().reset();
    this.#model.set(this.#initialData);
  }
}
