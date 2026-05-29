import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  isDevMode,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import {
  injectFormContext,
  NGX_SIGNAL_FORMS_CONFIG,
  type FieldMarkingMode,
} from '@ngx-signal-forms/toolkit';
import { createFieldOptionalitySummary } from '@ngx-signal-forms/toolkit/headless';

/**
 * Form-level legend that explains the field marker (e.g. "* indicates a
 * required field").
 *
 * Place it once wherever it reads well in a form or page — there is no
 * automatic injection. It is mode-aware and form-aware:
 *
 * - In `'required'` mode it shows the required legend and hides when the form
 *   has no required fields.
 * - In `'optional'` mode it shows the optional legend and hides when the form
 *   has no optional fields.
 * - In `'none'` mode it renders nothing.
 *
 * The marking mode and marker characters fall back to
 * {@link NgxSignalFormsConfig}, so by default the legend matches whatever the
 * fields render. Override per instance with the inputs below.
 *
 * ## Accessibility
 *
 * The legend is plain, **visible** text (not `aria-hidden`): unlike the marker
 * glyph it is the explanation, useful to everyone. Required state still reaches
 * assistive tech via each control's `aria-required`, so the legend is
 * supplementary rather than a duplicate announcement. It carries no `role` or
 * live region — it is static guidance, not a status update.
 *
 * ## Usage
 *
 * ```html
 * <form [formRoot]="userForm" ngxSignalForm>
 *   <ngx-form-marking-legend />
 *   <!-- fields… -->
 * </form>
 * ```
 *
 * Outside a form host, pass the tree explicitly:
 *
 * ```html
 * <ngx-form-marking-legend [formField]="userForm" />
 * ```
 */
@Component({
  selector: 'ngx-form-marking-legend',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (resolvedText(); as text) {
      <p class="ngx-form-marking-legend">{{ text }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .ngx-form-marking-legend {
      margin: 0;
      font-size: var(--ngx-form-marking-legend-font-size, 0.875rem);
      color: var(--ngx-form-marking-legend-color, rgba(50, 65, 85, 0.85));
    }
  `,
})
export class NgxFormMarkingLegend {
  readonly #config = inject(NGX_SIGNAL_FORMS_CONFIG);
  readonly #formContext = injectFormContext();

  /**
   * The form tree the legend reflects. Optional — falls back to the ambient
   * form context (`NgxSignalForm` on `form[formRoot]`). When neither is
   * available the legend renders nothing and emits a dev-mode error.
   */
  readonly formField = input<FieldTree<unknown>>();

  /** Override the marking mode. Falls back to config `showMarkerWhen`. */
  readonly showMarkerWhen = input<FieldMarkingMode>();

  /**
   * Override the legend text entirely. `{marker}` is still substituted with the
   * resolved marker for the active mode.
   */
  readonly text = input<string>();

  /** Override the required marker used for `{marker}`. Falls back to config. */
  readonly requiredMarker = input<string>();

  /** Override the optional marker used for `{marker}`. Falls back to config. */
  readonly optionalMarker = input<string>();

  #warnedMissingForm = false;

  readonly #resolvedTree = computed<FieldTree<unknown> | undefined>(() => {
    const explicit = this.formField();
    if (explicit !== undefined) {
      return explicit;
    }

    const fromContext = this.#formContext?.form;
    if (fromContext === undefined && isDevMode() && !this.#warnedMissingForm) {
      this.#warnedMissingForm = true;
      // oxlint-disable-next-line no-console -- dev-mode misconfiguration signal
      console.error(
        '[ngx-signal-forms] NgxFormMarkingLegend: no form tree available. ' +
          'Provide a `[formField]` input or place the legend inside a ' +
          '`form[formRoot][ngxSignalForm]` host. The legend renders nothing ' +
          'until a form tree is resolvable.',
      );
    }

    return fromContext;
  });

  readonly #mode = computed<FieldMarkingMode>(
    () => this.showMarkerWhen() ?? this.#config.showMarkerWhen,
  );

  readonly #optionality = createFieldOptionalitySummary(() =>
    this.#resolvedTree(),
  );

  /**
   * The legend text to render, or `null` when nothing should show (mode is
   * `'none'`, no form tree, or the form has no field of the relevant kind).
   */
  protected readonly resolvedText = computed<string | null>(() => {
    const mode = this.#mode();
    if (mode === 'none' || this.#resolvedTree() === undefined) {
      return null;
    }

    if (mode === 'required') {
      if (!this.#optionality.hasRequired()) {
        return null;
      }
      return this.#substitute(
        this.text() ?? this.#config.requiredLegendText,
        this.requiredMarker() ?? this.#config.requiredMarker,
      );
    }

    // mode === 'optional'
    if (!this.#optionality.hasOptional()) {
      return null;
    }
    return this.#substitute(
      this.text() ?? this.#config.optionalLegendText,
      this.optionalMarker() ?? this.#config.optionalMarker,
    );
  });

  #substitute(template: string, marker: string): string {
    return template.replaceAll('{marker}', marker.trim());
  }
}
