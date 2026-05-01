// Types
export type * from './types';

// Tokens — symbols tagged `@internal` are intentionally exported from this
// barrel because `/core` is a build-time-only secondary entry point hidden
// from the published `exports` map. Other toolkit entries (form-field,
// assistive, headless, debugger) import internal plumbing from
// `@ngx-signal-forms/toolkit/core` at build time; consumers cannot reach in.
export * from './tokens';

// Providers
export * from './providers/config.provider';
export * from './providers/control-semantics.provider';
export * from './providers/error-messages.provider';
export * from './providers/field-labels.provider';

// Services
export * from './services/field-identity';

// Directives
export * from './directives/auto-aria';
export * from './directives/control-semantics';
export {
  NgxSignalForm,
  type NgxSignalFormContext,
} from './directives/ngx-signal-form';

// Utilities
export {
  createHintIdsSignal,
  type CreateHintIdsSignalOptions,
  type HintIdsFieldNameReader,
  type HintIdsIdentityLike,
  type HintIdsRegistryLike,
  type HintIdsSignal,
} from './utilities/aria/create-hint-ids-signal';
export * from './utilities/cascading-resolver';
export * from './utilities/create-error-visibility';
export * from './utilities/create-unique-id';
export * from './utilities/control-semantics';
export * from './utilities/form-field-input';
export { shouldShowErrors } from './utilities/error-strategies';
export {
  isFieldStateHidden,
  isFieldStateInteractive,
} from './utilities/field-interactivity';
export * from './utilities/field-resolution';
export * from './utilities/find-bound-control';
export type * from './utilities/field-state-types';
export * from './utilities/focus-first-invalid';
export {
  humanizeFieldPath,
  stripAngularFormPrefix,
} from './utilities/humanize-field-path';
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
  InvalidFieldTreeError,
  walkFieldTreeEntries,
  walkFieldTree,
  walkFieldTreeIterable,
} from './utilities/walk-field-tree';
export {
  isBlockingError,
  isWarningError,
  splitByKind,
  type SplitErrors,
  warningError,
} from './utilities/warning-error';

// Convenience imports
import { FormRoot } from '@angular/forms/signals';
import { NgxSignalFormAutoAria } from './directives/auto-aria';
import { NgxSignalFormControlSemanticsDirective } from './directives/control-semantics';
import { NgxSignalForm } from './directives/ngx-signal-form';

/**
 * Bundled imports for the ngx-signal-forms toolkit core directives.
 *
 * This constant provides a convenient way to import all essential toolkit directives
 * in a single import statement, reducing boilerplate in component imports.
 *
 * @example
 * ```typescript
 * import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
 * import { NgxFormFieldError } from '@ngx-signal-forms/toolkit/assistive';
 *
 * @Component({
 *   selector: 'ngx-my-form',
 *   imports: [FormField, NgxSignalFormToolkit, NgxFormFieldError],
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
 * - {@link NgxSignalForm} - Adds toolkit context and error strategy
 * - {@link NgxSignalFormAutoAria} - Automatically applies ARIA attributes
 * - {@link NgxSignalFormControlSemanticsDirective} - Declares stable wrapper/ARIA semantics for a control
 *
 * **For error display:** Import `NgxFormFieldError` from `@ngx-signal-forms/toolkit/assistive`
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
  NgxSignalForm,
  NgxSignalFormAutoAria,
  NgxSignalFormControlSemanticsDirective,
] as const;
