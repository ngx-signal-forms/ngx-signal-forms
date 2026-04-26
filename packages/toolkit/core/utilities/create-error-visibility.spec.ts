import { Injector, runInInjectionContext, signal } from '@angular/core';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import type { NgxSignalFormContext } from '../directives/ngx-signal-form';
import { NGX_SIGNAL_FORM_CONTEXT } from '../tokens';
import type {
  ErrorDisplayStrategy,
  ResolvedErrorDisplayStrategy,
  SubmittedStatus,
} from '../types';
import { createErrorVisibility } from './create-error-visibility';
import { createShowErrorsComputed, showErrors } from './show-errors';
import {
  resolveStrategyFromContext,
  resolveSubmittedStatusFromContext,
} from './resolve-strategy';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockFieldState(invalid = false, touched = false) {
  return signal({
    invalid: signal(invalid),
    touched: signal(touched),
  });
}

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

function injectorWithContext(context: NgxSignalFormContext): Injector {
  return Injector.create({
    providers: [{ provide: NGX_SIGNAL_FORM_CONTEXT, useValue: context }],
  });
}

function injectorWithoutContext(): Injector {
  return Injector.create({ providers: [] });
}

// ---------------------------------------------------------------------------
// Behavioral parity matrix
// ---------------------------------------------------------------------------

/**
 * Verify that createErrorVisibility produces the same result as manually
 * composing the four building blocks for every (strategy, touched, invalid,
 * submittedStatus) combination.
 */
describe('createErrorVisibility – behavioral parity matrix', () => {
  type MatrixRow = {
    strategy: ErrorDisplayStrategy;
    touched: boolean;
    invalid: boolean;
    submittedStatus: SubmittedStatus;
  };

  const matrix: MatrixRow[] = [
    // immediate: visible whenever invalid, regardless of touch/submit
    {
      strategy: 'immediate',
      touched: false,
      invalid: false,
      submittedStatus: 'unsubmitted',
    },
    {
      strategy: 'immediate',
      touched: false,
      invalid: true,
      submittedStatus: 'unsubmitted',
    },
    {
      strategy: 'immediate',
      touched: true,
      invalid: false,
      submittedStatus: 'unsubmitted',
    },
    {
      strategy: 'immediate',
      touched: true,
      invalid: true,
      submittedStatus: 'unsubmitted',
    },
    {
      strategy: 'immediate',
      touched: false,
      invalid: true,
      submittedStatus: 'submitted',
    },
    // on-touch: visible when invalid AND touched
    {
      strategy: 'on-touch',
      touched: false,
      invalid: false,
      submittedStatus: 'unsubmitted',
    },
    {
      strategy: 'on-touch',
      touched: false,
      invalid: true,
      submittedStatus: 'unsubmitted',
    },
    {
      strategy: 'on-touch',
      touched: true,
      invalid: false,
      submittedStatus: 'unsubmitted',
    },
    {
      strategy: 'on-touch',
      touched: true,
      invalid: true,
      submittedStatus: 'unsubmitted',
    },
    {
      strategy: 'on-touch',
      touched: true,
      invalid: true,
      submittedStatus: 'submitted',
    },
    // on-submit: visible when invalid AND submittedStatus === 'submitted'
    {
      strategy: 'on-submit',
      touched: false,
      invalid: false,
      submittedStatus: 'submitted',
    },
    {
      strategy: 'on-submit',
      touched: false,
      invalid: true,
      submittedStatus: 'unsubmitted',
    },
    {
      strategy: 'on-submit',
      touched: false,
      invalid: true,
      submittedStatus: 'submitting',
    },
    {
      strategy: 'on-submit',
      touched: false,
      invalid: true,
      submittedStatus: 'submitted',
    },
    {
      strategy: 'on-submit',
      touched: true,
      invalid: true,
      submittedStatus: 'submitted',
    },
    // inherit: falls back to on-touch when no context
    {
      strategy: 'inherit',
      touched: false,
      invalid: true,
      submittedStatus: 'unsubmitted',
    },
    {
      strategy: 'inherit',
      touched: true,
      invalid: true,
      submittedStatus: 'unsubmitted',
    },
  ];

  for (const row of matrix) {
    const label =
      `strategy=${row.strategy} touched=${row.touched} ` +
      `invalid=${row.invalid} status=${row.submittedStatus}`;

    it(`[${label}] matches manual composition`, () => {
      const injector = injectorWithoutContext();
      const fieldState = createMockFieldState(row.invalid, row.touched);
      const statusSignal = signal<SubmittedStatus>(row.submittedStatus);

      const manualResult = runInInjectionContext(injector, () =>
        showErrors(fieldState, row.strategy, statusSignal),
      );

      const factoryResult = runInInjectionContext(injector, () =>
        createErrorVisibility(fieldState, {
          strategy: row.strategy,
          submittedStatus: statusSignal,
        }),
      );

      expect(factoryResult()).toBe(manualResult());
    });
  }
});

// ---------------------------------------------------------------------------
// DI context cascade integration
// ---------------------------------------------------------------------------

describe('createErrorVisibility – DI context cascade', () => {
  it('reads strategy from injected form context when no explicit strategy is given', () => {
    const context = createMockFormContext({ errorStrategy: 'immediate' });
    const injector = injectorWithContext(context);
    const fieldState = createMockFieldState(true, false); // invalid, not touched

    const result = runInInjectionContext(injector, () =>
      createErrorVisibility(fieldState),
    );

    // 'immediate' → show even when not touched
    expect(result()).toBe(true);
  });

  it('reads submittedStatus from injected form context when no explicit status is given', () => {
    const submittedStatusSignal = signal<SubmittedStatus>('unsubmitted');
    const context: NgxSignalFormContext = {
      form: (() => ({})) as NgxSignalFormContext['form'],
      errorStrategy: signal('on-submit'),
      submittedStatus: submittedStatusSignal,
    };
    const injector = injectorWithContext(context);
    const fieldState = createMockFieldState(true, false);

    const result = runInInjectionContext(injector, () =>
      createErrorVisibility(fieldState),
    );

    // on-submit + unsubmitted → hidden
    expect(result()).toBe(false);

    submittedStatusSignal.set('submitted');
    // on-submit + submitted → visible
    expect(result()).toBe(true);
  });

  it('explicit strategy overrides form context strategy', () => {
    const context = createMockFormContext({ errorStrategy: 'on-submit' });
    const injector = injectorWithContext(context);
    const fieldState = createMockFieldState(true, false);

    const result = runInInjectionContext(injector, () =>
      createErrorVisibility(fieldState, { strategy: 'immediate' }),
    );

    // 'immediate' wins over context 'on-submit'
    expect(result()).toBe(true);
  });

  it('explicit submittedStatus overrides form context submittedStatus', () => {
    const context = createMockFormContext({
      errorStrategy: 'on-submit',
      submittedStatus: 'submitted',
    });
    const injector = injectorWithContext(context);
    const fieldState = createMockFieldState(true, false);
    const explicitStatus = signal<SubmittedStatus>('unsubmitted');

    const result = runInInjectionContext(injector, () =>
      createErrorVisibility(fieldState, { submittedStatus: explicitStatus }),
    );

    // explicit 'unsubmitted' wins over context 'submitted'
    expect(result()).toBe(false);
  });

  it('falls back to on-touch when no context and no explicit strategy', () => {
    const injector = injectorWithoutContext();
    const fieldState = createMockFieldState(true, false); // invalid, not touched

    const result = runInInjectionContext(injector, () =>
      createErrorVisibility(fieldState),
    );

    // on-touch (default) → hidden when not touched
    expect(result()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Reactive opts (signal strategy / signal submittedStatus)
// ---------------------------------------------------------------------------

describe('createErrorVisibility – reactive opts', () => {
  it('reacts to a signal strategy changing', () => {
    const injector = injectorWithoutContext();
    const fieldState = createMockFieldState(true, false); // invalid, not touched
    const strategy = signal<ErrorDisplayStrategy>('on-touch');

    const result = runInInjectionContext(injector, () =>
      createErrorVisibility(fieldState, { strategy }),
    );

    // on-touch + not touched → hidden
    expect(result()).toBe(false);

    strategy.set('immediate');
    // immediate → visible when invalid
    expect(result()).toBe(true);
  });

  it('reacts to a signal submittedStatus changing', () => {
    const injector = injectorWithoutContext();
    const fieldState = createMockFieldState(true, false);
    const statusSignal = signal<SubmittedStatus>('unsubmitted');

    const result = runInInjectionContext(injector, () =>
      createErrorVisibility(fieldState, {
        strategy: 'on-submit',
        submittedStatus: statusSignal,
      }),
    );

    expect(result()).toBe(false);

    statusSignal.set('submitted');
    expect(result()).toBe(true);
  });

  it('reacts to field state changing', () => {
    const injector = injectorWithoutContext();
    const invalid = signal(false);
    const touched = signal(false);
    const fieldState = signal({ invalid, touched });

    const result = runInInjectionContext(injector, () =>
      createErrorVisibility(fieldState, { strategy: 'on-touch' }),
    );

    expect(result()).toBe(false);

    invalid.set(true);
    touched.set(true);
    expect(result()).toBe(true);

    touched.set(false);
    expect(result()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Standalone via explicit injector opt
// ---------------------------------------------------------------------------

describe('createErrorVisibility – standalone via injector opt', () => {
  it('works when injector is passed explicitly (outside DI context)', () => {
    const injector = injectorWithoutContext();
    const fieldState = createMockFieldState(true, true);

    // Called outside any injection context but with explicit injector
    const result = createErrorVisibility(fieldState, {
      strategy: 'on-touch',
      injector,
    });

    expect(result()).toBe(true);
  });

  it('throws when called outside injection context without injector', () => {
    const fieldState = createMockFieldState(true, true);

    expect(() => createErrorVisibility(fieldState)).toThrow(
      /createErrorVisibility\(\) can only be used within an injection context/i,
    );
  });
});

// ---------------------------------------------------------------------------
// on-submit dev-mode warning parity
// ---------------------------------------------------------------------------

describe('createErrorVisibility – on-submit missing status warning', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('emits a dev-mode console.warn when on-submit has no submittedStatus', () => {
    const injector = injectorWithoutContext();
    const fieldState = createMockFieldState(true, true);

    const result = runInInjectionContext(injector, () =>
      createErrorVisibility(fieldState, { strategy: 'on-submit' }),
    );

    result();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain('on-submit');
  });

  it('does not warn when submittedStatus is provided', () => {
    const injector = injectorWithoutContext();
    const fieldState = createMockFieldState(true, true);
    const statusSignal = signal<SubmittedStatus>('unsubmitted');

    const result = runInInjectionContext(injector, () =>
      createErrorVisibility(fieldState, {
        strategy: 'on-submit',
        submittedStatus: statusSignal,
      }),
    );

    result();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('does not warn when context provides submittedStatus', () => {
    const context = createMockFormContext({
      errorStrategy: 'on-submit',
      submittedStatus: 'unsubmitted',
    });
    const injector = injectorWithContext(context);
    const fieldState = createMockFieldState(true, true);

    const result = runInInjectionContext(injector, () =>
      createErrorVisibility(fieldState),
    );

    result();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Parity with manual composition (cross-check)
// ---------------------------------------------------------------------------

describe('createErrorVisibility – parity with manual composition', () => {
  it('produces identical boolean to manually composing the four building blocks', () => {
    const context = createMockFormContext({
      errorStrategy: 'on-touch',
      submittedStatus: 'unsubmitted',
    });
    const injector = injectorWithContext(context);
    const fieldState = createMockFieldState(true, true);

    const manualResult = runInInjectionContext(injector, () => {
      const resolvedStrategy = resolveStrategyFromContext(undefined, context);
      const resolvedStatus = resolveSubmittedStatusFromContext(
        undefined,
        context,
      );
      return createShowErrorsComputed(
        fieldState,
        resolvedStrategy,
        resolvedStatus,
      );
    });

    const factoryResult = runInInjectionContext(injector, () =>
      createErrorVisibility(fieldState),
    );

    expect(factoryResult()).toBe(manualResult());
  });
});
