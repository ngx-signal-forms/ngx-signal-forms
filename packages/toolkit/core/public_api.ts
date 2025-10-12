// Types
export * from './types';

// Tokens
export * from './tokens';

// Providers
export * from './providers/config.provider';

// Directives
export * from './directives/placeholder.directive';
export * from './directives/auto-aria.directive';
export * from './directives/form-provider.directive';

// Components
export * from './components/form-error.component';

// Utilities
export * from './utilities/field-resolution';
export * from './utilities/warning-error';

// Future exports:
// export * from './directives/form-busy.directive';
// export * from './components/form-error.component';
// export * from './utilities/error-strategies';
// export * from './utilities/show-errors';

// Convenience imports
import { NgxSignalFormProviderDirective } from './directives/form-provider.directive';
import { NgxSignalFormAutoAriaDirective } from './directives/auto-aria.directive';
import { NgxSignalFormErrorComponent } from './components/form-error.component';

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
 *   selector: 'app-my-form',
 *   imports: [Control, NgxSignalFormToolkit],
 *   template: `
 *     <form [ngxSignalFormProvider]="myForm">
 *       <input [control]="myForm.email" />
 *       <ngx-signal-form-error [field]="myForm.email" fieldName="email" />
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
 * - {@link NgxSignalFormProviderDirective} - Provides form context to child components
 * - {@link NgxSignalFormAutoAriaDirective} - Automatically applies ARIA attributes
 * - {@link NgxSignalFormErrorComponent} - Displays validation errors and warnings
 *
 * **Benefits:**
 * - Single import instead of three individual imports
 * - Type-safe readonly tuple
 * - Cleaner component metadata
 * - Better developer experience
 * - Aligned with ngx-vest-forms architecture
 *
 * **Alternative:**
 * You can still import individual items if you need only specific directives/components:
 * ```typescript
 * import { NgxSignalFormProviderDirective, NgxSignalFormErrorComponent } from '@ngx-signal-forms/toolkit/core';
 * ```
 *
 * @public
 */
export const NgxSignalFormToolkit = [
  NgxSignalFormProviderDirective,
  NgxSignalFormAutoAriaDirective,
  NgxSignalFormErrorComponent,
] as const;
