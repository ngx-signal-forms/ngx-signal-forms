import {
  computed,
  effect,
  inject,
  type Injector,
  type Signal,
} from '@angular/core';
import type { FieldState, ValidationError } from '@angular/forms/signals';
import type { NgxFieldIdentity } from '../services/field-identity';
import { NGX_SIGNAL_FORMS_CONFIG } from '../tokens';
import type {
  ErrorDisplayStrategy,
  ReactiveOrStatic,
  ResolvedErrorDisplayStrategy,
  ResolvedWarningDisplayStrategy,
  SignalLike,
  WarningDisplayStrategy,
} from '../types';
import { assertInjector } from './assert-injector';
import { createErrorVisibility } from './create-error-visibility';
import { createWarningVisibility } from './create-warning-visibility';
import { injectFormContext } from './inject-form-context';
import { readDirectErrors } from './read-direct-errors';
import {
  resolveStrategyFromContext,
  resolveWarningStrategyFromContext,
} from './resolve-strategy';
import { unwrapValue } from './unwrap-signal-or-value';
import { isBlockingError, isWarningError } from './warning-error';

/**
 * The part of a `FieldState` that {@link createFieldPresentation} reads.
 *
 * Every member is optional, so custom controls and tests can pass a partial
 * state. `hidden` is only read when the `hidden` option is omitted.
 *
 * @public
 */
export type FieldPresentationState = Partial<
  Pick<FieldState<unknown>, 'errors' | 'invalid' | 'touched' | 'hidden'>
>;

/**
 * Options for {@link createFieldPresentation}. All are optional.
 *
 * @public
 */
export interface CreateFieldPresentationOptions {
  /**
   * Field-level error display strategy. `null`, `undefined` and `'inherit'`
   * defer to the form context, then to
   * `NGX_SIGNAL_FORMS_CONFIG.defaultErrorStrategy`, then to `'on-touch'`.
   */
  readonly strategy?: SignalLike<ErrorDisplayStrategy | null | undefined>;

  /**
   * Field-level warning display strategy. It resolves through its own
   * cascade and never reads the error strategy (ADR-0007): form context
   * `warningStrategy()`, then `defaultWarningStrategy`, then `'on-touch'`.
   */
  readonly warningStrategy?: SignalLike<
    WarningDisplayStrategy | null | undefined
  >;

  /**
   * Whether the field is hidden. A hidden field shows no messages. When
   * omitted, the factory reads the field state's own `hidden()`.
   */
  readonly hidden?: SignalLike<boolean>;

  /**
   * The field identity to publish the resolved strategies to (ADR-0010).
   * `NgxSignalFormAutoAria` reads them, so `aria-describedby` follows the
   * same field-level overrides as the rendered message regions. Leave it
   * out when your wrapper does not provide an `NgxFieldIdentity`.
   */
  readonly identity?: NgxFieldIdentity | null;

  /**
   * Injector for calls outside an injection context, for example in tests.
   */
  // Angular's Injector is inherently mutable; Readonly<Injector> is not practical here.
  // oxlint-disable-next-line @typescript-eslint/prefer-readonly-parameter-types -- Angular's Injector is mutable by design
  readonly injector?: Injector;
}

/**
 * The error and warning presentation state of one field surface. Every
 * member is a read-only signal.
 *
 * @public
 */
export interface FieldPresentation {
  /** The field's own blocking errors (warnings excluded). */
  readonly errors: Signal<readonly ValidationError[]>;
  /** The field's own warnings (`warn:` kinds). */
  readonly warnings: Signal<readonly ValidationError[]>;
  /** Whether the field has at least one blocking error. */
  readonly hasErrors: Signal<boolean>;
  /** Whether the field has at least one warning. */
  readonly hasWarnings: Signal<boolean>;
  /**
   * Whether blocking errors show now: the field has one, the error strategy
   * allows it, and the field is not hidden. Use it for the invalid styling
   * and the error region.
   */
  readonly showErrors: Signal<boolean>;
  /**
   * Whether warnings show now: the field has one, the warning strategy
   * allows it, the field is not hidden, and no blocking error shows. A
   * warning-only field never suppresses its own warning.
   */
  readonly showWarnings: Signal<boolean>;
  /**
   * Whether to mount the message renderer. It opens when warnings show, or
   * when the error strategy allows messages on a field that has any. The
   * renderer then decides which messages to print.
   */
  readonly renderMessageSlot: Signal<boolean>;
  /** The fully resolved error display strategy. */
  readonly effectiveStrategy: Signal<ResolvedErrorDisplayStrategy>;
  /** The fully resolved warning display strategy. */
  readonly effectiveWarningStrategy: Signal<ResolvedWarningDisplayStrategy>;
}

/**
 * Builds the error and warning presentation state of one field surface.
 *
 * Use it in a custom form-field wrapper. It is the state
 * `NgxFormFieldWrapper` uses, so a custom wrapper shows messages at the
 * same moments as the built-in one.
 *
 * It composes the two cascade seams: `createErrorVisibility()` (ADR-0006)
 * for blocking errors and `createWarningVisibility()` (ADR-0007) for
 * warnings. Each strategy resolves through its own cascade. A visible
 * blocking error hides the warning. A warning alone makes the field
 * `invalid()` to Angular, so the suppression checks for a visible
 * *blocking* error, not for `invalid()`.
 *
 * With an `identity`, the factory publishes both resolved strategies to it
 * in an effect (ADR-0010).
 *
 * Call it in an injection context, or pass `injector`.
 *
 * @param field The field state, as a signal, a getter or a static value.
 *   `null` and `undefined` show nothing.
 * @param options Field-level overrides. All are optional.
 * @returns The presentation state as read-only signals.
 *
 * @example A custom wrapper
 * ```typescript
 * @Component({
 *   selector: 'app-form-field',
 *   hostDirectives: [
 *     { directive: NgxFieldIdentityProvider, inputs: ['fieldName'] },
 *   ],
 *   host: { '[class.app-form-field--invalid]': 'presentation.showErrors()' },
 *   template: `
 *     <ng-content />
 *     @if (presentation.renderMessageSlot()) {
 *       <ngx-form-field-error
 *         [formField]="formField()"
 *         [strategy]="presentation.effectiveStrategy()"
 *         [warningStrategy]="presentation.effectiveWarningStrategy()"
 *       />
 *     }
 *   `,
 * })
 * export class AppFormField {
 *   readonly formField = input.required<FieldTree<unknown>>();
 *   readonly strategy = input<ErrorDisplayStrategy | null>(null);
 *
 *   protected readonly presentation = createFieldPresentation(
 *     computed(() => this.formField()()),
 *     { strategy: this.strategy, identity: inject(NgxFieldIdentity) },
 *   );
 * }
 * ```
 *
 * @see {@link createErrorVisibility} The blocking-error seam
 * @see {@link createWarningVisibility} The warning seam
 *
 * @group Reactive Primitives
 *
 * @public
 */
export function createFieldPresentation(
  field: ReactiveOrStatic<FieldPresentationState | null | undefined>,
  options: CreateFieldPresentationOptions = {},
): FieldPresentation {
  return assertInjector(createFieldPresentation, options.injector, () => {
    const config = inject(NGX_SIGNAL_FORMS_CONFIG);
    const formContext = injectFormContext();

    const effectiveStrategy = computed(() =>
      resolveStrategyFromContext(
        unwrapValue(options.strategy) ?? undefined,
        formContext,
        config.defaultErrorStrategy,
      ),
    );
    const effectiveWarningStrategy = computed(() =>
      resolveWarningStrategyFromContext(
        unwrapValue(options.warningStrategy) ?? undefined,
        formContext,
        config.defaultWarningStrategy,
      ),
    );

    const messages = computed(() => readDirectErrors(unwrapValue(field)));
    const errors = computed(() =>
      messages().filter((error) => isBlockingError(error)),
    );
    const warnings = computed(() =>
      messages().filter((error) => isWarningError(error)),
    );
    const hasErrors = computed(() => errors().length > 0);
    const hasWarnings = computed(() => warnings().length > 0);

    const hiddenOption = options.hidden;
    const hidden =
      hiddenOption === undefined
        ? computed(() => unwrapValue(field)?.hidden?.() === true)
        : () => unwrapValue(hiddenOption);

    // Timing only. It is open on any `invalid()` field, warnings included,
    // which is why `showErrors` adds the blocking-error check.
    const errorTiming = createErrorVisibility(field, {
      strategy: effectiveStrategy,
    });

    const showErrors = computed(
      () => !hidden() && hasErrors() && errorTiming(),
    );

    const warningTiming = createWarningVisibility(field, {
      strategy: effectiveWarningStrategy,
      hasWarnings,
      errorVisibility: showErrors,
    });

    const showWarnings = computed(() => !hidden() && warningTiming());

    const renderMessageSlot = computed(
      () =>
        !hidden() &&
        (showWarnings() || ((hasErrors() || hasWarnings()) && errorTiming())),
    );

    const identity = options.identity;
    if (identity) {
      effect(() => {
        identity.setResolvedStrategies(
          effectiveStrategy(),
          effectiveWarningStrategy(),
        );
      });
    }

    return {
      errors,
      warnings,
      hasErrors,
      hasWarnings,
      showErrors,
      showWarnings,
      renderMessageSlot,
      effectiveStrategy,
      effectiveWarningStrategy,
    };
  });
}
