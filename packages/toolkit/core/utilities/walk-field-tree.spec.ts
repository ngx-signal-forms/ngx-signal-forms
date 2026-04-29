import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  form,
  schema,
  type DisabledReason,
  type FieldState,
  type FieldTree,
  type FormField,
  type MetadataKey,
} from '@angular/forms/signals';
import { describe, expect, it } from 'vitest';
import { walkFieldTreeEntries } from './walk-field-tree';

describe('walkFieldTreeEntries', () => {
  interface OrderModel {
    name: string;
    address: {
      street: string;
      city: string;
    };
    items: readonly string[];
  }

  const makeOrderForm = (): FieldTree<OrderModel> => {
    const model = signal<OrderModel>({
      name: 'Ada',
      address: { street: 'First', city: 'London' },
      items: ['compiler', 'notes'],
    });

    return TestBed.runInInjectionContext(() =>
      form(
        model,
        schema<OrderModel>(() => undefined),
      ),
    );
  };

  it('visits object and array subtrees in depth-first order', () => {
    const orderForm = makeOrderForm();

    const visited = [...walkFieldTreeEntries(orderForm)].map(
      (entry) => entry.state.fieldTree,
    );

    expect(visited).toEqual([
      orderForm,
      orderForm.name,
      orderForm.address,
      orderForm.address.street,
      orderForm.address.city,
      orderForm.items,
      orderForm.items[0],
      orderForm.items[1],
    ]);
  });

  it('defensively stops revisiting nodes when a cycle is encountered', () => {
    const root = createMockWalkableField<Record<string, unknown>>({});
    const loop = createMockWalkableField<Record<string, unknown>>({});

    attachEntries(root, [['loop', loop]]);
    attachEntries(loop, [['root', root]]);

    const visited = [...walkFieldTreeEntries(root)].map(
      (entry) => entry.state.fieldTree,
    );

    expect(visited).toEqual([root, loop]);
  });

  it('throws when a child entry is not a FieldTree', () => {
    const malformedRoot = createMockWalkableField<Record<string, unknown>>({});
    attachEntries(malformedRoot, [['broken', {}]]);

    expect(() => [...walkFieldTreeEntries(malformedRoot)]).toThrow(
      /field "broken" to be a FieldTree/,
    );
  });
});

function createMockWalkableField<TValue>(value: TValue): FieldTree<TValue> {
  let entries: Array<readonly [string, unknown]> = [];
  let fieldTree!: FieldTree<TValue>;

  const valueSignal = signal(value);
  const state: Omit<FieldState<TValue>, 'fieldTree'> = {
    value: valueSignal,
    controlValue: signal(value),
    disabled: signal(false),
    disabledReasons: signal<DisabledReason[]>([]),
    dirty: signal(false),
    errorSummary: signal([]),
    errors: signal([]),
    formFieldBindings: signal<FormField<unknown>[]>([]),
    hidden: signal(false),
    invalid: signal(false),
    keyInParent: signal('root'),
    max: signal<number | undefined>(undefined),
    maxLength: signal<number | undefined>(undefined),
    min: signal<number | undefined>(undefined),
    minLength: signal<number | undefined>(undefined),
    name: signal('root'),
    pattern: signal<readonly RegExp[]>([]),
    pending: signal(false),
    readonly: signal(false),
    required: signal(false),
    submitting: signal(false),
    touched: signal(false),
    valid: signal(true),
    focusBoundControl: (): void => undefined,
    markAsDirty: (): void => undefined,
    markAsTouched: (): void => undefined,
    metadata: <M>(_key: MetadataKey<M, unknown, unknown>): M | undefined =>
      undefined,
    reset: (): void => undefined,
  };

  fieldTree = Object.assign(
    () =>
      ({
        ...state,
        get fieldTree() {
          return fieldTree;
        },
      }) satisfies FieldState<TValue>,
    {
      [Symbol.iterator]: function* () {
        yield* entries;
      },
    },
  ) as FieldTree<TValue>;

  Object.defineProperty(fieldTree, 'setChildrenForTest', {
    value(nextEntries: Array<readonly [string, unknown]>) {
      entries = nextEntries;
    },
  });

  return fieldTree;
}

function attachEntries(
  fieldTree: FieldTree<unknown>,
  entries: Array<readonly [string, unknown]>,
): void {
  (
    fieldTree as FieldTree<unknown> & {
      setChildrenForTest(nextEntries: Array<readonly [string, unknown]>): void;
    }
  ).setChildrenForTest(entries);
}
