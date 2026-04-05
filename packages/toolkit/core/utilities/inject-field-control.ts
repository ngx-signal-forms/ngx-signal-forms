import { ElementRef, Injector } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { assertInjector } from './assert-injector';
import { resolveFieldName } from './field-resolution';
import { injectFormContext } from './inject-form-context';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Custom Inject Function (CIF) for retrieving a specific field control from the form.
 * Works both inside and outside Angular injection context when an injector is provided.
 *
 * This pattern is inspired by ngxtension's Custom Inject Functions.
 * @see https://github.com/ngxtension/ngxtension-platform
 *
 * @param element - The HTML element or ElementRef to resolve the field name from
 * @param injector - Optional injector for use outside injection context
 * @returns The resolved `FieldTree<TValue>` from the form
 * @throws Error if field cannot be resolved or form context is not found
 *
 * @example
 * ```typescript
 * /// Inside a directive — typed result
 * @Directive({ selector: '[myDirective]' })
 * export class MyDirective {
 *   readonly #element = inject(ElementRef);
 *   readonly fieldControl = injectFieldControl<string>(this.#element);
 *   // fieldControl is FieldTree<string>
 *
 *   constructor() {
 *     effect(() => {
 *       console.log('Value:', this.fieldControl().value());
 *     });
 *   }
 * }
 *
 * /// Outside injection context
 * function myUtility(element: HTMLElement, injector: Injector) {
 *   const fieldControl = injectFieldControl<number>(element, injector);
 *   // fieldControl is FieldTree<number>
 * }
 * ```
 */
export function injectFieldControl<TValue = unknown>(
  element: HTMLElement | ElementRef<HTMLElement>,
  injector?: Injector,
): FieldTree<TValue> {
  return assertInjector(injectFieldControl, injector, () => {
    const htmlElement =
      element instanceof ElementRef ? element.nativeElement : element;
    const formContext = injectFormContext(injector);

    if (!formContext) {
      throw new Error(
        '[ngx-signal-forms] injectFieldControl() requires form context in the component tree. ' +
          'Add [formRoot] and ngxSignalForm to your <form> element: ' +
          '<form [formRoot]="myForm" ngxSignalForm>',
      );
    }

    const fieldName = resolveFieldName(htmlElement);

    if (!fieldName) {
      throw new Error(
        '[ngx-signal-forms] injectFieldControl() could not resolve field name from element. ' +
          `Element: ${htmlElement.outerHTML}`,
      );
    }

    const formInstance = formContext.form;

    // Navigate the field path (supports nested paths like "address.city")
    const pathParts = fieldName.split('.');
    let control: unknown = formInstance;

    for (const part of pathParts) {
      if (!isRecord(control) || !(part in control)) {
        throw new Error(
          `[ngx-signal-forms] Field "${fieldName}" not found in form. ` +
            `Could not access property "${part}".`,
        );
      }
      control = control[part];
    }

    return control as FieldTree<TValue>;
  });
}
