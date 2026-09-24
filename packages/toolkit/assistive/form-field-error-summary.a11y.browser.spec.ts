import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, required, schema } from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { NgxFormFieldErrorSummary } from './form-field-error-summary';
import {
  expectNoA11yViolations,
  findAlertContaining,
} from '@ngx-signal-forms/toolkit/testing';

/**
 * WCAG 2.2 AA conformance gate for `NgxFormFieldErrorSummary`.
 *
 * Scanned in both accessible states: empty (the live region must still be
 * present per WCAG 4.1.3 — see the wrapper spec's twin) and populated after
 * a failed submit, which is the summary's documented usage — auto-focusing
 * onto itself and rendering one clickable entry per invalid field.
 *
 * The populated state previously had two real violations in the default
 * `.ngx-form-field-error-summary__link` styling (`form-field-error-
 * summary.ts`), tracked and fixed in
 * [#299](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/299):
 *
 * - `color-contrast`: the default link color was `#dc2626`, which on the
 *   summary's `#fef2f2` background resolves to ~4.41:1, just under the
 *   4.5:1 minimum for 14px text (WCAG 1.4.3). The default is now `#b91c1c`
 *   (~5.9:1).
 * - `target-size`: `all: unset` on the link stripped its box model, leaving
 *   a touch target shorter than the 24px minimum (WCAG 2.5.8). The link now
 *   sets `display: inline-flex` plus a `min-block-size` so the 24x24px
 *   minimum applies.
 *
 * Both are fixed, so the populated-state scan below now asserts zero
 * violations, same as the empty-state scan above it.
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

  it('a populated summary after a failed submit has no violations', async () => {
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
    // accessibility scan below.
    const summaryAlert = findAlertContaining(
      container,
      'Please fix the following errors',
    );
    expect(summaryAlert?.textContent).toContain('Name is required');
    expect(summaryAlert?.textContent).toContain('Email is required');

    await expectNoA11yViolations(container);
  });
});

/**
 * Real-browser coverage for #497: the summary must have a heading and an
 * accessible name, and clicking an entry must move focus onto the real
 * field. jsdom's accessible-name computation and focus handling are close
 * enough to a real browser for most specs, but a WCAG 1.3.1/2.4.3/2.4.6/4.1.2
 * fix like this one is exactly the kind of thing that can pass in jsdom and
 * fail in Chrome (or a real screen reader) — `form-field-error-summary.
 * spec.ts` already covers the same contract in jsdom; this file is the real-
 * browser twin. See `form-field-error-summary.spec.ts:260-358` for the
 * jsdom-only focus-movement coverage this complements.
 */
describe('NgxFormFieldErrorSummary — heading, accessible name, and focus movement (#497)', () => {
  it('renders the label as a level-2 heading and names the focused summary after it', async () => {
    @Component({
      selector: 'ngx-test-a11y-summary-heading',
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

    // A real heading role at the documented default level (WCAG 2.4.6).
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.textContent?.trim()).toBe(
      'Please fix the following errors:',
    );
    expect(heading.id).toBeTruthy();

    // The summary auto-focuses itself on a failed submit (`autoFocus`
    // defaults to `true`). The focused host must be *named* after that
    // heading via `aria-labelledby` (WCAG 1.3.1, 2.4.6, 4.1.2) — a real
    // Chrome accessibility tree, not just jsdom, is what actually resolves
    // this reference into an accessible name for a screen reader.
    const summaryHost = container.querySelector('ngx-form-field-error-summary');
    expect(document.activeElement).toBe(summaryHost);
    expect(summaryHost?.getAttribute('aria-labelledby')).toBe(heading.id);
  });

  it('moves focus to the invalid field when its summary entry is activated', async () => {
    @Component({
      selector: 'ngx-test-a11y-summary-focus-movement',
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
          />
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

    await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const entry = screen.getByRole('button', {
      name: /email\s*:\s*Email is required/iu,
    });
    await userEvent.click(entry);

    expect(document.activeElement).toBe(screen.getByLabelText('Email address'));
  });
});
