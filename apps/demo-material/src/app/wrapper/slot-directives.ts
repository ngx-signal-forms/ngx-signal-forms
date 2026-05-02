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
  createShowErrorsComputed,
  injectFormContext,
  isBlockingError,
  isWarningError,
  NGX_SIGNAL_FORMS_CONFIG,
  readDirectErrors,
  resolveErrorDisplayStrategy,
  type ErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';

/**
 * Embedded-view context for the error / hint slot directives.
 *
 * The `$implicit` slot is the resolved message string for `*ngxMatErrorSlot`
 * (one stamping per blocking error) and the resolved warning string — or
 * `null` when no warning is present — for `*ngxMatHintSlot` (one stamping
 * total, always).
 */
export interface NgxMatErrorSlotContext {
  readonly $implicit: string;
  readonly severity: 'error';
}

export interface NgxMatHintSlotContext {
  readonly $implicit: string | null;
  readonly severity: 'warning' | 'neutral';
}

/**
 * Structural directive that owns conditional rendering of `<mat-error>`.
 *
 * Stamps the host element **once per blocking error message** the toolkit
 * resolves for the bound field, so Material's `MatFormField` aggregates
 * every rendered `<mat-error>` ID into the projected control's
 * `aria-describedby` automatically. The directive's microsyntax provides
 * `$implicit: message` so the consumer template renders the resolved string
 * with `{{ message }}` (or any custom child template — icons, typography).
 *
 * @example
 * ```html
 * <mat-error *ngxMatErrorSlot="form.email; let message">{{ message }}</mat-error>
 * ```
 *
 * Visibility timing reuses `createShowErrorsComputed` — the same helper
 * `NgxFormFieldWrapper` and `NgxSignalFormAutoAria` consult — so the
 * `errorStrategy` (`on-touch` / `on-submit` / `immediate`) decision stays
 * single-sourced across every surface in the demo.
 *
 * @see ADR-0002 §3 for the structural-slot decision.
 */
@Directive({
  selector: '[ngxMatErrorSlot]',
})
export class NgxMatErrorSlot<TValue = unknown> {
  /** Field whose blocking errors should populate the slot. */
  readonly formField = input.required<FieldTree<TValue>>({
    alias: 'ngxMatErrorSlot',
  });

  /** Optional per-slot strategy override; mirrors the wrapper's input. */
  readonly strategy = input<ErrorDisplayStrategy | null>(null);

  readonly #templateRef = inject(TemplateRef<NgxMatErrorSlotContext>);
  readonly #viewContainerRef = inject(ViewContainerRef);

  readonly #config = inject(NGX_SIGNAL_FORMS_CONFIG);
  readonly #formContext = injectFormContext();

  readonly #fieldStateSignal = computed(() => this.formField()());

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

  readonly #showByStrategy = createShowErrorsComputed(
    this.#fieldStateSignal,
    this.#effectiveStrategy,
    this.#submittedStatus,
  );

  readonly #blockingMessages = computed<readonly string[]>(() => {
    if (!this.#showByStrategy()) {
      return [];
    }
    return readDirectErrors(this.#fieldStateSignal())
      .filter(isBlockingError)
      .map((error) => error.message ?? '')
      .filter((message) => message.length > 0);
  });

  /** @internal — type guard for template language services. */
  static ngTemplateContextGuard<TValue>(
    _dir: NgxMatErrorSlot<TValue>,
    ctx: unknown,
  ): ctx is NgxMatErrorSlotContext {
    return true;
  }

  constructor() {
    effect(() => {
      syncEmbeddedViews(
        this.#viewContainerRef,
        this.#blockingMessages(),
        (message) => ({ $implicit: message, severity: 'error' as const }),
        this.#templateRef,
      );
    });
  }
}

/**
 * Structural directive that renders a single `<mat-hint>` whose content
 * switches between the consumer's neutral helper text and a toolkit-resolved
 * warning string.
 *
 * Always stamps exactly one host element so Material's `MatFormField`
 * aggregates one stable hint ID. The microsyntax provides
 * `$implicit: warningMessage | null`; consumers branch on the implicit
 * with `@if (warning) { … } @else { neutral copy }` to swap content
 * without a second `<mat-hint>`.
 *
 * @example
 * ```html
 * <mat-hint *ngxMatHintSlot="form.name; let warning">
 *   @if (warning) {
 *     <span class="warning">{{ warning }}</span>
 *   } @else {
 *     What should we call you?
 *   }
 * </mat-hint>
 * ```
 *
 * @see ADR-0002 §3 for the "one `<mat-hint>`, never two" decision.
 */
@Directive({
  selector: '[ngxMatHintSlot]',
})
export class NgxMatHintSlot<TValue = unknown> {
  readonly formField = input.required<FieldTree<TValue>>({
    alias: 'ngxMatHintSlot',
  });

  readonly strategy = input<ErrorDisplayStrategy | null>(null);

  readonly #templateRef = inject(TemplateRef<NgxMatHintSlotContext>);
  readonly #viewContainerRef = inject(ViewContainerRef);

  readonly #config = inject(NGX_SIGNAL_FORMS_CONFIG);
  readonly #formContext = injectFormContext();

  readonly #fieldStateSignal = computed(() => this.formField()());

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

  readonly #showByStrategy = createShowErrorsComputed(
    this.#fieldStateSignal,
    this.#effectiveStrategy,
    this.#submittedStatus,
  );

  readonly #hasBlockingError = computed(() =>
    readDirectErrors(this.#fieldStateSignal()).some(isBlockingError),
  );

  readonly #warningMessage = computed<string | null>(() => {
    if (!this.#showByStrategy() || this.#hasBlockingError()) {
      return null;
    }
    const firstWarning = readDirectErrors(this.#fieldStateSignal()).find(
      isWarningError,
    );
    return firstWarning?.message?.trim() || null;
  });

  /** @internal — type guard for template language services. */
  static ngTemplateContextGuard<TValue>(
    _dir: NgxMatHintSlot<TValue>,
    ctx: unknown,
  ): ctx is NgxMatHintSlotContext {
    return true;
  }

  #viewRef: EmbeddedViewRef<NgxMatHintSlotContext> | null = null;

  constructor() {
    effect(() => {
      const warning = this.#warningMessage();
      const severity: NgxMatHintSlotContext['severity'] = warning
        ? 'warning'
        : 'neutral';
      if (this.#viewRef === null) {
        this.#viewRef = this.#viewContainerRef.createEmbeddedView(
          this.#templateRef,
          { $implicit: warning, severity },
        );
      } else {
        // Mutate the existing context object — Angular deprecates replacing
        // the entire `context` reference on an EmbeddedViewRef.
        Object.assign(this.#viewRef.context, { $implicit: warning, severity });
        this.#viewRef.markForCheck();
      }
    });
  }
}

/**
 * Reconcile a list of embedded views against a target list of items.
 *
 * Stamps one embedded view per item, in order. When the item list shortens,
 * trailing views are destroyed; when it grows, the existing views are
 * updated in place and new ones are stamped at the end. Avoids the
 * teardown-and-recreate flicker a naive `clear()` + recreate loop would
 * introduce.
 */
function syncEmbeddedViews<TItem, TContext extends object>(
  vcr: ViewContainerRef,
  items: readonly TItem[],
  toContext: (item: TItem) => TContext,
  template: TemplateRef<TContext>,
): void {
  while (vcr.length > items.length) {
    vcr.remove(vcr.length - 1);
  }
  for (let index = 0; index < items.length; index++) {
    const context = toContext(items[index]);
    if (index < vcr.length) {
      const view = vcr.get(index) as EmbeddedViewRef<TContext> | null;
      if (view) {
        // Mutate the existing context object in place — replacing the
        // reference is deprecated by Angular.
        Object.assign(view.context, context);
        view.markForCheck();
      }
    } else {
      vcr.createEmbeddedView(template, context);
    }
  }
}
