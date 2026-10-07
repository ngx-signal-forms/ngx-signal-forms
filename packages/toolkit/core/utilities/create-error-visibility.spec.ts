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
import type { ErrorVisibilityState } from './field-state-types';

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
    warningStrategy: signal('on-touch'),
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
 * Verify public factory behavior for every strategy and field-state
 * combination against literal, hand-derived expectations.
 */
describe('createErrorVisibility – behavioral parity matrix', () => {
  type MatrixRow = {
    strategy: ErrorDisplayStrategy;
    touched: boolean;
    invalid: boolean;
    submittedStatus: SubmittedStatus;
    expected: boolean;
  };

  const matrix: MatrixRow[] = [
    // immediate: visible whenever invalid, regardless of touch/submit
    {
      strategy: 'immediate',
      touched: false,
      invalid: false,
      submittedStatus: 'unsubmitted',
      expected: false,
    },
    {
      strategy: 'immediate',
      touched: false,
      invalid: true,
      submittedStatus: 'unsubmitted',
      expected: true,
    },
    {
      strategy: 'immediate',
      touched: true,
      invalid: false,
      submittedStatus: 'unsubmitted',
      expected: false,
    },
    {
      strategy: 'immediate',
      touched: true,
      invalid: true,
      submittedStatus: 'unsubmitted',
      expected: true,
    },
    {
      strategy: 'immediate',
      touched: false,
      invalid: true,
      submittedStatus: 'submitted',
      expected: true,
    },
    // on-touch: visible when invalid AND touched
    {
      strategy: 'on-touch',
      touched: false,
      invalid: false,
      submittedStatus: 'unsubmitted',
      expected: false,
    },
    {
      strategy: 'on-touch',
      touched: false,
      invalid: true,
      submittedStatus: 'unsubmitted',
      expected: false,
    },
    {
      strategy: 'on-touch',
      touched: true,
      invalid: false,
      submittedStatus: 'unsubmitted',
      expected: false,
    },
    {
      strategy: 'on-touch',
      touched: true,
      invalid: true,
      submittedStatus: 'unsubmitted',
      expected: true,
    },
    {
      strategy: 'on-touch',
      touched: true,
      invalid: true,
      submittedStatus: 'submitted',
      expected: true,
    },
    // on-touch ignores submission: an untouched field stays hidden after submit
    {
      strategy: 'on-touch',
      touched: false,
      invalid: true,
      submittedStatus: 'submitted',
      expected: false,
    },
    // on-submit: visible when invalid AND the form left 'unsubmitted'
    // (so 'submitting' and 'submitted' both show it); touch alone is not enough
    {
      strategy: 'on-submit',
      touched: false,
      invalid: false,
      submittedStatus: 'submitted',
      expected: false,
    },
    {
      strategy: 'on-submit',
      touched: false,
      invalid: true,
      submittedStatus: 'unsubmitted',
      expected: false,
    },
    {
      strategy: 'on-submit',
      touched: false,
      invalid: true,
      submittedStatus: 'submitting',
      expected: true,
    },
    {
      strategy: 'on-submit',
      touched: false,
      invalid: true,
      submittedStatus: 'submitted',
      expected: true,
    },
    {
      strategy: 'on-submit',
      touched: true,
      invalid: true,
      submittedStatus: 'submitted',
      expected: true,
    },
    {
      strategy: 'on-submit',
      touched: true,
      invalid: true,
      submittedStatus: 'unsubmitted',
      expected: false,
    },
    // inherit: falls back to on-touch when no context
    {
      strategy: 'inherit',
      touched: false,
      invalid: true,
      submittedStatus: 'unsubmitted',
      expected: false,
    },
    {
      strategy: 'inherit',
      touched: true,
      invalid: true,
      submittedStatus: 'unsubmitted',
      expected: true,
    },
  ];

  for (const row of matrix) {
    const label =
      `strategy=${row.strategy} touched=${row.touched} ` +
      `invalid=${row.invalid} status=${row.submittedStatus}`;

    it(`[${label}] shows errors: ${row.expected}`, () => {
      const injector = injectorWithoutContext();
      const fieldState = createMockFieldState(row.invalid, row.touched);
      const statusSignal = signal<SubmittedStatus>(row.submittedStatus);

      const factoryResult = runInInjectionContext(injector, () =>
        createErrorVisibility(fieldState, {
          strategy: row.strategy,
          submittedStatus: statusSignal,
        }),
      );

      expect(factoryResult()).toBe(row.expected);
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
      warningStrategy: signal('on-touch'),
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

  it('falls back to opts.configDefault when no context and no explicit strategy', () => {
    const injector = injectorWithoutContext();
    const fieldState = createMockFieldState(true, false); // invalid, not touched

    const result = runInInjectionContext(injector, () =>
      createErrorVisibility(fieldState, { configDefault: 'immediate' }),
    );

    // configDefault 'immediate' → visible even when not touched
    expect(result()).toBe(true);
  });

  it('form context strategy wins over opts.configDefault', () => {
    const context = createMockFormContext({ errorStrategy: 'on-touch' });
    const injector = injectorWithContext(context);
    const fieldState = createMockFieldState(true, false); // invalid, not touched

    const result = runInInjectionContext(injector, () =>
      createErrorVisibility(fieldState, { configDefault: 'immediate' }),
    );

    // context 'on-touch' wins over configDefault 'immediate'
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

  it('handles nullish and partial field state', () => {
    const injector = injectorWithoutContext();
    const invalid = signal(true);
    const fieldState = signal<Partial<ErrorVisibilityState> | null | undefined>(
      null,
    );

    const result = runInInjectionContext(injector, () =>
      createErrorVisibility(fieldState, { strategy: 'immediate' }),
    );

    expect(result()).toBe(false);

    fieldState.set(undefined);
    expect(result()).toBe(false);

    fieldState.set({});
    expect(result()).toBe(false);

    fieldState.set({ invalid });
    expect(result()).toBe(true);
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

  it('warns once when on-submit has no submittedStatus', () => {
    const injector = injectorWithoutContext();
    const invalid = signal(true);
    const fieldState = signal({
      invalid,
      touched: signal(true),
    });

    const result = runInInjectionContext(injector, () =>
      createErrorVisibility(fieldState, { strategy: 'on-submit' }),
    );

    result();
    invalid.set(false);
    result();
    invalid.set(true);
    result();

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toContain(
      "createErrorVisibility(): 'on-submit'",
    );
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

  it('keeps errors hidden for a touched invalid field without a status', () => {
    // Regression: a silent `touched -> submitted` fallback once made a
    // touched field behave as if the form was submitted, defeating on-submit.
    const injector = injectorWithoutContext();
    const fieldState = createMockFieldState(true, true);

    const result = runInInjectionContext(injector, () =>
      createErrorVisibility(fieldState, { strategy: 'on-submit' }),
    );

    expect(result()).toBe(false);
  });

  it('does not warn for strategies other than on-submit', () => {
    const injector = injectorWithoutContext();
    const fieldState = createMockFieldState(true, true);

    const results = runInInjectionContext(injector, () => [
      createErrorVisibility(fieldState, { strategy: 'on-touch' }),
      createErrorVisibility(fieldState, { strategy: 'immediate' }),
      createErrorVisibility(fieldState, { strategy: 'inherit' }),
    ]);
    for (const result of results) result();

    expect(warnSpy).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 'inherit' and unknown strategy values
// ---------------------------------------------------------------------------

describe("createErrorVisibility – 'inherit' and unknown strategies", () => {
  it("resolves 'inherit' from the form context strategy", () => {
    const injector = injectorWithContext(
      createMockFormContext({ errorStrategy: 'immediate' }),
    );
    const fieldState = createMockFieldState(true, false); // invalid, untouched

    const result = runInInjectionContext(injector, () =>
      createErrorVisibility(fieldState, { strategy: 'inherit' }),
    );

    // The context says 'immediate', so an untouched invalid field shows.
    expect(result()).toBe(true);
  });

  it("resolves 'inherit' from configDefault when no context exists", () => {
    const injector = injectorWithoutContext();
    const fieldState = createMockFieldState(true, false);

    const result = runInInjectionContext(injector, () =>
      createErrorVisibility(fieldState, {
        strategy: 'inherit',
        configDefault: 'immediate',
      }),
    );

    expect(result()).toBe(true);
  });

  it('treats an unknown strategy value like on-touch', () => {
    const injector = injectorWithoutContext();
    const untouched = createMockFieldState(true, false);
    const touched = createMockFieldState(true, true);
    const unknown = 'unknown' as ErrorDisplayStrategy;

    const [hidden, visible] = runInInjectionContext(injector, () => [
      createErrorVisibility(untouched, { strategy: unknown }),
      createErrorVisibility(touched, { strategy: unknown }),
    ]);

    expect(hidden()).toBe(false);
    expect(visible()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Initial load and submission
// ---------------------------------------------------------------------------

describe('createErrorVisibility – initial load and submission', () => {
  it('does not show on-submit errors before the first submit', () => {
    const injector = injectorWithContext(
      createMockFormContext({
        errorStrategy: 'on-submit',
        submittedStatus: 'unsubmitted',
      }),
    );
    // A pristine, invalid, untouched field, as on first render.
    const fieldState = createMockFieldState(true, false);

    const result = runInInjectionContext(injector, () =>
      createErrorVisibility(fieldState),
    );

    expect(result()).toBe(false);
  });

  it('does not show on-touch errors for an untouched field, even after submit', () => {
    const injector = injectorWithContext(
      createMockFormContext({
        errorStrategy: 'on-touch',
        submittedStatus: 'submitted',
      }),
    );
    const fieldState = createMockFieldState(true, false);

    const result = runInInjectionContext(injector, () =>
      createErrorVisibility(fieldState),
    );

    // Angular's submit() marks fields touched, so touch alone drives on-touch.
    expect(result()).toBe(false);
  });
});
