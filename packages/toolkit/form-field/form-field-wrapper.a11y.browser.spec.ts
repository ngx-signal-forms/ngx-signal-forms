import {
  ApplicationRef,
  Component,
  model,
  signal,
  type Type,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormField,
  form,
  hidden,
  required,
  schema,
  validate,
  type FormValueControl,
} from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  provideNgxSignalFormsConfig,
} from '@ngx-signal-forms/toolkit';
import { NgxFormFieldHint } from '@ngx-signal-forms/toolkit/assistive';
import { render } from '@testing-library/angular';
import { commands, page, userEvent } from 'vitest/browser';
import { afterEach, describe, expect, it } from 'vitest';
import { NgxFormField } from './index';
import { NgxFormFieldWrapper } from './form-field-wrapper';
import { renderFixture as renderColorSchemeFixture } from './form-field-wrapper.color-scheme.fixture';
import {
  expectNoA11yViolations,
  expectVisibleFocusIndicator,
  findAlertContaining,
} from '../testing/a11y-internal';

declare module 'vitest/browser' {
  interface BrowserCommands {
    emulateColorScheme: (colorScheme: 'light' | 'dark' | null) => Promise<void>;
    emulateForcedColors: (
      forcedColors: 'active' | 'none' | null,
    ) => Promise<void>;
    emulateReducedMotion: (
      reducedMotion: 'reduce' | 'no-preference' | null,
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

    const { container, fixture } = await render(TestComponent);

    // Mark touched programmatically instead of click+tab: a headless
    // Chromium `<select>` does not reliably blur on `userEvent.tab()` in CI
    // (a different browser channel than a local run), so the field never
    // actually reached its touched, invalid state there and the error never
    // rendered — same convention the single-checkbox/switch fixtures below
    // already use for the same reason.
    fixture.componentInstance.testForm.country().markAsTouched();
    await TestBed.inject(ApplicationRef).whenStable();

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

    // A single checkbox is trivially tabbable — Tab moves focus without
    // toggling it, unlike Space/click. Marking touched programmatically
    // anyway keeps this fixture's setup symmetric with the checkbox-cluster
    // fixtures above, where the programmatic route is required (see their
    // own comments), rather than mixing conventions across the file.
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

  it('orientation="horizontal" in its invalid state has no violations, and lays the label beside the control', async () => {
    const TestComponent = defineFixtureComponent(
      'ngx-test-a11y-horizontal',
      `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <div style="width: 40rem;">
            <ngx-form-field-wrapper
              [formField]="testForm.city"
              fieldName="city"
              orientation="horizontal"
            >
              <label for="city">City</label>
              <input id="city" type="text" [formField]="testForm.city" />
            </ngx-form-field-wrapper>
          </div>
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

    const wrapper = container.querySelector('ngx-form-field-wrapper');
    expect(wrapper).toHaveAttribute('data-orientation', 'horizontal');

    // Side by side, not stacked: in a container wide enough to avoid the
    // narrow-container stacking query (see
    // form-field-wrapper.horizontal-container-query.browser.spec.ts), the
    // label's right edge sits at or before the control's left edge.
    const label = container.querySelector<HTMLElement>(
      '.ngx-signal-form-field-wrapper__label',
    )!;
    const input = container.querySelector<HTMLInputElement>('#city')!;
    expect(input.getBoundingClientRect().left).toBeGreaterThanOrEqual(
      label.getBoundingClientRect().right,
    );

    await expectNoA11yViolations(container);
  });

  it('prefix and suffix buttons around an invalid control have no violations', async () => {
    const TestComponent = defineFixtureComponent(
      'ngx-test-a11y-prefix-suffix',
      `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <ngx-form-field-wrapper
            [formField]="testForm.amount"
            fieldName="amount"
          >
            <button prefix type="button" aria-label="Choose currency">$</button>
            <label for="amount">Amount</label>
            <input
              id="amount"
              type="number"
              [formField]="testForm.amount"
            />
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
      () =>
        form(
          signal({ amount: 0, password: '' }),
          schema((path) => {
            required(path.password, { message: 'Password is required' });
            validate(path.amount, (ctx) =>
              ctx.value() > 0
                ? null
                : { kind: 'required', message: 'Amount is required' },
            );
          }),
        ),
    );

    const { container, fixture } = await render(TestComponent);

    // The amount field (behind the prefix button) needs its own invalid
    // state too — mark it touched programmatically rather than tabbing
    // through the prefix button, so this doesn't depend on where a
    // `<button prefix>` sits in the tab order.
    fixture.componentInstance.testForm.amount().markAsTouched();
    await userEvent.click(page.getByRole('textbox', { name: 'Password' }));
    await userEvent.tab();

    expect(container.querySelector('[prefix]')).toBeTruthy();
    expect(container.querySelector('[suffix]')).toBeTruthy();
    // Scoped to the entries actually carrying text: a bare `getByRole('alert')`
    // is ambiguous here — the mounted-but-empty alert shells for other,
    // still-valid fields in this fixture also match `role="alert"`.
    expect(findAlertContaining(container, 'Amount is required')).toBeTruthy();
    expect(findAlertContaining(container, 'Password is required')).toBeTruthy();
    await expectNoA11yViolations(container);
  });

  /**
   * A role-less custom control on the *default* auto-ARIA path, not the
   * `ariaMode="manual"` escape hatch: `RatingControl`'s host is a plain
   * component selector with no `role` attribute, but it implements
   * `FormValueControl` (one of the three `[formField]`-eligible host shapes
   * — see `FormField`'s own doc), so `NgxSignalFormAutoAria`'s
   * `[formField]:not(input):not(textarea):not(select)` selector branch
   * still matches it and manages its `aria-invalid`/`aria-describedby`
   * automatically, exactly as it would for a native input.
   */
  it('a role-less custom FormValueControl in its invalid state has no violations', async () => {
    @Component({
      selector: 'ngx-test-rating-control',
      template: `{{ value() }} of 5 stars`,
    })
    class RatingControl implements FormValueControl<number> {
      readonly value = model.required<number>();
    }

    @Component({
      selector: 'ngx-test-a11y-form-value-control',
      imports: [FormField, NgxSignalFormToolkit, NgxFormField, RatingControl],
      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <ngx-form-field-wrapper
            [formField]="testForm.rating"
            fieldName="rating"
            appearance="plain"
          >
            <label for="rating">Rating</label>
            <ngx-test-rating-control
              id="rating"
              [formField]="testForm.rating"
            />
          </ngx-form-field-wrapper>
        </form>
      `,
    })
    class FormValueControlComponent {
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

    const { container, fixture } = await render(FormValueControlComponent);

    fixture.componentInstance.testForm.rating().markAsTouched();
    await TestBed.inject(ApplicationRef).whenStable();

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent('Choose a rating');

    // Confirm auto-ARIA actually wired the role-less host up before trusting
    // the axe scan below to prove it: `aria-invalid` reflects the invalid
    // state, and `aria-describedby` links to the rendered error.
    const rating = container.querySelector('#rating');
    expect(rating).not.toHaveAttribute('role');
    expect(rating).toHaveAttribute('aria-invalid', 'true');
    expect(rating?.getAttribute('aria-describedby')?.split(/\s+/u)).toContain(
      'rating-error',
    );

    await expectNoA11yViolations(container);
  });

  describe('shared focus-visibility helper', () => {
    /** Clicks the preceding anchor, then tabs into the control right after it. */
    const tabIntoInput = async (
      container: HTMLElement,
      anchorId: string,
    ): Promise<void> => {
      await userEvent.click(
        container.querySelector<HTMLButtonElement>(`#${anchorId}`)!,
      );
      await userEvent.tab();
    };

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

      const content = container.querySelector<HTMLElement>(
        '.ngx-signal-form-field-wrapper__content',
      )!;
      const select =
        container.querySelector<HTMLSelectElement>('#country-focus')!;

      // Negative control: before the tab, nothing is focused yet, so the
      // helper must reject the resting (unfocused) style rather than pass
      // because the CSS happens to already look right.
      expect(() => {
        expectVisibleFocusIndicator(content);
      }).toThrow(/:focus-visible/u);

      await tabIntoInput(container, 'select-anchor');

      expect(document.activeElement).toBe(select);
      expectVisibleFocusIndicator(content);
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

      const content = container.querySelector<HTMLElement>(
        '.ngx-signal-form-field-wrapper__content',
      )!;
      const textarea =
        container.querySelector<HTMLTextAreaElement>('#bio-focus')!;

      expect(() => {
        expectVisibleFocusIndicator(content);
      }).toThrow(/:focus-visible/u);

      await tabIntoInput(container, 'textarea-anchor');

      expect(document.activeElement).toBe(textarea);
      expectVisibleFocusIndicator(content);
    });
  });

  /**
   * `forced-colors: active` (Windows High Contrast Mode) coverage for the
   * wrapper plus the assistive components it composes with. Chromium
   * repaints every author color to a small OS palette under forced colors,
   * which can hide borders and focus rings that rely on a specific author
   * color rather than a system color keyword.
   */
  describe('forced-colors: active', () => {
    afterEach(async () => {
      await commands.emulateForcedColors(null);
    });

    /**
     * Resolves a CSS system color keyword (`Highlight`, `Mark`) to the
     * value the emulated forced-colors palette gives it. The wrapper sets
     * `forced-color-adjust: none` on the textual container, so the browser
     * no longer adapts author colors there: only a system color keyword
     * follows the user's palette. Comparing against the resolved keyword
     * proves the focus styling comes from the forced-colors rule and not
     * from the ordinary author focus color.
     */
    const resolveSystemColor = (keyword: string): string => {
      const probe = document.createElement('div');
      probe.style.cssText = `forced-color-adjust: none; outline: 2px solid ${keyword}`;
      document.body.append(probe);
      const resolved = getComputedStyle(probe).outlineColor;
      probe.remove();
      return resolved;
    };

    /** Background twin of {@link resolveSystemColor}. */
    const resolveSystemBackground = (keyword: string): string => {
      const probe = document.createElement('div');
      probe.style.cssText = `forced-color-adjust: none; background: ${keyword}`;
      document.body.append(probe);
      const resolved = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return resolved;
    };

    /** Waits for the container's color transitions, so reads see final values. */
    const settleTransitions = async (): Promise<void> => {
      await expect
        .poll(
          () =>
            document
              .getAnimations()
              .filter((animation) => animation.playState === 'running').length,
        )
        .toBe(0);
    };

    it('applies the emulation and repaints the textual border from a forced-colors-only system color', async () => {
      // Default appearance. The outline appearance has its own specs below.
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-forced-colors-border',
        `
          <form [formRoot]="testForm" ngxSignalForm>
            <ngx-form-field-wrapper [formField]="testForm.name" fieldName="name">
              <label for="forced-colors-border-name">Full name</label>
              <input
                id="forced-colors-border-name"
                type="text"
                [formField]="testForm.name"
              />
            </ngx-form-field-wrapper>
          </form>
        `,
        () => form(signal({ name: '' })),
      );

      const { container } = await render(TestComponent);

      await commands.emulateForcedColors('active');
      await TestBed.inject(ApplicationRef).whenStable();

      // Proves the emulation actually applied, before trusting any style
      // read below — a no-op emulation would make the border assertion pass
      // for the wrong reason (the un-forced default is also a solid border).
      expect(window.matchMedia('(forced-colors: active)').matches).toBe(true);

      const content = container.querySelector<HTMLElement>(
        '.ngx-signal-form-field-wrapper__content',
      )!;
      const styles = getComputedStyle(content);
      // form-field-wrapper.css's `@media (forced-colors: active)` block maps
      // the textual border to `2px solid FieldText` — a forced-colors-only
      // system color, not the ordinary `color-mix()` border.
      expect(styles.borderStyle).toBe('solid');
      expect(styles.borderWidth).toBe('2px');
    });

    /**
     * #550: the outline appearance's own border rule has a two-class
     * `:host()` compound, so it outranks a one-class forced-colors rule in
     * any source order. The forced-colors block lists the outline selector
     * too. Without it, an outlined field keeps its 1px author border and
     * `--_outline-bg` background.
     */
    it('gives appearance="outline" the 2px FieldText border and Field background under forced-colors: active (#550)', async () => {
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-forced-colors-outline-border',
        `
          <form [formRoot]="testForm" ngxSignalForm>
            <ngx-form-field-wrapper
              [formField]="testForm.name"
              fieldName="name"
              appearance="outline"
            >
              <label for="forced-colors-outline-border-name">Full name</label>
              <input
                id="forced-colors-outline-border-name"
                type="text"
                [formField]="testForm.name"
              />
            </ngx-form-field-wrapper>
          </form>
        `,
        () => form(signal({ name: '' })),
      );

      const { container } = await render(TestComponent);

      await commands.emulateForcedColors('active');
      await TestBed.inject(ApplicationRef).whenStable();
      await settleTransitions();

      expect(window.matchMedia('(forced-colors: active)').matches).toBe(true);

      const content = container.querySelector<HTMLElement>(
        '.ngx-signal-form-field-wrapper__content',
      )!;
      const styles = getComputedStyle(content);
      expect(styles.borderStyle).toBe('solid');
      expect(styles.borderWidth).toBe('2px');
      expect(styles.borderTopColor).toBe(resolveSystemColor('FieldText'));
      expect(styles.backgroundColor).toBe(resolveSystemBackground('Field'));
    });

    it('gives an invalid appearance="outline" field a 2px Mark border under forced-colors: active (#550)', async () => {
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-forced-colors-outline-invalid',
        `
          <form [formRoot]="testForm" ngxSignalForm>
            <ngx-form-field-wrapper
              [formField]="testForm.name"
              fieldName="name"
              appearance="outline"
            >
              <label for="forced-colors-outline-invalid-name">Full name</label>
              <input
                id="forced-colors-outline-invalid-name"
                type="text"
                [formField]="testForm.name"
              />
            </ngx-form-field-wrapper>
          </form>
        `,
        () =>
          form(
            signal({ name: '' }),
            schema<{ name: string }>((path) => {
              required(path.name, { message: 'Full name is required' });
            }),
          ),
      );

      const { container, fixture } = await render(TestComponent);
      fixture.componentInstance.testForm.name().markAsTouched();
      await TestBed.inject(ApplicationRef).whenStable();
      await commands.emulateForcedColors('active');
      await settleTransitions();

      expect(container.querySelector('ngx-form-field-wrapper')).toHaveClass(
        'ngx-signal-form-field-wrapper--invalid',
      );
      const content = container.querySelector<HTMLElement>(
        '.ngx-signal-form-field-wrapper__content',
      )!;
      const styles = getComputedStyle(content);
      expect(styles.borderTopWidth).toBe('2px');
      expect(styles.borderTopColor).toBe(resolveSystemColor('Mark'));
    });

    /**
     * Reuses `form-field-wrapper.color-scheme.fixture.ts`'s shared fixture
     * and `renderFixture` helper: it already mounts the error summary,
     * marking legend, character count, hint, warning, and the fieldset's
     * panel error presentation in one render, so this covers the assistive
     * components the toolkit audit named without re-declaring a narrower
     * fixture.
     */
    it('has no WCAG 2.2 AA violations across the wrapper and assistive components under forced-colors: active', async () => {
      await commands.emulateForcedColors('active');
      expect(window.matchMedia('(forced-colors: active)').matches).toBe(true);

      const surface = await renderColorSchemeFixture(
        'background-color: Canvas; color: CanvasText',
        { tintInvalidSurface: true },
      );

      await expectNoA11yViolations(surface);
    });

    it('shows a solid 2px system-color focus outline under forced-colors: active, with no box-shadow', async () => {
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-forced-colors-focus',
        `
          <button type="button" id="forced-colors-focus-anchor">Before</button>
          <form [formRoot]="testForm" ngxSignalForm>
            <ngx-form-field-wrapper [formField]="testForm.name" fieldName="name">
              <label for="forced-colors-focus-name">Full name</label>
              <input
                id="forced-colors-focus-name"
                type="text"
                [formField]="testForm.name"
              />
            </ngx-form-field-wrapper>
          </form>
        `,
        () => form(signal({ name: '' })),
      );

      const { container } = await render(TestComponent);
      await commands.emulateForcedColors('active');

      await userEvent.click(
        container.querySelector<HTMLButtonElement>(
          '#forced-colors-focus-anchor',
        )!,
      );
      await userEvent.tab();
      await settleTransitions();

      const content = container.querySelector<HTMLElement>(
        '.ngx-signal-form-field-wrapper__content',
      )!;
      const styles = getComputedStyle(content);
      // The forced-colors focus rule neutralizes the ordinary color-mix()
      // box-shadow ring and draws a solid 2px `Highlight` outline instead —
      // the sole focus signal in this mode. On Angular 22.2 the ordinary
      // nested focus rule out-specified it (#556): the author focus color
      // and ring came back, and they do not follow the user's palette.
      expect(styles.outlineStyle).toBe('solid');
      expect(styles.outlineWidth).toBe('2px');
      expect(styles.outlineColor).toBe(resolveSystemColor('Highlight'));
      expect(styles.borderTopColor).toBe(resolveSystemColor('Highlight'));
      expect(styles.boxShadow).toBe('none');
    });

    it('keeps the Mark border and draws the Highlight focus outline on an invalid field under forced-colors: active', async () => {
      // The invalid state has its own forced-colors focus rule for the
      // border and box-shadow. The outline still comes from the shared
      // forced-colors focus rule, so an invalid field must show both
      // signals: `Mark` for the error, `Highlight` for focus (#556).
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-forced-colors-invalid-focus',
        `
          <button type="button" id="forced-colors-invalid-focus-anchor">Before</button>
          <form [formRoot]="testForm" ngxSignalForm>
            <ngx-form-field-wrapper [formField]="testForm.name" fieldName="name">
              <label for="forced-colors-invalid-focus-name">Full name</label>
              <input
                id="forced-colors-invalid-focus-name"
                type="text"
                [formField]="testForm.name"
              />
            </ngx-form-field-wrapper>
          </form>
        `,
        () =>
          form(
            signal({ name: '' }),
            schema<{ name: string }>((path) => {
              required(path.name, { message: 'Full name is required' });
            }),
          ),
      );

      const { container, fixture } = await render(TestComponent);
      fixture.componentInstance.testForm.name().markAsTouched();
      await TestBed.inject(ApplicationRef).whenStable();
      await commands.emulateForcedColors('active');

      await userEvent.click(
        container.querySelector<HTMLButtonElement>(
          '#forced-colors-invalid-focus-anchor',
        )!,
      );
      await userEvent.tab();
      await settleTransitions();

      expect(container.querySelector('ngx-form-field-wrapper')).toHaveClass(
        'ngx-signal-form-field-wrapper--invalid',
      );
      const content = container.querySelector<HTMLElement>(
        '.ngx-signal-form-field-wrapper__content',
      )!;
      const styles = getComputedStyle(content);
      expect(styles.outlineStyle).toBe('solid');
      expect(styles.outlineColor).toBe(resolveSystemColor('Highlight'));
      expect(styles.borderTopColor).toBe(resolveSystemColor('Mark'));
      expect(styles.boxShadow).toBe('none');
    });

    /**
     * #550: the outline appearance's own `:focus-within` rule outranks a
     * one-class forced-colors focus rule. Without the outline selector in
     * the forced-colors block, the author border color and box-shadow ring
     * stay on an outlined field and do not follow the user's palette.
     */
    it('gives a focused appearance="outline" field a Highlight border and outline with no box-shadow under forced-colors: active (#550)', async () => {
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-forced-colors-outline-focus',
        `
          <button type="button" id="forced-colors-outline-focus-anchor">Before</button>
          <form [formRoot]="testForm" ngxSignalForm>
            <ngx-form-field-wrapper
              [formField]="testForm.name"
              fieldName="name"
              appearance="outline"
            >
              <label for="forced-colors-outline-focus-name">Full name</label>
              <input
                id="forced-colors-outline-focus-name"
                type="text"
                [formField]="testForm.name"
              />
            </ngx-form-field-wrapper>
          </form>
        `,
        () => form(signal({ name: '' })),
      );

      const { container } = await render(TestComponent);
      await commands.emulateForcedColors('active');

      await userEvent.click(
        container.querySelector<HTMLButtonElement>(
          '#forced-colors-outline-focus-anchor',
        )!,
      );
      await userEvent.tab();
      await settleTransitions();

      const content = container.querySelector<HTMLElement>(
        '.ngx-signal-form-field-wrapper__content',
      )!;
      const styles = getComputedStyle(content);
      expect(styles.boxShadow).toBe('none');
      expect(styles.borderTopWidth).toBe('2px');
      expect(styles.borderTopColor).toBe(resolveSystemColor('Highlight'));
      expect(styles.outlineStyle).toBe('solid');
      expect(styles.outlineColor).toBe(resolveSystemColor('Highlight'));
    });

    it('keeps the Mark border on a focused invalid appearance="outline" field under forced-colors: active (#550)', async () => {
      // The outline focus selector must not outrank the invalid focus rule:
      // the border keeps the error signal, the outline shows focus.
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-forced-colors-outline-invalid-focus',
        `
          <button type="button" id="forced-colors-outline-invalid-focus-anchor">Before</button>
          <form [formRoot]="testForm" ngxSignalForm>
            <ngx-form-field-wrapper
              [formField]="testForm.name"
              fieldName="name"
              appearance="outline"
            >
              <label for="forced-colors-outline-invalid-focus-name">Full name</label>
              <input
                id="forced-colors-outline-invalid-focus-name"
                type="text"
                [formField]="testForm.name"
              />
            </ngx-form-field-wrapper>
          </form>
        `,
        () =>
          form(
            signal({ name: '' }),
            schema<{ name: string }>((path) => {
              required(path.name, { message: 'Full name is required' });
            }),
          ),
      );

      const { container, fixture } = await render(TestComponent);
      fixture.componentInstance.testForm.name().markAsTouched();
      await TestBed.inject(ApplicationRef).whenStable();
      await commands.emulateForcedColors('active');

      await userEvent.click(
        container.querySelector<HTMLButtonElement>(
          '#forced-colors-outline-invalid-focus-anchor',
        )!,
      );
      await userEvent.tab();
      await settleTransitions();

      expect(container.querySelector('ngx-form-field-wrapper')).toHaveClass(
        'ngx-signal-form-field-wrapper--invalid',
      );
      const content = container.querySelector<HTMLElement>(
        '.ngx-signal-form-field-wrapper__content',
      )!;
      const styles = getComputedStyle(content);
      expect(styles.borderTopWidth).toBe('2px');
      expect(styles.borderTopColor).toBe(resolveSystemColor('Mark'));
      expect(styles.outlineColor).toBe(resolveSystemColor('Highlight'));
      expect(styles.boxShadow).toBe('none');
    });
  });

  /**
   * `prefers-reduced-motion: reduce`. Three independent motion sources the
   * toolkit ships each have their own `@media (prefers-reduced-motion:
   * reduce)` override — a spec exercising only one would miss a regression
   * in either of the others.
   */
  describe('prefers-reduced-motion: reduce', () => {
    afterEach(async () => {
      await commands.emulateReducedMotion(null);
    });

    it('disables the inline error message entrance animation', async () => {
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-reduced-motion-error',
        `
          <form [formRoot]="testForm" ngxSignalForm errorStrategy="immediate">
            <ngx-form-field-wrapper
              [formField]="testForm.name"
              fieldName="name"
            >
              <label for="reduced-motion-name">Full name</label>
              <input
                id="reduced-motion-name"
                type="text"
                [formField]="testForm.name"
              />
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

      const { container } = await render(TestComponent);
      await TestBed.inject(ApplicationRef).whenStable();

      const errorEl = container.querySelector<HTMLElement>(
        '.ngx-form-field-error--error',
      )!;
      expect(errorEl.textContent).toContain('Full name is required');
      // form-field-error.css's default `--_error-animation-default` plays
      // `ngx-status-slide-in` on every non-empty error message.
      expect(getComputedStyle(errorEl).animationName).toBe(
        'ngx-status-slide-in',
      );

      await commands.emulateReducedMotion('reduce');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(getComputedStyle(errorEl).animationName).toBe('none');
    });

    it("disables the wrapper's assistive-row transition", async () => {
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-reduced-motion-assistive',
        `
          <form [formRoot]="testForm" ngxSignalForm>
            <ngx-form-field-wrapper [formField]="testForm.bio" fieldName="bio">
              <label for="reduced-motion-bio">Bio</label>
              <input
                id="reduced-motion-bio"
                type="text"
                [formField]="testForm.bio"
              />
              <ngx-form-field-hint>A short bio.</ngx-form-field-hint>
            </ngx-form-field-wrapper>
          </form>
        `,
        () => form(signal({ bio: '' })),
      );

      const { container } = await render(TestComponent, {
        imports: [NgxFormFieldHint],
      });
      await TestBed.inject(ApplicationRef).whenStable();

      const assistive = container.querySelector<HTMLElement>(
        '.ngx-signal-form-field-wrapper__assistive',
      )!;
      expect(assistive).toBeTruthy();
      expect(getComputedStyle(assistive).transitionProperty).not.toBe('none');

      await commands.emulateReducedMotion('reduce');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(getComputedStyle(assistive).transitionProperty).toBe('none');
    });

    it("disables the panel error presentation's entrance transform", async () => {
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-reduced-motion-panel',
        `
          <form [formRoot]="testForm" ngxSignalForm>
            <fieldset ngxFormFieldset [field]="testForm.passwords">
              <legend>Passwords</legend>
              <ngx-form-field-wrapper
                [formField]="testForm.passwords.password"
                fieldName="password"
              >
                <label for="reduced-motion-password">Password</label>
                <input
                  id="reduced-motion-password"
                  type="password"
                  [formField]="testForm.passwords.password"
                />
              </ngx-form-field-wrapper>
              <ngx-form-field-wrapper
                [formField]="testForm.passwords.confirm"
                fieldName="confirm"
              >
                <label for="reduced-motion-confirm">Confirm password</label>
                <input
                  id="reduced-motion-confirm"
                  type="password"
                  [formField]="testForm.passwords.confirm"
                />
              </ngx-form-field-wrapper>
            </fieldset>
          </form>
        `,
        // Both empty and equal: the cross-field validator stays valid, so
        // the fieldset's panel error renders in its `--empty` (not-yet-
        // shown) state — exactly the state the entrance transform applies
        // to before the panel is ever populated.
        () => form(signal({ passwords: { password: '', confirm: '' } })),
      );

      const { container } = await render(TestComponent);
      await TestBed.inject(ApplicationRef).whenStable();

      const panelError = container.querySelector<HTMLElement>(
        'ngx-form-field-error[data-presentation="panel"] .ngx-form-field-error--empty',
      )!;
      expect(panelError).toBeTruthy();
      expect(getComputedStyle(panelError).transform).not.toBe('none');

      await commands.emulateReducedMotion('reduce');
      await TestBed.inject(ApplicationRef).whenStable();

      expect(getComputedStyle(panelError).transform).toBe('none');
    });
  });

  /**
   * Dark mode over the wrapper variants added in this file (issue #501) —
   * one pass covering every new control kind and chrome combination, rather
   * than duplicating the full valid/invalid matrix per variant. The
   * `color-scheme: dark` ancestor is the toolkit's one supported dark-mode
   * trigger (see `form-field-wrapper.color-scheme.a11y.browser.spec.ts`'s
   * own doc); no class or OS signal is involved.
   */
  it('has no WCAG 2.2 AA violations for the new variants under an ancestor color-scheme: dark', async () => {
    const TestComponent = defineFixtureComponent(
      'ngx-test-a11y-dark-variants',
      `
        <div
          style="color-scheme: dark; background-color: #1f2937; color: #f9fafb; padding: 1rem;"
        >
        <button type="button" id="dark-variants-anchor">Before</button>
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
          <ngx-form-field-wrapper [formField]="testForm.country" fieldName="country">
            <label for="dark-country">Country</label>
            <select id="dark-country" [formField]="testForm.country">
              <option value="">Select…</option>
              <option value="us">United States</option>
            </select>
          </ngx-form-field-wrapper>
          <ngx-form-field-wrapper [formField]="testForm.bio" fieldName="bio">
            <label for="dark-bio">Bio</label>
            <textarea id="dark-bio" [formField]="testForm.bio"></textarea>
          </ngx-form-field-wrapper>
          <ngx-form-field-wrapper [formField]="testForm.agree" fieldName="agree">
            <label for="dark-agree">
              <input id="dark-agree" type="checkbox" [formField]="testForm.agree" />
              I agree to the terms
            </label>
          </ngx-form-field-wrapper>
          <ngx-form-field-wrapper [formField]="testForm.updates" fieldName="updates">
            <label for="dark-updates">Email updates</label>
            <input
              id="dark-updates"
              type="checkbox"
              role="switch"
              [formField]="testForm.updates"
            />
          </ngx-form-field-wrapper>
          <ngx-form-field-wrapper
            [formField]="testForm.nickname"
            fieldName="nickname"
            appearance="plain"
          >
            <label for="dark-nickname">Nickname</label>
            <input id="dark-nickname" type="text" [formField]="testForm.nickname" />
          </ngx-form-field-wrapper>
          <ngx-form-field-wrapper
            [formField]="testForm.city"
            fieldName="city"
            orientation="horizontal"
          >
            <label for="dark-city">City</label>
            <input id="dark-city" type="text" [formField]="testForm.city" />
          </ngx-form-field-wrapper>
          <ngx-form-field-wrapper [formField]="testForm.amount" fieldName="amount">
            <span prefix aria-hidden="true">$</span>
            <label for="dark-amount">Amount</label>
            <input id="dark-amount" type="number" [formField]="testForm.amount" />
            <span suffix aria-hidden="true">.00</span>
          </ngx-form-field-wrapper>
        </form>
        </div>
      `,
      () =>
        form(
          signal({
            country: '',
            bio: '',
            agree: false,
            updates: false,
            nickname: '',
            city: '',
            amount: 0,
          }),
          schema((path) => {
            required(path.country, { message: 'Country is required' });
            required(path.bio, { message: 'Bio is required' });
            required(path.agree, { message: 'You must agree to the terms' });
            required(path.updates, { message: 'Choose a preference' });
            required(path.nickname, { message: 'Nickname is required' });
            required(path.city, { message: 'City is required' });
          }),
        ),
    );

    const { container } = await render(TestComponent);

    // Tab through every field in document order, touching (and blurring)
    // each one in turn, so every wrapper renders its invalid-state chrome
    // under the dark ancestor at once — the same "everything visible at
    // once" approach the dark-mode matrix in
    // `form-field-wrapper.color-scheme.a11y.browser.spec.ts` uses.
    await userEvent.click(
      container.querySelector<HTMLButtonElement>('#dark-variants-anchor')!,
    );
    for (let i = 0; i < 7; i += 1) {
      // eslint-disable-next-line no-await-in-loop -- sequential keyboard
      // navigation must happen one Tab at a time.
      await userEvent.tab();
    }
    await TestBed.inject(ApplicationRef).whenStable();

    for (const message of [
      'Country is required',
      'Bio is required',
      'You must agree to the terms',
      'Choose a preference',
      'Nickname is required',
      'City is required',
    ]) {
      expect(container.textContent).toContain(message);
    }

    await expectNoA11yViolations(container);
  });

  /**
   * A `:root.dark` class scoping `color-scheme: dark` (rather than the
   * toolkit-supported ancestor `color-scheme` used above) — a shape some
   * consumer apps use for their own dark-mode toggle. The toolkit itself
   * declares no `.dark` selector (see `form-field-wrapper.color-scheme.a11y.
   * browser.spec.ts`'s own doc: the only supported trigger is `color-scheme`
   * itself), so this rule is authored by the test, standing in for a
   * consumer's own stylesheet — it proves the toolkit's `light-dark()`
   * tokens follow *any* app-authored `color-scheme` source, not just an
   * inline `style` attribute.
   */
  it('has no WCAG 2.2 AA violations for a <select> under a :root.dark { color-scheme: dark } class', async () => {
    const style = document.createElement('style');
    // `color-scheme` alone is a rendering hint, not a paintable CSS
    // property axe's contrast algorithm reads — it darkens the UA-painted
    // canvas layer, but axe still walks the DOM's own `background-color`
    // chain and falls back to assuming white when every ancestor is
    // transparent. Real consumer `.dark` classes pair `color-scheme` with an
    // actual dark background for exactly this reason (the other dark-mode
    // specs in `form-field-wrapper.color-scheme.a11y.browser.spec.ts` do the
    // same, explicitly), so this rule does too.
    style.textContent =
      ':root.dark { color-scheme: dark; background-color: #1f2937; color: #f9fafb; }';
    document.head.append(style);
    document.documentElement.classList.add('dark');

    try {
      const TestComponent = defineFixtureComponent(
        'ngx-test-a11y-dark-class-select',
        `
          <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-touch">
            <ngx-form-field-wrapper
              [formField]="testForm.country"
              fieldName="country"
            >
              <label for="dark-class-country">Country</label>
              <select id="dark-class-country" [formField]="testForm.country">
                <option value="">Select…</option>
                <option value="us">United States</option>
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

      const { container, fixture } = await render(TestComponent);

      // See the equivalent fixture above: a headless Chromium `<select>`
      // does not reliably blur on `userEvent.tab()` in CI, so mark touched
      // programmatically instead.
      fixture.componentInstance.testForm.country().markAsTouched();
      await TestBed.inject(ApplicationRef).whenStable();

      await expect
        .element(page.getByRole('alert'))
        .toHaveTextContent('Country is required');
      await expectNoA11yViolations(container);
    } finally {
      document.documentElement.classList.remove('dark');
      style.remove();
    }
  });

  /**
   * Issue #501 / #546: the toolkit audit suspected that hint ids from
   * `<ngx-form-field-hint>` never reach a radio group's `aria-describedby`,
   * reasoning from `resolveClusterAriaAttrs` alone (`form-field-cluster-
   * aria.ts`) — that pure function only ever composes the group's
   * required-hint, error, and warning ids, never a projected hint's id.
   *
   * That reasoning misses that `NgxSignalFormAutoAria` *also* matches the
   * cluster wrapper host itself: its selector's last branch,
   * `[formField]:not(input):not(textarea):not(select)`, matches
   * `<ngx-form-field-wrapper [formField]="...">` too, since the wrapper is
   * none of those three tags. Auto-aria's own `aria-describedby` computation
   * — the toolkit's general "combine error/warning/hint ids" mechanism — is
   * what actually wires the hint's id in, independently of
   * `resolveClusterAriaAttrs`. Verified empirically both with the field
   * valid (hint alone) and touched-invalid (hint alongside the error id):
   * the hint id is present in both. The suspected gap does not reproduce, so
   * this asserts the real (working) contract instead of a known failure.
   */
  it('exposes a hint placed inside a radio cluster through the group aria-describedby', async () => {
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

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const wrapper = container.querySelector('ngx-form-field-wrapper');
    // `NgxFormFieldHint` puts its id on its own host element (`hint.ts`'s
    // `[attr.id]: 'resolvedId()'` host binding), not on a descendant, so
    // this queries the host itself rather than `ngx-form-field-hint [id]`
    // (which is always null).
    const hint = container.querySelector('ngx-form-field-hint');
    expect(hint).toBeTruthy();
    expect(hint!.id).toBeTruthy();

    const describedBy = wrapper?.getAttribute('aria-describedby') ?? '';
    expect(describedBy.split(/\s+/u)).toContain(hint!.id);

    await expectNoA11yViolations(container);
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
