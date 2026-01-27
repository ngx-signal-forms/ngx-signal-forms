import {
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  type Signal,
} from '@angular/core';
import {
  generateErrorId,
  generateWarningId,
  unwrapValue,
  type ReactiveOrStatic,
} from '@ngx-signal-forms/toolkit';
import { createUniqueId } from './utilities';

/**
 * Field name state signals exposed by the headless directive.
 */
export interface FieldNameStateSignals {
  /** Resolved field name from input or override */
  readonly resolvedFieldName: Signal<string>;
  /** Generated error region ID */
  readonly errorId: Signal<string>;
  /** Generated warning region ID */
  readonly warningId: Signal<string>;
  /** Whether the field has a non-empty name */
  readonly hasFieldName: Signal<boolean>;
}

/**
 * Headless field name directive for label and ID resolution.
 *
 * Provides signals for resolving field names and generating accessible
 * IDs for error/warning description regions.
 *
 * ## Features
 *
 * - **Name Resolution**: Resolves name from input, host element `id`, or fallback
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
  readonly #generatedFieldName = createUniqueId('field');

  /**
   * The field name to use for ID generation.
   * If not provided, uses host element `id` or a generated fallback.
   */
  readonly fieldName = input<ReactiveOrStatic<string> | undefined>(undefined);

  /**
   * Resolved field name.
   */
  readonly resolvedFieldName = computed(() => {
    const inputValue = this.fieldName();
    if (inputValue !== undefined && inputValue !== null) {
      const resolved = unwrapValue(inputValue).trim();
      if (resolved.length > 0) {
        return resolved;
      }
    }

    const hostId = this.#readHostId();
    if (hostId) {
      return hostId;
    }

    return this.#generatedFieldName;
  });

  /**
   * Whether the field has a non-empty name.
   */
  readonly hasFieldName = computed(
    () => this.resolvedFieldName().trim().length > 0,
  );

  /**
   * Generated error region ID.
   */
  readonly errorId = computed(() => generateErrorId(this.resolvedFieldName()));

  /**
   * Generated warning region ID.
   */
  readonly warningId = computed(() =>
    generateWarningId(this.resolvedFieldName()),
  );

  #readHostId(): string | null {
    const nativeElement = this.#elementRef?.nativeElement;
    if (!nativeElement) {
      return null;
    }

    if (typeof nativeElement.getAttribute === 'function') {
      const attrId = nativeElement.getAttribute('id')?.trim();
      if (attrId) {
        return attrId;
      }
    }

    const propertyId = (nativeElement as HTMLElement).id?.trim();
    return propertyId ? propertyId : null;
  }
}
