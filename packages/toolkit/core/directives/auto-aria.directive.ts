import {
  afterEveryRender,
  computed,
  Directive,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { FORM_FIELD, type FieldState } from '@angular/forms/signals';
import { NGX_SIGNAL_FORM_CONTEXT } from '../tokens';
import { NgxSignalFormControlSemanticsDirective } from './control-semantics.directive';
import type { ErrorDisplayStrategy } from '../types';
import { shouldShowErrors } from '../utilities/error-strategies';
import {
  generateErrorId,
  generateWarningId,
  resolveFieldName,
} from '../utilities/field-resolution';
import type { ErrorReadableState } from '../utilities/field-state-types';
import { isBlockingError, isWarningError } from '../utilities/warning-error';

interface AutoAriaDomSnapshot {
  readonly fieldName: string | null;
  readonly describedBy: string | null;
  readonly ariaInvalid: string | null;
  readonly ariaRequired: string | null;
  readonly hintIds: readonly string[];
}

const INITIAL_DOM_SNAPSHOT: AutoAriaDomSnapshot = {
  fieldName: null,
  describedBy: null,
  ariaInvalid: null,
  ariaRequired: null,
  hintIds: [],
};

type RequiredFieldState = Pick<FieldState<unknown>, 'required'>;

interface AutoAriaFieldState
  extends Partial<ErrorReadableState>, Partial<RequiredFieldState> {}

function isAutoAriaFieldState(value: unknown): value is AutoAriaFieldState {
  return value != null && typeof value === 'object';
}

/**
 * Automatically manages ARIA attributes for Signal Forms controls.
 *
 * Adds:
 * - `aria-invalid`: Reflects the field's validation state
 * - `aria-describedby`: Links to error messages for screen readers
 *
 * **Selector Strategy**: Automatically applies to all form controls with `[formField]` attribute,
 * except radio buttons and standard checkboxes. Checkbox-based switches opt back in
 * with `role="switch"`, and explicit control semantics can opt checkbox/radio hosts in
 * without relying on native-role heuristics.
 *
 * **Ownership model**:
 * - default: toolkit owns `aria-invalid`, `aria-required`, and `aria-describedby`
 * - `ngxSignalFormControlAria="manual"`: the control owns those ARIA attributes
 * - `ngxSignalFormAutoAriaDisabled`: disable toolkit participation entirely for bespoke hosts
 *
 * @example
 * ```html
 * <!-- Automatic ARIA (enabled by default) -->
 * <label for="email">Email</label>
 * <input id="email" [formField]="form.email" />
 * <!-- Result: aria-invalid="true" aria-describedby="email-error" when invalid -->
 *
 * <!-- Opt-out -->
 * <input [formField]="form.custom" ngxSignalFormAutoAriaDisabled />
 * ```
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector -- Targets Angular Signal Forms' [formField] directive
  selector: `
    input[type="checkbox"][ngxSignalFormControl][formField]:not([ngxSignalFormAutoAriaDisabled]),
    input[type="radio"][ngxSignalFormControl][formField]:not([ngxSignalFormAutoAriaDisabled]),
    input[type="checkbox"][role="switch"][formField]:not([ngxSignalFormAutoAriaDisabled]),
    input[formField]:not([ngxSignalFormAutoAriaDisabled]):not([type="radio"]):not([type="checkbox"]),
    textarea[formField]:not([ngxSignalFormAutoAriaDisabled]),
    select[formField]:not([ngxSignalFormAutoAriaDisabled]),
    [formField]:not(input):not(textarea):not(select):not([ngxSignalFormAutoAriaDisabled])
  `,
})
export class NgxSignalFormAutoAriaDirective {
  #resolveFieldState(): AutoAriaFieldState | null {
    const field = this.#formField.field();
    const fieldState =
      typeof field === 'function' ? field() : this.#formField.state();

    return isAutoAriaFieldState(fieldState) ? fieldState : null;
  }

  #hasUsableFieldState(): boolean {
    return this.#resolveFieldState() !== null;
  }

  #shouldShowBy(errorType: 'blocking' | 'warning'): boolean {
    const fieldState = this.#resolveFieldState();

    if (!fieldState) {
      return false;
    }

    const errors =
      typeof fieldState.errors === 'function' ? fieldState.errors() : [];

    if (!Array.isArray(errors)) {
      return false;
    }

    const hasMatchingErrors = errors.some(
      errorType === 'blocking' ? isBlockingError : isWarningError,
    );
    if (!hasMatchingErrors) return false;

    const strategy: ErrorDisplayStrategy =
      this.#context?.errorStrategy() ?? 'on-touch';
    const submittedStatus = this.#context?.submittedStatus() ?? 'unsubmitted';

    if (
      typeof fieldState.invalid !== 'function' ||
      typeof fieldState.touched !== 'function'
    ) {
      return false;
    }

    return shouldShowErrors(
      fieldState.invalid(),
      fieldState.touched(),
      strategy,
      submittedStatus,
    );
  }

  readonly #element = inject(ElementRef<HTMLElement>);
  readonly #injector = inject(Injector);
  readonly #context = inject(NGX_SIGNAL_FORM_CONTEXT, { optional: true });
  readonly #controlSemantics = inject(NgxSignalFormControlSemanticsDirective, {
    optional: true,
    self: true,
  });

  /// Inject Angular's FormField to avoid creating a duplicate `formField` input,
  /// which triggers the pass-through flag and disables FormField's blur/value binding.
  readonly #formField = inject(FORM_FIELD);

  readonly #domSnapshot = signal(INITIAL_DOM_SNAPSHOT);
  readonly #managedDescribedByIds = signal<readonly string[]>([]);

  readonly #isManualAriaMode = computed(() => {
    return this.#controlSemantics?.ariaMode() === 'manual';
  });

  /**
   * Computed signal that determines if errors should be shown based on error display strategy.
   * Respects form-level ErrorDisplayStrategy from NgxSignalFormDirective (`[formRoot]`).
   */
  readonly #shouldShowErrors = computed(() => {
    return this.#shouldShowBy('blocking');
  });

  /**
   * Computed signal that determines if warnings should be shown.
   * Warnings use same visibility logic as errors.
   */
  readonly #shouldShowWarnings = computed(() => {
    return this.#shouldShowBy('warning');
  });

  /**
   * Computed ARIA invalid state.
   * Returns 'true' | 'false' | null based on field validity and error display strategy.
   *
   * Respects the configured ErrorDisplayStrategy, so aria-invalid='true' only
   * appears when errors should be visible according to the strategy.
   */
  protected readonly ariaInvalid = computed(() => {
    if (this.#isManualAriaMode()) {
      return this.#domSnapshot().ariaInvalid;
    }

    if (!this.#hasUsableFieldState()) {
      return null;
    }

    return this.#shouldShowErrors() ? 'true' : 'false';
  });

  /**
   * Computed ARIA required state.
   * Returns 'true' | null based on the field's `required()` signal.
   */
  protected readonly ariaRequired = computed(() => {
    if (this.#isManualAriaMode()) {
      return this.#domSnapshot().ariaRequired;
    }

    const fieldState = this.#resolveFieldState();

    if (!fieldState) {
      return null;
    }

    return typeof fieldState.required === 'function' && fieldState.required()
      ? 'true'
      : null;
  });

  /**
   * Computed ARIA describedby attribute.
   * Links to error/warning message elements for screen readers.
   *
   * Preserves existing aria-describedby values (hints, descriptions) and
   * appends error/warning IDs when they should be shown.
   */
  protected readonly ariaDescribedBy = computed(() => {
    if (this.#isManualAriaMode()) {
      return this.#domSnapshot().describedBy;
    }

    const snapshot = this.#domSnapshot();
    const fieldName = snapshot.fieldName;
    if (!fieldName) return snapshot.describedBy;

    const existing = snapshot.describedBy;
    const parts: string[] = existing ? existing.split(' ').filter(Boolean) : [];

    for (const hintId of snapshot.hintIds) {
      if (!parts.includes(hintId)) {
        parts.push(hintId);
      }
    }

    // Add error ID if showing errors
    if (this.#shouldShowErrors()) {
      const errorId = generateErrorId(fieldName);
      if (!parts.includes(errorId)) {
        parts.push(errorId);
      }
    }

    // Add warning ID if showing warnings
    if (this.#shouldShowWarnings()) {
      const warningId = generateWarningId(fieldName);
      if (!parts.includes(warningId)) {
        parts.push(warningId);
      }
    }

    return parts.length > 0 ? parts.join(' ') : null;
  });

  #haveSameIds(current: readonly string[], next: readonly string[]): boolean {
    return (
      current.length === next.length &&
      current.every((currentId, index) => currentId === next[index])
    );
  }

  #resolveManagedDescribedByIds(
    snapshot: AutoAriaDomSnapshot,
  ): readonly string[] {
    if (this.#isManualAriaMode()) {
      return [];
    }

    if (!snapshot.fieldName) {
      return snapshot.hintIds;
    }

    const managedIds = [...snapshot.hintIds];

    if (this.#shouldShowErrors()) {
      managedIds.push(generateErrorId(snapshot.fieldName));
    }

    if (this.#shouldShowWarnings()) {
      managedIds.push(generateWarningId(snapshot.fieldName));
    }

    return Array.from(new Set(managedIds));
  }

  #readPreservedDescribedBy(fieldName: string | null): string | null {
    const raw = this.#element.nativeElement.getAttribute('aria-describedby');

    if (!raw) {
      return null;
    }

    const parts = raw.split(' ').filter(Boolean);

    if (!fieldName) {
      const preserved = parts.filter(
        (part: string) => !this.#managedDescribedByIds().includes(part),
      );

      return preserved.length > 0 ? preserved.join(' ') : null;
    }

    const generatedIds = new Set(this.#managedDescribedByIds());
    generatedIds.add(generateErrorId(fieldName));
    generatedIds.add(generateWarningId(fieldName));

    const preserved = parts.filter((part: string) => !generatedIds.has(part));

    return preserved.length > 0 ? preserved.join(' ') : null;
  }

  #readDomSnapshot(): AutoAriaDomSnapshot {
    const fieldName = resolveFieldName(this.#element.nativeElement);

    return {
      fieldName,
      describedBy: this.#readPreservedDescribedBy(fieldName),
      ariaInvalid: this.#element.nativeElement.getAttribute('aria-invalid'),
      ariaRequired: this.#element.nativeElement.getAttribute('aria-required'),
      hintIds: fieldName ? this.#resolveHintIds(fieldName) : [],
    };
  }

  #resolveHintIds(fieldName: string): string[] {
    const host = this.#element.nativeElement;
    const maybeWrapper = host.closest('ngx-signal-form-field-wrapper');
    if (!(maybeWrapper instanceof HTMLElement)) return [];

    const wrapper = maybeWrapper;

    const hintElements = Array.from(
      wrapper.querySelectorAll(
        'ngx-signal-form-field-hint[data-ngx-signal-form-hint]',
      ),
    );

    const hintIds: string[] = [];

    for (const matchingHint of hintElements) {
      const hintField = matchingHint.getAttribute('data-signal-field');
      if (hintField && hintField !== fieldName) {
        continue;
      }

      const id = matchingHint.getAttribute('id');
      if (id) {
        hintIds.push(id);
      }
    }

    return hintIds;
  }

  #writeManagedAttribute(
    name: 'aria-describedby' | 'aria-invalid' | 'aria-required',
    value: string | null,
  ): void {
    if (value === null) {
      this.#element.nativeElement.removeAttribute(name);
      return;
    }

    this.#element.nativeElement.setAttribute(name, value);
  }

  constructor() {
    this.#domSnapshot.set(this.#readDomSnapshot());

    // Single afterEveryRender with proper phased callbacks:
    // - earlyRead: read DOM attributes before any writes (prevents layout thrashing)
    // - write: update the snapshot signal and write managed ARIA attributes to the DOM
    afterEveryRender(
      {
        earlyRead: () => {
          return this.#readDomSnapshot();
        },
        write: (snapshot) => {
          const current = this.#domSnapshot();
          const previousManagedDescribedByIds = this.#managedDescribedByIds();
          const managedDescribedByIds =
            this.#resolveManagedDescribedByIds(snapshot);

          if (
            current.fieldName !== snapshot.fieldName ||
            current.describedBy !== snapshot.describedBy ||
            current.ariaInvalid !== snapshot.ariaInvalid ||
            current.ariaRequired !== snapshot.ariaRequired ||
            !this.#haveSameIds(current.hintIds, snapshot.hintIds)
          ) {
            this.#domSnapshot.set(snapshot);
          }

          if (
            !this.#haveSameIds(
              previousManagedDescribedByIds,
              managedDescribedByIds,
            )
          ) {
            this.#managedDescribedByIds.set(managedDescribedByIds);
          }

          if (this.#isManualAriaMode()) {
            const currentDescribedBy =
              this.#element.nativeElement.getAttribute('aria-describedby');
            const describedByParts = currentDescribedBy
              ? currentDescribedBy.split(' ').filter(Boolean)
              : [];
            const hasManagedDescribedByIds = previousManagedDescribedByIds.some(
              (id) => describedByParts.includes(id),
            );

            if (hasManagedDescribedByIds) {
              this.#writeManagedAttribute(
                'aria-describedby',
                snapshot.describedBy,
              );
            }

            if (previousManagedDescribedByIds.length > 0) {
              this.#managedDescribedByIds.set([]);
            }

            return;
          }

          this.#writeManagedAttribute('aria-invalid', this.ariaInvalid());
          this.#writeManagedAttribute(
            'aria-describedby',
            this.ariaDescribedBy(),
          );
          this.#writeManagedAttribute('aria-required', this.ariaRequired());
        },
      },
      { injector: this.#injector },
    );
  }
}
