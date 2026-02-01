import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  form,
  required,
  schema,
  validate,
  type FieldTree,
} from '@angular/forms/signals';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxHeadlessFieldsetDirective } from './fieldset.directive';

describe('NgxHeadlessFieldsetDirective', () => {
  it('aggregates and deduplicates field errors from nested fields', async () => {
    @Component({
      selector: 'ngx-test-fieldset-dedupe',
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [NgxHeadlessFieldsetDirective],
      template: `
        <fieldset
          ngxSignalFormHeadlessFieldset
          #fieldset="fieldset"
          [fieldsetField]="addressForm.address"
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

  it('prefers explicit fields override for aggregation', async () => {
    @Component({
      selector: 'ngx-test-fieldset-override',
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [NgxHeadlessFieldsetDirective],
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
      imports: [NgxHeadlessFieldsetDirective],
      template: `
        <fieldset
          ngxSignalFormHeadlessFieldset
          #fieldset="fieldset"
          [fieldsetField]="addressForm.address"
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
      imports: [NgxHeadlessFieldsetDirective],
      template: `
        <fieldset
          ngxSignalFormHeadlessFieldset
          #fieldset="fieldset"
          [fieldsetField]="addressForm.address"
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
      imports: [NgxHeadlessFieldsetDirective],
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

  it('generates a fieldset id when none is provided', async () => {
    @Component({
      selector: 'ngx-test-fieldset-id-generated',
      changeDetection: ChangeDetectionStrategy.OnPush,
      imports: [NgxHeadlessFieldsetDirective],
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
