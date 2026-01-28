// Primary entry point
// Re-export core items for convenient imports:
// - @ngx-signal-forms/toolkit (primary)
// - @ngx-signal-forms/toolkit/core (secondary, optional)

// ng-packagr allows relative imports between entry points within the same package
// eslint-disable-next-line @nx/enforce-module-boundaries
export * from './core';
