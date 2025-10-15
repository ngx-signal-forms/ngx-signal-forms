import { Routes } from '@angular/router';

/**
 * Demo Application Routes
 *
 * Organized into sections showing progression from vanilla to advanced:
 * 0. Signal Forms Only - Baseline without toolkit (manual ARIA)
 * 1. Getting Started - Comprehensive introduction to Signal Forms + Toolkit
 * 2. Toolkit Core - Core toolkit features (auto-ARIA, errors, warnings, field states)
 * 3. Form Field Wrapper - Advanced layout automation (coming soon)
 * 4. Advanced - Global config, submission patterns, server errors (coming soon)
 */

export const appRoutes: Routes = [
  // Default redirect to baseline example
  {
    path: '',
    redirectTo: 'signal-forms-only/pure-signal-form',
    pathMatch: 'full',
  },

  // Legacy redirect (minimal-form merged into basic-validation)
  {
    path: 'fundamentals/minimal-form',
    redirectTo: 'getting-started/basic-validation',
    pathMatch: 'full',
  },

  // Legacy redirect (accessibility-showcase renamed to accessibility-comparison)
  {
    path: 'toolkit/accessibility-showcase',
    redirectTo: 'toolkit-core/accessibility-comparison',
    pathMatch: 'full',
  },

  // Legacy redirect (form-field-showcase moved to form-field-wrapper/basic-usage)
  {
    path: 'toolkit/form-field-showcase',
    redirectTo: 'form-field-wrapper/basic-usage',
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
          import(
            './00-signal-forms-only/pure-signal-form/pure-signal-form.page'
          ).then((m) => m.PureSignalFormPageComponent),
        title: 'Pure Signal Forms - No Toolkit (Baseline)',
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
          import(
            './01-getting-started/your-first-form/your-first-form.page'
          ).then((m) => m.YourFirstFormPageComponent),
        title: 'Your First Form - Getting Started with Toolkit',
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
          import(
            './02-toolkit-core/accessibility-comparison/accessibility-comparison.page'
          ).then((m) => m.AccessibilityComparisonPageComponent),
        title: 'Accessibility Comparison - Manual vs Toolkit',
      },
      {
        path: 'error-display-modes',
        loadComponent: () =>
          import(
            './02-toolkit-core/error-display-modes/error-display-modes.page'
          ).then((m) => m.ErrorDisplayModesPageComponent),
        title: 'Error Display Strategies - Progressive Disclosure',
      },
      {
        path: 'warning-support',
        loadComponent: () =>
          import('./02-toolkit-core/warning-support/warning-support.page').then(
            (m) => m.WarningsSupportPageComponent,
          ),
        title: 'Warning Support - Non-Blocking Validation',
      },
      {
        path: 'field-states',
        loadComponent: () =>
          import('./02-toolkit-core/field-states/field-states.page').then(
            (m) => m.FieldStatesPage,
          ),
        title: 'Field States - dirty, touched, invalid',
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
          import('./03-form-field-wrapper/basic-usage/basic-usage.page').then(
            (m) => m.BasicUsagePage,
          ),
        title: 'Basic Usage - Form Field Wrapper',
      },
      {
        path: 'complex-forms',
        loadComponent: () =>
          import(
            './03-form-field-wrapper/complex-forms/complex-forms.page'
          ).then((m) => m.ComplexFormsPage),
        title: 'Complex Forms - Nested Objects & Arrays',
      },
    ],
  },

  // ========================================
  // ADVANCED
  // ========================================
  {
    path: 'advanced',
    children: [
      { path: '', redirectTo: 'global-configuration', pathMatch: 'full' },
      {
        path: 'global-configuration',
        loadComponent: () =>
          import(
            './04-advanced/global-configuration/global-configuration.page'
          ).then((m) => m.GlobalConfigurationPage),
        title: 'Global Configuration - Toolkit Defaults',
      },
      {
        path: 'submission-patterns',
        loadComponent: () =>
          import(
            './04-advanced/submission-patterns/submission-patterns.page'
          ).then((m) => m.SubmissionPatternsPage),
        title: 'Submission Patterns - Async & Server Errors',
      },
    ],
  },

  // Fallback route
  { path: '**', redirectTo: 'signal-forms-only/pure-signal-form' },
];
