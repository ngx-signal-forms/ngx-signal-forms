import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  type Type,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import {
  createShowErrorsComputed,
  generateErrorId,
  generateWarningId,
  injectFormContext,
  isBlockingError,
  isWarningError,
  NGX_FORM_FIELD_ERROR_RENDERER,
  NGX_SIGNAL_FORMS_CONFIG,
  readDirectErrors,
  resolveErrorDisplayStrategy,
  type ErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import { MaterialFeedbackRenderer } from './material-error-renderer';

/**
 * Lean error / warning slot for fields whose Material control sits outside
 * `<mat-form-field>` — most notably `<mat-checkbox>`, which Material does not
 * accept as a `MatFormFieldControl`.
 *
 * Same renderer-token contract as `MatFormFieldWrapper`: instantiates the
 * configured component (via `NGX_FORM_FIELD_ERROR_RENDERER`) for both
 * blocking errors and warnings. Falls back to `MaterialFeedbackRenderer`
 * when no provider is registered.
 *
 * Owns its own toolkit-managed ID stamping (`${fieldName}-error` /
 * `${fieldName}-warning`) so consumers wanting belt-and-braces ARIA wiring
 * can set `aria-describedby` on the projected control by hand. The `<input>`
 * inside `<mat-checkbox>` is not directly addressable, so the wrapper does
 * not write the attribute itself — README documents the manual wiring path.
 */
@Component({
  selector: 'ngx-mat-checkbox-feedback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet],
  template: `
    @if (errorVisible()) {
      <div
        class="ngx-mat-checkbox-feedback ngx-mat-checkbox-feedback--error"
        role="alert"
        [id]="errorId()"
      >
        <ng-container
          *ngComponentOutlet="feedbackComponent(); inputs: errorInputs()"
        />
      </div>
    }
    @if (warningVisible()) {
      <div
        class="ngx-mat-checkbox-feedback ngx-mat-checkbox-feedback--warning"
        role="status"
        [id]="warningId()"
      >
        <ng-container
          *ngComponentOutlet="feedbackComponent(); inputs: warningInputs()"
        />
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .ngx-mat-checkbox-feedback {
      font-size: 0.75rem;
      margin: 0.25rem 0 0;
    }

    .ngx-mat-checkbox-feedback--error {
      color: #b00020;
    }

    .ngx-mat-checkbox-feedback--warning {
      color: #92400e;
    }
  `,
})
export class MatCheckboxFeedback<TValue = unknown> {
  readonly formField = input.required<FieldTree<TValue>>();
  readonly fieldName = input.required<string>();
  readonly strategy = input<ErrorDisplayStrategy | null>(null);

  readonly #config = inject(NGX_SIGNAL_FORMS_CONFIG);
  readonly #formContext = injectFormContext();
  readonly #errorRenderer = inject(NGX_FORM_FIELD_ERROR_RENDERER, {
    optional: true,
  });

  protected readonly feedbackComponent = computed<Type<unknown>>(
    () => this.#errorRenderer?.component ?? MaterialFeedbackRenderer,
  );

  protected readonly errorId = computed(() =>
    generateErrorId(this.fieldName()),
  );
  protected readonly warningId = computed(() =>
    generateWarningId(this.fieldName()),
  );

  protected readonly effectiveStrategy = computed(() =>
    resolveErrorDisplayStrategy(
      this.strategy(),
      this.#formContext ? this.#formContext.errorStrategy() : undefined,
      this.#config.defaultErrorStrategy,
    ),
  );

  protected readonly submittedStatus = computed(() =>
    this.#formContext ? this.#formContext.submittedStatus() : 'unsubmitted',
  );

  readonly #fieldStateSignal = computed(() => this.formField()());

  readonly #allMessages = computed(() =>
    readDirectErrors(this.#fieldStateSignal()),
  );

  protected readonly hasErrors = computed(() =>
    this.#allMessages().some(isBlockingError),
  );

  protected readonly hasWarnings = computed(() =>
    this.#allMessages().some(isWarningError),
  );

  readonly #showByStrategy = createShowErrorsComputed(
    this.#fieldStateSignal,
    this.effectiveStrategy,
    this.submittedStatus,
  );

  protected readonly errorVisible = computed(
    () => this.hasErrors() && this.#showByStrategy(),
  );

  protected readonly warningVisible = computed(
    () => this.hasWarnings() && this.#showByStrategy() && !this.errorVisible(),
  );

  protected readonly errorInputs = computed<Record<string, unknown>>(() => ({
    formField: this.formField(),
    strategy: this.effectiveStrategy(),
    submittedStatus: this.submittedStatus(),
    slot: 'error',
  }));

  protected readonly warningInputs = computed<Record<string, unknown>>(() => ({
    formField: this.formField(),
    strategy: this.effectiveStrategy(),
    submittedStatus: this.submittedStatus(),
    slot: 'warning',
  }));
}
