export const DEMO_PATHS = {
  pureSignalForm: '/signal-forms-only/pure-signal-form',
  yourFirstForm: '/getting-started/your-first-form',
  accessibilityComparison: '/toolkit-core/accessibility-comparison',
  errorDisplayModes: '/toolkit-core/error-display-modes',
  warningSupport: '/toolkit-core/warning-support',
  fieldStates: '/toolkit-core/field-states',
  errorState: '/headless/error-state',
  fieldsetUtilities: '/headless/fieldset-utilities',
  basicUsage: '/form-field-wrapper/basic-usage',
  complexForms: '/form-field-wrapper/complex-forms',
  fieldsetGrouping: '/form-field-wrapper/fieldset-grouping',
  customControls: '/form-field-wrapper/custom-controls',
  globalConfiguration: '/advanced-scenarios/global-configuration',
  submissionPatterns: '/advanced-scenarios/submission-patterns',
  errorMessages: '/advanced-scenarios/error-messages',
  advancedWizard: '/advanced-scenarios/advanced-wizard',
  asyncValidation: '/advanced-scenarios/async-validation',
  crossFieldValidation: '/advanced-scenarios/cross-field-validation',
  vestValidation: '/advanced-scenarios/vest-validation',
  zodVestValidation: '/advanced-scenarios/zod-vest-validation',
} as const;

export const DEMO_CATEGORIES = [
  {
    id: 'signal-forms-only',
    label: 'Signal Forms Only',
    pattern: /^\/signal-forms-only\//,
    links: [
      {
        path: '/signal-forms-only/pure-signal-form',
        label: 'Pure Signal Forms (Baseline)',
      },
    ],
  },
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
        path: '/toolkit-core/accessibility-comparison',
        label: 'Accessibility Comparison',
      },
      {
        path: '/toolkit-core/error-display-modes',
        label: 'Error Display Modes',
      },
      {
        path: '/toolkit-core/warning-support',
        label: 'Warning Support',
      },
      {
        path: '/toolkit-core/field-states',
        label: 'Field States',
      },
    ],
  },
  {
    id: 'headless',
    label: 'Headless',
    pattern: /^\/headless\//,
    links: [
      {
        path: '/headless/error-state',
        label: 'Error State + Character Count',
      },
      {
        path: '/headless/fieldset-utilities',
        label: 'Fieldset + Utilities',
      },
    ],
  },
  {
    id: 'form-field-wrapper',
    label: 'Form Field Wrapper',
    pattern: /^\/form-field-wrapper\//,
    links: [
      {
        path: '/form-field-wrapper/basic-usage',
        label: 'Basic Usage',
      },
      {
        path: '/form-field-wrapper/complex-forms',
        label: 'Complex Forms (Nested + Arrays)',
      },
      {
        path: '/form-field-wrapper/fieldset-grouping',
        label: 'Fieldset Grouping + Errors',
      },
      {
        path: '/form-field-wrapper/custom-controls',
        label: 'Custom Controls',
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
        path: '/advanced-scenarios/error-messages',
        label: 'Error Messages',
      },
      {
        path: '/advanced-scenarios/advanced-wizard',
        label: 'Advanced Wizard (NgRx Signal Store)',
      },
      {
        path: '/advanced-scenarios/async-validation',
        label: 'Async Validation',
      },
      {
        path: '/advanced-scenarios/cross-field-validation',
        label: 'Cross-Field Validation',
      },
      {
        path: '/advanced-scenarios/vest-validation',
        label: 'Vest-Only Validation',
      },
      {
        path: '/advanced-scenarios/zod-vest-validation',
        label: 'Zod + Vest Validation',
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
