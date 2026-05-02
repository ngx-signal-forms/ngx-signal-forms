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
import { NgComponentOutlet } from '@angular/common';
import {
  createOnInvalidHandler,
  NGX_FORM_FIELD_ERROR_RENDERER,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import {
  MaterialFeedbackRenderer,
  NgxMatFormBundle,
  type NgxMatFeedbackSeverity,
} from '../wrapper';
import {
  INITIAL_CONTACT_MODEL,
  type ContactFormModel,
} from './contact-form.model';
import { contactFormSchema } from './contact-form.validations';

/**
 * Material reference contact form.
 *
 * Demonstrates the four toolkit contracts on top of Angular Material 21+
 * with the lean ergonomic surface from ADR-0002:
 *
 * 1. **Renderer registration** — `provideNgxMatForms()` (in `main.ts`)
 *    registers `MaterialFeedbackRenderer` for both `<mat-error>` and
 *    `<mat-hint>` slots app-wide. The slot directives below resolve the
 *    field → message string and stamp the renderer with `{ message,
 *    severity }`; consumers swap presentation in one DI call.
 * 2. **Per-control directives** — `ngxMatTextControl` /
 *    `ngxMatSelectControl` / `ngxMatCheckboxControl` apply
 *    `ariaMode="manual"` automatically (Material owns `aria-describedby`
 *    on the projected control), no string parameter required.
 * 3. **Wrapper directive** — `[ngxMatFormField]` runs `contentChildren`
 *    over `NgxMatBoundControl` to discover the bound control. No
 *    `*ngComponentOutlet` boilerplate; `*ngxMatErrorSlot` and
 *    `*ngxMatHintSlot` own conditional rendering.
 * 4. **`*ngxMatFeedback`** — the control-agnostic feedback slot for
 *    Material controls that don't fit `<mat-form-field>` (here, the
 *    consent checkbox).
 */
@Component({
  selector: 'ngx-contact-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgComponentOutlet,
    FormField,
    NgxSignalFormToolkit,
    NgxMatFormBundle,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
  ],
  template: `
    <form [formRoot]="contactForm" ngxSignalForm class="demo-form">
      <h2>Contact us</h2>

      <mat-form-field
        [ngxMatFormField]="contactForm.name"
        fieldName="contact-name"
        appearance="outline"
      >
        <mat-label>Name</mat-label>
        <input
          matInput
          id="contact-name"
          type="text"
          [formField]="contactForm.name"
          ngxMatTextControl
          autocomplete="name"
        />
        <mat-hint *ngxMatHintSlot="contactForm.name; let warning">
          @if (warning) {
            <ng-container
              *ngComponentOutlet="
                feedbackRenderer;
                inputs: rendererInputs(warning, 'warning')
              "
            />
          } @else {
            What should we call you?
          }
        </mat-hint>
        <mat-error *ngxMatErrorSlot="contactForm.name; let message">
          <ng-container
            *ngComponentOutlet="
              feedbackRenderer;
              inputs: rendererInputs(message, 'error')
            "
          />
        </mat-error>
      </mat-form-field>

      <mat-form-field
        [ngxMatFormField]="contactForm.email"
        fieldName="contact-email"
        appearance="outline"
      >
        <mat-label>Email</mat-label>
        <input
          matInput
          id="contact-email"
          type="email"
          [formField]="contactForm.email"
          ngxMatTextControl
          autocomplete="email"
        />
        <mat-error *ngxMatErrorSlot="contactForm.email; let message">
          <ng-container
            *ngComponentOutlet="
              feedbackRenderer;
              inputs: rendererInputs(message, 'error')
            "
          />
        </mat-error>
      </mat-form-field>

      <mat-form-field
        [ngxMatFormField]="contactForm.topic"
        fieldName="contact-topic"
        appearance="outline"
      >
        <mat-label>Topic</mat-label>
        <mat-select
          id="contact-topic"
          [formField]="contactForm.topic"
          ngxMatSelectControl
        >
          <mat-option value="">— Choose one —</mat-option>
          <mat-option value="support">Product support</mat-option>
          <mat-option value="sales">Sales question</mat-option>
          <mat-option value="feedback">General feedback</mat-option>
        </mat-select>
        <mat-hint *ngxMatHintSlot="contactForm.topic; let warning">
          @if (warning) {
            <ng-container
              *ngComponentOutlet="
                feedbackRenderer;
                inputs: rendererInputs(warning, 'warning')
              "
            />
          } @else {
            Pick the closest match
          }
        </mat-hint>
        <mat-error *ngxMatErrorSlot="contactForm.topic; let message">
          <ng-container
            *ngComponentOutlet="
              feedbackRenderer;
              inputs: rendererInputs(message, 'error')
            "
          />
        </mat-error>
      </mat-form-field>

      <div class="demo-form__row">
        <mat-checkbox
          id="contact-agree"
          [formField]="contactForm.agree"
          ngxMatCheckboxControl
        >
          I agree to be contacted
        </mat-checkbox>
      </div>
      <!-- Material's mat-checkbox does not project into mat-form-field, so
           its errors render via the control-agnostic feedback slot. The
           toolkit still owns visibility timing through the same DI seam. -->
      <ng-container
        *ngxMatFeedback="
          contactForm.agree;
          fieldName: 'contact-agree';
          let messages;
          severity as severity;
          id as id
        "
      >
        <p
          class="demo-form__feedback"
          [class.demo-form__feedback--warning]="severity === 'warning'"
          [attr.role]="severity === 'error' ? 'alert' : 'status'"
          [id]="id"
        >
          @for (message of messages; track message) {
            <ng-container
              *ngComponentOutlet="
                feedbackRenderer;
                inputs: rendererInputs(message, severity)
              "
            />
          }
        </p>
      </ng-container>

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
   * from the same DI token consumers can override via
   * `provideNgxMatForms({ feedbackRenderer })` — proves the renderer-token
   * seam works end-to-end inside Material's idiom.
   */
  readonly #errorRenderer = inject(NGX_FORM_FIELD_ERROR_RENDERER, {
    optional: true,
  });
  protected readonly feedbackRenderer: Type<unknown> =
    this.#errorRenderer?.component ?? MaterialFeedbackRenderer;

  /**
   * Inputs map for the renderer outlet. The simplified renderer contract
   * (ADR-0002 §7) accepts only `{ message, severity }`; the slot directives
   * resolve `formField` → message text, so the consumer only forwards the
   * resolved string and the severity discriminator.
   */
  protected readonly rendererInputs = (
    message: string,
    severity: NgxMatFeedbackSeverity,
  ): Record<string, unknown> => ({ message, severity });

  protected resetForm(): void {
    this.model.set({ ...INITIAL_CONTACT_MODEL });
    this.contactForm().reset();
    this.submitted.set(false);
  }
}
