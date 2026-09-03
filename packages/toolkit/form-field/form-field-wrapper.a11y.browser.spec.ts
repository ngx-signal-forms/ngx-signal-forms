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
  NgxSignalFormToolkit,
  provideNgxSignalFormsConfig,
} from '@ngx-signal-forms/toolkit';
import { render } from '@testing-library/angular';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { NgxFormField } from './index';
import { expectNoA11yViolations } from '@ngx-signal-forms/toolkit/testing';

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
   * `selectionClusterDescribedBy` in `form-field-wrapper.ts`) that was
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
      // form-field-wrapper.ts) instead of the disallowed ARIA state.
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
   * `selectionClusterDescribedBy` composes the cluster's `aria-describedby`
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
      expect(secondId).toBeTruthy();
      expect(secondId).not.toBe(firstId);

      const input = container.querySelector('#password');
      const describedBy = input?.getAttribute('aria-describedby') ?? '';
      const describedByIds = describedBy.split(/\s+/u);
      expect(describedByIds).toContain(firstId);
      expect(describedByIds).toContain(secondId);

      await expectNoA11yViolations(container);
    });
  });
});
