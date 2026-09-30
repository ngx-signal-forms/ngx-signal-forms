import { signal } from '@angular/core';
import { describe, expect, it } from 'vitest';
import type {
  ResolvedErrorDisplayStrategy,
  ResolvedWarningDisplayStrategy,
  SubmittedStatus,
} from '../types';
import type { NgxSignalFormContext } from '../directives/ngx-signal-form';
import {
  resolveStrategyFromContext,
  resolveSubmittedStatusFromContext,
  resolveWarningStrategyFromContext,
} from './resolve-strategy';

function createMockFormContext(
  overrides: Partial<{
    errorStrategy: ResolvedErrorDisplayStrategy | undefined;
    warningStrategy: ResolvedWarningDisplayStrategy | undefined;
    submittedStatus: SubmittedStatus | undefined;
  }> = {},
): NgxSignalFormContext {
  return {
    form: (() => ({})) as NgxSignalFormContext['form'],
    errorStrategy: signal(overrides.errorStrategy),
    warningStrategy: signal(overrides.warningStrategy),
    submittedStatus: signal(overrides.submittedStatus),
  } as unknown as NgxSignalFormContext;
}

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

  it('should prefer the form context over the config default', () => {
    const context = createMockFormContext({ errorStrategy: 'on-submit' });
    expect(resolveStrategyFromContext(undefined, context, 'immediate')).toBe(
      'on-submit',
    );
  });

  it('should fall through to config default when context has no error strategy', () => {
    const context = createMockFormContext({ errorStrategy: undefined });
    expect(resolveStrategyFromContext('inherit', context, 'immediate')).toBe(
      'immediate',
    );
  });

  it('should return on-touch when every tier is null', () => {
    expect(resolveStrategyFromContext(undefined, undefined, null)).toBe(
      'on-touch',
    );
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

describe('resolveWarningStrategyFromContext', () => {
  it('should prefer explicit input strategy', () => {
    const context = createMockFormContext({ warningStrategy: 'on-submit' });
    expect(resolveWarningStrategyFromContext('immediate', context)).toBe(
      'immediate',
    );
  });

  it('should fall back to form context warning strategy', () => {
    const context = createMockFormContext({ warningStrategy: 'on-submit' });
    expect(resolveWarningStrategyFromContext(undefined, context)).toBe(
      'on-submit',
    );
  });

  it('should fall back to config default when no context', () => {
    expect(
      resolveWarningStrategyFromContext(undefined, undefined, 'immediate'),
    ).toBe('immediate');
  });

  it('should return on-touch when nothing is provided', () => {
    expect(resolveWarningStrategyFromContext(undefined, undefined)).toBe(
      'on-touch',
    );
  });

  it('should ignore the error strategy on the form context', () => {
    // Warnings follow their own cascade (ADR-0007), separate from errors.
    const context = createMockFormContext({ errorStrategy: 'on-submit' });
    expect(resolveWarningStrategyFromContext(undefined, context)).toBe(
      'on-touch',
    );
  });

  it('should handle inherit input by falling through to context', () => {
    const context = createMockFormContext({ warningStrategy: 'on-submit' });
    expect(resolveWarningStrategyFromContext('inherit', context)).toBe(
      'on-submit',
    );
  });

  it('should fall through to config default when context has no warning strategy', () => {
    const context = createMockFormContext({ warningStrategy: undefined });
    expect(
      resolveWarningStrategyFromContext(undefined, context, 'on-submit'),
    ).toBe('on-submit');
  });
});
