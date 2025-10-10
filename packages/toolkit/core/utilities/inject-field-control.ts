import { Injector, ElementRef } from '@angular/core';
import { assertInjector } from './assert-injector';
import { resolveFieldName } from './field-resolution';
import { injectFormContext } from './inject-form-context';

/**
 * Custom Inject Function (CIF) for retrieving a specific field control from the form.
 * Works both inside and outside Angular injection context when an injector is provided.
 *
 * This pattern is inspired by ngxtension's Custom Inject Functions.
 * @see https://github.com/ngxtension/ngxtension-platform
 *
 * @param element - The HTML element or ElementRef to resolve the field name from
 * @param injector - Optional injector for use outside injection context
 * @returns The field control signal from the form
 * @throws Error if field cannot be resolved or FormProviderDirective is not found
 *
 * @example
 * ```typescript
 * // Inside a directive
 * @Directive({ selector: '[myDirective]' })
 * export class MyDirective {
 *   readonly #element = inject(ElementRef);
 *   readonly fieldControl = injectFieldControl(this.#element);
 *
 *   constructor() {
 *     effect(() => {
 *       console.log('Field state:', this.fieldControl());
 *     });
 *   }
 * }
 *
 * // Outside injection context
 * function myUtility(element: HTMLElement, injector: Injector) {
 *   const fieldControl = injectFieldControl(element, injector);
 *   // Use fieldControl...
 * }
 * ```
 */
export function injectFieldControl(
  element: HTMLElement | ElementRef<HTMLElement>,
  injector?: Injector,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any {
  return assertInjector(
    injectFieldControl as (...args: unknown[]) => unknown,
    injector,
    () => {
      const htmlElement =
        element instanceof ElementRef ? element.nativeElement : element;
      const formContext = injectFormContext(injector);
      const fieldName = resolveFieldName(htmlElement, injector);

      if (!fieldName) {
        throw new Error(
          '[ngx-signal-forms] injectFieldControl() could not resolve field name from element. ' +
            `Element: ${htmlElement.outerHTML}`,
        );
      }

      // Navigate the field path (supports nested paths like "address.city")
      const pathParts = fieldName.split('.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let control: any = formContext.form;

      for (const part of pathParts) {
        if (!control || typeof control !== 'object' || !(part in control)) {
          throw new Error(
            `[ngx-signal-forms] Field "${fieldName}" not found in form. ` +
              `Could not access property "${part}".`,
          );
        }
        control = control[part];
      }

      return control;
    },
  );
}
