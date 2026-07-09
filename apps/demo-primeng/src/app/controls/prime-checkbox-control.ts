import {
  afterEveryRender,
  Component,
  computed,
  inject,
  Injector,
  input,
  model,
  output,
  signal,
  viewChild,
  type Signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  FORM_FIELD,
  type FieldState,
  type FormValueControl,
} from '@angular/forms/signals';
import {
  createErrorVisibility,
  NGX_SIGNAL_FORM_ARIA_MODE,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  NGX_SIGNAL_FORM_HINT_REGISTRY,
  type NgxSignalFormControlAriaMode,
} from '@ngx-signal-forms/toolkit';
import {
  createAriaDescribedBySignal,
  createAriaInvalidSignal,
  createAriaRequiredSignal,
  createHintIdsSignal,
} from '@ngx-signal-forms/toolkit/headless';
import { Checkbox, CheckboxModule } from 'primeng/checkbox';

/**
 * Frozen `manual` ARIA-mode signal. Mirrors the constant in Material's
 * per-control directives (`apps/demo-material/src/app/wrapper/control-directives.ts`)
 * and the sibling `PrimeSelectControlComponent` shim.
 */
const MANUAL_ARIA_MODE: Signal<NgxSignalFormControlAriaMode | null> =
  signal('manual');

/**
 * Signal Forms adapter for PrimeNG's `<p-checkbox>`.
 *
 * **Why this shim exists:** `<p-checkbox inputId="…" [formField]="…">`
 * binds Angular Signal Forms' `[formField]` directly on the `<p-checkbox>`
 * host tag. `NgxSignalFormAutoAria`'s selector catch-all
 * (`[formField]:not(input):not(textarea):not(select):not([ngxSignalFormAutoAriaDisabled])`)
 * matches that host and writes `aria-describedby` / `aria-invalid` /
 * `aria-required` onto the `<p-checkbox>` element itself. PrimeNG's compiled
 * Checkbox template renders a separate native `<input type="checkbox">` as a
 * child with no host-to-input ARIA passthrough for those three attributes
 * (unlike `ariaLabelledBy` / `ariaLabel`, which PrimeNG forwards natively) —
 * so hint/error text is visually shown but never linked to the real
 * focusable checkbox input.
 *
 * **ARIA model — same pattern as `PrimeSelectControlComponent`:**
 *
 * The shim provides `NGX_SIGNAL_FORM_ARIA_MODE: 'manual'` so `NgxSignalFormAutoAria`
 * stands aside on the shim host, then composes the toolkit's ARIA primitive
 * factories internally and writes the resolved attributes onto the real
 * native `<input>` — reached via `Checkbox.inputViewChild`, a public
 * `ElementRef` PrimeNG exposes for exactly this kind of host-component
 * bridging (mirrors the `[role="combobox"]` DOM query the select shim uses
 * where PrimeNG doesn't expose a component-level handle).
 *
 * TODO: Revisit when PrimeNG v22's Signal Forms support is available in this
 * repo. At that point this shim may be removable in favour of direct binding.
 */
@Component({
  selector: 'prime-checkbox-control',

  imports: [FormsModule, CheckboxModule],
  providers: [
    { provide: NGX_SIGNAL_FORM_ARIA_MODE, useValue: MANUAL_ARIA_MODE },
  ],
  host: {
    class: 'prime-checkbox-control',
  },
  template: `
    <p-checkbox
      [inputId]="inputId()"
      [binary]="true"
      [disabled]="disabled()"
      [ngModel]="value()"
      (ngModelChange)="value.set($event ?? false)"
      (onBlur)="touch.emit()"
    />
  `,
})
export class PrimeCheckboxControlComponent implements FormValueControl<boolean> {
  readonly #formField = inject(FORM_FIELD);
  readonly #injector = inject(Injector);
  readonly #fieldContext = inject(NGX_SIGNAL_FORM_FIELD_CONTEXT, {
    optional: true,
  });
  readonly #hintRegistry = inject(NGX_SIGNAL_FORM_HINT_REGISTRY, {
    optional: true,
  });

  protected readonly checkboxControl = viewChild.required(Checkbox);

  readonly inputId = input.required<string>();
  readonly disabled = input(false);
  // Angular 22: emit `touch` (control → field) instead of the old `touched`
  // model; the Field directive marks the field touched on blur.
  readonly touch = output();
  readonly value = model(false);

  /**
   * Reactive view of the bound `FieldState`. Resolved from `FORM_FIELD` the
   * same way `PrimeSelectControlComponent` does.
   */
  readonly #fieldState = computed<FieldState<unknown> | null>(() => {
    const field = this.#formField.field();
    const state =
      typeof field === 'function' ? field() : this.#formField.state();
    return state ?? null;
  });

  readonly #visibility = createErrorVisibility(this.#fieldState);

  readonly #hintIds = createHintIdsSignal({
    registry: this.#hintRegistry,
    fieldName: () => this.#fieldContext?.fieldName() ?? null,
  });

  protected readonly ariaInvalid = createAriaInvalidSignal(
    this.#fieldState,
    this.#visibility,
  );

  protected readonly ariaRequired = createAriaRequiredSignal(this.#fieldState);

  protected readonly ariaDescribedBy = createAriaDescribedBySignal({
    fieldState: this.#fieldState,
    hintIds: this.#hintIds,
    visibility: this.#visibility,
    preservedIds: () => null,
    fieldName: () => this.#fieldContext?.fieldName() ?? null,
  });

  constructor() {
    afterEveryRender(
      {
        write: () => {
          const nativeInput =
            this.checkboxControl().inputViewChild?.nativeElement ?? null;

          if (!nativeInput) {
            return;
          }

          this.#setOrRemoveAttribute(
            nativeInput,
            'aria-describedby',
            this.ariaDescribedBy(),
          );
          this.#setOrRemoveAttribute(
            nativeInput,
            'aria-invalid',
            this.ariaInvalid(),
          );
          this.#setOrRemoveAttribute(
            nativeInput,
            'aria-required',
            this.ariaRequired(),
          );
        },
      },
      { injector: this.#injector },
    );
  }

  focus(): void {
    this.checkboxControl().focus();
  }

  #setOrRemoveAttribute(
    element: HTMLElement,
    name: string,
    value: string | null,
  ): void {
    if (value === null) {
      element.removeAttribute(name);
      return;
    }

    element.setAttribute(name, value);
  }
}
