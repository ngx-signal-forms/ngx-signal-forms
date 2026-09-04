import { Component, signal } from '@angular/core';
import { FormField, form, required, schema } from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  findBoundControl,
  inferNgxSignalFormControlKind,
  resolveBoundControlFromBindings,
} from '../core';
import { NgxSignalFormToolkit } from '../index';
import { requireHostElement } from './form-field-dom-snapshot';
import { NgxFormFieldWrapper } from './form-field-wrapper';

/**
 * Server-platform safety.
 *
 * A Node render pass has no `HTMLElement` constructor family on the global
 * object, so a bare `value instanceof HTMLElement` throws a `ReferenceError`
 * rather than returning `false`. This repo has no `platform-server` harness
 * (see the same note in `assistive/hint.spec.ts`), so the condition is
 * approximated the way the guards themselves branch on it: the constructors
 * are stubbed away for the duration of the pass.
 *
 * The DOM-reading render phases never run on the server, so nothing here
 * asserts on resolved attributes — the contract is only that constructing
 * the wrapper and auto-ARIA, and calling the DOM helpers they reach for,
 * does not throw.
 */
@Component({
  selector: 'ngx-test-server-host',
  imports: [NgxFormFieldWrapper, FormField, NgxSignalFormToolkit],
  template: `
    <form [formRoot]="signupForm" ngxSignalForm>
      <ngx-form-field-wrapper [formField]="signupForm.email" fieldName="email">
        <label for="email">Email</label>
        <input id="email" type="email" [formField]="signupForm.email" />
      </ngx-form-field-wrapper>
    </form>
  `,
})
class ServerHost {
  readonly #model = signal({ email: '' });
  readonly signupForm = form(
    this.#model,
    schema((path) => {
      required(path.email, { message: 'Email is required' });
    }),
  );
}

describe('server platform (no DOM constructor globals)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const stubConstructorsAway = (): void => {
    vi.stubGlobal('HTMLElement', undefined);
    vi.stubGlobal('HTMLInputElement', undefined);
    vi.stubGlobal('HTMLTextAreaElement', undefined);
    vi.stubGlobal('HTMLSelectElement', undefined);
    vi.stubGlobal('HTMLButtonElement', undefined);
  };

  it('constructs the wrapper and auto-ARIA without throwing', async () => {
    stubConstructorsAway();

    await expect(render(ServerHost)).resolves.toBeDefined();
  });

  it('keeps the bound-control helpers total', () => {
    const host = document.createElement('div');
    const input = document.createElement('input');
    input.id = 'email';
    host.append(input);

    stubConstructorsAway();

    expect(findBoundControl(host)).toBe(input);
    expect(requireHostElement({ nativeElement: host })).toBe(host);
    expect(
      resolveBoundControlFromBindings(
        { formFieldBindings: () => [{ element: input }] } as never,
        host,
      ),
    ).toBe(input);
  });

  it('keeps control-semantics inference total', () => {
    const input = document.createElement('input');
    input.type = 'text';
    const textarea = document.createElement('textarea');
    const button = document.createElement('button');

    stubConstructorsAway();

    expect(inferNgxSignalFormControlKind(input)).toBe('input-like');
    expect(inferNgxSignalFormControlKind(textarea)).toBe(
      'standalone-field-like',
    );
    expect(inferNgxSignalFormControlKind(button)).toBe('composite');
  });
});
