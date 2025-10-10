// Primary entry point
// For most use cases, import from secondary entry points:
// - @ngx-signal-forms/toolkit/core - Core directives, utilities, and providers
// - @ngx-signal-forms/toolkit/form-field - Form field wrapper component
// - @ngx-signal-forms/toolkit/testing - Testing utilities

// Re-export commonly used items for convenience
export { provideNgxSignalFormsConfig } from './core/providers/config.provider';
export type { NgxSignalFormsConfig } from './core/types';
