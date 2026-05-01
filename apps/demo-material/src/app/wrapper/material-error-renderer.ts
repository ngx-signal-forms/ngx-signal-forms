import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import type {
  ErrorDisplayStrategy,
  SubmittedStatus,
} from '@ngx-signal-forms/toolkit';
import { NgxHeadlessErrorState } from '@ngx-signal-forms/toolkit/headless';

/**
 * Material-friendly error / warning renderer.
 *
 * Wired through `NGX_FORM_FIELD_ERROR_RENDERER` so the demo's
 * `MatFormFieldWrapper` instantiates this component via `*ngComponentOutlet`
 * whenever it needs to render a field's blocking errors or non-blocking
 * warnings inside Material's `mat-error` / `mat-hint` slots.
 *
 * Notable contract:
 * - Accepts the canonical `{ formField, strategy, submittedStatus }` inputs
 *   bound by every toolkit wrapper.
 * - Composes the headless `NgxHeadlessErrorState` host directive so visibility
 *   timing, strategy resolution, and message resolution stay aligned with
 *   the rest of the toolkit.
 * - Splits its template via the `slot` input — the wrapper instantiates this
 *   component twice: once inside `<mat-error>` (slot = 'error') and once
 *   inside `<mat-hint>` (slot = 'warning'). Each branch consults the same
 *   headless state and returns the matching half.
 * - **Does NOT add its own container ID.** Material's `<mat-error>` /
 *   `<mat-hint>` parents already own unique IDs that `mat-form-field`
 *   registers in the bound control's `aria-describedby` chain.
 *
 * @see MatFormFieldWrapper for the wrapper that registers this component.
 */
@Component({
  selector: 'ngx-material-feedback-renderer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: NgxHeadlessErrorState,
      // `formField` is bridged via the constructor — see headless / assistive
      // form-field-error.ts for the `passThroughInput` rationale that prevents
      // the input from being forwarded through `hostDirectives`.
      inputs: ['strategy', 'submittedStatus'],
    },
  ],
  template: `
    @if (slot() === 'error' && showErrors()) {
      @for (
        error of headless.resolvedErrors();
        track error.kind + ':' + error.message + ':' + $index
      ) {
        <span class="ngx-mat-feedback__message">{{ error.message }}</span>
      }
    }
    @if (slot() === 'warning' && showWarnings()) {
      @for (
        warning of headless.resolvedWarnings();
        track warning.kind + ':' + warning.message + ':' + $index
      ) {
        <span
          class="ngx-mat-feedback__message ngx-mat-feedback__message--warning"
          >{{ warning.message }}</span
        >
      }
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .ngx-mat-feedback__message {
      display: block;
    }

    .ngx-mat-feedback__message + .ngx-mat-feedback__message {
      margin-top: 0.125rem;
    }

    .ngx-mat-feedback__message--warning {
      color: #92400e;
    }
  `,
})
export class MaterialFeedbackRenderer {
  /** Bound by the toolkit wrapper via `*ngComponentOutlet` inputs. */
  readonly formField = input<FieldTree<unknown>>();
  readonly strategy = input<ErrorDisplayStrategy | null>(null);
  readonly submittedStatus = input<SubmittedStatus>('unsubmitted');

  /**
   * Discriminator passed by the wrapper so a single component can serve both
   * `mat-error` and `mat-hint` slots. The wrapper passes 'error' inside
   * `<mat-error>` and 'warning' inside `<mat-hint>`.
   */
  readonly slot = input<'error' | 'warning'>('error');

  protected readonly headless = inject(NgxHeadlessErrorState);

  protected readonly showErrors = computed(() => {
    return this.headless.showErrors() && this.headless.hasErrors();
  });

  protected readonly showWarnings = computed(() => {
    return this.headless.showWarnings() && this.headless.hasWarnings();
  });

  constructor() {
    // Bridge the `formField` input to the headless directive so it computes
    // strategy-aware visibility and resolved errors against the same source
    // of truth as the rest of the toolkit. Mirrors the bridge in
    // `NgxFormFieldError`.
    this.headless.connectFieldState(computed(() => this.formField()?.()));
  }
}
