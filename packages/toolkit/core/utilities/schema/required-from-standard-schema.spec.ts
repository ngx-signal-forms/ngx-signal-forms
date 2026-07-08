import { ApplicationRef, Component, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { NgxSignalFormAutoAria } from '../../directives/auto-aria';
import {
  requiredFromStandardSchema,
  type StandardSchemaLike,
} from './required-from-standard-schema';

/**
 * Builds a minimal Standard Schema (v1) compatible validator for tests.
 * Mirrors the subset of behavior that matters for required-ness probing:
 * a top-level key is "required" when it is missing/`undefined` in the
 * validated object.
 */
function createFakeStandardSchema<T extends Record<string, unknown>>(
  requiredKeys: readonly string[],
): StandardSchemaLike<T> {
  return {
    '~standard': {
      validate: (value: unknown) => {
        const record = (value ?? {}) as Record<string, unknown>;
        const issues = requiredKeys
          .filter((key) => record[key] === undefined)
          .map((key) => ({ message: `${key} is required`, path: [key] }));

        return issues.length > 0 ? { issues } : { value: record as T };
      },
    },
  };
}

describe('requiredFromStandardSchema', () => {
  it("sets FieldState.required() to true for a key the schema rejects when it's undefined", async () => {
    const schema = createFakeStandardSchema<{
      firstName: string;
      nickname: string;
    }>(['firstName']);

    @Component({
      selector: 'ngx-test-standard-schema-required',
      imports: [FormField],
      template: `
        <input [formField]="testForm.firstName" />
        <input [formField]="testForm.nickname" />
      `,
    })
    class TestComponent {
      readonly #model = signal({ firstName: '', nickname: '' });
      readonly testForm = form(this.#model, (path) => {
        requiredFromStandardSchema(path.firstName, schema);
        requiredFromStandardSchema(path.nickname, schema);
      });
    }

    const { fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(fixture.componentInstance.testForm.firstName().required()).toBe(
      true,
    );
    expect(fixture.componentInstance.testForm.nickname().required()).toBe(
      false,
    );
  });

  it('resolves an issue path using the `{ key }` path-segment object form', async () => {
    const schema: StandardSchemaLike<{ email: string }> = {
      '~standard': {
        validate: (value: unknown) => {
          const record = (value ?? {}) as { email?: unknown };
          return record.email === undefined
            ? { issues: [{ message: 'Required', path: [{ key: 'email' }] }] }
            : { value: record as { email: string } };
        },
      },
    };

    @Component({
      selector: 'ngx-test-standard-schema-required-object-path',
      imports: [FormField],
      template: `<input [formField]="testForm.email" />`,
    })
    class TestComponent {
      readonly #model = signal({ email: '' });
      readonly testForm = form(this.#model, (path) => {
        requiredFromStandardSchema(path.email, schema);
      });
    }

    const { fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(fixture.componentInstance.testForm.email().required()).toBe(true);
  });

  it('resolves a schema supplied as a LogicFn', async () => {
    const schema = createFakeStandardSchema<{ firstName: string }>([
      'firstName',
    ]);

    @Component({
      selector: 'ngx-test-standard-schema-required-logic-fn',
      imports: [FormField],
      template: `<input [formField]="testForm.firstName" />`,
    })
    class TestComponent {
      readonly #model = signal({ firstName: '' });
      readonly testForm = form(this.#model, (path) => {
        requiredFromStandardSchema(path.firstName, () => schema);
      });
    }

    const { fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(fixture.componentInstance.testForm.firstName().required()).toBe(
      true,
    );
  });

  it('reports not-required when the schema returns a Promise (async validators are not probed synchronously)', async () => {
    const schema: StandardSchemaLike<{ firstName: string }> = {
      '~standard': {
        validate: () =>
          Promise.resolve({
            issues: [{ message: 'Required', path: ['firstName'] }],
          }),
      },
    };

    @Component({
      selector: 'ngx-test-standard-schema-required-async',
      imports: [FormField],
      template: `<input [formField]="testForm.firstName" />`,
    })
    class TestComponent {
      readonly #model = signal({ firstName: '' });
      readonly testForm = form(this.#model, (path) => {
        requiredFromStandardSchema(path.firstName, schema);
      });
    }

    const { fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(fixture.componentInstance.testForm.firstName().required()).toBe(
      false,
    );
  });

  it('reports not-required when the schema throws while being probed', async () => {
    const schema: StandardSchemaLike<{ firstName: string }> = {
      '~standard': {
        validate: () => {
          throw new Error('boom');
        },
      },
    };

    @Component({
      selector: 'ngx-test-standard-schema-required-throws',
      imports: [FormField],
      template: `<input [formField]="testForm.firstName" />`,
    })
    class TestComponent {
      readonly #model = signal({ firstName: '' });
      readonly testForm = form(this.#model, (path) => {
        requiredFromStandardSchema(path.firstName, schema);
      });
    }

    const { fixture } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    expect(fixture.componentInstance.testForm.firstName().required()).toBe(
      false,
    );
  });

  it('writes aria-required="true" via NgxSignalFormAutoAria for a schema-required field (regression #118)', async () => {
    const schema = createFakeStandardSchema<{
      firstName: string;
      nickname: string;
    }>(['firstName']);

    @Component({
      selector: 'ngx-test-standard-schema-required-aria',
      imports: [FormField, NgxSignalFormAutoAria],
      template: `
        <label for="firstName">First name</label>
        <input id="firstName" [formField]="testForm.firstName" />
        <label for="nickname">Nickname</label>
        <input id="nickname" [formField]="testForm.nickname" />
      `,
    })
    class TestComponent {
      readonly #model = signal({ firstName: '', nickname: '' });
      readonly testForm = form(this.#model, (path) => {
        requiredFromStandardSchema(path.firstName, schema);
        requiredFromStandardSchema(path.nickname, schema);
      });
    }

    const { container } = await render(TestComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    const firstNameInput = container.querySelector('#firstName');
    const nicknameInput = container.querySelector('#nickname');

    expect(firstNameInput).toHaveAttribute('aria-required', 'true');
    expect(nicknameInput).not.toHaveAttribute('aria-required');
  });
});
