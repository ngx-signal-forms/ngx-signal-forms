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
import {
  isElementCssVisible,
  NgxFieldIdentity,
} from '../services/field-identity';

interface AutoAriaDomSnapshot {
  readonly fieldName: string | null;
  readonly describedBy: string | null;
  readonly ariaInvalid: string | null;
  readonly ariaRequired: string | null;
  readonly role: string | null;
  readonly tagName: string;
  /**
   * Whether *this* control had a CSS layout box as of the last read phase.
   *
   * Probed from the directive's own host element rather than read off a
   * wrapper-published flag, so it works for any wrapper (or none) and so each
   * control in a multi-control cluster tracks its own layout state instead of
   * inheriting the cluster's first control's.
   */
  readonly isControlVisible: boolean;
}

const INITIAL_DOM_SNAPSHOT: AutoAriaDomSnapshot = {
  fieldName: null,
  describedBy: null,
  ariaInvalid: null,
  ariaRequired: null,
  role: null,
  tagName: '',
  // Assume laid out until a real read phase says otherwise, so ARIA is never
  // stripped on the strength of a pre-layout probe.
  isControlVisible: true,
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
   * The fallback channel's entry for the currently bound control's field
   * name, or `undefined` when there is none to fall back to.
   *
   * Note what this deliberately does *not* check: whether
   * {@link #fieldIdentity} exists. An identity that is merely injectable
   * claims nothing. Only a *published* strategy does, and the two call sites
   * below test for that per channel.
   *
   * Gating on service presence instead would break any partially-driven
   * identity — a third-party wrapper that owns only the field name, say. It
   * would switch both strategy channels off the registry and onto the ambient
   * form context, dropping the field-level overrides a standalone
   * `<ngx-form-field-error>` had published. See ADR-0010.
   */
  readonly #registryVisibilityEntry = computed(() => {
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
   * When an owning wrapper has **published an error strategy** on the
   * identity, that wins: it already accounts for the wrapper's field-level
   * `strategy` input, which the ambient form context cannot see. Otherwise a
   * registry entry — published by a standalone `<ngx-form-field-error>` —
   * wins: its `errorContainerVisible` is the exact boolean already gating
   * that component's own live region, so reusing it here can't drift from
   * what is actually rendered.
   *
   * The precedence test is on the published *value*, not on whether an
   * identity happens to be injectable — see `#registryVisibilityEntry`.
   */
  readonly #visibilityByStrategy = computed(() => {
    const publishedErrorStrategy =
      this.#fieldIdentity?.resolvedErrorStrategy() ?? null;

    if (publishedErrorStrategy === null) {
      const registryEntry = this.#registryVisibilityEntry();
      if (registryEntry) return registryEntry.errorContainerVisible();
    }

    // `#ownVisibilityByStrategy` already reads the published strategy and
    // falls back to the ambient form context when it is null, so it covers
    // both remaining branches.
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
   * Same per-channel fallback as {@link #visibilityByStrategy}, resolved
   * **independently of the error channel**: ADR-0007 establishes the two
   * cascades as separate, so an identity that publishes an error strategy
   * but not a warning strategy must still let the registry own warnings.
   * Absent a published warning strategy, a standalone error component's
   * `warningContainerVisible` wins over recomputing the cascade from the
   * ambient form context.
   */
  readonly #warningVisibilityByStrategy = computed(() => {
    // A wrapper's published strategy already resolved its field-level
    // `warningStrategy` input, so it takes precedence over both the registry
    // and the ambient form context.
    const publishedWarningStrategy =
      this.#fieldIdentity?.resolvedWarningStrategy() ?? null;

    if (publishedWarningStrategy === null) {
      const registryEntry = this.#registryVisibilityEntry();
      if (registryEntry) return registryEntry.warningContainerVisible();
    }

    const fieldState = this.#resolveFieldState();
    if (!fieldState) return false;

    return shouldShowWarnings(
      fieldState.errors().some(isWarningError),
      fieldState.touched(),
      publishedWarningStrategy ??
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

  /**
   * Whether this control is currently laid out, sourced from the directive's
   * own read phase.
   *
   * Deliberately *not* the owning wrapper's published
   * `NgxFieldIdentity.isControlVisible`. Reading that flag made the
   * `aria-invalid` staleness fix conditional on there being a built-in
   * wrapper: a custom wrapper inside a collapsed `<details>`, an inactive
   * tab, or a non-current wizard step kept a stale `aria-invalid` on a hidden
   * control, and the only escape was `NGX_SIGNAL_FORM_ARIA_MODE: 'manual'` —
   * forfeiting all of auto-aria to fix one attribute. It is also more correct
   * for a multi-control cluster, where the wrapper publishes one control's
   * visibility for all of them.
   */
  readonly #isControlVisible = computed(
    () => this.#domSnapshot().isControlVisible,
  );

  readonly #factoryAriaInvalid = createAriaInvalidSignal(
    this.#fieldStateSignal,
    this.#visibilityByStrategy,
    this.#isControlVisible,
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
   * The directive shell owns two branches on top of that unconditional
   * factory:
   *
   * - manual-mode opt-out — when `ngxSignalFormControlAria='manual'`, the
   *   consumer's DOM value wins.
   * - role-aware suppression — `aria-required` is only valid ARIA on a
   *   handful of roles (`radiogroup`, `combobox`, `textbox`, …) plus native
   *   form controls with no explicit role. Explicit roles that do not permit
   *   it, such as `group` and `button`, must not receive the attribute. The
   *   native `<button>` case is gated separately because its implicit role is
   *   not present in the DOM `role` attribute. See
   *   https://github.com/ngx-signal-forms/ngx-signal-forms/issues/300.
   */
  protected readonly ariaRequired = computed(() => {
    if (this.#isManualAriaMode()) {
      return this.#domSnapshot().ariaRequired;
    }

    const { role, tagName } = this.#domSnapshot();
    if (
      role === 'group' ||
      role === 'button' ||
      (!role && tagName === 'BUTTON')
    ) {
      return null;
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

  /**
   * Element that assistive tech actually uses. Autocomplete-style
   * FormValueControl hosts bind `[formField]` on a custom element while
   * Angular Aria Combobox puts `role="combobox"` on an inner input. Write
   * managed ARIA there so `aria-required` / `aria-invalid` /
   * `aria-describedby` land on a valid widget, not a host with no role.
   * `querySelector` only searches descendants, so a native
   * `input[formField]` (or a host that is itself the combobox) stays the
   * target.
   */
  #ariaTarget(): HTMLElement {
    const host = this.#element.nativeElement;
    return host.querySelector<HTMLElement>('[role="combobox"][id]') ?? host;
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
    const raw = this.#ariaTarget().getAttribute('aria-describedby');

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

  /**
   * @param isControlVisible The layout probe's result. Passed in rather than
   *   taken here so the constructor's pre-layout seed can assume `true`,
   *   while the `earlyRead` phase — the only point at which a layout read is
   *   both meaningful and cheap — supplies the real value.
   */
  #readDomSnapshot(isControlVisible: boolean): AutoAriaDomSnapshot {
    // When the identity service is present (wrapper context), prefer its
    // field name over the element's id attribute. This ensures auto-aria and
    // the wrapper always agree on which name drives ID generation.
    const ariaTarget = this.#ariaTarget();
    const fieldName = this.#fieldIdentity
      ? this.#fieldIdentity.fieldName()
      : resolveFieldName(ariaTarget);

    return {
      fieldName,
      describedBy: this.#readPreservedDescribedBy(fieldName),
      ariaInvalid: ariaTarget.getAttribute('aria-invalid'),
      ariaRequired: ariaTarget.getAttribute('aria-required'),
      // Read fresh every tick (rather than cached) so the `group` gate in
      // `ariaRequired` above reacts the same render cycle a host's `role`
      // changes — e.g. `NgxFormFieldWrapper` switching cluster kind. Host
      // `[attr.*]` bindings on the same element are already flushed to the
      // DOM by the time `afterEveryRender` runs, so this reflects the
      // current render's role, not a stale one.
      role: ariaTarget.getAttribute('role'),
      tagName: ariaTarget.tagName,
      isControlVisible,
    };
  }

  #writeManagedAttribute(
    name: 'aria-describedby' | 'aria-invalid' | 'aria-required',
    value: string | null,
  ): void {
    const host = this.#element.nativeElement;
    const target = this.#ariaTarget();

    if (target !== host) {
      host.removeAttribute(name);
    }

    if (value === null) {
      target.removeAttribute(name);
      return;
    }

    target.setAttribute(name, value);
  }

  constructor() {
    // Seed with `isControlVisible: true`. The element exists by now but has
    // not been through layout, and `checkVisibility()` on a not-yet-laid-out
    // element reports `false` — probing here would strip `aria-invalid` on
    // the first tick and put it back on the next.
    this.#domSnapshot.set(this.#readDomSnapshot(true));

    // Single afterEveryRender with proper phased callbacks:
    // - earlyRead: read DOM attributes and probe layout before any writes
    //   (prevents layout thrashing)
    // - write: update the snapshot signal and write managed ARIA attributes to the DOM
    afterEveryRender(
      {
        earlyRead: () => {
          // The layout probe belongs here, not in an `effect()`. Effects
          // flush strictly before render hooks in the same change-detection
          // cycle, so an effect-based probe would read pre-layout geometry.
          return this.#readDomSnapshot(isElementCssVisible(this.#ariaTarget()));
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
            current.ariaRequired !== snapshot.ariaRequired ||
            current.role !== snapshot.role ||
            current.tagName !== snapshot.tagName ||
            current.isControlVisible !== snapshot.isControlVisible
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
              this.#ariaTarget().getAttribute('aria-describedby');
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
