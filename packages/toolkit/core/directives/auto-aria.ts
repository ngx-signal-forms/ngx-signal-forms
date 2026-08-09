import {
  afterEveryRender,
  computed,
  Directive,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { FORM_FIELD, type FieldState } from '@angular/forms/signals';
import { createAriaRequiredSignal } from '../utilities/aria/create-aria-required-signal';
import {
  DEFAULT_NGX_SIGNAL_FORMS_CONFIG,
  NGX_SIGNAL_FORM_ARIA_MODE,
  NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY,
  NGX_SIGNAL_FORM_HINT_REGISTRY,
  NGX_SIGNAL_FORMS_CONFIG,
} from '../tokens';
import { shouldShowWarnings } from '../utilities/error-strategies';
import { injectFormContext } from '../utilities/inject-form-context';
import {
  resolveSubmittedStatusFromContext,
  resolveWarningStrategyFromContext,
} from '../utilities/resolve-strategy';
import { createAriaInvalidSignal } from '../utilities/aria/create-aria-invalid-signal';
import {
  generateErrorId,
  generateWarningId,
  resolveFieldName,
} from '../utilities/field-resolution';
import { createErrorVisibility } from '../utilities/create-error-visibility';
import { createAriaDescribedBySignal } from '../utilities/aria/create-aria-described-by-signal';
import { createHintIdsSignal } from '../utilities/aria/create-hint-ids-signal';
import { isBlockingError, isWarningError } from '../utilities/warning-error';
import { NgxFieldIdentity } from '../services/field-identity';

interface AutoAriaDomSnapshot {
  readonly fieldName: string | null;
  readonly describedBy: string | null;
  readonly ariaInvalid: string | null;
  readonly ariaRequired: string | null;
}

const INITIAL_DOM_SNAPSHOT: AutoAriaDomSnapshot = {
  fieldName: null,
  describedBy: null,
  ariaInvalid: null,
  ariaRequired: null,
};

/**
 * Automatically manages ARIA attributes for Signal Forms controls.
 *
 * Adds:
 * - `aria-invalid`: Reflects the field's validation state
 * - `aria-describedby`: Links to error messages for screen readers
 *
 * **Selector Strategy**: Automatically applies to all form controls with `[formField]` attribute,
 * except radio buttons and standard checkboxes. Checkbox-based switches opt back in
 * with `role="switch"`, and explicit control semantics can opt checkbox/radio hosts in
 * without relying on native-role heuristics.
 *
 * **Ownership model**:
 * - default: toolkit owns `aria-invalid`, `aria-required`, and `aria-describedby`
 * - `ngxSignalFormControlAria="manual"`: the control owns those ARIA attributes
 * - `ngxSignalFormAutoAriaDisabled`: disable toolkit participation entirely for bespoke hosts
 *
 * @example
 * ```html
 * <!-- Automatic ARIA (enabled by default) -->
 * <label for="email">Email</label>
 * <input id="email" [formField]="form.email" />
 * <!-- Result: aria-invalid="true" aria-describedby="email-error" when invalid -->
 *
 * <!-- Opt-out -->
 * <input [formField]="form.custom" ngxSignalFormAutoAriaDisabled />
 * ```
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector -- Targets Angular Signal Forms' [formField] directive
  selector: `
    input[type="checkbox"][ngxSignalFormControl][formField]:not([ngxSignalFormAutoAriaDisabled]),
    input[type="radio"][ngxSignalFormControl][formField]:not([ngxSignalFormAutoAriaDisabled]),
    input[type="checkbox"][role="switch"][formField]:not([ngxSignalFormAutoAriaDisabled]),
    input[formField]:not([ngxSignalFormAutoAriaDisabled]):not([type="radio"]):not([type="checkbox"]),
    textarea[formField]:not([ngxSignalFormAutoAriaDisabled]),
    select[formField]:not([ngxSignalFormAutoAriaDisabled]),
    [formField]:not(input):not(textarea):not(select):not([ngxSignalFormAutoAriaDisabled])
  `,
})
export class NgxSignalFormAutoAria {
  /**
   * Resolves the `FieldState` for the currently bound control.
   *
   * Covers the `FORM_FIELD`-provided sibling case where `field()` is still
   * unset on first read: Angular's `FormField.field` is an `InputSignal<Field<T>>`
   * that can be `undefined` before the binding materializes, and the
   * fallback to `state()` lets sibling directives keep working during that
   * window. Do not collapse the two branches.
   */
  #resolveFieldState(): FieldState<unknown> | null {
    const field = this.#formField.field();
    const fieldState =
      typeof field === 'function' ? field() : this.#formField.state();

    return fieldState ?? null;
  }

  #shouldShowBy(errorType: 'blocking' | 'warning'): boolean {
    if (errorType === 'warning') {
      return this.#warningVisibilityByStrategy();
    }

    const fieldState = this.#resolveFieldState();

    if (!fieldState) {
      return false;
    }

    if (!fieldState.errors().some(isBlockingError)) return false;

    return this.#visibilityByStrategy();
  }

  readonly #element: ElementRef<HTMLElement> = inject(ElementRef);
  readonly #injector = inject(Injector);
  readonly #ariaModeSignal = inject(NGX_SIGNAL_FORM_ARIA_MODE, {
    optional: true,
    self: true,
  });
  readonly #hintRegistry = inject(NGX_SIGNAL_FORM_HINT_REGISTRY, {
    optional: true,
  });

  /**
   * Field-visibility registry contributed by the nearest `[ngxSignalForm]`
   * host, if any. The fallback channel for field-level `strategy`/
   * `warningStrategy` overrides that {@link #fieldIdentity} cannot see — a
   * standalone (wrapper-less) `<ngx-form-field-error>` is a sibling of the
   * bound control, not an ancestor, so there is no shared element injector
   * for it to publish an identity through. See
   * `#registryVisibilityEntry`.
   */
  readonly #visibilityRegistry = inject(
    NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY,
    { optional: true },
  );

  /**
   * Shared field-identity service, provided by the nearest `NgxFormFieldWrapper`.
   * When present, field-name resolution and ID generation are delegated to the
   * identity service so the wrapper and auto-aria share the same source of
   * truth. When absent (standalone auto-aria usage without a wrapper), the
   * directive falls back to reading the element's `id` attribute directly.
   */
  readonly #fieldIdentity = inject(NgxFieldIdentity, { optional: true });

  /// Inject Angular's FormField to avoid creating a duplicate `formField` input,
  /// which triggers the pass-through flag and disables FormField's blur/value binding.
  readonly #formField = inject(FORM_FIELD);

  readonly #domSnapshot = signal(INITIAL_DOM_SNAPSHOT);
  readonly #managedDescribedByIds = signal<readonly string[]>([]);

  readonly #isManualAriaMode = computed(() => {
    return this.#ariaModeSignal?.() === 'manual';
  });

  /**
   * Whether the previous `afterEveryRender` write tick ran in manual mode —
   * `null` before the first tick has run. Plain instance state (not a
   * signal): it is only read/written imperatively inside the write callback
   * and never needs to trigger reactivity on its own.
   *
   * Used solely to detect the auto → manual transition tick (previous tick
   * was `false`, this tick is manual), so the toolkit-written
   * `aria-invalid`/`aria-required` values — written unconditionally every
   * tick in auto mode — can be cleared exactly once when ownership passes to
   * the consumer, instead of being silently adopted as the new "manual"
   * snapshot value forever. Starting from `null` (rather than `false`)
   * avoids misfiring that clear on the very first tick when the control
   * starts life already in manual mode with consumer-authored attributes.
   */
  #previousTickWasManualAriaMode: boolean | null = null;

  /**
   * The wrapper-less fallback channel's entry for the currently bound
   * control's field name, or `undefined` when there is none to fall back
   * to. Deliberately skipped whenever {@link #fieldIdentity} is present —
   * the wrapper fast-path already accounts for the wrapper's own
   * field-level overrides, and preferring it keeps existing wrapped-field
   * behavior unchanged. Only consulted for the wrapper-less case, where a
   * sibling `<ngx-form-field-error>` has no other way to reach auto-aria.
   */
  readonly #registryVisibilityEntry = computed(() => {
    if (this.#fieldIdentity) return undefined;

    const fieldName = this.#domSnapshot().fieldName;
    if (!fieldName) return undefined;

    return this.#visibilityRegistry?.get(fieldName);
  });

  /**
   * Shared visibility-timing computed. Centralizes the `shouldShowErrors`
   * decision so `#shouldShowBy` only contributes the per-error-type filter.
   * Keeps auto-aria in lockstep with the wrapper component and the form
   * field error component.
   *
   * Uses `createErrorVisibility` to auto-consume the nearest
   * `[ngxSignalForm]` context (strategy + submittedStatus) via DI, matching
   * the same cascade as the form-field wrapper and headless error-state.
   *
   * When an owning `NgxFormFieldWrapper` has published its own resolved
   * strategy, that wins: it already accounts for the wrapper's field-level
   * `strategy` input, which the ambient form context cannot see. Absent a
   * wrapper, a registry entry — published by a standalone
   * `<ngx-form-field-error>` — wins instead: its `showsError` is the exact
   * boolean already gating that component's own live region, so reusing it
   * here can't drift from what is actually rendered.
   */
  readonly #visibilityByStrategy = computed(() => {
    const registryEntry = this.#registryVisibilityEntry();
    if (registryEntry) return registryEntry.showsError();

    return this.#ownVisibilityByStrategy();
  });

  readonly #ownVisibilityByStrategy = createErrorVisibility(
    () => this.#resolveFieldState(),
    {
      strategy: computed(
        () => this.#fieldIdentity?.resolvedErrorStrategy() ?? undefined,
      ),
    },
  );

  readonly #formContext = injectFormContext();
  readonly #config =
    inject(NGX_SIGNAL_FORMS_CONFIG, { optional: true }) ??
    DEFAULT_NGX_SIGNAL_FORMS_CONFIG;

  /**
   * Warning-visibility timing, resolved through the **warning** cascade
   * rather than {@link #visibilityByStrategy}.
   *
   * This must not reuse the error gate. `NgxFormFieldError` decides whether
   * to render its `role="status"` region from the warning cascade, so gating
   * the `${fieldName}-warning` id on the error strategy makes the two
   * diverge the moment the strategies differ: a form with
   * `errorStrategy="on-submit"` and `warningStrategy="immediate"` renders a
   * visible warning that `aria-describedby` never references, leaving the
   * advisory text unavailable to assistive technology (WCAG 1.3.1).
   *
   * Same registry fallback as {@link #visibilityByStrategy}: absent a
   * wrapper, a standalone error component's published `showsWarning` wins
   * over recomputing the cascade from the ambient form context.
   */
  readonly #warningVisibilityByStrategy = computed(() => {
    const registryEntry = this.#registryVisibilityEntry();
    if (registryEntry) return registryEntry.showsWarning();

    const fieldState = this.#resolveFieldState();
    if (!fieldState) return false;

    return shouldShowWarnings(
      fieldState.errors().some(isWarningError),
      fieldState.touched(),
      // A wrapper's published strategy already resolved its field-level
      // `warningStrategy` input, so it takes precedence over the ambient
      // form context.
      this.#fieldIdentity?.resolvedWarningStrategy() ??
        resolveWarningStrategyFromContext(
          undefined,
          this.#formContext,
          this.#config.defaultWarningStrategy,
        ),
      resolveSubmittedStatusFromContext(undefined, this.#formContext) ??
        'unsubmitted',
    );
  });

  /**
   * Hint IDs from the identity service when available, falling back to the
   * hint registry snapshot when the identity service is absent. Delegates
   * to the pure `createHintIdsSignal` factory so consumers building bespoke
   * wrappers can reuse the same resolution order without inheriting this
   * directive.
   */
  readonly #hintIds = createHintIdsSignal({
    identity: this.#fieldIdentity,
    registry: this.#hintRegistry,
    fieldName: () => this.#domSnapshot().fieldName,
  });

  /**
   * Reactive view of the resolved field state, exposed as a `Signal` so it
   * can be threaded into pure-signal ARIA factories (e.g.
   * `createAriaInvalidSignal`) without giving them access to the directive's
   * private resolver.
   */
  readonly #fieldStateSignal = computed(() => this.#resolveFieldState());

  /** Delegates to `#visibilityByStrategy` after filtering to blocking errors. */
  readonly #shouldShowErrors = computed(() => {
    return this.#shouldShowBy('blocking');
  });

  /** Delegates to `#visibilityByStrategy` after filtering to warnings. */
  readonly #shouldShowWarnings = computed(() => {
    return this.#shouldShowBy('warning');
  });

  readonly #factoryAriaInvalid = createAriaInvalidSignal(
    this.#fieldStateSignal,
    this.#visibilityByStrategy,
    this.#fieldIdentity?.isControlVisible,
  );

  /**
   * Pure-signal `aria-describedby` composer. Mirrors the directive's
   * historical preserved-IDs + hints + error/warning composition, but lives
   * in the headless surface so wrapper authors can reuse it without
   * inheriting the directive shell. Manual-mode opt-out is still owned by
   * this directive — the factory itself is unconditional.
   */
  readonly #factoryAriaDescribedBy = createAriaDescribedBySignal({
    fieldState: this.#fieldStateSignal,
    hintIds: this.#hintIds,
    visibility: this.#visibilityByStrategy,
    warningVisibility: this.#warningVisibilityByStrategy,
    preservedIds: () => this.#domSnapshot().describedBy,
    fieldName: () => this.#domSnapshot().fieldName,
  });

  /**
   * Computed ARIA invalid state.
   * Returns 'true' | 'false' | null based on field validity and error display strategy.
   *
   * Respects the configured ErrorDisplayStrategy, so aria-invalid='true' only
   * appears when errors should be visible according to the strategy.
   *
   * When the identity service is present and the control is not visible
   * (e.g. inside a collapsed fieldset), returns null so `aria-invalid` is
   * removed from the hidden control rather than going stale.
   */
  protected readonly ariaInvalid = computed(() => {
    // Manual-mode opt-out lives in the directive shell — the factory is
    // unconditional, so the pass-through to the DOM snapshot has to be gated
    // here, before delegating.
    if (this.#isManualAriaMode()) {
      return this.#domSnapshot().ariaInvalid;
    }

    return this.#factoryAriaInvalid();
  });

  readonly #ariaRequiredFromFactory = createAriaRequiredSignal(
    this.#fieldStateSignal,
  );

  /**
   * Computed ARIA required state.
   * Returns 'true' | null based on the field's `required()` signal.
   *
   * Delegates to {@link createAriaRequiredSignal} for the actual resolution.
   * The directive shell only owns the manual-mode opt-out branch — when
   * `ngxSignalFormControlAria='manual'`, the consumer's DOM value wins.
   */
  protected readonly ariaRequired = computed(() => {
    if (this.#isManualAriaMode()) {
      return this.#domSnapshot().ariaRequired;
    }

    return this.#ariaRequiredFromFactory();
  });

  /**
   * Computed ARIA describedby attribute.
   * Links to error/warning message elements for screen readers.
   *
   * Preserves existing aria-describedby values (hints, descriptions) and
   * appends error/warning IDs when they should be shown. Delegates to the
   * pure `createAriaDescribedBySignal` factory; the manual-mode opt-out
   * stays in this directive shell so the factory contract stays
   * unconditional.
   */
  protected readonly ariaDescribedBy = computed(() => {
    if (this.#isManualAriaMode()) {
      return this.#domSnapshot().describedBy;
    }

    return this.#factoryAriaDescribedBy();
  });

  #haveSameIds(current: readonly string[], next: readonly string[]): boolean {
    return (
      current.length === next.length &&
      current.every((currentId, index) => currentId === next[index])
    );
  }

  #resolveManagedDescribedByIds(
    snapshot: AutoAriaDomSnapshot,
  ): readonly string[] {
    if (this.#isManualAriaMode()) {
      return [];
    }

    const hintIds = this.#hintIds();

    if (!snapshot.fieldName) {
      return hintIds;
    }

    const managedIds = [...hintIds];

    const showsBlockingError = this.#shouldShowErrors();

    if (showsBlockingError) {
      managedIds.push(generateErrorId(snapshot.fieldName));
    }

    // Mutually exclusive with the blocking-error id, mirroring
    // `createAriaDescribedBySignal`'s `!hasBlockingError && ...` guard: the
    // default `NgxFormFieldError` renderer suppresses its warning live
    // region whenever a blocking error is also visible, so no
    // `${fieldName}-warning` element exists in the DOM at that point.
    // Without this guard, a field with both a blocking error and a `warn:*`
    // error would have this "which ids does the toolkit own" computation
    // diverge from the DOM-writing factory — composing a dangling
    // `${fieldName}-warning` reference (axe `aria-valid-attr-value`).
    if (!showsBlockingError && this.#shouldShowWarnings()) {
      managedIds.push(generateWarningId(snapshot.fieldName));
    }

    return Array.from(new Set(managedIds));
  }

  #readPreservedDescribedBy(fieldName: string | null): string | null {
    // First-render note: at construction time `#managedDescribedByIds()` is
    // still empty, so the preserved list returned here can momentarily
    // include IDs that the write phase will take ownership of on the same
    // tick (hint IDs, generated error/warning IDs). The phased
    // `afterEveryRender` dance reconciles this in the immediately following
    // `write` callback — do not "simplify" by calling this once eagerly,
    // and do not assume the snapshot is authoritative until the first write
    // has run.
    const raw = this.#element.nativeElement.getAttribute('aria-describedby');

    if (!raw) {
      return null;
    }

    const parts = raw.split(' ').filter(Boolean);

    if (!fieldName) {
      const preserved = parts.filter(
        (part: string) => !this.#managedDescribedByIds().includes(part),
      );

      return preserved.length > 0 ? preserved.join(' ') : null;
    }

    const generatedIds = new Set([
      ...this.#managedDescribedByIds(),
      generateErrorId(fieldName),
      generateWarningId(fieldName),
    ]);

    const preserved = parts.filter((part: string) => !generatedIds.has(part));

    return preserved.length > 0 ? preserved.join(' ') : null;
  }

  #readDomSnapshot(): AutoAriaDomSnapshot {
    // When the identity service is present (wrapper context), prefer its
    // field name over the element's id attribute. This ensures auto-aria and
    // the wrapper always agree on which name drives ID generation.
    const fieldName = this.#fieldIdentity
      ? this.#fieldIdentity.fieldName()
      : resolveFieldName(this.#element.nativeElement);

    return {
      fieldName,
      describedBy: this.#readPreservedDescribedBy(fieldName),
      ariaInvalid: this.#element.nativeElement.getAttribute('aria-invalid'),
      ariaRequired: this.#element.nativeElement.getAttribute('aria-required'),
    };
  }

  #writeManagedAttribute(
    name: 'aria-describedby' | 'aria-invalid' | 'aria-required',
    value: string | null,
  ): void {
    if (value === null) {
      this.#element.nativeElement.removeAttribute(name);
      return;
    }

    this.#element.nativeElement.setAttribute(name, value);
  }

  constructor() {
    this.#domSnapshot.set(this.#readDomSnapshot());

    // Visibility tracking lives entirely in `NgxFieldIdentity` — auto-aria
    // reads `isControlVisible()` directly in the `ariaInvalid` computed,
    // so no afterEveryRender wiring is needed here.

    // Single afterEveryRender with proper phased callbacks:
    // - earlyRead: read DOM attributes before any writes (prevents layout thrashing)
    // - write: update the snapshot signal and write managed ARIA attributes to the DOM
    afterEveryRender(
      {
        earlyRead: () => {
          return this.#readDomSnapshot();
        },
        write: (snapshot) => {
          const current = this.#domSnapshot();
          const previousManagedDescribedByIds = this.#managedDescribedByIds();
          const managedDescribedByIds =
            this.#resolveManagedDescribedByIds(snapshot);

          if (
            current.fieldName !== snapshot.fieldName ||
            current.describedBy !== snapshot.describedBy ||
            current.ariaInvalid !== snapshot.ariaInvalid ||
            current.ariaRequired !== snapshot.ariaRequired
          ) {
            this.#domSnapshot.set(snapshot);
          }

          if (
            !this.#haveSameIds(
              previousManagedDescribedByIds,
              managedDescribedByIds,
            )
          ) {
            this.#managedDescribedByIds.set(managedDescribedByIds);
          }

          if (this.#isManualAriaMode()) {
            const currentDescribedBy =
              this.#element.nativeElement.getAttribute('aria-describedby');
            const describedByParts = currentDescribedBy
              ? currentDescribedBy.split(' ').filter(Boolean)
              : [];
            const hasManagedDescribedByIds = previousManagedDescribedByIds.some(
              (id) => describedByParts.includes(id),
            );

            if (hasManagedDescribedByIds) {
              this.#writeManagedAttribute(
                'aria-describedby',
                snapshot.describedBy,
              );
            }

            if (previousManagedDescribedByIds.length > 0) {
              this.#managedDescribedByIds.set([]);
            }

            // Auto → manual transition: aria-invalid/aria-required were
            // toolkit-owned (written unconditionally every tick in auto
            // mode) up through the previous tick, so the value just read
            // off the DOM in `earlyRead` is a stale toolkit write, not a
            // consumer-authored value. Clear both so the consumer starts
            // from a clean slate instead of inheriting the last
            // auto-computed values as the new "manual" snapshot. Only fires
            // on the transition tick itself (`previousTickWasManualAriaMode
            // === false`) — a control that starts life in manual mode, or
            // stays in manual mode across ticks, never hits this branch.
            if (this.#previousTickWasManualAriaMode === false) {
              this.#writeManagedAttribute('aria-invalid', null);
              this.#writeManagedAttribute('aria-required', null);
            }

            this.#previousTickWasManualAriaMode = true;

            return;
          }

          this.#previousTickWasManualAriaMode = false;

          this.#writeManagedAttribute('aria-invalid', this.ariaInvalid());
          this.#writeManagedAttribute(
            'aria-describedby',
            this.ariaDescribedBy(),
          );
          this.#writeManagedAttribute('aria-required', this.ariaRequired());
        },
      },
      { injector: this.#injector },
    );
  }
}
