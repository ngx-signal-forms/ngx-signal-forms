import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import {
  type ResolvedErrorDisplayStrategy,
  type FormFieldAppearance,
} from '@ngx-signal-forms/toolkit';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/debugger';
import {
  AppearanceToggleComponent,
  DisplayControlsCardComponent,
  DisplayControlsSectionComponent,
  ExampleCardsComponent,
  NgxPageControlsDirective,
  OrientationToggleComponent,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';
import { getAppearanceLabel } from '../../ui/appearance-toggle';
import {
  createOrientationSelection,
  getOrientationLabel,
} from '../../ui/orientation-toggle';
import {
  ERROR_DISPLAY_MODE_LABELS,
  ErrorDisplayModeSelectorComponent,
} from '../../ui/error-display-mode-selector/error-display-mode-selector';
import { ZOD_VEST_VALIDATION_CONTENT } from './zod-vest-validation.content';
import { ZodVestValidationComponent } from './zod-vest-validation.form';

@Component({
  selector: 'ngx-zod-vest-validation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,

  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  imports: [
    ZodVestValidationComponent,
    ExampleCardsComponent,
    ErrorDisplayModeSelectorComponent,
    AppearanceToggleComponent,
    OrientationToggleComponent,
    DisplayControlsCardComponent,
    DisplayControlsSectionComponent,
    NgxPageControlsDirective,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
  ],
  template: `
    <ng-template ngxPageControls>
      <ngx-display-controls-card
        title="Layered validation visibility"
        description="Use the same form to compare structural errors and business-policy errors while changing only the display timing and wrapper appearance."
        [chips]="currentControlChips()"
        layout="split"
      >
        <ngx-error-display-mode-selector
          [(selectedMode)]="errorDisplayMode"
          [embedded]="true"
          display-controls-primary
          class="block min-w-0"
        />
        <ngx-display-controls-section
          title="🎨 Layer framing"
          description="Switch the wrapper appearance to confirm that both Zod and Vest messages remain readable without special per-validator rendering logic."
        >
          <ngx-appearance-toggle [(value)]="selectedAppearance" />
        </ngx-display-controls-section>
        <ngx-display-controls-section
          title="↔️ Label orientation"
          description="Use a horizontal label column for the non-outline states to compare how structural and business-policy errors scan in denser layouts."
        >
          <ngx-orientation-toggle
            [(value)]="selectedOrientation"
            [appearance]="selectedAppearance()"
          />
        </ngx-display-controls-section>
      </ngx-display-controls-card>
    </ng-template>

    <ngx-page-header
      title="Zod + Vest Validation"
      subtitle="Structural contract checks from Zod, business policy from Vest"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    >
      <ngx-split-layout>
        <ngx-zod-vest-validation
          [errorDisplayMode]="errorDisplayMode()"
          [appearance]="selectedAppearance()"
          [orientation]="selectedOrientation()"
          left
        />

        @if (formRef(); as form) {
          <div right>
            <ngx-signal-form-debugger [formTree]="form.accountForm" />
          </div>
        }
      </ngx-split-layout>
    </ngx-example-cards>

    <section
      class="rounded-xl border border-indigo-200 bg-indigo-50 p-5 text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-100"
      aria-label="Zod baseline versus layered validation comparison"
    >
      <h3 class="text-base font-semibold">Delta from the Zod-only baseline</h3>
      <p class="mt-2 text-sm">
        Use this panel as a quick diff: the baseline route stays structural,
        while this route adds policy and advisory guidance.
      </p>

      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <article
          class="rounded-lg border border-emerald-200 bg-emerald-50/90 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40"
        >
          <h4 class="font-medium">Zod-only baseline keeps</h4>
          <ul class="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>Required, format, enum, and length checks</li>
            <li>Typed contract from one schema</li>
            <li>No business-policy branching layer</li>
          </ul>
          <a
            href="/validation/zod-validation"
            class="mt-3 inline-flex text-sm font-medium underline underline-offset-4"
            >Open Zod-Only Validation</a
          >
        </article>

        <article
          class="rounded-lg border border-fuchsia-200 bg-fuchsia-50/90 p-4 dark:border-fuchsia-900/60 dark:bg-fuchsia-950/40"
        >
          <h4 class="font-medium">This layered route adds</h4>
          <ul class="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>Vest business-policy rules on top of Zod</li>
            <li>Non-blocking <code>warn()</code> advisories</li>
            <li>Shared rendering for structural + policy feedback</li>
          </ul>
          <a
            href="/validation/vest-validation"
            class="mt-3 inline-flex text-sm font-medium underline underline-offset-4"
            >Open Vest-Only Validation</a
          >
        </article>
      </div>
    </section>
  `,
})
export class ZodVestValidationPage {
  protected readonly errorDisplayMode =
    signal<ResolvedErrorDisplayStrategy>('on-touch');
  protected readonly selectedAppearance =
    signal<FormFieldAppearance>('outline');
  protected readonly selectedOrientation = createOrientationSelection(
    this.selectedAppearance,
  );

  protected readonly currentControlChips = computed(() => [
    {
      label: 'Mode',
      value: ERROR_DISPLAY_MODE_LABELS[this.errorDisplayMode()],
    },
    {
      label: 'Appearance',
      value: getAppearanceLabel(this.selectedAppearance()),
    },
    {
      label: 'Orientation',
      value: getOrientationLabel(this.selectedOrientation()),
    },
  ]);
  protected readonly content = ZOD_VEST_VALIDATION_CONTENT;
  protected readonly formRef = viewChild(ZodVestValidationComponent);
}
