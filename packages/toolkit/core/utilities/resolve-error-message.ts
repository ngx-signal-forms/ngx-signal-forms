import type { ValidationError } from '@angular/forms/signals';
import type { ErrorMessageRegistry } from '../providers/error-messages.provider';

type ValidationErrorParams = ValidationError & Record<string, unknown>;

export function resolveValidationErrorMessage(
  error: ValidationError,
  registry?: ErrorMessageRegistry | null,
  options?: { stripWarningPrefix?: boolean },
): string {
  if (error.message) {
    return error.message;
  }

  if (registry) {
    const registryMessage = registry[error.kind];
    if (registryMessage !== undefined) {
      if (typeof registryMessage === 'function') {
        return registryMessage(error as ValidationErrorParams);
      }

      return registryMessage;
    }
  }

  return getDefaultValidationMessage(error, options);
}

export function getDefaultValidationMessage(
  error: ValidationError,
  options?: { stripWarningPrefix?: boolean },
): string {
  const kind = error.kind;
  const errorParams = error as ValidationErrorParams;

  switch (kind) {
    case 'required':
      return 'This field is required';
    case 'email':
      return 'Please enter a valid email address';
    case 'minLength':
      return `Minimum ${errorParams['minLength'] || 0} characters required`;
    case 'maxLength':
      return `Maximum ${errorParams['maxLength'] || 0} characters allowed`;
    case 'min':
      return `Minimum value is ${errorParams['min'] || 0}`;
    case 'max':
      return `Maximum value is ${errorParams['max'] || 0}`;
    case 'pattern':
      return 'Invalid format';
    default: {
      const normalizedKind = options?.stripWarningPrefix
        ? kind.replace(/^warn:/, '')
        : kind;
      return normalizedKind.replace(/_/g, ' ');
    }
  }
}
