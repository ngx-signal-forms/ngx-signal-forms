// Types
export type * from './types';

// Tokens — symbols tagged `@internal` in their JSDoc are documented as
// non-public but still re-exported here because ng-packagr secondary entry
// points cannot reach outside their own tree. Hiding them behind a
// dedicated internal sub-path would require promoting `core/` into its own
// secondary entry point; that refactor is tracked as a follow-up.
export * from './tokens';

// Providers
export * from './providers/config.provider';
export * from './providers/control-semantics.provider';
export * from './providers/error-messages.provider';
export * from './providers/field-labels.provider';

// Directives
export * from './directives/auto-aria.directive';
export * from './directives/control-semantics.directive';
export {
  NgxSignalFormDirective,
  type NgxSignalFormContext,
} from './directives/ngx-signal-form.directive';

// Utilities
export * from './utilities/create-unique-id';
export * from './utilities/control-semantics';
export { shouldShowErrors } from './utilities/error-strategies';
export {
  isFieldStateHidden,
  isFieldStateInteractive,
} from './utilities/field-interactivity';
export * from './utilities/field-resolution';
export type * from './utilities/field-state-types';
export * from './utilities/focus-first-invalid';
export { updateAt, updateNested } from './utilities/immutable-array';
export * from './utilities/inject-field-control';
export * from './utilities/inject-form-context';
export * from './utilities/on-invalid-handler';
export * from './utilities/read-direct-errors';
export * from './utilities/resolve-error-message';
export {
  resolveErrorDisplayStrategy,
  resolveStrategyFromContext,
  resolveSubmittedStatusFromContext,
} from './utilities/resolve-strategy';
export {
  combineShowErrors,
  createShowErrorsComputed,
  showErrors,
} from './utilities/show-errors';
export * from './utilities/submission-helpers';
export { unwrapValue } from './utilities/unwrap-signal-or-value';
export {
  isBlockingError,
  isWarningError,
  splitByKind,
  type SplitErrors,
  warningError,
} from './utilities/warning-error';

// Convenience imports
import { FormRoot } from '@angular/forms/signals';
import { NgxSignalFormAutoAriaDirective } from './directives/auto-aria.directive';
import { NgxSignalFormControlSemanticsDirective } from './directives/control-semantics.directive';
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
 * import { NgxFormFieldErrorComponent } from '@ngx-signal-forms/toolkit/assistive';
 *
 * @Component({
 *   selector: 'ngx-my-form',
 *   imports: [FormField, NgxSignalFormToolkit, NgxFormFieldErrorComponent],
 *   template: `
 *     <form [formRoot]="myForm" ngxSignalForm>
 *       <input [formField]="myForm.email" />
 *       <ngx-form-field-error [formField]="myForm.email" fieldName="email" />
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
 * - {@link FormRoot} - Angular-owned submit and `novalidate` behavior
 * - {@link NgxSignalFormDirective} - Adds toolkit context and error strategy
 * - {@link NgxSignalFormAutoAriaDirective} - Automatically applies ARIA attributes
 * - {@link NgxSignalFormControlSemanticsDirective} - Declares stable wrapper/ARIA semantics for a control
 *
 * **For error display:** Import `NgxFormFieldErrorComponent` from `@ngx-signal-forms/toolkit/assistive`
 *
 * **Benefits:**
 * - Single import instead of multiple individual imports
 * - Type-safe readonly tuple
 * - Cleaner component metadata
 *
 * @public
 */
export const NgxSignalFormToolkit = [
  FormRoot,
  NgxSignalFormDirective,
  NgxSignalFormAutoAriaDirective,
  NgxSignalFormControlSemanticsDirective,
] as const;
