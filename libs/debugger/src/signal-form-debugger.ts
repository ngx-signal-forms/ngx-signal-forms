import { JsonPipe, NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  effect,
  input,
  isDevMode,
  untracked,
} from '@angular/core';
import type {
  FieldState,
  FieldTree,
  ValidationError,
} from '@angular/forms/signals';
import {
  getBlockingErrors,
  injectFormContext,
  isBlockingError,
  isWarningError,
  resolveStrategyFromContext,
  shouldShowErrors,
  type ErrorDisplayStrategy,
} from '@ngx-signal-forms/toolkit';
import {
  isFieldTree,
  walkFieldTreeEntries,
} from '@ngx-signal-forms/toolkit/core';
import {
  NgxSignalFormDebuggerBadge,
  NgxSignalFormDebuggerBadgeIcon,
} from './debugger-badge';

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
 * Every method the component unconditionally calls on `rootState()` (see
 * `model`/`valid`/`invalid`/`dirty`/`pending`/`rootErrors` below, plus
 * `rootVisible`'s use of `touched()` and `hasBlockingErrors`'s use of
 * `errorSummary()`) must be present, not just a subset. A stub that
 * satisfies a partial guard passes the usability check, then throws a
 * TypeError the first time change detection reaches the missing method.
 * Shared by both input shapes: `isFieldStateLike` applies it to a direct
 * `FieldState` input; `isUsableFieldTree` applies it to the state resolved
 * from a `FieldTree` input (the toolkit's `isFieldTree` only asserts the
 * narrower value/touched/errors/errorSummary/submitting/markAsTouched
 * surface).
 */
function hasFieldStateMethods(value: unknown): boolean {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const state = value as Record<string, unknown>;
  return (
    typeof state['value'] === 'function' &&
    typeof state['touched'] === 'function' &&
    typeof state['invalid'] === 'function' &&
    typeof state['valid'] === 'function' &&
    typeof state['dirty'] === 'function' &&
    typeof state['pending'] === 'function' &&
    typeof state['errors'] === 'function' &&
    typeof state['errorSummary'] === 'function'
  );
}

function isFieldStateLike(value: unknown): value is FieldState<unknown> {
  if (!hasFieldStateMethods(value)) {
    return false;
  }

  const fieldTree = (value as Record<string, unknown>)['fieldTree'];
  if (typeof fieldTree !== 'function') {
    return false;
  }

  try {
    return untracked(() => fieldTree()) === value;
  } catch {
    return false;
  }
}

/**
 * `isFieldTree` plus the debugger's own root-state method requirements.
 * The toolkit contract intentionally stays minimal (it serves traversal and
 * submission helpers); the debugger additionally calls `valid`/`invalid`/
 * `dirty`/`pending` on the resolved root state, so a partially-stubbed
 * `FieldTree` must be rejected here — gracefully, like any other malformed
 * input — instead of throwing mid change-detection.
 */
function isUsableFieldTree(value: unknown): value is FieldTree<unknown> {
  if (!isFieldTree(value)) {
    return false;
  }

  try {
    return hasFieldStateMethods(untracked(() => (value as () => unknown)()));
  } catch {
    return false;
  }
}

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
 * **Production use**:
 * The debugger is rendered whenever the form tree is usable, which keeps the
 * deployed demo aligned with local development. If your own app needs to
 * hide the panel in production, wrap the element in an explicit
 * `@if (isDevMode())` guard in the hosting template.
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

  imports: [
    JsonPipe,
    NgTemplateOutlet,
    NgxSignalFormDebuggerBadge,
    NgxSignalFormDebuggerBadgeIcon,
  ],
  templateUrl: './signal-form-debugger.html',
  styleUrl: './signal-form-debugger.css',
})
export class NgxSignalFormDebugger {
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

  #warnedUnknownStatus = false;

  /**
   * Human-readable label for the current submitted status.
   *
   * If a future `SubmittedStatus` value lands without a matching branch here,
   * the debugger surfaces an explicit `Unknown (raw)` label instead of
   * misreporting `Idle`. The whole point of the debugger is to surface
   * state — silently mapping an unknown status to a familiar one defeats
   * the tool. The one-time dev-mode warning for this case is raised by
   * `#submittedStatusWarningEffect` below, not here — `computed()` callbacks
   * must stay pure; Angular may re-evaluate them speculatively, which would
   * double-log (or worse, race) a `console.warn` side effect.
   */
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
        return `Unknown (${status as string})`;
    }
  });

  // ============================================================================
  // Normalized root state
  // ============================================================================

  /** `true` when `formTree()` is either a usable `FieldTree` or `FieldState`. */
  protected readonly inputUsable = computed(
    () =>
      isFieldStateLike(this.formTree() as unknown) ||
      isUsableFieldTree(this.formTree() as unknown),
  );

  /** Normalize to root `FieldState` regardless of input shape. */
  protected readonly rootState = computed<FieldState<unknown>>(() => {
    const v = this.formTree() as unknown;
    if (isUsableFieldTree(v)) {
      return (v as () => FieldState<unknown>)();
    }

    if (isFieldStateLike(v)) {
      return v;
    }

    throw new Error(
      '[NgxSignalFormDebugger] formTree must be a FieldTree or FieldState.',
    );
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

  /**
   * `true` when the tree has no blocking (non-`warn:`) errors anywhere.
   * Deliberately NOT `rootState().valid()` — Angular's native `valid()`/
   * `invalid()` signals flip to invalid for ANY error, including warn-only
   * ones, which would report a form whose only errors are `warn:*` as
   * "Invalid" throughout the panel. Mirrors `canSubmitWithWarnings()`'s use
   * of `getBlockingErrors(errorSummary())` (see `hasBlockingErrors`) so the
   * debugger agrees with what `submitWithWarnings()` actually gates on.
   */
  protected readonly valid = computed(() => !this.hasBlockingErrors());

  /** Inverse of {@link valid}. */
  protected readonly invalid = computed(() => this.hasBlockingErrors());

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
    if (!isFieldTree(tree)) {
      return EMPTY_SNAPSHOT;
    }

    const strategy = this.resolvedStrategy();
    const submitted = this.submittedStatus();
    const rootState = (tree as () => FieldState<unknown>)();
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

    for (const entry of walkFieldTreeEntries(tree)) {
      collect(entry.state, entry.path, entry.state.touched());
    }
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
    if (isFieldTree(tree)) {
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

  /**
   * `true` when blocking errors exist ANYWHERE in the tree. Reads
   * `errorSummary()` (root's own errors plus aggregated descendant errors)
   * rather than the walk-based `blockingErrors()`: the walk is only possible
   * for `FieldTree` inputs, and the `FieldState` fallback reads `errors()`,
   * which in Signal Forms is the field's OWN errors only — a `FieldState`
   * input (e.g. `form()`) whose only blocking errors sit on child fields
   * would misreport as Valid. `errorSummary()` aggregates descendants for
   * both input shapes and is exactly what `canSubmitWithWarnings()` gates on.
   */
  protected readonly hasBlockingErrors = computed(
    () => getBlockingErrors(this.rootState().errorSummary()).length > 0,
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
          : submittedStatus === 'unsubmitted'
            ? 'Errors hidden until you touch (blur) fields'
            : 'Errors shown because form was submitted';
        break;
      case 'on-submit':
        errorsVisible = submittedStatus !== 'unsubmitted';
        visibilityReason =
          submittedStatus === 'unsubmitted'
            ? 'Errors hidden until form submission'
            : 'Errors shown because form was submitted';
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

  // Dev-mode warning for an unrecognized `SubmittedStatus` value (see
  // `submittedStatusDisplay` above). Lives in an `effect()` rather than the
  // `computed()` because computeds must stay pure — Angular may re-run them
  // speculatively/more than once per change, which would double-log a
  // `console.warn` side effect. Skipped in production for the same reason
  // as `#fieldTreeWarningEffect`.
  // oxlint-disable-next-line no-unused-private-class-members -- EffectRef retained as a named field to document the side effect.
  readonly #submittedStatusWarningEffect = isDevMode()
    ? effect(() => {
        const status = this.submittedStatus();
        if (
          status === 'submitting' ||
          status === 'submitted' ||
          status === 'unsubmitted' ||
          this.#warnedUnknownStatus
        ) {
          return;
        }

        this.#warnedUnknownStatus = true;
        // oxlint-disable-next-line no-console -- dev-mode misconfiguration signal
        console.warn(
          `[ngx-signal-forms] NgxSignalFormDebugger: unknown SubmittedStatus "${status as string}". ` +
            'Update the debugger label switch to cover this value.',
        );
      })
    : undefined;

  // Named Angular effect field is intentionally unread — Angular owns the
  // lifecycle. Keeping the name documents the side-effect. The `effect()`
  // registration is skipped in production: the dev-only warning never needs
  // to run there, so there is no reason to schedule an effect or retain its
  // closure in prod bundles.
  // oxlint-disable-next-line no-unused-private-class-members -- EffectRef retained as a named field to document the side effect.
  readonly #fieldTreeWarningEffect = isDevMode()
    ? effect(() => {
        const value = this.formTree() as unknown;
        if (!value || typeof value !== 'object' || isFieldTree(value)) {
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
   * Any field in the tree touched? Pulls from the shared snapshot so the
   * visibility pipeline doesn't re-walk the tree for this flag.
   */
  #hasAnyTouchedFields(): boolean {
    return this.#treeSnapshot().anyTouched;
  }
}
