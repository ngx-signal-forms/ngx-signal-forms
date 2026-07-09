import { NgComponentOutlet } from '@angular/common';
import {
  Component,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  isDevMode,
  type Type,
} from '@angular/core';
import type { FieldState, FieldTree } from '@angular/forms/signals';
import { BrnField, BrnFieldA11yService } from '@spartan-ng/brain/field';
import { BrnLabel } from '@spartan-ng/brain/label';
import {
  createErrorVisibility,
  createShowErrorsComputed,
  injectFormContext,
  NGX_FORM_FIELD_ERROR_RENDERER,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  NGX_SIGNAL_FORM_HINT_REGISTRY,
  NGX_SIGNAL_FORMS_CONFIG,
  NgxSignalFormControlSemanticsDirective,
  resolveErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import { NgxFormFieldHint } from '@ngx-signal-forms/toolkit/assistive';
import {
  createAriaDescribedBySignal,
  createAriaDescribedByBridge,
  createAriaInvalidSignal,
  createAriaRequiredSignal,
  createErrorRendererInputs,
  createFieldNameResolver,
  createHintIdsSignal,
  toHintDescriptors,
} from '@ngx-signal-forms/toolkit/headless';
import { NgxSpartanFormFieldError } from './spartan-form-field-error';

/**
 * The subset of `BrnFieldA11yService`'s public contract this bridge
 * re-implements. `Pick` alone is NOT a completeness guard — a `Pick` with a
 * fixed key list still compiles unchanged when the source class gains new
 * members; it only fails on removal/rename of a *listed* key. So this alias
 * by itself would stay silently green if Brain 1.1 added e.g.
 * `registerLabel()` and some helm primitive started calling it on the
 * injected (bridged) service — that would throw a runtime `TypeError` with
 * zero compile-time signal.
 *
 * The real exhaustiveness guard is `assertBrnFieldA11yPublicSurfaceIsExhaustive`
 * below, which fails to typecheck if Brain's public surface grows beyond
 * what's listed here.
 */
type BrnFieldA11yPublicSurface = Pick<
  BrnFieldA11yService,
  | 'describedBy'
  | 'registerDescription'
  | 'unregisterDescription'
  | 'registerError'
  | 'unregisterError'
>;

/**
 * Private fields on `BrnFieldA11yService` (per Brain 1.0.4's `.d.ts`) that
 * the bridge intentionally does NOT implement — DI matches by token
 * identity at runtime, not by structural compatibility, so these never need
 * a bridged counterpart. Listed explicitly (rather than inferred) so this
 * assertion fails loudly — not silently passes — if Brain ever makes one of
 * these public, since a newly-public member would then need a real bridge
 * implementation and a `BrnFieldA11yPublicSurface` entry above.
 */
type BrnFieldA11yKnownPrivateMembers = '_descriptions' | '_errors';

/**
 * Compile-time exhaustiveness guard: fails to typecheck if
 * `BrnFieldA11yService` has any member that is neither in
 * {@link BrnFieldA11yPublicSurface} nor {@link BrnFieldA11yKnownPrivateMembers}.
 * That is the guard the `useFactory` return-type annotation on its own
 * cannot provide (see the comment on `BrnFieldA11yPublicSurface`): if Brain
 * adds a new public member, `keyof BrnFieldA11yService` grows, the
 * `Exclude` below stops resolving to `never`, and assigning `true` to the
 * conditional's non-`true` branch fails typecheck — turning an
 * otherwise-silent structural gap into a build failure.
 */
type BrnFieldA11yUncoveredMembers = Exclude<
  keyof BrnFieldA11yService,
  BrnFieldA11yKnownPrivateMembers | keyof BrnFieldA11yPublicSurface
>;
type AssertBrnFieldA11yPublicSurfaceIsExhaustive =
  BrnFieldA11yUncoveredMembers extends never
    ? true
    : [
        'BrnFieldA11yService gained new member(s) not covered by BrnFieldA11yPublicSurface or BrnFieldA11yKnownPrivateMembers:',
        BrnFieldA11yUncoveredMembers,
      ];
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- type-only assertion; see comment above
const assertBrnFieldA11yPublicSurfaceIsExhaustive: AssertBrnFieldA11yPublicSurfaceIsExhaustive = true;

/**
 * Spartan-flavoured form-field wrapper composing `BrnField` (the unstyled
 * Spartan brain primitive) with the toolkit's renderer / hint / context seam.
 *
 * The four contracts from `docs/CUSTOM_WRAPPERS.md` are satisfied here:
 *
 * 1. `NGX_SIGNAL_FORM_FIELD_CONTEXT` — exposes `resolvedFieldName` so projected
 *    `<ngx-form-field-hint>` and the renderer-token-resolved error component
 *    can self-correlate.
 * 2. `NGX_SIGNAL_FORM_HINT_REGISTRY` — projects hint children into the
 *    descriptor signal that auto-ARIA reads through DI.
 * 3. `NGX_FORM_FIELD_ERROR_RENDERER` — falls back to
 *    `NgxSpartanFormFieldError` when no provider overrides it.
 * 4. `NgxSignalFormAutoAria` — declared by the consumer's bound control
 *    template (it is a directive selector on `[formField]`); the wrapper does
 *    NOT touch `aria-invalid` / `aria-required` / `aria-describedby` directly.
 *
 * Spartan-specific composition: the `[brnField]` host directive keeps the
 * wrapper's `data-invalid` / `data-touched` state-attributes in lockstep
 * with Spartan's `helm` styling tokens.
 *
 * **Corrected ownership model (brain 1.0.4 + Angular 22 signal forms):**
 *
 * `BrnFieldControl` is *not* Reactive-forms-only. Angular signal forms'
 * `FormField` directive provides an interop `NgControl` on every bound
 * control (`@angular/forms/signals`'s `interop_ng_control.ts`), and brain
 * 1.0.4 detects it via `createStateTracker()` and uses its `SignalStateTracker`
 * branch instead of the reactive-forms `ReactiveStateTracker`. So
 * `BrnFieldControl` is fully live on every helm control in this demo — it is
 * precisely why `data-touched` / `data-dirty` / `data-matches-spartan-invalid`
 * (and the wrapper's own `data-spartan-invalid` / `data-spartan-required`
 * mirrors) reflect real field state at all, with no reactive-forms
 * `FormControl` anywhere in this component.
 *
 * Nor does auto-ARIA own every ARIA write. `BrnInput`, `BrnSelectTrigger`,
 * and `BrnCheckbox` each host-bind their own `aria-invalid` straight off
 * `BrnFieldControl`'s raw (ungated) `invalid` signal, and
 * `BrnFieldControlDescribedBy` (a `hostDirectives` entry on `HlmCheckbox`
 * and mounted directly in `HlmInput`/`HlmSelectTrigger`'s templates)
 * host-binds `aria-describedby` off this wrapper's `BrnFieldA11yService`
 * bridge. Whether the toolkit's `NgxSignalFormAutoAria` "wins" depends
 * entirely on *where* Brain's write lands relative to where `[formField]`
 * sits:
 *
 * - Text input: `[formField]` is on the same `<input>` element `BrnInput`
 *   host-binds to, so auto-ARIA's `afterEveryRender` write runs after
 *   Brain's per-change-detection write and simply overwrites it with the
 *   strategy-gated value. Ownership is effectively shared, with auto-ARIA
 *   writing last.
 * - Select: `[formField]` is on `<hlm-select>`, one level above the actual
 *   `role="combobox"` button rendered inside `<hlm-select-trigger>`'s own
 *   template — auto-ARIA can only reach the `hlm-select` host, never the
 *   button an AT reads. `HlmSelectTrigger` (`libs/spartan/ui/select`) now
 *   corrects this itself: it reads `BrnFieldControl.spartanInvalid()`
 *   (Brain's own touched-gated invalid signal, the same one driving the
 *   `data-matches-spartan-invalid` destructive-ring styling) and writes the
 *   gated `aria-invalid` onto the button in `afterEveryRender`, deterministically
 *   after Brain's raw write.
 * - Checkbox: `HlmCheckbox`'s host is `display: contents`, so neither
 *   Brain's `BrnFieldControlDescribedBy` write nor auto-ARIA's write (both
 *   land on that host) reach the accessibility tree. `HlmCheckbox` exposes
 *   `aria-describedby` as a real `@Input` that threads into `<brn-checkbox>`'s
 *   own binding, which *does* land on the real `role="checkbox"` button —
 *   so the consumer template feeds this wrapper's `toolkitAriaDescribedBy`
 *   into that input explicitly (see `#newsletterField="ngxSpartanFormField"`
 *   in `account-preferences-form.ts`) instead of relying on either
 *   automatic chain.
 *
 * Layering the toolkit's `[formField]` alongside `[brnField]` does not
 * double-write anything by itself; the failure mode this wrapper actually
 * guards against is the `aria-describedby` chain being composed twice
 * (Spartan's `BrnFieldA11yService` default plus the toolkit's own
 * composition) — which is why the wrapper replaces Brain's
 * `BrnFieldA11yService` with `createAriaDescribedByBridge` below, rather
 * than letting the two coexist.
 *
 * **Bound-control discovery:**
 *
 * Pure-signal lexical content query —
 * `contentChildren(NgxSignalFormControlSemanticsDirective)` finds every
 * projected control that opted into the toolkit's semantics layer. The
 * directive exposes `elementRef` (added per ADR-0002 §6 specifically to
 * unblock Spartan / PrimeNG / consumer custom wrappers), so the wrapper
 * reads the bound element's `id` for the third-tier `resolvedFieldName`
 * fallback without `afterEveryRender` or imperative DOM probing.
 */
@Component({
  // Aliased selector: matching `spartan-form-field[ngxSpartanFormField]`
  // (rather than bare `spartan-form-field`) prevents Angular's `FormField`
  // directive from `@angular/forms/signals` (selector `[formField]`) from
  // double-binding to the wrapper element when consumers write
  // `<spartan-form-field [formField]="form.x">`. The wrapper accepts the
  // field via the aliased input (`[ngxSpartanFormField]`) instead, so only
  // the inner `<input [formField]>` gets the toolkit's `FormField` directive.
  selector: 'spartan-form-field[ngxSpartanFormField]',
  exportAs: 'ngxSpartanFormField',

  imports: [NgComponentOutlet],
  hostDirectives: [
    {
      directive: BrnField,
      inputs: ['data-invalid', 'forceInvalid'],
    },
  ],
  providers: [
    {
      provide: NGX_SIGNAL_FORM_FIELD_CONTEXT,
      useFactory: () => {
        const wrapper = inject(NgxSpartanFormField);
        return { fieldName: wrapper.resolvedFieldName };
      },
    },
    {
      provide: NGX_SIGNAL_FORM_HINT_REGISTRY,
      useFactory: () => {
        const wrapper = inject(NgxSpartanFormField);
        return { hints: wrapper.hintDescriptors };
      },
    },
    // Brain's `BrnField` host directive declares
    // `providers: [BrnFieldA11yService]` at the same element. Component-level
    // providers win over host-directive providers, so this `useFactory`
    // registration replaces Brain's empty service with a wrapper-scoped
    // bridge that re-exposes the toolkit's `aria-describedby` composition.
    //
    // The factory delegates to the toolkit's `createAriaDescribedByBridge`
    // primitive — it merges the toolkit composition with any IDs registered
    // through Brain's `register*` API, so other helm primitives that push
    // descriptions through the service stay compatible. The exhaustiveness
    // check above `assertBrnFieldA11yPublicSurfaceIsExhaustive` (not just
    // the return-type annotation) is what fires if Brain ever adds a new
    // public member to its contract.
    {
      provide: BrnFieldA11yService,
      useFactory: (): BrnFieldA11yPublicSurface =>
        createAriaDescribedByBridge({
          toolkit: inject(NgxSpartanFormField).toolkitAriaDescribedBy,
        }),
    },
  ],
  host: {
    // Layout-only chrome owned by the wrapper (vertical stack with
    // consistent spacing). Visual styling for inner controls now flows
    // from real `@spartan-ng/helm` components.
    class: 'flex flex-col gap-2 mt-5 first:mt-0',
    '[attr.data-spartan-form-field]': '""',
    // Mirrors the parity demos: surface the toolkit's view of validity /
    // required-ness on the wrapper for debug overlays and smoke specs,
    // even though Brain owns the actual ARIA writes on the bound control.
    '[attr.data-spartan-invalid]': 'ariaInvalidValue()',
    '[attr.data-spartan-required]': 'ariaRequiredValue()',
  },
  template: `
    <ng-content select="label,[brnLabel]" />
    <ng-content />
    <ng-content select="ngx-form-field-hint" />

    <!--
      The renderer is mounted unconditionally so its role="alert" /
      role="status" live regions preexist their first content insertion (WCAG
      4.1.3). Strategy-aware visibility flows into the renderer via the
      \`strategy\` and \`submittedStatus\` inputs, and the renderer toggles
      [hidden] / [attr.aria-hidden] on the live-region <p> elements.
    -->
    <ng-container
      *ngComponentOutlet="errorComponent(); inputs: errorInputs()"
    />
  `,
})
export class NgxSpartanFormField<TValue = unknown> {
  /**
   * Bound `FieldTree`. Aliased to `ngxSpartanFormField` (matching the
   * component selector) so the consumer-template binding
   * `<spartan-form-field [ngxSpartanFormField]="form.x">` does not collide
   * with Angular Signal Forms' `FormField` directive (selector
   * `[formField]`). Required because `NgxSpartanFormFieldError` reads
   * errors directly off the tree to render the `hlm-error` slot —
   * mirroring how `NgxFormFieldWrapper` binds the same input to its
   * configured renderer.
   */
  readonly formField = input.required<FieldTree<TValue>>({
    alias: 'ngxSpartanFormField',
  });

  /**
   * Explicit field name used to generate stable `aria-describedby` ids.
   * When omitted, resolution falls back to the projected `brnLabel`'s
   * `for=` attribute, then to the bound control's `id` resolved via
   * `contentChildren(NgxSignalFormControlSemanticsDirective)`.
   */
  readonly fieldName = input<string>();

  /**
   * Optional projected `<brn-label>` association. Spartan's `BrnLabel`
   * inside `BrnField` provides labelable id wiring; the toolkit's
   * `aria-describedby` chain still flows through the field-name signal,
   * but `brnLabel`'s `for=` keeps Spartan's labelable contract happy.
   *
   * `descendants: true` so consumers can wrap the label in layout chrome
   * (a `<div class="flex flex-col">` etc.) without breaking tier-2
   * field-name resolution. DOM-order means the topmost label wins, which
   * matches the intuitive "the first projected label is the one I mean"
   * contract every other content query in this wrapper uses.
   */
  protected readonly projectedLabels = contentChildren(BrnLabel, {
    descendants: true,
  });

  /**
   * Bound-control discovery via the toolkit's semantics directive. Every
   * helm input/select/checkbox in the demo declares
   * `ngxSignalFormControl="…"`, which mounts this directive on the host
   * element. The directive exposes `elementRef` (ADR-0002 §6) so the
   * wrapper reads the bound element without imperative DOM probing.
   */
  protected readonly boundSemantics = contentChildren(
    NgxSignalFormControlSemanticsDirective,
    { descendants: true },
  );

  readonly #boundControlElement = computed<HTMLElement | null>(
    () => this.boundSemantics()[0]?.elementRef.nativeElement ?? null,
  );

  /**
   * Hint children projected through `<ng-content select="ngx-form-field-hint">`.
   * Exposed publicly because Angular forbids `private`/`#` fields from being
   * read by `useFactory` providers — the hint registry depends on this.
   */
  protected readonly hintChildren = contentChildren(NgxFormFieldHint, {
    descendants: true,
  });

  /**
   * Hint descriptors in the public wire format consumed by
   * `NGX_SIGNAL_FORM_HINT_REGISTRY`. Auto-ARIA reads these IDs and threads
   * them into `aria-describedby` on the bound control. Built via the
   * toolkit's {@link toHintDescriptors} helper so the registry-wire
   * shape stays in lockstep with the canonical wrapper.
   */
  readonly hintDescriptors = toHintDescriptors(this.hintChildren);

  /**
   * Resolved field name. Built via the toolkit's
   * {@link createFieldNameResolver} so the priority cascade
   * (explicit → label `for=` → bound-control `id` → `null` + dev warning)
   * stays in lockstep with the canonical wrapper. Mirrors what
   * `NgxFormFieldWrapper` does — keeping every wrapper on the same
   * resolver primitive prevents drift if the cascade evolves.
   */
  readonly resolvedFieldName = createFieldNameResolver({
    explicit: this.fieldName,
    labelFor: () => {
      const label = this.projectedLabels()[0];
      if (label === undefined) return null;
      return label.for() ?? null;
    },
    boundControl: () => this.#boundControlElement(),
    wrapperName: 'spartan-form-field',
  });

  /**
   * Configured error renderer (or null when no provider is registered). The
   * wrapper owns the fallback. Component-scope override:
   *
   * ```ts
   * provideFormFieldErrorRendererForComponent({ component: MyVendorError })
   * ```
   */
  readonly #errorRenderer = inject(NGX_FORM_FIELD_ERROR_RENDERER, {
    optional: true,
  });

  protected readonly errorComponent = computed<Type<unknown>>(
    () => this.#errorRenderer?.component ?? NgxSpartanFormFieldError,
  );

  /**
   * Visibility-timing pieces match `NgxFormFieldWrapper`. Pulled from the
   * form context (provided by `[ngxSignalForm]`) and forwarded to the
   * renderer-component via the `*ngComponentOutlet` `inputs:` map so the
   * renderer can gate its live-region visibility on strategy + submission
   * state - mirrors what auto-ARIA decides for `aria-describedby` chaining.
   */
  readonly #config = inject(NGX_SIGNAL_FORMS_CONFIG);
  readonly #formContext = injectFormContext();

  protected readonly effectiveStrategy = computed(() =>
    resolveErrorDisplayStrategy(
      null,
      this.#formContext ? this.#formContext.errorStrategy() : undefined,
      this.#config.defaultErrorStrategy,
    ),
  );

  protected readonly submittedStatus = computed(() =>
    this.#formContext ? this.#formContext.submittedStatus() : 'unsubmitted',
  );

  /**
   * Inputs handed to `*ngComponentOutlet`. Built via the toolkit's
   * {@link createErrorRendererInputs} so the renderer contract
   * (`{ formField, strategy, submittedStatus }`) stays in lockstep with
   * the canonical wrapper and any `NgxFormFieldErrorRendererInputs`-typed
   * renderer that consumers swap in.
   */
  protected readonly errorInputs = createErrorRendererInputs({
    formField: this.formField,
    strategy: this.effectiveStrategy,
    submittedStatus: this.submittedStatus,
  });

  /**
   * Bridges the `InputSignal<FieldTree>` to the underlying `FieldState`.
   * Mirrors the cache pattern in `NgxFormFieldWrapper` so every downstream
   * computed reads from one signal node.
   */
  readonly #fieldStateSignal = computed<FieldState<TValue> | null>(() =>
    this.formField()(),
  );

  /**
   * Strategy-aware visibility timing. `createErrorVisibility` (auto-aria's
   * cascade) drives the bridge composition; `createShowErrorsComputed`
   * (strategy + submission state) is the same primitive used by the
   * canonical `NgxFormFieldWrapper`. Wrapper-side state stays in lockstep
   * with what auto-aria would write if it were active.
   */
  readonly #visibility = createErrorVisibility(this.#fieldStateSignal);
  readonly #showByStrategy = createShowErrorsComputed(
    this.#fieldStateSignal,
    this.effectiveStrategy,
    this.submittedStatus,
  );

  // ── ARIA primitive factories ──────────────────────────────────────────
  // The four factories from `@ngx-signal-forms/toolkit/headless` drive
  // wrapper-side state. Exposed publicly so the demo / smoke spec can
  // verify the toolkit's identity model is wired even though Brain owns
  // the host binding on the bound control (and the bridge feeds it).

  readonly ariaInvalidValue = createAriaInvalidSignal(
    this.#fieldStateSignal,
    this.#showByStrategy,
  );

  readonly ariaRequiredValue = createAriaRequiredSignal(this.#fieldStateSignal);

  readonly hintIds = createHintIdsSignal({
    registry: { hints: this.hintDescriptors },
    fieldName: () => this.resolvedFieldName(),
  });

  /**
   * Toolkit-managed `aria-describedby` value, consumed by the inline
   * `BrnFieldA11yService` factory above so Brain's
   * `BrnFieldControlDescribedBy` host binding writes the toolkit-managed
   * IDs onto the helm input host element.
   *
   * `preservedIds` returns `null` because the bridge synthesises the
   * value the bound control's `aria-describedby` ultimately receives —
   * there is no upstream DOM-resident list to preserve. Hints + error/
   * warning IDs come from the bound `FieldState` and the hint registry.
   */
  readonly toolkitAriaDescribedBy = createAriaDescribedBySignal({
    fieldState: this.#fieldStateSignal,
    hintIds: this.hintIds,
    visibility: this.#visibility,
    preservedIds: () => null,
    fieldName: () => this.resolvedFieldName(),
  });

  // ── Dev-mode missing-control assertion ────────────────────────────────
  //
  // A bare helm input (no `ngxSignalFormControl`) would mean the wrapper's
  // contentChildren query stays empty and tier-3 field-name resolution
  // never fires. Mirrors the canonical `NgxFormFieldWrapper` diagnostic
  // pattern: a plain class field as the latch (not a signal) so the
  // effect doesn't read its own write and re-run. One `console.error` per
  // wrapper instance, never spammed.

  #hasWarned = false;

  constructor() {
    if (isDevMode()) {
      effect(() => {
        if (this.#hasWarned) {
          return;
        }
        if (this.boundSemantics().length > 0) {
          // A control was projected — the query found it; future empty
          // states (e.g. while the consumer toggles control kinds with
          // @if) are intentional, so suppress further warnings.
          this.#hasWarned = true;
          return;
        }
        const fieldName = this.resolvedFieldName() ?? '<unknown>';
        console.error(
          `[spartan-form-field] No NgxSignalFormControlSemanticsDirective matched inside the wrapper bound to "${fieldName}". ` +
            `Add \`ngxSignalFormControl="input-like"\` (or \`"checkbox"\`) to the helm control so the toolkit's auto-ARIA, ` +
            `tier-3 field-name resolution, and the wrapper-scoped BrnFieldA11yService bridge can wire up.`,
        );
        this.#hasWarned = true;
      });
    }
  }
}

/**
 * Bundle of every directive a consumer template needs to use the Spartan
 * reference wrapper. Lists only the symbols that appear in templates —
 * `NgxSpartanFormFieldError` is mounted dynamically through
 * `*ngComponentOutlet` (resolved via `NGX_FORM_FIELD_ERROR_RENDERER`), so
 * it's intentionally NOT in the bundle. Consumers extending the renderer
 * import it directly from `./spartan-form-field-error`.
 *
 * The naming (`NgxSpartanFormBundle`) mirrors the Material reference's
 * `NgxMatFormBundle` so the demo's API matches the future
 * `@ngx-signal-forms/spartan` package's surface — no rename when the
 * wrapper graduates out of the demo (see ADR-0002 §8 for the precedent).
 */
export const NgxSpartanFormBundle = [
  NgxSpartanFormField,
  NgxSignalFormControlSemanticsDirective,
] as const;
