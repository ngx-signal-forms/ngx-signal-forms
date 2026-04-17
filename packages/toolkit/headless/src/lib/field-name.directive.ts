import {
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  isDevMode,
  type Signal,
} from '@angular/core';
import { generateErrorId, generateWarningId } from '@ngx-signal-forms/toolkit';

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
 * <div ngxSignalFormHeadlessFieldName #fieldName="fieldName" fieldName="email">
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
 *   ngxSignalFormHeadlessFieldName
 *   #fieldName="fieldName"
 *   [fieldName]="dynamicFieldName"
 * >
 *   <!-- Uses dynamic field name from signal or value -->
 * </div>
 * ```
 *
 * @example Auto-resolve from host element id
 * ```html
 * <div ngxSignalFormHeadlessFieldName #fieldName="fieldName" id="email">
 *   <label [for]="fieldName.resolvedFieldName()">Email</label>
 * </div>
 * ```
 */
@Directive({
  selector: '[ngxSignalFormHeadlessFieldName]',
  exportAs: 'fieldName',
})
export class NgxHeadlessFieldNameDirective implements FieldNameStateSignals {
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
    const inputValue = this.fieldName();
    if (inputValue !== undefined) {
      const resolved = inputValue.trim();
      if (resolved.length > 0) {
        return resolved;
      }
    }

    const hostId = this.#readHostId();
    if (hostId) {
      return hostId;
    }

    if (isDevMode() && !this.#warnedMissingName) {
      this.#warnedMissingName = true;
      console.error(
        '[ngx-signal-forms] ngxSignalFormHeadlessFieldName requires either a non-empty `fieldName` input or a host element `id`. ARIA wiring will be skipped.',
      );
    }

    return null;
  });

  /**
   * Generated error region ID, or `null` when no field name is resolvable.
   */
  readonly errorId = computed<string | null>(() => {
    const name = this.resolvedFieldName();
    return name === null ? null : generateErrorId(name);
  });

  /**
   * Generated warning region ID, or `null` when no field name is resolvable.
   */
  readonly warningId = computed<string | null>(() => {
    const name = this.resolvedFieldName();
    return name === null ? null : generateWarningId(name);
  });

  #readHostId(): string | null {
    const nativeElement = this.#elementRef.nativeElement;

    if (typeof nativeElement.getAttribute === 'function') {
      const attrId = nativeElement.getAttribute('id')?.trim();
      if (attrId) {
        return attrId;
      }
    }

    const propertyId = nativeElement.id.trim();
    return propertyId ? propertyId : null;
  }
}
