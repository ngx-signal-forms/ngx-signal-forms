import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { FormField, type FieldTree } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';

export interface MockAutocompleteOption {
  readonly value: string;
  readonly label: string;
}

const DEFAULT_OPTIONS: readonly MockAutocompleteOption[] = [
  { value: 'nl', label: 'Netherlands' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' },
  { value: 'be', label: 'Belgium' },
  { value: 'es', label: 'Spain' },
  { value: 'it', label: 'Italy' },
];

/**
 * Minimal mocked autocomplete for the padding-ownership recipe (#475).
 *
 * This is deliberately not a full combobox implementation (no CDK overlay,
 * no `Combobox`/`Listbox` directives) — it exists to be the smallest
 * possible field-shaped adapter that still has everything the recipe in
 * `docs/CUSTOM_CONTROLS.md` / `THEMING.md` needs to talk about: a naked
 * `role="combobox"` trigger the wrapper infers `input-like` from (a stable
 * `id` on this component's own inner input, per "Wrapper owns the shell" /
 * Path 1), a `[prefix]` icon and `[suffix]` clear button contributed by the
 * *consuming* template (not this component — those slots are wrapper-level,
 * see `custom-controls.html`), and a popup positioned against the field
 * shell rather than the padded input area.
 *
 * `[formField]` is bound to the real inner `<input>` in this component's
 * own template (not relocated from an outer host like
 * `AriaAutocompleteComponent`), so per the toolkit's non-negotiable rule 7
 * this component imports `NgxSignalFormToolkit` (auto-ARIA) itself —
 * standalone imports are template-local, and the parent's imports do not
 * reach into this template.
 */
@Component({
  selector: 'ngx-mock-autocomplete',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit],
  host: { class: 'ngx-mock-autocomplete' },
  styles: `
    :host {
      display: block;
      position: relative;
      inline-size: 100%;
      min-inline-size: 0;
    }

    .ngx-mock-autocomplete__input {
      box-sizing: border-box;
      inline-size: 100%;
      min-block-size: 0;
      border: 0;
      background: transparent;
      color: inherit;
      font: inherit;
      line-height: inherit;
      box-shadow: none;
    }

    .ngx-mock-autocomplete__input:focus,
    .ngx-mock-autocomplete__input:focus-visible {
      outline: none;
      box-shadow: none;
    }

    /*
     * The field shell (".ngx-signal-form-field-wrapper__content") is
     * already position: relative, so this popup uses it as a containing
     * block for free -- no extra positioning host needed. inset-inline-start
     * lands on the shell's padding edge (one border-width inside the
     * visible outline), so -1px pulls the popup's edge out to the shell's
     * border -- see the padding-ownership recipe in docs/CUSTOM_CONTROLS.md
     * and THEMING.md.
     */
    .ngx-mock-autocomplete__popup {
      position: absolute;
      inset-inline-start: -1px;
      inset-inline-end: -1px;
      inset-block-start: calc(100% + 0.25rem);
      z-index: 10;
      max-block-size: 12rem;
      overflow: auto;
      margin: 0;
      padding: 0.25rem;
      list-style: none;
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
      font: inherit;
      color: var(--ngx-form-field-color-text, #324155);
    }

    .ngx-mock-autocomplete__option {
      padding: 0.5rem 0.625rem;
      border-radius: calc(var(--ngx-form-field-radius, 0.25rem) * 0.7);
      cursor: pointer;
    }

    .ngx-mock-autocomplete__option:hover,
    .ngx-mock-autocomplete__option--active {
      background: color-mix(
        in srgb,
        var(--ngx-form-field-color-primary, #007bc7) 10%,
        transparent
      );
    }
  `,
  template: `
    <input
      #inputRef
      class="ngx-mock-autocomplete__input"
      [id]="inputId()"
      type="text"
      role="combobox"
      autocomplete="off"
      [attr.aria-autocomplete]="'list'"
      [attr.aria-expanded]="expanded()"
      [attr.aria-controls]="expanded() ? listboxId() : null"
      [attr.aria-activedescendant]="activeOptionId()"
      [placeholder]="placeholder()"
      [formField]="field()"
      (focus)="onFocus()"
      (input)="onInput()"
      (keydown)="onKeydown($event)"
      (blur)="close()"
    />
    @if (expanded()) {
      <ul
        [id]="listboxId()"
        role="listbox"
        class="ngx-mock-autocomplete__popup"
      >
        @for (option of filteredOptions(); track option.value; let i = $index) {
          <li
            [id]="optionId(i)"
            role="option"
            class="ngx-mock-autocomplete__option"
            [class.ngx-mock-autocomplete__option--active]="i === activeIndex()"
            [attr.aria-selected]="i === activeIndex()"
            (mousedown)="$event.preventDefault()"
            (click)="selectOption(option)"
          >
            {{ option.label }}
          </li>
        }
      </ul>
    }
    <!--
      A listbox must not expose a non-option child (WAI-ARIA), so the
      empty-results message lives outside the ul as its own live region
      instead of a role="presentation" li inside it -- that li rendered
      visibly but announced nothing to screen readers (WCAG 4.1.3 Status
      Messages).
    -->
    <div class="sr-only" role="status" aria-live="polite">
      @if (expanded() && filteredOptions().length === 0) {
        No matching countries
      }
    </div>
  `,
})
export class MockAutocompleteComponent {
  readonly field = input.required<FieldTree<string>>();
  readonly inputId = input.required<string>();
  readonly placeholder = input('Type to search');
  readonly options = input<readonly MockAutocompleteOption[]>(DEFAULT_OPTIONS);

  protected readonly expanded = signal(false);
  protected readonly activeIndex = signal(-1);

  protected readonly inputRef =
    viewChild.required<ElementRef<HTMLInputElement>>('inputRef');

  protected readonly listboxId = computed(() => `${this.inputId()}-listbox`);

  protected readonly filteredOptions = computed(() => {
    // `field` is the input accessor for the bound FieldTree, so
    // `this.field()` returns the FieldTree itself; calling it again reads
    // the field's current FieldState, whose `.value` is the writable
    // signal this recipe filters on.
    const query = this.field()().value().trim().toLowerCase();
    if (!query) return this.options();
    return this.options().filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  });

  protected readonly activeOptionId = computed<string | null>(() => {
    const index = this.activeIndex();
    return index >= 0 && index < this.filteredOptions().length
      ? this.optionId(index)
      : null;
  });

  protected optionId(index: number): string {
    return `${this.inputId()}-option-${index}`;
  }

  protected onFocus(): void {
    this.expanded.set(true);
    this.activeIndex.set(-1);
  }

  protected onInput(): void {
    this.expanded.set(true);
    this.activeIndex.set(-1);
  }

  protected close(): void {
    this.expanded.set(false);
    this.activeIndex.set(-1);
  }

  protected onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        if (this.expanded()) {
          event.preventDefault();
          this.close();
        }
        return;
      case 'ArrowDown':
        event.preventDefault();
        this.expanded.set(true);
        this.moveActive(1);
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.expanded.set(true);
        this.moveActive(-1);
        return;
      case 'Enter': {
        const options = this.filteredOptions();
        const index = this.activeIndex();
        if (index >= 0 && index < options.length) {
          event.preventDefault();
          this.selectOption(options[index]);
        }
      }
    }
  }

  protected selectOption(option: MockAutocompleteOption): void {
    this.field()().value.set(option.label);
    this.close();
    this.inputRef().nativeElement.focus();
  }

  /** Called by the consuming template's `[suffix]` clear button. */
  clear(): void {
    this.field()().value.set('');
    this.activeIndex.set(-1);
    this.inputRef().nativeElement.focus();
  }

  private moveActive(delta: number): void {
    const length = this.filteredOptions().length;
    if (length === 0) return;
    const current = this.activeIndex();
    this.activeIndex.set((current + delta + length) % length);
  }
}
