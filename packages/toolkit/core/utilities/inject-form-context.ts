import { Injector, inject } from '@angular/core';
import type { NgxSignalFormContext } from '../directives/ngx-signal-form.directive';
import { NGX_SIGNAL_FORM_CONTEXT } from '../tokens';
import { assertInjector } from './assert-injector';

/**
 * Custom Inject Function (CIF) for retrieving the form context from FormProviderDirective.
 * Works both inside and outside Angular injection context when an injector is provided.
 *
 * This pattern is inspired by ngxtension's Custom Inject Functions.
 * @see https://github.com/ngxtension/ngxtension-platform
 *
 * @param injector - Optional injector for use outside injection context
 * @returns The form context with submission state and other form-level data, or undefined if not available
 *
 * @example
 * ```typescript
 * /// Inside injection context (component, directive, service)
 * const formContext = injectFormContext();
 * if (formContext) {
 *   const submittedStatus = formContext.submittedStatus();
 * }
 *
 * /// Outside injection context (utility function)
 * function myUtility(injector?: Injector) {
 *   const formContext = injectFormContext(injector);
 *   // Use formContext...
 * }
 *
 * /// In tests
 * const formContext = injectFormContext(TestBed.inject(Injector));
 * ```
 */
export function injectFormContext(
  injector?: Injector,
): NgxSignalFormContext | undefined {
  return assertInjector(
    injectFormContext as (...args: unknown[]) => unknown,
    injector,
    () => {
      // Return undefined if context is not available (component can work without provider)
      return inject(NGX_SIGNAL_FORM_CONTEXT, { optional: true }) ?? undefined;
    },
  );
}
