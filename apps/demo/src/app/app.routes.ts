import { Routes } from '@angular/router';

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
          import('./01-getting-started/your-first-form/your-first-form.page').then(
            (m) => m.YourFirstFormPageComponent,
          ),
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
          import('./02-toolkit-core/accessibility-comparison/accessibility-comparison.page').then(
            (m) => m.AccessibilityComparisonPageComponent,
          ),
        title: 'Accessibility Comparison - Manual vs Toolkit',
      },
      {
        path: 'error-display-modes',
        loadComponent: () =>
          import('./02-toolkit-core/error-display-modes/error-display-modes.page').then(
            (m) => m.ErrorDisplayModesPageComponent,
          ),
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
        title: 'Headless Error State - Custom UI with Signals',
      },
      {
        path: 'fieldset-utilities',
        loadComponent: () =>
          import('./03-headless/fieldset-utilities/fieldset-utilities.page').then(
            (m) => m.HeadlessFieldsetUtilitiesPageComponent,
          ),
        title: 'Headless Fieldset + Utilities - Grouped State',
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
        title: 'Basic Usage - Form Field Wrapper',
      },
      {
        path: 'complex-forms',
        loadComponent: () =>
          import('./04-form-field-wrapper/complex-forms/complex-forms.page').then(
            (m) => m.ComplexFormsPage,
          ),
        title: 'Complex Forms - Nested Objects & Arrays',
      },
      {
        path: 'fieldset',
        loadComponent: () =>
          import('./04-form-field-wrapper/fieldset/fieldset.page').then(
            (m) => m.FieldsetPage,
          ),
        title: 'Fieldset - Aggregated Errors for Grouped Fields',
      },
      {
        path: 'outline-form-field',
        loadComponent: () =>
          import('./04-form-field-wrapper/outline-form-field/outline-form-field.page').then(
            (m) => m.OutlineFormFieldPage,
          ),
        title: 'Outline Form Field - Default Outlined Styling',
      },
      {
        path: 'dynamic-appearance',
        loadComponent: () =>
          import('./04-form-field-wrapper/dynamic-appearance/dynamic-appearance.page').then(
            (m) => m.DynamicAppearancePageComponent,
          ),
        title: 'Dynamic Appearance - Runtime Switching',
      },
      {
        path: 'custom-controls',
        loadComponent: () =>
          import('./04-form-field-wrapper/custom-controls/custom-controls.page').then(
            (m) => m.CustomControlsPage,
          ),
        title: 'Custom Controls - FormValueControl Integration',
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
        title: 'Global Configuration - Toolkit Defaults',
      },
      {
        path: 'submission-patterns',
        loadComponent: () =>
          import('./05-advanced/submission-patterns/submission-patterns.page').then(
            (m) => m.SubmissionPatternsPage,
          ),
        title: 'Submission Patterns - Async & Server Errors',
      },
      {
        path: 'error-messages',
        loadComponent: () =>
          import('./05-advanced/error-messages/error-messages.page').then(
            (m) => m.ErrorMessagesPage,
          ),
        title: 'Error Messages - 3-Tier Priority & i18n',
      },
      {
        path: 'dynamic-list',
        loadComponent: () =>
          import('./05-advanced/dynamic-list/dynamic-list.page').then(
            (m) => m.DynamicListPageComponent,
          ),
        title: 'Dynamic Lists - Form Arrays',
      },
      {
        path: 'nested-groups',
        loadComponent: () =>
          import('./05-advanced/nested-groups/nested-groups.page').then(
            (m) => m.NestedGroupsPageComponent,
          ),
        title: 'Nested Groups - Complex Data Structures',
      },
      {
        path: 'async-validation',
        loadComponent: () =>
          import('./05-advanced/async-validation/async-validation.page').then(
            (m) => m.AsyncValidationPageComponent,
          ),
        title: 'Async Validation - Server Side Checks',
      },
      {
        path: 'stepper-form',
        loadComponent: () =>
          import('./05-advanced/stepper-form/stepper-form.page').then(
            (m) => m.StepperFormPageComponent,
          ),
        title: 'Stepper Form - Multi-step Wizard',
      },
      {
        path: 'advanced-wizard',
        loadComponent: () =>
          import('./05-advanced/advanced-wizard/advanced-wizard.page'),
        title: 'Advanced Wizard - NgRx Signal Store + Zod',
      },
      {
        path: 'cross-field-validation',
        loadComponent: () =>
          import('./05-advanced/cross-field-validation/cross-field-validation.page').then(
            (m) => m.CrossFieldValidationPageComponent,
          ),
        title: 'Cross-Field Validation - Dependent Fields',
      },
    ],
  },

  // Fallback route
  { path: '**', redirectTo: 'signal-forms-only/pure-signal-form' },
];
