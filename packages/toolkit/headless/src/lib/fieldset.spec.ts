import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  form,
  FormRoot,
  required,
  schema,
  validate,
  type FieldTree,
} from '@angular/forms/signals';
import { NgxSignalForm } from '@ngx-signal-forms/toolkit';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxHeadlessFieldset } from './fieldset';

describe('NgxHeadlessFieldset', () => {
  it('aggregates and deduplicates field errors from nested fields when includeNestedErrors is true', async () => {
    @Component({
      selector: 'ngx-test-fieldset-dedupe',

      imports: [NgxHeadlessFieldset],
      template: `
        <fieldset
          ngxHeadlessFieldset
          #fieldset="fieldset"
          [field]="addressForm.address"
          includeNestedErrors
        >
          <span data-testid="error-count">
            {{ fieldset.aggregatedErrors().length }}
          </span>
          @if (fieldset.aggregatedErrors().length > 0) {
            <span data-testid="error-message">
              {{ fieldset.aggregatedErrors()[0]?.message }}
            </span>
          }
        </fieldset>
      `,
    })
    class TestComponent {
      readonly #model = signal({ address: { street: '', city: '' } });
      readonly addressForm = form(
        this.#model,
        schema((path) => {
          required(path.address.street, { message: 'Required' });
          required(path.address.city, { message: 'Required' });
        }),
      );
    }

    await render(TestComponent);

    expect(screen.getByTestId('error-count')).toHaveTextContent('1');
    expect(screen.getByTestId('error-message')).toHaveTextContent('Required');
  });

  it('defaults to direct errors only (includeNestedErrors=false)', async () => {
    @Component({
      selector: 'ngx-test-fieldset-direct-default',

      imports: [NgxHeadlessFieldset],
      template: `
        <fieldset
          ngxHeadlessFieldset
          #fieldset="fieldset"
          [field]="addressForm.address"
        >
          <span data-testid="error-count">
            {{ fieldset.aggregatedErrors().length }}
          </span>
        </fieldset>
      `,
    })
    class TestComponent {
      readonly #model = signal({ address: { street: '', city: '' } });
      // Nested-only errors — the fieldset root has no direct errors.
      readonly addressForm = form(
        this.#model,
        schema((path) => {
          required(path.address.street, { message: 'Required' });
        }),
      );
    }

    await render(TestComponent);

    // Default includeNestedErrors=false → readDirectErrors on the root
    // → no direct errors, count stays at 0.
    expect(screen.getByTestId('error-count')).toHaveTextContent('0');
  });

  it('prefers explicit fields override for aggregation', async () => {
    @Component({
      selector: 'ngx-test-fieldset-override',

      imports: [NgxHeadlessFieldset],
      template: `
        <fieldset
          ngxHeadlessFieldset
          #fieldset="fieldset"
          [field]="addressForm.address"
          [fields]="fields"
        >
          @for (error of fieldset.aggregatedErrors(); track error.kind) {
            <span data-testid="error-message">{{ error.message }}</span>
          }
        </fieldset>
      `,
    })
    class TestComponent {
      readonly #model = signal({ address: { street: '', city: '' } });
      readonly addressForm = form(
        this.#model,
        schema((path) => {
          required(path.address.street, { message: 'Street required' });
          required(path.address.city, { message: 'City required' });
        }),
      );
      readonly fields: FieldTree<unknown>[] = [this.addressForm.address.street];
    }

    await render(TestComponent);

    expect(screen.getByText('Street required')).toBeInTheDocument();
    expect(screen.queryByText('City required')).toBeNull();
  });

  it('treats an explicitly bound empty `fields` array as "aggregate nothing", not "not provided"', async () => {
    @Component({
      selector: 'ngx-test-fieldset-empty-override',

      imports: [NgxHeadlessFieldset],
      template: `
        <fieldset
          ngxHeadlessFieldset
          #fieldset="fieldset"
          [field]="addressForm.address"
          [fields]="fields"
          includeNestedErrors
        >
          <span data-testid="error-count">
            {{ fieldset.aggregatedErrors().length }}
          </span>
        </fieldset>
      `,
    })
    class TestComponent {
      readonly #model = signal({ address: { street: '', city: '' } });
      readonly addressForm = form(
        this.#model,
        schema((path) => {
          required(path.address.street, { message: 'Street required' });
          required(path.address.city, { message: 'City required' });
        }),
      );
      // Explicitly bound empty array — a dynamically computed field list that
      // legitimately became empty. Must NOT fall back to the fieldset's own
      // (nested) errors the way an unbound (`null`) `fields` input would.
      readonly fields: readonly FieldTree<unknown>[] = [];
    }

    await render(TestComponent);

    expect(screen.getByTestId('error-count')).toHaveTextContent('0');
  });

  it('shows errors only after touch with default on-touch strategy', async () => {
    @Component({
      selector: 'ngx-test-fieldset-show-errors',

      imports: [NgxHeadlessFieldset],
      template: `
        <fieldset
          ngxHeadlessFieldset
          #fieldset="fieldset"
          [field]="addressForm.address"
          includeNestedErrors
        >
          <span data-testid="show-errors">
            {{ fieldset.shouldShowErrors() }}
          </span>
        </fieldset>
      `,
    })
    class TestComponent {
      readonly #model = signal({ address: { street: '', city: '' } });
      readonly addressForm = form(
        this.#model,
        schema((path) => {
          required(path.address.street, { message: 'Street required' });
        }),
      );
    }

    const { fixture } = await render(TestComponent);

    expect(screen.getByTestId('show-errors')).toHaveTextContent('false');

    fixture.componentInstance.addressForm.address().markAsTouched();
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(screen.getByTestId('show-errors')).toHaveTextContent('true');
  });

  it('exposes resolvedErrors/resolvedWarnings with resolved messages, even when the validator supplies no message (framework default)', async () => {
    @Component({
      selector: 'ngx-test-fieldset-resolved-errors',

      imports: [NgxHeadlessFieldset],
      template: `
        <fieldset
          ngxHeadlessFieldset
          #fieldset="fieldset"
          [field]="addressForm.address"
          includeNestedErrors
        >
          @for (error of fieldset.resolvedErrors(); track error.kind) {
            <span data-testid="resolved-error-message">{{
              error.message
            }}</span>
          }
        </fieldset>
      `,
    })
    class TestComponent {
      readonly #model = signal({ address: { street: '', city: '' } });
      readonly addressForm = form(
        this.#model,
        schema((path) => {
          // No `message` option — Angular's default ValidationError.message
          // is `undefined` for this case. `error.message` in a template
          // would render an empty span; `resolvedErrors()` must not.
          required(path.address.street);
        }),
      );
    }

    await render(TestComponent);

    const message = screen.getByTestId('resolved-error-message');
    expect(message.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('shows warnings when no blocking errors exist', async () => {
    @Component({
      selector: 'ngx-test-fieldset-warnings',

      imports: [NgxHeadlessFieldset],
      template: `
        <fieldset
          ngxHeadlessFieldset
          #fieldset="fieldset"
          [field]="addressForm.address"
          includeNestedErrors
        >
          <span data-testid="show-warnings">
            {{ fieldset.shouldShowWarnings() }}
          </span>
          <span data-testid="warning-count">
            {{ fieldset.aggregatedWarnings().length }}
          </span>
          @for (warning of fieldset.aggregatedWarnings(); track warning.kind) {
            <span data-testid="warning-message">{{ warning.message }}</span>
          }
        </fieldset>
      `,
    })
    class TestComponent {
      readonly #model = signal({ address: { street: '', city: '' } });
      readonly addressForm = form(
        this.#model,
        schema((path) => {
          validate(path.address.street, (ctx) => {
            const value = ctx.value();
            if (!value) {
              return {
                kind: 'warn:street-optional',
                message: 'Street can be left blank',
              };
            }
            return null;
          });
        }),
      );
    }

    const { fixture } = await render(TestComponent);

    fixture.componentInstance.addressForm.address().markAsTouched();
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(screen.getByTestId('warning-count')).toHaveTextContent('1');
    expect(screen.getByTestId('show-warnings')).toHaveTextContent('true');
    expect(screen.getByTestId('warning-message')).toHaveTextContent(
      'Street can be left blank',
    );
  });

  it('uses provided fieldsetId or generates a fallback', async () => {
    @Component({
      selector: 'ngx-test-fieldset-id',

      imports: [NgxHeadlessFieldset],
      template: `
        <fieldset
          ngxHeadlessFieldset
          #fieldset="fieldset"
          [field]="addressForm.address"
          fieldsetId="address"
        >
          <span data-testid="fieldset-id">
            {{ fieldset.resolvedFieldsetId() }}
          </span>
        </fieldset>
      `,
    })
    class TestComponent {
      readonly #model = signal({ address: { street: '', city: '' } });
      readonly addressForm = form(this.#model);
    }

    await render(TestComponent);

    expect(screen.getByTestId('fieldset-id')).toHaveTextContent('address');
  });

  it('inherits the error-display strategy from the enclosing form context', async () => {
    @Component({
      selector: 'ngx-test-fieldset-inherit-strategy',

      imports: [FormRoot, NgxSignalForm, NgxHeadlessFieldset],
      template: `
        <form [formRoot]="addressForm" ngxSignalForm errorStrategy="immediate">
          <fieldset
            ngxHeadlessFieldset
            #fieldset="fieldset"
            [field]="addressForm.address"
            includeNestedErrors
          >
            <span data-testid="resolved-strategy">
              {{ fieldset.resolvedStrategy() }}
            </span>
            <span data-testid="show-errors">
              {{ fieldset.shouldShowErrors() }}
            </span>
          </fieldset>
        </form>
      `,
    })
    class TestComponent {
      readonly #model = signal({ address: { street: '', city: '' } });
      readonly addressForm = form(
        this.#model,
        schema((path) => {
          required(path.address.street, { message: 'Required' });
        }),
      );
    }

    await render(TestComponent);

    // Form-level 'immediate' strategy should cascade through the context
    expect(screen.getByTestId('resolved-strategy')).toHaveTextContent(
      'immediate',
    );
    // With 'immediate' strategy, errors surface even without markAsTouched.
    expect(screen.getByTestId('show-errors')).toHaveTextContent('true');
  });

  it('honours an explicit submittedStatus override regardless of form context', async () => {
    @Component({
      selector: 'ngx-test-fieldset-submitted-status',

      imports: [NgxHeadlessFieldset],
      template: `
        <fieldset
          ngxHeadlessFieldset
          #fieldset="fieldset"
          [field]="addressForm.address"
          submittedStatus="submitted"
        >
          <span data-testid="resolved-submitted-status">
            {{ fieldset.resolvedSubmittedStatus() }}
          </span>
        </fieldset>
      `,
    })
    class TestComponent {
      readonly #model = signal({ address: { street: '', city: '' } });
      readonly addressForm = form(this.#model);
    }

    await render(TestComponent);

    expect(screen.getByTestId('resolved-submitted-status')).toHaveTextContent(
      'submitted',
    );
  });

  it('attaches to non-<fieldset> hosts via the attribute selector', async () => {
    @Component({
      selector: 'ngx-test-fieldset-attr-selector',

      imports: [NgxHeadlessFieldset],
      template: `
        <div
          data-testid="fieldset-host"
          ngxHeadlessFieldset
          #fieldset="fieldset"
          [field]="addressForm.address"
          fieldsetId="address"
        >
          <span data-testid="fieldset-id">
            {{ fieldset.resolvedFieldsetId() }}
          </span>
          <span data-testid="is-invalid">{{ fieldset.isInvalid() }}</span>
          <span data-testid="is-pending">{{ fieldset.isPending() }}</span>
        </div>
      `,
    })
    class TestComponent {
      readonly #model = signal({ address: { street: '', city: '' } });
      readonly addressForm = form(this.#model);
    }

    await render(TestComponent);

    // Directive must work on a <div>, not just <fieldset>. Selector is
    // attribute-only, so the tag doesn't matter.
    expect(screen.getByTestId('fieldset-host').tagName).toBe('DIV');
    expect(screen.getByTestId('fieldset-id')).toHaveTextContent('address');
    expect(screen.getByTestId('is-invalid')).toHaveTextContent('false');
    expect(screen.getByTestId('is-pending')).toHaveTextContent('false');
  });

  it('generates a fieldset id when none is provided', async () => {
    @Component({
      selector: 'ngx-test-fieldset-id-generated',

      imports: [NgxHeadlessFieldset],
      template: `
        <fieldset
          ngxHeadlessFieldset
          #fieldset="fieldset"
          [field]="addressForm.address"
        >
          <span data-testid="fieldset-id">
            {{ fieldset.resolvedFieldsetId() }}
          </span>
        </fieldset>
      `,
    })
    class TestComponent {
      readonly #model = signal({ address: { street: '', city: '' } });
      readonly addressForm = form(this.#model);
    }

    await render(TestComponent);

    const resolved = screen.getByTestId('fieldset-id').textContent ?? '';
    expect(resolved.trim().startsWith('fieldset-')).toBe(true);
  });

  describe('warningStrategy', () => {
    it('defaults warnings to "immediate" even when the blocking-error strategy is "on-submit"', async () => {
      @Component({
        selector: 'ngx-test-fieldset-warning-default-immediate',

        imports: [FormRoot, NgxSignalForm, NgxHeadlessFieldset],
        template: `
          <form
            [formRoot]="addressForm"
            ngxSignalForm
            errorStrategy="on-submit"
          >
            <fieldset
              ngxHeadlessFieldset
              #fieldset="fieldset"
              [field]="addressForm.address"
              includeNestedErrors
            >
              <span data-testid="resolved-warning-strategy">
                {{ fieldset.resolvedWarningStrategy() }}
              </span>
              <span data-testid="show-warnings">
                {{ fieldset.shouldShowWarnings() }}
              </span>
              <span data-testid="show-errors">
                {{ fieldset.shouldShowErrors() }}
              </span>
            </fieldset>
          </form>
        `,
      })
      class TestComponent {
        readonly #model = signal({ address: { street: '', city: '' } });
        readonly addressForm = form(
          this.#model,
          schema((path) => {
            required(path.address.street, { message: 'Required' });
            validate(path.address.street, (ctx) => {
              const value = ctx.value();
              if (!value) {
                return {
                  kind: 'warn:street-optional',
                  message: 'Street can be left blank',
                };
              }
              return null;
            });
          }),
        );
      }

      await render(TestComponent);

      // Blocking-error strategy is 'on-submit' and the form has not been
      // submitted, so blocking errors stay hidden...
      expect(screen.getByTestId('show-errors')).toHaveTextContent('false');
      // ...but the warning defaults to 'immediate' independently, so it
      // surfaces right away — matching NgxFormFieldWrapper's contract.
      expect(screen.getByTestId('resolved-warning-strategy')).toHaveTextContent(
        'immediate',
      );
      expect(screen.getByTestId('show-warnings')).toHaveTextContent('true');
    });

    it('honours an explicit warningStrategy="on-submit" override, delaying warnings until submit', async () => {
      @Component({
        selector: 'ngx-test-fieldset-warning-explicit-on-submit',

        imports: [NgxHeadlessFieldset],
        template: `
          <fieldset
            ngxHeadlessFieldset
            #fieldset="fieldset"
            [field]="addressForm.address"
            includeNestedErrors
            warningStrategy="on-submit"
            [submittedStatus]="submittedStatus()"
          >
            <span data-testid="show-warnings">
              {{ fieldset.shouldShowWarnings() }}
            </span>
          </fieldset>
        `,
      })
      class TestComponent {
        readonly #model = signal({ address: { street: '', city: '' } });
        readonly addressForm = form(
          this.#model,
          schema((path) => {
            validate(path.address.street, (ctx) => {
              const value = ctx.value();
              if (!value) {
                return {
                  kind: 'warn:street-optional',
                  message: 'Street can be left blank',
                };
              }
              return null;
            });
          }),
        );
        readonly submittedStatus = signal<'unsubmitted' | 'submitted'>(
          'unsubmitted',
        );
      }

      const { fixture } = await render(TestComponent);

      // Warning stays hidden until the explicit override's own submit gate
      // is satisfied.
      expect(screen.getByTestId('show-warnings')).toHaveTextContent('false');

      fixture.componentInstance.submittedStatus.set('submitted');
      fixture.detectChanges();
      await TestBed.inject(ApplicationRef).whenStable();

      expect(screen.getByTestId('show-warnings')).toHaveTextContent('true');
    });

    it('shows warnings and errors independently, even when both are visible at once', async () => {
      @Component({
        selector: 'ngx-test-fieldset-warning-error-interplay',

        imports: [NgxHeadlessFieldset],
        template: `
          <fieldset
            ngxHeadlessFieldset
            #fieldset="fieldset"
            [field]="addressForm.address"
            includeNestedErrors
            strategy="immediate"
          >
            <span data-testid="show-errors">
              {{ fieldset.shouldShowErrors() }}
            </span>
            <span data-testid="show-warnings">
              {{ fieldset.shouldShowWarnings() }}
            </span>
            <span data-testid="warning-count">
              {{ fieldset.aggregatedWarnings().length }}
            </span>
          </fieldset>
        `,
      })
      class TestComponent {
        readonly #model = signal({ address: { street: '', city: '' } });
        readonly addressForm = form(
          this.#model,
          schema((path) => {
            required(path.address.street, { message: 'Required' });
            validate(path.address.city, (ctx) => {
              const value = ctx.value();
              if (!value) {
                return {
                  kind: 'warn:city-optional',
                  message: 'City can be left blank',
                };
              }
              return null;
            });
          }),
        );
      }

      await render(TestComponent);

      // Both are gated by 'immediate'-family strategies, so both are
      // visible at once — shouldShowWarnings is no longer suppressed just
      // because shouldShowErrors is true (matches
      // NgxHeadlessErrorSummary.shouldShowWarnings).
      expect(screen.getByTestId('show-errors')).toHaveTextContent('true');
      expect(screen.getByTestId('show-warnings')).toHaveTextContent('true');
      expect(screen.getByTestId('warning-count')).toHaveTextContent('1');
    });
  });
});
