import { ErrorDetails, ErrorHandler, Injectable } from '@angular/core';

/**
 * Logs render errors that an `@boundary` block caught.
 *
 * Angular calls `onViewError` instead of `handleError` for those errors, so
 * without this override a caught error would leave no trace in the console.
 * `handleError` keeps the default behaviour for every other error.
 */
@Injectable()
export class DemoErrorHandler extends ErrorHandler {
  override onViewError(error: Error, details: ErrorDetails): void {
    console.error(
      `Render error in ${details.declarationType.name}, caught by the @boundary in ${details.boundary?.type.name ?? 'an unknown component'}:`,
      error,
    );
  }
}
