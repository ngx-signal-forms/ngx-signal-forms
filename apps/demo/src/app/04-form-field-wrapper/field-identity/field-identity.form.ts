import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { form } from '@angular/forms/signals';
import {
  createOnInvalidHandler,
  NgxSignalFormToolkit,
  type ResolvedErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import { NgxFormFieldHint } from '@ngx-signal-forms/toolkit/assistive';
import { initialFieldIdentityModel } from './field-identity.model';
import { fieldIdentitySchema } from './field-identity.validations';
import { IdentityFieldComponent } from './field-identity.wrapper';
import { GeneratedIdWidgetComponent } from './field-identity.widget';

/**
 * Field Identity demo form.
 *
 * Two sections, one story — a wrapper that owns its field identity, inside
 * UI that can lose its layout box:
 *
 * 1. **Declared name vs generated id.** The widget mints
 *    `id="demo-widget-N"`; the wrapper declares `fieldName="emailAddress"`.
 *    The rendered error and hint elements carry `emailAddress-*` ids, and
 *    `aria-describedby` points at them.
 * 2. **`aria-invalid` inside a collapsible container.** The same wrapper
 *    inside a `<details>`. While collapsed the control has no layout box, so
 *    auto-aria removes `aria-invalid` rather than leaving a stale value that
 *    would be wrong the moment the container reopens.
 *
 * `[open]` is bound to a signal and `(toggle)` writes it back. A bare
 * `<details>` toggles in the browser without telling Angular, and auto-aria
 * re-probes its host in a render hook — so the binding is what makes the
 * demo re-evaluate when the reader opens or closes the section.
 */
@Component({
  selector: 'ngx-field-identity',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgxSignalFormToolkit,
    NgxFormFieldHint,
    IdentityFieldComponent,
    GeneratedIdWidgetComponent,
  ],
  templateUrl: './field-identity.html',
  styles: `
    :host {
      display: block;
    }
  `,
})
export class FieldIdentityFormComponent {
  readonly #handleInvalidSubmission = createOnInvalidHandler();

  readonly errorDisplayMode = input<ResolvedErrorDisplayStrategy>('immediate');

  readonly #model = signal(initialFieldIdentityModel);

  /** Drives the collapsible section in section 2. */
  protected readonly deliveryExpanded = signal(true);

  readonly identityForm = form(this.#model, fieldIdentitySchema, {
    submission: {
      action: () => Promise.resolve(null),
      onInvalid: (formTree) => {
        this.#handleInvalidSubmission(formTree);
      },
    },
  });

  protected onDeliveryToggle(event: Event): void {
    this.deliveryExpanded.set((event.target as HTMLDetailsElement).open);
  }
}
