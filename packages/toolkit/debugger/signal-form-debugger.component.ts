import { JsonPipe, NgTemplateOutlet } from '@angular/common';
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
  resolveStrategyFromContext,
  shouldShowErrors,
  type ErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
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

type TreeSnapshot = {
  /** Leaf-level errors collected while walking the tree, tagged with per-field visibility. */
  readonly fieldErrors: readonly DebuggerError[];
  /** `true` if any descendant field has been touched. */
  readonly anyTouched: boolean;
};

const EMPTY_SNAPSHOT: TreeSnapshot = { fieldErrors: [], anyTouched: false };

/**
 * Tag a validation error payload with a `visible` flag without mutating the
 * original. Centralises the object-spread pattern so the debugger's several
 * error pipelines can enrich errors via `.map(withVisibility(flag))` instead
 * of inlining `({ ...e, visible })` at every call site.
 */
const withVisibility =
  (visible: boolean) =>
  (error: { kind: string; message?: string }): DebuggerError => ({
    ...error,
    visible,
  });

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
 * - Dark mode support via class-based theme context (`.dark`)
 * - Automatic submission status tracking (via form provider)
 *
 * **Usage**:
 * - Can be used with or without the `ngxSignalForm` directive
 * - When `ngxSignalForm` is present, `errorStrategy` and `submittedStatus`
 *   are read from the form context automatically
 *
 * **Theming**:
 * Override CSS custom properties to customize appearance. Styling hooks use
 * the shorter `--ngx-debugger-*` prefix (the selector prefix
 * `ngx-signal-form-debugger-*` is reserved for element/directive names):
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
 * @example With form context (recommended)
 * ```html
 * <form [formRoot]="userForm" ngxSignalForm errorStrategy="on-submit"
 *       (submit)="save($event)">
 *   <input [formField]="userForm.email" />
 *   <!-- debugger inherits errorStrategy from the form directive -->
 *   <ngx-signal-form-debugger [formTree]="userForm" />
 * </form>
 * ```
 *
 * @example Custom title / explicit strategy override
 * ```html
 * <ngx-signal-form-debugger
 *   [formTree]="userForm"
 *   title="Registration Form"
 *   errorStrategy="on-submit"
 * />
 * ```
 */
@Component({
  selector: 'ngx-signal-form-debugger',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    JsonPipe,
    NgTemplateOutlet,
    DebuggerBadgeComponent,
    DebuggerBadgeIconDirective,
  ],
  templateUrl: './signal-form-debugger.component.html',
  styleUrl: './signal-form-debugger.component.scss',
})
export class SignalFormDebuggerComponent {
  // ============================================================================
  // Inputs
  // ============================================================================

  /**
   * The Signal Form to display. Pass the `FieldTree` function (preferred) to
   * enable per-descendant traversal. A `FieldState` is also accepted but the
   * debugger cannot walk children and will emit a dev-mode warning.
   */
  readonly formTree = input.required<
    FieldTree<unknown> | FieldState<unknown>
  >();

  /**
   * Optional error-display-strategy override. When omitted, the debugger
   * inherits the strategy from the surrounding `ngxSignalForm` context (or
   * falls back to `'on-touch'` when no context is available).
   */
  readonly errorStrategy = input<ErrorDisplayStrategy | undefined>(undefined);

  /** Title shown in the debugger header. */
  readonly title = input('Form State & Validation');

  /** Subtitle shown below the header title. */
  readonly subtitle = input('Live debugging information');

  // ============================================================================
  // Form context (DI)
  // ============================================================================

  readonly #formContext = injectFormContext();

  // ============================================================================
  // Resolved configuration
  // ============================================================================

  /**
   * The effective strategy after merging the `errorStrategy` input with any
   * ambient `ngxSignalForm` context. This matches the resolution rules used
   * by the rest of the toolkit (error component, error summary, headless
   * directives) so the debugger reflects what consumers will actually see.
   */
  protected readonly resolvedStrategy = computed(() =>
    resolveStrategyFromContext(this.errorStrategy(), this.#formContext),
  );

  /** Submission status from the ambient form context (or `'unsubmitted'`). */
  protected readonly submittedStatus = computed(
    () => this.#formContext?.submittedStatus() ?? 'unsubmitted',
  );

  /** Human-readable label for the current submitted status. */
  protected readonly submittedStatusDisplay = computed(() => {
    const status = this.submittedStatus();
    switch (status) {
      case 'submitting':
        return 'Submitting';
      case 'submitted':
        return 'Submitted';
      case 'unsubmitted':
        return 'Idle';
      default:
        status satisfies never;
        return 'Idle';
    }
  });

  // ============================================================================
  // Normalized root state
  // ============================================================================

  /** Normalize to root `FieldState` regardless of input shape. */
  protected readonly rootState = computed<FieldState<unknown>>(() => {
    const v = this.formTree() as unknown;
    if (this.#isFieldTree(v)) {
      return (v as () => FieldState<unknown>)();
    }
    return v as FieldState<unknown>;
  });

  /** Root-level visibility — factored out so every root-error pipeline reuses it. */
  protected readonly rootVisible = computed(() => {
    const s = this.rootState();
    return shouldShowErrors(
      s.invalid(),
      s.touched(),
      this.resolvedStrategy(),
      this.submittedStatus(),
    );
  });

  // ============================================================================
  // Form State shortcuts
  // ============================================================================

  protected readonly model = computed(() => this.rootState().value());
  protected readonly valid = computed(() => this.rootState().valid());
  protected readonly invalid = computed(() => this.rootState().invalid());
  protected readonly dirty = computed(() => this.rootState().dirty());
  protected readonly pending = computed(() => this.rootState().pending());

  // ============================================================================
  // Tree snapshot — single walk per change, reused by every consumer
  // ============================================================================

  /**
   * Walk the form tree at most once per signal-change and collect both the
   * leaf-level errors (with visibility) and a `anyTouched` flag. Feeding
   * `allErrors` and `#hasAnyTouchedFields` from the same pass avoids the
   * double traversal the old implementation performed.
   */
  readonly #treeSnapshot = computed<TreeSnapshot>(() => {
    const tree = this.formTree();
    if (!this.#isFieldTree(tree)) {
      return EMPTY_SNAPSHOT;
    }

    const strategy = this.resolvedStrategy();
    const submitted = this.submittedStatus();
    const rootState = (tree as () => FieldState<unknown>)();
    const value = rootState.value();
    const fieldErrors: DebuggerError[] = [];
    let anyTouched = rootState.touched();

    walkFormTree(
      tree as unknown as Record<string | number, unknown>,
      value,
      (childField, nextModel) => {
        const childState = (childField as () => FieldState<unknown>)();
        if (childState.touched()) anyTouched = true;

        // Only collect leaf errors — interior-node errors surface via their
        // descendants during traversal.
        const isLeaf = !nextModel || typeof nextModel !== 'object';
        if (!isLeaf) return;

        const visible = shouldShowErrors(
          childState.invalid(),
          childState.touched(),
          strategy,
          submitted,
        );
        fieldErrors.push(
          ...(
            (childState.errors() ?? []) as Array<{
              kind: string;
              message?: string;
            }>
          ).map(withVisibility(visible)),
        );
      },
    );
    return { fieldErrors, anyTouched };
  });

  // ============================================================================
  // Errors
  // ============================================================================

  /** Root-level errors (cross-field validation, errors on the form itself). */
  protected readonly rootErrors = computed(() => this.rootState().errors());

  /**
   * All errors including descendants.
   * - `FieldTree`: collected from the single `#treeSnapshot` walk.
   * - `FieldState`: falls back to `errorSummary()` on the root state, which
   *   is less accurate (it cannot reflect per-field visibility).
   */
  protected readonly allErrors = computed<DebuggerError[]>(() => {
    const tree = this.formTree();
    if (this.#isFieldTree(tree)) {
      return this.#treeSnapshot().fieldErrors.slice();
    }

    const rootState = this.rootState();
    const visible = this.rootVisible();
    const summary = this.#errorSummaryOf(rootState, visible);
    return summary.length > 0
      ? summary
      : (rootState.errors() as Array<{ kind: string; message?: string }>).map(
          withVisibility(visible),
        );
  });

  /** Field-level errors (exclude root-level ones from the summary). */
  protected readonly fieldErrors = computed(() => {
    const root = this.rootErrors();
    return this.allErrors().filter(
      (e) =>
        !root.some(
          (r) =>
            (r as { kind: string }).kind === e.kind &&
            (r as { message?: string }).message === e.message,
        ),
    );
  });

  protected readonly rootBlockingErrors = computed(() => {
    const visible = this.rootVisible();
    return this.rootErrors()
      .filter((e) => isBlockingError(e))
      .map(withVisibility(visible));
  });

  protected readonly rootWarningErrors = computed(() => {
    const visible = this.rootVisible();
    return this.rootErrors()
      .filter((e) => isWarningError(e))
      .map(withVisibility(visible));
  });

  protected readonly fieldBlockingErrors = computed(() =>
    this.fieldErrors().filter((e) => isBlockingError(e)),
  );

  protected readonly fieldWarningErrors = computed(() =>
    this.fieldErrors().filter((e) => isWarningError(e)),
  );

  protected readonly blockingErrors = computed(() =>
    this.allErrors().filter((e) => isBlockingError(e)),
  );

  protected readonly warningErrors = computed(() =>
    this.allErrors().filter((e) => isWarningError(e)),
  );

  protected readonly visibleBlockingCount = computed(
    () => this.blockingErrors().filter((e) => e.visible).length,
  );

  protected readonly totalBlockingCount = computed(
    () => this.blockingErrors().length,
  );

  protected readonly visibleWarningCount = computed(
    () => this.warningErrors().filter((e) => e.visible).length,
  );

  protected readonly totalWarningCount = computed(
    () => this.warningErrors().length,
  );

  protected readonly hasBlockingErrors = computed(
    () => this.blockingErrors().length > 0 || this.invalid(),
  );

  protected readonly hasWarnings = computed(
    () => this.warningErrors().length > 0,
  );

  // ============================================================================
  // Error visibility strategy analysis
  // ============================================================================

  /**
   * Explains whether errors would be visible under the current strategy.
   * Drives the "Error Display Strategy" banner in the template.
   */
  protected readonly errorVisibilityInfo = computed(() => {
    const strategy = this.resolvedStrategy();
    const submittedStatus = this.submittedStatus();
    const hasTouchedFields = this.#hasAnyTouchedFields();

    let errorsVisible = false;
    let visibilityReason = '';

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
      default:
        strategy satisfies never;
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

  /** Success badge when the form is valid after any touch interaction. */
  protected readonly showValidAfterTouch = computed(
    () =>
      this.errorVisibilityInfo().hasTouchedFields &&
      this.valid() &&
      !this.pending(),
  );

  // ============================================================================
  // Dev-mode diagnostics
  // ============================================================================

  #warned = false;

  // Named Angular effect field is intentionally unread — Angular owns the
  // lifecycle. Keeping the name documents the side-effect.
  // oxlint-disable-next-line no-unused-private-class-members -- EffectRef retained as a named field to document the side effect.
  readonly #fieldTreeWarningEffect = effect(() => {
    if (!isDevMode()) return;

    const value = this.formTree();
    if (!value || this.#isFieldTree(value) || this.#warned) return;

    this.#warned = true;
    console.warn(
      '[NgxSignalFormDebugger] Pass the FieldTree function (e.g. form) to formTree. ' +
        'A FieldState (e.g. form()) is supported, but it cannot traverse child fields ' +
        'and may show errors as visible immediately.',
    );
  });

  // ============================================================================
  // Private helpers
  // ============================================================================

  /** Type guard: `FieldTree` is both callable and indexable. */
  readonly #isFieldTree = (
    v: unknown,
  ): v is { (): FieldState<unknown> } & Record<string, unknown> =>
    typeof v === 'function';

  /**
   * Any field in the tree touched? Pulls from the shared snapshot so the
   * visibility pipeline doesn't re-walk the tree for this flag.
   */
  #hasAnyTouchedFields(): boolean {
    return this.#treeSnapshot().anyTouched;
  }

  /** Safely read `errorSummary()` from a state-like object if available. */
  #errorSummaryOf(v: unknown, visible: boolean): Array<DebuggerError> {
    const fn = (v as { errorSummary?: () => unknown }).errorSummary;
    if (typeof fn !== 'function') return [];
    const result = fn();
    return Array.isArray(result)
      ? (result as Array<{ kind: string; message?: string }>).map(
          withVisibility(visible),
        )
      : [];
  }
}
