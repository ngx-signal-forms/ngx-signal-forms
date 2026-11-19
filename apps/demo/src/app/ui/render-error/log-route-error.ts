import type { ErrorDetails } from '@angular/core';

/**
 * Logs an error that a router error boundary caught.
 *
 * The router does not send these errors to `ErrorHandler`, so without this
 * `onError` callback of `withErrorBoundaries()` a caught error would leave no
 * trace in the console.
 */
export function logRouteError(error: Error, details?: ErrorDetails): void {
  console.error(
    `Error in ${details?.declarationType.name ?? 'a routed component'}, caught by the router error boundary:`,
    error,
  );
}
