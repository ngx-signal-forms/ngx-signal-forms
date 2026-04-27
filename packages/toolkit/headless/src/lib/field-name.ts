import {
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  isDevMode,
  type Signal,
} from '@angular/core';
import {
  createFieldMessageIdSignals,
  resolveFieldName,
  resolveFieldNameFromCandidates,
} from '@ngx-signal-forms/toolkit/core';

/**
 * Field name state signals exposed by the headless directive.
 */
export interface FieldNameStateSignals {
  /** Resolved field name from input or override; `null` when no name is resolvable. */
  readonly resolvedFieldName: Signal<string | null>;
  /** Generated error region ID; `null` when no field name is resolvable. */
  readonly errorId: Signal<string | null>;
  /** Generated warning region ID; `null` when no field name is resolvable. */
  readonly warningId: Signal<string | null>;
}

/**
 * Headless field name directive for label and ID resolution.
 *
 * Provides signals for resolving field names and generating accessible
 * IDs for error/warning description regions.
 *
 * ## Required input
 *
 * One of the following must be provided; otherwise `resolvedFieldName()`,
 * `errorId()`, and `warningId()` return `null` and the directive logs a
 * dev-mode `console.error` explaining the misconfiguration:
 *
 * - A non-empty `fieldName` input, or
 * - A non-empty `id` attribute on the host element.
 *
 * Downstream ARIA wiring is expected to handle `null` by skipping the
 * `aria-describedby` reference rather than producing unstable IDs like
 * `"-error"`.
 *
 * ## Features
 *
 * - **Name Resolution**: Resolves name from input or host element `id`
 * - **ID Generation**: Creates unique error/warning region IDs
 * - **ARIA Integration**: IDs suitable for `aria-describedby` usage
 *
 * ## Usage
 *
 * ```html
 * <div ngxHeadlessFieldName #fieldName="fieldName" fieldName="email">
 *   <label [for]="fieldName.resolvedFieldName()">Email</label>
 *   <input
 *     [id]="fieldName.resolvedFieldName()"
 *     [formField]="form.email"
 *     [attr.aria-describedby]="fieldName.errorId()"
 *   />
 *   <div [id]="fieldName.errorId()" role="alert">
 *     <!-- Error messages -->
 *   </div>
 * </div>
 * ```
 *
 * @example Override field name with signal
 * ```html
 * <div
 *   ngxHeadlessFieldName
 *   #fieldName="fieldName"
 *   [fieldName]="dynamicFieldName"
 * >
 *   <!-- Uses dynamic field name from signal or value -->
 * </div>
 * ```
 *
 * @example Auto-resolve from host element id
 * ```html
 * <div ngxHeadlessFieldName #fieldName="fieldName" id="email">
 *   <label [for]="fieldName.resolvedFieldName()">Email</label>
 * </div>
 * ```
 */
@Directive({
  selector: '[ngxHeadlessFieldName]',
  exportAs: 'fieldName',
})
export class NgxHeadlessFieldName implements FieldNameStateSignals {
  readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  #warnedMissingName = false;

  /**
   * The field name to use for ID generation.
   * If not provided, uses the host element `id`.
   */
  readonly fieldName = input<string | undefined>();

  /**
   * Resolved field name.
   *
   * Returns `null` when neither a non-empty `fieldName` input nor a
   * non-empty host `id` is available. A `console.error` is emitted in
   * dev mode (once) to flag the misconfiguration — consumers should
   * gate ARIA wiring on a non-null value rather than producing unstable
   * IDs like `"-error"`.
   */
  readonly resolvedFieldName = computed<string | null>(() => {
    const resolvedFieldName = resolveFieldNameFromCandidates(
      this.fieldName(),
      resolveFieldName(this.#elementRef.nativeElement),
    );
    if (resolvedFieldName !== null) {
      return resolvedFieldName;
    }

    if (isDevMode() && !this.#warnedMissingName) {
      this.#warnedMissingName = true;
      console.error(
        '[ngx-signal-forms] ngxHeadlessFieldName requires either a non-empty `fieldName` input or a host element `id`. ARIA wiring will be skipped.',
      );
    }

    return null;
  });

  readonly #fieldMessageIds = createFieldMessageIdSignals(
    this.resolvedFieldName,
  );

  /**
   * Generated error region ID, or `null` when no field name is resolvable.
   */
  readonly errorId = this.#fieldMessageIds.errorId;

  /**
   * Generated warning region ID, or `null` when no field name is resolvable.
   */
  readonly warningId = this.#fieldMessageIds.warningId;
}
