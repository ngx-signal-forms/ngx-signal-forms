import { signal } from '@angular/core';
import type {
  DisabledReason,
  FieldState,
  FieldTree,
  FormField,
  MetadataKey,
  ValidationError,
} from '@angular/forms/signals';

/**
 * Options for {@link createMockFieldTree}. `value` is the only required
 * field; everything else defaults to a valid, untouched, idle leaf.
 *
 * @internal
 */
export interface MockFieldTreeOptions<TValue> {
  readonly value: TValue;
  readonly errors?: readonly ValidationError.WithFieldTree[];
  readonly valid?: boolean;
  readonly invalid?: boolean;
  readonly hidden?: boolean;
  readonly disabled?: boolean;
  readonly isReadonly?: boolean;
  /** Defaults to a no-op. Set to observe (or fake) focus movement. */
  readonly focusBoundControl?: (options?: FocusOptions) => void;
  /** Simulates a custom control that never registered a binding. */
  readonly omitFocusBoundControl?: boolean;
  /** Elements exposed via `fieldState.formFieldBindings()`. */
  readonly formFieldBindings?: readonly HTMLElement[];
}

/**
 * Builds a fully-typed, callable `FieldTree<TValue>` mock — a shared
 * INTERNAL test helper for specs that need a leaf/root `FieldTree` without
 * rendering a real form.
 *
 * Every `FieldState` member is populated (mostly with inert defaults), so a
 * spec that reads a member this helper's callers didn't think to override
 * gets a typed, harmless value instead of `undefined` reaching through an
 * unsafe cast. Matches `FieldState<TValue>` structurally, the same
 * discipline `tsconfig.spec.json` calls for (issue #286): a mock whose shape
 * drifts from the real Angular type is the exact way a spec could pass
 * against a shape Angular never emits.
 *
 * Not exported from any package barrel — import it directly from this file.
 *
 * @internal
 */
export function createMockFieldTree<TValue>(
  options: Readonly<MockFieldTreeOptions<TValue>>,
): FieldTree<TValue> {
  const {
    value,
    errors = [],
    valid = true,
    invalid = false,
    hidden = false,
    disabled = false,
    isReadonly = false,
    focusBoundControl,
    omitFocusBoundControl = false,
    formFieldBindings = [],
  } = options;

  let fieldTree!: FieldTree<TValue>;

  const valueSignal = signal(value);
  const errorSignal = signal([...errors]);
  const focusBoundControlFn =
    focusBoundControl ?? ((_options?: FocusOptions): void => undefined);

  const fieldState: FieldState<TValue> = {
    get fieldTree() {
      return fieldTree;
    },
    value: valueSignal,
    controlValue: valueSignal,
    disabled: signal(disabled),
    disabledReasons: signal<DisabledReason[]>([]),
    dirty: signal(false),
    errorSummary: errorSignal,
    errors: errorSignal,
    formFieldBindings: signal(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- test-only partial FormField shape; only `element` is read by production code.
      formFieldBindings.map((element) => ({ element }) as FormField<unknown>),
    ),
    hidden: signal(hidden),
    invalid: signal(invalid),
    keyInParent: signal<string | number>('root'),
    max: signal<NonNullable<TValue> | undefined>(undefined),
    maxLength: signal<number | undefined>(undefined),
    min: signal<NonNullable<TValue> | undefined>(undefined),
    minLength: signal<number | undefined>(undefined),
    name: signal('root'),
    pattern: signal<readonly RegExp[]>([]),
    pending: signal(false),
    readonly: signal(isReadonly),
    required: signal(false),
    submitting: signal(false),
    touched: signal(false),
    valid: signal(valid),
    focusBoundControl: focusBoundControlFn,
    markAsDirty: (): void => undefined,
    markAsTouched: (): void => undefined,
    metadata: <M>(_key: MetadataKey<M, unknown, unknown>): M | undefined =>
      undefined,
    hasMetadata: (_key: MetadataKey<unknown, unknown, unknown>): boolean =>
      false,
    getError: (_kind: string): undefined => undefined,
    reset: (): void => undefined,
    reloadValidation: (): void => undefined,
  };

  if (omitFocusBoundControl) {
    delete (fieldState as Partial<FieldState<TValue>>).focusBoundControl;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- this test helper only needs the callable FieldTree shape its consumers read.
  fieldTree = Object.assign(
    (): FieldState<TValue> => fieldState,
    {},
  ) as FieldTree<TValue>;

  return fieldTree;
}
