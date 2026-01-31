// Types
export * from './types';

// Tokens
export * from './tokens';

// Providers
export * from './providers/config.provider';
export * from './providers/error-messages.provider';

// Directives
export * from './directives/auto-aria.directive';
export {
  NgxSignalFormDirective,
  type NgxSignalFormContext,
} from './directives/ngx-signal-form.directive';

// Utilities
export * from './utilities/assert-injector';
export { shouldShowErrors } from './utilities/error-strategies';
export * from './utilities/field-resolution';
export * from './utilities/focus-first-invalid';
export * from './utilities/inject-field-control';
export * from './utilities/inject-form-config';
export * from './utilities/inject-form-context';
export { combineShowErrors, showErrors } from './utilities/show-errors';
export * from './utilities/submission-helpers';
export { unwrapValue } from './utilities/unwrap-signal-or-value';
export {
  isBlockingError,
  isWarningError,
  warningError,
} from './utilities/warning-error';

// Future exports:
// export * from './directives/form-busy.directive';

// Convenience imports
import { NgxSignalFormAutoAriaDirective } from './directives/auto-aria.directive';
import { NgxSignalFormDirective } from './directives/ngx-signal-form.directive';

/**
 * Bundled imports for the ngx-signal-forms toolkit core directives.
 *
 * This constant provides a convenient way to import all essential toolkit directives
 * in a single import statement, reducing boilerplate in component imports.
 *
 * @example
 * ```typescript
 * import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
 * import { NgxSignalFormErrorComponent } from '@ngx-signal-forms/toolkit/assistive';
 *
 * @Component({
 *   selector: 'ngx-my-form',
 *   imports: [FormField, NgxSignalFormToolkit, NgxSignalFormErrorComponent],
 *   template: `
 *     <form [ngxSignalForm]="myForm">
 *       <input [formField]="myForm.email" />
 *       <ngx-signal-form-error [formField]="myForm.email" fieldName="email" />
 *     </form>
 *   `
 * })
 * export class MyFormComponent {
 *   // ...
 * }
 * ```
 *
 * @remarks
 * **Contents:**
 * - {@link NgxSignalFormDirective} - Provides form context to child components
 * - {@link NgxSignalFormAutoAriaDirective} - Automatically applies ARIA attributes
 *
 * **For error display:** Import `NgxSignalFormErrorComponent` from `@ngx-signal-forms/toolkit/assistive`
 *
 * **Benefits:**
 * - Single import instead of multiple individual imports
 * - Type-safe readonly tuple
 * - Cleaner component metadata
 *
 * @public
 */
export const NgxSignalFormToolkit = [
  NgxSignalFormDirective,
  NgxSignalFormAutoAriaDirective,
] as const;
