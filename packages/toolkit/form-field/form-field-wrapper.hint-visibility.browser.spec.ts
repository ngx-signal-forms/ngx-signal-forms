import {
  ApplicationRef,
  Component,
  type Provider,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, required, validate } from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  provideNgxSignalFormsConfigForComponent,
} from '@ngx-signal-forms/toolkit';
import { expectNoA11yViolations } from '@ngx-signal-forms/toolkit/testing';
import { render } from '@testing-library/angular';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { NgxFormField } from './index';

/**
 * Issue #521: by default, a field's hint stays visible next to a blocking
 * error or warning (WCAG 2.2 SC 3.3.2). Hiding it is opt-in through
 * `hideHintOnError`, on the wrapper input or `NgxSignalFormsConfig`.
 */
describe('NgxFormFieldWrapper — hint visibility on error (issue #521)', () => {
  const HIDE_HINT_ON_ERROR_CLASS =
    'ngx-signal-form-field-wrapper--hide-hint-on-error';

  function renderEmailField(componentProviders: Provider[] = []) {
    @Component({
      selector: 'ngx-test-hint-visibility',
      imports: [FormField, NgxSignalFormToolkit, NgxFormField],
      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <ngx-form-field-wrapper
            [formField]="testForm.email"
            fieldName="email"
          >
            <label for="email">Email address</label>
            <input id="email" type="email" [formField]="testForm.email" />
            <ngx-form-field-hint id="email-hint">
              We only use this to reply to you.
            </ngx-form-field-hint>
          </ngx-form-field-wrapper>
        </form>
      `,
    })
    class TestComponent {
      readonly testForm = form(signal({ email: '' }), (path) => {
        required(path.email, { message: 'Email is required' });
      });
    }

    return render(TestComponent, { componentProviders });
  }

  function renderEmailFieldWithInputOptIn() {
    @Component({
      selector: 'ngx-test-hint-visibility-input-opt-in',
      imports: [FormField, NgxSignalFormToolkit, NgxFormField],
      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <ngx-form-field-wrapper
            [formField]="testForm.email"
            fieldName="email"
            [hideHintOnError]="true"
          >
            <label for="email">Email address</label>
            <input id="email" type="email" [formField]="testForm.email" />
            <ngx-form-field-hint id="email-hint">
              We only use this to reply to you.
            </ngx-form-field-hint>
          </ngx-form-field-wrapper>
        </form>
      `,
    })
    class TestComponent {
      readonly testForm = form(signal({ email: '' }), (path) => {
        required(path.email, { message: 'Email is required' });
      });
    }

    return render(TestComponent);
  }

  async function triggerError(): Promise<void> {
    await userEvent.click(page.getByRole('textbox', { name: 'Email address' }));
    await userEvent.tab();
    await TestBed.inject(ApplicationRef).whenStable();
  }

  /**
   * `page` exposes only ARIA/text-based locator factories, not a raw CSS
   * `.locator()` — wrap the hint element found by id so `expect.element`
   * can assert on it.
   */
  function hintLocator(container: HTMLElement, id = 'email-hint') {
    const hint = container.querySelector(`#${id}`);
    if (hint === null) {
      throw new Error(`#${id} was not found in the rendered container.`);
    }
    return page.elementLocator(hint);
  }

  it('shows both the hint and the error by default', async () => {
    const { container } = await renderEmailField();

    await triggerError();

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent('Email is required');
    await expect.element(hintLocator(container)).toBeVisible();
    await expectNoA11yViolations(container);
  });

  it('keeps the hint id ahead of the error id in aria-describedby by default', async () => {
    const { container } = await renderEmailField();

    await triggerError();

    const input = container.querySelector('#email');
    expect(input?.getAttribute('aria-describedby')).toBe(
      'email-hint email-error',
    );
  });

  it(
    'hides the hint while an error shows when the wrapper opts in, and both ' +
      'hiding mechanisms fire (removing either one would leave the hint visible)',
    async () => {
      const { container } = await renderEmailFieldWithInputOptIn();

      await triggerError();

      await expect
        .element(page.getByRole('alert'))
        .toHaveTextContent('Email is required');
      await expect.element(hintLocator(container)).not.toBeVisible();

      // Mechanism 1: the CSS variable read by `ngx-form-field-hint` itself.
      // `getComputedStyle` on the hint reports its OWN display, unaffected
      // by an ancestor's `display: none` — so this only passes if the host
      // still sets `--ngx-form-field-hint-display: none`.
      const hintEl = container.querySelector('#email-hint') as HTMLElement;
      expect(getComputedStyle(hintEl).display).toBe('none');

      // Mechanism 2: the wrapper's own inline style on the hint's
      // projection slot, applied independently of the CSS variable above.
      const hintSlot = container.querySelector(
        '.ngx-signal-form-field-wrapper__hint-slot',
      ) as HTMLElement;
      expect(hintSlot.style.display).toBe('none');

      // The host class both mechanisms are gated behind in the template.
      const wrapper = container.querySelector('ngx-form-field-wrapper');
      expect(wrapper).toHaveClass(HIDE_HINT_ON_ERROR_CLASS);

      await expectNoA11yViolations(container);
    },
  );

  it('keeps the hint id ahead of the error id in aria-describedby with the opt-in', async () => {
    const { container } = await renderEmailFieldWithInputOptIn();

    await triggerError();

    const input = container.querySelector('#email');
    expect(input?.getAttribute('aria-describedby')).toBe(
      'email-hint email-error',
    );
  });

  it('hides the hint while an error shows with component-scoped config', async () => {
    const { container } = await renderEmailField([
      provideNgxSignalFormsConfigForComponent({ hideHintOnError: true }),
    ]);

    await triggerError();

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent('Email is required');
    await expect.element(hintLocator(container)).not.toBeVisible();
    await expectNoA11yViolations(container);
  });

  it('hides the hint while an error shows with a bare hideHintOnError attribute', async () => {
    // No square brackets: a static HTML-style boolean attribute, not a
    // property binding. This is the path the `booleanAttribute`-based
    // transform exists for — Angular passes the attribute's raw string
    // value (`''` for a valueless attribute) into the transform, not a
    // boolean. Without the transform, `resolvedHideHintOnError() ??
    // this.config.hideHintOnError` would return that non-nullish `''`
    // as-is: falsy in the host class / inline style conditions, so the
    // hint would stay wrongly visible.
    @Component({
      selector: 'ngx-test-hint-visibility-bare-attribute-opt-in',
      imports: [FormField, NgxSignalFormToolkit, NgxFormField],
      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <ngx-form-field-wrapper
            [formField]="testForm.email"
            fieldName="email"
            hideHintOnError
          >
            <label for="email">Email address</label>
            <input id="email" type="email" [formField]="testForm.email" />
            <ngx-form-field-hint id="email-hint">
              We only use this to reply to you.
            </ngx-form-field-hint>
          </ngx-form-field-wrapper>
        </form>
      `,
    })
    class TestComponent {
      readonly testForm = form(signal({ email: '' }), (path) => {
        required(path.email, { message: 'Email is required' });
      });
    }

    const { container } = await render(TestComponent);

    await triggerError();

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent('Email is required');
    await expect.element(hintLocator(container)).not.toBeVisible();
    const wrapper = container.querySelector('ngx-form-field-wrapper');
    expect(wrapper).toHaveClass(HIDE_HINT_ON_ERROR_CLASS);
    await expectNoA11yViolations(container);
  });

  it('keeps the hint visible when a field opts back out of a component-scoped hideHintOnError: true', async () => {
    // The field-level `[hideHintOnError]="false"` must win over the
    // component-scoped config's `true` — a plain `??` fallback only
    // defers to config when the input is nullish, and `false` is not
    // nullish. If the per-field override were dropped (falling back to
    // the config value unconditionally), this field would wrongly hide
    // its hint too.
    @Component({
      selector: 'ngx-test-hint-visibility-field-override',
      imports: [FormField, NgxSignalFormToolkit, NgxFormField],
      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <ngx-form-field-wrapper
            [formField]="testForm.email"
            fieldName="email"
            [hideHintOnError]="false"
          >
            <label for="email">Email address</label>
            <input id="email" type="email" [formField]="testForm.email" />
            <ngx-form-field-hint id="email-hint">
              We only use this to reply to you.
            </ngx-form-field-hint>
          </ngx-form-field-wrapper>
        </form>
      `,
    })
    class TestComponent {
      readonly testForm = form(signal({ email: '' }), (path) => {
        required(path.email, { message: 'Email is required' });
      });
    }

    const { container } = await render(TestComponent, {
      componentProviders: [
        provideNgxSignalFormsConfigForComponent({ hideHintOnError: true }),
      ],
    });

    await triggerError();

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent('Email is required');
    await expect.element(hintLocator(container)).toBeVisible();
    const wrapper = container.querySelector('ngx-form-field-wrapper');
    expect(wrapper).not.toHaveClass(HIDE_HINT_ON_ERROR_CLASS);
    await expectNoA11yViolations(container);
  });

  it('keeps the hint visible while a warning is pending and hides it only once the warning shows (opt-in)', async () => {
    @Component({
      selector: 'ngx-test-hint-visibility-warning-opt-in',
      imports: [FormField, NgxFormField],
      template: `
        <ngx-form-field-wrapper
          [formField]="field.username"
          fieldName="username"
          [hideHintOnError]="true"
        >
          <label for="username">Username</label>
          <input id="username" [formField]="field.username" />
          <ngx-form-field-hint id="username-hint">
            Pick a username you will remember.
          </ngx-form-field-hint>
        </ngx-form-field-wrapper>
      `,
    })
    class TestComponent {
      // Warning-only field (no blocking error), so `presentation.showErrors()`
      // stays false throughout and `presentation.showWarnings()` is what
      // gates the hiding mechanisms. `defaultWarningStrategy` defaults to
      // `'on-touch'`, so the warning exists as soon as the value is short
      // but is not SHOWN until the field is touched.
      readonly field = form(signal({ username: '' }), (path) => {
        validate(path.username, (ctx) => {
          const value = ctx.value();
          if (value.length > 0 && value.length < 3) {
            return {
              kind: 'warn:too-short',
              message: 'Consider 3+ characters',
            };
          }
          return null;
        });
      });
    }

    const { container } = await render(TestComponent);

    const input = page.getByRole('textbox', { name: 'Username' });
    const hintEl = container.querySelector('#username-hint') as HTMLElement;
    const hintSlot = container.querySelector(
      '.ngx-signal-form-field-wrapper__hint-slot',
    ) as HTMLElement;

    // Type a value that produces a warning, but do not blur: the warning is
    // pending, not yet shown, so the hint must stay visible.
    await userEvent.type(input, 'ab');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(container.querySelector('[role="status"]')?.id).not.toBe(
      'username-warning',
    );
    await expect.element(hintLocator(container, 'username-hint')).toBeVisible();
    expect(hintSlot.style.display).not.toBe('none');

    // Blur: the warning shows now, so the opt-in hides the hint.
    await userEvent.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(container.querySelector('[role="status"]')?.id).toBe(
      'username-warning',
    );
    await expect
      .element(hintLocator(container, 'username-hint'))
      .not.toBeVisible();
    expect(getComputedStyle(hintEl).display).toBe('none');
    expect(hintSlot.style.display).toBe('none');

    await expectNoA11yViolations(container);
  });

  it(
    'keeps the hint visible when the field is touched but its warning is ' +
      'not shown yet under a mismatched warning strategy (opt-in)',
    async () => {
      // Regression for the case `presentation.renderMessageSlot()` missed:
      // errorStrategy is `on-touch` (default) but this field's OWN
      // `warningStrategy` is `on-submit`. Touching the field opens
      // `renderMessageSlot()` (it only needs `errorTiming()`, which reacts to
      // ANY invalid() field — warnings included — not to whether a message
      // will actually print), while `showWarnings()` stays false until a
      // submit. The renderer mounts and prints nothing. The hint must stay
      // visible through that window; gating on `renderMessageSlot()` instead
      // of `showErrors() || showWarnings()` would hide it here.
      @Component({
        selector: 'ngx-test-hint-visibility-mismatched-warning-strategy',
        imports: [FormField, NgxSignalFormToolkit, NgxFormField],
        template: `
          <form [formRoot]="field" ngxSignalForm errorStrategy="on-touch">
            <ngx-form-field-wrapper
              [formField]="field.username"
              fieldName="username"
              [hideHintOnError]="true"
              warningStrategy="on-submit"
            >
              <label for="username">Username</label>
              <input id="username" [formField]="field.username" />
              <ngx-form-field-hint id="username-hint">
                Pick a username you will remember.
              </ngx-form-field-hint>
            </ngx-form-field-wrapper>
          </form>
        `,
      })
      class TestComponent {
        readonly field = form(signal({ username: '' }), (path) => {
          validate(path.username, (ctx) => {
            const value = ctx.value();
            if (value.length > 0 && value.length < 3) {
              return {
                kind: 'warn:too-short',
                message: 'Consider 3+ characters',
              };
            }
            return null;
          });
        });
      }

      const { container } = await render(TestComponent);

      const input = page.getByRole('textbox', { name: 'Username' });
      await userEvent.type(input, 'ab');
      await userEvent.tab();
      await TestBed.inject(ApplicationRef).whenStable();

      // The warning has not been shown (no submit yet) …
      expect(container.querySelector('[role="status"]')?.id).not.toBe(
        'username-warning',
      );
      // … and there is no blocking error either.
      expect(container.querySelector('[role="alert"]')?.id).not.toBe(
        'username-error',
      );

      // … yet the hint must still be visible.
      await expect
        .element(hintLocator(container, 'username-hint'))
        .toBeVisible();
      const hintSlot = container.querySelector(
        '.ngx-signal-form-field-wrapper__hint-slot',
      ) as HTMLElement;
      expect(hintSlot.style.display).not.toBe('none');
      const wrapper = container.querySelector('ngx-form-field-wrapper');
      expect(wrapper).not.toHaveClass(HIDE_HINT_ON_ERROR_CLASS);

      await expectNoA11yViolations(container);
    },
  );
});
