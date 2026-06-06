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
  showErrors,
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
      /* Fallback #b91c1c (Tailwind red-700, ~6.1:1 on white) is used when
         the PrimeNG token is unresolved (e.g. SSR pre-render, stripped
         CSS). PrimeNG's default #ef4444 would fall short of WCAG 2.2 AA
         contrast (1.4.3) at the 0.85rem error size. */
      color: var(--p-form-field-invalid-placeholder-color, #b91c1c);
      font-size: 0.85rem;
      line-height: 1.2;
    }

    .p-warn {
      color: var(--p-message-warn-color, #b45309);
      font-size: 0.85rem;
      line-height: 1.2;
    }

    /*
     * Empty live-region containers stay mounted in the DOM so first
     * announcements are not missed on some AT/browser combos. The
     * containers carry [hidden] in this state — back it up with display:
     * none so they contribute no visual whitespace either. Class names
     * are wrapper-local on purpose: prefixing with prime-feedback avoids
     * masquerading as a PrimeNG public class hook.
     */
    .prime-feedback--empty {
      display: none;
    }
  `,
  template: `
    <!--
      role="alert" — implicit aria-live="assertive" + aria-atomic="true".
      The id matches the {fieldName}-error convention so auto-aria's
      aria-describedby chain points at the rendered error element.

      The container stays MOUNTED unconditionally and toggles [hidden] +
      [attr.aria-hidden] based on visibility (matches the toolkit's
      NgxFormFieldError pattern). This keeps the live region in the DOM
      so the very first error announcement isn't lost on AT/browser pairs
      that only fire role="alert" on content insertion into a pre-existing
      live region (WCAG 4.1.3, NVDA + Chrome edge case).
    -->
    <small
      [id]="headless.showErrors() && headless.hasErrors() ? errorId() : null"
      class="p-error"
      [class.prime-feedback--empty]="
        !(headless.showErrors() && headless.hasErrors())
      "
      role="alert"
      [attr.aria-hidden]="
        headless.showErrors() && headless.hasErrors() ? null : 'true'
      "
      [hidden]="!(headless.showErrors() && headless.hasErrors())"
      data-testid="prime-error"
    >
      @if (headless.showErrors() && headless.hasErrors()) {
        @for (
          error of headless.resolvedErrors();
          track error.kind + ':' + error.message + ':' + $index
        ) {
          <span class="p-error__message">{{ error.message }}</span>
        }
      }
    </small>

    <!--
      role="status" — implicit aria-live="polite" + aria-atomic="true".
      Same always-mounted live-region pattern as the error container above.
      Warning visibility is independent of the blocking-error strategy: the
      'immediate' showWarnings signal lights up while the user is still
      editing, mirroring NgxFormFieldError's warningStrategy default.
    -->
    <small
      [id]="showWarnings() && headless.hasWarnings() ? warningId() : null"
      class="p-warn"
      [class.prime-feedback--empty]="
        !(showWarnings() && headless.hasWarnings())
      "
      role="status"
      [attr.aria-hidden]="
        showWarnings() && headless.hasWarnings() ? null : 'true'
      "
      [hidden]="!(showWarnings() && headless.hasWarnings())"
      data-testid="prime-warning"
    >
      @if (showWarnings() && headless.hasWarnings()) {
        @for (
          warning of headless.resolvedWarnings();
          track warning.kind + ':' + warning.message + ':' + $index
        ) {
          <span class="p-warn__message">{{ warning.message }}</span>
        }
      }
    </small>
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
   *
   * `strategy` and `submittedStatus` are intentionally NOT redeclared here —
   * they are exposed on this component's input surface via the
   * `hostDirectives.inputs` mapping above, which forwards them straight to
   * `NgxHeadlessErrorState`. Declaring duplicates would shadow the
   * forwarding and prevent the strategy/submission status from reaching the
   * headless directive.
   */
  readonly formField = input<FieldTree<unknown>>();
  readonly fieldName = input<string | null | undefined>();

  readonly #fieldState = computed(() => this.formField()?.() ?? null);

  /**
   * Warning visibility uses an `immediate` strategy independent of the
   * blocking-error strategy — informational warnings should land while the
   * user is still editing, even when blocking errors are gated until touch
   * or submit. Mirrors `NgxFormFieldError`'s `warningStrategy` default
   * (see `packages/toolkit/assistive/form-field-error.ts`) and the Spartan
   * reference (`firstWarning = #firstWarning`, no strategy gate).
   */
  protected readonly showWarnings = showErrors(
    this.#fieldState,
    computed(() => 'immediate' as const),
    this.headless.resolvedSubmittedStatus,
  );

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

  constructor() {
    // Bridge the wrapper-supplied `formField` input into the headless
    // directive — same pattern the toolkit's default error component uses.
    // Cannot forward via `hostDirectives` inputs because Angular's FormField
    // directive selector (`[formField]`) would also try to apply to this
    // component and lose the pass-through guard.
    this.headless.connectFieldState(computed(() => this.formField()?.()));
  }
}
