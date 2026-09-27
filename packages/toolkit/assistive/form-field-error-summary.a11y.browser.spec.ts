import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField, form, required, schema } from '@angular/forms/signals';
import type { SubmittedStatus } from '@ngx-signal-forms/toolkit';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { NgxFormFieldErrorSummary } from './form-field-error-summary';
import {
  expectNoA11yViolations,
  findAlertContaining,
} from '../testing/a11y-internal';

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

    // A real heading element at the documented default level (WCAG 2.4.6).
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.textContent?.trim()).toBe(
      'Please fix the following errors:',
    );
    expect(heading.tagName.toLowerCase()).toBe('h2');
    expect(heading.id).toBeTruthy();

    // The summary auto-focuses itself on a failed submit (`autoFocus`
    // defaults to `true`). The focused host must have `role="group"` (a
    // role-less custom element computes to the generic role, which ARIA
    // 1.2 forbids naming) and its *computed* accessible name — not just the
    // `aria-labelledby` attribute — must resolve to the heading text in a
    // real Chrome accessibility tree (WCAG 1.3.1, 2.4.6, 4.1.2).
    const summaryHost = container.querySelector('ngx-form-field-error-summary');
    expect(document.activeElement).toBe(summaryHost);
    expect(summaryHost).toHaveRole('group');
    expect(summaryHost).toHaveAccessibleName(
      'Please fix the following errors:',
    );
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

  /**
   * Browser twin of `form-field-error-summary.spec.ts`'s "moves focus to the
   * summary host the first time entries appear" (issue #501 — moving that
   * jsdom-only focus-movement coverage to a real browser). Same GOV.UK / WAI
   * error-summary pattern as #497 above: focus should move to the summary
   * host the first time it gains entries, and NOT be stolen again on a later
   * update — jsdom's focus handling is close enough to Chrome for most
   * specs, but this exact contract already shipped one regression (#497)
   * that jsdom alone did not catch.
   *
   * The "not again" half needs an update that actually *changes* the entry
   * list — fixing one of two invalid fields, so the summary re-renders with
   * one fewer entry — not a no-op re-render. A no-op update can't fail this
   * assertion regardless of whether the "only focus once" guard works, since
   * nothing would trigger a refocus attempt either way; the fix below moves
   * focus into the very field the user is correcting, so a stolen-focus
   * regression is directly observable as focus landing back on the summary
   * instead of staying in the input.
   */
  it('moves focus to the summary host the first time entries appear, and not again when the entry list changes on a later update', async () => {
    @Component({
      selector: 'ngx-test-a11y-summary-first-appearance',
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
            [submittedStatus]="submittedStatus()"
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
      readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
    }

    const { container, fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    // Before submit, the summary shell is mounted but empty (WCAG 4.1.3),
    // and focus stays wherever the harness left it.
    expect(
      container
        .querySelector('ngx-form-field-error-summary [role="alert"]')
        ?.textContent?.trim() ?? '',
    ).toBe('');

    fixture.componentInstance.submittedStatus.set('submitted');
    fixture.detectChanges();
    await fixture.whenStable();

    const summaryHost = container.querySelector('ngx-form-field-error-summary');
    expect(document.activeElement).toBe(summaryHost);
    // The focus target is the documented programmatic-focus contract, not
    // just an incidental `role="group"` element: `tabindex="-1"` is what
    // makes a non-interactive host focusable via script in the first place.
    expect(summaryHost).toHaveAttribute('tabindex', '-1');

    // Fix the email field: the entry list genuinely shrinks from two entries
    // to one, a real update to the (already-populated) list — not a no-op.
    const emailInput = container.querySelector<HTMLInputElement>('#email')!;
    await userEvent.type(emailInput, 'ada@example.com');
    await fixture.whenStable();

    // Focus stayed with the user's typing; the summary's re-render did not
    // steal it back.
    expect(document.activeElement).toBe(emailInput);
    expect(document.activeElement).not.toBe(summaryHost);
  });

  /**
   * The component's own doc comment on its focus latch (`form-field-error-
   * summary.ts`): "We re-arm the latch when the summary disappears so the
   * next '0 → N' transition focuses again." The spec above only ever
   * proves the "not again while still visible" half; it never drives
   * `hasErrors()` back to `false`, so it can't tell a working re-arm from a
   * latch that never resets at all. This drives the full promised cycle:
   * 0 errors → N errors (first focus) → back to 0 (latch re-arms) → N again
   * (must focus a second time).
   */
  it('re-focuses the summary host on a second 0 → N transition after all errors clear', async () => {
    @Component({
      selector: 'ngx-test-a11y-summary-latch-rearm',
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
            [submittedStatus]="submittedStatus()"
          />
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
      readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
    }

    const { container, fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const nameInput = container.querySelector<HTMLInputElement>('#name')!;
    const summaryHost = container.querySelector(
      'ngx-form-field-error-summary',
    )!;

    // 0 → N (first appearance): focuses the summary.
    fixture.componentInstance.submittedStatus.set('submitted');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.activeElement).toBe(summaryHost);

    // N → 0: fixing the only invalid field clears `hasErrors()`, so the
    // summary hides and the component's own doc says the latch re-arms.
    await userEvent.type(nameInput, 'Ada');
    await fixture.whenStable();
    expect(
      container
        .querySelector('ngx-form-field-error-summary [role="alert"]')
        ?.textContent?.trim() ?? '',
    ).toBe('');
    expect(document.activeElement).toBe(nameInput);

    // 0 → N again: a re-armed latch must focus the summary a second time,
    // exactly as it did on the first appearance.
    await userEvent.clear(nameInput);
    await fixture.whenStable();

    expect(
      container
        .querySelector('ngx-form-field-error-summary [role="alert"]')
        ?.textContent?.trim(),
    ).toContain('Name is required');
    expect(document.activeElement).toBe(summaryHost);
  });

  /**
   * Browser twin of `form-field-error-summary.spec.ts`'s "focuses the bound
   * control when an entry is activated via keyboard" (issue #501). Native
   * `<button>` Enter/Space activation is close enough in jsdom for most
   * specs, but this file exists precisely because "close enough" has missed
   * real focus-movement bugs before (#497) — pin the keyboard path here too.
   */
  it('focuses the bound control when a summary entry is activated with Enter or Space', async () => {
    @Component({
      selector: 'ngx-test-a11y-summary-keyboard',
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
    const emailInput = screen.getByLabelText('Email address');

    entry.focus();
    await userEvent.keyboard('{Enter}');
    expect(document.activeElement).toBe(emailInput);

    entry.focus();
    await userEvent.keyboard(' ');
    expect(document.activeElement).toBe(emailInput);
  });
});
