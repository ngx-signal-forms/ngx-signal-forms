import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import {
  createOnInvalidHandler,
  createSubmittedStatusTracker,
  NgxSignalFormToolkit,
  type ErrorDisplayStrategy,
  type FormFieldAppearance,
  type FormFieldOrientation,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { initialLabellessFieldsModel } from './labelless-fields.model';
import { labellessFieldsSchema } from './labelless-fields.validations';

/**
 * Labelless Fields Demo Form.
 *
 * Renders five sections, each demonstrating a legitimate UI pattern where
 * a per-wrapper <label> would feel redundant:
 * 1. Search input with an icon prefix (accessible name via aria-label).
 * 2. Grouped fields under a shared heading (phone number split).
 * 3. Amount input labelled by its card heading.
 * 4. Side-by-side "with vs without label" comparison across appearances.
 * 5. Narrow inputs whose error messages must wrap beyond the input width.
 */
@Component({
  selector: 'ngx-labelless-fields',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  templateUrl: './labelless-fields.html',
  styles: `
    :host {
      display: block;
    }

    .labelless-section {
      border: 1px solid rgb(0 0 0 / 0.08);
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .labelless-section h3 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.75rem;
    }

    .phone-row {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 0.5rem;
      align-items: start;
    }

    /* Flat 2x2 grid: captions in row 1, wrappers in row 2, so both
       inputs land on the same row baseline even though the left wrapper
       reserves label space and the right one collapses it. */
    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: 1rem;
      row-gap: 0.25rem;
      align-items: end;
    }

    .comparison-grid > p {
      font-size: 0.75rem;
      color: rgb(0 0 0 / 0.6);
      margin: 0;
    }

    .narrow-age input[id='age'] {
      max-width: 5ch;
    }

    .narrow-zip input[id='zipCode'] {
      max-width: 9ch;
    }
  `,
})
export class LabellessFieldsFormComponent {
  readonly #submitAttempted = signal(false);

  readonly #handleInvalidSubmission = createOnInvalidHandler();

  readonly errorDisplayMode = input<ErrorDisplayStrategy>('on-touch');
  readonly appearance = input<FormFieldAppearance>('standard');
  readonly orientation = input<FormFieldOrientation>('vertical');

  readonly #model = signal(initialLabellessFieldsModel);

  readonly labellessForm = form(this.#model, labellessFieldsSchema, {
    submission: {
      action: async () => null,
      onInvalid: (formTree) => {
        this.#submitAttempted.set(true);
        this.#handleInvalidSubmission(formTree);
      },
    },
  });

  protected readonly submittedStatus = createSubmittedStatusTracker(
    this.labellessForm,
    this.#submitAttempted,
  );
}
