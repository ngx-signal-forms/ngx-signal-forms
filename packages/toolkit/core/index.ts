// Types
export * from './types';

// Tokens
export * from './tokens';

// Providers
export * from './providers/config.provider';
export * from './providers/error-messages.provider';
export {
  ngxStatusClasses,
  provideNgxStatusClasses,
} from './utilities/status-classes';
export type { NgxStatusClassesOptions } from './utilities/status-classes';

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
export * from './utilities/inject-field-control';
export * from './utilities/inject-form-config';
export * from './utilities/inject-form-context';
export { combineShowErrors, showErrors } from './utilities/show-errors';
export * from './utilities/warning-error';

// Components
export * from './components/form-error.component';

// Future exports:
// export * from './directives/form-busy.directive';

// Convenience imports
import { NgxSignalFormErrorComponent } from './components/form-error.component';
import { NgxSignalFormAutoAriaDirective } from './directives/auto-aria.directive';
import { NgxSignalFormDirective } from './directives/ngx-signal-form.directive';

/**
 * Bundled imports for the ngx-signal-forms toolkit core directives and components.
 *
 * This constant provides a convenient way to import all essential toolkit directives
 * and components in a single import statement, reducing boilerplate in component imports.
 *
 * @example
 * ```typescript
 * import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit/core';
 *
 * @Component({
 *   selector: 'ngx-my-form',
 *   imports: [FormField, NgxSignalFormToolkit],
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
 * - {@link NgxSignalFormErrorComponent} - Displays validation errors and warnings
 *
 * **Benefits:**
 * - Single import instead of three individual imports
 * - Type-safe readonly tuple
 * - Cleaner component metadata
 * - Better developer experience
 *
 * **Alternative:**
 * You can still import individual items if you need only specific directives/components:
 * ```typescript
 * import { ngxSignalFormDirective, NgxSignalFormErrorComponent } from '@ngx-signal-forms/toolkit/core';
 * ```
 *
 * @public
 */
export const NgxSignalFormToolkit = [
  NgxSignalFormDirective,
  NgxSignalFormAutoAriaDirective,
  NgxSignalFormErrorComponent,
] as const;
