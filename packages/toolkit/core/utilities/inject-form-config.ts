import { Injector, inject } from '@angular/core';
import { NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import { assertInjector } from './assert-injector';
import type { NgxSignalFormsConfig } from '../types';
import { normalizeSignalFormsConfig } from './normalize-config';

/**
 * Custom Inject Function (CIF) for retrieving the global form configuration.
 * Works both inside and outside Angular injection context when an injector is provided.
 *
 * This pattern is inspired by ngxtension's Custom Inject Functions.
 * @see https://github.com/ngxtension/ngxtension-platform
 *
 * @param injector - Optional injector for use outside injection context
 * @returns The global form configuration, or default config if not provided
 *
 * @example
 * ```typescript
 * // Inside injection context (component, directive, service)
 * const config = injectFormConfig();
 *
 * // Outside injection context (utility function)
 * function myUtility(element: HTMLElement, injector?: Injector) {
 *   const config = injectFormConfig(injector);
 *   // Use config...
 * }
 *
 * // In tests
 * const config = injectFormConfig(TestBed.inject(Injector));
 * ```
 */
export function injectFormConfig(injector?: Injector): NgxSignalFormsConfig {
  return assertInjector(
    injectFormConfig as (...args: unknown[]) => unknown,
    injector,
    () => {
      const config = inject(NGX_SIGNAL_FORMS_CONFIG, { optional: true });
      return normalizeSignalFormsConfig(config);
    },
  );
}
