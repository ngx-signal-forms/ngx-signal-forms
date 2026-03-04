import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import type {
  ErrorDisplayStrategy,
  FormFieldAppearance,
} from '@ngx-signal-forms/toolkit';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/toolkit/debugger';
import {
  AppearanceToggleComponent,
  ExampleCardsComponent,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';
import { ErrorDisplayModeSelectorComponent } from '../../ui/error-display-mode-selector/error-display-mode-selector.component';
import { COMPLEX_FORMS_CONTENT } from './complex-forms.content';
import { ComplexFormsComponent } from './complex-forms.form';
import { FieldsetFormComponent } from './fieldset.form';

/**
 * Complex Forms Page
 *
 * Demonstrates NgxFormField with:
 * - Nested object validation (personalInfo, addressInfo)
 * - Dynamic arrays (skills, contacts)
 * - Add/remove array items
 * - Maximum code reduction (67% less boilerplate)
 *
 * Shows progression from manual implementation (Phase 1) to
 * maximum automation with form field wrapper.
 */
@Component({
  selector: 'ngx-complex-forms-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
  `,
  imports: [
    ErrorDisplayModeSelectorComponent,
    ExampleCardsComponent,
    PageHeaderComponent,
    ComplexFormsComponent,
    FieldsetFormComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
    AppearanceToggleComponent,
  ],
  template: `
    <ngx-page-header
      title="Complex Forms with Form Field Wrapper"
      subtitle="Nested objects, dynamic arrays, and maximum code reduction with NgxFormField"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    />

    <div class="flex flex-wrap items-start gap-6">
      <!-- Error Display Mode Selector -->
      <ngx-error-display-mode-selector
        [(selectedMode)]="errorDisplayMode"
        class="min-w-[300px] flex-1"
      />

      <!-- Appearance Selector -->
      <div class="flex flex-col gap-2">
        <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">
          🎨 Appearance
        </span>
        <ngx-appearance-toggle [(value)]="selectedAppearance" />
      </div>
    </div>

    <ngx-split-layout>
      <div left class="flex flex-col gap-12">
        <section>
          <h2 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">Nested & Arrays</h2>
          <ngx-complex-forms
            #complexFormRef
            [errorDisplayMode]="errorDisplayMode()"
            [appearance]="selectedAppearance()"
          />
        </section>

        <hr class="border-gray-200 dark:border-gray-800" />

        <section>
          <h2 class="mb-4 text-xl font-bold text-gray-900 dark:text-white">Fieldset Grouping</h2>
          <ngx-fieldset-form
            #fieldsetFormRef
            [errorDisplayMode]="errorDisplayMode()"
            [appearance]="selectedAppearance()"
          />
        </section>
      </div>

      <div right class="flex flex-col gap-8">
        @if (complexFormRef) {
          <div>
            <h3 class="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">Complex Form State</h3>
            <ngx-signal-form-debugger [formTree]="complexFormRef.complexForm" />
          </div>
        }
        @if (fieldsetFormRef) {
          <div>
            <h3 class="mb-2 text-sm font-semibold text-gray-500 uppercase tracking-wider">Fieldset Form State</h3>
            <ngx-signal-form-debugger [formTree]="fieldsetFormRef.fieldsetForm" />
          </div>
        }
      </div>
    </ngx-split-layout>
  `,
})
export class ComplexFormsPage {
  protected readonly errorDisplayMode =
    signal<ErrorDisplayStrategy>('on-touch');
  protected readonly selectedAppearance =
    signal<FormFieldAppearance>('standard');

  protected readonly content = COMPLEX_FORMS_CONTENT;
  protected readonly complexFormRef = viewChild<ComplexFormsComponent>('complexFormRef');
  protected readonly fieldsetFormRef = viewChild<FieldsetFormComponent>('fieldsetFormRef');
}
