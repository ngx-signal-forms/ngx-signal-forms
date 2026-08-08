import { Component, input, signal } from '@angular/core';
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
import { NgxFormFieldWrapper } from '../../form-field/form-field-wrapper';
import { NgxSignalFormToolkit } from '../../index';
import { provideNgxSignalFormsConfig } from '../providers/config.provider';
import type {
  ResolvedErrorDisplayStrategy,
  ResolvedWarningDisplayStrategy,
} from '../types';

/**
 * `errorStrategy` and `warningStrategy` are independent cascades (ADR-0007),
 * so every combination of the two is reachable. These tests pin the two
 * observable consequences of that independence:
 *
 * 1. The rendered live regions follow their own strategy.
 * 2. `aria-describedby` on the control stays in lockstep with what is
 *    actually rendered — a visible region must be referenced, and a hidden
 *    one must not be (a dangling id is an axe `aria-valid-attr-value`
 *    violation; a missing one hides the text from AT entirely).
 */
@Component({
  selector: 'ngx-test-divergent-strategies',
  imports: [
    NgxFormFieldWrapper,
    NgxFormFieldError,
    FormField,
    NgxSignalFormToolkit,
  ],
  template: `
    <form [formRoot]="pwForm" ngxSignalForm [errorStrategy]="errorStrategy()">
      <ngx-form-field-wrapper
        [formField]="pwForm.password"
        fieldName="password"
      >
        <label for="password">Password</label>
        <input id="password" type="password" [formField]="pwForm.password" />
      </ngx-form-field-wrapper>
      <button type="submit">Submit</button>
    </form>
  `,
})
class DivergentHost {
  readonly errorStrategy = input.required<ResolvedErrorDisplayStrategy>();

  readonly #model = signal({ password: 'abc' });
  readonly pwForm = form(
    this.#model,
    schema((path) => {
      minLength(path.password, 4, { message: 'At least 4 characters' });
      validate(path.password, (ctx) => {
        const v = ctx.value();
        if (v.length > 0 && v.length < 8) {
          return { kind: 'warn:weak', message: 'Consider 8+ characters' };
        }
        return null;
      });
    }),
  );
}

async function renderWith(options: {
  errorStrategy: ResolvedErrorDisplayStrategy;
  warningStrategy: ResolvedWarningDisplayStrategy;
}) {
  const { container } = await render(DivergentHost, {
    inputs: { errorStrategy: options.errorStrategy },
    providers: [
      provideNgxSignalFormsConfig({
        defaultWarningStrategy: options.warningStrategy,
      }),
    ],
  });

  const control = container.querySelector('input#password');

  return {
    container,
    describedBy: control?.getAttribute('aria-describedby') ?? '',
    warningRegion: container.querySelector('[role="status"]'),
    errorRegion: container.querySelector('[role="alert"]'),
  };
}

describe('auto-aria: divergent error / warning strategies', () => {
  // The field below is 'abc': it violates minLength(4) AND triggers the
  // warning, so both channels have content and only the strategies differ.

  it('gates the warning on the warning cascade, not the error one', async () => {
    // errorStrategy hides blocking errors until submit; warningStrategy does
    // not. The warning must be visible AND referenced.
    const { describedBy, warningRegion, errorRegion } = await renderWith({
      errorStrategy: 'on-submit',
      warningStrategy: 'immediate',
    });

    expect(warningRegion?.getAttribute('id')).toBe('password-warning');
    expect(warningRegion?.textContent).toContain('Consider 8+ characters');
    expect(describedBy).toContain('password-warning');

    // The blocking error is present but not yet visible, so it must not be
    // referenced.
    expect(errorRegion?.textContent?.trim() ?? '').toBe('');
    expect(describedBy).not.toContain('password-error');
  });

  it('gates the error on the error cascade, not the warning one', async () => {
    // The mirror image: errors show immediately, warnings wait for submit.
    const { describedBy, errorRegion } = await renderWith({
      errorStrategy: 'immediate',
      warningStrategy: 'on-submit',
    });

    expect(errorRegion?.textContent).toContain('At least 4 characters');
    expect(describedBy).toContain('password-error');
    // Warning is gated by its own strategy, so no dangling reference.
    expect(describedBy).not.toContain('password-warning');
  });

  it('gives a visible blocking error priority over a visible warning', async () => {
    // Both strategies say "show". The renderer suppresses the warning region
    // so a single field never produces an assertive AND a polite
    // announcement, and aria-describedby matches that choice.
    const { describedBy, errorRegion, warningRegion } = await renderWith({
      errorStrategy: 'immediate',
      warningStrategy: 'immediate',
    });

    expect(errorRegion?.textContent).toContain('At least 4 characters');
    expect(warningRegion?.textContent?.trim() ?? '').toBe('');

    expect(describedBy).toContain('password-error');
    expect(describedBy).not.toContain('password-warning');
  });

  it('hides both channels when both strategies gate them', async () => {
    const { describedBy, errorRegion, warningRegion } = await renderWith({
      errorStrategy: 'on-submit',
      warningStrategy: 'on-submit',
    });

    expect(errorRegion?.textContent?.trim() ?? '').toBe('');
    expect(warningRegion?.textContent?.trim() ?? '').toBe('');
    expect(describedBy).not.toContain('password-error');
    expect(describedBy).not.toContain('password-warning');
  });
});

/**
 * Field-level overrides live on the wrapper, which the ambient form context
 * cannot see. `NgxFormFieldWrapper` therefore publishes both resolved
 * strategies through `NgxFieldIdentity`, and auto-aria prefers them.
 *
 * Without that channel auto-aria falls back to form context + global config,
 * so a wrapper-level override makes `aria-describedby` disagree with the DOM
 * in both directions: a dangling id when the wrapper renders less than the
 * form implies, and a missing one when it renders more.
 */
@Component({
  selector: 'ngx-test-field-level-override',
  imports: [
    NgxFormFieldWrapper,
    NgxFormFieldError,
    FormField,
    NgxSignalFormToolkit,
  ],
  template: `
    <form [formRoot]="pwForm" ngxSignalForm [errorStrategy]="errorStrategy()">
      <ngx-form-field-wrapper
        [formField]="pwForm.password"
        fieldName="password"
        [strategy]="fieldStrategy()"
        [warningStrategy]="fieldWarningStrategy()"
      >
        <label for="password">Password</label>
        <input id="password" type="password" [formField]="pwForm.password" />
      </ngx-form-field-wrapper>
    </form>
  `,
})
class FieldOverrideHost {
  readonly errorStrategy = input.required<ResolvedErrorDisplayStrategy>();
  readonly fieldStrategy = input.required<ResolvedErrorDisplayStrategy>();
  readonly fieldWarningStrategy =
    input.required<ResolvedWarningDisplayStrategy>();

  readonly #model = signal({ password: 'abc' });
  readonly pwForm = form(
    this.#model,
    schema((path) => {
      minLength(path.password, 4, { message: 'At least 4 characters' });
      validate(path.password, (ctx) => {
        const v = ctx.value();
        if (v.length > 0 && v.length < 8) {
          return { kind: 'warn:weak', message: 'Consider 8+ characters' };
        }
        return null;
      });
    }),
  );
}

describe('auto-aria: wrapper field-level strategy overrides', () => {
  it('does not reference regions the field-level strategies suppress', async () => {
    // The form says "show errors immediately", but this field overrides both
    // channels to 'on-submit'. Nothing renders, so nothing may be referenced
    // — a dangling id here is an axe `aria-valid-attr-value` violation.
    const { container } = await render(FieldOverrideHost, {
      inputs: {
        errorStrategy: 'immediate',
        fieldStrategy: 'on-submit',
        fieldWarningStrategy: 'on-submit',
      },
    });

    const describedBy =
      container
        .querySelector('input#password')
        ?.getAttribute('aria-describedby') ?? '';

    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(describedBy).toBe('');
  });

  it('references a warning the field-level strategy reveals', async () => {
    // The mirror case: the form gates everything until submit, but this field
    // opts its warnings into 'immediate'. The region renders, so it must be
    // referenced or the advisory text is invisible to AT.
    const { container } = await render(FieldOverrideHost, {
      inputs: {
        errorStrategy: 'on-submit',
        fieldStrategy: 'on-submit',
        fieldWarningStrategy: 'immediate',
      },
    });

    const describedBy =
      container
        .querySelector('input#password')
        ?.getAttribute('aria-describedby') ?? '';

    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      'Consider 8+ characters',
    );
    expect(describedBy).toContain('password-warning');
    expect(describedBy).not.toContain('password-error');
  });
});
