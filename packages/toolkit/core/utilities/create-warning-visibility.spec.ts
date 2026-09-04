import { Injector, signal } from '@angular/core';
import type { ValidationError } from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import type { NgxSignalFormContext } from '../directives/ngx-signal-form';
import { NGX_SIGNAL_FORM_CONTEXT } from '../tokens';
import type {
  ResolvedErrorDisplayStrategy,
  ResolvedWarningDisplayStrategy,
  SubmittedStatus,
} from '../types';
import { createWarningVisibility } from './create-warning-visibility';
import { warningError } from './warning-error';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const blockingError: ValidationError = {
  kind: 'required',
  message: 'Required',
};
const weakPassword = warningError('weak-password', 'Consider 12+ characters');

function createMockFieldState(
  errors: readonly ValidationError[] = [],
  touched = false,
) {
  return signal({
    errors: signal(errors),
    touched: signal(touched),
  });
}

function createMockFormContext(
  overrides: Partial<{
    errorStrategy: ResolvedErrorDisplayStrategy;
    warningStrategy: ResolvedWarningDisplayStrategy;
    submittedStatus: SubmittedStatus;
  }> = {},
): NgxSignalFormContext {
  return {
    form: (() => ({})) as NgxSignalFormContext['form'],
    errorStrategy: signal(overrides.errorStrategy ?? 'on-touch'),
    warningStrategy: signal(overrides.warningStrategy ?? 'on-touch'),
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
// Presence rule
// ---------------------------------------------------------------------------

describe('createWarningVisibility – presence', () => {
  it('gates on warning presence, not on field invalidity', () => {
    // A field carrying only a blocking error is invalid but has no warning to
    // show, so the warning channel stays closed.
    const visible = createWarningVisibility(
      createMockFieldState([blockingError], true),
      { strategy: 'immediate', injector: injectorWithoutContext() },
    );

    expect(visible()).toBe(false);
  });

  it('shows a warning on a valid-but-warned field', () => {
    const visible = createWarningVisibility(
      createMockFieldState([weakPassword], true),
      { strategy: 'immediate', injector: injectorWithoutContext() },
    );

    expect(visible()).toBe(true);
  });

  it('accepts a caller-supplied presence signal for aggregate surfaces', () => {
    // The field state carries no warning of its own — an aggregate surface
    // (fieldset) owns the presence check and passes `true` so the seam only
    // decides timing.
    const visible = createWarningVisibility(createMockFieldState([], true), {
      strategy: 'on-touch',
      hasWarnings: true,
      injector: injectorWithoutContext(),
    });

    expect(visible()).toBe(true);
  });

  it('returns false for a nullish field state', () => {
    const visible = createWarningVisibility(signal(null), {
      strategy: 'immediate',
      injector: injectorWithoutContext(),
    });

    expect(visible()).toBe(false);
  });

  it('stays false for a nullish field state even when presence is overridden', () => {
    // With no field there is nothing for a warning to attach to, so a
    // presence override must not force the region open.
    const visible = createWarningVisibility(signal(undefined), {
      strategy: 'immediate',
      hasWarnings: true,
      injector: injectorWithoutContext(),
    });

    expect(visible()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Error suppression (ADR-0007)
// ---------------------------------------------------------------------------

describe('createWarningVisibility – error suppression', () => {
  it('hides the warning while a blocking error is visible on the same field', () => {
    const errorVisible = signal(true);
    const visible = createWarningVisibility(
      createMockFieldState([blockingError, weakPassword], true),
      {
        strategy: 'immediate',
        errorVisibility: errorVisible,
        injector: injectorWithoutContext(),
      },
    );

    expect(visible()).toBe(false);

    // Once the blocking error stops showing, the warning takes the region.
    errorVisible.set(false);
    expect(visible()).toBe(true);
  });

  it('leaves the warning visible when no error visibility is supplied', () => {
    // Aggregate surfaces omit `errorVisibility` deliberately: an error on one
    // member field must not silence a warning on a sibling.
    const visible = createWarningVisibility(
      createMockFieldState([blockingError, weakPassword], true),
      { strategy: 'immediate', injector: injectorWithoutContext() },
    );

    expect(visible()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Warning cascade
// ---------------------------------------------------------------------------

describe('createWarningVisibility – strategy cascade', () => {
  it('prefers the explicit strategy over the form context', () => {
    const visible = createWarningVisibility(
      createMockFieldState([weakPassword], false),
      {
        strategy: 'immediate',
        injector: injectorWithContext(
          createMockFormContext({ warningStrategy: 'on-submit' }),
        ),
      },
    );

    expect(visible()).toBe(true);
  });

  it("resolves 'inherit' to the form context's warning strategy", () => {
    const visible = createWarningVisibility(
      createMockFieldState([weakPassword], false),
      {
        strategy: 'inherit',
        injector: injectorWithContext(
          createMockFormContext({ warningStrategy: 'immediate' }),
        ),
      },
    );

    expect(visible()).toBe(true);
  });

  it('never reads the error strategy from the form context', () => {
    // ADR-0007: no tier of the warning cascade reaches into the error channel.
    const visible = createWarningVisibility(
      createMockFieldState([weakPassword], true),
      {
        injector: injectorWithContext(
          createMockFormContext({
            errorStrategy: 'on-submit',
            warningStrategy: 'on-touch',
          }),
        ),
      },
    );

    expect(visible()).toBe(true);
  });

  it('falls back to the config default, then to on-touch', () => {
    const untouched = createMockFieldState([weakPassword], false);

    const withConfigDefault = createWarningVisibility(untouched, {
      configDefault: 'immediate',
      injector: injectorWithoutContext(),
    });
    expect(withConfigDefault()).toBe(true);

    const terminal = createWarningVisibility(untouched, {
      injector: injectorWithoutContext(),
    });
    expect(terminal()).toBe(false);
  });

  it('tracks a reactive strategy signal', () => {
    const strategy = signal<'on-submit' | 'immediate'>('on-submit');
    const visible = createWarningVisibility(
      createMockFieldState([weakPassword], true),
      { strategy, injector: injectorWithoutContext() },
    );

    expect(visible()).toBe(false);

    strategy.set('immediate');
    expect(visible()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Submitted status
// ---------------------------------------------------------------------------

describe('createWarningVisibility – submitted status', () => {
  it("holds an 'on-submit' warning until the explicit status flips", () => {
    const submittedStatus = signal<SubmittedStatus>('unsubmitted');
    const visible = createWarningVisibility(
      createMockFieldState([weakPassword], false),
      {
        strategy: 'on-submit',
        submittedStatus,
        injector: injectorWithoutContext(),
      },
    );

    expect(visible()).toBe(false);

    submittedStatus.set('submitted');
    expect(visible()).toBe(true);
  });

  it("inherits the form context's submitted status", () => {
    const context = createMockFormContext({ submittedStatus: 'submitted' });
    const visible = createWarningVisibility(
      createMockFieldState([weakPassword], false),
      { strategy: 'on-submit', injector: injectorWithContext(context) },
    );

    expect(visible()).toBe(true);
  });
});
