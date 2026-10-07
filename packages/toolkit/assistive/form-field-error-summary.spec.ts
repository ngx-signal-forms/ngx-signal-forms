import { ChangeDetectorRef, Component, signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import {
  applyEach,
  email as signalEmail,
  form,
  FormField,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import type { SubmittedStatus } from '@ngx-signal-forms/toolkit';
import { provideFieldLabels } from '@ngx-signal-forms/toolkit/core';
import { NgxHeadlessErrorSummary } from '@ngx-signal-forms/toolkit/headless';
import { render, screen } from '@testing-library/angular';
import { userEvent } from '@testing-library/user-event';
import {
  afterEach,
  assert,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { NgxFormFieldErrorSummary } from './form-field-error-summary';

describe('NgxFormFieldErrorSummary', () => {
  it('renders entries through the composed headless directive inputs', async () => {
    @Component({
      selector: 'ngx-test-error-summary-immediate',
      imports: [FormField, NgxFormFieldErrorSummary],

      template: `
        <input
          id="email"
          data-testid="email-input"
          [formField]="contactForm.email"
        />
        <ngx-form-field-error-summary
          [formTree]="contactForm"
          strategy="immediate"
          summaryLabel="Fix these issues"
        />
      `,
    })
    class TestComponent {
      readonly #model = signal({ email: '' });
      readonly contactForm = form(
        this.#model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
        }),
      );
    }

    await render(TestComponent);

    expect(screen.getByRole('alert')).toBeTruthy();
    expect(screen.getByText('Fix these issues')).toBeTruthy();

    const entry = screen.getByRole('button', {
      name: /email\s*:\s*Email is required/iu,
    });
    expect(entry).toBeTruthy();
  });

  it('respects submittedStatus passed through the composed public API', async () => {
    @Component({
      selector: 'ngx-test-error-summary-submit',
      imports: [FormField, NgxFormFieldErrorSummary],

      template: `
        <input id="email" [formField]="contactForm.email" />
        <ngx-form-field-error-summary
          [formTree]="contactForm"
          strategy="on-submit"
          [submittedStatus]="submittedStatus()"
        />
      `,
    })
    class TestComponent {
      readonly #model = signal({ email: '' });
      readonly contactForm = form(
        this.#model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
        }),
      );
      readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
    }

    const { fixture } = await render(TestComponent);

    expect(screen.queryByRole('alert')?.textContent?.trim() ?? '').toBe('');

    fixture.componentInstance.submittedStatus.set('submitted');
    fixture.detectChanges();

    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(
      screen.getByRole('button', {
        name: /email\s*:\s*Email is required/iu,
      }),
    ).toBeTruthy();
  });

  it('does not expose warningStrategy, because the summary lists errors only (#587)', () => {
    // `reflectComponentType` omits host-directive inputs, so read the
    // forwarded input map from the component definition.
    const { hostDirectives } = (
      NgxFormFieldErrorSummary as unknown as {
        ɵcmp: {
          hostDirectives: readonly { inputs: Record<string, string> }[] | null;
        };
      }
    ).ɵcmp;
    const forwarded = (hostDirectives ?? []).flatMap((hostDirective) =>
      Object.keys(hostDirective.inputs),
    );

    // Guards the lookup itself: an empty list would pass the next check.
    expect(forwarded).toContain('strategy');
    expect(forwarded).not.toContain('warningStrategy');
  });

  it('defaults to the on-touch strategy when none is provided', async () => {
    @Component({
      selector: 'ngx-test-error-summary-default',
      imports: [FormField, NgxFormFieldErrorSummary],

      template: `
        <input id="email" [formField]="contactForm.email" />
        <ngx-form-field-error-summary [formTree]="contactForm" />
      `,
    })
    class TestComponent {
      readonly #model = signal({ email: '' });
      readonly contactForm = form(
        this.#model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
        }),
      );
    }

    const { fixture } = await render(TestComponent);

    // Default strategy is on-touch → no entries until a field is touched.
    expect(screen.queryByRole('alert')?.textContent?.trim() ?? '').toBe('');

    fixture.componentInstance.contactForm.email().markAsTouched();
    fixture.detectChanges();

    expect(await screen.findByRole('alert')).toBeTruthy();
  });

  it('aggregates errors from multiple invalid fields', async () => {
    @Component({
      selector: 'ngx-test-error-summary-multi',
      imports: [FormField, NgxFormFieldErrorSummary],

      template: `
        <input id="email" [formField]="contactForm.email" />
        <input id="name" [formField]="contactForm.name" />
        <ngx-form-field-error-summary
          [formTree]="contactForm"
          strategy="immediate"
        />
      `,
    })
    class TestComponent {
      readonly #model = signal({ email: '', name: '' });
      readonly contactForm = form(
        this.#model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
          signalEmail(path.email, { message: 'Must be a valid email' });
          required(path.name, { message: 'Name is required' });
        }),
      );
    }

    await render(TestComponent);

    const buttons = screen.getAllByRole('button');
    // Two distinct fields → at least one entry per field. Duplicate
    // kind+fieldName pairs are deduplicated by the headless directive's
    // dedup logic so we just check ">=2" rather than "exactly N".
    expect(buttons.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Email is required/iu)).toBeTruthy();
    expect(screen.getByText(/Name is required/iu)).toBeTruthy();
  });

  it('renders both entries without an NG0955 duplicate-track-key warning when the same field has two errors sharing a kind', async () => {
    // Regression test: `dedupeValidationErrors` (headless/src/lib/utilities.ts)
    // dedupes by `kind + '::' + message`, so two errors on the same field
    // with the *same* kind but *different* messages both survive dedup. The
    // summary's `@for` used to `track entry.kind + entry.fieldName`, which
    // collapses to an identical string for both entries (same kind, same
    // field) — Angular's dev-mode duplicate-key check logs a `console.warn`
    // (NG0955) and degrades `@for`'s diffing during change detection.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    @Component({
      selector: 'ngx-test-error-summary-duplicate-kind',
      imports: [FormField, NgxFormFieldErrorSummary],

      template: `
        <input id="server" [formField]="contactForm.server" />
        <ngx-form-field-error-summary
          [formTree]="contactForm"
          strategy="immediate"
        />
      `,
    })
    class TestComponent {
      readonly model = signal({ server: 'x' });
      readonly contactForm = form(
        this.model,
        schema((path) => {
          validate(path.server, () => ({
            kind: 'server',
            message: 'Server error A',
          }));
          validate(path.server, () => ({
            kind: 'server',
            message: 'Server error B',
          }));
        }),
      );
    }

    const { fixture } = await render(TestComponent);

    // Angular's `@for` duplicate-key detection only fires while
    // reconciling against a *previously rendered* live collection (a
    // brand-new list — nothing rendered yet — never hits that code path).
    // Trigger a second render pass with a freshly computed (but
    // content-equivalent) `entries()` array so the repeater actually
    // reconciles two lists that both key by `kind + fieldName`.
    fixture.componentInstance.model.set({ server: 'y' });
    fixture.detectChanges();

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2);
    expect(screen.getByText(/Server error A/iu)).toBeTruthy();
    expect(screen.getByText(/Server error B/iu)).toBeTruthy();

    const duplicateKeyWarning = warnSpy.mock.calls.find((call) =>
      String(call[0]).includes('duplicated keys'),
    );
    expect(duplicateKeyWarning).toBeUndefined();

    warnSpy.mockRestore();
  });

  it('keeps one row per field when two array rows share a label, kind and message', async () => {
    // Two address rows both read "Street: Street is required". The label is
    // display text only, so the row key must come from the field itself.
    // A label-based key collides: Angular logs a duplicate-key warning and
    // can reuse the wrong row, so a button would focus the other row's input.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    @Component({
      selector: 'ngx-test-error-summary-shared-label',
      imports: [FormField, NgxFormFieldErrorSummary],
      providers: [provideFieldLabels(() => () => 'Street')],

      template: `
        @for (row of addressForm.rows; track $index) {
          <input
            [attr.data-testid]="'street-' + $index"
            [formField]="row.street"
          />
        }
        <ngx-form-field-error-summary
          [formTree]="addressForm"
          strategy="immediate"
        />
      `,
    })
    class TestComponent {
      readonly model = signal({ rows: [{ street: '' }, { street: '' }] });
      readonly addressForm = form(
        this.model,
        schema((path) => {
          applyEach(path.rows, (row) => {
            required(row.street, { message: 'Street is required' });
          });
        }),
      );
    }

    const user = userEvent.setup();
    const { fixture } = await render(TestComponent);

    // Duplicate-key detection only runs when `@for` reconciles against an
    // already rendered list, so force a second pass with fresh entries.
    fixture.componentInstance.model.set({
      rows: [{ street: '' }, { street: '' }],
    });
    fixture.detectChanges();

    const buttons = screen.getAllByRole('button', {
      name: /Street\s*:\s*Street is required/iu,
    });
    expect(buttons).toHaveLength(2);

    const [firstButton, secondButton] = buttons;
    assert(firstButton && secondButton, 'expected two summary buttons');
    await user.click(firstButton);
    expect(document.activeElement).toBe(screen.getByTestId('street-0'));
    await user.click(secondButton);
    expect(document.activeElement).toBe(screen.getByTestId('street-1'));

    const duplicateKeyWarning = warnSpy.mock.calls.find((call) =>
      String(call[0]).includes('duplicated keys'),
    );
    expect(duplicateKeyWarning).toBeUndefined();

    warnSpy.mockRestore();
  });

  it('renders nothing when the form is valid', async () => {
    @Component({
      selector: 'ngx-test-error-summary-empty',
      imports: [FormField, NgxFormFieldErrorSummary],

      template: `
        <input id="email" [formField]="contactForm.email" />
        <ngx-form-field-error-summary
          [formTree]="contactForm"
          strategy="immediate"
        />
      `,
    })
    class TestComponent {
      readonly #model = signal({ email: 'valid@example.com' });
      readonly contactForm = form(
        this.#model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
        }),
      );
    }

    await render(TestComponent);

    expect(screen.queryByRole('alert')?.textContent?.trim() ?? '').toBe('');
    expect(screen.queryAllByRole('button').length).toBe(0);
  });

  it('does not focus the summary when [autoFocus]="false"', async () => {
    @Component({
      selector: 'ngx-test-error-summary-no-autofocus',
      imports: [FormField, NgxFormFieldErrorSummary],

      template: `
        <input
          id="email"
          data-testid="email-input"
          [formField]="contactForm.email"
        />
        <ngx-form-field-error-summary
          [formTree]="contactForm"
          strategy="on-submit"
          [autoFocus]="false"
          [submittedStatus]="submittedStatus()"
        />
      `,
    })
    class TestComponent {
      readonly #model = signal({ email: '' });
      readonly contactForm = form(
        this.#model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
        }),
      );
      readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
    }

    const { fixture } = await render(TestComponent);

    // Move focus to a known, non-summary element so we can detect theft.
    const input = screen.getByTestId('email-input');
    input.focus();
    expect(document.activeElement).toBe(input);

    fixture.componentInstance.submittedStatus.set('submitted');
    fixture.detectChanges();
    await fixture.whenStable();

    // Summary is visible but focus must remain on the input.
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(document.activeElement).toBe(input);
  });

  it('does not steal focus under the default on-touch strategy (WCAG 3.2.1/3.2.2)', async () => {
    // The GOV.UK/WAI error-summary pattern moves focus to the summary after
    // a failed *submit*. `errorStrategy` defaults to `'on-touch'`, and the
    // root FieldTree's `touched()` aggregates children — so merely blurring
    // the first invalid field would surface the summary. Auto-focusing here
    // would be an unexpected context change (WCAG 3.2.1/3.2.2) while the
    // user is still filling out the form, not the documented "arrive after
    // a failed submit" contract.
    @Component({
      selector: 'ngx-test-error-summary-on-touch-no-steal',
      imports: [FormField, NgxFormFieldErrorSummary],

      template: `
        <input
          id="email"
          data-testid="email-input"
          [formField]="contactForm.email"
        />
        <ngx-form-field-error-summary [formTree]="contactForm" />
      `,
    })
    class TestComponent {
      readonly #model = signal({ email: '' });
      readonly contactForm = form(
        this.#model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
        }),
      );
    }

    await render(TestComponent);

    const input = screen.getByTestId('email-input');
    await userEvent.click(input);
    await userEvent.tab();

    // The alert shell is always mounted (WCAG 4.1.3 live region), so
    // `findByRole('alert')` resolves as soon as the element exists — not
    // once it actually contains the error text. Wait for the text content
    // itself to avoid racing the update.
    const summaryAlert = await screen.findByRole('alert');
    await vi.waitFor(() => {
      expect(summaryAlert.textContent).toContain('Email is required');
    });

    const focusTarget = summaryAlert.closest('ngx-form-field-error-summary');
    expect(document.activeElement).not.toBe(focusTarget);
  });

  describe('dev-mode focus-failure diagnostic', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    const getFocusFailureWarnings = (
      spy: ReturnType<typeof vi.spyOn>,
    ): readonly string[] => {
      const messages: string[] = [];
      for (const call of spy.mock.calls) {
        const first: unknown = call[0];
        if (
          typeof first === 'string' &&
          first.includes('NgxFormFieldErrorSummary')
        ) {
          messages.push(first);
        }
      }
      return messages;
    };

    it('should warn in dev mode when host.focus() fails to move focus', async () => {
      // Scenario: stub the summary host's `focus()` method so the call is a
      // silent no-op (mirrors real-world failures where `display:none`, an
      // inert ancestor, or modal interception swallow the focus request).
      // `document.activeElement` then stays on <body>, breaking WCAG 2.4.3.
      @Component({
        selector: 'ngx-test-error-summary-focus-failure',
        imports: [FormField, NgxFormFieldErrorSummary],

        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error-summary
            [formTree]="contactForm"
            strategy="on-submit"
            [submittedStatus]="submittedStatus()"
          />
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'Email is required' });
          }),
        );
        readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
      }

      const { fixture } = await render(TestComponent);

      // Find the summary host element and stub its focus() to a no-op so
      // the diagnostic's `document.activeElement !== host` check fires.
      const summaryHost = fixture.nativeElement.querySelector(
        'ngx-form-field-error-summary',
      ) as HTMLElement;
      expect(summaryHost).toBeInstanceOf(HTMLElement);
      // `focus` is a prototype-level method; define an own-property override
      // on this single host so we don't pollute other tests/instances.
      Object.defineProperty(summaryHost, 'focus', {
        configurable: true,
        value: () => {
          /* swallowed: simulates display:none / modal / detached host */
        },
      });

      // Make sure focus is on the body so the !== host check is meaningful.
      (document.activeElement as HTMLElement | null)?.blur?.();

      fixture.componentInstance.submittedStatus.set('submitted');
      fixture.detectChanges();
      await fixture.whenStable();

      const warnings = getFocusFailureWarnings(warnSpy);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain('NgxFormFieldErrorSummary');
      expect(warnings[0]).toContain('WCAG 2.4.3');
      expect(warnings[0]).toContain('autoFocus');
    });
  });

  it('exposes role="alert" without redundant aria-live/aria-atomic', async () => {
    @Component({
      selector: 'ngx-test-error-summary-aria',
      imports: [FormField, NgxFormFieldErrorSummary],

      template: `
        <input id="email" [formField]="contactForm.email" />
        <ngx-form-field-error-summary
          [formTree]="contactForm"
          strategy="immediate"
        />
      `,
    })
    class TestComponent {
      readonly #model = signal({ email: '' });
      readonly contactForm = form(
        this.#model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
        }),
      );
    }

    await render(TestComponent);

    const alert = screen.getByRole('alert');
    expect(alert.getAttribute('role')).toBe('alert');
    expect(alert.hasAttribute('aria-live')).toBe(false);
    expect(alert.hasAttribute('aria-atomic')).toBe(false);
  });

  describe('heading and accessible name (#497)', () => {
    it('renders the label as a level-2 heading by default, and names the focused host after it', async () => {
      @Component({
        selector: 'ngx-test-error-summary-heading-default',
        imports: [FormField, NgxFormFieldErrorSummary],

        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error-summary
            [formTree]="contactForm"
            strategy="immediate"
            summaryLabel="Please fix the following errors:"
          />
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'Email is required' });
          }),
        );
      }

      const { container } = await render(TestComponent);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading.textContent?.trim()).toBe(
        'Please fix the following errors:',
      );
      // A native heading element, not `role="heading"` on a generic
      // element — native elements are what the a11y rules prefer, and
      // they get heading-navigation (NVDA/JAWS "H" key) for free.
      expect(heading.tagName.toLowerCase()).toBe('h2');

      // The focused host (tabindex="-1") must be named after the heading —
      // otherwise a screen reader announces nothing when focus lands here
      // on submit (WCAG 1.3.1, 2.4.6, 4.1.2).
      const host = container.querySelector('ngx-form-field-error-summary');
      expect(host?.getAttribute('aria-labelledby')).toBe(heading.id);
      expect(heading.id).toBeTruthy();
    });

    it('renders the label at the configured heading level', async () => {
      @Component({
        selector: 'ngx-test-error-summary-heading-level',
        imports: [FormField, NgxFormFieldErrorSummary],

        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error-summary
            [formTree]="contactForm"
            strategy="immediate"
            [headingLevel]="4"
          />
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'Email is required' });
          }),
        );
      }

      await render(TestComponent);

      const heading = screen.getByRole('heading', { level: 4 });
      expect(heading.tagName.toLowerCase()).toBe('h4');
      expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
    });

    it('renders no heading and no aria-labelledby when summaryLabel is empty', async () => {
      @Component({
        selector: 'ngx-test-error-summary-heading-empty-label',
        imports: [FormField, NgxFormFieldErrorSummary],

        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error-summary
            [formTree]="contactForm"
            strategy="immediate"
            summaryLabel=""
          />
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'Email is required' });
          }),
        );
      }

      const { container } = await render(TestComponent);

      expect(screen.queryByRole('heading')).toBeNull();
      const host = container.querySelector('ngx-form-field-error-summary');
      expect(host?.hasAttribute('aria-labelledby')).toBe(false);
    });

    it('does not set aria-labelledby before the summary has anything to show', async () => {
      // Regression test: `ariaLabelledBy` used to key off `summaryLabel()`
      // alone. Before a failed submit the summary is empty and the heading
      // is not rendered at all (it lives inside the same `@if` as the
      // error list), so `role="group"` on the host pointed `aria-
      // labelledby` at an id that did not exist in the DOM yet — an
      // invalid ARIA reference (WCAG 1.3.1, 4.1.2).
      @Component({
        selector: 'ngx-test-error-summary-heading-before-submit',
        imports: [FormField, NgxFormFieldErrorSummary],

        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error-summary
            [formTree]="contactForm"
            strategy="on-submit"
            [submittedStatus]="submittedStatus()"
          />
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'Email is required' });
          }),
        );
        readonly submittedStatus = signal<SubmittedStatus>('unsubmitted');
      }

      const { container } = await render(TestComponent);

      expect(screen.queryByRole('heading')).toBeNull();
      const host = container.querySelector('ngx-form-field-error-summary');
      expect(host?.hasAttribute('aria-labelledby')).toBe(false);
    });
  });

  describe('non-focusable entries (#497)', () => {
    it('renders an entry with no bound control as plain text, not a link or button', async () => {
      // `errorHasFocusableTarget` (headless) returns false for an error with
      // no `fieldTree`. That case only arises from a malformed or
      // third-party validator error — Angular's own `required`/`validate`
      // schema functions always attach a fieldTree — so this test builds
      // one directly rather than through the public form schema API. See
      // `error-summary-utilities.spec.ts`/`utilities.spec.ts` for the
      // headless-layer coverage of `errorHasFocusableTarget` itself.
      @Component({
        selector: 'ngx-test-error-summary-no-target',
        imports: [FormField, NgxFormFieldErrorSummary],

        template: `
          <input id="email" [formField]="contactForm.email" />
          <ngx-form-field-error-summary
            [formTree]="contactForm"
            strategy="immediate"
          />
        `,
      })
      class TestComponent {
        readonly #model = signal({ email: '' });
        readonly contactForm = form(
          this.#model,
          schema((path) => {
            required(path.email, { message: 'Email is required' });
          }),
        );
      }

      const { fixture, container } = await render(TestComponent);

      // The headless directive lives on `ngx-form-field-error-summary`
      // itself (a hostDirective), not on the test root.
      const summaryDebugElement = fixture.debugElement.query(
        By.css('ngx-form-field-error-summary'),
      );
      const headlessSummary = summaryDebugElement.injector.get(
        NgxHeadlessErrorSummary,
      );

      // Stub `entries()` to include one focusable and one non-focusable
      // entry, exercising the template's canFocus branch without needing a
      // real fieldTree-less error from the framework.
      Object.defineProperty(headlessSummary, 'entries', {
        configurable: true,
        value: () => [
          {
            key: 'email',
            kind: 'required',
            message: 'Email is required',
            fieldName: 'Email',
            canFocus: true,
            focus: () => {
              /* not exercised here */
            },
          },
          {
            key: 'server',
            kind: 'server',
            message: 'Something went wrong',
            fieldName: 'Server',
            canFocus: false,
            focus: () => {
              /* no-op: no bound control */
            },
          },
        ],
      });
      // OnPush: mutating the injected directive in place does not mark
      // `NgxFormFieldErrorSummary`'s view dirty, so a plain
      // `fixture.detectChanges()` would skip re-checking it. Force it.
      summaryDebugElement.injector.get(ChangeDetectorRef).markForCheck();
      fixture.detectChanges();

      const button = screen.getByRole('button', {
        name: /Email\s*:\s*Email is required/iu,
      });
      expect(button).toBeTruthy();

      expect(
        screen.queryByRole('button', { name: /Something went wrong/iu }),
      ).toBeNull();
      expect(
        screen.queryByRole('link', { name: /Something went wrong/iu }),
      ).toBeNull();
      expect(container.textContent).toContain('Something went wrong');
    });
  });
});
