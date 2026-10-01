import { describe, expect, it } from 'vitest';
import { shouldShowErrors } from './error-strategies';

describe('shouldShowErrors', () => {
  it.each([
    ['immediate', true, false, true],
    ['immediate', false, false, false],
    ['on-touch', true, true, true],
    ['on-touch', true, false, false],
    ['on-submit', true, false, true],
    ['on-submit', true, false, false],
  ] as const)(
    'evaluates the %s strategy',
    (strategy, isInvalid, isTouched, submitted) => {
      expect(
        shouldShowErrors(
          isInvalid,
          isTouched,
          strategy,
          strategy === 'on-submit' && submitted ? 'submitted' : 'unsubmitted',
        ),
      ).toBe(
        strategy === 'immediate'
          ? isInvalid
          : strategy === 'on-touch'
            ? isInvalid && isTouched
            : isInvalid && submitted,
      );
    },
  );

  it('treats submitting as submitted for on-submit', () => {
    expect(shouldShowErrors(true, false, 'on-submit', 'submitting')).toBe(true);
  });
});
