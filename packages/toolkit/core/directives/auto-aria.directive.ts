import {
  afterNextRender,
  computed,
  Directive,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { FORM_FIELD } from '@angular/forms/signals';
import { NGX_SIGNAL_FORM_CONTEXT } from '../tokens';
import type { ErrorDisplayStrategy } from '../types';
import { shouldShowErrors } from '../utilities/error-strategies';
import {
  generateErrorId,
  generateWarningId,
  resolveFieldName,
} from '../utilities/field-resolution';
import { injectFormConfig } from '../utilities/inject-form-config';

/**
 * Automatically manages ARIA attributes for Signal Forms controls.
 *
 * Adds:
 * - `aria-invalid`: Reflects the field's validation state
 * - `aria-describedby`: Links to error messages for screen readers
 *
 * **Selector Strategy**: Automatically applies to all form controls with `[formField]` attribute,
 * except radio buttons and checkboxes (which require special handling).
 *
 * **Opt-out**: Add `ngxSignalFormAutoAriaDisabled` attribute to disable.
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
    input[formField]:not([ngxSignalFormAutoAriaDisabled]):not([type="radio"]):not([type="checkbox"]),
    textarea[formField]:not([ngxSignalFormAutoAriaDisabled]),
    select[formField]:not([ngxSignalFormAutoAriaDisabled]),
    [formField]:not(input):not(textarea):not(select):not([ngxSignalFormAutoAriaDisabled])
  `,
  host: {
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-describedby]': 'ariaDescribedBy()',
    '[attr.aria-required]': 'ariaRequired()',
  },
})
export class NgxSignalFormAutoAriaDirective {
  #shouldShowBy(predicate: (kind: string) => boolean): boolean {
    const field = this.#formField.field();
    if (!field) return false;

    const fieldState = field();
    if (!fieldState) return false;

    const errors = fieldState.errors();
    const hasMatchingErrors = errors.some((error) => predicate(error.kind));
    if (!hasMatchingErrors) return false;

    const strategy: ErrorDisplayStrategy =
      this.#context?.errorStrategy() ?? 'on-touch';
    const submittedStatus = this.#context?.submittedStatus() ?? 'unsubmitted';

    return shouldShowErrors(fieldState, strategy, submittedStatus);
  }

  readonly #element = inject(ElementRef<HTMLElement>);
  readonly #injector = inject(Injector);
  readonly #config = injectFormConfig();
  readonly #context = inject(NGX_SIGNAL_FORM_CONTEXT, { optional: true });

  /// Inject Angular's FormField to avoid creating a duplicate `formField` input,
  /// which triggers the pass-through flag and disables FormField's blur/value binding.
  readonly #formField = inject(FORM_FIELD);

  /**
   * Resolved field name for this field.
   */
  readonly #fieldName = signal<string | null>(null);

  /**
   * Existing aria-describedby value captured on init.
   * Used to preserve developer-specified associations (hints, descriptions).
   */
  readonly #existingDescribedBy = signal<string | null>(null);

  readonly #domVersion = signal(0);

  /**
   * Computed signal that determines if errors should be shown based on error display strategy.
   * Respects form-level ErrorDisplayStrategy from NgxSignalFormDirective (`[formRoot]`).
   */
  readonly #shouldShowErrors = computed(() => {
    return this.#shouldShowBy((kind) => !kind.startsWith('warn:'));
  });

  /**
   * Computed signal that determines if warnings should be shown.
   * Warnings use same visibility logic as errors.
   */
  readonly #shouldShowWarnings = computed(() => {
    return this.#shouldShowBy((kind) => kind.startsWith('warn:'));
  });

  /**
   * Computed ARIA invalid state.
   * Returns 'true' | 'false' | null based on field validity and error display strategy.
   *
   * Respects the configured ErrorDisplayStrategy, so aria-invalid='true' only
   * appears when errors should be visible according to the strategy.
   */
  protected readonly ariaInvalid = computed(() => {
    const fieldState = this.#formField.state();
    if (!fieldState) return null;

    return this.#shouldShowErrors() ? 'true' : 'false';
  });

  /**
   * Computed ARIA required state.
   * Returns 'true' | null based on the field's `required()` signal.
   */
  protected readonly ariaRequired = computed(() => {
    const fieldState = this.#formField.state();
    if (!fieldState) return null;

    return fieldState.required() ? 'true' : null;
  });

  /**
   * Computed ARIA describedby attribute.
   * Links to error/warning message elements for screen readers.
   *
   * Preserves existing aria-describedby values (hints, descriptions) and
   * appends error/warning IDs when they should be shown.
   */
  protected readonly ariaDescribedBy = computed(() => {
    this.#domVersion();
    const fieldState = this.#formField.state();
    if (!fieldState) return this.#existingDescribedBy();

    const fieldName = this.#fieldName();
    if (!fieldName) return this.#existingDescribedBy();

    const existing = this.#existingDescribedBy();
    const parts: string[] = existing ? existing.split(' ').filter(Boolean) : [];

    const hintIds = this.#resolveHintIds(fieldName);
    for (const hintId of hintIds) {
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

  #resolveHintIds(fieldName: string): string[] {
    const host = this.#element.nativeElement;
    const wrapper = host.closest('ngx-signal-form-field-wrapper');
    if (!wrapper) return [];

    const hintElements = Array.from(
      wrapper.querySelectorAll(
        'ngx-signal-form-field-hint[data-ngx-signal-form-hint]',
      ),
    ) as HTMLElement[];

    const matchingHints = hintElements.filter((hint) => {
      const hintField = hint.getAttribute('data-signal-field');
      return !hintField || hintField === fieldName;
    });

    return matchingHints
      .map((hint) => hint.getAttribute('id'))
      .filter((id): id is string => Boolean(id));
  }

  constructor() {
    // Capture existing aria-describedby before we modify it
    const existingDescribedBy =
      this.#element.nativeElement.getAttribute('aria-describedby');
    this.#existingDescribedBy.set(existingDescribedBy);

    // Resolve field name on initialization
    const fieldName = resolveFieldName(
      this.#element.nativeElement,
      this.#injector,
    );
    this.#fieldName.set(fieldName);

    if (this.#config.debug) {
      console.log(
        '[NgxSignalFormAutoAriaDirective] Initialized for field:',
        fieldName,
        { existingDescribedBy },
      );
    }

    afterNextRender(
      () => {
        this.#domVersion.update((value) => value + 1);
      },
      { injector: this.#injector },
    );
  }
}
