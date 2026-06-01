import type {
  NgValidationError,
  ValidationError,
} from '@angular/forms/signals';
import type { ErrorMessageRegistry } from '../providers/error-messages.provider';

interface ResolveErrorMessageOptions {
  readonly stripWarningPrefix?: boolean;
}

/**
 * Compile-time exhaustive lookup of Angular's built-in validation error kinds.
 *
 * Typing this as `Record<NgValidationError['kind'], true>` forces the table to
 * stay in sync with the framework: when an Angular minor adds a new
 * `NgValidationError` member, this object stops compiling until the new kind is
 * added (paired with the `assertNever` guard in `describeBuiltInError`).
 */
const BUILT_IN_ERROR_KIND_LOOKUP: Record<NgValidationError['kind'], true> = {
  required: true,
  email: true,
  min: true,
  max: true,
  minDate: true,
  maxDate: true,
  minLength: true,
  maxLength: true,
  pattern: true,
  parse: true,
  standardSchema: true,
};

/**
 * Structural narrowing gate for built-in validation errors.
 *
 * Matches on the public `kind` discriminant rather than
 * `instanceof NgValidationError`. Angular brands its error classes with a
 * private field, so an `instanceof` check fails whenever an error crosses a
 * realm boundary — duplicated `@angular/forms` copies in a monorepo or a
 * module-federation host. Matching on `kind` survives those boundaries and also
 * recognizes the plain error objects that custom validators emit.
 */
function isBuiltInError(error: ValidationError): error is NgValidationError {
  return Object.hasOwn(BUILT_IN_ERROR_KIND_LOOKUP, error.kind);
}

function formatDate(value: Date): string {
  return value instanceof Date && !Number.isNaN(value.getTime())
    ? value.toLocaleDateString()
    : String(value);
}

function assertNever(error: never): never {
  throw new Error(
    `Unhandled built-in validation error kind: ${JSON.stringify(error)}`,
  );
}

function describeBuiltInError(error: NgValidationError): string {
  switch (error.kind) {
    case 'required':
      return 'This field is required';
    case 'email':
      return 'Please enter a valid email address';
    case 'minLength':
      return `Minimum ${error.minLength} characters required`;
    case 'maxLength':
      return `Maximum ${error.maxLength} characters allowed`;
    case 'min':
      return `Minimum value is ${error.min}`;
    case 'max':
      return `Maximum value is ${error.max}`;
    case 'minDate':
      return `Date must be on or after ${formatDate(error.minDate)}`;
    case 'maxDate':
      return `Date must be on or before ${formatDate(error.maxDate)}`;
    case 'pattern':
      return 'Invalid format';
    case 'parse':
      return 'Invalid value';
    case 'standardSchema':
      return error.issue.message || 'Invalid value';
    default:
      // Compile-time guarantee: a new NgValidationError member breaks the build
      // here until a dedicated case is added above.
      return assertNever(error);
  }
}

function humanizeCustomKind(
  kind: string,
  options?: ResolveErrorMessageOptions,
): string {
  const normalizedKind = options?.stripWarningPrefix
    ? kind.replace(/^warn:/u, '')
    : kind;
  return normalizedKind.replaceAll('_', ' ');
}

export function resolveValidationErrorMessage(
  error: ValidationError,
  registry?: Readonly<ErrorMessageRegistry> | null,
  options?: ResolveErrorMessageOptions,
): string {
  // Nullish-only check: an explicit empty-string validator message suppresses
  // further tiers (registry and default), consistent with the cascading
  // resolver contract. The previous truthy check `if (error.message)` would
  // silently fall through for `message: ''`, discarding the validator's intent.
  // eslint-disable-next-line eqeqeq -- intentional: single check accepts both null and undefined
  if (error.message != null) {
    return error.message;
  }

  if (registry) {
    const registryMessage = registry[error.kind];
    if (registryMessage !== undefined) {
      return typeof registryMessage === 'function'
        ? registryMessage(error)
        : registryMessage;
    }
  }

  return getDefaultValidationMessage(error, options);
}

export function getDefaultValidationMessage(
  error: ValidationError,
  options?: ResolveErrorMessageOptions,
): string {
  return isBuiltInError(error)
    ? describeBuiltInError(error)
    : humanizeCustomKind(error.kind, options);
}
