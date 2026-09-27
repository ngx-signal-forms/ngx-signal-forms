import { Component, signal } from '@angular/core';
import { render } from '@testing-library/angular';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NgxFormFieldWrapper } from './form-field-wrapper';

/**
 * Regression guard for issue #504: the wrapper's `afterEveryRender` hook
 * used to re-run `findBoundControl` (an 8-branch `querySelector`), plus a
 * `querySelector` for the `__main` slot and one for the label, on every
 * single render — even a steady-state render where nothing about the
 * projected control changed. A 100-field form ran about 400 selector
 * queries per keystroke as a result.
 *
 * This mounts a real wrapper, lets the first render settle (the only render
 * allowed to pay the full DOM-probe cost), then forces several more renders
 * that touch nothing about the projected control's DOM.
 * `Element.prototype.querySelector` must stay flat across those
 * steady-state renders instead of growing per render.
 */
describe('NgxFormFieldWrapper — steady-state render cost', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not call querySelector again once the bound control is cached', async () => {
    // A fresh object each time — the wrapper's `formField` is a signal
    // input, so only a new object *reference* marks the OnPush wrapper
    // dirty for another render. Flipping a property on a held-onto mock
    // object would never do that.
    const nextMockFieldState = () => ({
      invalid: () => false,
      touched: () => false,
      errors: () => [],
    });
    const field = signal(nextMockFieldState());

    @Component({
      template: `
        <ngx-form-field-wrapper [formField]="field">
          <label for="email">Email</label>
          <input id="email" type="text" />
        </ngx-form-field-wrapper>
      `,
      imports: [NgxFormFieldWrapper],
    })
    class TestComponent {
      readonly field = field;
    }

    const { fixture } = await render(TestComponent);
    await fixture.whenStable();

    const querySelectorSpy = vi.spyOn(Element.prototype, 'querySelector');

    // Three steady-state renders: the bound field state is replaced (so the
    // wrapper genuinely re-renders), but the projected control's DOM never
    // moves — the same `<input id="email">` stays mounted throughout.
    field.set(nextMockFieldState());
    fixture.detectChanges();
    await fixture.whenStable();

    field.set(nextMockFieldState());
    fixture.detectChanges();
    await fixture.whenStable();

    field.set(nextMockFieldState());
    fixture.detectChanges();
    await fixture.whenStable();

    // The cached bound control, `__main` slot and label all still validate
    // (still connected, still inside the host), so no render past the first
    // should need to re-query the DOM for any of them. Filtered rather than
    // asserting zero total calls: Angular/zone.js internals issue their own,
    // unrelated `querySelector('base')` lookups that this fix does not (and
    // should not) touch.
    const wrapperDomQueries = querySelectorSpy.mock.calls.filter(([selector]) =>
      /ngx-signal-form-field-wrapper__main|ngx-signal-form-field-wrapper__label|input\[id\]/u.test(
        selector,
      ),
    );
    expect(wrapperDomQueries).toHaveLength(0);
  });
});
