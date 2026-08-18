import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  inject,
  input,
} from '@angular/core';
import type { FieldTree } from '@angular/forms/signals';
import {
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  NGX_SIGNAL_FORM_HINT_REGISTRY,
  NgxFieldIdentityProvider,
  type NgxSignalFormHintDescriptor,
} from '@ngx-signal-forms/toolkit';
import {
  NgxFormFieldError,
  NgxFormFieldHint,
} from '@ngx-signal-forms/toolkit/assistive';
import { IdentityProbeComponent } from './field-identity.probe';

/**
 * A third-party-style form-field wrapper that **owns its field identity**.
 *
 * The one seam that makes this page different from every other demo:
 *
 * ```ts
 * hostDirectives: [
 *   { directive: NgxFieldIdentityProvider, inputs: ['fieldName'] },
 * ]
 * ```
 *
 * `NgxFieldIdentityProvider` provides `NgxFieldIdentity` on this component's
 * host element and publishes the declared name into it. Content projected
 * into this wrapper resolves that host element injector, so
 * `NgxSignalFormAutoAria` on the bound control reads the declared name
 * instead of falling back to the control's DOM `id`.
 *
 * ## What it publishes, and what it does not
 *
 * The provider publishes the **field-name channel only**. Everything else
 * still resolves the way it does for any wrapper:
 *
 * - **Hint ids** flow through `NGX_SIGNAL_FORM_HINT_REGISTRY`, provided
 *   below from the projected `<ngx-form-field-hint>` children.
 * - **Display timing** flows through
 *   `NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY`. This wrapper never touches
 *   that token: the `<ngx-form-field-error>` it renders registers the
 *   boolean that already gates its own live region, and auto-aria reads it
 *   back from there. That is why no `strategy` is bound here — the error
 *   surface inherits it from the surrounding `[ngxSignalForm]`.
 *
 * Resolution is per channel, so claiming the name leaves the other two
 * seams working untouched (ADR-0010).
 *
 * `fieldName` is declared twice on purpose — once by the host directive and
 * once as the component's own input. Angular feeds one attribute to both, so
 * consumers bind it once and the wrapper can still read it for its template.
 * `NgxFormFieldWrapper` does exactly the same thing.
 */
@Component({
  selector: 'ngx-demo-identity-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    { directive: NgxFieldIdentityProvider, inputs: ['fieldName'] },
  ],
  imports: [NgxFormFieldError, IdentityProbeComponent],
  providers: [
    {
      provide: NGX_SIGNAL_FORM_FIELD_CONTEXT,
      useFactory: () => {
        const wrapper = inject(IdentityFieldComponent);
        return { fieldName: wrapper.resolvedFieldName };
      },
    },
    {
      provide: NGX_SIGNAL_FORM_HINT_REGISTRY,
      useFactory: () => {
        const wrapper = inject(IdentityFieldComponent);
        return { hints: wrapper.hintDescriptors };
      },
    },
  ],
  template: `
    <div class="flex flex-col gap-1.5">
      <ng-content select="label" />

      <ng-content />

      <ng-content select="ngx-form-field-hint" />

      <ngx-form-field-error [formField]="field()" [fieldName]="fieldName()" />

      @if (showProbe()) {
        <ngx-demo-identity-probe [declaredFieldName]="fieldName()" />
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class IdentityFieldComponent {
  /**
   * Named `field`, not `formField`, on purpose. `NgxSignalFormAutoAria` and
   * Angular's own `FormField` both select on `[formField]`, including on
   * non-control elements — so a wrapper that reuses that attribute name has
   * to import `FormField` alongside it just to satisfy auto-aria's
   * `FORM_FIELD` injection on an element that is not a control. Picking a
   * different name keeps both directives off the wrapper host entirely.
   */
  readonly field = input.required<FieldTree<unknown>>();

  /** The field's real name — see the class doc for why it is declared here. */
  readonly fieldName = input.required<string>();

  /** Renders the live attribute readout below the control. */
  readonly showProbe = input(true);

  readonly resolvedFieldName = computed<string | null>(
    () => this.fieldName().trim() || null,
  );

  protected readonly hintChildren = contentChildren(NgxFormFieldHint, {
    descendants: true,
  });

  readonly hintDescriptors = computed<readonly NgxSignalFormHintDescriptor[]>(
    () =>
      this.hintChildren().map((hint) => ({
        id: hint.resolvedId(),
        fieldName: hint.resolvedFieldName(),
      })),
  );
}
