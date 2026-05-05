import {
  computed,
  Directive,
  effect,
  EmbeddedViewRef,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import {
  generateErrorId,
  generateWarningId,
  injectFormContext,
  NGX_SIGNAL_FORMS_CONFIG,
  resolveErrorDisplayStrategy,
  type ErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import { createErrorMessageSignal } from '@ngx-signal-forms/toolkit/headless';

/**
 * Embedded-view context for `*ngxMatFeedback`.
 *
 * `$implicit` is the message list for the current block (error or warning);
 * `severity` and `id` are named context vars consumers can pull via the
 * structural-directive `let`/`as` microsyntax.
 */
export interface NgxMatFeedbackContext {
  readonly $implicit: readonly string[];
  readonly messages: readonly string[];
  readonly severity: 'error' | 'warning';
  readonly id: string;
}

/**
 * Structural directive used adjacent to a Material control that does **not**
 * project into `<mat-form-field>` (`<mat-checkbox>`, `<mat-slide-toggle>`,
 * `<mat-radio-group>`, `<mat-button-toggle-group>`, `<mat-chip-grid>`,
 * `<mat-datepicker>`).
 *
 * Renders **at most one block per kind** — one for blocking errors, one for
 * non-blocking warnings — so each block owns a single stable ID
 * (`{fieldName}-error` / `{fieldName}-warning`) that consumers can wire into
 * the bound control's `aria-describedby` chain by hand.
 *
 * Message resolution delegates to the public `createErrorMessageSignal`
 * primitive, so consumers that configure `NGX_ERROR_MESSAGES` see registry
 * values surface here through the same 3-tier cascade
 * (validator message → registry → default) as the in-tree
 * `NgxFormFieldError`.
 *
 * @example
 * ```html
 * <mat-checkbox [formField]="form.agree" ngxMatCheckboxControl>
 *   I agree to be contacted
 * </mat-checkbox>
 *
 * <ng-container
 *   *ngxMatFeedback="form.agree; fieldName: 'contact-agree'; let messages; severity as severity; id as id"
 * >
 *   <div [attr.role]="severity === 'error' ? 'alert' : 'status'" [id]="id">
 *     @for (message of messages; track message) {
 *       <span>{{ message }}</span>
 *     }
 *   </div>
 * </ng-container>
 * ```
 *
 * @see ADR-0002 §4 for the control-agnostic feedback decision.
 */
@Directive({
  selector: '[ngxMatFeedback]',
})
export class NgxMatFeedback<TValue = unknown> {
  /** Field whose errors / warnings populate the feedback blocks. */
  readonly formField = input.required<FieldTree<TValue>>({
    alias: 'ngxMatFeedback',
  });

  /**
   * Stable field name used for ID generation. Required because controls
   * outside `<mat-form-field>` cannot rely on Material's automatic
   * aria-describedby aggregation — the consumer must wire IDs by hand.
   */
  readonly fieldName = input.required<string>({
    alias: 'ngxMatFeedbackFieldName',
  });

  /** Optional per-feedback strategy override. */
  readonly strategy = input<ErrorDisplayStrategy | null>(null, {
    alias: 'ngxMatFeedbackStrategy',
  });

  readonly #templateRef = inject(TemplateRef<NgxMatFeedbackContext>);
  readonly #viewContainerRef = inject(ViewContainerRef);

  readonly #config = inject(NGX_SIGNAL_FORMS_CONFIG);
  readonly #formContext = injectFormContext();

  readonly #fieldStateAccessor = computed(() => this.formField()());

  readonly #effectiveStrategy = computed(() =>
    resolveErrorDisplayStrategy(
      this.strategy(),
      this.#formContext ? this.#formContext.errorStrategy() : undefined,
      this.#config.defaultErrorStrategy,
    ),
  );

  readonly #submittedStatus = computed(() =>
    this.#formContext ? this.#formContext.submittedStatus() : 'unsubmitted',
  );

  /**
   * Blocking errors, resolved through the public primitive. The strategy and
   * submission status are forwarded so the primitive's visibility cascade
   * matches the directive's own; the registry is auto-injected from
   * `NGX_ERROR_MESSAGES`.
   */
  readonly #resolvedErrors = createErrorMessageSignal(
    this.#fieldStateAccessor,
    {
      strategy: this.#effectiveStrategy,
      submittedStatus: this.#submittedStatus,
    },
  );

  /**
   * Warnings share the directive's strategy/submission gating with errors —
   * Material's `*ngxMatFeedback` historically gated both via the same
   * `#showByStrategy`, so forwarding `#effectiveStrategy` keeps existing
   * consumers' "wait for touch / submit" behavior. `#blocks` then suppresses
   * warnings whenever blocking errors are present so at most one block
   * renders per field. (This deliberately differs from the Spartan slice in
   * #65, which mirrors `NgxFormFieldError`'s `'immediate'` warning default.)
   */
  readonly #resolvedWarnings = createErrorMessageSignal(
    this.#fieldStateAccessor,
    {
      strategy: this.#effectiveStrategy,
      submittedStatus: this.#submittedStatus,
      includeWarnings: 'only',
    },
  );

  readonly #blocks = computed<readonly NgxMatFeedbackContext[]>(() => {
    const fieldName = this.fieldName();
    // Filter empty strings so a deliberate `message: ''` validator/registry
    // override doesn't render a live region with an ID + role but no text.
    const blockingMessages = this.#resolvedErrors()
      .map((entry) => entry.message)
      .filter((message) => message !== '');
    if (blockingMessages.length > 0) {
      return [
        {
          $implicit: blockingMessages,
          messages: blockingMessages,
          severity: 'error',
          // Container IDs use the kind-less `generateErrorId(name)` /
          // `generateWarningId(name)` shape so they stay in lockstep with
          // the consumer's `aria-describedby` wiring. Do not substitute
          // `ResolvedFieldError.id` — that ID embeds the validator `kind`
          // and would break that wiring.
          id: generateErrorId(fieldName),
        },
      ];
    }

    // Warnings render only when there are no blocking errors — matching the
    // previous `MatCheckboxFeedback` semantics and Material's hint-vs-error
    // convention.
    const warningMessages = this.#resolvedWarnings()
      .map((entry) => entry.message)
      .filter((message) => message !== '');
    if (warningMessages.length > 0) {
      return [
        {
          $implicit: warningMessages,
          messages: warningMessages,
          severity: 'warning',
          id: generateWarningId(fieldName),
        },
      ];
    }

    return [];
  });

  /** @internal — type guard for template language services. */
  static ngTemplateContextGuard<TValue>(
    _dir: NgxMatFeedback<TValue>,
    ctx: unknown,
  ): ctx is NgxMatFeedbackContext {
    return true;
  }

  constructor() {
    effect(() => {
      const blocks = this.#blocks();
      const vcr = this.#viewContainerRef;

      while (vcr.length > blocks.length) {
        vcr.remove(vcr.length - 1);
      }
      for (let index = 0; index < blocks.length; index++) {
        const context = blocks[index];
        if (index < vcr.length) {
          const view = vcr.get(
            index,
          ) as EmbeddedViewRef<NgxMatFeedbackContext> | null;
          if (view) {
            // Mutate the existing context object in place — replacing the
            // reference is deprecated by Angular.
            Object.assign(view.context, context);
            view.markForCheck();
          }
        } else {
          vcr.createEmbeddedView(this.#templateRef, context);
        }
      }
    });
  }
}
