import { ApplicationRef, Component, signal, type Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormField,
  form,
  hidden,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import {
  NgxSignalFormControlSemanticsDirective,
  NgxSignalFormToolkit,
  provideNgxSignalFormsConfig,
} from '@ngx-signal-forms/toolkit';
import { NgxFormFieldHint } from '@ngx-signal-forms/toolkit/assistive';
import { render } from '@testing-library/angular';
import { commands, page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { NgxFormField } from './index';
import { NgxFormFieldWrapper } from './form-field-wrapper';
import {
  expectNoA11yViolations,
  expectVisibleFocusIndicator,
} from '@ngx-signal-forms/toolkit/testing';

declare module 'vitest/browser' {
  interface BrowserCommands {
    emulateForcedColors: (
      forcedColors: 'active' | 'none' | null,
    ) => Promise<void>;
  }
}

/**
 * Builds a standalone test component for a fixture below. Every fixture
 * needs the same three directives (`[formField]`, `[formRoot]`/
 * `ngxSignalForm`, the wrapper itself) and exposes a single `testForm`
 * property to its template — only the markup and the `form()` model behind
 * it change from fixture to fixture, so both are supplied by the caller
 * instead of repeating a full `@Component` declaration per test.
 *
 * `buildForm` runs inside the class field initializer (not at the call
 * site) so `form()` executes during Angular's own component construction,
 * which is an injection context — building it eagerly in the test body
 * throws NG0203.
 */
function defineFixtureComponent<TForm extends object>(
  selector: string,
  template: string,
  buildForm: () => TForm,
): Type<{ readonly testForm: TForm }> {
  @Component({
    selector,
    imports: [FormField, NgxSignalFormToolkit, NgxFormField],
    template,
  })
  class FixtureComponent {
    readonly testForm = buildForm();
  }

  return FixtureComponent;
}

/**
 * WCAG 2.2 AA conformance gate for the form-field wrapper composition.
 *
 * Unlike the behavioral browser specs (which use intentionally minimal markup
 * to isolate one behavior), these fixtures exercise the toolkit primitives the
 * way consumers are meant to wire them — a labelled control inside the wrapper,
 * which auto-manages ARIA and renders its own error live region. axe scans are
 * scoped to the rendered subtree so document-level authoring rules
 * (html-has-lang, landmark-one-main, page-has-heading-one) — the host page's
 * responsibility, not the toolkit's — do not fire. Any violation here is a real
 * toolkit accessibility bug, so this spec is a hard failure by design.
 */
describe('form-field wrapper — WCAG 2.2 AA conformance', () => {
  it('a labelled text field in its initial valid state has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-valid',

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
      readonly #model = signal({ email: '' });
      readonly testForm = form(
        this.#model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
        }),
      );
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    await expect
      .element(page.getByRole('textbox', { name: 'Email address' }))
      .toBeVisible();
    await expectNoA11yViolations(container);
  });

  it('a labelled text field showing a required error has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-error',

      imports: [FormField, NgxSignalFormToolkit, NgxFormField],
      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <ngx-form-field-wrapper [formField]="testForm.name" fieldName="name">
            <label for="name">Full name</label>
            <input id="name" type="text" [formField]="testForm.name" />
          </ngx-form-field-wrapper>
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ name: '' });
      readonly testForm = form(
        this.#model,
        schema((path) => {
          required(path.name, { message: 'Name is required' });
        }),
      );
    }

    const { container } = await render(TestComponent);

    // Touch + blur so the on-touch strategy reveals the error live region.
    await userEvent.click(page.getByRole('textbox', { name: 'Full name' }));
    await userEvent.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent('Name is required');
    await expectNoA11yViolations(container);
  });

  /**
   * Issue #285: the wrapper's only prior axe coverage rendered a labelled
   * text input — every other configuration it can reach (selection
   * clusters, top-placed messages, outline appearance, the hidden safety
   * net) was unscanned. The selection-cluster path matters most: it takes
   * over as the group host (`role="radiogroup"` / `role="group"`),
   * generates the projected legend's id, and composes `aria-describedby`
   * from the error/warning ids itself — including a guard against emitting
   * a dangling `${fieldName}-warning` reference (see
   * `resolveClusterAriaAttrs` in `form-field-cluster-aria.ts`) that was
   * asserted by nothing before this suite.
   */
  describe('selection clusters', () => {
    /** Shared by both radio-group fixtures — same DOM, different model. */
    const RADIO_CLUSTER_TEMPLATE = `
      <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
        <ngx-form-field-wrapper
          [formField]="testForm.deliveryMethod"
          fieldName="delivery-method"
        >
          <span ngxFormFieldLabel>Delivery method</span>
          <div>
            <label>
              <input
                id="delivery-standard"
                type="radio"
                [formField]="testForm.deliveryMethod"
                value="standard"
              />
              Standard
            </label>
            <label>
              <input
                id="delivery-express"
                type="radio"
                [formField]="testForm.deliveryMethod"
                value="express"
              />
              Express
            </label>
          </div>
        </ngx-form-field-wrapper>
      </form>
    `;

    /**
     * Shared by both checkbox-cluster fixtures below. Two distinct boolean
     * fields — not one field bound to both checkboxes — so each control can
     * carry independent checked state, the DOM shape a real "I have read
     * the terms" / "I agree to the terms" pair actually produces. The
     * wrapper tracks exactly one `formField` for its own error/aria state,
     * so `consentRead` is the field that drives the cluster's
     * `aria-invalid`/`aria-describedby`; `consentAgree` is still an
     * independent, separately required control in the error fixture, it
     * just isn't the field this particular wrapper instance watches.
     */
    const CHECKBOX_CLUSTER_TEMPLATE = `
      <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
        <ngx-form-field-wrapper
          [formField]="testForm.consentRead"
          fieldName="consent"
        >
          <span ngxFormFieldLabel>Consent</span>
          <div>
            <label>
              <input
                id="consent-read"
                type="checkbox"
                [formField]="testForm.consentRead"
              />
              I have read the terms
            </label>
            <label>
              <input
                id="consent-agree"
                type="checkbox"
                [formField]="testForm.consentAgree"
              />
              I agree to the terms
            </label>
          </div>
        </ngx-form-field-wrapper>
      </form>
    `;

    it('a radio-group cluster in its valid state has no violations', async () => {
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-radio-valid',
        RADIO_CLUSTER_TEMPLATE,
        () =>
          form(
            signal({ deliveryMethod: 'standard' }),
            schema((path) => {
              required(path.deliveryMethod, {
                message: 'Delivery method is required',
              });
            }),
          ),
      );

      const { container } = await render(TestComponent);
      await TestBed.inject(ApplicationRef).whenStable();

      await expect
        .element(page.getByRole('radiogroup', { name: 'Delivery method' }))
        .toBeVisible();
      await expectNoA11yViolations(container);
    });

    it('a radio-group cluster showing a required error has no violations, and its accessible name resolves through the generated legend id', async () => {
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-radio-error',
        RADIO_CLUSTER_TEMPLATE,
        () =>
          form(
            signal({ deliveryMethod: '' }),
            schema((path) => {
              required(path.deliveryMethod, {
                message: 'Delivery method is required',
              });
            }),
          ),
      );

      const { container, fixture } = await render(TestComponent);

      // Mark the field touched programmatically rather than via keyboard:
      // every radio in an unchecked group is individually tabbable, so
      // simulating "touch without selecting" through `userEvent.tab()` is
      // timing-dependent on how many radios are present. Marking touched
      // directly reveals the required error under `on-touch` while the
      // value stays empty, which is the state under test.
      fixture.componentInstance.testForm.deliveryMethod().markAsTouched();
      await TestBed.inject(ApplicationRef).whenStable();

      const wrapper = container.querySelector('ngx-form-field-wrapper');
      const legend = container.querySelector('[ngxFormFieldLabel]');
      expect(wrapper).toHaveAttribute(
        'aria-labelledby',
        'delivery-method-label',
      );
      expect(legend).toHaveAttribute('id', 'delivery-method-label');

      // A regression in label wiring fails this named assertion, not just
      // an axe rule.
      await expect
        .element(page.getByRole('radiogroup', { name: 'Delivery method' }))
        .toBeVisible();
      await expect
        .element(page.getByRole('alert'))
        .toHaveTextContent('Delivery method is required');
      await expectNoA11yViolations(container);
    });

    it('a multi-control checkbox cluster in its valid state has no violations', async () => {
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-checkbox-cluster-valid',
        CHECKBOX_CLUSTER_TEMPLATE,
        () => form(signal({ consentRead: true, consentAgree: true })),
      );

      const { container } = await render(TestComponent);
      await TestBed.inject(ApplicationRef).whenStable();

      const wrapper = container.querySelector('ngx-form-field-wrapper');
      expect(wrapper).toHaveAttribute('role', 'group');
      await expectNoA11yViolations(container);
    });

    it('a multi-control checkbox cluster showing a required error has no violations', async () => {
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-checkbox-cluster-error',
        CHECKBOX_CLUSTER_TEMPLATE,
        () =>
          form(
            signal({ consentRead: false, consentAgree: false }),
            schema((path) => {
              required(path.consentRead, { message: 'Consent is required' });
              required(path.consentAgree, { message: 'Consent is required' });
            }),
          ),
      );

      const { container, fixture } = await render(TestComponent);

      // Mark the field touched programmatically (see the radio-group error
      // fixture above for why) — reveals the required error under the
      // default `on-touch` strategy while consent stays unchecked.
      fixture.componentInstance.testForm.consentRead().markAsTouched();
      await TestBed.inject(ApplicationRef).whenStable();

      await expect
        .element(page.getByRole('alert'))
        .toHaveTextContent('Consent is required');

      // Regression coverage for
      // https://github.com/ngx-signal-forms/ngx-signal-forms/issues/300: a
      // required checkbox cluster used to put `aria-required="true"` on the
      // wrapper host alongside `role="group"`, which axe's
      // `aria-allowed-attr` rule flags as critical (`group` does not support
      // `aria-required` — only `radiogroup` does among the roles this
      // wrapper emits). `NgxSignalFormAutoAria` is now role-aware and drops
      // `aria-required` whenever the host's resolved role is `group`, so the
      // full rule set runs here with no exclusions. Required-ness isn't
      // simply dropped, though — the issue asked for it to be relocated, so
      // it stays perceivable via a visually-hidden node wired into
      // `aria-describedby` (see `groupRequiredHintId` in
      // form-field-cluster-aria.ts) instead of the disallowed ARIA state.
      const wrapper = container.querySelector('ngx-form-field-wrapper');
      expect(wrapper).toHaveAttribute('role', 'group');
      expect(wrapper).not.toHaveAttribute('aria-required');

      const requiredHintId = 'consent-required-hint';
      const describedBy = wrapper?.getAttribute('aria-describedby') ?? '';
      expect(describedBy.split(' ')).toContain(requiredHintId);

      const requiredHint = container.querySelector(`#${requiredHintId}`);
      expect(requiredHint).toHaveTextContent('required');
      // The hint must actually be exposed to the accessibility tree — unlike
      // the visual `*` marker, it is NOT `aria-hidden`.
      expect(requiredHint).not.toHaveAttribute('aria-hidden');

      await expectNoA11yViolations(container);
    });

    it('suppresses the required hint entirely when requiredHintText is empty, instead of describedby-ing an empty node', async () => {
      // Regression guard: `requiredHintText: ''` is documented as
      // "suppress the hint" (mirrors `requiredMarker`'s empty-string-clears
      // convention), but the wrapper used to keep rendering the hint span
      // and referencing its id in `aria-describedby` even when the text was
      // empty — an empty accessible-description target.
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-checkbox-cluster-empty-hint-text',
        CHECKBOX_CLUSTER_TEMPLATE,
        () =>
          form(
            signal({ consentRead: false, consentAgree: false }),
            schema((path) => {
              required(path.consentRead, { message: 'Consent is required' });
              required(path.consentAgree, { message: 'Consent is required' });
            }),
          ),
      );

      const { container } = await render(TestComponent, {
        providers: [provideNgxSignalFormsConfig({ requiredHintText: '' })],
      });
      await TestBed.inject(ApplicationRef).whenStable();

      const wrapper = container.querySelector('ngx-form-field-wrapper');
      expect(wrapper).toHaveAttribute('role', 'group');
      expect(container.querySelector('#consent-required-hint')).toBeNull();
      expect(wrapper).not.toHaveAttribute('aria-describedby');

      await expectNoA11yViolations(container);
    });

    it('two unnamed clusters skip label wiring instead of colliding on the same fallback id, and still have no violations', async () => {
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-unnamed-clusters',
        `
          <form [formRoot]="testForm" ngxSignalForm>
            <ngx-form-field-wrapper [formField]="testForm.first">
              <span ngxFormFieldLabel>Choose A</span>
              <div>
                <label>
                  <input type="radio" [formField]="testForm.first" value="1" />
                  One
                </label>
                <label>
                  <input type="radio" [formField]="testForm.first" value="2" />
                  Two
                </label>
              </div>
            </ngx-form-field-wrapper>

            <ngx-form-field-wrapper [formField]="testForm.second">
              <span ngxFormFieldLabel>Choose B</span>
              <div>
                <label>
                  <input
                    type="radio"
                    [formField]="testForm.second"
                    value="3"
                  />
                  Three
                </label>
                <label>
                  <input
                    type="radio"
                    [formField]="testForm.second"
                    value="4"
                  />
                  Four
                </label>
              </div>
            </ngx-form-field-wrapper>
          </form>
        `,
        () => form(signal({ first: '1', second: '3' })),
      );

      const { container } = await render(TestComponent);
      await TestBed.inject(ApplicationRef).whenStable();

      const wrappers = container.querySelectorAll('ngx-form-field-wrapper');
      const legends = container.querySelectorAll('[ngxFormFieldLabel]');
      expect(wrappers).toHaveLength(2);
      // Neither cluster got labelled — the fallback id is skipped entirely
      // (rather than both wrappers colliding on the same generated id) once
      // `resolvedFieldName` can't derive a name from either an explicit
      // `fieldName` input or a control `id`.
      for (const wrapper of Array.from(wrappers)) {
        expect(wrapper).not.toHaveAttribute('aria-labelledby');
      }
      for (const legend of Array.from(legends)) {
        expect(legend).not.toHaveAttribute('id');
      }
      await expectNoA11yViolations(container);
    });
  });

  /**
   * `resolveClusterAriaAttrs` composes the cluster's `aria-describedby`
   * itself rather than delegating to auto-aria, and its comment names the
   * exact axe rule (`aria-valid-attr-value`) a dangling `${fieldName}-warning`
   * reference would violate. These two fixtures exercise the guard in both
   * directions: a warning shown on its own timing, and a warning suppressed
   * because a blocking error takes over the reference instead.
   */
  describe('warning / error aria-describedby composition on a selection cluster', () => {
    it('a warning-only cluster under a non-immediate warning strategy composes aria-describedby to the warning id, with no violations', async () => {
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-cluster-warning-only',
        `
          <form [formRoot]="testForm" ngxSignalForm>
            <ngx-form-field-wrapper
              [formField]="testForm.plan"
              fieldName="plan"
              warningStrategy="on-touch"
            >
              <span ngxFormFieldLabel>Plan</span>
              <div>
                <label>
                  <input
                    id="plan-basic"
                    type="radio"
                    [formField]="testForm.plan"
                    value="basic"
                  />
                  Basic
                </label>
                <label>
                  <input
                    id="plan-pro"
                    type="radio"
                    [formField]="testForm.plan"
                    value="pro"
                  />
                  Pro
                </label>
              </div>
            </ngx-form-field-wrapper>
          </form>
        `,
        () =>
          form(
            signal({ plan: '' }),
            schema((path) => {
              validate(path.plan, (ctx) => {
                if (ctx.value() === 'basic') {
                  return {
                    kind: 'warn:basic-plan-limited',
                    message: 'Basic plan has limited features',
                  };
                }
                return null;
              });
            }),
          ),
      );

      const { container } = await render(TestComponent);

      await userEvent.click(page.getByRole('radio', { name: 'Basic' }));
      await userEvent.tab();
      await TestBed.inject(ApplicationRef).whenStable();

      const wrapper = container.querySelector('ngx-form-field-wrapper');
      await expect
        .element(page.getByRole('status'))
        .toHaveTextContent('Basic plan has limited features');
      expect(wrapper).toHaveAttribute('aria-describedby', 'plan-warning');
      await expectNoA11yViolations(container);
    });

    it('a cluster with both a blocking error and a warning composes aria-describedby to the error id only, with no violations', async () => {
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-cluster-error-and-warning',
        `
          <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
            <ngx-form-field-wrapper
              [formField]="testForm.plan"
              fieldName="plan"
              warningStrategy="immediate"
            >
              <span ngxFormFieldLabel>Plan</span>
              <div>
                <label>
                  <input
                    id="plan-deprecated"
                    type="radio"
                    [formField]="testForm.plan"
                    value="deprecated"
                  />
                  Deprecated
                </label>
                <label>
                  <input
                    id="plan-pro-2"
                    type="radio"
                    [formField]="testForm.plan"
                    value="pro"
                  />
                  Pro
                </label>
              </div>
            </ngx-form-field-wrapper>
          </form>
        `,
        () =>
          form(
            signal({ plan: '' }),
            schema((path) => {
              validate(path.plan, (ctx) => {
                if (ctx.value() === 'deprecated') {
                  return [
                    {
                      kind: 'not-available',
                      message: 'This plan is no longer available',
                    },
                    {
                      kind: 'warn:legacy-plan',
                      message: 'Consider switching plans',
                    },
                  ];
                }
                return null;
              });
            }),
          ),
      );

      const { container } = await render(TestComponent);

      await userEvent.click(page.getByRole('radio', { name: 'Deprecated' }));
      await userEvent.tab();
      await TestBed.inject(ApplicationRef).whenStable();

      const wrapper = container.querySelector('ngx-form-field-wrapper');
      await expect
        .element(page.getByRole('alert'))
        .toHaveTextContent('This plan is no longer available');
      // Errors suppress the warning live region's content and id entirely,
      // so the composed `aria-describedby` must reference only the error id
      // — never a dangling `plan-warning`.
      expect(wrapper).toHaveAttribute('aria-describedby', 'plan-error');
      const statusRegion = container.querySelector('[role="status"]');
      expect(statusRegion).not.toHaveAttribute('id');
      expect(statusRegion?.textContent?.trim()).toBe('');
      await expectNoA11yViolations(container);
    });
  });

  describe('layout, appearance, and visibility configurations', () => {
    it('errorPlacement="top" showing an error has no violations', async () => {
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-top-placement',
        `
          <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
            <ngx-form-field-wrapper
              [formField]="testForm.username"
              fieldName="username"
              errorPlacement="top"
            >
              <label for="username">Username</label>
              <input id="username" [formField]="testForm.username" />
            </ngx-form-field-wrapper>
          </form>
        `,
        () =>
          form(
            signal({ username: '' }),
            schema((path) => {
              required(path.username, { message: 'Username is required' });
            }),
          ),
      );

      const { container } = await render(TestComponent);

      await userEvent.click(page.getByRole('textbox', { name: 'Username' }));
      await userEvent.tab();
      await TestBed.inject(ApplicationRef).whenStable();

      await expect
        .element(page.getByRole('alert'))
        .toHaveTextContent('Username is required');
      await expectNoA11yViolations(container);
    });

    it('appearance="outline" in its invalid state has no violations', async () => {
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-outline',
        `
          <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
            <ngx-form-field-wrapper
              [formField]="testForm.email"
              fieldName="email"
              appearance="outline"
            >
              <label for="email-outline">Email address</label>
              <input
                id="email-outline"
                type="email"
                [formField]="testForm.email"
                placeholder=" "
              />
            </ngx-form-field-wrapper>
          </form>
        `,
        () =>
          form(
            signal({ email: '' }),
            schema((path) => {
              required(path.email, { message: 'Email is required' });
            }),
          ),
      );

      const { container } = await render(TestComponent);

      await userEvent.click(
        page.getByRole('textbox', { name: 'Email address' }),
      );
      await userEvent.tab();
      await TestBed.inject(ApplicationRef).whenStable();

      const wrapper = container.querySelector('ngx-form-field-wrapper');
      expect(wrapper).toHaveClass('ngx-signal-forms-outline');
      await expect
        .element(page.getByRole('alert'))
        .toHaveTextContent('Email is required');
      await expectNoA11yViolations(container);
    });

    it('a field hidden via schema hidden() has no violations', async () => {
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-hidden',
        `
          <form [formRoot]="testForm" ngxSignalForm>
            <ngx-form-field-wrapper
              [formField]="testForm.secret"
              fieldName="secret"
            >
              <label for="secret">Secret</label>
              <input id="secret" [formField]="testForm.secret" />
            </ngx-form-field-wrapper>
          </form>
        `,
        () =>
          form(
            signal({ secret: '' }),
            schema((path) => {
              hidden(path.secret, { when: () => true });
            }),
          ),
      );

      const { container } = await render(TestComponent);
      await TestBed.inject(ApplicationRef).whenStable();

      const wrapper = container.querySelector('ngx-form-field-wrapper');
      expect(wrapper).toHaveAttribute('hidden', '');
      await expectNoA11yViolations(container);
    });
  });

  describe('multiple hints in one wrapper (issue #435)', () => {
    it('gives two unnamed hints distinct ids, lists both in aria-describedby, and has no violations', async () => {
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-multi-hint',
        `
          <form [formRoot]="testForm" ngxSignalForm>
            <ngx-form-field-wrapper
              [formField]="testForm.password"
              fieldName="password"
            >
              <label for="password">Password</label>
              <input
                id="password"
                type="password"
                [formField]="testForm.password"
              />
              <ngx-form-field-hint>At least 8 characters.</ngx-form-field-hint>
              <ngx-form-field-hint>Include a number.</ngx-form-field-hint>
            </ngx-form-field-wrapper>
          </form>
        `,
        () => form(signal({ password: '' })),
      );

      const { container } = await render(TestComponent);
      await TestBed.inject(ApplicationRef).whenStable();

      const hints = container.querySelectorAll('ngx-form-field-hint');
      expect(hints).toHaveLength(2);
      const [firstHint, secondHint] = [...hints];
      const firstId = firstHint?.getAttribute('id');
      const secondId = secondHint?.getAttribute('id');
      expect(firstId).toBe('password-hint');
      expect(secondId).toBe('password-hint-2');

      const input = container.querySelector('#password');
      const describedBy = input?.getAttribute('aria-describedby') ?? '';
      const describedByIds = describedBy.split(/\s+/u);
      expect(describedByIds).toContain(firstId);
      expect(describedByIds).toContain(secondId);

      await expectNoA11yViolations(container);
    });
  });
});

/**
 * Additional wrapper variants with no prior a11y coverage (issue #501, toolkit
 * audit §1.3). The suite above only ever scanned a labelled text input, the
 * two selection-cluster shapes, and a handful of layout/appearance
 * combinations built on top of a text input — every other control kind and
 * chrome combination the wrapper renders (`<select>`, `<textarea>`, a single
 * checkbox/switch, `appearance="plain"`, the horizontal layout, prefix/suffix
 * content, and a role-less custom control) went unscanned. A new `describe`
 * block, kept separate from the suite above (rather than interleaved into it)
 * so a parallel lane editing this file's existing fixtures rebases cleanly.
 */
describe('form-field wrapper — additional variant coverage (#501)', () => {
  afterEach(async () => {
    await commands.emulateForcedColors(null);
  });

  it('a <select> control in its invalid state has no violations', async () => {
    const TestComponent = defineFixtureComponent(
      'ngx-test-a11y-select',
      `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <ngx-form-field-wrapper
            [formField]="testForm.country"
            fieldName="country"
          >
            <label for="country">Country</label>
            <select id="country" [formField]="testForm.country">
              <option value="">Select…</option>
              <option value="us">United States</option>
              <option value="ca">Canada</option>
            </select>
          </ngx-form-field-wrapper>
        </form>
      `,
      () =>
        form(
          signal({ country: '' }),
          schema((path) => {
            required(path.country, { message: 'Country is required' });
          }),
        ),
    );

    const { container } = await render(TestComponent);

    const select = page.getByRole('combobox', { name: 'Country' });
    await userEvent.click(select.element());
    await userEvent.tab();

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent('Country is required');
    await expectNoA11yViolations(container);
  });

  it('a <textarea> control in its invalid state has no violations', async () => {
    const TestComponent = defineFixtureComponent(
      'ngx-test-a11y-textarea',
      `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <ngx-form-field-wrapper [formField]="testForm.bio" fieldName="bio">
            <label for="bio">Bio</label>
            <textarea id="bio" [formField]="testForm.bio"></textarea>
          </ngx-form-field-wrapper>
        </form>
      `,
      () =>
        form(
          signal({ bio: '' }),
          schema((path) => {
            required(path.bio, { message: 'Bio is required' });
          }),
        ),
    );

    const { container } = await render(TestComponent);

    await userEvent.click(page.getByRole('textbox', { name: 'Bio' }));
    await userEvent.tab();

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent('Bio is required');
    await expectNoA11yViolations(container);
  });

  it('a single required checkbox (not a cluster) in its invalid state has no violations', async () => {
    const TestComponent = defineFixtureComponent(
      'ngx-test-a11y-single-checkbox',
      `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <ngx-form-field-wrapper
            [formField]="testForm.agree"
            fieldName="agree"
          >
            <label for="agree">
              <input id="agree" type="checkbox" [formField]="testForm.agree" />
              I agree to the terms
            </label>
          </ngx-form-field-wrapper>
        </form>
      `,
      () =>
        form(
          signal({ agree: false }),
          schema((path) => {
            required(path.agree, { message: 'You must agree to the terms' });
          }),
        ),
    );

    const { container, fixture } = await render(TestComponent);

    // A single unchecked checkbox is not itself tabbable away from without
    // toggling it, so mark touched programmatically (same convention as the
    // cluster fixtures above) rather than via keyboard.
    fixture.componentInstance.testForm.agree().markAsTouched();
    await TestBed.inject(ApplicationRef).whenStable();

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent('You must agree to the terms');
    await expectNoA11yViolations(container);
  });

  it('a switch (checkbox with role="switch") in its invalid state has no violations', async () => {
    const TestComponent = defineFixtureComponent(
      'ngx-test-a11y-switch',
      `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <ngx-form-field-wrapper
            [formField]="testForm.updates"
            fieldName="updates"
          >
            <label for="updates">Email updates</label>
            <input
              id="updates"
              type="checkbox"
              role="switch"
              [formField]="testForm.updates"
            />
          </ngx-form-field-wrapper>
        </form>
      `,
      () =>
        form(
          signal({ updates: false }),
          schema((path) => {
            required(path.updates, { message: 'Choose a preference' });
          }),
        ),
    );

    const { container, fixture } = await render(TestComponent);

    fixture.componentInstance.testForm.updates().markAsTouched();
    await TestBed.inject(ApplicationRef).whenStable();

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent('Choose a preference');
    await expectNoA11yViolations(container);
  });

  it('appearance="plain" in its invalid state has no violations', async () => {
    const TestComponent = defineFixtureComponent(
      'ngx-test-a11y-plain',
      `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <ngx-form-field-wrapper
            [formField]="testForm.nickname"
            fieldName="nickname"
            appearance="plain"
          >
            <label for="nickname">Nickname</label>
            <input id="nickname" type="text" [formField]="testForm.nickname" />
          </ngx-form-field-wrapper>
        </form>
      `,
      () =>
        form(
          signal({ nickname: '' }),
          schema((path) => {
            required(path.nickname, { message: 'Nickname is required' });
          }),
        ),
    );

    const { container } = await render(TestComponent);

    await userEvent.click(page.getByRole('textbox', { name: 'Nickname' }));
    await userEvent.tab();

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent('Nickname is required');
    await expectNoA11yViolations(container);
  });

  it('orientation="horizontal" in its invalid state has no violations', async () => {
    const TestComponent = defineFixtureComponent(
      'ngx-test-a11y-horizontal',
      `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <ngx-form-field-wrapper
            [formField]="testForm.city"
            fieldName="city"
            orientation="horizontal"
          >
            <label for="city">City</label>
            <input id="city" type="text" [formField]="testForm.city" />
          </ngx-form-field-wrapper>
        </form>
      `,
      () =>
        form(
          signal({ city: '' }),
          schema((path) => {
            required(path.city, { message: 'City is required' });
          }),
        ),
    );

    const { container } = await render(TestComponent);

    await userEvent.click(page.getByRole('textbox', { name: 'City' }));
    await userEvent.tab();

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent('City is required');
    await expectNoA11yViolations(container);
  });

  it('prefix and suffix content around the control has no violations', async () => {
    const TestComponent = defineFixtureComponent(
      'ngx-test-a11y-prefix-suffix',
      `
        <form [formRoot]="testForm" ngxSignalForm>
          <ngx-form-field-wrapper
            [formField]="testForm.amount"
            fieldName="amount"
          >
            <span prefix aria-hidden="true">$</span>
            <label for="amount">Amount</label>
            <input id="amount" type="number" [formField]="testForm.amount" />
            <span suffix aria-hidden="true">.00</span>
          </ngx-form-field-wrapper>
          <ngx-form-field-wrapper
            [formField]="testForm.password"
            fieldName="password"
          >
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              [formField]="testForm.password"
            />
            <button suffix type="button">Show</button>
          </ngx-form-field-wrapper>
        </form>
      `,
      () => form(signal({ amount: 0, password: '' })),
    );

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(container.querySelector('[prefix]')).toBeTruthy();
    expect(container.querySelector('[suffix]')).toBeTruthy();
    await expectNoA11yViolations(container);
  });

  it('a role-less composite custom control in its invalid state has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-composite',
      imports: [
        FormField,
        NgxSignalFormToolkit,
        NgxFormField,
        NgxSignalFormControlSemanticsDirective,
      ],
      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <ngx-form-field-wrapper
            [formField]="testForm.rating"
            fieldName="rating"
            appearance="plain"
          >
            <label id="rating-label">Rating</label>
            <div
              id="rating"
              tabindex="0"
              ngxSignalFormControl="composite"
              ngxSignalFormControlAria="manual"
              aria-labelledby="rating-label"
            >
              ★★★☆☆
            </div>
          </ngx-form-field-wrapper>
        </form>
      `,
    })
    class CompositeControlComponent {
      readonly testForm = form(
        signal({ rating: 0 }),
        schema((path) => {
          validate(path.rating, (ctx) =>
            ctx.value() > 0
              ? null
              : { kind: 'required', message: 'Choose a rating' },
          );
        }),
      );
    }

    const { container, fixture } = await render(CompositeControlComponent);

    fixture.componentInstance.testForm.rating().markAsTouched();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(container.querySelector('#rating')).toHaveAttribute(
      'data-ngx-signal-form-control-kind',
      'composite',
    );
    await expectNoA11yViolations(container);
  });

  describe('shared focus-visibility helper', () => {
    it('shows a visible focus indicator when a <select> is tabbed into', async () => {
      const { container } = await render(
        `<button type="button" id="select-anchor">Before</button>
        <ngx-form-field-wrapper [formField]="field" appearance="outline">
          <label for="country-focus">Country</label>
          <select id="country-focus">
            <option value="us">United States</option>
          </select>
        </ngx-form-field-wrapper>`,
        {
          imports: [NgxFormFieldWrapper],
          componentProperties: { field: mockField() },
        },
      );

      await userEvent.click(
        container.querySelector<HTMLButtonElement>('#select-anchor')!,
      );
      await userEvent.tab();

      const content = container.querySelector<HTMLElement>(
        '.ngx-signal-form-field-wrapper__content',
      );
      expect(content).toBeTruthy();
      expectVisibleFocusIndicator(content!);
    });

    it('shows a visible focus indicator when a <textarea> is tabbed into', async () => {
      const { container } = await render(
        `<button type="button" id="textarea-anchor">Before</button>
        <ngx-form-field-wrapper [formField]="field" appearance="outline">
          <label for="bio-focus">Bio</label>
          <textarea id="bio-focus"></textarea>
        </ngx-form-field-wrapper>`,
        {
          imports: [NgxFormFieldWrapper],
          componentProperties: { field: mockField() },
        },
      );

      await userEvent.click(
        container.querySelector<HTMLButtonElement>('#textarea-anchor')!,
      );
      await userEvent.tab();

      const content = container.querySelector<HTMLElement>(
        '.ngx-signal-form-field-wrapper__content',
      );
      expect(content).toBeTruthy();
      expectVisibleFocusIndicator(content!);
    });
  });

  /**
   * `forced-colors: active` (Windows High Contrast Mode) run for the wrapper
   * plus the assistive components it composes with. Chromium repaints every
   * author color to a small OS palette under forced colors, which can hide
   * borders and focus rings that rely on a specific author color rather than
   * a system color keyword — a real fixture exercised the same way as the
   * dark-mode matrix (`form-field-wrapper.color-scheme.a11y.browser.spec.ts`)
   * is the only way to catch that.
   */
  it('has no WCAG 2.2 AA violations under forced-colors: active', async () => {
    const TestComponent = defineFixtureComponent(
      'ngx-test-a11y-forced-colors',
      `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <ngx-form-field-wrapper
            [formField]="testForm.name"
            fieldName="name"
            appearance="outline"
          >
            <label for="forced-colors-name">Full name</label>
            <input
              id="forced-colors-name"
              type="text"
              [formField]="testForm.name"
            />
            <ngx-form-field-hint id="forced-colors-name-hint"
              >As it appears on your ID.</ngx-form-field-hint
            >
          </ngx-form-field-wrapper>
        </form>
      `,
      () =>
        form(
          signal({ name: '' }),
          schema((path) => {
            required(path.name, { message: 'Full name is required' });
          }),
        ),
    );

    const { container } = await render(TestComponent, {
      imports: [NgxFormFieldHint],
    });

    await commands.emulateForcedColors('active');
    await userEvent.click(page.getByRole('textbox', { name: 'Full name' }));
    await userEvent.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent('Full name is required');
    await expectNoA11yViolations(container);
  });

  /**
   * Issue #501: the toolkit audit suspected that hint ids from
   * `<ngx-form-field-hint>` never reach a radio group's `aria-describedby` —
   * `resolveClusterAriaAttrs` (`form-field-cluster-aria.ts`) only ever
   * composes the group's required-hint, error, and warning ids into
   * `aria-describedby`, never a projected hint's id, and native `<input
   * type="radio">` controls are not eligible for auto-ARIA's own per-control
   * `aria-describedby` wiring (`auto-aria.ts`'s selector list excludes bare
   * radio inputs). A hint placed inside a radio cluster wrapper would then be
   * visible on screen but never announced as the group's description.
   */
  it.fails('exposes a hint placed inside a radio cluster through the group aria-describedby — known failure: hint ids never reach the cluster describedby. Tracked in #TBD-radio-cluster-hint-describedby', async () => {
    const TestComponent = defineFixtureComponent(
      'ngx-test-a11y-cluster-hint-describedby',
      `
          <form [formRoot]="testForm" ngxSignalForm>
            <ngx-form-field-wrapper
              [formField]="testForm.deliveryMethod"
              fieldName="delivery-method"
            >
              <span ngxFormFieldLabel>Delivery method</span>
              <div>
                <label>
                  <input
                    id="delivery-standard-hint-test"
                    type="radio"
                    [formField]="testForm.deliveryMethod"
                    value="standard"
                  />
                  Standard
                </label>
                <label>
                  <input
                    id="delivery-express-hint-test"
                    type="radio"
                    [formField]="testForm.deliveryMethod"
                    value="express"
                  />
                  Express
                </label>
              </div>
              <ngx-form-field-hint
                >Choose the option that best fits your timeline.</ngx-form-field-hint
              >
            </ngx-form-field-wrapper>
          </form>
        `,
      () => form(signal({ deliveryMethod: 'standard' })),
    );

    const { container } = await render(TestComponent, {
      imports: [NgxFormFieldHint],
    });
    await TestBed.inject(ApplicationRef).whenStable();

    const wrapper = container.querySelector('ngx-form-field-wrapper');
    const hint = container.querySelector('ngx-form-field-hint [id]');
    expect(hint).toBeTruthy();

    const describedBy = wrapper?.getAttribute('aria-describedby') ?? '';
    expect(describedBy.split(/\s+/u)).toContain(hint!.getAttribute('id'));
  });
});

/** Minimal mock field state, matching the plain-focus-indicator spec's own. */
function mockField() {
  const fieldState = {
    invalid: signal(false),
    touched: signal(false),
    errors: signal([]),
    valid: signal(true),
    dirty: signal(false),
    value: signal(''),
    required: signal(false),
  };
  return signal(() => fieldState);
}
