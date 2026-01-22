import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import type { FieldState } from '@angular/forms/signals';
import {
  NGX_SIGNAL_FORM_CONTEXT,
  type ErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import { BadgeComponent, BadgeIconDirective } from '../badge';

/**
 * Enhanced Signal Form Debugger Component
 *
 * Displays comprehensive state and validation information for Angular Signal Forms.
 * Designed for development and debugging purposes with rich UI and detailed insights.
 *
 * **Features**:
 * - Form state badges (Valid, Invalid, Dirty, Pending, Submitted Status)
 * - Live model values with JSON formatting
 * - Validation errors separated into blocking errors and warnings
 * - Collapsible sections for better organization
 * - Dark mode support
 * - Automatic submission status tracking (via form provider)
 *
 * **Requirements**:
 * - Must be used within a form with `[ngxSignalForm]` directive
 * - Form provider automatically supplies submission status
 *
 * @example Basic usage
 * ```html
 * <form [ngxSignalForm]="userForm" (submit)="handleSubmit($event)">
 *   <input [formField]="userForm.email" />
 *   <ngx-signal-form-debugger [formTree]="userForm()" />
 * </form>
 * ```
 *
 * @example Custom title
 * ```html
 * <ngx-signal-form-debugger
 *   [formTree]="userForm()"
 *   title="User Registration Form"
 * />
 * ```
 */
@Component({
  selector: 'ngx-signal-form-debugger',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [JsonPipe, BadgeComponent, BadgeIconDirective],
  templateUrl: './signal-form-debugger.component.html',
  styleUrl: './signal-form-debugger.component.scss',
})
export class SignalFormDebuggerComponent {
  /** Safely read errorSummary() from a state-like object if available */
  #errorSummaryOf(v: unknown): Array<{ kind: string; message?: string }> {
    const fn = (v as { errorSummary?: () => unknown }).errorSummary;
    if (typeof fn === 'function') {
      const result = fn();
      return Array.isArray(result)
        ? (result as Array<{ kind: string; message?: string }>)
        : [];
    }
    return [];
  }
  /** Inject form context (provides submittedStatus automatically) */
  readonly #formContext = inject(NGX_SIGNAL_FORM_CONTEXT, { optional: true });

  /**
   * The Signal Form to display.
   * Accepts either the FieldTree function (preferred) or the FieldState root.
   */
  readonly formTree = input.required<unknown>();

  /**
   * The error display strategy currently in effect.
   * Used to show which errors are hidden vs visible.
   */
  readonly errorStrategy = input<ErrorDisplayStrategy>('on-touch');

  /** Type guard: FieldTree function (callable + indexable) */
  readonly #isFieldTree = (
    v: unknown,
  ): v is { (): FieldState<unknown> } & Record<string, unknown> =>
    typeof v === 'function';

  /** Normalize to root FieldState regardless of input shape */
  protected readonly rootState = computed<FieldState<unknown>>(() => {
    const v = this.formTree() as unknown;
    if (this.#isFieldTree(v)) {
      return (v as () => FieldState<unknown>)();
    }
    return v as FieldState<unknown>;
  });

  /** Title for the debugger display */
  readonly title = input<string>('Form State & Validation');

  /** Subtitle for context */
  readonly subtitle = input<string>('Live debugging information');

  // ============================================================================
  // Form State Computed Values
  // ============================================================================

  /** Current form model (data values) */
  protected readonly model = computed(() => this.rootState().value());

  /** Is the form valid? */
  protected readonly valid = computed(() => this.rootState().valid());

  /** Is the form invalid? */
  protected readonly invalid = computed(() => this.rootState().invalid());

  /** Is the form dirty? */
  protected readonly dirty = computed(() => this.rootState().dirty());

  /** Is the form pending async validation? */
  protected readonly pending = computed(() => this.rootState().pending());

  /**
   * Submission status from Angular Signal Forms.
   * Automatically injected from form provider if available.
   */
  protected readonly submittedStatus = computed(() => {
    return this.#formContext?.submittedStatus() ?? 'unsubmitted';
  });

  /** Submission status display text */
  protected readonly submittedStatusDisplay = computed(() => {
    const status = this.submittedStatus();
    switch (status) {
      case 'submitting':
        return '🚀 Submitting';
      case 'submitted':
        return '✅ Submitted';
      default:
        return 'Idle';
    }
  });

  // ============================================================================
  // Error Handling
  // ============================================================================

  /**
   * Root-level errors (cross-field validation)
   * These are errors on the form itself, not on individual fields
   */
  protected readonly rootErrors = computed(() => this.rootState().errors());

  /**
   * All errors including descendants.
   * Strategy:
   * - If a FieldTree function is provided: traverse children and collect errors
   * - Otherwise (FieldState): fallback to errorSummary() on the root state
   */
  protected readonly allErrors = computed(() => {
    const input = this.formTree();
    if (this.#isFieldTree(input)) {
      // Traverse the FieldTree using the model shape
      const state = (input as () => FieldState<unknown>)();
      const value = state.value();
      const collected: Array<{ kind: string; message?: string }> = [];

      const visit = (tree: Record<string, unknown>, model: unknown): void => {
        if (model && typeof model === 'object' && !Array.isArray(model)) {
          for (const key of Object.keys(model as Record<string, unknown>)) {
            const child = (tree as Record<string, unknown>)[key];
            if (typeof child === 'function') {
              const childState = (child as () => FieldState<unknown>)();
              // Collect direct errors on this field
              collected.push(
                ...((childState.errors() ?? []) as Array<{
                  kind: string;
                  message?: string;
                }>),
              );
              // Also collect any available summary from this child (defensive)
              collected.push(...this.#errorSummaryOf(childState));
              // Recurse deeper using the model branch
              const nextModel = (model as Record<string, unknown>)[
                key
              ] as unknown;
              visit(child as unknown as Record<string, unknown>, nextModel);
            }
          }
        } else if (Array.isArray(model)) {
          for (let i = 0; i < model.length; i++) {
            const child = (tree as unknown as Record<number, unknown>)[i];
            if (typeof child === 'function') {
              const childState = (child as () => FieldState<unknown>)();
              collected.push(
                ...((childState.errors() ?? []) as Array<{
                  kind: string;
                  message?: string;
                }>),
              );
              collected.push(...this.#errorSummaryOf(childState));
              visit(child as unknown as Record<string, unknown>, model[i]);
            }
          }
        }
      };

      visit(input as unknown as Record<string, unknown>, value);
      // Prefer built-in summary when it exists (most reliable)
      const rootSummary = this.#errorSummaryOf(state);
      if (rootSummary.length > 0) {
        return rootSummary;
      }
      // Fallback: combine root errors and collected child errors/summaries
      return [
        ...((state.errors?.() ?? []) as Array<{
          kind: string;
          message?: string;
        }>),
        ...collected,
      ];
    }

    // Fallback: rely on built-in summary when only FieldState is available
    const root = this.rootState();
    const summary = this.#errorSummaryOf(root);
    // If summary is unexpectedly empty but form is invalid, include root errors at least
    return summary.length > 0
      ? summary
      : ((root.errors?.() ?? []) as Array<{
          kind: string;
          message?: string;
        }>);
  });

  /** Field-level errors (exclude root-level ones from the summary) */
  protected readonly fieldErrors = computed(() => {
    const root = this.rootErrors();
    const all = this.allErrors();
    return all.filter(
      (e: unknown): e is { kind: string; message: string } =>
        typeof e === 'object' &&
        e !== null &&
        'kind' in e &&
        typeof (e as { kind: string }).kind === 'string' &&
        // Exclude any error that matches a root-level error by kind+message
        !root.some(
          (r) =>
            r &&
            typeof r === 'object' &&
            'kind' in r &&
            (r as { kind: string }).kind === (e as { kind: string }).kind &&
            'message' in r &&
            (r as { message?: string }).message ===
              (e as { message?: string }).message,
        ),
    );
  });

  /** Root-level blocking errors */
  protected readonly rootBlockingErrors = computed(() =>
    this.rootErrors().filter((error) => !error.kind.startsWith('warn:')),
  );

  /** Root-level warnings */
  protected readonly rootWarningErrors = computed(() =>
    this.rootErrors().filter((error) => error.kind.startsWith('warn:')),
  );

  /** Field-level blocking errors */
  protected readonly fieldBlockingErrors = computed(() =>
    this.fieldErrors().filter(
      (error: unknown): error is { kind: string; message: string } =>
        typeof error === 'object' &&
        error !== null &&
        'kind' in error &&
        typeof (error as { kind: string }).kind === 'string' &&
        !(error as { kind: string }).kind.startsWith('warn:'),
    ),
  );

  /** Field-level warnings */
  protected readonly fieldWarningErrors = computed(() =>
    this.fieldErrors().filter(
      (error: unknown): error is { kind: string; message: string } =>
        typeof error === 'object' &&
        error !== null &&
        'kind' in error &&
        typeof (error as { kind: string }).kind === 'string' &&
        (error as { kind: string }).kind.startsWith('warn:'),
    ),
  );

  /** All blocking errors (root + field) */
  protected readonly blockingErrors = computed(() =>
    this.allErrors().filter(
      (error: unknown): error is { kind: string; message: string } =>
        typeof error === 'object' &&
        error !== null &&
        'kind' in error &&
        typeof (error as { kind: string }).kind === 'string' &&
        !(error as { kind: string }).kind.startsWith('warn:'),
    ),
  );

  /** All warning errors (root + field) */
  protected readonly warningErrors = computed(() =>
    this.allErrors().filter(
      (error: unknown): error is { kind: string; message: string } =>
        typeof error === 'object' &&
        error !== null &&
        'kind' in error &&
        typeof (error as { kind: string }).kind === 'string' &&
        (error as { kind: string }).kind.startsWith('warn:'),
    ),
  );

  /** Does the form have any blocking errors? */
  protected readonly hasBlockingErrors = computed(() => {
    const count = this.blockingErrors().length;
    if (count > 0) return true;
    // Defensive: if the form is invalid but we couldn't extract error objects, still open the section
    return this.invalid();
  });

  /** Does the form have any root-level errors? */
  protected readonly hasRootErrors = computed(
    () => this.rootErrors().length > 0,
  );

  /** Does the form have any field-level errors? */
  protected readonly hasFieldErrors = computed(
    () => this.fieldErrors().length > 0,
  );

  /** Does the form have any warnings? */
  protected readonly hasWarnings = computed(
    () => this.warningErrors().length > 0,
  );

  /** Total error count (blocking + warnings) */
  protected readonly totalErrorCount = computed(
    () => this.blockingErrors().length + this.warningErrors().length,
  );

  /** Blocking error count */
  protected readonly blockingErrorCount = computed(
    () => this.blockingErrors().length,
  );

  /** Warning count */
  protected readonly warningCount = computed(() => this.warningErrors().length);

  // ============================================================================
  // Error Visibility Strategy Analysis
  // ============================================================================

  /**
   * Determines if errors would be visible based on the current error display strategy.
   * This is for DEBUGGING purposes - shows developers which errors are hidden by the strategy.
   */
  protected readonly errorVisibilityInfo = computed(() => {
    const strategy = this.errorStrategy();
    const submittedStatus = this.submittedStatus();
    const rootState = this.rootState();

    // Check if any fields are touched
    const hasTouchedFields = this.#hasAnyTouchedFields(rootState);

    let visibilityReason = '';
    let errorsVisible = false;

    switch (strategy) {
      case 'immediate':
        errorsVisible = true;
        visibilityReason = 'Errors shown immediately as you type';
        break;

      case 'on-touch':
        errorsVisible = hasTouchedFields || submittedStatus !== 'unsubmitted';
        visibilityReason = hasTouchedFields
          ? 'Errors shown because fields were touched (blurred)'
          : submittedStatus !== 'unsubmitted'
            ? 'Errors shown because form was submitted'
            : '⚠️ Errors hidden until you touch (blur) fields';
        break;

      case 'on-submit':
        errorsVisible = submittedStatus !== 'unsubmitted';
        visibilityReason =
          submittedStatus !== 'unsubmitted'
            ? 'Errors shown because form was submitted'
            : '⚠️ Errors hidden until form submission';
        break;

      case 'manual':
        errorsVisible = false;
        visibilityReason =
          'Manual mode - error visibility controlled programmatically';
        break;
    }

    return {
      strategy,
      errorsVisible,
      visibilityReason,
      hasTouchedFields,
      submittedStatus,
    };
  });

  /**
   * Recursively check if any fields in the form tree have been touched.
   */
  #hasAnyTouchedFields(state: FieldState<unknown>): boolean {
    // Check if this field is touched
    if (
      typeof state.touched === 'function' &&
      (state.touched as () => boolean)()
    ) {
      return true;
    }

    // Recursively check children if this is a FieldTree
    const input = this.formTree();
    if (this.#isFieldTree(input)) {
      const value = state.value();
      return this.#checkTouchedRecursive(
        input as unknown as Record<string, unknown>,
        value,
      );
    }

    return false;
  }

  #checkTouchedRecursive(
    tree: Record<string, unknown>,
    model: unknown,
  ): boolean {
    if (model && typeof model === 'object' && !Array.isArray(model)) {
      for (const key of Object.keys(model as Record<string, unknown>)) {
        const child = (tree as Record<string, unknown>)[key];
        if (typeof child === 'function') {
          const childState = (child as () => FieldState<unknown>)();
          if (
            typeof childState.touched === 'function' &&
            childState.touched()
          ) {
            return true;
          }
          // Recurse deeper
          const nextModel = (model as Record<string, unknown>)[key] as unknown;
          if (
            this.#checkTouchedRecursive(
              child as unknown as Record<string, unknown>,
              nextModel,
            )
          ) {
            return true;
          }
        }
      }
    } else if (Array.isArray(model)) {
      for (let i = 0; i < model.length; i++) {
        const child = (tree as unknown as Record<number, unknown>)[i];
        if (typeof child === 'function') {
          const childState = (child as () => FieldState<unknown>)();
          if (
            typeof childState.touched === 'function' &&
            childState.touched()
          ) {
            return true;
          }
          if (
            this.#checkTouchedRecursive(
              child as unknown as Record<string, unknown>,
              model[i],
            )
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /** Expose Object for template use */
  protected readonly Object = Object;
}
