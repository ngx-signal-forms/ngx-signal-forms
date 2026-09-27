import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { ValidationError } from '@angular/forms/signals';
import { afterEach, describe, expect, it } from 'vitest';
import type { NgxSignalFormContext } from '../directives/ngx-signal-form';
import { NgxFieldIdentity } from '../services/field-identity';
import { NGX_SIGNAL_FORM_CONTEXT, NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import { DEFAULT_NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import type {
  ErrorDisplayStrategy,
  ResolvedErrorDisplayStrategy,
  ResolvedWarningDisplayStrategy,
  SubmittedStatus,
  WarningDisplayStrategy,
} from '../types';
import {
  createFieldPresentation,
  type CreateFieldPresentationOptions,
  type FieldPresentationState,
} from './create-field-presentation';
import { warningError } from './warning-error';

const required: ValidationError = { kind: 'required', message: 'Required' };
const weakPassword = warningError('weak-password', 'Use 12+ characters');

/**
 * A field state shaped like Angular's: `invalid()` is true for ANY error,
 * warnings included, because a `warn:` error is still an error to Angular.
 * That is the detail the warning-suppression rule must not trip over.
 */
function mockField(errors: ValidationError[] = [], touched = false) {
  const errorsSignal = signal<ValidationError[]>(errors);
  return {
    errors: errorsSignal,
    touched: signal(touched),
    hidden: signal(false),
    invalid: () => errorsSignal().length > 0,
  };
}

/** The mock carries plain `ValidationError`s, not Angular's field-bound ones. */
function asState(field: ReturnType<typeof mockField>): FieldPresentationState {
  return field as unknown as FieldPresentationState;
}

function mockContext(
  overrides: Partial<{
    errorStrategy: ResolvedErrorDisplayStrategy;
    warningStrategy: ResolvedWarningDisplayStrategy;
    submittedStatus: SubmittedStatus;
  }> = {},
) {
  const context = {
    form: (() => ({})) as NgxSignalFormContext['form'],
    errorStrategy: signal(overrides.errorStrategy ?? 'on-touch'),
    warningStrategy: signal(overrides.warningStrategy ?? 'on-touch'),
    submittedStatus: signal<SubmittedStatus>(
      overrides.submittedStatus ?? 'unsubmitted',
    ),
  };
  return context;
}

function setup(
  field: ReturnType<typeof mockField>,
  options: CreateFieldPresentationOptions = {},
  providers: { context?: NgxSignalFormContext; config?: object } = {},
) {
  TestBed.configureTestingModule({
    providers: [
      ...(providers.context
        ? [{ provide: NGX_SIGNAL_FORM_CONTEXT, useValue: providers.context }]
        : []),
      ...(providers.config
        ? [
            {
              provide: NGX_SIGNAL_FORMS_CONFIG,
              useValue: {
                ...DEFAULT_NGX_SIGNAL_FORMS_CONFIG,
                ...providers.config,
              },
            },
          ]
        : []),
    ],
  });
  return TestBed.runInInjectionContext(() =>
    createFieldPresentation(asState(field), options),
  );
}

afterEach(() => {
  TestBed.resetTestingModule();
});

describe('createFieldPresentation — error timing cascade', () => {
  it('resolves input → form context → config default → on-touch', () => {
    const strategy = signal<ErrorDisplayStrategy | null>(null);
    const context = mockContext({ errorStrategy: 'on-submit' });
    const p = setup(mockField(), { strategy }, { context });

    // No field override: the form context decides.
    expect(p.effectiveStrategy()).toBe('on-submit');

    // A field-level override beats the form context.
    strategy.set('immediate');
    expect(p.effectiveStrategy()).toBe('immediate');

    // `'inherit'` is not a strategy of its own; it defers again.
    strategy.set('inherit');
    expect(p.effectiveStrategy()).toBe('on-submit');
  });

  it('falls back to the config default when no form context exists', () => {
    const p = setup(
      mockField(),
      {},
      { config: { defaultErrorStrategy: 'immediate' } },
    );

    expect(p.effectiveStrategy()).toBe('immediate');
  });

  it('shows a blocking error only once its strategy allows it', () => {
    const field = mockField([required]);
    const context = mockContext({ errorStrategy: 'on-touch' });
    const p = setup(field, {}, { context });

    // An untouched field must not shout at the user before they interacted.
    expect(p.hasErrors()).toBe(true);
    expect(p.showErrors()).toBe(false);

    field.touched.set(true);
    expect(p.showErrors()).toBe(true);
  });

  it('waits for submission under on-submit, even when touched', () => {
    const field = mockField([required], true);
    const context = mockContext({ errorStrategy: 'on-submit' });
    const p = setup(field, {}, { context });

    expect(p.showErrors()).toBe(false);

    context.submittedStatus.set('submitted');
    expect(p.showErrors()).toBe(true);
  });
});

describe('createFieldPresentation — warning timing cascade', () => {
  it('runs its own cascade and never reads the error strategy (ADR-0007)', () => {
    // Blocking errors wait for submit, but warnings are advisory and should
    // reach the user while they still type.
    const field = mockField([weakPassword], true);
    const context = mockContext({
      errorStrategy: 'on-submit',
      warningStrategy: 'on-touch',
    });
    const p = setup(field, {}, { context });

    expect(p.effectiveStrategy()).toBe('on-submit');
    expect(p.effectiveWarningStrategy()).toBe('on-touch');
    expect(p.showWarnings()).toBe(true);
  });

  it('lets a field-level warning strategy override the form context', () => {
    const warningStrategy = signal<WarningDisplayStrategy | undefined>(
      undefined,
    );
    const field = mockField([weakPassword]);
    const context = mockContext({ warningStrategy: 'on-touch' });
    const p = setup(field, { warningStrategy }, { context });

    expect(p.showWarnings()).toBe(false);

    warningStrategy.set('immediate');
    expect(p.effectiveWarningStrategy()).toBe('immediate');
    expect(p.showWarnings()).toBe(true);
  });

  it('does not let a warning-only field suppress its own warning', () => {
    // A warning-only field is `invalid()` to Angular, so the error timing is
    // open. Suppression must key on a visible BLOCKING error, or the warning
    // would hide itself.
    const field = mockField([weakPassword], true);
    const p = setup(field, {}, { context: mockContext() });

    expect(field.invalid()).toBe(true);
    expect(p.showErrors()).toBe(false);
    expect(p.showWarnings()).toBe(true);
  });

  it('hides the warning while a blocking error shows, and restores it after', () => {
    const field = mockField([required, weakPassword], true);
    const p = setup(field, {}, { context: mockContext() });

    // One message region: the error owns it while the value is wrong.
    expect(p.showErrors()).toBe(true);
    expect(p.showWarnings()).toBe(false);

    field.errors.set([weakPassword]);
    expect(p.showErrors()).toBe(false);
    expect(p.showWarnings()).toBe(true);
  });
});

describe('createFieldPresentation — message lists and the message slot', () => {
  it('splits direct messages into blocking errors and warnings', () => {
    const p = setup(
      mockField([required, weakPassword]),
      {},
      {
        context: mockContext(),
      },
    );

    expect(p.errors()).toEqual([required]);
    expect(p.warnings()).toEqual([weakPassword]);
    expect(p.hasErrors()).toBe(true);
    expect(p.hasWarnings()).toBe(true);
  });

  it('mounts the slot on a warning-only field once the error timing opens', () => {
    // The renderer owns the choice of which message to print, so the slot
    // opens on the error timing for any message and leaves the rest to it.
    const field = mockField([weakPassword], true);
    const p = setup(
      field,
      { warningStrategy: signal<WarningDisplayStrategy>('on-submit') },
      { context: mockContext({ errorStrategy: 'on-touch' }) },
    );

    expect(p.showWarnings()).toBe(false);
    expect(p.renderMessageSlot()).toBe(true);
  });

  it('keeps the slot closed on a clean field', () => {
    const p = setup(mockField([], true), {}, { context: mockContext() });

    expect(p.renderMessageSlot()).toBe(false);
  });
});

describe('createFieldPresentation — hidden fields', () => {
  it("reads the field's own hidden() by default", () => {
    // Angular leaves hiding to the consumer's `@if`; if they forget, the
    // field still must not announce messages for a control nobody sees.
    const field = mockField([required, weakPassword], true);
    const p = setup(field, {}, { context: mockContext() });

    field.hidden.set(true);

    expect(p.showErrors()).toBe(false);
    expect(p.showWarnings()).toBe(false);
    expect(p.renderMessageSlot()).toBe(false);
  });

  it('uses the hidden option instead when one is given', () => {
    const hidden = signal(true);
    const field = mockField([required], true);
    const p = setup(field, { hidden }, { context: mockContext() });

    expect(p.showErrors()).toBe(false);

    hidden.set(false);
    expect(p.showErrors()).toBe(true);
  });
});

describe('createFieldPresentation — identity publishing (ADR-0010)', () => {
  it('publishes both resolved strategies so auto-aria gates on field overrides', () => {
    const strategy = signal<ErrorDisplayStrategy | null>('immediate');
    TestBed.configureTestingModule({
      providers: [
        NgxFieldIdentity,
        { provide: NGX_SIGNAL_FORM_CONTEXT, useValue: mockContext() },
      ],
    });
    const identity = TestBed.inject(NgxFieldIdentity);
    TestBed.runInInjectionContext(() =>
      createFieldPresentation(asState(mockField()), {
        strategy,
        warningStrategy: () => 'on-submit',
        identity,
      }),
    );

    TestBed.tick();
    expect(identity.resolvedErrorStrategy()).toBe('immediate');
    expect(identity.resolvedWarningStrategy()).toBe('on-submit');

    strategy.set(null);
    TestBed.tick();
    expect(identity.resolvedErrorStrategy()).toBe('on-touch');
  });

  it('leaves the strategy channels unpublished without an identity', () => {
    TestBed.configureTestingModule({ providers: [NgxFieldIdentity] });
    const identity = TestBed.inject(NgxFieldIdentity);
    TestBed.runInInjectionContext(() =>
      createFieldPresentation(asState(mockField()), {
        strategy: () => 'immediate',
      }),
    );

    TestBed.tick();
    // `null` means "fall back to the visibility registry" (ADR-0010).
    expect(identity.resolvedErrorStrategy()).toBeNull();
    expect(identity.resolvedWarningStrategy()).toBeNull();
  });
});
