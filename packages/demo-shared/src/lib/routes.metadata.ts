export const DEMO_PATHS = {
  yourFirstForm: '/getting-started/your-first-form',
  errorDisplayModes: '/toolkit-core/error-display-modes',
  warningSupport: '/toolkit-core/warning-support',
  fieldsetUtilities: '/headless/fieldset-utilities',
  errorMessageSignal: '/headless/error-message-signal',
  complexForms: '/form-field-wrapper/complex-forms',
  fieldsetAppearance: '/form-field-wrapper/fieldset-appearance',
  customControls: '/form-field-wrapper/custom-controls',
  labellessFields: '/form-field-wrapper/labelless-fields',
  fieldMarking: '/form-field-wrapper/field-marking',
  globalConfiguration: '/advanced-scenarios/global-configuration',
  submissionPatterns: '/advanced-scenarios/submission-patterns',
  advancedWizard: '/advanced-scenarios/advanced-wizard',
  asyncValidation: '/advanced-scenarios/async-validation',
  fieldStatePatterns: '/advanced-scenarios/field-state-patterns',
  crossFieldValidation: '/advanced-scenarios/cross-field-validation',
  zodValidation: '/advanced-scenarios/zod-validation',
  vestValidation: '/advanced-scenarios/vest-validation',
  zodVestValidation: '/advanced-scenarios/zod-vest-validation',
  storeBinding: '/advanced-scenarios/store-binding',
} as const;

export const DEMO_CATEGORIES = [
  {
    id: 'getting-started',
    label: 'Getting Started',
    pattern: /^\/getting-started\//,
    links: [
      {
        path: '/getting-started/your-first-form',
        label: 'Your First Form',
      },
    ],
  },
  {
    id: 'toolkit-core',
    label: 'Toolkit Core',
    pattern: /^\/toolkit-core\//,
    links: [
      {
        path: '/toolkit-core/error-display-modes',
        label: 'Error Display Modes',
      },
      {
        path: '/toolkit-core/warning-support',
        label: 'Warning Support',
      },
    ],
  },
  {
    id: 'headless',
    label: 'Headless',
    pattern: /^\/headless\//,
    links: [
      {
        path: '/headless/fieldset-utilities',
        label: 'Fieldset + Utilities',
      },
      {
        path: '/headless/error-message-signal',
        label: 'Error Message Signal',
      },
    ],
  },
  {
    id: 'form-field-wrapper',
    label: 'Form Field Wrapper',
    pattern: /^\/form-field-wrapper\//,
    links: [
      {
        path: '/form-field-wrapper/complex-forms',
        label: 'Complex Forms (Nested + Arrays)',
      },
      {
        path: '/form-field-wrapper/fieldset-appearance',
        label: 'Fieldset Appearance',
      },
      {
        path: '/form-field-wrapper/custom-controls',
        label: 'Custom Controls',
      },
      {
        path: '/form-field-wrapper/labelless-fields',
        label: 'Labelless Fields',
      },
      {
        path: '/form-field-wrapper/field-marking',
        label: 'Required / Optional Marking',
      },
    ],
  },
  {
    id: 'advanced-scenarios',
    label: 'Advanced Scenarios',
    pattern: /^\/advanced-scenarios\//,
    links: [
      {
        path: '/advanced-scenarios/global-configuration',
        label: 'Global Configuration',
      },
      {
        path: '/advanced-scenarios/submission-patterns',
        label: 'Submission Patterns',
      },
      {
        path: '/advanced-scenarios/advanced-wizard',
        label: 'Advanced Wizard (@ngrx/signals + Zod)',
      },
      {
        path: '/advanced-scenarios/async-validation',
        label: 'Async Validation',
      },
      {
        path: '/advanced-scenarios/field-state-patterns',
        label: 'Field State Patterns',
      },
      {
        path: '/advanced-scenarios/cross-field-validation',
        label: 'Cross-Field Validation',
      },
      {
        path: '/advanced-scenarios/zod-validation',
        label: 'Zod-Only Validation',
      },
      {
        path: '/advanced-scenarios/vest-validation',
        label: 'Vest-Only Validation',
      },
      {
        path: '/advanced-scenarios/zod-vest-validation',
        label: 'Zod + Vest Validation',
      },
      {
        path: '/advanced-scenarios/store-binding',
        label: 'Store Binding (@ngrx/signals two-way)',
      },
    ],
  },
] as const;

export function getRouteTitle(path: string): string {
  for (const category of DEMO_CATEGORIES) {
    const link = category.links.find((l) => l.path === path);
    if (link) return link.label;
  }
  return 'NgxSignalForms Toolkit';
}
