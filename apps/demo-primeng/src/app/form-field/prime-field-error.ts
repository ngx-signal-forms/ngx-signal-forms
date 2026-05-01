import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import {
  generateErrorId,
  generateWarningId,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  resolveFieldNameFromCandidates,
  type ErrorDisplayStrategy,
  type SubmittedStatus,
} from '@ngx-signal-forms/toolkit';
import { NgxHeadlessErrorState } from '@ngx-signal-forms/toolkit/headless';

/**
 * PrimeNG-flavoured error renderer.
 *
 * Renders blocking errors as `<small class="p-error">` (PrimeNG's idiomatic
 * inline error text) and warnings as `<small class="p-warn">` so the same
 * Prime visual treatment applies to both severities.
 *
 * The component composes `NgxHeadlessErrorState` via `hostDirectives` to
 * get strategy resolution, error / warning splitting, and visibility timing
 * for free — exactly what the toolkit's first-party `NgxFormFieldError`
 * does, just without the toolkit's default markup.
 *
 * Inputs match the `NGX_FORM_FIELD_ERROR_RENDERER` contract documented in
 * `docs/CUSTOM_WRAPPERS.md`. The wrapper that instantiates this renderer
 * (PrimeFormFieldComponent) binds `formField`, `strategy`, `submittedStatus`,
 * and `fieldName` through `*ngComponentOutlet`.
 */
@Component({
  selector: 'prime-field-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: NgxHeadlessErrorState,
      inputs: ['strategy', 'submittedStatus', 'errorsOverride: errors'],
    },
  ],
  styles: `
    :host {
      display: contents;
    }

    .p-error {
      color: var(--p-form-field-invalid-placeholder-color, #ef4444);
      font-size: 0.85rem;
      line-height: 1.2;
    }

    .p-warn {
      color: var(--p-message-warn-color, #b45309);
      font-size: 0.85rem;
      line-height: 1.2;
    }
  `,
  template: `
    <!--
      role="alert" — implicit aria-live="assertive" + aria-atomic="true".
      The id matches the {fieldName}-error convention so auto-aria's
      aria-describedby chain points at the rendered error element.
    -->
    @if (showErrors() && hasErrors()) {
      <small
        [id]="errorId()"
        class="p-error"
        role="alert"
        data-testid="prime-error"
      >
        @for (
          error of headless.resolvedErrors();
          track error.kind + ':' + error.message + ':' + $index
        ) {
          <span class="p-error__message">{{ error.message }}</span>
        }
      </small>
    }

    <!--
      role="status" — implicit aria-live="polite" + aria-atomic="true".
      Warnings render alongside errors under the same Prime idiom and use
      the {fieldName}-warning id so auto-aria can chain them too.
    -->
    @if (showWarnings() && hasWarnings()) {
      <small
        [id]="warningId()"
        class="p-warn"
        role="status"
        data-testid="prime-warning"
      >
        @for (
          warning of headless.resolvedWarnings();
          track warning.kind + ':' + warning.message + ':' + $index
        ) {
          <span class="p-warn__message">{{ warning.message }}</span>
        }
      </small>
    }
  `,
})
export class PrimeFieldErrorComponent {
  /**
   * Headless directive composed via `hostDirectives` — exposes resolved
   * errors / warnings with messages, plus strategy-driven visibility.
   * Public access to {@link NgxHeadlessErrorState.resolvedErrors} et al.
   */
  protected readonly headless = inject(NgxHeadlessErrorState);

  /**
   * Field context contributed by `PrimeFormFieldComponent` so the renderer
   * can resolve a fieldName when the wrapper passes one through but the
   * direct `fieldName` input is empty.
   */
  readonly #fieldContext = inject(NGX_SIGNAL_FORM_FIELD_CONTEXT, {
    optional: true,
  });

  /**
   * Inputs forwarded by `*ngComponentOutlet` from the wrapper / fieldset.
   * Listed explicitly so the renderer's TypeScript signature matches the
   * `NGX_FORM_FIELD_ERROR_RENDERER` contract.
   */
  readonly formField = input<FieldTree<unknown>>();
  readonly fieldName = input<string | null | undefined>();
  // The renderer only forwards these to the host directive, so they are
  // declared on the component to absorb the `inputs` map without warnings.
  // `strategy` and `submittedStatus` are then bridged into the headless
  // directive via the `hostDirectives.inputs` mapping above.
  readonly strategy = input<ErrorDisplayStrategy | null | undefined>();
  readonly submittedStatus = input<SubmittedStatus | undefined>();

  protected readonly resolvedFieldName = computed<string | null>(() => {
    const explicit = this.fieldName();
    const fromContext = this.#fieldContext?.fieldName() ?? null;
    return resolveFieldNameFromCandidates(explicit ?? undefined, fromContext);
  });

  protected readonly errorId = computed<string | null>(() => {
    const name = this.resolvedFieldName();
    return name === null ? null : generateErrorId(name);
  });

  protected readonly warningId = computed<string | null>(() => {
    const name = this.resolvedFieldName();
    return name === null ? null : generateWarningId(name);
  });

  protected readonly showErrors = computed(() => this.headless.showErrors());
  protected readonly showWarnings = computed(() =>
    this.headless.showWarnings(),
  );
  protected readonly hasErrors = computed(() => this.headless.hasErrors());
  protected readonly hasWarnings = computed(() => this.headless.hasWarnings());

  constructor() {
    // Bridge the wrapper-supplied `formField` input into the headless
    // directive — same pattern the toolkit's default error component uses.
    // Cannot forward via `hostDirectives` inputs because Angular's FormField
    // directive selector (`[formField]`) would also try to apply to this
    // component and lose the pass-through guard.
    this.headless.connectFieldState(computed(() => this.formField()?.()));
  }
}
