import {
  InjectionToken,
  makeEnvironmentProviders,
  type EnvironmentProviders,
} from '@angular/core';
import {
  provideSignalFormsConfig,
  type FormField,
  type SignalFormsConfig,
} from '@angular/forms/signals';

// Global declaration for ngDevMode (provided by Angular)
declare const ngDevMode: boolean | undefined;

/**
 * Options for configuring the automatic status classes.
 */
export interface NgxStatusClassesOptions {
  /**
   * The strategy to determine when to apply status classes.
   * - 'on-touch': Applies classes only when field is touched (default).
   * - 'immediate': Applies classes immediately based on validity.
   */
  strategy?: 'on-touch' | 'immediate';

  /** Class to apply when field is valid. Default: 'ng-valid' */
  validClass?: string;
  /** Class to apply when field is invalid. Default: 'ng-invalid' */
  invalidClass?: string;
  /** Class to apply when field is touched. Default: 'ng-touched' */
  touchedClass?: string;
  /** Class to apply when field is untouched. Default: 'ng-untouched' */
  untouchedClass?: string;
  /** Class to apply when field is dirty. Default: 'ng-dirty' */
  dirtyClass?: string;
  /** Class to apply when field is pristine. Default: 'ng-pristine' */
  pristineClass?: string;
}

/**
 * @internal
 * Injection token to track if status classes were provided via the convenience provider.
 */
const NGX_STATUS_CLASSES_PROVIDED = new InjectionToken<boolean>(
  'NGX_STATUS_CLASSES_PROVIDED',
);

/**
 * Generates a CSS status class configuration for Angular Signal Forms that aligns with toolkit strategies.
 *
 * This utility creates a configuration object compatible with Angular 21.1+ provideSignalFormsConfig.
 * It allows you to align CSS status classes (like ng-invalid) with the toolkit's error display behavior
 * (e.g., showing invalid class only after the field is touched).
 *
 * Recommended approach for composability and flexibility.
 *
 * @param options - Configuration options for status classes
 * @returns A classes configuration object for SignalFormsConfig
 *
 * @example
 * In app.config.ts (Recommended: composable with other config):
 * providers: [
 *   provideSignalFormsConfig({
 *     classes: ngxStatusClasses({
 *       strategy: 'on-touch',
 *       invalidClass: 'is-invalid',
 *     }),
 *   })
 * ]
 *
 * @see provideNgxStatusClasses for a convenience provider (simpler but less flexible)
 */
export function ngxStatusClasses(
  options?: NgxStatusClassesOptions,
): SignalFormsConfig['classes'] {
  const {
    strategy = 'on-touch',
    validClass = 'ng-valid',
    invalidClass = 'ng-invalid',
    touchedClass = 'ng-touched',
    untouchedClass = 'ng-untouched',
    dirtyClass = 'ng-dirty',
    pristineClass = 'ng-pristine',
  } = options || {};

  return {
    [touchedClass]: (formField: FormField<unknown>) =>
      formField.state().touched(),
    [untouchedClass]: (formField: FormField<unknown>) =>
      !formField.state().touched(),
    [dirtyClass]: (formField: FormField<unknown>) => formField.state().dirty(),
    [pristineClass]: (formField: FormField<unknown>) =>
      !formField.state().dirty(),
    [validClass]: (formField: FormField<unknown>) => {
      const state = formField.state();
      // If valid, strategies usually don't block showing valid state, but consistency is key.
      // Usually valid state is nice to show immediately or on touch.
      // Angular's default behavior is immediate.
      // If we opt for 'on-touch', we should hide it until touched.
      if (strategy === 'on-touch') {
        return state.valid() && state.touched();
      }
      return state.valid();
    },
    [invalidClass]: (formField: FormField<unknown>) => {
      const state = formField.state();
      if (strategy === 'on-touch') {
        return state.invalid() && state.touched();
      }
      return state.invalid();
    },
  };
}

/**
 * Convenience provider for automatic CSS status classes that align with toolkit strategies.
 *
 * This is a simpler alternative to using ngxStatusClasses() directly with provideSignalFormsConfig.
 * Use this when you ONLY need status classes and don't need to configure other Signal Forms options.
 *
 * WARNING: Do NOT use this together with provideSignalFormsConfig classes option.
 * If you need to configure other Signal Forms options, use ngxStatusClasses() directly instead.
 *
 * @param options - Configuration options for status classes
 * @returns Environment providers for the application
 *
 * @example
 * Simple case - Only need status classes:
 * providers: [
 *   provideNgxStatusClasses({
 *     strategy: 'on-touch',
 *     invalidClass: 'is-invalid'
 *   })
 * ]
 *
 * WRONG - Don't mix approaches:
 * providers: [
 *   provideNgxStatusClasses({ strategy: 'on-touch' }),
 *   provideSignalFormsConfig({ classes: {...} })
 * ]
 *
 * CORRECT - Use ngxStatusClasses() for composability:
 * providers: [
 *   provideSignalFormsConfig({
 *     classes: ngxStatusClasses({ strategy: 'on-touch' }),
 *   })
 * ]
 *
 * @see ngxStatusClasses for the composable utility function (recommended for complex setups)
 */
export function provideNgxStatusClasses(
  options?: NgxStatusClassesOptions,
): EnvironmentProviders {
  if (typeof ngDevMode !== 'undefined' && ngDevMode) {
    // Log warning about potential conflicts
    console.info(
      '[ngx-signal-forms/toolkit] Using provideNgxStatusClasses(). ' +
        'If you also use provideSignalFormsConfig(), consider using ngxStatusClasses() instead for better composability.',
    );
  }

  return makeEnvironmentProviders([
    { provide: NGX_STATUS_CLASSES_PROVIDED, useValue: true },
    provideSignalFormsConfig({ classes: ngxStatusClasses(options) }),
  ]);
}
