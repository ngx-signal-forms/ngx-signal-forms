import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  signal,
} from '@angular/core';
import {
  type FormFieldAppearance,
  type FormFieldOrientation,
} from '@ngx-signal-forms/toolkit';

import {
  AppearanceToggleComponent,
  DisplayControlsCardComponent,
  ExampleCardsComponent,
  OrientationToggleComponent,
} from '../../ui';
import { APPEARANCE_LABELS } from '../../ui/appearance-toggle';
import {
  getOrientationLabel,
  isOrientationDisabledForAppearance,
} from '../../ui/orientation-toggle';

import { ADVANCED_WIZARD_CONTENT } from './advanced-wizard.content';
import { WizardContainerComponent } from './components/wizard-container';

@Component({
  selector: 'ngx-advanced-wizard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    WizardContainerComponent,
    AppearanceToggleComponent,
    OrientationToggleComponent,
    DisplayControlsCardComponent,
    ExampleCardsComponent,
  ],
  template: `
    <div class="page-container">
      <header class="page-header mb-8">
        <h1 class="text-2xl font-bold">
          Travel Booking Wizard (@ngrx/signals + Zod)
        </h1>
        <p class="mt-2 text-gray-600">
          Plan your trip with our multi-step booking wizard. This demo showcases
          Angular 21 Signal Forms with @ngrx/signals state management and
          Zod-driven validation.
        </p>
      </header>

      <ngx-example-cards
        [demonstrated]="demonstratedContent"
        [learning]="learningContent"
      >
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
              <li>
                Cross-field validation (passport expiry vs departure date)
              </li>
              <li>Auto-save with rxMethod debouncing</li>
              <li>Angular 21.1 lifecycle patterns (effect, DestroyRef)</li>
            </ul>
          </details>
        </footer>
      </ngx-example-cards>
    </div>
  `,
  styles: `
    .page-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }
  `,
})
export default class AdvancedWizardPage {
  protected readonly selectedAppearance =
    signal<FormFieldAppearance>('outline');
  protected readonly selectedOrientation =
    signal<FormFieldOrientation>('vertical');
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

  constructor() {
    effect(() => {
      if (
        isOrientationDisabledForAppearance(
          this.selectedAppearance(),
          this.selectedOrientation(),
        )
      ) {
        this.selectedOrientation.set('vertical');
      }
    });
  }
}
