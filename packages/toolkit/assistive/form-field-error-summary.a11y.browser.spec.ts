import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, required, schema } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { render } from '@testing-library/angular';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldErrorSummary } from './form-field-error-summary';
import {
  expectNoA11yViolations,
  findAlertContaining,
  WCAG_22_AA_TAGS,
} from '@ngx-signal-forms/toolkit/testing';

/**
 * WCAG 2.2 AA conformance gate for `NgxFormFieldErrorSummary`.
 *
 * Scanned in both accessible states: empty (the live region must still be
 * present per WCAG 4.1.3 — see the wrapper spec's twin) and populated after
 * a failed submit, which is the summary's documented usage — auto-focusing
 * onto itself and rendering one clickable entry per invalid field.
 *
 * The populated state currently has two real, pre-existing violations in the
 * default `.ngx-form-field-error-summary__link` styling (`form-field-error-
 * summary.ts`), tracked in
 * [#299](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/299):
 *
 * - `color-contrast`: the default link color `#dc2626` on the summary's
 *   `#fef2f2` background resolves to ~4.41:1, just under the 4.5:1 minimum
 *   for 14px text (WCAG 1.4.3).
 * - `target-size`: `all: unset` on the link strips its padding, leaving a
 *   touch target shorter than the 24px minimum (WCAG 2.5.8).
 *
 * The second test below asserts on the *exact* violation set rather than
 * wrapping a whole `it.fails`/`expectNoA11yViolations` call: the render and
 * the two summary-content checks stay normal hard assertions (so a
 * functional regression still fails loudly), and only the two known,
 * tracked rule IDs are allowed through the scan — any other violation, or a
 * component-driven disappearance of these two once #299 lands, fails the
 * test and forces this spec to be updated.
 */
describe('NgxFormFieldErrorSummary — WCAG 2.2 AA conformance', () => {
  it('the empty summary before submission has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-summary-empty',
      imports: [
        FormField,
        NgxSignalFormToolkit,
        NgxFormField,
        NgxFormFieldErrorSummary,
      ],
      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-submit">
          <ngx-form-field-error-summary [formTree]="testForm" />
          <ngx-form-field-wrapper
            [formField]="testForm.email"
            fieldName="email"
          >
            <label for="email">Email address</label>
            <input id="email" type="email" [formField]="testForm.email" />
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

    // Scope to the summary's own live region, not a bare `[role="alert"]`
    // query — the wrapped field mounts its own always-present alert region
    // too (see the class doc's WCAG 4.1.3 note), so an unscoped query would
    // still pass even if `NgxFormFieldErrorSummary` stopped rendering its
    // live region entirely.
    const summaryAlert = container.querySelector(
      'ngx-form-field-error-summary [role="alert"]',
    );
    expect(summaryAlert).toBeTruthy();
    expect(summaryAlert?.textContent?.trim()).toBe('');
    await expectNoA11yViolations(container);
  });

  it('a populated summary after a failed submit has only the tracked #299 violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-summary-populated',
      imports: [
        FormField,
        NgxSignalFormToolkit,
        NgxFormField,
        NgxFormFieldErrorSummary,
      ],
      template: `
        <form [formRoot]="testForm" ngxSignalForm errorStrategy="on-submit">
          <ngx-form-field-error-summary
            [formTree]="testForm"
            [submittedStatus]="'submitted'"
            summaryLabel="Please fix the following errors:"
          />
          <ngx-form-field-wrapper [formField]="testForm.name" fieldName="name">
            <label for="name">Full name</label>
            <input id="name" type="text" [formField]="testForm.name" />
          </ngx-form-field-wrapper>
          <ngx-form-field-wrapper
            [formField]="testForm.email"
            fieldName="email"
          >
            <label for="email">Email address</label>
            <input id="email" type="email" [formField]="testForm.email" />
          </ngx-form-field-wrapper>
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ name: '', email: '' });
      readonly testForm = form(
        this.#model,
        schema((path) => {
          required(path.name, { message: 'Name is required' });
          required(path.email, { message: 'Email is required' });
        }),
      );
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    // Hard functional assertions: the summary rendered and aggregated both
    // field errors. These fail loudly on any regression regardless of the
    // tracked styling violations below.
    const summaryAlert = findAlertContaining(
      container,
      'Please fix the following errors',
    );
    expect(summaryAlert?.textContent).toContain('Name is required');
    expect(summaryAlert?.textContent).toContain('Email is required');

    // Accessibility assertion: only the two rule IDs tracked in #299 are
    // allowed through. `expectNoA11yViolations` isn't used here because it
    // throws on ANY violation — this test instead asserts the exact
    // violation set, so it hard-fails on a new/different violation (a real
    // regression) just as much as it will once the tracked two are fixed
    // (a signal to update this spec and close #299).
    const results = await axe.run(container, {
      runOnly: { type: 'tag', values: [...WCAG_22_AA_TAGS] },
      resultTypes: ['violations'],
    });
    const violationIds = results.violations
      .map((violation) => violation.id)
      .toSorted();
    expect(violationIds).toEqual(['color-contrast', 'target-size']);
  });
});
