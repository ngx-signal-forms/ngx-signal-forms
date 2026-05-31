import { Component, signal, type Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  applyEach,
  form,
  required,
  schema,
  type FieldTree,
} from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import {
  createFieldOptionalitySummary,
  summarizeFieldOptionality,
} from './field-optionality';

/**
 * Builds a form inside an injection context and returns its tree. `form()`
 * must run in DI, so we create a throwaway host component and read the field.
 */
function makeForm<T extends object>(
  model: T,
  build?: Parameters<typeof schema<T>>[0],
): FieldTree<T> {
  @Component({ template: '' })
  class Host {
    readonly tree = build
      ? form(signal(model), schema(build))
      : form(signal(model));
  }

  const fixture = TestBed.createComponent(Host);
  return fixture.componentInstance.tree;
}

describe('summarizeFieldOptionality', () => {
  it('reports only required for an all-required flat form', () => {
    const tree = makeForm({ a: '', b: '' }, (path) => {
      required(path.a);
      required(path.b);
    });

    expect(summarizeFieldOptionality(tree)).toEqual({
      hasRequired: true,
      hasOptional: false,
    });
  });

  it('reports only optional for an all-optional flat form', () => {
    const tree = makeForm({ a: '', b: '' });

    expect(summarizeFieldOptionality(tree)).toEqual({
      hasRequired: false,
      hasOptional: true,
    });
  });

  it('reports both for a mixed flat form', () => {
    const tree = makeForm({ a: '', b: '' }, (path) => {
      required(path.a);
    });

    expect(summarizeFieldOptionality(tree)).toEqual({
      hasRequired: true,
      hasOptional: true,
    });
  });

  it('descends into nested object subtrees', () => {
    const tree = makeForm(
      { address: { street: '', city: '' }, nickname: '' },
      (path) => {
        required(path.address.street);
      },
    );

    // street is required (nested); city + nickname are optional.
    expect(summarizeFieldOptionality(tree)).toEqual({
      hasRequired: true,
      hasOptional: true,
    });
  });

  it('descends into array items (array of objects)', () => {
    const tree = makeForm({ contacts: [{ name: '', note: '' }] }, (path) => {
      applyEach(path.contacts, (item) => {
        required(item.name);
      });
    });

    // Each array item's `name` is required; `note` is optional.
    expect(summarizeFieldOptionality(tree)).toEqual({
      hasRequired: true,
      hasOptional: true,
    });
  });

  it('treats an array of primitives as a container (visits its scalar elements)', () => {
    // Documented edge: a `string[]` is descended into, so its elements — not the
    // array node — are visited. With a populated array and no required() on the
    // elements, they count as optional leaves; the array-level required state is
    // intentionally not contributed.
    const tree = makeForm({ tags: ['a', 'b'] });

    expect(summarizeFieldOptionality(tree)).toEqual({
      hasRequired: false,
      hasOptional: true,
    });
  });

  it('reports both false for an empty form', () => {
    const tree = makeForm({});

    expect(summarizeFieldOptionality(tree)).toEqual({
      hasRequired: false,
      hasOptional: false,
    });
  });
});

describe('createFieldOptionalitySummary', () => {
  it('reports both false when the tree source is null', () => {
    const { hasRequired, hasOptional } = createFieldOptionalitySummary(
      () => null,
    );

    expect(hasRequired()).toBe(false);
    expect(hasOptional()).toBe(false);
  });

  it('tracks a conditionally-required field reactively', () => {
    const wantsEmail = signal(false);

    @Component({ template: '' })
    class Host {
      readonly model = signal({ contact: '' });
      readonly tree = form(
        this.model,
        schema<{ contact: string }>((path) => {
          required(path.contact, { when: () => wantsEmail() });
        }),
      );
      readonly summary = createFieldOptionalitySummary(() => this.tree);
    }

    const fixture = TestBed.createComponent(Host);
    const { summary } = fixture.componentInstance;

    // Initially optional.
    expect(summary.hasRequired()).toBe(false);
    expect(summary.hasOptional()).toBe(true);

    // Flip the predicate → the field becomes required and the summary updates.
    wantsEmail.set(true);
    expect(summary.hasRequired()).toBe(true);
  });

  it('reacts when the tree source itself changes', () => {
    const requiredTree = makeForm({ a: '' }, (path) => {
      required(path.a);
    });
    const optionalTree = makeForm({ a: '' });

    const source = signal<FieldTree<{ a: string }>>(optionalTree);
    const { hasRequired }: { hasRequired: Signal<boolean> } =
      createFieldOptionalitySummary(() => source());

    expect(hasRequired()).toBe(false);

    source.set(requiredTree);
    expect(hasRequired()).toBe(true);
  });
});
