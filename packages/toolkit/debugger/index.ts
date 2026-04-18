/**
 * `@ngx-signal-forms/toolkit/debugger`
 *
 * Development debugging tools for Angular Signal Forms.
 * Provides a visual debugger panel that displays form state, validation errors,
 * and warnings in real-time.
 *
 * @example
 * ```typescript
 * import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';
 *
 * @Component({
 *   imports: [NgxSignalFormDebugger],
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

import { DebuggerBadge, DebuggerBadgeIcon } from './debugger-badge';
import { SignalFormDebugger } from './signal-form-debugger';

// Main debugger component
export { SignalFormDebugger } from './signal-form-debugger';

// Internal badge components (exposed for advanced customization)
export {
  DebuggerBadge,
  DebuggerBadgeIcon,
  type DebuggerBadgeAppearance,
  type DebuggerBadgeVariant,
} from './debugger-badge';

/**
 * Convenience bundle for the signal form debugger.
 *
 * @example
 * ```typescript
 * import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';
 *
 * @Component({
 *   imports: [NgxSignalFormDebugger],
 *   // ...
 * })
 * ```
 */
export const NgxSignalFormDebugger = [
  SignalFormDebugger,
  DebuggerBadge,
  DebuggerBadgeIcon,
] as const;
