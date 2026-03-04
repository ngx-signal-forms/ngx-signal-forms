import { Routes } from '@angular/router';
import { getRouteTitle } from '@ngx-signal-forms/demo-shared';

/**
 * Demo Application Routes
 *
 * Organized into sections showing progression from vanilla to advanced:
 * 0. Signal Forms Only - Baseline without toolkit (manual ARIA)
 * 1. Getting Started - Comprehensive introduction to Signal Forms + Toolkit
 * 2. Toolkit Core - Core toolkit features (auto-ARIA, errors, warnings, field states)
 * 3. Headless - Renderless primitives for custom design systems
 * 4. Form Field Wrapper - Pre-built UI components with automatic error display
 * 5. Advanced Scenarios - Global config, submission patterns, complex forms
 */

export const appRoutes: Routes = [
  // Default redirect to baseline example
  {
    path: '',
    redirectTo: 'signal-forms-only/pure-signal-form',
    pathMatch: 'full',
  },

  // ========================================
  // SIGNAL FORMS ONLY (NO TOOLKIT)
  // ========================================
  {
    path: 'signal-forms-only',
    children: [
      { path: '', redirectTo: 'pure-signal-form', pathMatch: 'full' },
      {
        path: 'pure-signal-form',
        loadComponent: () =>
          import('./00-signal-forms-only/pure-signal-form/pure-signal-form.page').then(
            (m) => m.PureSignalFormPageComponent,
          ),
        title: getRouteTitle('/signal-forms-only/pure-signal-form'),
      },
    ],
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
      { path: '', redirectTo: 'accessibility-comparison', pathMatch: 'full' },
      {
        path: 'accessibility-comparison',
        loadComponent: () =>
          import('./02-toolkit-core/accessibility-comparison/accessibility-comparison.page').then(
            (m) => m.AccessibilityComparisonPageComponent,
          ),
        title: getRouteTitle('/toolkit-core/accessibility-comparison'),
      },
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
      {
        path: 'field-states',
        loadComponent: () =>
          import('./02-toolkit-core/field-states/field-states.page').then(
            (m) => m.FieldStatesPage,
          ),
        title: getRouteTitle('/toolkit-core/field-states'),
      },
    ],
  },

  // ========================================
  // HEADLESS
  // ========================================
  {
    path: 'headless',
    children: [
      { path: '', redirectTo: 'error-state', pathMatch: 'full' },
      {
        path: 'error-state',
        loadComponent: () =>
          import('./03-headless/error-state/error-state.page').then(
            (m) => m.HeadlessErrorStatePageComponent,
          ),
        title: getRouteTitle('/headless/error-state'),
      },
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
      { path: '', redirectTo: 'basic-usage', pathMatch: 'full' },
      {
        path: 'basic-usage',
        loadComponent: () =>
          import('./04-form-field-wrapper/basic-usage/basic-usage.page').then(
            (m) => m.BasicUsagePage,
          ),
        title: getRouteTitle('/form-field-wrapper/basic-usage'),
      },
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
        path: 'error-messages',
        loadComponent: () =>
          import('./05-advanced/error-messages/error-messages.page').then(
            (m) => m.ErrorMessagesPage,
          ),
        title: getRouteTitle('/advanced-scenarios/error-messages'),
      },
      {
        path: 'advanced-wizard',
        loadComponent: () =>
          import('./05-advanced/advanced-wizard/advanced-wizard.page'),
        title: getRouteTitle('/advanced-scenarios/advanced-wizard'),
      },
      {
        path: 'dynamic-list',
        redirectTo: '/form-field-wrapper/complex-forms',
        pathMatch: 'full',
      },
      {
        path: 'nested-groups',
        redirectTo: '/form-field-wrapper/complex-forms',
        pathMatch: 'full',
      },
      {
        path: 'stepper-form',
        redirectTo: 'advanced-wizard',
        pathMatch: 'full',
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
    ],
  },

  // Fallback route
  { path: '**', redirectTo: 'signal-forms-only/pure-signal-form' },
];
