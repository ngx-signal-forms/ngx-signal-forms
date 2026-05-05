import {
  afterEveryRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  model,
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
import { Select, SelectModule } from 'primeng/select';
import type { RoleOption } from '../profile-form/profile-form.model';

/**
 * Frozen `manual` ARIA-mode signal. Mirrors the constant in Material's
 * per-control directives (`apps/demo-material/src/app/wrapper/control-directives.ts`).
 */
const MANUAL_ARIA_MODE: Signal<NgxSignalFormControlAriaMode | null> =
  signal('manual');

/**
 * Signal Forms adapter for PrimeNG's `<p-select>`.
 *
 * PrimeNG already supports Angular's CVA-based forms APIs, but Angular Signal
 * Forms generates a broader host contract on a direct `[formField]` binding
 * that PrimeNG's inherited input surface does not currently match. This shim
 * gives Signal Forms a clean `FormValueControl<string>` host while still
 * rendering the real PrimeNG control inside.
 *
 * **ARIA model — same pattern as Material's per-control directives:**
 *
 * The shim provides `NGX_SIGNAL_FORM_ARIA_MODE: 'manual'` so the toolkit's
 * `NgxSignalFormAutoAria` stands aside on the shim host. PrimeNG's actual
 * focusable surface lives inside `<p-select>`, so writing ARIA to the shim
 * host would be invisible to screen readers anyway. Instead, the shim
 * composes the toolkit's ARIA primitive factories internally and binds the
 * resolved attributes directly onto the inner `<p-select>` via `[attr.*]` —
 * the toolkit's signals reach the focusable element in one Angular binding
 * hop. No MutationObserver, no host-attribute mirroring.
 *
 * TODO: Revisit when PrimeNG v22's Signal Forms support is available in this
 * repo. At that point this shim may be removable in favour of direct binding.
 */
@Component({
  selector: 'prime-select-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, SelectModule],
  providers: [
    { provide: NGX_SIGNAL_FORM_ARIA_MODE, useValue: MANUAL_ARIA_MODE },
  ],
  host: {
    class: 'prime-select-control',
  },
  template: `
    <p-select
      [inputId]="inputId()"
      [options]="resolvedOptions()"
      [optionLabel]="optionLabel()"
      [optionValue]="optionValue()"
      [placeholder]="placeholder()"
      [disabled]="disabled()"
      [invalid]="ariaInvalid() === 'true'"
      [required]="ariaRequired() === 'true'"
      [ngModel]="value()"
      [attr.aria-describedby]="ariaDescribedBy()"
      [attr.aria-invalid]="ariaInvalid()"
      [attr.aria-required]="ariaRequired()"
      (ngModelChange)="value.set($event ?? '')"
      (onBlur)="touched.set(true)"
    />
  `,
})
export class PrimeSelectControlComponent implements FormValueControl<string> {
  readonly #formField = inject(FORM_FIELD);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #injector = inject(Injector);
  readonly #fieldContext = inject(NGX_SIGNAL_FORM_FIELD_CONTEXT, {
    optional: true,
  });
  readonly #hintRegistry = inject(NGX_SIGNAL_FORM_HINT_REGISTRY, {
    optional: true,
  });

  protected readonly selectControl = viewChild.required(Select);

  readonly inputId = input.required<string>();
  readonly options = input<readonly RoleOption[]>([]);
  readonly optionLabel = input('label');
  readonly optionValue = input('value');
  readonly placeholder = input('Pick an option');
  readonly disabled = input(false);
  readonly touched = model(false);
  readonly value = model('');

  protected readonly resolvedOptions = computed(() => [...this.options()]);

  /**
   * Reactive view of the bound `FieldState`. Resolved from `FORM_FIELD` (the
   * Angular Signal Forms DI token applied by the sibling `[formField]`
   * directive) the same way the toolkit's "compose your own ARIA directive"
   * example does — see
   * `packages/toolkit/core/utilities/aria/composing-aria-primitives-docs-example.spec.ts`.
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
          const combobox =
            this.#host.nativeElement.querySelector<HTMLElement>(
              '[role="combobox"]',
            );

          if (!combobox) {
            return;
          }

          this.#setOrRemoveAttribute(
            combobox,
            'aria-describedby',
            this.ariaDescribedBy(),
          );
          this.#setOrRemoveAttribute(
            combobox,
            'aria-invalid',
            this.ariaInvalid(),
          );
          this.#setOrRemoveAttribute(
            combobox,
            'aria-required',
            this.ariaRequired(),
          );
        },
      },
      { injector: this.#injector },
    );
  }

  focus(): void {
    this.selectControl().focus();
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
