import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormField, type FieldTree } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';

/**
 * Instance counter that mints the widget's inner `id`.
 *
 * Third-party widget libraries do exactly this — PrimeNG's `p-inputtext-42`,
 * Material's `mat-input-7` — because the widget owns the element and the
 * consumer never sees it. That is the whole problem this page is about: the
 * toolkit derives a field's name from the bound control's `id` by default,
 * and this `id` is an implementation detail nobody wants in their ARIA ids.
 */
let widgetInstanceCount = 0;

function nextWidgetId(): string {
  widgetInstanceCount += 1;
  return `demo-widget-${widgetInstanceCount}`;
}

/**
 * A stand-in for a third-party text widget: it renders the real `<input>`
 * itself and generates that element's `id`.
 *
 * `NgxSignalFormToolkit` is imported here — not in the page — because
 * `NgxSignalFormAutoAria` applies in whichever template declares
 * `[formField]`, and that template is this one.
 */
@Component({
  selector: 'ngx-demo-generated-id-widget',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit],
  template: `
    <input
      [id]="generatedId"
      [type]="type()"
      [placeholder]="placeholder()"
      [formField]="field()"
      class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005fcc] dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
    />
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class GeneratedIdWidgetComponent {
  readonly field = input.required<FieldTree<string>>();
  readonly type = input<'text' | 'email'>('text');
  readonly placeholder = input('');

  /**
   * Generated once per instance, exactly as a real widget library would.
   * Deliberately unrelated to the field name the wrapper declares.
   */
  readonly generatedId = nextWidgetId();
}
