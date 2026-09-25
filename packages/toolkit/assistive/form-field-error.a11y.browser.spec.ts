import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  FormField,
  form,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import type { ValidationError } from '@angular/forms/signals';
import { render } from '@testing-library/angular';
import { userEvent } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { NgxFormFieldError } from './form-field-error';
import { provideNgxSignalFormsConfigForComponent } from '@ngx-signal-forms/toolkit';
import { expectNoA11yViolations } from '@ngx-signal-forms/toolkit/testing';

/**
 * WCAG 2.2 AA conformance gate for `NgxFormFieldError` used standalone —
 * i.e. projected directly next to a plain `[formField]` input rather than
 * through `NgxFormFieldWrapper`'s renderer outlet (the class doc's
 * "Simplest Usage — no NgxSignalFormToolkit needed" example). The wrapper's
 * own a11y spec already covers the composed case, so this spec is the only
 * gate on the bare component. Scanned across all three of its accessible
 * states, since blocking errors and warnings render under different
 * implicit live-region roles (alert vs status).
 */
describe('NgxFormFieldError (standalone) — WCAG 2.2 AA conformance', () => {
  it('the initial, error-free state has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-standalone-error-empty',
      imports: [FormField, NgxFormFieldError],
      template: `
        <form (submit)="$event.preventDefault()" novalidate>
          <label for="email">Email</label>
          <input id="email" [formField]="testForm.email" />
          <ngx-form-field-error
            [formField]="testForm.email"
            fieldName="email"
          />
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

    expect(container.querySelector('[role="alert"]')?.textContent?.trim()).toBe(
      '',
    );
    await expectNoA11yViolations(container);
  });

  it('a visible blocking error has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-standalone-error-blocking',
      imports: [FormField, NgxFormFieldError],
      template: `
        <form (submit)="$event.preventDefault()" novalidate>
          <label for="email">Email</label>
          <input id="email" [formField]="testForm.email" />
          <ngx-form-field-error
            [formField]="testForm.email"
            fieldName="email"
            strategy="immediate"
          />
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

    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'Email is required',
    );
    await expectNoA11yViolations(container);
  });

  it('a visible warning has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-standalone-error-warning',
      imports: [FormField, NgxFormFieldError],
      template: `
        <form (submit)="$event.preventDefault()" novalidate>
          <label for="password">Password</label>
          <input id="password" [formField]="testForm.password" />
          <ngx-form-field-error
            [formField]="testForm.password"
            fieldName="password"
          />
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ password: '' });
      readonly testForm = form(
        this.#model,
        schema((path) => {
          validate(path.password, (ctx) => {
            const value = ctx.value();
            if (value.length > 0 && value.length < 8) {
              return {
                kind: 'warn:weak-password',
                message: 'Consider 8 or more characters',
              };
            }
            return null;
          });
        }),
      );
    }

    const { container } = await render(TestComponent);
    const input = container.querySelector<HTMLInputElement>('input#password')!;
    await userEvent.click(input);
    await userEvent.type(input, 'abc');
    await userEvent.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      'Consider 8 or more characters',
    );
    await expectNoA11yViolations(container);
  });
});

/**
 * WCAG 2.2 AA conformance gate for `NgxFormFieldError` used in its grouped
 * `presentation="panel"` mode — rendered the way a custom summary block or
 * `NgxFormFieldset`'s notification-appearance branch composes it: an
 * `[errors]`-bound card outside a wrapper. Formerly covered by the deleted
 * `NgxFormFieldNotification`'s own a11y spec (folded into this component;
 * see `docs/migrations/v1.0.0-rc.12.md`). Scanned empty (both live regions
 * must already exist per WCAG 4.1.3), with blocking errors (role="alert"),
 * and, separately, with only warnings (role="status").
 */
describe('NgxFormFieldError (presentation="panel") — WCAG 2.2 AA conformance', () => {
  it('the empty panel has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-panel-empty',
      imports: [NgxFormFieldError],
      template: `
        <ngx-form-field-error
          [errors]="errors"
          fieldName="shipping"
          presentation="panel"
        />
      `,
    })
    class TestComponent {
      readonly errors = signal<readonly ValidationError[]>([]);
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(container.querySelector('[role="alert"]')).toBeTruthy();
    expect(container.querySelector('[role="status"]')).toBeTruthy();
    await expectNoA11yViolations(container);
  });

  it('a populated error panel with a title has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-panel-error',
      imports: [NgxFormFieldError],
      template: `
        <ngx-form-field-error
          [errors]="errors"
          fieldName="shipping"
          title="Shipping address errors"
          presentation="panel"
        />
      `,
    })
    class TestComponent {
      readonly errors = signal<readonly ValidationError[]>([
        { kind: 'required', message: 'Street is required' },
        { kind: 'required', message: 'City is required' },
      ]);
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const alert = container.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Street is required');
    expect(alert?.textContent).toContain('Shipping address errors');
    await expectNoA11yViolations(container);
  });

  it('a populated warning panel has no violations', async () => {
    @Component({
      selector: 'ngx-test-a11y-panel-warning',
      imports: [NgxFormFieldError],
      template: `
        <ngx-form-field-error
          [errors]="warnings"
          fieldName="shipping"
          presentation="panel"
        />
      `,
    })
    class TestComponent {
      readonly warnings = signal<readonly ValidationError[]>([
        { kind: 'warn:po-box', message: 'PO boxes may delay delivery' },
      ]);
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const status = container.querySelector('[role="status"]');
    expect(status?.textContent).toContain('PO boxes may delay delivery');
    await expectNoA11yViolations(container);
  });
});

/**
 * Issue #498: a blocking error and a warning render with the same markup
 * except for colour (`#db1818` against `#a16207`), which users with
 * deuteranopia find hard to tell apart (WCAG 1.4.1). Each message now
 * carries a visually hidden "Error:" / "Warning:" prefix inside the element
 * `aria-describedby` points to, so the accessible description tells the two
 * channels apart on its own. Asserted here as the computed accessible
 * description (`toHaveAccessibleDescription`), not `textContent`, because a
 * sighted-only check would pass even if the prefix were `aria-hidden` and
 * never reached assistive tech.
 */
describe('NgxFormFieldError — error/warning prefix (issue #498)', () => {
  it('gives a field with a blocking error an accessible description starting with "Error:"', async () => {
    @Component({
      selector: 'ngx-test-error-prefix',
      imports: [FormField, NgxFormFieldError],
      template: `
        <form (submit)="$event.preventDefault()" novalidate>
          <label for="email">Email</label>
          <input
            id="email"
            [formField]="testForm.email"
            aria-describedby="email-error"
          />
          <ngx-form-field-error
            [formField]="testForm.email"
            fieldName="email"
            strategy="immediate"
          />
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

    const input = container.querySelector<HTMLInputElement>('input#email')!;
    expect(input).toHaveAccessibleDescription('Error: Email is required');
    await expectNoA11yViolations(container);
  });

  it('gives a field with a warning an accessible description starting with "Warning:"', async () => {
    @Component({
      selector: 'ngx-test-warning-prefix',
      imports: [FormField, NgxFormFieldError],
      template: `
        <form (submit)="$event.preventDefault()" novalidate>
          <label for="password">Password</label>
          <input
            id="password"
            [formField]="testForm.password"
            aria-describedby="password-warning"
          />
          <ngx-form-field-error
            [formField]="testForm.password"
            fieldName="password"
          />
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ password: '' });
      readonly testForm = form(
        this.#model,
        schema((path) => {
          validate(path.password, (ctx) => {
            const value = ctx.value();
            if (value.length > 0 && value.length < 8) {
              return {
                kind: 'warn:weak-password',
                message: 'Consider 8 or more characters',
              };
            }
            return null;
          });
        }),
      );
    }

    const { container } = await render(TestComponent);
    const input = container.querySelector<HTMLInputElement>('input#password')!;
    await userEvent.click(input);
    await userEvent.type(input, 'abc');
    await userEvent.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(input).toHaveAccessibleDescription(
      'Warning: Consider 8 or more characters',
    );
    await expectNoA11yViolations(container);
  });

  it('still shows the prefix when a title is set, so a titled warning is not colour-only', async () => {
    // A `title` describes the group ("Delivery notes"); it never says which
    // channel a given message belongs to, so a titled warning would be
    // colour-only without its own per-message prefix — the same SC 1.4.1 /
    // 1.3.1 gap this issue exists to close. NgxFormFieldset passes a title
    // to both the error and warning container, so this is not a rare case.
    @Component({
      selector: 'ngx-test-warning-prefix-title',
      imports: [FormField, NgxFormFieldError],
      template: `
        <form (submit)="$event.preventDefault()" novalidate>
          <label for="password">Password</label>
          <input
            id="password"
            [formField]="testForm.password"
            aria-describedby="password-warning"
          />
          <ngx-form-field-error
            [formField]="testForm.password"
            fieldName="password"
            title="Password notes"
          />
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ password: '' });
      readonly testForm = form(
        this.#model,
        schema((path) => {
          validate(path.password, (ctx) => {
            const value = ctx.value();
            if (value.length > 0 && value.length < 8) {
              return {
                kind: 'warn:weak-password',
                message: 'Consider 8 or more characters',
              };
            }
            return null;
          });
        }),
      );
    }

    const { container } = await render(TestComponent);
    const input = container.querySelector<HTMLInputElement>('input#password')!;
    await userEvent.click(input);
    await userEvent.type(input, 'abc');
    await userEvent.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    // The title ("Password notes") is part of the same accessible
    // description, since it renders inside the container `aria-describedby`
    // points to — but the message itself must still carry its own
    // "Warning:" prefix rather than relying on the title alone.
    expect(input).toHaveAccessibleDescription(
      /Warning: Consider 8 or more characters/u,
    );
    await expectNoA11yViolations(container);
  });

  it('lets a consumer disable the error prefix per channel with an empty string', async () => {
    @Component({
      selector: 'ngx-test-error-prefix-disabled',
      imports: [NgxFormFieldError],
      providers: [
        provideNgxSignalFormsConfigForComponent({ errorPrefixText: '' }),
      ],
      template: `
        <ngx-form-field-error [errors]="errors" fieldName="shipping" />
      `,
    })
    class TestComponent {
      readonly errors = signal<readonly ValidationError[]>([
        { kind: 'required', message: 'Street is required' },
      ]);
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const alert = container.querySelector('[role="alert"]');
    expect(alert?.textContent?.trim()).toBe('Street is required');
    expect(alert?.getAttribute('role')).toBe('alert');
    await expectNoA11yViolations(container);
  });

  it('lets a consumer disable the warning prefix per channel with an empty string', async () => {
    @Component({
      selector: 'ngx-test-warning-prefix-disabled',
      imports: [NgxFormFieldError],
      providers: [
        provideNgxSignalFormsConfigForComponent({ warningPrefixText: '' }),
      ],
      template: `
        <ngx-form-field-error [errors]="warnings" fieldName="shipping" />
      `,
    })
    class TestComponent {
      readonly warnings = signal<readonly ValidationError[]>([
        { kind: 'warn:po-box', message: 'PO boxes may delay delivery' },
      ]);
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const status = container.querySelector('[role="status"]');
    expect(status?.textContent?.trim()).toBe('PO boxes may delay delivery');
    expect(status?.getAttribute('role')).toBe('status');
    await expectNoA11yViolations(container);
  });

  it('renders a custom, localized prefix from NGX_SIGNAL_FORMS_CONFIG in the accessible description', async () => {
    // Regression coverage for issue #300-style localization: earlier specs
    // only asserted `errorPrefixText`/`warningPrefixText` at the config
    // (provider) level — this renders both channels with non-default,
    // non-English text and checks the *computed* accessible description,
    // so a config value that never reaches the DOM, or reaches it in the
    // wrong element, would fail here even though the provider test passes.
    @Component({
      selector: 'ngx-test-custom-prefix',
      imports: [FormField, NgxFormFieldError],
      providers: [
        provideNgxSignalFormsConfigForComponent({
          errorPrefixText: 'Fout:',
          warningPrefixText: 'Waarschuwing:',
        }),
      ],
      template: `
        <form (submit)="$event.preventDefault()" novalidate>
          <label for="email">Email</label>
          <input
            id="email"
            [formField]="testForm.email"
            aria-describedby="email-error"
          />
          <ngx-form-field-error
            [formField]="testForm.email"
            fieldName="email"
            strategy="immediate"
          />

          <label for="password">Password</label>
          <input
            id="password"
            [formField]="testForm.password"
            aria-describedby="password-warning"
          />
          <ngx-form-field-error
            [formField]="testForm.password"
            fieldName="password"
          />
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ email: '', password: '' });
      readonly testForm = form(
        this.#model,
        schema((path) => {
          required(path.email, { message: 'Email is required' });
          validate(path.password, (ctx) => {
            const value = ctx.value();
            if (value.length > 0 && value.length < 8) {
              return {
                kind: 'warn:weak-password',
                message: 'Consider 8 or more characters',
              };
            }
            return null;
          });
        }),
      );
    }

    const { container } = await render(TestComponent);
    const emailInput =
      container.querySelector<HTMLInputElement>('input#email')!;
    const passwordInput =
      container.querySelector<HTMLInputElement>('input#password')!;
    await userEvent.click(passwordInput);
    await userEvent.type(passwordInput, 'abc');
    await userEvent.tab();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(emailInput).toHaveAccessibleDescription('Fout: Email is required');
    expect(passwordInput).toHaveAccessibleDescription(
      'Waarschuwing: Consider 8 or more characters',
    );
    await expectNoA11yViolations(container);
  });

  it('includes the prefix in the panel presentation, same as inline', async () => {
    @Component({
      selector: 'ngx-test-error-prefix-panel',
      imports: [NgxFormFieldError],
      template: `
        <ngx-form-field-error
          [errors]="errors"
          fieldName="shipping"
          presentation="panel"
        />
      `,
    })
    class TestComponent {
      readonly errors = signal<readonly ValidationError[]>([
        { kind: 'required', message: 'Street is required' },
      ]);
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const alert = container.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Error: Street is required');
    await expectNoA11yViolations(container);
  });
});
