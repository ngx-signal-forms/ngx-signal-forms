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
  readonly touched?: boolean;
  readonly dirty?: boolean;
  readonly pending?: boolean;
  readonly submitting?: boolean;
  readonly hidden?: boolean;
  readonly disabled?: boolean;
  readonly isReadonly?: boolean;
  /** Defaults to a no-op. Set to observe (or fake) focus movement. */
  readonly focusBoundControl?: (options?: FocusOptions) => void;
  /** Simulates a custom control that never registered a binding. */
  readonly omitFocusBoundControl?: boolean;
  /** Elements exposed via `fieldState.formFieldBindings()`. */
  readonly formFieldBindings?: readonly HTMLElement[];
  readonly markAsTouched?: () => void;
  readonly markAsDirty?: () => void;
  readonly reset?: (value?: TValue) => void;
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
    touched = false,
    dirty = false,
    pending = false,
    submitting = false,
    hidden = false,
    disabled = false,
    isReadonly = false,
    focusBoundControl,
    omitFocusBoundControl = false,
    formFieldBindings = [],
    markAsTouched = (): void => undefined,
    markAsDirty = (): void => undefined,
    reset = (): void => undefined,
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
    dirty: signal(dirty),
    errorSummary: errorSignal,
    errors: errorSignal,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- test-only partial FormField shape; only `element` is read by production code.
    formFieldBindings: signal(
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
    pending: signal(pending),
    readonly: signal(isReadonly),
    required: signal(false),
    submitting: signal(submitting),
    touched: signal(touched),
    valid: signal(valid),
    focusBoundControl: focusBoundControlFn,
    markAsDirty,
    markAsTouched,
    metadata: <M>(_key: MetadataKey<M, unknown, unknown>): M | undefined =>
      undefined,
    hasMetadata: (_key: MetadataKey<unknown, unknown, unknown>): boolean =>
      false,
    getError: (_kind: string): undefined => undefined,
    reset,
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
