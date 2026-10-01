import { describe, expect, it } from 'vitest';
import { shouldShowErrors } from './error-strategies';

describe('shouldShowErrors', () => {
  // Columns: strategy, invalid, touched, submittedStatus, expected.
  it.each([
    ['immediate', true, false, 'unsubmitted', true],
    ['immediate', false, true, 'submitted', false],
    ['on-touch', true, true, 'unsubmitted', true],
    ['on-touch', true, false, 'unsubmitted', false],
    ['on-touch', true, false, 'submitted', false],
    ['on-submit', true, false, 'submitted', true],
    ['on-submit', true, false, 'submitting', true],
    ['on-submit', true, true, 'unsubmitted', false],
    ['on-submit', false, false, 'submitted', false],
  ] as const)(
    'evaluates %s (invalid=%s, touched=%s, status=%s) as %s',
    (strategy, isInvalid, isTouched, status, expected) => {
      expect(shouldShowErrors(isInvalid, isTouched, strategy, status)).toBe(
        expected,
      );
    },
  );
});
