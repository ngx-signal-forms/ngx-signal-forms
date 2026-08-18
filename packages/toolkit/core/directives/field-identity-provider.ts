import {
  afterNextRender,
  Directive,
  effect,
  inject,
  input,
} from '@angular/core';
import { NgxFieldIdentity } from '../services/field-identity';
import { devWarnOnce, type WarnOnceRef } from '../utilities/dev-warn-once';

/**
 * Provides an {@link NgxFieldIdentity} on its host element and publishes a
 * field name into it — the supported way for a third-party wrapper to own
 * field identity for the controls it contains.
 *
 * ## What it is for
 *
 * `NgxSignalFormAutoAria` derives a field name from the bound control's `id`
 * attribute unless an ancestor provides an `NgxFieldIdentity`. That is a hard
 * constraint for a custom wrapper: it forces the field name and the control's
 * DOM `id` to be the same string. Two common shapes cannot satisfy it —
 *
 * - a third-party widget that generates its own inner input `id` and exposes
 *   no override, and
 * - a `role="group"` cluster (radios, checkboxes) whose name belongs to the
 *   group rather than to any single control.
 *
 * In both cases the ids auto-aria generates (`{fieldName}-error`,
 * `{fieldName}-warning`) disagree with what the wrapper actually rendered,
 * leaving `aria-describedby` pointing at nothing — an axe
 * `aria-valid-attr-value` failure, and error text that assistive technology
 * never reaches.
 *
 * ## How to use it
 *
 * Compose it onto your wrapper's host with `hostDirectives`. It has no
 * selector on purpose: placement on the host element is load-bearing (that is
 * the element injector descendants resolve through), and a selector would
 * invite putting it somewhere that silently does nothing.
 *
 * ```typescript
 * @Component({
 *   selector: 'my-field',
 *   hostDirectives: [
 *     { directive: NgxFieldIdentityProvider, inputs: ['fieldName'] },
 *   ],
 *   template: `
 *     <ng-content />
 *     <ngx-form-field-error [formField]="field()" [fieldName]="name()" />
 *   `,
 * })
 * export class MyField { }
 * ```
 *
 * ```html
 * <my-field fieldName="emailAddress" [field]="form.emailAddress">
 *   <label for="p-inputtext-42">Email</label>
 *   <input id="p-inputtext-42" [formField]="form.emailAddress" />
 * </my-field>
 * <!-- aria-describedby="emailAddress-error", not "p-inputtext-42-error" -->
 * ```
 *
 * ## What it does not do
 *
 * It publishes the **field-name channel only**. Hint IDs and the error /
 * warning display strategies keep resolving through
 * `NGX_SIGNAL_FORM_HINT_REGISTRY` and
 * `NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY`, which stay the supported seams
 * for those. Composing this directive does not disturb them: identity shadows
 * the registries per channel, not by presence (ADR-0010).
 *
 * Strategy deliberately has no channel here. The registry publishes the
 * *observed* boolean that already gates a rendered region, so it cannot drift
 * from the DOM the way a separately-declared strategy could.
 *
 * The `set*` writers on `NgxFieldIdentity` remain `@internal` and are stripped
 * from the published type definitions. This directive is the public surface;
 * it drives them on your behalf.
 *
 * `NgxFormFieldWrapper` composes this directive too, rather than providing
 * `NgxFieldIdentity` itself — so the seam a third-party wrapper uses is the
 * same one the built-in wrapper runs on. Angular feeds a single `fieldName`
 * attribute to both a component's own input and its exposed host-directive
 * input, so composing it costs consumers nothing.
 *
 * @public
 * @group ARIA Composition
 */
@Directive({
  providers: [NgxFieldIdentity],
})
export class NgxFieldIdentityProvider {
  /**
   * The field's name — the string every generated id is derived from
   * (`{fieldName}-error`, `{fieldName}-warning`), and what a projected
   * `<ngx-form-field-error [fieldName]="…">` must be given to match.
   *
   * Three states, all meaningful:
   *
   * - a non-empty string — the resolved name. Whitespace is trimmed.
   * - `null` — bound, but not resolvable yet. ARIA wiring is skipped for this
   *   field until a name appears; it does **not** revert to deriving one from
   *   the control's `id`, because a wrapper that declares its own naming has
   *   said the control's `id` is not the name.
   * - unbound — this directive publishes nothing, leaving the identity's name
   *   to the composing component. That is what lets a wrapper resolve a name
   *   from somewhere an input cannot reach. `NgxFormFieldWrapper` relies on
   *   it: tier 2 of its cascade reads the bound control's `id`, which is only
   *   known in its render write phase, long after inputs are set. Note that
   *   providing an identity at all hands it the naming channel, so leaving
   *   the input unbound *and* never driving the identity means the contained
   *   controls get no ARIA wiring — a dev-mode diagnostic calls that out.
   *
   * Not `input.required`, deliberately. Exposing a required host-directive
   * input makes it mandatory in every consumer template (`NG8008`, chained
   * from `NG2019` if it is not re-exposed at all). A wrapper's own
   * `fieldName` is normally optional — `NgxFormFieldWrapper`'s certainly is,
   * because the control's `id` is the usual source — so requiring it here
   * would break every field that relies on that fallback.
   */
  readonly fieldName = input<string | null | undefined>(undefined);

  readonly #identity = inject(NgxFieldIdentity);
  readonly #warnedUnclaimed: WarnOnceRef = { current: false };

  constructor() {
    // An effect, not `afterEveryRender`: publishing a name needs no layout
    // information, and effects flush before render hooks in the same change
    // detection cycle, so the name is already current by the time auto-aria's
    // `earlyRead` reads it. A render-phase write would land one tick late.
    effect(() => {
      const name = this.fieldName();
      if (name === undefined) {
        return;
      }
      this.#identity.setFieldName(name);
    });

    // Providing an identity claims the naming channel for this subtree, so a
    // provider nobody drives is not a no-op — it suppresses the DOM-`id`
    // derivation that would otherwise have worked. Checked after the first
    // render so a composing component that drives the identity from its own
    // render-phase write (as `NgxFormFieldWrapper` does) has already run.
    afterNextRender(() => {
      if (this.fieldName() !== undefined || this.#identity.fieldName()) {
        return;
      }
      devWarnOnce(
        this.#warnedUnclaimed,
        'warn',
        '[ngx-signal-forms] NgxFieldIdentityProvider: no field name was ' +
          'published. Providing a field identity takes over field naming for ' +
          'this subtree, so ARIA wiring is skipped until a name arrives — ' +
          "the bound control's `id` is no longer used as a fallback. Expose " +
          'the `fieldName` input via `hostDirectives` and bind it, or drive ' +
          'the injected `NgxFieldIdentity` yourself.',
      );
    });
  }
}
