import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import {
  email,
  FormField,
  form,
  required,
  schema,
} from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  type FieldMarkingMode,
  type FormFieldAppearance,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { NgxFormMarkingLegend } from '@ngx-signal-forms/toolkit/assistive';
import {
  type FieldMarkingModel,
  initialFieldMarkingModel,
} from './field-marking.model';

/**
 * Field-marking demo form.
 *
 * Renders the same profile form under whichever marking mode / markers / legend
 * text the page supplies. `phone` is conditionally required so the legend's
 * auto-hide can be observed live.
 */
@Component({
  selector: 'ngx-field-marking-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormField,
    NgxFormMarkingLegend,
  ],
  templateUrl: './field-marking.html',
  styles: `
    :host {
      display: block;
    }

    .field-marking-stack {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .field-marking-legend-slot {
      padding: 0.5rem 0.75rem;
      border-radius: 0.5rem;
      background: rgb(37 99 235 / 0.06);
      border: 1px dashed rgb(37 99 235 / 0.35);
    }

    .field-marking-legend-slot:empty {
      display: none;
    }
  `,
})
export class FieldMarkingFormComponent {
  /** Marking mode forwarded to both the wrappers and the legend. */
  readonly markingMode = input<FieldMarkingMode>('required');
  /** Required-marker text forwarded to wrappers + legend. */
  readonly requiredMarkerText = input<string>(' *');
  /** Optional-marker text forwarded to wrappers + legend. */
  readonly optionalMarkerText = input<string>(' (optional)');
  /** Legend text override; empty means "use the mode default". */
  readonly legendText = input<string>('');
  /** Wrapper appearance, to prove markers render in every appearance. */
  readonly appearance = input<FormFieldAppearance>('standard');
  /** Whether the `phone` field is currently required. */
  readonly phoneRequired = input<boolean>(false);

  readonly #model = signal<FieldMarkingModel>(initialFieldMarkingModel);

  readonly markingForm = form(
    this.#model,
    schema<FieldMarkingModel>((path) => {
      required(path.fullName, { message: 'Your name is required' });
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Enter a valid email address' });
      required(path.phone, {
        when: () => this.phoneRequired(),
        message: 'Phone is required',
      });
    }),
  );

  /** `[text]` expects `undefined` (not `''`) to fall back to the mode default. */
  protected readonly legendTextOrUndefined = () =>
    this.legendText().length > 0 ? this.legendText() : undefined;
}
