import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import {
  form,
  FormField,
  max,
  min,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import {
  type ErrorDisplayStrategy,
  type FormFieldAppearance,
  type FormFieldOrientation,
  createOnInvalidHandler,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

interface Booking {
  checkIn: string;
  checkOut: string;
  guests: number;
  promoCode: string;
}

const bookingSchema = schema<Booking>((path) => {
  required(path.checkIn, { message: 'Check-in date required' });
  required(path.checkOut, { message: 'Check-out date required' });
  required(path.guests, { message: 'Guest count required' });
  min(path.guests, 1, { message: 'At least 1 guest required' });
  max(path.guests, 10, { message: 'Max 10 guests allowed' });

  // Cross-field validation: Check-out must be after Check-in
  validate(path.checkOut, (ctx) => {
    const checkOut = ctx.value();
    const checkIn = ctx.valueOf(path.checkIn);

    if (checkIn && checkOut && new Date(checkOut) <= new Date(checkIn)) {
      return {
        kind: 'dateRange',
        message: 'Check-out must be after check-in',
      };
    }
    return null;
  });

  // Cross-field: Promo code valid only for less than 5 guests
  validate(path.promoCode, (ctx) => {
    const code = ctx.value();
    const guests = ctx.valueOf(path.guests);

    if (code === 'SMALLGROUP' && guests > 4) {
      return {
        kind: 'invalidPromo',
        message: 'Promo valid only for small groups (max 4)',
      };
    }
    return null;
  });
});

@Component({
  selector: 'ngx-cross-field-validation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <div class="px-6 pt-0 pb-6">
      <h2 class="mb-4 text-2xl font-bold">Cross-Field Validation</h2>
      <p class="mb-6 text-gray-600 dark:text-gray-400">
        Demonstrates validation rules that depend on multiple fields.
      </p>

      <form
        [formRoot]="bookingForm"
        ngxSignalForm
        [errorStrategy]="errorDisplayMode()"
        class="max-w-md space-y-6"
      >
        <div class="grid grid-cols-2 gap-4">
          <ngx-form-field-wrapper
            [formField]="bookingForm.checkIn"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="checkIn">Check-In</label>
            <input id="checkIn" type="date" [formField]="bookingForm.checkIn" />
          </ngx-form-field-wrapper>

          <ngx-form-field-wrapper
            [formField]="bookingForm.checkOut"
            [appearance]="appearance()"
            [orientation]="orientation()"
          >
            <label for="checkOut">Check-Out</label>
            <input
              id="checkOut"
              type="date"
              [formField]="bookingForm.checkOut"
            />
          </ngx-form-field-wrapper>
        </div>

        <ngx-form-field-wrapper
          [formField]="bookingForm.guests"
          [appearance]="appearance()"
          [orientation]="orientation()"
        >
          <label for="guests">Guests</label>
          <input id="guests" type="number" [formField]="bookingForm.guests" />
        </ngx-form-field-wrapper>

        <ngx-form-field-wrapper
          [formField]="bookingForm.promoCode"
          [appearance]="appearance()"
          [orientation]="orientation()"
        >
          <label for="promo">Promo Code</label>
          <input
            id="promo"
            type="text"
            [formField]="bookingForm.promoCode"
            placeholder="Try 'SMALLGROUP'"
            class="uppercase"
          />
          <ngx-form-field-hint> Valid only for ≤ 4 guests </ngx-form-field-hint>
        </ngx-form-field-wrapper>

        <div class="flex gap-4">
          <button
            type="submit"
            class="btn-primary"
            [disabled]="bookingForm().submitting()"
          >
            @if (bookingForm().submitting()) {
              Booking...
            } @else {
              Book Stay
            }
          </button>

          <button type="button" (click)="resetForm()" class="btn-secondary">
            Reset
          </button>
        </div>
      </form>
    </div>
  `,
})
export class CrossFieldValidationComponent {
  readonly errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');
  readonly appearance = input<FormFieldAppearance>('outline');
  readonly orientation = input<FormFieldOrientation>('vertical');

  readonly #model = signal({
    checkIn: '',
    checkOut: '',
    guests: 1,
    promoCode: '',
  });

  readonly bookingForm = form(this.#model, bookingSchema, {
    submission: {
      action: async (data) => {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 1000);
        });
        console.log('Booking Confirmed:', data());
      },
      onInvalid: createOnInvalidHandler(),
    },
  });

  protected resetForm(): void {
    this.bookingForm().reset();
    this.#model.set({
      checkIn: '',
      checkOut: '',
      guests: 1,
      promoCode: '',
    });
  }
}
