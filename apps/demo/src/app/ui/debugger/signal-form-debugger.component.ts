import { JsonPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import type { FieldState } from '@angular/forms/signals';
import { NGX_SIGNAL_FORM_CONTEXT } from '@ngx-signal-forms/toolkit/core';

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
 * - Must be used within a form with `[ngxSignalFormProvider]` directive
 * - Form provider automatically supplies submission status
 *
 * @example Basic usage
 * ```html
 * <form [ngxSignalFormProvider]="userForm" (ngSubmit)="handleSubmit()">
 *   <input [control]="userForm.email" />
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
  imports: [JsonPipe],
  templateUrl: './signal-form-debugger.component.html',
  styleUrl: './signal-form-debugger.component.scss',
})
export class SignalFormDebuggerComponent {
  /** Inject form context (provides submittedStatus automatically) */
  readonly #formContext = inject(NGX_SIGNAL_FORM_CONTEXT, { optional: true });

  /** The Signal Form state to display */
  readonly formTree = input.required<FieldState<unknown>>();

  /** Title for the debugger display */
  readonly title = input<string>('Form State & Validation');

  /** Subtitle for context */
  readonly subtitle = input<string>('Live debugging information');

  // ============================================================================
  // Form State Computed Values
  // ============================================================================

  /** Current form model (data values) */
  protected readonly model = computed(() => this.formTree().value());

  /** Is the form valid? */
  protected readonly valid = computed(() => this.formTree().valid());

  /** Is the form invalid? */
  protected readonly invalid = computed(() => this.formTree().invalid());

  /** Is the form dirty? */
  protected readonly dirty = computed(() => this.formTree().dirty());

  /** Is the form pending async validation? */
  protected readonly pending = computed(() => this.formTree().pending());

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
   * Recursively collect field-level errors from nested descendants
   */
  readonly #collectFieldErrors = (
    fieldState: FieldState<unknown>,
  ): unknown[] => {
    const errors: unknown[] = [];

    // Get the field value to check for nested fields
    const value = fieldState.value();

    // If value is an object, recursively collect errors from nested fields
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const key of Object.keys(value)) {
        const nestedField = (fieldState as unknown as Record<string, unknown>)[
          key
        ];
        if (nestedField && typeof nestedField === 'function') {
          const nestedFieldState = nestedField();
          if (
            nestedFieldState &&
            typeof nestedFieldState.errors === 'function'
          ) {
            // Add this field's errors
            errors.push(...nestedFieldState.errors());
            // Recursively collect from deeper nesting
            errors.push(...this.#collectFieldErrors(nestedFieldState));
          }
        }
      }
    }

    // If value is an array, recursively collect errors from array items
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const arrayField = (fieldState as unknown as Record<number, unknown>)[
          i
        ];
        if (arrayField && typeof arrayField === 'function') {
          const arrayFieldState = arrayField();
          if (arrayFieldState && typeof arrayFieldState.errors === 'function') {
            // Add this array item's errors
            errors.push(...arrayFieldState.errors());
            // Recursively collect from deeper nesting
            errors.push(...this.#collectFieldErrors(arrayFieldState));
          }
        }
      }
    }

    return errors;
  };

  /**
   * Root-level errors (cross-field validation)
   * These are errors on the form itself, not on individual fields
   */
  protected readonly rootErrors = computed(() => this.formTree().errors());

  /**
   * Field-level errors (individual field validation)
   * These are errors from nested fields (path validations)
   */
  protected readonly fieldErrors = computed(() =>
    this.#collectFieldErrors(this.formTree()),
  );

  /** All validation errors (root + field) */
  protected readonly allErrors = computed(() => [
    ...this.rootErrors(),
    ...this.fieldErrors(),
  ]);

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
  protected readonly hasBlockingErrors = computed(
    () => this.blockingErrors().length > 0,
  );

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

  /** Expose Object for template use */
  protected readonly Object = Object;
}
