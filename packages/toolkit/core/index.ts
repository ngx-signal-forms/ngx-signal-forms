// Types
export * from './types';

// Tokens
export * from './tokens';

// Providers
export * from './providers/config.provider';

// Directives
export * from './directives/placeholder.directive';
export * from './directives/auto-aria.directive';
export * from './directives/auto-touch.directive';
export {
  NgxSignalFormProviderDirective,
  type NgxSignalFormContext,
} from './directives/form-provider.directive';

// Utilities
export * from './utilities/field-resolution';
export * from './utilities/assert-injector';
export * from './utilities/inject-form-config';
export * from './utilities/inject-form-context';
export * from './utilities/inject-field-control';
export * from './utilities/error-strategies';
export * from './utilities/show-errors';
export * from './utilities/warning-error';

// Components
export * from './components/form-error.component';

// Future exports:
// export * from './directives/form-busy.directive';
