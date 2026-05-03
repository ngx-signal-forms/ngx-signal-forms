import { computed, Directive, ElementRef, inject, input } from '@angular/core';
import {
  NGX_SIGNAL_FORM_ARIA_MODE,
  NGX_SIGNAL_FORM_CONTROL_PRESETS,
} from '../tokens';
import type {
  NgxSignalFormControlAriaMode,
  NgxSignalFormControlKind,
  NgxSignalFormControlLayout,
  NgxSignalFormControlSemantics,
} from '../types';
import {
  isNgxSignalFormControlAriaMode,
  isNgxSignalFormControlKind,
  isNgxSignalFormControlLayout,
} from '../utilities/control-semantics';

type NgxSignalFormControlDirectiveValue =
  | NgxSignalFormControlKind
  | NgxSignalFormControlSemantics
  | ''
  | null
  | undefined;

/**
 * Explicitly declares wrapper semantics for a bound form control or custom
 * control host.
 *
 * The directive writes stable `data-ngx-signal-form-control-*` attributes so
 * wrapper styling and projected-control discovery can use DOM-based semantics
 * instead of relying purely on DOM heuristics. The auto-ARIA directive reads
 * semantics via Angular DI rather than these attributes.
 *
 * **Input shape:** prefer the three dedicated attribute inputs
 * (`ngxSignalFormControl="<kind>"`, `ngxSignalFormControlLayout`,
 * `ngxSignalFormControlAria`) — they read naturally in templates and show
 * intent at a glance. The object-literal form of `ngxSignalFormControl` is a
 * power-user escape hatch for one-off combinations that would otherwise need
 * three separate bindings.
 *
 * **Combining both forms is supported.** When an element carries both the
 * object-literal input and one of the standalone overrides
 * (`ngxSignalFormControlLayout` / `ngxSignalFormControlAria`), the standalone
 * override wins — that is the intentional precedence used by the override
 * inputs and what the resolution logic implements. Treat the object form as
 * the "base" semantics and the standalone inputs as explicit last-mile
 * overrides.
 *
 * Precedence order for each resolved value (layout / ariaMode):
 * standalone override input → object-literal field → preset default.
 *
 * @example Declarative form (preferred)
 * ```html
 * <app-star-rating
 *   id="rating"
 *   role="slider"
 *   [formField]="form.rating"
 *   ngxSignalFormControl="slider"
 *   ngxSignalFormControlAria="manual"
 * />
 * ```
 *
 * @example Object-literal form (power-user escape hatch)
 * ```html
 * <third-party-date-range-picker
 *   id="travelDates"
 *   [ngxSignalFormControl]="{ kind: 'composite', layout: 'stacked', ariaMode: 'manual' }"
 * />
 * ```
 *
 * @example Combining both forms (object-literal base + standalone override)
 * ```html
 * <third-party-date-range-picker
 *   id="travelDates"
 *   [ngxSignalFormControl]="{ kind: 'composite', layout: 'stacked' }"
 *   ngxSignalFormControlAria="manual"
 * />
 * ```
 */
@Directive({
  selector:
    '[ngxSignalFormControl],[ngxSignalFormControlLayout],[ngxSignalFormControlAria]',
  host: {
    '[attr.data-ngx-signal-form-control]': 'hasSemantics() ? "" : null',
    '[attr.data-ngx-signal-form-control-kind]': 'kind()',
    '[attr.data-ngx-signal-form-control-layout]': 'layout()',
    '[attr.data-ngx-signal-form-control-aria-mode]': 'ariaMode()',
  },
  providers: [
    {
      provide: NGX_SIGNAL_FORM_ARIA_MODE,
      useFactory: () => inject(NgxSignalFormControlSemanticsDirective).ariaMode,
    },
  ],
})
export class NgxSignalFormControlSemanticsDirective {
  readonly #presets = inject(NGX_SIGNAL_FORM_CONTROL_PRESETS);

  /**
   * Host element this directive is applied to.
   *
   * Exposed so parent wrappers can locate the bound control via
   * `contentChildren(NgxSignalFormControlSemanticsDirective)` and read the
   * host's tag, `id`, or current attributes (e.g. Material's
   * `aria-describedby` for the `preservedIds` reader of
   * `createAriaDescribedBySignal`). This is the canonical signal-native
   * alternative to imperative DOM probing from a render hook.
   */
  readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly semanticsInput = input<NgxSignalFormControlDirectiveValue>(
    undefined,
    {
      alias: 'ngxSignalFormControl',
    },
  );

  readonly layoutOverride = input<NgxSignalFormControlLayout | null>(null, {
    alias: 'ngxSignalFormControlLayout',
  });

  readonly ariaModeOverride = input<NgxSignalFormControlAriaMode | null>(null, {
    alias: 'ngxSignalFormControlAria',
  });

  readonly #baseSemantics = computed<NgxSignalFormControlSemantics>(() => {
    const value = this.semanticsInput();
    if (typeof value === 'string') {
      return isNgxSignalFormControlKind(value) ? { kind: value } : {};
    }

    return value ?? {};
  });

  readonly kind = computed(() => {
    const kind = this.#baseSemantics().kind;

    return isNgxSignalFormControlKind(kind) ? kind : null;
  });

  readonly layout = computed(() => {
    const kind = this.kind();
    const preset = kind ? this.#presets[kind] : undefined;
    const layout =
      this.layoutOverride() ?? this.#baseSemantics().layout ?? preset?.layout;

    return isNgxSignalFormControlLayout(layout) ? layout : null;
  });

  readonly ariaMode = computed(() => {
    const kind = this.kind();
    const preset = kind ? this.#presets[kind] : undefined;
    const ariaMode =
      this.ariaModeOverride() ??
      this.#baseSemantics().ariaMode ??
      preset?.ariaMode;

    return isNgxSignalFormControlAriaMode(ariaMode) ? ariaMode : null;
  });

  readonly hasSemantics = computed(() => {
    return (
      this.kind() !== null || this.layout() !== null || this.ariaMode() !== null
    );
  });
}
