import {
  afterEveryRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  NgxFormFieldError,
  NgxFormFieldNotification,
  type NgxFormFieldErrorListStyle,
} from '@ngx-signal-forms/toolkit/assistive';
import { NgxHeadlessFieldset } from '@ngx-signal-forms/toolkit/headless';

export type FieldsetErrorPlacement = 'top' | 'bottom';
export type FieldsetFeedbackAppearance = 'auto' | 'plain' | 'notification';
export type FieldsetSurfaceTone =
  | 'default'
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';
export type FieldsetValidationSurface = 'never' | 'auto' | 'always';

const SELECTION_GROUP_SELECTOR = [
  "input[type='radio']",
  "input[type='checkbox']:not([role='switch'])",
  "[data-ngx-signal-form-control-kind='checkbox']",
  "[data-ngx-signal-form-control-kind='radio-group']",
].join(', ');

const NON_SELECTION_GROUP_SELECTOR = [
  "input:not([type='radio']):not([type='checkbox'])",
  'textarea',
  'select',
  "[data-ngx-signal-form-control-kind='input-like']",
  "[data-ngx-signal-form-control-kind='standalone-field-like']",
  "[data-ngx-signal-form-control-kind='switch']",
  "[data-ngx-signal-form-control-kind='slider']",
  "[data-ngx-signal-form-control-kind='composite']",
].join(', ');

/**
 * Form fieldset component for grouping related form fields with aggregated error/warning display.
 *
 * Similar to HTML `<fieldset>`, this component groups form fields and displays
 * aggregated validation messages for all contained fields. It resolves between
 * compact inline feedback and a surfaced notification pattern depending on the
 * grouped content and the configured appearance.
 *
 * Reach for `NgxFormFieldset` when the validation story belongs to a group,
 * not just an individual control:
 *
 * - a cross-field rule lives on the parent node (`password !== confirm`)
 * - a nested subsection should own one shared summary
 * - repeated rows or radio/checkbox groups need one grouped error surface
 *
 * When each control should fully own its own label, hint, and feedback, use
 * `NgxFormFieldWrapper` on those leaf controls and keep the fieldset in its
 * default group-only mode. When you need total markup control but still want
 * the aggregation state, compose `NgxHeadlessFieldset` directly.
 *
 * ## Composition
 *
 * The styled fieldset composes `NgxHeadlessFieldset` via
 * `hostDirectives`. All field-aggregation state — errors, warnings,
 * strategy resolution, submitted status, deduplication — lives in the
 * headless directive; this component only contributes UI-layer
 * concerns (`showErrors` toggle, `errorPlacement`, `describedByIds`).
 *
 * ## Features
 *
 * - **Aggregated Errors**: Collects errors from all nested fields via `errorSummary()`
 * - **Group-Only Mode**: Show only group-level errors when nested fields display their own
 * - **Deduplication**: Same error shown only once even if multiple fields have it
 * - **Warning Support**: Non-blocking warnings (with `warn:` prefix) shown when no errors
 * - **Adaptive Feedback UI**: Notification cards for standard groups, compact text for selection-only groups
 * - **Configurable Surface Tones**: Neutral, info, success, warning, or danger base surfaces
 * - **WCAG 2.2 Compliant**: Errors use `role="alert"`, warnings use `role="status"`
 * - **Strategy Aware**: Respects `ErrorDisplayStrategy` from form context or input
 * - **Configurable Placement**: Grouped messages can appear above or below the fieldset content
 *
 * ## Error Display Modes
 *
 * Use `includeNestedErrors` to control which errors are shown:
 * - `false` (default): Shows ONLY direct group-level errors (use when fields show their own errors)
 * - `true`: Shows ALL errors including nested field errors via `errorSummary()`
 *
 * @template TFieldset The type of the fieldset field value
 *
 * @example Group-Only Mode (when nested fields show their own errors)
 * ```html
 * <ngx-form-fieldset
 *   [fieldsetField]="form.passwords"
 *   [includeNestedErrors]="false"
 * >
 *   <ngx-form-field-wrapper [formField]="form.passwords.password">...</ngx-form-field-wrapper>
 *   <ngx-form-field-wrapper [formField]="form.passwords.confirm">...</ngx-form-field-wrapper>
 *   <!-- Fieldset shows only "Passwords must match" cross-field error -->
 * </ngx-form-fieldset>
 * ```
 *
 * @example Aggregated Mode (when nested fields don't show errors)
 * ```html
 * <ngx-form-fieldset [fieldsetField]="form.address">
 *   <input [formField]="form.address.street" />
 *   <input [formField]="form.address.city" />
 *   <!-- Fieldset shows all nested field errors -->
 * </ngx-form-fieldset>
 * ```
 */
@Component({
  selector: 'ngx-form-fieldset, [ngxFormFieldset]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: NgxHeadlessFieldset,
      inputs: [
        'fieldsetField',
        'fields',
        'fieldsetId',
        'strategy',
        'submittedStatus',
        'includeNestedErrors',
      ],
    },
  ],
  imports: [NgxFormFieldError, NgxFormFieldNotification],
  styleUrl: './form-fieldset.scss',
  exportAs: 'ngxFormFieldset',
  // BEM classnames keep the legacy `ngx-signal-form-fieldset--*` prefix for
  // theming back-compat. The host's element selector uses the new short
  // prefix (`ngx-form-fieldset`); only the CSS surface stayed on the long
  // form so consumer overrides like `.ngx-signal-form-fieldset--invalid {…}`
  // keep working without rewriting their stylesheets.
  host: {
    '[class.ngx-signal-form-fieldset--selection-group]':
      'isSelectionGroupFieldset()',
    '[class.ngx-signal-form-fieldset--invalid]': 'fieldset.shouldShowErrors()',
    '[class.ngx-signal-form-fieldset--warning]':
      'fieldset.shouldShowWarnings()',
    '[class.ngx-signal-form-fieldset--surface-invalid]': 'showInvalidSurface()',
    '[class.ngx-signal-form-fieldset--surface-warning]': 'showWarningSurface()',
    '[class.ngx-signal-form-fieldset--messages-top]': 'isTopPlacement()',
    '[class.ngx-signal-form-fieldset--messages-bottom]': '!isTopPlacement()',
    '[attr.aria-describedby]': 'describedByIds()',
    '[attr.data-error-placement]': 'errorPlacement()',
    '[attr.data-feedback-appearance]': 'resolvedFeedbackAppearance()',
    '[attr.data-surface-tone]': 'surfaceTone()',
    '[attr.data-validation-surface]': 'validationSurface()',
    '[attr.aria-busy]': 'fieldset.isPending() ? "true" : null',
  },
  template: `
    <ng-content select="legend" />

    <div class="ngx-signal-form-fieldset__surface">
      @if (showMessages() && isTopPlacement()) {
        <div class="ngx-signal-form-fieldset__messages">
          @if (usesNotificationFeedback()) {
            <ngx-form-field-notification
              [errors]="filteredErrorsSignal"
              [fieldName]="fieldset.resolvedFieldsetId()"
              [title]="notificationTitle()"
              [listStyle]="resolvedListStyle()"
            />
          } @else {
            <ngx-form-field-error
              [errors]="filteredErrorsSignal"
              [fieldName]="fieldset.resolvedFieldsetId()"
              [strategy]="fieldset.resolvedStrategy()"
              [submittedStatus]="fieldset.resolvedSubmittedStatus()"
              [listStyle]="resolvedListStyle()"
            />
          }
        </div>
      }

      <div class="ngx-signal-form-fieldset__content">
        <ng-content />
      </div>

      @if (showMessages() && !isTopPlacement()) {
        <div class="ngx-signal-form-fieldset__messages">
          @if (usesNotificationFeedback()) {
            <ngx-form-field-notification
              [errors]="filteredErrorsSignal"
              [fieldName]="fieldset.resolvedFieldsetId()"
              [title]="notificationTitle()"
              [listStyle]="resolvedListStyle()"
            />
          } @else {
            <ngx-form-field-error
              [errors]="filteredErrorsSignal"
              [fieldName]="fieldset.resolvedFieldsetId()"
              [strategy]="fieldset.resolvedStrategy()"
              [submittedStatus]="fieldset.resolvedSubmittedStatus()"
              [listStyle]="resolvedListStyle()"
            />
          }
        </div>
      }
    </div>
  `,
})
export class NgxFormFieldset {
  /**
   * The composed headless fieldset directive that owns all aggregated
   * validation state. Exposed to the template so bindings stay short
   * (`fieldset.isPending()` rather than `this.#fieldset.isPending()`),
   * and protected so it doesn't leak into the component's public API.
   */
  protected readonly fieldset = inject(NgxHeadlessFieldset);
  readonly #elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #isSelectionGroupFieldset = signal(false);

  /**
   * Whether to show the automatic error/warning display.
   * @default true
   */
  readonly showErrors = input(true, { transform: booleanAttribute });

  /**
   * Placement of the aggregated error or warning summary.
   *
   * This API is primarily intended for grouped fieldset summaries. The wrapper
   * component also supports message placement, but this fieldset placement is
   * the main design-alignment control for complex grouped forms.
   *
   * Use `top` when the summary should be announced immediately after the
   * legend/description, which can work well for grouped validation such as
   * address sections or radio groups. Use `bottom` when the user should scan
   * the controls first and see the shared summary after the group, which is
   * now the default and tends to work better in dense review-style layouts.
   *
   * - `top`: display the summary directly below the legend/description
   * - `bottom` (default): display the summary after the projected field content
   */
  readonly errorPlacement = input<FieldsetErrorPlacement>('bottom');

  /**
   * Presentation style for grouped feedback.
   *
   * - `auto` (default): surfaced notification for regular grouped sections,
   *   compact inline feedback for selection-only groups (radio/checkbox)
   * - `plain`: always use the compact `ngx-form-field-error` presentation
   * - `notification`: always use the surfaced notification card
   */
  readonly feedbackAppearance = input<FieldsetFeedbackAppearance>('auto');

  /**
   * Optional title rendered inside the notification card.
   */
  readonly notificationTitle = input<string | null | undefined>();

  /**
   * Visual layout for grouped messages.
   */
  readonly listStyle = input<NgxFormFieldErrorListStyle>('bullets');

  /**
   * Base surface tint for the fieldset content area.
   */
  readonly surfaceTone = input<FieldsetSurfaceTone>('default');

  /**
   * Whether validation state should tint the fieldset surface.
   *
   * - `never`: keep the surface neutral and rely on the grouped message only
   * - `auto` (default): tint only selection-only groups such as radio/checkbox sets
   * - `always`: tint every invalid/warning fieldset surface
   */
  readonly validationSurface = input<FieldsetValidationSurface>('auto');

  protected readonly isTopPlacement = computed(() => {
    return this.errorPlacement() !== 'bottom';
  });

  protected readonly showMessages = computed(() => {
    return (
      this.showErrors() &&
      (this.fieldset.shouldShowErrors() || this.fieldset.shouldShowWarnings())
    );
  });

  protected readonly resolvedFeedbackAppearance = computed<
    Exclude<FieldsetFeedbackAppearance, 'auto'>
  >(() => {
    const appearance = this.feedbackAppearance();
    if (appearance === 'plain' || appearance === 'notification') {
      return appearance;
    }

    return this.#isSelectionGroupFieldset() ? 'plain' : 'notification';
  });

  protected readonly usesNotificationFeedback = computed(() => {
    return this.resolvedFeedbackAppearance() === 'notification';
  });

  protected readonly isSelectionGroupFieldset = computed(() => {
    return this.#isSelectionGroupFieldset();
  });

  protected readonly resolvedListStyle = computed<NgxFormFieldErrorListStyle>(
    () => {
      if (
        this.feedbackAppearance() === 'auto' &&
        this.#isSelectionGroupFieldset()
      ) {
        return 'plain';
      }

      return this.listStyle();
    },
  );

  /**
   * Filtered errors signal for NgxFormFieldError.
   *
   * Passes blocking errors OR warnings, never both.
   * Warnings are suppressed when errors exist (UX best practice).
   */
  protected readonly filteredErrorsSignal = computed(() => {
    const blocking = this.fieldset.aggregatedErrors();
    return blocking.length > 0 ? blocking : this.fieldset.aggregatedWarnings();
  });

  protected readonly showInvalidSurface = computed(() => {
    if (!this.fieldset.shouldShowErrors()) {
      return false;
    }

    const mode = this.validationSurface();
    if (mode === 'never') {
      return false;
    }

    return mode === 'always' || this.#isSelectionGroupFieldset();
  });

  protected readonly showWarningSurface = computed(() => {
    if (
      this.fieldset.shouldShowErrors() ||
      !this.fieldset.shouldShowWarnings()
    ) {
      return false;
    }

    const mode = this.validationSurface();
    if (mode === 'never') {
      return false;
    }

    return mode === 'always' || this.#isSelectionGroupFieldset();
  });

  readonly describedByIds = computed(() => {
    const ids: string[] = [];
    const fieldsetId = this.fieldset.resolvedFieldsetId();

    if (this.fieldset.shouldShowErrors()) {
      ids.push(`${fieldsetId}-error`);
    }

    if (this.fieldset.shouldShowWarnings()) {
      ids.push(`${fieldsetId}-warning`);
    }

    return ids.length > 0 ? ids.join(' ') : null;
  });

  constructor() {
    afterEveryRender({
      earlyRead: () => {
        const host = this.#elementRef.nativeElement;
        const content = host.querySelector(
          '.ngx-signal-form-fieldset__content',
        );
        const scope = content ?? host;

        const hasSelectionControls = scope.querySelector(
          SELECTION_GROUP_SELECTOR,
        );
        const hasNonSelectionControls = scope.querySelector(
          NON_SELECTION_GROUP_SELECTOR,
        );

        return Boolean(hasSelectionControls) && !hasNonSelectionControls;
      },
      write: (isSelectionGroupFieldset) => {
        if (isSelectionGroupFieldset !== this.#isSelectionGroupFieldset()) {
          this.#isSelectionGroupFieldset.set(isSelectionGroupFieldset);
        }
      },
    });
  }
}
