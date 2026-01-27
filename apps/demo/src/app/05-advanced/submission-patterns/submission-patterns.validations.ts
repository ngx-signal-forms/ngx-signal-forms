import {
  minLength,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import type { SubmissionModel } from './submission-patterns.model';

/**
 * Validation schema for submission patterns example
 */
export const submissionSchema = schema<SubmissionModel>((path) => {
  // Username validation
  required(path.username, { message: 'Username is required' });
  minLength(path.username, 3, {
    message: 'Username must be at least 3 characters',
  });
  validate(path.username, (ctx) => {
    const value = ctx.value();
    if (value && !/^[a-zA-Z0-9_]+$/.test(value)) {
      return {
        kind: 'invalid-username',
        message: 'Username can only contain letters, numbers, and underscores',
      };
    }
    return null;
  });

  // Password validation
  required(path.password, { message: 'Password is required' });
  minLength(path.password, 8, {
    message: 'Password must be at least 8 characters',
  });

  // Confirm password - cross-field validation
  required(path.confirmPassword, { message: 'Please confirm your password' });
  validate(path, (ctx) => {
    const { password, confirmPassword } = ctx.value();
    if (password && confirmPassword && password !== confirmPassword) {
      return {
        kind: 'password-mismatch',
        message: 'Passwords do not match',
      };
    }
    return null;
  });
});
