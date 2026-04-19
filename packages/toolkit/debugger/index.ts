/**
 * `@ngx-signal-forms/toolkit/debugger`
 *
 * Development debugging tools for Angular Signal Forms.
 * Provides a visual debugger panel that displays form state, validation errors,
 * and warnings in real-time.
 *
 * @example
 * ```typescript
 * import { NgxSignalFormDebuggerToolkit } from '@ngx-signal-forms/toolkit/debugger';
 *
 * @Component({
 *   imports: [NgxSignalFormDebuggerToolkit],
 *   template: `
 *     <form (submit)="save($event)">
 *       <input [formField]="form.email" />
 *       <ngx-signal-form-debugger [formTree]="form" />
 *     </form>
 *   `
 * })
 * export class MyFormComponent { ... }
 * ```
 */

import {
  NgxSignalFormDebuggerBadge,
  NgxSignalFormDebuggerBadgeIcon,
} from './debugger-badge';
import { NgxSignalFormDebugger } from './signal-form-debugger';

// Main debugger component
export { NgxSignalFormDebugger } from './signal-form-debugger';

// Internal badge components (exposed for advanced customization)
export {
  NgxSignalFormDebuggerBadge,
  NgxSignalFormDebuggerBadgeIcon,
  type NgxSignalFormDebuggerBadgeAppearance,
  type NgxSignalFormDebuggerBadgeVariant,
} from './debugger-badge';

/**
 * Convenience bundle for the signal form debugger.
 *
 * @example
 * ```typescript
 * import { NgxSignalFormDebuggerToolkit } from '@ngx-signal-forms/toolkit/debugger';
 *
 * @Component({
 *   imports: [NgxSignalFormDebuggerToolkit],
 *   // ...
 * })
 * ```
 */
export const NgxSignalFormDebuggerToolkit = [
  NgxSignalFormDebugger,
  NgxSignalFormDebuggerBadge,
  NgxSignalFormDebuggerBadgeIcon,
] as const;
