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
  zodValidation: '/validation/zod-validation',
  vestValidation: '/validation/vest-validation',
  zodVestValidation: '/validation/zod-vest-validation',
  globalConfiguration: '/advanced-scenarios/global-configuration',
  submissionPatterns: '/advanced-scenarios/submission-patterns',
  advancedWizard: '/advanced-scenarios/advanced-wizard',
  asyncValidation: '/advanced-scenarios/async-validation',
  fieldStatePatterns: '/advanced-scenarios/field-state-patterns',
  crossFieldValidation: '/advanced-scenarios/cross-field-validation',
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
        hasControls: true,
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
        hasControls: true,
      },
      {
        path: '/toolkit-core/warning-support',
        label: 'Warning Support',
        hasControls: true,
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
        hasControls: true,
      },
      {
        path: '/headless/error-message-signal',
        label: 'Error Message Signal',
        hasControls: false,
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
        hasControls: true,
      },
      {
        path: '/form-field-wrapper/fieldset-appearance',
        label: 'Fieldset Appearance',
        hasControls: false,
      },
      {
        path: '/form-field-wrapper/custom-controls',
        label: 'Custom Controls',
        hasControls: true,
      },
      {
        path: '/form-field-wrapper/labelless-fields',
        label: 'Labelless Fields',
        hasControls: true,
      },
      {
        path: '/form-field-wrapper/field-marking',
        label: 'Required / Optional Marking',
        hasControls: true,
      },
    ],
  },
  {
    id: 'validation',
    label: 'Validation',
    pattern: /^\/validation\//,
    links: [
      {
        path: '/validation/zod-validation',
        label: 'Zod-Only Validation',
        hasControls: true,
      },
      {
        path: '/validation/vest-validation',
        label: 'Vest-Only Validation',
        hasControls: true,
      },
      {
        path: '/validation/zod-vest-validation',
        label: 'Zod + Vest Validation',
        hasControls: true,
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
        hasControls: true,
      },
      {
        path: '/advanced-scenarios/submission-patterns',
        label: 'Submission Patterns',
        hasControls: true,
      },
      {
        path: '/advanced-scenarios/advanced-wizard',
        label: 'Advanced Wizard (@ngrx/signals + Zod)',
        hasControls: true,
      },
      {
        path: '/advanced-scenarios/async-validation',
        label: 'Async Validation',
        hasControls: true,
      },
      {
        path: '/advanced-scenarios/field-state-patterns',
        label: 'Field State Patterns',
        hasControls: true,
      },
      {
        path: '/advanced-scenarios/cross-field-validation',
        label: 'Cross-Field Validation',
        hasControls: true,
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
