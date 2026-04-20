import { Routes } from '@angular/router';
import { getRouteTitle } from '@ngx-signal-forms/demo-shared';

/**
 * Demo Application Routes
 *
 * Organized into sections showing progression from onboarding to advanced:
 * 1. Getting Started - Toolkit onboarding and setup best practices
 * 2. Toolkit Core - Error strategy and warning behavior
 * 3. Headless - Renderless primitives and utilities for custom UI systems
 * 4. Form Field Wrapper - Complex forms and custom control integration
 * 5. Advanced Scenarios - Configuration, submission patterns, and advanced validation
 */

export const appRoutes: Routes = [
  // Default redirect to onboarding example
  {
    path: '',
    redirectTo: 'getting-started/your-first-form',
    pathMatch: 'full',
  },

  // ========================================
  // GETTING STARTED
  // ========================================
  {
    path: 'getting-started',
    children: [
      { path: '', redirectTo: 'your-first-form', pathMatch: 'full' },
      {
        path: 'your-first-form',
        loadComponent: () =>
          import('./01-getting-started/your-first-form/your-first-form.page').then(
            (m) => m.YourFirstFormPageComponent,
          ),
        title: getRouteTitle('/getting-started/your-first-form'),
      },
    ],
  },

  // ========================================
  // TOOLKIT CORE FEATURES
  // ========================================
  {
    path: 'toolkit-core',
    children: [
      { path: '', redirectTo: 'error-display-modes', pathMatch: 'full' },
      {
        path: 'error-display-modes',
        loadComponent: () =>
          import('./02-toolkit-core/error-display-modes/error-display-modes.page').then(
            (m) => m.ErrorDisplayModesPageComponent,
          ),
        title: getRouteTitle('/toolkit-core/error-display-modes'),
      },
      {
        path: 'warning-support',
        loadComponent: () =>
          import('./02-toolkit-core/warning-support/warning-support.page').then(
            (m) => m.WarningsSupportPageComponent,
          ),
        title: getRouteTitle('/toolkit-core/warning-support'),
      },
    ],
  },

  // ========================================
  // HEADLESS
  // ========================================
  {
    path: 'headless',
    children: [
      { path: '', redirectTo: 'fieldset-utilities', pathMatch: 'full' },
      {
        path: 'fieldset-utilities',
        loadComponent: () =>
          import('./03-headless/fieldset-utilities/fieldset-utilities.page').then(
            (m) => m.HeadlessFieldsetUtilitiesPageComponent,
          ),
        title: getRouteTitle('/headless/fieldset-utilities'),
      },
    ],
  },

  // ========================================
  // FORM FIELD WRAPPER
  // ========================================
  {
    path: 'form-field-wrapper',
    children: [
      { path: '', redirectTo: 'complex-forms', pathMatch: 'full' },
      {
        path: 'complex-forms',
        loadComponent: () =>
          import('./04-form-field-wrapper/complex-forms/complex-forms.page').then(
            (m) => m.ComplexFormsPage,
          ),
        title: getRouteTitle('/form-field-wrapper/complex-forms'),
      },
      {
        path: 'custom-controls',
        loadComponent: () =>
          import('./04-form-field-wrapper/custom-controls/custom-controls.page').then(
            (m) => m.CustomControlsPage,
          ),
        title: getRouteTitle('/form-field-wrapper/custom-controls'),
      },
      {
        path: 'labelless-fields',
        loadComponent: () =>
          import('./04-form-field-wrapper/labelless-fields/labelless-fields.page').then(
            (m) => m.LabellessFieldsPage,
          ),
        title: getRouteTitle('/form-field-wrapper/labelless-fields'),
      },
    ],
  },

  // ========================================
  // ADVANCED SCENARIOS
  // ========================================
  {
    path: 'advanced-scenarios',
    children: [
      { path: '', redirectTo: 'global-configuration', pathMatch: 'full' },
      {
        path: 'global-configuration',
        loadComponent: () =>
          import('./05-advanced/global-configuration/global-configuration.page').then(
            (m) => m.GlobalConfigurationPage,
          ),
        title: getRouteTitle('/advanced-scenarios/global-configuration'),
      },
      {
        path: 'submission-patterns',
        loadComponent: () =>
          import('./05-advanced/submission-patterns/submission-patterns.page').then(
            (m) => m.SubmissionPatternsPage,
          ),
        title: getRouteTitle('/advanced-scenarios/submission-patterns'),
      },
      {
        path: 'advanced-wizard',
        loadComponent: () =>
          import('./05-advanced/advanced-wizard/advanced-wizard.page'),
        title: getRouteTitle('/advanced-scenarios/advanced-wizard'),
      },
      {
        path: 'async-validation',
        loadComponent: () =>
          import('./05-advanced/async-validation/async-validation.page').then(
            (m) => m.AsyncValidationPageComponent,
          ),
        title: getRouteTitle('/advanced-scenarios/async-validation'),
      },
      {
        path: 'cross-field-validation',
        loadComponent: () =>
          import('./05-advanced/cross-field-validation/cross-field-validation.page').then(
            (m) => m.CrossFieldValidationPageComponent,
          ),
        title: getRouteTitle('/advanced-scenarios/cross-field-validation'),
      },
      {
        path: 'vest-validation',
        loadComponent: () =>
          import('./05-advanced/vest-validation/vest-validation.page').then(
            (m) => m.VestValidationPage,
          ),
        title: getRouteTitle('/advanced-scenarios/vest-validation'),
      },
      {
        path: 'zod-vest-validation',
        loadComponent: () =>
          import('./05-advanced/zod-vest-validation/zod-vest-validation.page').then(
            (m) => m.ZodVestValidationPage,
          ),
        title: getRouteTitle('/advanced-scenarios/zod-vest-validation'),
      },
    ],
  },

  // Fallback route
  { path: '**', redirectTo: 'getting-started/your-first-form' },
];
