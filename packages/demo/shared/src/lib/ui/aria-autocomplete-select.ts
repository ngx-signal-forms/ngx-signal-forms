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
import {
  Combobox,
  ComboboxPopup,
  ComboboxWidget,
} from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { OverlayModule } from '@angular/cdk/overlay';

export interface AriaAutocompleteOption {
  readonly value: string;
  readonly label: string;
}

const DEFAULT_OPTIONS: readonly AriaAutocompleteOption[] = [
  { value: 'angular', label: 'Angular' },
  { value: 'react', label: 'React' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'vue', label: 'Vue' },
  { value: 'solid', label: 'Solid' },
];

/**
 * Searchable single-value control from Angular Aria Combobox. The inner
 * `role="combobox"` trigger stays naked. The wrapper infers `input-like`
 * from that role and owns the field shell.
 */
@Component({
  selector: 'ngx-aria-autocomplete',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Combobox,
    ComboboxPopup,
    ComboboxWidget,
    Listbox,
    Option,
    OverlayModule,
  ],
  host: { class: 'ngx-aria-autocomplete' },
  styles: `
    :host {
      display: block;
      position: relative;
      inline-size: 100%;
      min-inline-size: 0;
    }
    .select__input-wrap {
      position: relative;
      display: flex;
      align-items: center;
      inline-size: 100%;
    }
    :host .select__input {
      box-sizing: border-box;
      inline-size: 100%;
      min-block-size: 0;
      padding: 0 1.5rem 0 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      line-height: inherit;
      box-shadow: none;
    }
    :host .select__input:focus,
    :host .select__input:focus-visible {
      outline: none;
      box-shadow: none;
    }
    :host .select__input:disabled {
      cursor: not-allowed;
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
    .select__option,
    .select__empty {
      font: inherit;
    }
    .select__option {
      min-block-size: 2.5rem;
      padding: 0.625rem 0.75rem;
      border-radius: calc(var(--ngx-form-field-radius, 0.25rem) * 0.7);
      color: inherit;
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
    .select__empty {
      padding: 0.75rem;
      color: var(--ngx-form-field-color-text-secondary, rgba(50, 65, 85, 0.75));
    }
  `,
  template: `
    <div #origin class="select__input-wrap">
      <input
        #combobox="ngCombobox"
        ngCombobox
        class="select__input"
        [id]="inputId()"
        type="text"
        autocomplete="off"
        [attr.aria-autocomplete]="'list'"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [(value)]="query"
        [(expanded)]="popupExpanded"
        (focus)="popupExpanded.set(true)"
        (blur)="popupExpanded.set(false); touch.emit()"
      />
      <span class="select__chevron" aria-hidden="true"></span>
    </div>

    <ng-template
      [cdkConnectedOverlay]="{
        origin,
        matchWidth: true,
      }"
      [cdkConnectedOverlayOpen]="popupExpanded()"
    >
      <ng-template ngComboboxPopup [combobox]="combobox">
        <div class="select__popup" (mousedown)="$event.preventDefault()">
          @if (filteredOptions().length === 0) {
            <div class="select__empty">No matching options</div>
          } @else {
            <ul
              #listbox="ngListbox"
              ngComboboxWidget
              ngListbox
              class="select__list"
              focusMode="activedescendant"
              selectionMode="explicit"
              [tabindex]="-1"
              [activeDescendant]="listbox.activeDescendant()"
              [(value)]="selectedOption"
              (click)="commitSelection()"
              (keydown.enter)="commitSelection()"
            >
              @for (option of filteredOptions(); track option.value) {
                <li
                  class="select__option"
                  ngOption
                  [value]="option.value"
                  [label]="option.label"
                >
                  {{ option.label }}
                </li>
              }
            </ul>
          }
        </div>
      </ng-template>
    </ng-template>
  `,
})
export class AriaAutocompleteComponent implements FormValueControl<string> {
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly value = model.required<string>();
  readonly touched = input(false);
  readonly invalid = input(false);
  readonly required = input(false);
  readonly disabled = input(false);
  readonly errors = input<readonly ValidationError[]>([]);
  readonly inputId = input.required<string>();
  readonly placeholder = input('Search and select a framework');
  readonly options = input(DEFAULT_OPTIONS);
  readonly touch = output();

  protected readonly query = signal('');
  protected readonly popupExpanded = signal(false);
  protected readonly selectedOption = signal<string[]>([]);

  protected readonly filteredOptions = computed(() => {
    const query = this.query().trim().toLowerCase();
    if (!query) return this.options();
    return this.options().filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  });

  constructor() {
    effect(() => {
      const value = this.value();
      const option = this.options().find((item) => item.value === value);
      this.query.set(option?.label ?? '');
      this.selectedOption.set(value ? [value] : []);
    });
  }

  focus(): void {
    const trigger = this.#host.nativeElement.querySelector('input');
    if (trigger) {
      trigger.focus();
      return;
    }
    this.#host.nativeElement.focus();
  }

  protected commitSelection(): void {
    const selected = this.selectedOption()[0];
    const option = this.options().find((item) => item.value === selected);
    if (!option) return;

    this.value.set(option.value);
    this.query.set(option.label);
    this.popupExpanded.set(false);
    this.touch.emit();
  }
}

/** @deprecated Use `AriaAutocompleteComponent` instead. */
export { AriaAutocompleteComponent as AriaAutocompleteSelectComponent };
