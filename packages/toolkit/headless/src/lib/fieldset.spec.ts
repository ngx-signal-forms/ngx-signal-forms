import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
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
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [NgxHeadlessFieldset],
      template: `
        <fieldset
          ngxSignalFormHeadlessFieldset
          #fieldset="fieldset"
          [fieldsetField]="addressForm.address"
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
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [NgxHeadlessFieldset],
      template: `
        <fieldset
          ngxSignalFormHeadlessFieldset
          #fieldset="fieldset"
          [fieldsetField]="addressForm.address"
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
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [NgxHeadlessFieldset],
      template: `
        <fieldset
          ngxSignalFormHeadlessFieldset
          #fieldset="fieldset"
          [fieldsetField]="addressForm.address"
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

  it('shows errors only after touch with default on-touch strategy', async () => {
    @Component({
      selector: 'ngx-test-fieldset-show-errors',
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [NgxHeadlessFieldset],
      template: `
        <fieldset
          ngxSignalFormHeadlessFieldset
          #fieldset="fieldset"
          [fieldsetField]="addressForm.address"
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

  it('shows warnings when no blocking errors exist', async () => {
    @Component({
      selector: 'ngx-test-fieldset-warnings',
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [NgxHeadlessFieldset],
      template: `
        <fieldset
          ngxSignalFormHeadlessFieldset
          #fieldset="fieldset"
          [fieldsetField]="addressForm.address"
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
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [NgxHeadlessFieldset],
      template: `
        <fieldset
          ngxSignalFormHeadlessFieldset
          #fieldset="fieldset"
          [fieldsetField]="addressForm.address"
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
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [FormRoot, NgxSignalForm, NgxHeadlessFieldset],
      template: `
        <form [formRoot]="addressForm" ngxSignalForm errorStrategy="immediate">
          <fieldset
            ngxSignalFormHeadlessFieldset
            #fieldset="fieldset"
            [fieldsetField]="addressForm.address"
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
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [NgxHeadlessFieldset],
      template: `
        <fieldset
          ngxSignalFormHeadlessFieldset
          #fieldset="fieldset"
          [fieldsetField]="addressForm.address"
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
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [NgxHeadlessFieldset],
      template: `
        <div
          data-testid="fieldset-host"
          ngxSignalFormHeadlessFieldset
          #fieldset="fieldset"
          [fieldsetField]="addressForm.address"
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
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [NgxHeadlessFieldset],
      template: `
        <fieldset
          ngxSignalFormHeadlessFieldset
          #fieldset="fieldset"
          [fieldsetField]="addressForm.address"
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
});
