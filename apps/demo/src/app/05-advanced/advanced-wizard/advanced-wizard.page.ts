import { ChangeDetectionStrategy, Component } from '@angular/core';

import { WizardContainerComponent } from './components/wizard-container.component';

@Component({
  selector: 'ngx-advanced-wizard-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WizardContainerComponent],
  template: `
    <div class="page-container">
      <header class="page-header mb-8">
        <h1 class="text-2xl font-bold">Travel Booking Wizard</h1>
        <p class="mt-2 text-gray-600">
          Plan your trip with our multi-step booking wizard. This demo showcases
          Angular 21 Signal Forms with NgRx Signal Store integration.
        </p>
      </header>

      <ngx-wizard-container />

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
export default class AdvancedWizardPage {}
