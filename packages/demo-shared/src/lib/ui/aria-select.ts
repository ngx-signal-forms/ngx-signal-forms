import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import type { FormValueControl, ValidationError } from '@angular/forms/signals';
import { Listbox, Option } from '@angular/aria/listbox';
import { OverlayModule } from '@angular/cdk/overlay';

export interface AriaSelectOption {
  readonly value: string;
  readonly label: string;
}

const DEFAULT_OPTIONS: readonly AriaSelectOption[] = [
  { value: 'angular', label: 'Angular' },
  { value: 'react', label: 'React' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'vue', label: 'Vue' },
  { value: 'solid', label: 'Solid' },
];

/**
 * Non-editable single-value select. The trigger is naked so the form-field
 * wrapper owns border, focus, and invalid chrome. Declare
 * `ngxSignalFormControl="input-like"` on this host. Do not set
 * `role="combobox"` — that is the explicit input-like path, not combobox
 * inference.
 */
@Component({
  selector: 'ngx-aria-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Listbox, Option, OverlayModule],
  host: {
    class: 'ngx-aria-select',
    '[attr.role]': '"button"',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    '[attr.aria-expanded]': 'popupExpanded()',
    '[attr.aria-haspopup]': '"listbox"',
    '[attr.aria-disabled]': 'disabled() ? "true" : null',
    '(click)': 'togglePopup()',
    '(keydown)': 'onKeydown($event)',
    '(blur)': 'onBlur($event)',
  },
  styles: `
    :host {
      display: flex;
      position: relative;
      align-items: center;
      inline-size: 100%;
      min-inline-size: 0;
      padding: 0;
      border: 0;
      background: transparent;
      color: inherit;
      cursor: pointer;
      text-align: start;
      user-select: none;
    }
    :host:focus,
    :host:focus-visible {
      outline: none;
      box-shadow: none;
    }
    :host([aria-disabled='true']) {
      cursor: not-allowed;
      opacity: var(--ngx-form-field-disabled-opacity, 0.6);
    }
    .select__value {
      flex: 1;
      min-inline-size: 0;
      min-block-size: inherit;
      padding-inline-end: 1.5rem;
      font: inherit;
      line-height: inherit;
    }
    .select__value--placeholder {
      color: var(
        --_placeholder-color,
        var(
          --ngx-form-field-placeholder-color,
          var(--ngx-form-field-color-text-secondary, rgba(50, 65, 85, 0.75))
        )
      );
    }
    .select__chevron {
      position: absolute;
      inset-block-start: 50%;
      inset-inline-end: 0.15rem;
      inline-size: 0.5rem;
      block-size: 0.5rem;
      border-inline-end: 2px solid
        var(--ngx-form-field-color-text-secondary, rgba(50, 65, 85, 0.75));
      border-block-end: 2px solid
        var(--ngx-form-field-color-text-secondary, rgba(50, 65, 85, 0.75));
      transform: translateY(-65%) rotate(45deg);
      pointer-events: none;
    }
    :host([aria-expanded='true']) .select__chevron {
      transform: translateY(-35%) rotate(225deg);
    }
    .select__popup {
      box-sizing: border-box;
      inline-size: 100%;
      max-block-size: 14rem;
      overflow: auto;
      margin-block-start: 0.35rem;
      padding: 0.25rem;
      border: 1px solid
        var(--ngx-form-field-color-border, rgba(50, 65, 85, 0.25));
      border-radius: var(--ngx-form-field-radius, 0.25rem);
      background-color: var(--ngx-form-field-color-surface, #ffffff);
      box-shadow: 0 0.5rem 1.5rem
        color-mix(
          in srgb,
          var(--ngx-form-field-color-text, #324155) 18%,
          transparent
        );
      color: var(--ngx-form-field-color-text, #324155);
      font-family: var(--ngx-form-field-input-font-family, inherit);
      font-size: var(--ngx-form-field-input-size, 0.875rem);
      font-weight: var(--ngx-form-field-input-weight, 400);
      line-height: var(--ngx-form-field-input-line-height, 1.25rem);
    }
    .select__list {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      margin: 0;
      padding: 0;
      outline: none;
      list-style: none;
      font: inherit;
    }
    .select__option {
      display: flex;
      align-items: center;
      min-block-size: 2.5rem;
      padding: 0.625rem 0.75rem;
      border-radius: calc(var(--ngx-form-field-radius, 0.25rem) * 0.7);
      color: inherit;
      font: inherit;
      cursor: pointer;
    }
    .select__option:hover,
    .select__option[data-active='true'] {
      background: color-mix(
        in srgb,
        var(--ngx-form-field-color-primary, #007bc7) 10%,
        transparent
      );
    }
    .select__option[aria-selected='true'] {
      background: color-mix(
        in srgb,
        var(--ngx-form-field-color-primary, #007bc7) 18%,
        transparent
      );
      font-weight: 600;
    }
  `,
  template: `
    <span
      class="select__value"
      [class.select__value--placeholder]="!selectedLabel()"
    >
      {{ selectedLabel() || placeholder() }}
    </span>
    <span class="select__chevron" aria-hidden="true"></span>

    <ng-template
      [cdkConnectedOverlay]="{
        origin: host.nativeElement,
        matchWidth: true,
      }"
      [cdkConnectedOverlayOpen]="popupExpanded()"
    >
      <div class="select__popup" (mousedown)="$event.preventDefault()">
        <ul
          #listbox="ngListbox"
          ngListbox
          class="select__list"
          focusMode="activedescendant"
          selectionMode="explicit"
          [tabindex]="-1"
          [activeDescendant]="listbox.activeDescendant()"
          [(value)]="selectedOption"
          (keydown.enter)="commitSelection()"
          (keydown.space)="commitSelection()"
        >
          @for (option of options(); track option.value) {
            <li
              class="select__option"
              ngOption
              [value]="option.value"
              [label]="option.label"
              (click)="commitSelection(option.value)"
            >
              {{ option.label }}
            </li>
          }
        </ul>
      </div>
    </ng-template>
  `,
})
export class AriaSelectComponent implements FormValueControl<string> {
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly host = this.#host;

  readonly value = model.required<string>();
  readonly touched = input(false);
  readonly invalid = input(false);
  readonly required = input(false);
  readonly disabled = input(false);
  readonly errors = input<readonly ValidationError[]>([]);
  readonly placeholder = input('Select a framework');
  readonly options = input(DEFAULT_OPTIONS);
  readonly touch = output();

  protected readonly popupExpanded = signal(false);
  protected readonly selectedOption = signal<string[]>([]);

  protected readonly selectedLabel = computed(() => {
    const selected = this.options().find(
      (option) => option.value === this.value(),
    );
    return selected?.label ?? '';
  });

  constructor() {
    effect(() => {
      const value = this.value();
      this.selectedOption.set(value ? [value] : []);
    });
  }

  focus(): void {
    this.#host.nativeElement.focus();
  }

  protected togglePopup(): void {
    if (this.disabled()) return;
    this.popupExpanded.update((open) => !open);
  }

  // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- DOM KeyboardEvent
  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    if (
      event.key === 'Enter' ||
      event.key === ' ' ||
      event.key === 'ArrowDown'
    ) {
      event.preventDefault();
      this.popupExpanded.set(true);
    }
    if (event.key === 'Escape') {
      this.popupExpanded.set(false);
    }
  }

  // oxlint-disable-next-line typescript/prefer-readonly-parameter-types -- DOM FocusEvent
  protected onBlur(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.#host.nativeElement.contains(next)) {
      return;
    }
    this.popupExpanded.set(false);
    this.touch.emit();
  }

  protected commitSelection(value?: string): void {
    const selected = value ?? this.selectedOption()[0];
    const option = this.options().find((item) => item.value === selected);
    if (!option) return;

    this.value.set(option.value);
    this.popupExpanded.set(false);
    this.touch.emit();
  }
}
