import {
  afterEveryRender,
  computed,
  contentChildren,
  Directive,
  ElementRef,
  inject,
  Injector,
  input,
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
 * single `<mat-form-field ngxMatFormField>` element and Material's queries
 * see all its real children directly.
 *
 * **Four contracts (per `docs/CUSTOM_WRAPPERS.md`):**
 *
 * 1. Provides `NGX_SIGNAL_FORM_FIELD_CONTEXT` — exposes the resolved field
 *    name to projected `<ngx-form-field-hint>` content.
 * 2. Provides `NGX_SIGNAL_FORM_HINT_REGISTRY` — wires projected hint IDs
 *    into the registry (forward-compat — Material consumers usually use
 *    `<mat-hint>` directly).
 * 3. The renderer token is consumed by sibling components
 *    (`MaterialFeedbackRenderer`) — see `mat-form-field` template patterns
 *    in `contact-form.ts` and the `<ng-container *ngComponentOutlet ...>`
 *    pattern there.
 * 4. `NgxSignalFormControlSemanticsDirective` is declared on the bound
 *    control by the consumer, with `ariaMode="manual"` so the directive
 *    keeps Material's `aria-describedby` ownership intact.
 *
 * **ARIA model:**
 *
 * Material's `MatFormFieldControl` (the directive on the projected
 * `matInput`/`mat-select`/`mat-checkbox`) **owns** `aria-describedby` for
 * `<mat-error>`/`<mat-hint>`. Layering the toolkit's auto-aria on top would
 * cause double-writes that fight each other across renders.
 *
 * Resolution: the consumer declares `ngxSignalFormControlAria="manual"` on
 * the bound control. That opt-out tells `NgxSignalFormAutoAria` to leave the
 * control's `aria-invalid` / `aria-required` / `aria-describedby` alone —
 * Material owns them.
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
 *   `<mat-form-field [userAriaDescribedBy]>`. This is the
 *   `preservedIdsReader` path: the factory reads the bound control's
 *   current `aria-describedby` (which Material already wrote with mat-error
 *   and mat-hint IDs), preserves them verbatim, and only appends IDs the
 *   toolkit owns. In this Material reference no toolkit-only IDs need
 *   appending — Material handles all of them — but the wrapper still wires
 *   the factory so consumers who add non-Material assistive elements (e.g.
 *   bespoke `<ngx-form-field-hint>`) get correct composition for free.
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
   * attribute (post-render) for parity with `NgxFormFieldWrapper`.
   */
  readonly fieldName = input<string>();

  /** Optional per-field strategy override (mirrors the toolkit wrapper). */
  readonly strategy = input<ErrorDisplayStrategy | null>(null);

  // ── DI / state plumbing ───────────────────────────────────────────────

  readonly #config = inject(NGX_SIGNAL_FORMS_CONFIG);
  readonly #formContext = injectFormContext();
  readonly #elementRef = inject(ElementRef<HTMLElement>);
  readonly #injector = inject(Injector);

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
   * Drives `<mat-error>` rendering. Templates probe via the directive's
   * exported reference: `<mat-form-field ngxMatFormField #wrap="ngxMatFormField">`
   * then `@if (wrap.errorVisible()) { <mat-error>...</mat-error> }`.
   */
  readonly errorVisible = computed(
    () => this.hasErrors() && this.#showByStrategy(),
  );

  /** Same idea for warning content rendered inside `<mat-hint>`. */
  readonly warningVisible = computed(
    () => this.hasWarnings() && this.#showByStrategy() && !this.errorVisible(),
  );

  // ── Field-name resolution ─────────────────────────────────────────────

  readonly #boundControlId = signal<string | null>(null);

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
      this.#boundControl()?.getAttribute('aria-describedby') ?? null,
    fieldName: () => this.resolvedFieldName(),
  });

  // ── Per-render bound-control discovery ────────────────────────────────

  readonly #boundControl = signal<HTMLElement | null>(null);

  constructor() {
    afterEveryRender(
      {
        earlyRead: () => {
          const host = this.#elementRef.nativeElement;
          // Match anything bound to a Signal Forms field — covers
          // <input matInput>, <mat-select>, <mat-checkbox>, and custom
          // FormValueControl hosts.
          const candidate = host.querySelector(
            '[formField]',
          ) as HTMLElement | null;

          return {
            element: candidate,
            id: candidate?.id || null,
          };
        },
        write: (snapshot) => {
          if (this.#boundControl() !== snapshot.element) {
            this.#boundControl.set(snapshot.element);
          }
          if (this.#boundControlId() !== snapshot.id) {
            this.#boundControlId.set(snapshot.id);
          }
        },
      },
      { injector: this.#injector },
    );
  }
}

/**
 * Bundle exports so consumers can import a single symbol: the directive
 * applied on `<mat-form-field>` and the toolkit's
 * `NgxSignalFormControlSemanticsDirective` (which the consumer must declare
 * on the bound control with `ariaMode="manual"`).
 */
export const MatFormFieldBundle = [
  MatFormFieldWrapper,
  NgxSignalFormControlSemanticsDirective,
] as const;
