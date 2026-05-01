import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  inject,
  input,
  type Type,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import {
  NGX_FORM_FIELD_ERROR_RENDERER,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  NGX_SIGNAL_FORM_HINT_REGISTRY,
  injectFormContext,
  type NgxSignalFormHintDescriptor,
} from '@ngx-signal-forms/toolkit';
import {
  NgxFormFieldError,
  NgxFormFieldHint,
} from '@ngx-signal-forms/toolkit/assistive';

/**
 * PrimeNG-flavoured form-field wrapper.
 *
 * Satisfies the four toolkit contracts documented in `docs/CUSTOM_WRAPPERS.md`:
 *
 * 1. **`NGX_SIGNAL_FORM_FIELD_CONTEXT`** — provides a `fieldName` signal so
 *    projected `<ngx-form-field-hint>` elements self-correlate to this field.
 * 2. **`NGX_SIGNAL_FORM_HINT_REGISTRY`** — exposes hint descriptors derived
 *    from projected `NgxFormFieldHint` children so `NgxSignalFormAutoAria` can
 *    chain their IDs into `aria-describedby` without DOM querying.
 * 3. **`NGX_FORM_FIELD_ERROR_RENDERER`** — injected with `{ optional: true }`
 *    and rendered via `*ngComponentOutlet`. Falls back to `NgxFormFieldError`
 *    when no renderer is registered. The app registers
 *    `PrimeFieldErrorComponent` so errors render as Prime's
 *    `<small class="p-error">` idiom.
 * 4. **`NgxSignalFormAutoAria`** — the bound control is *projected* through
 *    `<ng-content />`, so the directive must be in scope where the consumer
 *    declares the control. The host form imports it via the toolkit barrel.
 *
 * The wrapper deliberately ships no toolkit-default chrome (no border, no
 * outlined label) — PrimeNG's `pInputText`, `p-iconfield`, `p-select`, and
 * `p-checkbox` directives style the controls themselves. The wrapper layers
 * on assistive slots (label, hint, error) and the four DI seams above.
 */
@Component({
  selector: 'prime-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet],
  providers: [
    {
      provide: NGX_SIGNAL_FORM_FIELD_CONTEXT,
      useFactory: () => {
        const wrapper = inject(PrimeFormFieldComponent);
        return { fieldName: wrapper.resolvedFieldName };
      },
    },
    {
      provide: NGX_SIGNAL_FORM_HINT_REGISTRY,
      useFactory: () => {
        const wrapper = inject(PrimeFormFieldComponent);
        return { hints: wrapper.hintDescriptors };
      },
    },
  ],
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }

    :host([data-invalid='true']) ::ng-deep .p-inputtext,
    :host([data-invalid='true']) ::ng-deep .p-select {
      border-color: var(--p-form-field-invalid-border-color, #ef4444);
    }

    .prime-form-field__label {
      font-weight: 500;
      font-size: 0.95rem;
      color: var(--p-text-color, inherit);
    }

    .prime-form-field__required-marker {
      color: var(--p-form-field-invalid-border-color, #ef4444);
      margin-inline-start: 0.15rem;
    }

    .prime-form-field__assistive {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      min-height: 1.1rem;
    }
  `,
  host: {
    '[attr.data-invalid]': 'isInvalid() ? "true" : null',
    '[attr.data-field-name]': 'resolvedFieldName()',
  },
  template: `
    <span class="prime-form-field__label">
      <ng-content select="label" />
      @if (showRequiredMarker()) {
        <span class="prime-form-field__required-marker" aria-hidden="true"
          >*</span
        >
      }
    </span>

    <div class="prime-form-field__control">
      <ng-content />
    </div>

    <div class="prime-form-field__assistive">
      <!--
        Hints and errors render side-by-side, both unconditionally projected
        into the assistive slot. The toolkit's auto-aria directive chains
        each rendered ID into aria-describedby via NGX_SIGNAL_FORM_HINT_REGISTRY
        for hints and the headless error state's id signals for errors.

        - <ng-content select="ngx-form-field-hint" /> projects any
          NgxFormFieldHint children — these stay visible alongside errors
          (hints are persistent help text, not replaced on validation).
        - The error renderer outlet below renders PrimeFieldErrorComponent
          (the registered NGX_FORM_FIELD_ERROR_RENDERER), which itself
          gates visibility via showErrors() / showWarnings() from the
          composed NgxHeadlessErrorState directive.
      -->
      <ng-content select="ngx-form-field-hint" />

      <ng-container
        *ngComponentOutlet="
          errorRendererComponent();
          inputs: errorRendererInputs()
        "
      />
    </div>
  `,
})
export class PrimeFormFieldComponent<TValue = unknown> {
  /**
   * The Signal Forms field bound to this wrapper. The wrapper itself does not
   * mutate the field — it only reads `invalid()` for the visual invalid state
   * and forwards the field tree to the configured error renderer.
   */
  readonly formField = input.required<FieldTree<TValue>>();

  /**
   * Required field name for this wrapper instance.
   *
   * The wrapper uses this value to provide field context to projected
   * assistive content and to keep `aria-describedby` linking stable and
   * explicit at the call site.
   */
  readonly fieldName = input.required<string>();

  /**
   * Whether to render a visual required marker next to the label. Purely
   * decorative — the actual `aria-required` attribute is owned by the bound
   * control via `NgxSignalFormAutoAria` reading the field's `required()`.
   */
  readonly showRequiredMarker = input(false, { transform: Boolean });

  /**
   * Resolved field name — exposed to the field context so projected
   * `<ngx-form-field-hint>` instances self-correlate without an explicit
   * `fieldName` input on each hint.
   */
  readonly resolvedFieldName = computed<string | null>(() => {
    const name = this.fieldName().trim();
    return name.length > 0 ? name : null;
  });

  /**
   * Form context (optional) — surfaces the form-level error strategy and
   * submission status to the configured error renderer. The wrapper itself
   * does not gate visibility; the renderer (and `NgxSignalFormAutoAria`) do.
   */
  readonly #formContext = injectFormContext();

  protected readonly submittedStatus = computed(() => {
    return this.#formContext
      ? this.#formContext.submittedStatus()
      : 'unsubmitted';
  });

  /**
   * Shape the contract spelled out in `docs/CUSTOM_WRAPPERS.md` exactly.
   * If a consumer passes their own renderer via `provideFormFieldErrorRenderer`
   * the outlet picks it up; otherwise the default toolkit error component
   * renders. In this app, the default is overridden to `PrimeFieldErrorComponent`
   * via the bootstrap providers.
   */
  readonly #errorRenderer = inject(NGX_FORM_FIELD_ERROR_RENDERER, {
    optional: true,
  });

  protected readonly errorRendererComponent = computed<Type<unknown>>(
    () => this.#errorRenderer?.component ?? NgxFormFieldError,
  );

  protected readonly errorRendererInputs = computed<Record<string, unknown>>(
    () => ({
      formField: this.formField(),
      strategy: this.#formContext?.errorStrategy() ?? null,
      submittedStatus: this.submittedStatus(),
      fieldName: this.resolvedFieldName(),
    }),
  );

  /**
   * Hint children projected into the wrapper. The descriptors flow into the
   * hint registry so `NgxSignalFormAutoAria` can append their IDs to
   * `aria-describedby` on the bound control.
   */
  protected readonly hintChildren = contentChildren(NgxFormFieldHint, {
    descendants: true,
  });

  readonly hintDescriptors = computed<readonly NgxSignalFormHintDescriptor[]>(
    () =>
      this.hintChildren().map((hint) => ({
        id: hint.resolvedId(),
        fieldName: hint.resolvedFieldName(),
      })),
  );

  /**
   * Visual invalid state for the wrapper host attribute. Auto-aria writes the
   * actual `aria-invalid` to the bound control; this is purely a styling hook.
   */
  protected readonly isInvalid = computed(() => {
    const state = this.formField()();
    return state.invalid() && state.touched();
  });
}
