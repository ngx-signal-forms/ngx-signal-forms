import { NgComponentOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  isDevMode,
  signal,
  type Type,
} from '@angular/core';
import type { FieldState, FieldTree } from '@angular/forms/signals';
import {
  createShowErrorsComputed,
  injectFormContext,
  NGX_FORM_FIELD_ERROR_RENDERER,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  NGX_SIGNAL_FORM_HINT_REGISTRY,
  NGX_SIGNAL_FORMS_CONFIG,
  NgxSignalFormControlSemanticsDirective,
  resolveErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import {
  NgxFormFieldError,
  NgxFormFieldHint,
} from '@ngx-signal-forms/toolkit/assistive';
import {
  createAriaInvalidSignal,
  createAriaRequiredSignal,
  createErrorRendererInputs,
  createFieldNameResolver,
  toHintDescriptors,
} from '@ngx-signal-forms/toolkit/headless';

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
 *
 * **Selector aliasing:** matching `prime-form-field[ngxPrimeFormField]`
 * (rather than bare `prime-form-field`) prevents Angular's `FormField`
 * directive from `@angular/forms/signals` (selector `[formField]`) from
 * double-binding to the wrapper element when consumers write
 * `<prime-form-field [formField]="form.x">`. The wrapper accepts the field
 * via the aliased input (`[ngxPrimeFormField]`) instead, so only the inner
 * `<input [formField]>` gets the toolkit's `FormField` directive.
 *
 * **Bound-control discovery:** pure-signal lexical content query —
 * `contentChildren(NgxSignalFormControlSemanticsDirective)` finds every
 * projected control that opted into the toolkit's semantics layer. The
 * directive exposes `elementRef` (per ADR-0002 §6) so the wrapper reads the
 * bound element's `id` for the third-tier `resolvedFieldName` fallback
 * without `afterEveryRender` or imperative DOM probing.
 */
@Component({
  selector: 'prime-form-field[ngxPrimeFormField]',
  exportAs: 'ngxPrimeFormField',
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
      border-color: var(--prime-form-field-invalid-border-color);
    }

    .prime-form-field__label {
      font-weight: 500;
      font-size: 0.95rem;
      color: var(--p-text-color, inherit);
    }

    .prime-form-field__required-marker {
      color: var(--prime-form-field-invalid-border-color);
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
    style:
      '--prime-form-field-invalid-border-color: var(--p-form-field-invalid-border-color, #ef4444);',
    '[attr.data-invalid]': 'ariaInvalidValue() === "true" ? "true" : null',
    '[attr.data-field-name]': 'resolvedFieldName()',
    '[attr.data-prime-required]': 'ariaRequiredValue()',
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
   * The Signal Forms field bound to this wrapper. Aliased to
   * `ngxPrimeFormField` (matching the component selector) so the consumer
   * binding `<prime-form-field [ngxPrimeFormField]="form.x">` does not
   * collide with Angular Signal Forms' `FormField` directive (selector
   * `[formField]`).
   */
  readonly formField = input.required<FieldTree<TValue>>({
    alias: 'ngxPrimeFormField',
  });

  /**
   * Optional explicit field name. When omitted, resolution falls back to
   * the bound control's `id` (resolved via the lexical
   * `contentChildren(NgxSignalFormControlSemanticsDirective)` query). When
   * neither is available, ARIA wiring is skipped and a one-shot dev-mode
   * warning fires.
   */
  readonly fieldName = input<string>();

  /**
   * Whether to render a visual required marker next to the label. Purely
   * decorative — the actual `aria-required` attribute is owned by the bound
   * control via `NgxSignalFormAutoAria` reading the field's `required()`.
   */
  readonly showRequiredMarker = input(false, { transform: booleanAttribute });

  // ── Bound-control discovery via contentChildren ───────────────────────
  //
  // Mirrors the Spartan / Material reference wrappers. Every PrimeNG
  // control in the demo declares `ngxSignalFormControl="…"`, which mounts
  // this directive on the host element. The directive exposes
  // `elementRef` (ADR-0002 §6) so the wrapper reads the bound element
  // without imperative DOM probing.

  protected readonly boundSemantics = contentChildren(
    NgxSignalFormControlSemanticsDirective,
    { descendants: true },
  );

  readonly #boundControlElement = computed<HTMLElement | null>(
    () => this.boundSemantics()[0]?.elementRef.nativeElement ?? null,
  );

  /**
   * Resolved field name. Built via the toolkit's
   * {@link createFieldNameResolver} so the priority cascade
   * (explicit → bound-control `id` → `null` + dev warning) stays in
   * lockstep with the canonical wrapper and its sibling references.
   */
  readonly resolvedFieldName = createFieldNameResolver({
    explicit: this.fieldName,
    boundControl: () => this.#boundControlElement(),
    wrapperName: 'prime-form-field',
  });

  // ── Hint registry ─────────────────────────────────────────────────────

  /**
   * Hint children projected into the wrapper. Exposed as `protected` (rather
   * than `#`) because Angular's `contentChildren` API requires non-private
   * visibility.
   */
  protected readonly hintChildren = contentChildren(NgxFormFieldHint, {
    descendants: true,
  });

  /**
   * Hint descriptors in the public wire format consumed by
   * `NGX_SIGNAL_FORM_HINT_REGISTRY`. Built via {@link toHintDescriptors}
   * so the registry shape stays in lockstep with the canonical wrapper.
   */
  readonly hintDescriptors = toHintDescriptors(this.hintChildren);

  // ── Strategy / submission state plumbing ──────────────────────────────

  readonly #config = inject(NGX_SIGNAL_FORMS_CONFIG);
  readonly #formContext = injectFormContext();

  /**
   * Strategy resolved against the global config and any form-level
   * override — same primitive the canonical `NgxFormFieldWrapper`,
   * `NgxSignalFormAutoAria`, and the Spartan/Material refs use, so
   * a strategy change anywhere takes effect everywhere.
   */
  readonly effectiveStrategy = computed(() =>
    resolveErrorDisplayStrategy(
      null,
      this.#formContext ? this.#formContext.errorStrategy() : undefined,
      this.#config.defaultErrorStrategy,
    ),
  );

  protected readonly submittedStatus = computed(() =>
    this.#formContext ? this.#formContext.submittedStatus() : 'unsubmitted',
  );

  // ── Error renderer outlet ─────────────────────────────────────────────

  readonly #errorRenderer = inject(NGX_FORM_FIELD_ERROR_RENDERER, {
    optional: true,
  });

  protected readonly errorRendererComponent = computed<Type<unknown>>(
    () => this.#errorRenderer?.component ?? NgxFormFieldError,
  );

  protected readonly errorRendererInputs = createErrorRendererInputs({
    formField: this.formField,
    strategy: this.effectiveStrategy,
    submittedStatus: this.submittedStatus,
  });

  // ── ARIA primitive factories ──────────────────────────────────────────
  // Drive wrapper-side state (host attributes / debug overlays / smoke
  // specs) using the same toolkit primitives the Spartan / Material refs
  // use, so the "wrapper view of validity" never drifts from what auto-ARIA
  // would write on the bound control.

  readonly #fieldStateSignal = computed<FieldState<TValue> | null>(() =>
    this.formField()(),
  );

  readonly #showByStrategy = createShowErrorsComputed(
    this.#fieldStateSignal,
    this.effectiveStrategy,
    this.submittedStatus,
  );

  readonly ariaInvalidValue = createAriaInvalidSignal(
    this.#fieldStateSignal,
    this.#showByStrategy,
  );

  readonly ariaRequiredValue = createAriaRequiredSignal(this.#fieldStateSignal);

  // ── Dev-mode missing-control assertion ────────────────────────────────
  //
  // A bare `<input pInputText [formField]>` (no `ngxSignalFormControl`)
  // would mean the wrapper's contentChildren query stays empty and tier-3
  // field-name resolution never fires. ADR-0002 §6 calls out a dev-mode
  // warning as the mitigation — one console.error per wrapper instance,
  // never spammed across renders.

  readonly #hasWarned = signal(false);

  constructor() {
    if (isDevMode()) {
      effect(() => {
        if (this.#hasWarned()) {
          return;
        }
        if (this.boundSemantics().length > 0) {
          // A control was projected — the query found it; future empty
          // states (e.g. while the consumer toggles control kinds with
          // @if) are intentional, so suppress further warnings.
          this.#hasWarned.set(true);
          return;
        }
        const fieldName = this.resolvedFieldName() ?? '<unknown>';
        // oxlint-disable-next-line no-console -- dev-mode misconfiguration signal
        console.error(
          `[prime-form-field] No NgxSignalFormControlSemanticsDirective matched inside the wrapper bound to "${fieldName}". ` +
            `Add \`ngxSignalFormControl="input-like"\` (or \`"checkbox"\`, \`"standalone-field-like"\`) to the projected control ` +
            `so the toolkit's auto-ARIA and tier-3 field-name resolution can wire up.`,
        );
        this.#hasWarned.set(true);
      });
    }
  }
}

/**
 * Bundle of every directive a consumer template needs to use the PrimeNG
 * reference wrapper. Mirrors `NgxMatFormBundle` / `NgxSpartanFormBundle`
 * so consumers import a single symbol per demo and the API matches the
 * future `@ngx-signal-forms/primeng` package's surface (see ADR-0002 §8).
 *
 * `PrimeFieldErrorComponent` is mounted dynamically through
 * `*ngComponentOutlet` (resolved via `NGX_FORM_FIELD_ERROR_RENDERER`), so
 * it's intentionally NOT in the bundle.
 */
export const NgxPrimeFormBundle = [
  PrimeFormFieldComponent,
  NgxSignalFormControlSemanticsDirective,
] as const;
