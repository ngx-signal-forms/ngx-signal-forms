import {
  Component,
  Directive,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  FormField,
  form,
  minLength,
  schema,
  validate,
} from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldError } from '../../assistive/form-field-error';
import { NgxSignalFormToolkit } from '../../index';
import { NgxFieldIdentity } from '../services/field-identity';
import { NGX_SIGNAL_FORM_HINT_REGISTRY } from '../tokens';
import type {
  ResolvedErrorDisplayStrategy,
  ResolvedWarningDisplayStrategy,
} from '../types';

/**
 * An identity that owns exactly one channel — the field name — and leaves
 * hints and both strategy cascades unpublished.
 *
 * This is the shape a third-party wrapper takes: it knows what its field is
 * called, and nothing else. Before per-channel resolution, merely providing
 * `NgxFieldIdentity` was enough to switch auto-aria off every fallback
 * registry, so a wrapper that adopted the identity to fix its field naming
 * silently lost hint correlation and field-level strategy overrides at the
 * same time. Each test below pins one of those channels.
 */
@Directive({
  selector: '[ngxTestPartialIdentity]',
  providers: [NgxFieldIdentity],
})
class PartialIdentityHost {
  readonly ngxTestPartialIdentity = input.required<string>();
  readonly #identity = inject(NgxFieldIdentity);

  constructor() {
    effect(() => this.#identity.setFieldName(this.ngxTestPartialIdentity()));
  }
}

function createPasswordForm() {
  const model = signal({ password: 'abc' });
  return form(
    model,
    schema((path) => {
      minLength(path.password, 4, { message: 'At least 4 characters' });
      validate(path.password, (ctx) => {
        const value = ctx.value();
        if (value.length > 0 && value.length < 8) {
          return { kind: 'warn:weak', message: 'Consider 8+ characters' };
        }
        return null;
      });
    }),
  );
}

// ---------------------------------------------------------------------------
// Strategy channels
// ---------------------------------------------------------------------------

@Component({
  selector: 'ngx-test-partial-identity-strategies',
  imports: [
    PartialIdentityHost,
    NgxFormFieldError,
    FormField,
    NgxSignalFormToolkit,
  ],
  template: `
    <form [formRoot]="pwForm" ngxSignalForm [errorStrategy]="errorStrategy()">
      <div ngxTestPartialIdentity="password">
        <label for="password">Password</label>
        <input id="password" type="password" [formField]="pwForm.password" />
      </div>
      <ngx-form-field-error
        [formField]="pwForm.password"
        fieldName="password"
        [strategy]="fieldStrategy()"
        [warningStrategy]="fieldWarningStrategy()"
      />
    </form>
  `,
})
class PartialIdentityStrategyHost {
  readonly errorStrategy = input.required<ResolvedErrorDisplayStrategy>();
  readonly fieldStrategy = input.required<ResolvedErrorDisplayStrategy>();
  readonly fieldWarningStrategy =
    input.required<ResolvedWarningDisplayStrategy>();

  readonly pwForm = createPasswordForm();
}

async function renderStrategyHost(inputs: {
  errorStrategy: ResolvedErrorDisplayStrategy;
  fieldStrategy: ResolvedErrorDisplayStrategy;
  fieldWarningStrategy: ResolvedWarningDisplayStrategy;
}) {
  const { container } = await render(PartialIdentityStrategyHost, { inputs });
  return {
    container,
    describedBy:
      container
        .querySelector('input#password')
        ?.getAttribute('aria-describedby') ?? '',
  };
}

describe('auto-aria: a partially-driven identity does not claim the strategy channels', () => {
  it('still honours a registry-published error strategy the ambient form context contradicts', async () => {
    // The form gates errors until submit; the standalone error component
    // overrides *its* blocking channel to 'immediate' and renders. An
    // identity is present but published no error strategy, so the registry
    // must still win — otherwise auto-aria falls back to the ambient
    // 'on-submit' context and never references the region that is on screen
    // (WCAG 1.3.1).
    const { container, describedBy } = await renderStrategyHost({
      errorStrategy: 'on-submit',
      fieldStrategy: 'immediate',
      fieldWarningStrategy: 'on-submit',
    });

    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'At least 4 characters',
    );
    expect(describedBy).toContain('password-error');
    expect(describedBy).not.toContain('password-warning');
  });

  it('still honours a registry-published warning strategy the ambient form context contradicts', async () => {
    const { container, describedBy } = await renderStrategyHost({
      errorStrategy: 'on-submit',
      fieldStrategy: 'on-submit',
      fieldWarningStrategy: 'immediate',
    });

    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      'Consider 8+ characters',
    );
    expect(describedBy).toContain('password-warning');
    expect(describedBy).not.toContain('password-error');
  });

  it('does not reference regions the registry-published strategies suppress', async () => {
    // The mirror case: the form says "show immediately", the standalone
    // component overrides both channels to 'on-submit', nothing renders. A
    // dangling reference here is an axe `aria-valid-attr-value` violation.
    const { container, describedBy } = await renderStrategyHost({
      errorStrategy: 'immediate',
      fieldStrategy: 'on-submit',
      fieldWarningStrategy: 'on-submit',
    });

    expect(
      container.querySelector('[role="alert"]')?.textContent?.trim() ?? '',
    ).toBe('');
    expect(
      container.querySelector('[role="status"]')?.textContent?.trim() ?? '',
    ).toBe('');
    expect(describedBy).not.toContain('password-error');
    expect(describedBy).not.toContain('password-warning');
  });

  it('resolves the two strategy channels independently (ADR-0007)', async () => {
    // One channel published by the registry, the other suppressed — the
    // channels must not be decided together.
    const { describedBy } = await renderStrategyHost({
      errorStrategy: 'on-submit',
      fieldStrategy: 'immediate',
      fieldWarningStrategy: 'immediate',
    });

    // A blocking error suppresses the warning region in the default
    // renderer, so only the error id may appear.
    expect(describedBy).toContain('password-error');
    expect(describedBy).not.toContain('password-warning');
  });
});

// ---------------------------------------------------------------------------
// Hint channel
// ---------------------------------------------------------------------------

/**
 * The custom-wrapper shape for hints: the host owns field naming through a
 * partially-driven identity *and* publishes its own hints through the
 * registry, which is the documented third-party seam. Both must work at once.
 */
@Component({
  selector: 'ngx-test-partial-identity-hints',
  imports: [PartialIdentityHost, FormField, NgxSignalFormToolkit],
  providers: [
    {
      provide: NGX_SIGNAL_FORM_HINT_REGISTRY,
      useFactory: () => ({
        hints: computed(() => [
          { id: 'password-hint', fieldName: 'password' },
          { id: 'other-field-hint', fieldName: 'username' },
        ]),
      }),
    },
  ],
  template: `
    <form [formRoot]="pwForm" ngxSignalForm>
      <div ngxTestPartialIdentity="password">
        <label for="password">Password</label>
        <input id="password" type="password" [formField]="pwForm.password" />
        <p id="password-hint">Use at least 8 characters</p>
      </div>
    </form>
  `,
})
class PartialIdentityHintHost {
  readonly pwForm = createPasswordForm();
}

describe('auto-aria: a partially-driven identity does not claim the hint channel', () => {
  it('still correlates registry hints when the identity published none', async () => {
    const { container } = await render(PartialIdentityHintHost);

    const describedBy =
      container
        .querySelector('input#password')
        ?.getAttribute('aria-describedby') ?? '';

    expect(describedBy.split(' ')).toContain('password-hint');
    // The identity resolved the field name, so the registry filter still
    // scopes correctly — a hint for another field must not leak in.
    expect(describedBy).not.toContain('other-field-hint');
  });
});
