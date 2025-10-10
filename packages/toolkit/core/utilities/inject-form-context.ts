import { Injector, inject } from '@angular/core';
import { NGX_SIGNAL_FORM_CONTEXT } from '../tokens';
import { assertInjector } from './assert-injector';
import type { NgxSignalFormContext } from '../directives/form-provider.directive';

/**
 * Custom Inject Function (CIF) for retrieving the form context from FormProviderDirective.
 * Works both inside and outside Angular injection context when an injector is provided.
 *
 * This pattern is inspired by ngxtension's Custom Inject Functions.
 * @see https://github.com/ngxtension/ngxtension-platform
 *
 * @template TForm - The Signal Forms instance type
 * @param injector - Optional injector for use outside injection context
 * @returns The form context with submission state and other form-level data
 * @throws Error if FormProviderDirective is not found in the component tree
 *
 * @example
 * ```typescript
 * // Inside injection context (component, directive, service)
 * const formContext = injectFormContext<MyFormType>();
 * const hasSubmitted = formContext.hasSubmitted();
 *
 * // Outside injection context (utility function)
 * function myUtility(injector?: Injector) {
 *   const formContext = injectFormContext<MyFormType>(injector);
 *   // Use formContext...
 * }
 *
 * // In tests
 * const formContext = injectFormContext(TestBed.inject(Injector));
 * ```
 */
export function injectFormContext<TForm = unknown>(
  injector?: Injector,
): NgxSignalFormContext<TForm> {
  return assertInjector(
    injectFormContext as (...args: unknown[]) => unknown,
    injector,
    () => {
      const context = inject(NGX_SIGNAL_FORM_CONTEXT, { optional: true });

      if (!context) {
        throw new Error(
          '[ngx-signal-forms] injectFormContext() requires NgxSignalFormProviderDirective to be present in the component tree. ' +
            'Add [ngxSignalFormProvider] to your form element.',
        );
      }

      return context as NgxSignalFormContext<TForm>;
    },
  );
}
