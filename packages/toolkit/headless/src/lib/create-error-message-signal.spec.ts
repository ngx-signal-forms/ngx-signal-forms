import {
  Component,
  Injector,
  runInInjectionContext,
  signal,
  type Signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  form,
  required,
  schema,
  type ValidationError,
} from '@angular/forms/signals';
import { NGX_SIGNAL_FORMS_CONFIG } from '@ngx-signal-forms/toolkit';
import {
  NGX_ERROR_MESSAGES,
  type ErrorMessageRegistry,
} from '@ngx-signal-forms/toolkit/core';
import { describe, expect, it } from 'vitest';
import {
  createErrorMessageSignal,
  type ResolvedFieldError,
} from './create-error-message-signal';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface MockFieldStateOptions {
  readonly invalid?: boolean;
  readonly touched?: boolean;
  readonly errors?: readonly ValidationError[];
  readonly name?: string;
}

function mockFieldState(opts: MockFieldStateOptions = {}) {
  return {
    invalid: signal(opts.invalid ?? (opts.errors?.length ?? 0) > 0),
    touched: signal(opts.touched ?? true),
    errors: signal<readonly ValidationError[]>(opts.errors ?? []),
    name: () => opts.name ?? '',
  };
}

function injectorWithRegistry(registry: ErrorMessageRegistry | null): Injector {
  return Injector.create({
    providers:
      registry === null
        ? []
        : [{ provide: NGX_ERROR_MESSAGES, useValue: registry }],
  });
}

// ---------------------------------------------------------------------------
// Registry-resolved messages
// ---------------------------------------------------------------------------

describe('createErrorMessageSignal — registry resolution', () => {
  it('uses the validator message when present (tier 1)', () => {
    const injector = injectorWithRegistry({
      required: 'Registry says required',
    });
    const field = mockFieldState({
      invalid: true,
      touched: true,
      errors: [{ kind: 'required', message: 'Validator says required' }],
    });

    const result = runInInjectionContext(injector, () =>
      createErrorMessageSignal(() => field, { fieldName: 'email' }),
    );

    expect(result()).toEqual<readonly ResolvedFieldError[]>([
      {
        kind: 'required',
        message: 'Validator says required',
        id: 'email-error-required',
        error: { kind: 'required', message: 'Validator says required' },
      },
    ]);
  });

  it('falls back to the registry when the validator omits a message (tier 2)', () => {
    const injector = injectorWithRegistry({
      required: 'Registry says required',
    });
    const field = mockFieldState({
      errors: [{ kind: 'required' }],
    });

    const result = runInInjectionContext(injector, () =>
      createErrorMessageSignal(() => field, { fieldName: 'email' }),
    );

    expect(result()[0]?.message).toBe('Registry says required');
    expect(result()[0]?.id).toBe('email-error-required');
  });

  it('preserves an explicit empty-string validator message (suppression)', () => {
    const injector = injectorWithRegistry({
      required: 'Registry says required',
    });
    const field = mockFieldState({
      errors: [{ kind: 'required', message: '' }],
    });

    const result = runInInjectionContext(injector, () =>
      createErrorMessageSignal(() => field, { fieldName: 'email' }),
    );

    expect(result()[0]?.message).toBe('');
  });
});

// ---------------------------------------------------------------------------
// Default-fallback messages
// ---------------------------------------------------------------------------

describe('createErrorMessageSignal — default fallback', () => {
  it('falls back to default messages when no registry entry exists (tier 3)', () => {
    const injector = injectorWithRegistry({});
    const field = mockFieldState({
      errors: [{ kind: 'required' }],
    });

    const result = runInInjectionContext(injector, () =>
      createErrorMessageSignal(() => field, { fieldName: 'email' }),
    );

    expect(result()[0]?.message).toBe('This field is required');
  });

  it('produces default messages when no registry is provided at all', () => {
    const injector = injectorWithRegistry(null);
    const field = mockFieldState({
      errors: [{ kind: 'email' }],
    });

    const result = runInInjectionContext(injector, () =>
      createErrorMessageSignal(() => field, { fieldName: 'contact' }),
    );

    expect(result()[0]?.message).toBe('Please enter a valid email address');
  });
});

// ---------------------------------------------------------------------------
// Visibility filtering — integration with createErrorVisibility
// ---------------------------------------------------------------------------

describe('createErrorMessageSignal — visibility filtering', () => {
  it('returns an empty list when the visibility cascade hides errors', () => {
    const injector = injectorWithRegistry(null);
    // Untouched + on-touch (default) → visibility hides errors
    const field = mockFieldState({
      invalid: true,
      touched: false,
      errors: [{ kind: 'required', message: 'Required' }],
    });

    const result = runInInjectionContext(injector, () =>
      createErrorMessageSignal(() => field, { fieldName: 'email' }),
    );

    expect(result()).toEqual([]);
  });

  it('emits messages when the field becomes touched (default on-touch strategy)', () => {
    const injector = injectorWithRegistry(null);
    const field = mockFieldState({
      invalid: true,
      touched: false,
      errors: [{ kind: 'required', message: 'Required' }],
    });

    const result = runInInjectionContext(injector, () =>
      createErrorMessageSignal(() => field, { fieldName: 'email' }),
    );

    expect(result()).toEqual([]);

    field.touched.set(true);
    expect(result().length).toBe(1);
    expect(result()[0]?.message).toBe('Required');
  });

  it('honors an explicit immediate strategy (errors visible while untouched)', () => {
    const injector = injectorWithRegistry(null);
    const field = mockFieldState({
      invalid: true,
      touched: false,
      errors: [{ kind: 'required', message: 'Required' }],
    });

    const result = runInInjectionContext(injector, () =>
      createErrorMessageSignal(() => field, {
        fieldName: 'email',
        strategy: 'immediate',
      }),
    );

    expect(result().length).toBe(1);
  });

  it('honors NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy when no strategy input or form context is present', () => {
    const injector = Injector.create({
      providers: [
        {
          provide: NGX_SIGNAL_FORMS_CONFIG,
          useValue: { defaultErrorStrategy: 'immediate' },
        },
      ],
    });
    const field = mockFieldState({
      invalid: true,
      touched: false,
      errors: [{ kind: 'required', message: 'Required' }],
    });

    const result = runInInjectionContext(injector, () =>
      createErrorMessageSignal(() => field, { fieldName: 'email' }),
    );

    // No explicit `strategy` and no form context — the global config
    // default ('immediate') should still surface the message while
    // untouched, matching NgxHeadlessFieldset.resolvedStrategy's cascade.
    expect(result().length).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// includeWarnings option
// ---------------------------------------------------------------------------

describe('createErrorMessageSignal — includeWarnings', () => {
  const errors: readonly ValidationError[] = [
    { kind: 'required', message: 'Required' },
    { kind: 'warn:weak', message: 'Could be stronger' },
    { kind: 'minLength', message: 'Too short' },
    { kind: 'warn:trim', message: 'Trim whitespace' },
  ];

  it('returns blocking errors only when includeWarnings is false (default)', () => {
    const injector = injectorWithRegistry(null);
    const field = mockFieldState({ errors });

    const result = runInInjectionContext(injector, () =>
      createErrorMessageSignal(() => field, { fieldName: 'f' }),
    );

    expect(result().map((r) => r.kind)).toEqual(['required', 'minLength']);
  });

  it('returns blocking errors first then warnings when includeWarnings is true', () => {
    const injector = injectorWithRegistry(null);
    const field = mockFieldState({ errors });

    const result = runInInjectionContext(injector, () =>
      createErrorMessageSignal(() => field, {
        fieldName: 'f',
        includeWarnings: true,
      }),
    );

    expect(result().map((r) => r.kind)).toEqual([
      'required',
      'minLength',
      'warn:weak',
      'warn:trim',
    ]);
  });

  it('returns warnings only when includeWarnings is "only"', () => {
    const injector = injectorWithRegistry(null);
    const field = mockFieldState({ errors });

    const result = runInInjectionContext(injector, () =>
      createErrorMessageSignal(() => field, {
        fieldName: 'f',
        includeWarnings: 'only',
      }),
    );

    expect(result().map((r) => r.kind)).toEqual(['warn:weak', 'warn:trim']);
  });
});

// ---------------------------------------------------------------------------
// stripWarningPrefix option
// ---------------------------------------------------------------------------

describe('createErrorMessageSignal — stripWarningPrefix', () => {
  it('strips the warn: prefix from default messages by default', () => {
    const injector = injectorWithRegistry(null);
    // No registry, no validator message → falls through to default fallback,
    // which is where stripWarningPrefix takes effect.
    const field = mockFieldState({
      errors: [{ kind: 'warn:weak_password' }],
    });

    const result = runInInjectionContext(injector, () =>
      createErrorMessageSignal(() => field, {
        fieldName: 'password',
        includeWarnings: 'only',
      }),
    );

    expect(result()[0]?.message).toBe('weak password');
  });

  it('keeps the warn: prefix when stripWarningPrefix is false', () => {
    const injector = injectorWithRegistry(null);
    const field = mockFieldState({
      errors: [{ kind: 'warn:weak_password' }],
    });

    const result = runInInjectionContext(injector, () =>
      createErrorMessageSignal(() => field, {
        fieldName: 'password',
        includeWarnings: 'only',
        stripWarningPrefix: false,
      }),
    );

    expect(result()[0]?.message).toBe('warn:weak password');
  });
});

// ---------------------------------------------------------------------------
// Explicit errorMessages option (no DI)
// ---------------------------------------------------------------------------

describe('createErrorMessageSignal — explicit errorMessages option', () => {
  it('uses the explicit registry instead of injecting NGX_ERROR_MESSAGES', () => {
    // Even though DI provides one registry, the explicit option wins.
    const injector = injectorWithRegistry({ required: 'Injected: required' });
    const explicit = signal<ErrorMessageRegistry>({
      required: 'Explicit: required',
    });
    const field = mockFieldState({
      errors: [{ kind: 'required' }],
    });

    const result = runInInjectionContext(injector, () =>
      createErrorMessageSignal(() => field, {
        fieldName: 'email',
        errorMessages: explicit,
      }),
    );

    expect(result()[0]?.message).toBe('Explicit: required');
  });

  it('works without an injection context when errorMessages and injector are provided', () => {
    // No `runInInjectionContext` wrapping — only the explicit injector option.
    const injector = injectorWithRegistry(null);
    const explicit = signal<ErrorMessageRegistry>({
      required: 'Explicit: required',
    });
    const field = mockFieldState({
      errors: [{ kind: 'required' }],
    });

    const result = createErrorMessageSignal(() => field, {
      fieldName: 'email',
      errorMessages: explicit,
      injector,
    });

    expect(result()[0]?.message).toBe('Explicit: required');
  });
});

// ---------------------------------------------------------------------------
// ID composition — generateErrorId(fieldName, kind)
// ---------------------------------------------------------------------------

describe('createErrorMessageSignal — DOM IDs', () => {
  it('builds per-error IDs in the form `{fieldName}-error-{kind}`', () => {
    const injector = injectorWithRegistry(null);
    const field = mockFieldState({
      errors: [
        { kind: 'required', message: 'Required' },
        { kind: 'minLength', message: 'Too short' },
      ],
    });

    const result = runInInjectionContext(injector, () =>
      createErrorMessageSignal(() => field, { fieldName: 'address.city' }),
    );

    expect(result().map((r) => r.id)).toEqual([
      'address.city-error-required',
      'address.city-error-minLength',
    ]);
  });

  it('reads the field name from a reactive signal when fieldName is one', () => {
    const injector = injectorWithRegistry(null);
    const fieldName = signal<string | null>('first');
    const field = mockFieldState({
      errors: [{ kind: 'required', message: 'R' }],
    });

    const result = runInInjectionContext(injector, () =>
      createErrorMessageSignal(() => field, { fieldName }),
    );

    expect(result()[0]?.id).toBe('first-error-required');

    fieldName.set('second');
    expect(result()[0]?.id).toBe('second-error-required');
  });
});

// ---------------------------------------------------------------------------
// Reactivity — registry swap mid-render
// ---------------------------------------------------------------------------

describe('createErrorMessageSignal — reactive registry', () => {
  it('re-resolves messages when the explicit registry signal changes', () => {
    const injector = injectorWithRegistry(null);
    const registry = signal<ErrorMessageRegistry>({ required: 'EN: required' });
    const field = mockFieldState({
      errors: [{ kind: 'required' }],
    });

    const result = runInInjectionContext(injector, () =>
      createErrorMessageSignal(() => field, {
        fieldName: 'name',
        errorMessages: registry,
      }),
    );

    expect(result()[0]?.message).toBe('EN: required');

    registry.set({ required: 'JA: 必須' });
    expect(result()[0]?.message).toBe('JA: 必須');

    // Swapping a factory function in mid-flight also works (i18n pattern).
    registry.set({
      required: ({ minLength }: Record<string, unknown>) =>
        `Need at least ${typeof minLength === 'number' ? minLength : 0}`,
    });
    expect(result()[0]?.message).toBe('Need at least 0');
  });

  it('re-resolves messages when the field errors change', () => {
    const injector = injectorWithRegistry(null);
    const field = mockFieldState({
      errors: [{ kind: 'required' }],
    });

    const result: Signal<readonly ResolvedFieldError[]> = runInInjectionContext(
      injector,
      () => createErrorMessageSignal(() => field, { fieldName: 'name' }),
    );

    expect(result()[0]?.kind).toBe('required');

    field.errors.set([{ kind: 'minLength', minLength: 8 } as ValidationError]);
    expect(result()[0]?.kind).toBe('minLength');
    expect(result()[0]?.message).toBe('Minimum 8 characters required');
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('createErrorMessageSignal — edge cases', () => {
  it('returns an empty list for a null/undefined field state', () => {
    const injector = injectorWithRegistry(null);
    const accessor = () => null;

    const result = runInInjectionContext(injector, () =>
      createErrorMessageSignal(accessor, { fieldName: 'x' }),
    );

    expect(result()).toEqual([]);
  });

  it('exposes the raw ValidationError for consumers that need params', () => {
    const injector = injectorWithRegistry(null);
    const raw: ValidationError = {
      kind: 'minLength',
      minLength: 8,
    } as ValidationError;
    const field = mockFieldState({ errors: [raw] });

    const result = runInInjectionContext(injector, () =>
      createErrorMessageSignal(() => field, { fieldName: 'password' }),
    );

    expect(result()[0]?.error).toBe(raw);
  });

  it('returns an empty list for a field with no errors', () => {
    const injector = injectorWithRegistry(null);
    const field = mockFieldState({ invalid: false, errors: [] });

    const result = runInInjectionContext(injector, () =>
      createErrorMessageSignal(() => field, { fieldName: 'x' }),
    );

    expect(result()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Real FieldTree name() fallback — no `fieldName` option supplied
// ---------------------------------------------------------------------------

describe('createErrorMessageSignal — name() fallback on a real field', () => {
  it('strips the Angular-internal `ng.formN.` prefix from the field name fallback', () => {
    // Angular's real `FieldState.name()` is `${APP_ID}.form${n}.path`, e.g.
    // `ng.form0.email` — not the bare path segment the mocked specs above
    // use. When `fieldName` is omitted, the per-error DOM id must still be
    // derived from the bare path so it matches the ids the in-tree wrapper
    // (and any other consumer deriving ids from the same field name) builds.
    @Component({ template: '' })
    class Host {
      readonly form = form(
        signal({ email: '' }),
        schema<{ email: string }>((path) => {
          required(path.email);
        }),
      );
      readonly resolved = createErrorMessageSignal(() => this.form.email(), {
        strategy: 'immediate',
      });
    }

    const fixture = TestBed.createComponent(Host);
    const { resolved, form: contactForm } = fixture.componentInstance;

    // Sanity-check the assumption this regression test relies on: Angular's
    // real field name is prefixed.
    expect(contactForm.email().name()).toMatch(/^\w+\.form\d+\.email$/);

    expect(resolved()[0]?.id).toBe('email-error-required');
  });
});
