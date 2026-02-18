import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  isDevMode,
} from '@angular/core';
import type { FieldState, FieldTree } from '@angular/forms/signals';
import {
  injectFormContext,
  isBlockingError,
  isWarningError,
  shouldShowErrors,
  type ErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit/core';
import {
  DebuggerBadgeComponent,
  DebuggerBadgeIconDirective,
} from './debugger-badge.component';
import { walkFormTree } from './form-tree-walker';

type DebuggerError = {
  kind: string;
  message?: string;
  visible: boolean;
};

/**
 * Signal Form Debugger Component
 *
 * A development-time debugging panel for Angular Signal Forms that displays
 * comprehensive state and validation information. Fully styled with CSS custom
 * properties (no Tailwind dependencies).
 *
 * **Features**:
 * - Form state badges (Valid, Invalid, Dirty, Pending, Submitted Status)
 * - Live model values with JSON formatting
 * - Validation errors separated into blocking errors and warnings
 * - Collapsible sections for better organization
 * - Dark mode support via `prefers-color-scheme`
 * - Automatic submission status tracking (via form provider)
 *
 * **Usage**:
 * - Can be used with or without `[ngxSignalForm]` directive
 * - For `'on-submit'` strategy, requires form context
 * - For `'on-touch'` (default), works standalone
 *
 * **Theming**:
 * Override CSS custom properties to customize appearance:
 * ```css
 * ngx-signal-form-debugger {
 *   --ngx-debugger-bg: #ffffff;
 *   --ngx-debugger-border-color: #e5e7eb;
 *   --ngx-debugger-text-color: #111827;
 * }
 * ```
 *
 * @example Basic usage
 * ```html
 * <form (submit)="save($event)">
 *   <input [formField]="userForm.email" />
 *   <ngx-signal-form-debugger [formTree]="userForm" />
 * </form>
 * ```
 *
 * @example With form context
 * ```html
 * <form [ngxSignalForm]="userForm" (submit)="save($event)">
 *   <input [formField]="userForm.email" />
 *   <ngx-signal-form-debugger [formTree]="userForm" />
 * </form>
 * ```
 *
 * @example Custom title and strategy
 * ```html
 * <ngx-signal-form-debugger
 *   [formTree]="userForm"
 *   title="Registration Form"
 *   [errorStrategy]="'on-submit'"
 * />
 * ```
 */
@Component({
  selector: 'ngx-signal-form-debugger',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [JsonPipe, DebuggerBadgeComponent, DebuggerBadgeIconDirective],
  templateUrl: './signal-form-debugger.component.html',
  styleUrl: './signal-form-debugger.component.scss',
})
export class SignalFormDebuggerComponent {
  /** Safely read errorSummary() from a state-like object if available */
  #errorSummaryOf(v: unknown, visible: boolean): Array<DebuggerError> {
    const fn = (v as { errorSummary?: () => unknown }).errorSummary;
    if (typeof fn === 'function') {
      const result = fn();
      return Array.isArray(result)
        ? (result as Array<{ kind: string; message?: string }>).map((e) => ({
            ...e,
            visible,
          }))
        : [];
    }
    return [];
  }

  /** Inject form context (provides submittedStatus automatically) */
  readonly #formContext = injectFormContext();

  /**
   * The Signal Form to display.
   * Accepts either the FieldTree function (preferred) or the FieldState root.
   */
  readonly formTree = input.required<
    FieldTree<unknown> | FieldState<unknown>
  >();

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

  #warned = false;

  constructor() {
    effect(() => {
      if (!isDevMode()) return;

      const input = this.formTree();
      if (!input || this.#isFieldTree(input) || this.#warned) return;

      this.#warned = true;
      console.warn(
        '[NgxSignalFormDebugger] Pass the FieldTree function (e.g. form) to formTree. ' +
          'A FieldState (e.g. form()) is supported, but it cannot traverse child fields ' +
          'and may show errors as visible immediately.',
      );
    });
  }

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
        return 'Submitting';
      case 'submitted':
        return 'Submitted';
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
  protected readonly allErrors = computed<DebuggerError[]>(() => {
    const input = this.formTree();
    const strategy = this.errorStrategy();
    const submitted = this.submittedStatus();

    const rootState = this.rootState();
    const rootVisible = shouldShowErrors(rootState, strategy, submitted);

    if (this.#isFieldTree(input)) {
      const state = (input as () => FieldState<unknown>)();
      const value = state.value();
      const collected: DebuggerError[] = [];

      walkFormTree(
        input as unknown as Record<string | number, unknown>,
        value,
        (childField, nextModel) => {
          const childState = (childField as () => FieldState<unknown>)();
          const visible = shouldShowErrors(childState, strategy, submitted);
          const isLeaf = !nextModel || typeof nextModel !== 'object';

          if (!isLeaf) {
            return;
          }

          collected.push(
            ...(
              (childState.errors() ?? []) as Array<{
                kind: string;
                message?: string;
              }>
            ).map((e) => ({ ...e, visible })),
          );
        },
      );
      return collected;
    }

    const summary = this.#errorSummaryOf(rootState, rootVisible);
    return summary.length > 0
      ? summary
      : (
          (rootState.errors?.() ?? []) as Array<{
            kind: string;
            message?: string;
          }>
        ).map((e) => ({ ...e, visible: rootVisible }));
  });

  /** Field-level errors (exclude root-level ones from the summary) */
  protected readonly fieldErrors = computed(() => {
    const root = this.rootErrors();
    const all = this.allErrors();
    return all.filter(
      (e): e is DebuggerError =>
        !root.some(
          (r) =>
            r &&
            (r as { kind: string }).kind === e.kind &&
            (r as { message?: string }).message === e.message,
        ),
    );
  });

  /** Root-level blocking errors */
  protected readonly rootBlockingErrors = computed(() => {
    const rootVisible = shouldShowErrors(
      this.rootState(),
      this.errorStrategy(),
      this.submittedStatus(),
    );
    return this.rootErrors()
      .filter(isBlockingError)
      .map((e) => ({ ...e, visible: rootVisible }));
  });

  /** Root-level warnings */
  protected readonly rootWarningErrors = computed(() => {
    const rootVisible = shouldShowErrors(
      this.rootState(),
      this.errorStrategy(),
      this.submittedStatus(),
    );
    return this.rootErrors()
      .filter(isWarningError)
      .map((e) => ({ ...e, visible: rootVisible }));
  });

  /** Field-level blocking errors */
  protected readonly fieldBlockingErrors = computed(() =>
    this.fieldErrors().filter(isBlockingError),
  );

  /** Field-level warnings */
  protected readonly fieldWarningErrors = computed(() =>
    this.fieldErrors().filter(isWarningError),
  );

  /** All blocking errors (root + field) */
  protected readonly blockingErrors = computed(() =>
    this.allErrors().filter(isBlockingError),
  );

  /** All warning errors (root + field) */
  protected readonly warningErrors = computed(() =>
    this.allErrors().filter(isWarningError),
  );

  /** Visible blocking error count */
  protected readonly visibleBlockingCount = computed(
    () => this.blockingErrors().filter((error) => error.visible).length,
  );

  /** Total blocking error count */
  protected readonly totalBlockingCount = computed(
    () => this.blockingErrors().length,
  );

  /** Visible warning count */
  protected readonly visibleWarningCount = computed(
    () => this.warningErrors().filter((error) => error.visible).length,
  );

  /** Total warning count */
  protected readonly totalWarningCount = computed(
    () => this.warningErrors().length,
  );

  /** Does the form have any blocking errors? */
  protected readonly hasBlockingErrors = computed(() => {
    const count = this.blockingErrors().length;
    if (count > 0) return true;
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
            : 'Errors hidden until you touch (blur) fields';
        break;

      case 'on-submit':
        errorsVisible = submittedStatus !== 'unsubmitted';
        visibilityReason =
          submittedStatus !== 'unsubmitted'
            ? 'Errors shown because form was submitted'
            : 'Errors hidden until form submission';
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

  /** Show a success badge when the form is valid after any touch interaction. */
  protected readonly showValidAfterTouch = computed(() => {
    return (
      this.errorVisibilityInfo().hasTouchedFields &&
      this.valid() &&
      !this.pending()
    );
  });

  /**
   * Recursively check if any fields in the form tree have been touched.
   */
  #hasAnyTouchedFields(state: FieldState<unknown>): boolean {
    if (
      typeof state.touched === 'function' &&
      (state.touched as () => boolean)()
    ) {
      return true;
    }

    const input = this.formTree();
    if (this.#isFieldTree(input)) {
      const value = state.value();
      let touched = false;

      walkFormTree(
        input as unknown as Record<string | number, unknown>,
        value,
        (childField) => {
          if (touched) {
            return;
          }

          const childState = (childField as () => FieldState<unknown>)();
          if (
            typeof childState.touched === 'function' &&
            childState.touched()
          ) {
            touched = true;
          }
        },
      );

      return touched;
    }

    return false;
  }
  /** Expose Object for template use */
  protected readonly Object = Object;
}
