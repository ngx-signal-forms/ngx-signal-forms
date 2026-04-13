import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import type { ResolvedErrorDisplayStrategy, SubmittedStatus } from '../types';
import type { NgxSignalFormContext } from '../directives/ngx-signal-form.directive';
import {
  resolveErrorDisplayStrategy,
  resolveStrategyFromContext,
  resolveSubmittedStatusFromContext,
} from './resolve-strategy';

function createMockFormContext(
  overrides: Partial<{
    errorStrategy: ResolvedErrorDisplayStrategy;
    submittedStatus: SubmittedStatus;
  }> = {},
): NgxSignalFormContext {
  return {
    form: (() => ({})) as NgxSignalFormContext['form'],
    errorStrategy: signal(overrides.errorStrategy ?? 'on-touch'),
    submittedStatus: signal(overrides.submittedStatus ?? 'unsubmitted'),
  };
}

describe('resolveErrorDisplayStrategy', () => {
  it('should return input strategy when explicitly set', () => {
    expect(
      resolveErrorDisplayStrategy('immediate', 'on-touch', 'on-submit'),
    ).toBe('immediate');
    expect(resolveErrorDisplayStrategy('on-submit', 'on-touch')).toBe(
      'on-submit',
    );
    expect(resolveErrorDisplayStrategy('on-touch')).toBe('on-touch');
  });

  it('should skip inherit and fall through to context', () => {
    expect(resolveErrorDisplayStrategy('inherit', 'on-submit')).toBe(
      'on-submit',
    );
  });

  it('should skip null and fall through to context', () => {
    expect(resolveErrorDisplayStrategy(null, 'immediate')).toBe('immediate');
  });

  it('should skip undefined and fall through to context', () => {
    expect(resolveErrorDisplayStrategy(undefined, 'on-submit')).toBe(
      'on-submit',
    );
  });

  it('should fall through to config default when context is null', () => {
    expect(resolveErrorDisplayStrategy(null, null, 'on-submit')).toBe(
      'on-submit',
    );
  });

  it('should fall through to config default when context is undefined', () => {
    expect(resolveErrorDisplayStrategy(undefined, undefined, 'immediate')).toBe(
      'immediate',
    );
  });

  it('should return on-touch as ultimate fallback', () => {
    expect(resolveErrorDisplayStrategy(undefined, undefined, undefined)).toBe(
      'on-touch',
    );
    expect(resolveErrorDisplayStrategy(null, null, null)).toBe('on-touch');
  });
});

describe('resolveStrategyFromContext', () => {
  it('should prefer explicit input strategy', () => {
    const context = createMockFormContext({ errorStrategy: 'on-submit' });
    expect(resolveStrategyFromContext('immediate', context)).toBe('immediate');
  });

  it('should fall back to form context strategy', () => {
    const context = createMockFormContext({ errorStrategy: 'on-submit' });
    expect(resolveStrategyFromContext(undefined, context)).toBe('on-submit');
  });

  it('should fall back to config default when no context', () => {
    expect(resolveStrategyFromContext(undefined, undefined, 'immediate')).toBe(
      'immediate',
    );
  });

  it('should return on-touch when nothing is provided', () => {
    expect(resolveStrategyFromContext(undefined, undefined)).toBe('on-touch');
  });

  it('should handle inherit input by falling through to context', () => {
    const context = createMockFormContext({ errorStrategy: 'on-submit' });
    expect(resolveStrategyFromContext('inherit', context)).toBe('on-submit');
  });
});

describe('resolveSubmittedStatusFromContext', () => {
  it('should return explicit input status when provided', () => {
    const context = createMockFormContext({ submittedStatus: 'submitted' });
    expect(resolveSubmittedStatusFromContext('unsubmitted', context)).toBe(
      'unsubmitted',
    );
    expect(resolveSubmittedStatusFromContext('submitting', context)).toBe(
      'submitting',
    );
  });

  it('should fall back to context submitted status', () => {
    const context = createMockFormContext({ submittedStatus: 'submitted' });
    expect(resolveSubmittedStatusFromContext(undefined, context)).toBe(
      'submitted',
    );
  });

  it('should return undefined when no input and no context', () => {
    expect(
      resolveSubmittedStatusFromContext(undefined, undefined),
    ).toBeUndefined();
  });
});
