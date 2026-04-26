import { computed, Directive, inject, input, type Signal } from '@angular/core';
import type { ValidationError } from '@angular/forms/signals';
import {
  generateErrorId,
  generateWarningId,
  isWarningError,
  resolveValidationErrorMessage,
} from '@ngx-signal-forms/toolkit';
import { NGX_ERROR_MESSAGES } from '@ngx-signal-forms/toolkit/core';

/**
 * Visual / ARIA tone for grouped notifications.
 *
 * `auto` inspects the provided messages and routes an all-warning list to
 * the warning live region, mixed/blocking lists to the error live region.
 */
export type NgxNotificationTone = 'auto' | 'error' | 'warning';

/**
 * Resolved notification message with kind and human-facing message.
 */
export interface ResolvedNotificationMessage {
  readonly kind: string;
  readonly message: string;
}

/**
 * State signals exposed by the headless notification directive. A custom
 * styled component should be able to render a complete grouped notification
 * surface (alert + status live regions, IDs, messages) using only these
 * signals — the assistive `NgxFormFieldNotification` is one such consumer.
 */
export interface NotificationStateSignals {
  /** Whether any messages are present. */
  readonly hasMessages: Signal<boolean>;
  /** Resolved tone after applying content-driven semantics. */
  readonly resolvedTone: Signal<'error' | 'warning'>;
  /** Whether the error (`role="alert"`) container should expose content. */
  readonly showErrorContainer: Signal<boolean>;
  /** Whether the warning (`role="status"`) container should expose content. */
  readonly showWarningContainer: Signal<boolean>;
  /** Generated error container id, or `null` when no fieldName is resolvable. */
  readonly errorContainerId: Signal<string | null>;
  /** Generated warning container id, or `null` when no fieldName is resolvable. */
  readonly warningContainerId: Signal<string | null>;
  /** Resolved messages with applied 3-tier message priority. */
  readonly resolvedMessages: Signal<readonly ResolvedNotificationMessage[]>;
}

/**
 * Headless directive for grouped validation notifications.
 *
 * Owns the message-resolution, tone-routing, and ID-generation logic for
 * grouped fieldset feedback and custom summary cards. Used as a
 * `hostDirectives` entry by `NgxFormFieldNotification` so the styled shell
 * stays a UI-only review.
 *
 * ## Tone resolution rules
 *
 * Content always wins over caller intent:
 * - Any blocking (non-`warn:`) error → `'error'` (raises `role="alert"`)
 *   even when the caller passes `tone='warning'` — downgrading real errors
 *   to a polite live region would bury the alert.
 * - Explicit `tone='warning'` is honored when no blocking error is present.
 * - All-warning lists default to `'warning'` even when caller passes
 *   `tone='error'` — over-announcing non-urgent text harms UX.
 * - Empty list defaults to `'error'` (the container stays hidden anyway).
 *
 * ## Usage
 *
 * ```html
 * <div
 *   ngxHeadlessNotification
 *   #notification="notificationState"
 *   [errors]="aggregatedErrors"
 *   fieldName="address"
 * >
 *   @if (notification.showErrorContainer()) {
 *     <my-card role="alert" [id]="notification.errorContainerId()">
 *       @for (m of notification.resolvedMessages(); track m.kind) {
 *         <p>{{ m.message }}</p>
 *       }
 *     </my-card>
 *   }
 * </div>
 * ```
 */
@Directive({
  selector: '[ngxHeadlessNotification]',
  exportAs: 'notificationState',
})
export class NgxHeadlessNotification implements NotificationStateSignals {
  readonly #errorMessagesRegistry = inject(NGX_ERROR_MESSAGES, {
    optional: true,
  });

  /**
   * Grouped validation messages to present.
   *
   * Accepts a signal so the directive composes naturally with `computed()`
   * fieldset aggregations. Callers holding a static array should wrap it in
   * `signal([…])` or `computed(() => […])`.
   */
  readonly errors = input<Signal<readonly ValidationError[]>>();

  /**
   * Optional field/group identifier used to produce deterministic ids for
   * `aria-describedby` linkage. Pass `null` (or omit) to disable id output.
   */
  readonly fieldName = input<string | null | undefined>();

  /**
   * Tone for the notification — see {@link NgxNotificationTone} and the
   * directive-level "tone resolution rules" doc.
   *
   * @default 'auto'
   */
  readonly tone = input<NgxNotificationTone>('auto');

  readonly #resolvedErrors = computed<readonly ValidationError[]>(() => {
    const provided = this.errors();
    return provided === undefined ? [] : provided();
  });

  readonly hasMessages = computed(() => this.#resolvedErrors().length > 0);

  readonly resolvedTone = computed<'error' | 'warning'>(() => {
    const explicit = this.tone();
    const messages = this.#resolvedErrors();
    const hasBlockingError = messages.some(
      (message) => !isWarningError(message),
    );

    if (hasBlockingError) return 'error';
    if (explicit === 'warning') return 'warning';

    const allWarnings = messages.length > 0 && !hasBlockingError;
    if (allWarnings) return 'warning';

    return 'error';
  });

  readonly showErrorContainer = computed(
    () => this.hasMessages() && this.resolvedTone() === 'error',
  );

  readonly showWarningContainer = computed(
    () => this.hasMessages() && this.resolvedTone() === 'warning',
  );

  readonly errorContainerId = computed<string | null>(() => {
    const fieldName = this.fieldName()?.trim();
    return fieldName ? generateErrorId(fieldName) : null;
  });

  readonly warningContainerId = computed<string | null>(() => {
    const fieldName = this.fieldName()?.trim();
    return fieldName ? generateWarningId(fieldName) : null;
  });

  readonly resolvedMessages = computed<readonly ResolvedNotificationMessage[]>(
    () =>
      this.#resolvedErrors().map((error) => ({
        kind: error.kind,
        message: resolveValidationErrorMessage(
          error,
          this.#errorMessagesRegistry,
        ),
      })),
  );
}
