import { NgTemplateOutlet } from '@angular/common';
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
export type FieldsetValidationSurface = 'never' | 'always';

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
 * - **Adaptive Feedback UI**: Notification cards by default, with an optional compact text mode
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
  imports: [NgTemplateOutlet, NgxFormFieldError, NgxFormFieldNotification],
  styleUrl: './form-fieldset.scss',
  exportAs: 'ngxFormFieldset',
  // BEM classnames keep the legacy `ngx-signal-form-fieldset--*` prefix for
  // theming back-compat. The host's element selector uses the new short
  // prefix (`ngx-form-fieldset`); only the CSS surface stayed on the long
  // form so consumer overrides like `.ngx-signal-form-fieldset--invalid {…}`
  // keep working without rewriting their stylesheets.
  host: {
    '[class.ngx-signal-form-fieldset--invalid]': 'fieldset.shouldShowErrors()',
    '[class.ngx-signal-form-fieldset--warning]':
      'fieldset.shouldShowWarnings()',
    '[class.ngx-signal-form-fieldset--surface-invalid]': 'showInvalidSurface()',
    '[class.ngx-signal-form-fieldset--surface-warning]': 'showWarningSurface()',
    '[class.ngx-signal-form-fieldset--messages-top]': 'isTopPlacement()',
    '[class.ngx-signal-form-fieldset--messages-bottom]': '!isTopPlacement()',
    '[attr.role]': 'hostRole()',
    '[attr.aria-labelledby]': 'legendLabelId()',
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
      @if (isTopPlacement()) {
        <ng-container *ngTemplateOutlet="messages" />
      }

      <div class="ngx-signal-form-fieldset__content">
        <ng-content />
      </div>

      @if (!isTopPlacement()) {
        <ng-container *ngTemplateOutlet="messages" />
      }
    </div>

    <ng-template #messages>
      <div class="ngx-signal-form-fieldset__messages">
        @if (usesNotificationFeedback()) {
          <ngx-form-field-notification
            [errors]="displayedMessagesSignal"
            [fieldName]="fieldset.resolvedFieldsetId()"
            [title]="notificationTitle()"
            [listStyle]="listStyle()"
          />
        } @else {
          <ngx-form-field-error
            [errors]="displayedMessagesSignal"
            [fieldName]="fieldset.resolvedFieldsetId()"
            [strategy]="fieldset.resolvedStrategy()"
            [submittedStatus]="fieldset.resolvedSubmittedStatus()"
            [listStyle]="listStyle()"
          />
        }
      </div>
    </ng-template>
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
  readonly #legendId = signal<string | null>(null);
  // `<fieldset>` natively implies role="group" and associates a child <legend>.
  // Any other host tag (custom element `<ngx-form-fieldset>` or a bare
  // `[ngxFormFieldset]` attribute target) needs an explicit group role so the
  // projected legend can label the region.
  readonly #isNativeFieldset =
    this.#elementRef.nativeElement.tagName.toLowerCase() === 'fieldset';

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
   * - `auto` (default): surfaced notification for grouped sections
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
   * - `never` (default): keep the surface neutral and rely on the grouped message only
   * - `always`: tint every invalid/warning fieldset surface
   */
  readonly validationSurface = input<FieldsetValidationSurface>('never');

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
    return appearance === 'plain' ? 'plain' : 'notification';
  });

  protected readonly usesNotificationFeedback = computed(() => {
    return this.resolvedFeedbackAppearance() === 'notification';
  });

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

  protected readonly displayedMessagesSignal = computed(() => {
    return this.showMessages() ? this.filteredErrorsSignal() : [];
  });

  protected readonly showInvalidSurface = computed(() => {
    return (
      this.validationSurface() === 'always' && this.fieldset.shouldShowErrors()
    );
  });

  protected readonly showWarningSurface = computed(() => {
    return (
      this.validationSurface() === 'always' &&
      !this.fieldset.shouldShowErrors() &&
      this.fieldset.shouldShowWarnings()
    );
  });

  protected readonly hostRole = computed<'group' | null>(() =>
    this.#isNativeFieldset ? null : 'group',
  );

  protected readonly legendLabelId = computed<string | null>(() => {
    // Native `<fieldset>` auto-associates its first <legend>; explicit
    // aria-labelledby would duplicate that relationship for AT.
    if (this.#isNativeFieldset) {
      return null;
    }
    return this.#legendId();
  });

  readonly describedByIds = computed(() => {
    // The rendered notification/error component strips its `id` attribute
    // whenever `displayedMessagesSignal` is empty, which happens when the user
    // passes `showErrors="false"` even on an invalid fieldset. Mirror that
    // gating here so `aria-describedby` never points to an element without a
    // matching id in the DOM.
    if (!this.showMessages()) {
      return null;
    }

    const fieldsetId = this.fieldset.resolvedFieldsetId();

    // Errors suppress warnings in the rendered notification (see
    // `filteredErrorsSignal`), so only reference the id that is actually in
    // the DOM.
    if (this.fieldset.shouldShowErrors()) {
      return `${fieldsetId}-error`;
    }

    if (this.fieldset.shouldShowWarnings()) {
      return `${fieldsetId}-warning`;
    }

    return null;
  });

  constructor() {
    afterEveryRender({
      earlyRead: () => {
        const host = this.#elementRef.nativeElement;
        const legend = host.querySelector(':scope > legend');
        const legendId =
          legend instanceof HTMLElement ? legend.id || null : null;

        return {
          legend: legend instanceof HTMLElement ? legend : null,
          legendId,
        };
      },
      write: ({ legend, legendId }) => {
        if (legend && !legendId) {
          const assigned = `${this.fieldset.resolvedFieldsetId()}-legend`;
          legend.id = assigned;
          this.#legendId.set(assigned);
        } else if (legendId !== this.#legendId()) {
          this.#legendId.set(legendId);
        }
      },
    });
  }
}
