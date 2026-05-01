import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  inject,
  input,
  type Signal,
  type Type,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { BrnField } from '@spartan-ng/brain/field';
import { BrnLabel } from '@spartan-ng/brain/label';
import {
  injectFormContext,
  NGX_FORM_FIELD_ERROR_RENDERER,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  NGX_SIGNAL_FORM_HINT_REGISTRY,
  NGX_SIGNAL_FORMS_CONFIG,
  resolveErrorDisplayStrategy,
  type NgxSignalFormHintDescriptor,
} from '@ngx-signal-forms/toolkit';
import { NgxFormFieldHint } from '@ngx-signal-forms/toolkit/assistive';
import { SpartanFormFieldErrorComponent } from './spartan-form-field-error';

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
 *    `SpartanFormFieldErrorComponent` when no provider overrides it.
 * 4. `NgxSignalFormAutoAria` — declared by the consumer's bound control
 *    template (it is a directive selector on `[formField]`); the wrapper does
 *    NOT touch `aria-invalid` / `aria-required` / `aria-describedby` directly.
 *
 * Spartan-specific composition: the `[brnField]` host directive keeps the
 * wrapper's `data-invalid` / `data-touched` state-attributes in lockstep
 * with Spartan's `helm` styling tokens. Because `BrnFieldControl` is
 * `NgControl`-based (Reactive forms), we compose only `BrnField` here —
 * the toolkit's `[formField]` directive owns control state, and auto-ARIA
 * owns the ARIA writes. Layering both would double-write `aria-describedby`
 * (Spartan's `BrnFieldA11yService` chain plus the toolkit's chain), which
 * is the exact failure mode the renderer-seam is designed to avoid.
 */
@Component({
  selector: 'spartan-form-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgComponentOutlet, NgxFormFieldHint],
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
        const wrapper = inject(SpartanFormFieldComponent);
        return { fieldName: wrapper.resolvedFieldName };
      },
    },
    {
      provide: NGX_SIGNAL_FORM_HINT_REGISTRY,
      useFactory: () => {
        const wrapper = inject(SpartanFormFieldComponent);
        return { hints: wrapper.hintDescriptors };
      },
    },
  ],
  host: {
    class: 'hlm-form-field',
    '[attr.data-spartan-form-field]': '""',
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
export class SpartanFormFieldComponent<TValue = unknown> {
  /**
   * Bound `FieldTree`. Required because `SpartanFormFieldErrorComponent`
   * reads errors directly off the tree to render the `hlm-error` slot —
   * mirroring how `NgxFormFieldWrapper` binds the same input to its
   * configured renderer.
   */
  readonly formField = input.required<FieldTree<TValue>>();

  /**
   * Explicit field name used to generate stable `aria-describedby` ids.
   * When omitted, resolution relies on the wrapper's existing association
   * logic, such as projected label metadata; there is no projected control
   * `id` fallback.
   */
  readonly fieldName = input<string>();

  /**
   * Optional projected `<brn-label>` association. Spartan's `BrnLabel`
   * inside `BrnField` provides labelable id wiring; the toolkit's
   * `aria-describedby` chain still flows through the field-name signal,
   * but `brnLabel`'s `for=` keeps Spartan's labelable contract happy.
   */
  protected readonly projectedLabels = contentChildren(BrnLabel);

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
   * them into `aria-describedby` on the bound control.
   */
  readonly hintDescriptors: Signal<readonly NgxSignalFormHintDescriptor[]> =
    computed(() =>
      this.hintChildren().map((hint) => ({
        id: hint.resolvedId(),
        fieldName: hint.resolvedFieldName(),
      })),
    );

  /**
   * Resolved field name. Priority order matches `NgxFormFieldWrapper`:
   *
   *   1. explicit `fieldName` input
   *   2. first projected `brnLabel`'s `for=` attribute
   *   3. `null` (auto-ARIA gracefully no-ops)
   *
   * For a production-grade wrapper you'd add a third tier (read the bound
   * control's `id` from a post-render DOM snapshot). Intentionally omitted
   * here so the demo stays compact and the seam stays the focus.
   */
  readonly resolvedFieldName = computed<string | null>(() => {
    const explicit = this.fieldName()?.trim();
    if (explicit !== undefined && explicit.length > 0) {
      return explicit;
    }

    const labels = this.projectedLabels();
    for (const label of labels) {
      const target = label.for();
      if (target !== undefined && target.trim().length > 0) {
        return target.trim();
      }
    }

    return null;
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
    () => this.#errorRenderer?.component ?? SpartanFormFieldErrorComponent,
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
   * Inputs handed to `*ngComponentOutlet`. Matches the contract documented
   * in `docs/CUSTOM_WRAPPERS.md`: `{ formField, strategy, submittedStatus }`.
   * Renderers that don't declare these inputs see them dropped silently by
   * `*ngComponentOutlet` — but renderers that do declare them get the same
   * visibility timing the wrapper uses for its own gating.
   */
  protected readonly errorInputs = computed<Record<string, unknown>>(() => ({
    formField: this.formField(),
    strategy: this.effectiveStrategy(),
    submittedStatus: this.submittedStatus(),
  }));
}
