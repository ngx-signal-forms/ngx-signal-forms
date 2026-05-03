import {
  computed,
  contentChildren,
  Directive,
  effect,
  inject,
  input,
  isDevMode,
  signal,
  type Signal,
} from '@angular/core';
import type { FieldState, FieldTree } from '@angular/forms/signals';
import {
  createShowErrorsComputed,
  injectFormContext,
  isBlockingError,
  isWarningError,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  NGX_SIGNAL_FORM_HINT_REGISTRY,
  NGX_SIGNAL_FORMS_CONFIG,
  NgxSignalFormControlSemanticsDirective,
  readDirectErrors,
  resolveErrorDisplayStrategy,
  type ErrorDisplayStrategy,
  type NgxSignalFormHintDescriptor,
} from '@ngx-signal-forms/toolkit';
import { NgxFormFieldHint } from '@ngx-signal-forms/toolkit/assistive';
import {
  createAriaDescribedBySignal,
  createAriaInvalidSignal,
  createAriaRequiredSignal,
  createHintIdsSignal,
} from '@ngx-signal-forms/toolkit/headless';
import {
  NgxMatBoundControl,
  NgxMatCheckboxControl,
  NgxMatSelectControl,
  NgxMatSlideToggleControl,
  NgxMatTextControl,
} from './control-directives';
import { NgxMatFeedback } from './feedback-directive';
import { NgxMatErrorSlot, NgxMatHintSlot } from './slot-directives';

/**
 * Material reference wrapper — implemented as a **directive** applied
 * directly on `<mat-form-field>` rather than a wrapping component.
 *
 * **Why a directive, not a component?**
 *
 * Material's `<mat-form-field>` uses `contentChildren(MatFormFieldControl)`
 * to discover its bound control. Angular content queries are *lexical*: the
 * query inspects children declared in the consumer's template at the same
 * level as `<mat-form-field>`. If we wrapped the form-field in another
 * component (`<ngx-mat-form-field><mat-form-field>...`), the consumer's
 * `<mat-select>` / `<input matInput>` would project through `<ng-content>`,
 * and Material's query would not see it (Angular only walks the lexical
 * tree, not the rendered DOM).
 *
 * Living on the same element side-steps that problem: the consumer writes a
 * single `<mat-form-field [ngxMatFormField]>` element and Material's queries
 * see all its real children directly.
 *
 * **ARIA model:**
 *
 * Material's `MatFormFieldControl` (the directive on the projected
 * `matInput`/`mat-select`/`mat-checkbox`) **owns** `aria-describedby` for
 * `<mat-error>`/`<mat-hint>`. Layering the toolkit's auto-aria on top would
 * cause double-writes that fight each other across renders.
 *
 * Resolution: every per-control directive in `NgxMatFormBundle`
 * (`NgxMatTextControl`, `NgxMatSelectControl`, `NgxMatCheckboxControl`,
 * `NgxMatSlideToggleControl`) bakes `ariaMode="manual"` in via a direct
 * `NGX_SIGNAL_FORM_ARIA_MODE` provider. That tells `NgxSignalFormAutoAria`
 * to leave the control's `aria-invalid` / `aria-required` /
 * `aria-describedby` alone — Material owns them.
 *
 * The toolkit's four ARIA primitive factories still drive **wrapper-side**
 * state:
 *
 * - `createAriaInvalidSignal` — exposed as `ariaInvalidValue` so consumers
 *   can probe the toolkit's view of validity in tests / debug overlays.
 * - `createAriaRequiredSignal` — same, exposed as `ariaRequiredValue`.
 * - `createHintIdsSignal` — collected for forward-compat with projected
 *   `<ngx-form-field-hint>` consumers.
 * - `createAriaDescribedBySignal` (with `preservedIds`) — composes a
 *   "toolkit-managed describedby suffix" that consumers can opt into via
 *   `<mat-form-field [userAriaDescribedBy]>`. The factory reads the bound
 *   control's current `aria-describedby` (which Material already wrote
 *   with mat-error and mat-hint IDs), preserves them verbatim, and only
 *   appends IDs the toolkit owns. In this Material reference no
 *   toolkit-only IDs need appending — Material handles all of them — but
 *   the wrapper still wires the factory so consumers who add non-Material
 *   assistive elements (e.g. bespoke `<ngx-form-field-hint>`) get correct
 *   composition for free.
 *
 * **Bound-control discovery:**
 *
 * Pure-signal, lexical content query: `contentChildren(NgxMatBoundControl)`.
 * Every concrete per-control directive registers itself under the abstract
 * `NgxMatBoundControl` token (the canonical Angular pattern, mirroring
 * `MatFormFieldControl`), so a single query covers every Material control
 * kind. No `afterEveryRender`, no DOM probing — the query re-runs only
 * when projected content changes.
 *
 * @see ADR-0002 §6 for the discovery decision and the elementRef-on-toolkit
 *      rationale that lets PrimeNG / Spartan wrappers query
 *      `NgxSignalFormControlSemanticsDirective` directly.
 */
@Directive({
  selector: 'mat-form-field[ngxMatFormField]',
  exportAs: 'ngxMatFormField',
  providers: [
    {
      provide: NGX_SIGNAL_FORM_FIELD_CONTEXT,
      useFactory: () => {
        const wrapper = inject(MatFormFieldWrapper);
        return { fieldName: wrapper.resolvedFieldName };
      },
    },
    {
      provide: NGX_SIGNAL_FORM_HINT_REGISTRY,
      useFactory: () => {
        const wrapper = inject(MatFormFieldWrapper);
        return { hints: wrapper.hintDescriptors };
      },
    },
  ],
  host: {
    '[attr.data-ngx-mat-field-name]': 'resolvedFieldName()',
    '[attr.data-ngx-mat-invalid]': 'ariaInvalidValue()',
    '[attr.data-ngx-mat-required]': 'ariaRequiredValue()',
  },
})
export class MatFormFieldWrapper<TValue = unknown> {
  /** Field bound to the wrapper. */
  readonly formField = input.required<FieldTree<TValue>>({
    alias: 'ngxMatFormField',
  });

  /**
   * Field name used to generate toolkit-managed error / warning IDs.
   * When omitted, the directive inspects the bound control's `id`
   * attribute (resolved via the lexical content query) for parity with
   * `NgxFormFieldWrapper`.
   */
  readonly fieldName = input<string>();

  /** Optional per-field strategy override (mirrors the toolkit wrapper). */
  readonly strategy = input<ErrorDisplayStrategy | null>(null);

  // ── DI / state plumbing ───────────────────────────────────────────────

  readonly #config = inject(NGX_SIGNAL_FORMS_CONFIG);
  readonly #formContext = injectFormContext();

  readonly effectiveStrategy = computed(() =>
    resolveErrorDisplayStrategy(
      this.strategy(),
      this.#formContext ? this.#formContext.errorStrategy() : undefined,
      this.#config.defaultErrorStrategy,
    ),
  );

  readonly submittedStatus = computed(() =>
    this.#formContext ? this.#formContext.submittedStatus() : 'unsubmitted',
  );

  /**
   * Bridges the `InputSignal<FieldTree>` to the underlying `FieldState`.
   * Mirrors the cache pattern in `NgxFormFieldWrapper` so every downstream
   * computed reads from one signal node.
   */
  readonly #fieldStateSignal = computed(() => this.formField()());

  readonly #allMessages = computed(() =>
    readDirectErrors(this.#fieldStateSignal()),
  );

  readonly hasErrors = computed(() =>
    this.#allMessages().some(isBlockingError),
  );

  readonly hasWarnings = computed(() =>
    this.#allMessages().some(isWarningError),
  );

  /**
   * Strategy-aware visibility timing. Same helper the toolkit's own wrapper
   * (`NgxFormFieldWrapper.#showErrorsByStrategy`) and `NgxSignalFormAutoAria`
   * use — keeping every surface in lockstep means a strategy change in one
   * place takes effect everywhere.
   */
  readonly #showByStrategy = createShowErrorsComputed(
    this.#fieldStateSignal,
    this.effectiveStrategy,
    this.submittedStatus,
  );

  /**
   * Drives `<mat-error>` rendering for consumers that opt out of the slot
   * directives and still want a wrapper-side visibility computed (the
   * documented "Extending the error slot" escape hatch in `README`).
   */
  readonly errorVisible = computed(
    () => this.hasErrors() && this.#showByStrategy(),
  );

  /** Same idea for warning content rendered inside `<mat-hint>`. */
  readonly warningVisible = computed(
    () => this.hasWarnings() && this.#showByStrategy() && !this.errorVisible(),
  );

  // ── Bound-control discovery via contentChildren ───────────────────────
  //
  // Lexical content query — fires when projected children change. The
  // abstract `NgxMatBoundControl` is provided by every concrete per-control
  // directive in `control-directives.ts`, so a single query token covers
  // every Material control kind without a `MatFormFieldControl`-style
  // matcher table.

  protected readonly boundControls = contentChildren(NgxMatBoundControl, {
    descendants: true,
  });

  readonly #boundControl = computed<NgxMatBoundControl | null>(
    () => this.boundControls()[0] ?? null,
  );

  readonly #boundControlElement = computed<HTMLElement | null>(
    () => this.#boundControl()?.elementRef.nativeElement ?? null,
  );

  readonly #boundControlId = computed<string | null>(() => {
    const id = this.#boundControlElement()?.id;
    return id && id.length > 0 ? id : null;
  });

  readonly resolvedFieldName = computed<string | null>(() => {
    const explicit = this.fieldName();
    if (explicit !== undefined) {
      const trimmed = explicit.trim();
      if (trimmed.length > 0) {
        return trimmed;
      }
    }

    return this.#boundControlId();
  });

  // ── Hint registry (forward-compat with <ngx-form-field-hint>) ─────────
  //
  // Material consumers can additionally project `<ngx-form-field-hint>` into
  // the form-field (alongside or instead of `<mat-hint>`). Wiring those hints
  // through `NGX_SIGNAL_FORM_HINT_REGISTRY` is what lets
  // `createHintIdsSignal` / `createAriaDescribedBySignal` know which hint
  // IDs the toolkit owns and should compose into `aria-describedby`.

  /**
   * Hint children projected into the wrapped `<mat-form-field>`. Mirrors the
   * `contentChildren(NgxFormFieldHint, { descendants: true })` query in the
   * toolkit's own `NgxFormFieldWrapper` so the registry contract behaves the
   * same way regardless of which wrapper hosts the hint.
   *
   * Angular's `contentChildren` API requires non-private visibility.
   *
   * @internal
   */
  protected readonly hintChildren = contentChildren(NgxFormFieldHint, {
    descendants: true,
  });

  readonly hintDescriptors: Signal<readonly NgxSignalFormHintDescriptor[]> =
    computed(() =>
      this.hintChildren().map((hint) => ({
        id: hint.resolvedId(),
        fieldName: hint.resolvedFieldName(),
      })),
    );

  // ── ARIA primitive factories ──────────────────────────────────────────
  // The four factories from `@ngx-signal-forms/toolkit/headless` drive
  // wrapper-side state. They are exposed publicly so the demo / smoke spec
  // can verify the toolkit's identity model is wired even when Material
  // owns the actual DOM ARIA writes.

  readonly ariaInvalidValue = createAriaInvalidSignal(
    this.#fieldStateSignal,
    this.#showByStrategy,
  );

  readonly ariaRequiredValue = createAriaRequiredSignal(this.#fieldStateSignal);

  readonly #hintIds = createHintIdsSignal({
    registry: { hints: this.hintDescriptors },
    fieldName: () => this.resolvedFieldName(),
  });

  /**
   * Toolkit-managed `aria-describedby` value, layered on top of whatever
   * Material has already written.
   *
   * The `preservedIds` reader returns Material's current
   * `aria-describedby` value verbatim — that's what makes this the
   * **escape hatch for Material's ARIA ownership**. The factory preserves
   * everything Material owns, appends projected `<ngx-form-field-hint>`
   * IDs (which Material does not know about), and stops there.
   *
   * **Why we pass `null` for `fieldState`**: in the unmodified factory, a
   * real `fieldState` causes the composed string to suffix
   * `${fieldName}-error` / `${fieldName}-warning` whenever the field is
   * invalid + visibility is `true`. Those IDs do not exist in this
   * Material setup — error/warning copy lives inside `<mat-error>` /
   * `<mat-hint>` with Material-owned IDs that Material has already
   * preserved into the chain. Appending toolkit-owned IDs would emit
   * dangling IDREFs (WCAG 1.3.1 / 4.1.2). Pinning `fieldState` to a
   * constant `null` short-circuits the error/warning branch in the factory
   * (`createAriaDescribedBySignal` skips both when `state` is falsy) so the
   * resulting attribute is exactly `preservedIds + hintIds`.
   *
   * Consumers who DO render their own toolkit-owned error/warning surfaces
   * outside Material's slots can re-thread `this.#fieldStateSignal` here
   * and the IDs will be appended correctly.
   */
  readonly toolkitAriaDescribedBy = createAriaDescribedBySignal({
    fieldState: computed<FieldState<unknown> | null>(() => null),
    hintIds: this.#hintIds,
    visibility: this.#showByStrategy,
    preservedIds: () =>
      this.#boundControlElement()?.getAttribute('aria-describedby') ?? null,
    fieldName: () => this.resolvedFieldName(),
  });

  // ── Dev-mode missing-control assertion ────────────────────────────────
  //
  // Bare `<input matInput [formField]>` (no `ngxMat*Control` directive)
  // stops working with `[ngxMatFormField]`: the contentChildren query
  // returns empty and the wrapper's bound-control derivations stall on
  // `null`. ADR-0002 §6 calls out a dev-mode warning as the mitigation —
  // one console.error per wrapper instance, never spammed across renders.

  readonly #hasWarned = signal(false);

  constructor() {
    if (isDevMode()) {
      effect(() => {
        if (this.#hasWarned()) {
          return;
        }
        if (this.boundControls().length > 0) {
          // A control was projected — the query found it; future empty
          // states (e.g. while the consumer toggles control kinds with
          // @if) are intentional, so suppress further warnings.
          this.#hasWarned.set(true);
          return;
        }
        const fieldName = this.resolvedFieldName() ?? '<unknown>';
        console.error(
          `[ngxMatFormField] No NgxMatBoundControl directive matched inside the form-field bound to "${fieldName}". ` +
            `Add one of \`ngxMatTextControl\`, \`ngxMatSelectControl\`, \`ngxMatCheckboxControl\`, or \`ngxMatSlideToggleControl\` ` +
            `to the projected control.`,
        );
        this.#hasWarned.set(true);
      });
    }
  }
}

/**
 * Bundle exports so consumers can import a single symbol covering every
 * directive needed to use the Material reference wrapper:
 *
 * - `MatFormFieldWrapper` — the wrapper directive on `<mat-form-field>`.
 * - The four per-control directives (`NgxMatTextControl`,
 *   `NgxMatSelectControl`, `NgxMatCheckboxControl`,
 *   `NgxMatSlideToggleControl`) bound to their respective Material
 *   controls.
 * - The slot directives (`NgxMatErrorSlot`, `NgxMatHintSlot`) for
 *   `<mat-error>` / `<mat-hint>` conditional rendering.
 * - `NgxMatFeedback` for non-form-field controls (`<mat-checkbox>`,
 *   `<mat-slide-toggle>`, …).
 * - `NgxSignalFormControlSemanticsDirective` — bridge to the toolkit's
 *   semantics layer (consumers can still apply this directive directly
 *   for custom Material controls that aren't covered by the per-control
 *   directives shipped here).
 *
 * The `Mat*` prefix is preserved on the wrapper itself for selector
 * stability; `NgxMatFormBundle` is the canonical bundle export name and
 * mirrors the future `@ngx-signal-forms/material` package shape — see
 * ADR-0002 §8 for the forward-compat decision.
 */
export const NgxMatFormBundle = [
  MatFormFieldWrapper,
  NgxMatTextControl,
  NgxMatSelectControl,
  NgxMatCheckboxControl,
  NgxMatSlideToggleControl,
  NgxMatErrorSlot,
  NgxMatHintSlot,
  NgxMatFeedback,
  NgxSignalFormControlSemanticsDirective,
] as const;
