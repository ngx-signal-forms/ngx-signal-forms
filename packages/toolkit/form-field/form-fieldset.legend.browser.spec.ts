import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, schema, validate } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxFormField } from './index';

/**
 * Regression coverage for #552.
 *
 * `NgxFormFieldset`'s legend rules (`:host > legend`, and the invalid and
 * warning variants) target `<legend>`, which is projected via
 * `<ng-content select="legend" />`. A projected element carries the
 * consumer's content attribute, not this component's. These selectors were
 * never nested, but Angular's emulated encapsulation still scopes a flat
 * rule's own top-level selector — on every Angular version, not just 22.2+
 * — so `> legend[_ngcontent-cX]` never matched a projected legend. Every
 * legend padding, inset, colour, background, radius and typography token,
 * and the invalid/warning legend colours, were dead.
 */
describe('NgxFormFieldset — projected legend styling (#552)', () => {
  @Component({
    selector: 'ngx-test-legend-fieldset',
    imports: [FormField, NgxSignalFormToolkit, NgxFormField],
    template: `
      <form [formRoot]="testForm" ngxSignalForm errorStrategy="immediate">
        <fieldset ngxFormFieldset [field]="testForm.passwords">
          <legend>Passwords</legend>
          <ngx-form-field-wrapper
            [formField]="testForm.passwords.password"
            fieldName="password"
          >
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              [formField]="testForm.passwords.password"
            />
          </ngx-form-field-wrapper>
          <ngx-form-field-wrapper
            [formField]="testForm.passwords.confirm"
            fieldName="confirm"
          >
            <label for="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              [formField]="testForm.passwords.confirm"
            />
          </ngx-form-field-wrapper>
        </fieldset>
      </form>
    `,
  })
  class TestComponent {
    readonly #model = signal({
      passwords: { password: 'hunter2', confirm: 'hunter3' },
    });
    readonly testForm = form(
      this.#model,
      schema((path) => {
        validate(path.passwords, (ctx) => {
          const { password, confirm } = ctx.value();
          return password === confirm
            ? null
            : { kind: 'passwordMismatch', message: 'Passwords must match' };
        });
      }),
    );
  }

  it('applies the legend padding token to the projected legend', async () => {
    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const fieldset = container.querySelector<HTMLElement>('fieldset')!;
    const legend = container.querySelector<HTMLElement>('legend')!;

    fieldset.style.setProperty(
      '--ngx-signal-form-fieldset-legend-padding',
      '3px 11px',
    );

    const padding = getComputedStyle(legend).padding;
    expect(padding).toBe('3px 11px');
  });

  it('colors the projected legend with the invalid color while the fieldset is invalid', async () => {
    // Mismatched from the start; `errorStrategy="immediate"` shows the
    // cross-field error without needing to touch a control first.
    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const fieldset = container.querySelector<HTMLElement>('fieldset')!;
    const legend = container.querySelector<HTMLElement>('legend')!;

    expect(
      fieldset.classList.contains('ngx-signal-form-fieldset--invalid'),
    ).toBe(true);

    // The fieldset and legend chrome transition `color`
    // (`--_fieldset-transition-chrome`). Reading `getComputedStyle`
    // synchronously after the class is already present, but before any
    // rendered frame lets the transition run, can still report the
    // pre-transition value. Turn the transition off so the assertion below
    // reads the settled value, not a mid-transition one.
    fieldset.style.setProperty('--_fieldset-transition-chrome', 'none');

    // Resolve the same token the invalid legend rule uses.
    const probe = document.createElement('span');
    probe.style.color = 'var(--_fieldset-invalid-legend-color)';
    fieldset.append(probe);
    const expected = getComputedStyle(probe).color;
    probe.remove();

    // Guards against a token that silently resolves to the same value as
    // the non-invalid legend color, which would make the assertion below
    // pass without the fix.
    const base = document.createElement('span');
    base.style.color = 'var(--_fieldset-legend-color)';
    fieldset.append(base);
    const baseColor = getComputedStyle(base).color;
    base.remove();
    expect(expected).not.toBe(baseColor);

    expect(getComputedStyle(legend).color).toBe(expected);
  });
});
