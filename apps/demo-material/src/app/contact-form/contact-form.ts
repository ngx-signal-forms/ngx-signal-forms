import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  type Type,
} from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  createOnInvalidHandler,
  NGX_FORM_FIELD_ERROR_RENDERER,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import {
  MatCheckboxFeedback,
  MatFormFieldBundle,
  MaterialFeedbackRenderer,
  provideMaterialFeedbackRenderer,
} from '../wrapper';
import {
  INITIAL_CONTACT_MODEL,
  type ContactFormModel,
} from './contact-form.model';
import { contactFormSchema } from './contact-form.validations';

/**
 * Material reference contact form.
 *
 * Demonstrates the four toolkit contracts on top of Angular Material 21+:
 *
 * 1. **Renderer registration** — `provideMaterialFeedbackRenderer()` registers
 *    `MaterialFeedbackRenderer` for both `mat-error` and `mat-hint` slots
 *    via the `NGX_FORM_FIELD_ERROR_RENDERER` token, scoped to this component.
 * 2. **`NgxSignalFormControlSemanticsDirective`** — declared on every control
 *    with `ngxSignalFormControl="<kind>"` and `ngxSignalFormControlAria="manual"`.
 *    Manual ARIA mode hands `aria-invalid` / `aria-describedby` ownership back
 *    to Material's matInput / mat-select / mat-checkbox.
 * 3. **`MatFormFieldWrapper`** — applied as `[ngxMatFormField]` on
 *    `<mat-form-field>`. Drives error visibility from the toolkit's
 *    strategy-aware computed and exposes the four ARIA primitive factories'
 *    output for inspection. The describedby factory uses
 *    `preservedIdsReader` to layer on top of Material's IDs.
 * 4. **One representative form** — text + select + checkbox, with warnings on
 *    the `name` field.
 *
 * The renderer-token outlet (`*ngComponentOutlet`) runs inside this
 * component's template — Material's `<mat-error>` / `<mat-hint>` accept
 * arbitrary projected content, so the toolkit just hands the resolved
 * renderer component to a `<ng-container>` inside those slots.
 */
@Component({
  selector: 'ngx-contact-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgComponentOutlet,
    FormField,
    NgxSignalFormToolkit,
    MatFormFieldBundle,
    MatCheckboxFeedback,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
  ],
  providers: [provideMaterialFeedbackRenderer()],
  template: `
    <form [formRoot]="contactForm" ngxSignalForm class="demo-form">
      <h2>Contact us</h2>

      <mat-form-field
        [ngxMatFormField]="contactForm.name"
        fieldName="contact-name"
        appearance="outline"
        #nameField="ngxMatFormField"
      >
        <mat-label>Name</mat-label>
        <input
          matInput
          id="contact-name"
          type="text"
          [formField]="contactForm.name"
          ngxSignalFormControl="text"
          ngxSignalFormControlAria="manual"
          autocomplete="name"
        />
        @if (!nameField.warningVisible()) {
          <mat-hint>What should we call you?</mat-hint>
        }
        @if (nameField.warningVisible()) {
          <mat-hint class="demo-form__warning-hint">
            <ng-container
              *ngComponentOutlet="
                feedbackComponent;
                inputs: feedbackInputs(contactForm.name, 'warning')
              "
            />
          </mat-hint>
        }
        @if (nameField.errorVisible()) {
          <mat-error>
            <ng-container
              *ngComponentOutlet="
                feedbackComponent;
                inputs: feedbackInputs(contactForm.name, 'error')
              "
            />
          </mat-error>
        }
      </mat-form-field>

      <mat-form-field
        [ngxMatFormField]="contactForm.email"
        fieldName="contact-email"
        appearance="outline"
        #emailField="ngxMatFormField"
      >
        <mat-label>Email</mat-label>
        <input
          matInput
          id="contact-email"
          type="email"
          [formField]="contactForm.email"
          ngxSignalFormControl="text"
          ngxSignalFormControlAria="manual"
          autocomplete="email"
        />
        @if (emailField.errorVisible()) {
          <mat-error>
            <ng-container
              *ngComponentOutlet="
                feedbackComponent;
                inputs: feedbackInputs(contactForm.email, 'error')
              "
            />
          </mat-error>
        }
      </mat-form-field>

      <mat-form-field
        [ngxMatFormField]="contactForm.topic"
        fieldName="contact-topic"
        appearance="outline"
        #topicField="ngxMatFormField"
      >
        <mat-label>Topic</mat-label>
        <mat-select
          id="contact-topic"
          [formField]="contactForm.topic"
          ngxSignalFormControl="select"
          ngxSignalFormControlAria="manual"
        >
          <mat-option value="">— Choose one —</mat-option>
          <mat-option value="support">Product support</mat-option>
          <mat-option value="sales">Sales question</mat-option>
          <mat-option value="feedback">General feedback</mat-option>
        </mat-select>
        <mat-hint>Pick the closest match</mat-hint>
        @if (topicField.errorVisible()) {
          <mat-error>
            <ng-container
              *ngComponentOutlet="
                feedbackComponent;
                inputs: feedbackInputs(contactForm.topic, 'error')
              "
            />
          </mat-error>
        }
      </mat-form-field>

      <div class="demo-form__row">
        <mat-checkbox
          id="contact-agree"
          [formField]="contactForm.agree"
          ngxSignalFormControl="checkbox"
          ngxSignalFormControlAria="manual"
        >
          I agree to be contacted
        </mat-checkbox>
      </div>
      <!-- Material's mat-checkbox does not project into mat-form-field, so
           its errors render via a standalone feedback component. The toolkit
           still owns visibility timing through the same renderer token. -->
      <ngx-mat-checkbox-feedback
        [formField]="contactForm.agree"
        fieldName="contact-agree"
      />

      <div class="demo-form__actions">
        <button mat-stroked-button type="button" (click)="resetForm()">
          Reset
        </button>
        <button mat-flat-button color="primary" type="submit">
          Send message
        </button>
      </div>

      @if (submitted()) {
        <p class="success-banner" role="status">
          Thanks! We received your message.
        </p>
      }
    </form>
  `,
})
export class ContactFormComponent {
  /** Reactive model — Angular Signal Forms drives the form from this signal. */
  protected readonly model = signal<ContactFormModel>(INITIAL_CONTACT_MODEL);

  /** Toolkit-aware Signal Forms instance with the validation schema applied. */
  readonly contactForm = form(this.model, contactFormSchema, {
    submission: {
      action: async () => {
        // Stand-in for a real API call; the demo is intentionally lean.
        await new Promise((resolve) => setTimeout(resolve, 250));
        this.submitted.set(true);
      },
      onInvalid: createOnInvalidHandler(),
    },
  });

  protected readonly submitted = signal(false);

  /**
   * Resolved feedback renderer (default: `MaterialFeedbackRenderer`). Reads
   * from the same DI token consumer projects can override via
   * `provideFormFieldErrorRenderer` — proves the renderer-token seam works
   * end-to-end inside Material's idiom.
   */
  readonly #errorRenderer = inject(NGX_FORM_FIELD_ERROR_RENDERER, {
    optional: true,
  });
  protected readonly feedbackComponent: Type<unknown> =
    this.#errorRenderer?.component ?? MaterialFeedbackRenderer;

  /**
   * Inputs map for the renderer-token outlet. Mirrors the contract bound by
   * `NgxFormFieldWrapper` (`{ formField, strategy, submittedStatus }`) and
   * adds the `slot` discriminator the Material renderer uses to distinguish
   * its error vs warning branch.
   */
  protected readonly feedbackInputs = (
    formField: unknown,
    slot: 'error' | 'warning',
  ): Record<string, unknown> => ({
    formField,
    strategy: null,
    submittedStatus: 'unsubmitted',
    slot,
  });

  protected resetForm(): void {
    this.model.set({ ...INITIAL_CONTACT_MODEL });
    this.contactForm().reset();
    this.submitted.set(false);
  }
}
