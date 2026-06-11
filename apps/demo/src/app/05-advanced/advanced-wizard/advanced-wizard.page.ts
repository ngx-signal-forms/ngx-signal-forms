import { Component, computed, signal } from '@angular/core';
import { type FormFieldAppearance } from '@ngx-signal-forms/toolkit';

import {
  AppearanceToggleComponent,
  DisplayControlsCardComponent,
  ExampleCardsComponent,
  NgxPageControlsDirective,
  OrientationToggleComponent,
  PageHeaderComponent,
} from '../../ui';
import { APPEARANCE_LABELS } from '../../ui/appearance-toggle';
import {
  createOrientationSelection,
  getOrientationLabel,
} from '../../ui/orientation-toggle';

import { ADVANCED_WIZARD_CONTENT } from './advanced-wizard.content';
import { WizardContainerComponent } from './components/wizard-container';

@Component({
  selector: 'ngx-advanced-wizard-page',

  imports: [
    WizardContainerComponent,
    AppearanceToggleComponent,
    OrientationToggleComponent,
    DisplayControlsCardComponent,
    ExampleCardsComponent,
    NgxPageControlsDirective,
    PageHeaderComponent,
  ],
  template: `
    <ng-template ngxPageControls>
      <ngx-display-controls-card
        title="Cross-step wrapper controls"
        description="Carry one wrapper treatment across multiple steps to confirm that toolkit field presentation stays consistent even when the form is split across a wizard flow."
        [chips]="currentControlChips()"
      >
        <div display-controls-primary class="grid gap-4">
          <ngx-appearance-toggle [(value)]="selectedAppearance" />
          <ngx-orientation-toggle
            [(value)]="selectedOrientation"
            [appearance]="selectedAppearance()"
          />
        </div>
      </ngx-display-controls-card>
    </ng-template>

    <ngx-page-header
      title="Travel Booking Wizard (@ngrx/signals + Zod)"
      subtitle="Multi-step booking wizard with @ngrx/signals state management and Zod-driven validation"
    />

    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <ngx-wizard-container
        [appearance]="selectedAppearance()"
        [orientation]="selectedOrientation()"
      />

      <footer class="page-footer mt-8 border-t pt-4">
        <details class="text-sm text-gray-500">
          <summary class="cursor-pointer hover:text-gray-700">
            Technical Details
          </summary>
          <ul class="mt-2 space-y-1 pl-4">
            <li>Form-per-step architecture with separate .form.ts files</li>
            <li>NgRx Signal Store with feature composition</li>
            <li>Zod schemas for type-safe validation</li>
            <li>Cross-field validation (passport expiry vs departure date)</li>
            <li>Auto-save with rxMethod debouncing</li>
            <li>Angular 21.1 lifecycle patterns (effect, DestroyRef)</li>
          </ul>
        </details>
      </footer>
    </ngx-example-cards>
  `,
})
export default class AdvancedWizardPage {
  protected readonly selectedAppearance =
    signal<FormFieldAppearance>('outline');
  protected readonly selectedOrientation = createOrientationSelection(
    this.selectedAppearance,
  );
  protected readonly demonstratedContent = ADVANCED_WIZARD_CONTENT.demonstrated;
  protected readonly learningContent = ADVANCED_WIZARD_CONTENT.learning;

  protected readonly currentControlChips = computed(() => [
    {
      label: 'Appearance',
      value: APPEARANCE_LABELS[this.selectedAppearance()],
    },
    {
      label: 'Orientation',
      value: getOrientationLabel(this.selectedOrientation()),
    },
  ]);
}
