import type { ValidationError } from '@angular/forms/signals';
import type { ErrorMessageRegistry } from '../providers/error-messages.provider';

type ValidationErrorParams = ValidationError & Record<string, unknown>;

function getNumericValidationParam(
  params: ValidationErrorParams,
  key: string,
): number {
  const value = params[key];
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsedValue = Number(value);
    if (Number.isFinite(parsedValue)) {
      return parsedValue;
    }
  }

  return 0;
}

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
      return `Minimum ${getNumericValidationParam(errorParams, 'minLength')} characters required`;
    case 'maxLength':
      return `Maximum ${getNumericValidationParam(errorParams, 'maxLength')} characters allowed`;
    case 'min':
      return `Minimum value is ${getNumericValidationParam(errorParams, 'min')}`;
    case 'max':
      return `Maximum value is ${getNumericValidationParam(errorParams, 'max')}`;
    case 'pattern':
      return 'Invalid format';
    case 'parse':
      return 'Invalid value';
    default: {
      const normalizedKind = options?.stripWarningPrefix
        ? kind.replace(/^warn:/, '')
        : kind;
      return normalizedKind.replace(/_/g, ' ');
    }
  }
}
