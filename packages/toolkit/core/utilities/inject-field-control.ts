import { ElementRef, Injector } from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import { assertInjector } from './assert-injector';
import { resolveFieldName } from './field-resolution';
import { injectFormContext } from './inject-form-context';
import { isFieldTree } from './walk-field-tree';

// Real `FieldTree` nodes are callable (`typeof` is `'function'`, not
// `'object'`) — see `isFieldTree` in `walk-field-tree.ts`, which requires
// every node to be invokable in order to read its `FieldState`. A guard that
// only accepted `'object'` would reject `formInstance` itself on the very
// first path segment for any real form, since the form root is a
// `FieldTree`. Only plain-object mocks (not real `FieldTree`s) would ever
// satisfy such a guard, which is why this bug shipped without failing tests.
const isNavigable = (value: unknown): value is Record<string, unknown> =>
  (typeof value === 'object' || typeof value === 'function') && value !== null;

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
 * @throws Error if field cannot be resolved, the resolved value does not
 *   satisfy the runtime `FieldTree` contract (see `isFieldTree`), or form
 *   context is not found
 *
 * @remarks
 * Resolution is a **one-shot, non-reactive** lookup: the form instance and
 * the element's `id` are both read once, at injection/call time. Swapping
 * the underlying form instance or assigning the element's `id` after this
 * call resolves will NOT be reflected — the returned `FieldTree` reference
 * is fixed for the lifetime of the caller. Re-invoke this function (e.g. in
 * a fresh `computed()`) if you need to track a form or id that can change.
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
      if (!isNavigable(control) || !(part in control)) {
        throw new Error(
          `[ngx-signal-forms] Field "${fieldName}" not found in form. ` +
            `Could not access property "${part}".`,
        );
      }
      control = control[part];
    }

    if (!isFieldTree(control)) {
      throw new Error(
        `[ngx-signal-forms] Field "${fieldName}" not found in form. ` +
          `Resolved value does not satisfy the FieldTree contract.`,
      );
    }

    return control as FieldTree<TValue>;
  });
}
