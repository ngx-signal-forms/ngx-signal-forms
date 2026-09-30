import { Routes } from '@angular/router';
import { getRouteTitle } from '@ngx-signal-forms/demo-shared';
import { WizardStore } from './stores/wizard.store';

/**
 * Lazy route config for the advanced wizard.
 *
 * `app.routes.ts` loads this file with `loadChildren`, so `WizardStore` and its
 * dependencies stay out of the main bundle. The store is provided on the route
 * below, so `withAutoCleanupInjectors()` destroys it (and its debounced
 * autosave) when the user leaves the wizard.
 */
export default [
  {
    path: '',
    providers: [WizardStore],
    loadComponent: () => import('./advanced-wizard.page'),
    title: getRouteTitle('/advanced-scenarios/advanced-wizard'),
  },
] satisfies Routes;
