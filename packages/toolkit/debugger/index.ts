/**
 * @ngx-signal-forms/toolkit/debugger
 *
 * Development debugging tools for Angular Signal Forms.
 * Provides a visual debugger panel that displays form state, validation errors,
 * and warnings in real-time.
 *
 * @example
 * ```typescript
 * import { SignalFormDebuggerComponent } from '@ngx-signal-forms/toolkit/debugger';
 *
 * @Component({
 *   imports: [FormField, SignalFormDebuggerComponent],
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

// Main debugger component
export { SignalFormDebuggerComponent } from './signal-form-debugger.component';

// Internal badge components (exposed for advanced customization)
export {
  DebuggerBadgeComponent,
  DebuggerBadgeIconDirective,
  type DebuggerBadgeAppearance,
  type DebuggerBadgeVariant,
} from './debugger-badge.component';
