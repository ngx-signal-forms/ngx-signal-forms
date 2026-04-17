import { JsonPipe, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  isDevMode,
} from '@angular/core';
import type {
  FieldState,
  FieldTree,
  ValidationError,
} from '@angular/forms/signals';
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
import { isFieldStateLike, walkFormTree } from './form-tree-walker';

/**
 * Debugger-local extension of Angular's `ValidationError`. Adds two fields
 * the template needs: a per-field visibility flag (driven by the active
 * error-display strategy) and a joined dotted path (e.g. `users.0.name`)
 * for stable `@for` track keys.
 */
type DebuggerError = ValidationError & {
  visible: boolean;
  path: string;
};

type TreeSnapshot = {
  /** Errors collected at every node, tagged with visibility and path. */
  readonly fieldErrors: readonly DebuggerError[];
  /** `true` if any descendant field has been touched. */
  readonly anyTouched: boolean;
};

const EMPTY_SNAPSHOT: TreeSnapshot = { fieldErrors: [], anyTouched: false };

/**
 * Track function for `@for` error lists. Returns a stable composite key of
 * `path|kind|message` — resilient to array reorders (unlike `$index`) and
 * duplicate error kinds on the same field.
 */
export function trackDebuggerError(
  _index: number,
  error: DebuggerError,
): string {
  return `${error.path}|${error.kind}|${error.message ?? ''}`;
}

/**
 * Tag a validation error payload with `visible` and `path` without mutating
 * the original. Centralises the object-spread pattern so the debugger's
 * several error pipelines can enrich errors via `.map(withDebuggerMeta(...))`
 * instead of inlining the spread at every call site.
 */
const withDebuggerMeta =
  (visible: boolean, path: string) =>
  (error: ValidationError): DebuggerError => ({
    ...error,
    visible,
    path,
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
 * **Production tree-shaking**:
 * The component self-guards rendering with `isDevMode()`, so production
 * builds see an empty template. For true *bundle* tree-shaking (skipping
 * the ~13 KB JS + ~15 KB SCSS entirely), consumers should still wrap the
 * element with `@if (isDevMode())`. Expose the `isDevMode` function on the
 * hosting component so the template can invoke it:
 *
 * ```typescript
 * import { Component, isDevMode } from '@angular/core';
 *
 * @Component({ ... })
 * export class MyFormComponent {
 *   protected readonly isDevMode = isDevMode;
 * }
 * ```
 *
 * ```html
 * @if (isDevMode()) {
 *   <ngx-signal-form-debugger [formTree]="userForm" />
 * }
 * ```
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
  // Render gate (production opt-out)
  // ============================================================================

  /**
   * `true` in dev mode, `false` in prod. The template wraps every
   * render branch in `@if (renderEnabled && inputUsable())`, so a
   * production-built consumer that forgets the outer `@if (isDevMode())`
   * still pays zero DOM cost. (Bundle cost still needs the outer guard —
   * see the JSDoc on the class.)
   */
  protected readonly renderEnabled = isDevMode();

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

  /** `true` when `formTree()` is usable (callable + state-shaped). */
  protected readonly inputUsable = computed(() =>
    this.#isFieldTree(this.formTree() as unknown),
  );

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
   * Walk the form tree at most once per signal-change and collect errors from
   * every node (root included) plus an `anyTouched` flag. Errors are tagged
   * with the joined path so duplicates (root + bubbled) can be deduped by
   * `path|kind|message`, and so the template can use stable `@for` track
   * keys. Feeding `allErrors` and `#hasAnyTouchedFields` from the same pass
   * avoids the double traversal the old implementation performed.
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
    const seen = new Set<string>();
    let anyTouched = rootState.touched();

    const collect = (
      fieldState: FieldState<unknown>,
      path: string,
      touched: boolean,
    ): void => {
      if (touched) anyTouched = true;
      const visible = shouldShowErrors(
        fieldState.invalid(),
        touched,
        strategy,
        submitted,
      );
      const errors = fieldState.errors() ?? [];
      for (const error of errors) {
        const key = `${path}|${error.kind}|${error.message ?? ''}`;
        if (seen.has(key)) continue;
        seen.add(key);
        fieldErrors.push(withDebuggerMeta(visible, path)(error));
      }
    };

    walkFormTree(
      tree as unknown as Record<string | number, unknown>,
      value,
      (childField, _nextModel, path) => {
        const childState = (childField as () => FieldState<unknown>)();
        // `walkFormTree` fires for the root too (path === ''), so reuse the
        // same collector and skip re-touching logic — `touched` is already
        // read from the per-node state.
        collect(childState, path, childState.touched());
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
   * Root-error "identity" keys (`path|kind|message`, with `path === ''`
   * for root entries) used to filter out root entries from `fieldErrors`
   * in O(N) rather than O(N·M). Format mirrors the key `#treeSnapshot`
   * uses so a descendant that happens to share kind/message with a root
   * entry is not incorrectly filtered out.
   */
  readonly #rootErrorKeys = computed(() => {
    const set = new Set<string>();
    for (const error of this.rootErrors()) {
      set.add(`|${error.kind}|${error.message ?? ''}`);
    }
    return set;
  });

  /**
   * All errors including descendants.
   * - `FieldTree`: collected from the single `#treeSnapshot` walk.
   * - `FieldState`: falls back to the root state's `errors()` (traversal
   *   is not possible without the callable tree).
   */
  protected readonly allErrors = computed<readonly DebuggerError[]>(() => {
    const tree = this.formTree();
    if (this.#isFieldTree(tree)) {
      return this.#treeSnapshot().fieldErrors;
    }

    const rootState = this.rootState();
    const visible = this.rootVisible();
    return rootState.errors().map(withDebuggerMeta(visible, ''));
  });

  /** Field-level errors (exclude root-level ones from the summary). */
  protected readonly fieldErrors = computed(() => {
    const rootKeys = this.#rootErrorKeys();
    return this.allErrors().filter(
      (e) => !rootKeys.has(`${e.path}|${e.kind}|${e.message ?? ''}`),
    );
  });

  protected readonly rootBlockingErrors = computed(() => {
    const visible = this.rootVisible();
    return this.rootErrors()
      .filter((e) => isBlockingError(e))
      .map(withDebuggerMeta(visible, ''));
  });

  protected readonly rootWarningErrors = computed(() => {
    const visible = this.rootVisible();
    return this.rootErrors()
      .filter((e) => isWarningError(e))
      .map(withDebuggerMeta(visible, ''));
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

  /** Exposed for template `@for` track bindings. */
  protected readonly trackError = trackDebuggerError;

  // ============================================================================
  // Dev-mode diagnostics
  // ============================================================================

  /**
   * Tracks which concrete `formTree` references have already triggered the
   * "pass the FieldTree function" warning. Using a `WeakSet` keyed by the
   * input identity means we re-warn after a true input swap but don't spam
   * the console when signals only change internal state.
   */
  readonly #warnedTrees = new WeakSet();

  // Named Angular effect field is intentionally unread — Angular owns the
  // lifecycle. Keeping the name documents the side-effect. The `effect()`
  // registration is skipped in production: the dev-only warning never needs
  // to run there, so there is no reason to schedule an effect or retain its
  // closure in prod bundles.
  // oxlint-disable-next-line no-unused-private-class-members -- EffectRef retained as a named field to document the side effect.
  readonly #fieldTreeWarningEffect = isDevMode()
    ? effect(() => {
        const value = this.formTree() as unknown;
        if (!value || typeof value !== 'object' || this.#isFieldTree(value)) {
          return;
        }
        if (this.#warnedTrees.has(value)) return;

        this.#warnedTrees.add(value);
        console.warn(
          '[NgxSignalFormDebugger] Pass the FieldTree function (e.g. form) to formTree. ' +
            'A FieldState (e.g. form()) is supported, but it cannot traverse child fields ' +
            'and may show errors as visible immediately.',
        );
      })
    : undefined;

  // ============================================================================
  // Private helpers
  // ============================================================================

  /**
   * Type guard: a `FieldTree` is callable AND calling it yields a
   * `FieldState`-shaped object. The stricter check (compared to a bare
   * `typeof v === 'function'`) prevents the walker from following arbitrary
   * functions pushed into `formTree` in misuse cases.
   */
  readonly #isFieldTree = (
    v: unknown,
  ): v is { (): FieldState<unknown> } & Record<string, unknown> =>
    isFieldStateLike(v);

  /**
   * Any field in the tree touched? Pulls from the shared snapshot so the
   * visibility pipeline doesn't re-walk the tree for this flag.
   */
  #hasAnyTouchedFields(): boolean {
    return this.#treeSnapshot().anyTouched;
  }
}
