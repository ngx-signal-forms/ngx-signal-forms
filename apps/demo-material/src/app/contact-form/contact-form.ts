import { Component, signal, viewChild } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  createOnInvalidHandler,
  hasOnlyWarnings,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxMatFeedback, NgxMatFormBundle } from '../wrapper';
import {
  INITIAL_CONTACT_MODEL,
  type ContactFormModel,
} from './contact-form.model';
import { contactFormSchema } from './contact-form.validations';

/**
 * Material reference contact form.
 *
 * Demonstrates the four toolkit contracts on top of Angular Material 22+
 * with the lean ergonomic surface from ADR-0002:
 *
 * 1. **Renderer registration** — `provideNgxMatForms()` (in `main.ts`)
 *    registers `MaterialFeedbackRenderer` for both `<mat-error>` and
 *    `<mat-hint>` slots app-wide. Consumers drop in
 *    `<ngx-mat-feedback-outlet>` and the configured renderer mounts itself
 *    via DI; swap presentation in one provider call without touching
 *    templates.
 * 2. **Per-control directives** — `ngxMatTextControl` /
 *    `ngxMatSelectControl` / `ngxMatCheckboxControl` apply
 *    `ariaMode="manual"` automatically (Material owns `aria-describedby`
 *    on the projected control), no string parameter required.
 * 3. **Wrapper directive** — `[ngxMatFormField]` runs `contentChildren`
 *    over `NgxMatBoundControl` to discover the bound control. No
 *    `*ngComponentOutlet` boilerplate; `*ngxMatErrorSlot` and
 *    `*ngxMatHintSlot` own conditional rendering and delegate message
 *    resolution to the public `createErrorMessageSignal` primitive.
 * 4. **`*ngxMatFeedback`** — the control-agnostic feedback slot for
 *    Material controls that don't fit `<mat-form-field>` (here, the
 *    consent checkbox).
 */
@Component({
  selector: 'ngx-contact-form',

  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxMatFormBundle,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
  ],
  templateUrl: './contact-form.html',
})
export class ContactFormComponent {
  /** Reactive model — Angular Signal Forms drives the form from this signal. */
  protected readonly model = signal<ContactFormModel>(INITIAL_CONTACT_MODEL);

  readonly #onInvalid = createOnInvalidHandler();

  /**
   * Toolkit-aware Signal Forms instance with the validation schema applied.
   *
   * `ignoreValidators: 'all'` + the `hasOnlyWarnings()` guard inside `action`
   * is the toolkit's documented warning-tolerant pattern for forms that use
   * declarative `{ submission }` (see `apps/demo-primeng`'s profile form and
   * README "Warnings under submission.action"). Without it, Angular Signal
   * Forms' native `submit()` treats `warn:short-name` as blocking — even
   * though it's a non-blocking warning by the toolkit's own convention —
   * and the action never runs.
   */
  readonly contactForm = form(this.model, contactFormSchema, {
    submission: {
      ignoreValidators: 'all',
      action: async () => {
        if (!hasOnlyWarnings(this.contactForm().errorSummary())) {
          this.#onInvalid(this.contactForm);
          return;
        }
        // Stand-in for a real API call; the demo is intentionally lean.
        await new Promise((resolve) => setTimeout(resolve, 250));
        this.submitted.set(true);
      },
    },
  });

  protected readonly submitted = signal(false);

  /**
   * Drives the consent checkbox's `[aria-describedby]` in the template —
   * `<mat-checkbox>` doesn't project into `<mat-form-field>`, so nothing
   * else associates its rendered `*ngxMatFeedback` block with the control.
   */
  protected readonly agreeFeedback = viewChild(NgxMatFeedback);

  protected resetForm(): void {
    this.model.set({ ...INITIAL_CONTACT_MODEL });
    this.contactForm().reset();
    this.submitted.set(false);
  }
}
