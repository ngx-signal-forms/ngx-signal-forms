import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  form,
  FormField,
  submit,
  type FieldTree,
} from '@angular/forms/signals';

import {
  type FormFieldAppearance,
  type FormFieldOrientation,
  focusFirstInvalid,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

import {
  type WizardCanNavigate,
  WizardComponent,
  WizardStepDirective,
} from '../../shared/wizard';

import {
  BASE_SHIPPING_COST,
  EXPRESS_SHIPPING_SURCHARGE,
  INITIAL_SINGLE_MODEL_WIZARD_VALUE,
  SINGLE_MODEL_WIZARD_STEP_COUNT,
  type SingleModelWizardStepId,
  type SingleModelWizardValue,
} from './single-model-wizard.model';
import { singleModelWizardSchema } from './single-model-wizard.validations';

/**
 * Single-model wizard: one `form()` spans every step, and each step's
 * template binds only its own slice (`wizardForm.account…`,
 * `wizardForm.shipping…`). Contrast with `advanced-wizard`, which gives
 * every step its own `form()` fed by a shared store — see this feature's
 * README for when each shape earns its keep.
 *
 * Uses the shared `ngx-wizard`'s built-in navigation (Previous/Next/Submit),
 * driven by the `canNavigate` guard below. The guard reuses the same
 * `#validateStep` helper for both the progress-header clicks and the
 * built-in Next button, so both paths enforce the identical per-step
 * validation rule.
 */
@Component({
  selector: 'ngx-single-model-wizard',
  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormField,
    WizardComponent,
    WizardStepDirective,
  ],
  templateUrl: './single-model-wizard.form.html',
  styleUrl: './single-model-wizard.form.scss',
})
export class SingleModelWizardComponent {
  readonly appearance = input<FormFieldAppearance>('outline');
  readonly orientation = input<FormFieldOrientation>('vertical');

  readonly #model = signal<SingleModelWizardValue>(
    INITIAL_SINGLE_MODEL_WIZARD_VALUE,
  );

  /** The one `form()` model spanning both editable steps. */
  protected readonly wizardForm = form(this.#model, singleModelWizardSchema);
  /** Surfaced for the page's live form-state debugger. */
  readonly formTree: FieldTree<unknown> = this.wizardForm;

  protected readonly currentStep = signal<SingleModelWizardStepId>('account');
  protected readonly stepCount = SINGLE_MODEL_WIZARD_STEP_COUNT;
  protected readonly expressShippingSurcharge = EXPRESS_SHIPPING_SURCHARGE;

  protected readonly orderConfirmed = signal(false);
  protected readonly submitAttempted = signal(false);

  /**
   * Live cross-step value: the order total reacts to step 2's checkbox
   * immediately, everywhere it's read (the review step below, or the
   * status row) — no store round-trip or step-commit needed, because it's
   * all one model.
   */
  protected readonly orderTotal = computed(() => {
    const expressShipping = this.wizardForm.shipping.expressShipping().value();
    return expressShipping
      ? BASE_SHIPPING_COST + EXPRESS_SHIPPING_SURCHARGE
      : BASE_SHIPPING_COST;
  });

  /**
   * Steps whose subtree is currently valid — drives the progress header,
   * including `ngx-wizard`'s progress bar
   * (`completedSteps.length / steps.length`). Review has no fields of its
   * own to validate — reaching it already required Account and Shipping to
   * be valid, per `#validateStep` — so it's treated as completed once it's
   * the active step, letting the progress bar reach 100% on step 3 of 3
   * instead of maxing out at 2/3.
   */
  protected readonly completedSteps = computed(() => {
    const steps: SingleModelWizardStepId[] = [];
    if (!this.wizardForm.account().invalid()) steps.push('account');
    if (!this.wizardForm.shipping().invalid()) steps.push('shipping');
    if (this.currentStep() === 'review') steps.push('review');
    return steps;
  });

  /**
   * Tracks pending focus request for the active step heading. Set when
   * `currentStep` changes, cleared once `afterRenderEffect` applies focus.
   */
  readonly #pendingFocus = signal(false);
  #previousStepId: SingleModelWizardStepId | null = null;

  protected readonly stepHeadingRef =
    viewChild<ElementRef<HTMLHeadingElement>>('stepHeading');

  // Named Angular effect fields are intentionally unread — Angular manages
  // their lifecycle. Mirrors the pattern in advanced-wizard's
  // wizard-container.ts.
  // oxlint-disable-next-line no-unused-private-class-members -- EffectRef is intentionally kept as a named field to document the side effect.
  readonly #trackStepChangeEffect = effect(() => {
    const step = this.currentStep();
    if (this.#previousStepId !== null && this.#previousStepId !== step) {
      this.#pendingFocus.set(true);
    }
    this.#previousStepId = step;
  });

  // oxlint-disable-next-line no-unused-private-class-members -- EffectRef is intentionally kept as a named field to document the side effect.
  readonly #focusHeadingEffect = afterRenderEffect(() => {
    const heading = this.stepHeadingRef();
    if (this.#pendingFocus() && heading) {
      heading.nativeElement.focus();
      this.#pendingFocus.set(false);
    }
  });

  /**
   * Gates every forward transition — both progress-header clicks and the
   * shared wizard's built-in Next button — bound as `[canNavigate]` on
   * `<ngx-wizard>`. Per docs/FAQ.md's single-model-wizard answer, it
   * validates the subtree of the step being LEFT, not the one being
   * entered, and only ever runs for forward moves.
   */
  protected readonly guardStep: WizardCanNavigate = (event) => {
    if (event.toIndex <= event.fromIndex) {
      return true; // always allow going back
    }
    return this.#validateStep(event.fromStep);
  };

  /**
   * Marks the given step's subtree touched (cascades to every descendant
   * field) and reports whether it's valid, focusing the first invalid
   * field when it isn't. Used by the `canNavigate` guard above, which the
   * shared wizard's built-in Next button and progress-header clicks both
   * go through.
   */
  #validateStep(stepId: string): boolean {
    const stepField = this.#stepField(stepId);
    if (!stepField) {
      return true;
    }

    stepField().markAsTouched();
    if (stepField().invalid()) {
      focusFirstInvalid(stepField);
      return false;
    }

    return true;
  }

  #stepField(stepId: string): FieldTree<unknown> | null {
    switch (stepId as SingleModelWizardStepId) {
      case 'account':
        return this.wizardForm.account;
      case 'shipping':
        return this.wizardForm.shipping;
      default:
        return null;
    }
  }

  /**
   * Final step: whole-form `submit()`. It marks every field touched, runs
   * every validator (including the cross-step one), and only runs the
   * action if the whole model — not just the current slice — is valid.
   *
   * In THIS demo's current wiring, per-subtree gating (`#validateStep`,
   * above) means every forward transition already re-validates the step
   * being left, so reaching Review/Confirm with an invalid Account or
   * Shipping subtree is unreachable through the UI (pinned by the
   * "per-subtree gating makes reaching Confirm … unreachable" e2e test).
   * `submit()`'s own validation is a safety net for that state anyway —
   * defense in depth against a future gating change, not dead code.
   *
   * Known UX nit if that safety net ever DOES trigger: `focusFirstInvalid`
   * walks the whole form's error summary, but Account/Shipping's fields
   * live inside the wizard's lazily-rendered `ng-template` steps (only
   * Review is in the DOM here) — so it has no bound control to focus on
   * those steps and silently no-ops for them. The `review-error` alert
   * below is the only feedback in that case. A "jump to the first invalid
   * step, then focus" helper would close this gap; not built here since
   * the state it addresses isn't currently reachable.
   */
  protected async confirmOrder(): Promise<void> {
    this.submitAttempted.set(true);

    const succeeded = await submit(this.wizardForm, async () => {
      await new Promise<void>((resolve) => setTimeout(resolve, 600));
      this.orderConfirmed.set(true);
    });

    if (!succeeded) {
      focusFirstInvalid(this.wizardForm);
    }
  }

  protected startNewOrder(): void {
    this.#model.set(INITIAL_SINGLE_MODEL_WIZARD_VALUE);
    this.orderConfirmed.set(false);
    this.submitAttempted.set(false);
    this.currentStep.set('account');
    this.#previousStepId = null;
  }
}
