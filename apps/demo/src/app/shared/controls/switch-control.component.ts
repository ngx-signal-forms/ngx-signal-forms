import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormField, type FieldTree } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';

@Component({
  selector: 'ngx-switch-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit],
  host: {
    class: 'ngx-switch-control',
    'data-ngx-switch-control': '',
  },
  styles: `
    :host {
      --_switch-width: 36px;
      --_switch-height: 20px;
      --_switch-padding: 2px;
      --_switch-knob-size: 16px;
      --_switch-track-off-bg: #8298b2;
      --_switch-track-off-bg-hover: #778aa2;
      --_switch-track-on-bg: #007bc7;
      --_switch-track-on-bg-hover: #0e70b5;
      --_switch-knob-bg: #ffffff;
      --_switch-track-radius: 100px;
      --_switch-knob-radius: 1000px;
      --_switch-focus-ring: 0 0 0 4px rgb(0 123 199 / 0.25);
      --_switch-invalid-color: #db1818;
      --_switch-invalid-ring: 0 0 0 1px var(--_switch-invalid-color);
      --_switch-invalid-focus-ring:
        0 0 0 1px var(--_switch-invalid-color), 0 0 0 4px rgb(219 24 24 / 0.2);

      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
      inline-size: fit-content;
    }

    .ngx-switch-control__input {
      appearance: none;
      -webkit-appearance: none;
      box-sizing: border-box;
      position: relative;
      display: block;
      inline-size: var(--_switch-width);
      block-size: var(--_switch-height);
      margin: 0;
      border: none;
      border-radius: var(--_switch-track-radius);
      background-color: var(--_switch-track-off-bg);
      cursor: pointer;
      outline: none;
      transition:
        background-color 0.15s ease,
        box-shadow 0.15s ease,
        opacity 0.15s ease;
    }

    .ngx-switch-control__input::before {
      content: '';
      position: absolute;
      inset-block-start: var(--_switch-padding);
      inset-inline-start: var(--_switch-padding);
      inline-size: var(--_switch-knob-size);
      block-size: var(--_switch-knob-size);
      border-radius: var(--_switch-knob-radius);
      background-color: var(--_switch-knob-bg);
      transition: transform 0.15s ease;
    }

    .ngx-switch-control__input:hover:not(:disabled) {
      background-color: var(--_switch-track-off-bg-hover);
    }

    .ngx-switch-control__input:checked {
      background-color: var(--_switch-track-on-bg);
    }

    .ngx-switch-control__input:checked:hover:not(:disabled) {
      background-color: var(--_switch-track-on-bg-hover);
    }

    .ngx-switch-control__input:checked::before {
      transform: translateX(
        calc(
          var(--_switch-width) - var(--_switch-knob-size) -
            (var(--_switch-padding) * 2)
        )
      );
    }

    .ngx-switch-control__input:focus-visible {
      box-shadow: var(--_switch-focus-ring);
    }

    .ngx-switch-control__input[aria-invalid='true'] {
      box-shadow: var(--_switch-invalid-ring);
    }

    .ngx-switch-control__input[aria-invalid='true']:focus-visible {
      box-shadow: var(--_switch-invalid-focus-ring);
    }

    .ngx-switch-control__input:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }
  `,
  template: `
    <input
      class="ngx-switch-control__input"
      [id]="inputId()"
      type="checkbox"
      role="switch"
      [formField]="field()"
    />
  `,
})
export class SwitchControlComponent {
  readonly field = input.required<FieldTree<boolean>>();

  readonly inputId = input.required<string>();
}
