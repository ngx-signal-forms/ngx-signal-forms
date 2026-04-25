import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  type Signal,
} from '@angular/core';
import type { ValidationError } from '@angular/forms/signals';
import {
  generateErrorId,
  generateWarningId,
  isWarningError,
  resolveValidationErrorMessage,
} from '@ngx-signal-forms/toolkit';
import { NGX_ERROR_MESSAGES } from '@ngx-signal-forms/toolkit/core';

import type { NgxFormFieldListStyle } from './form-field-error';

/**
 * @deprecated Use {@link NgxFormFieldListStyle} — the same union is now
 * exported under a shared name so callers can bind list-style values across
 * error, notification, and fieldset components without duplicate imports.
 */
// oxlint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- alias kept as a deprecated named export for migration.
export type NgxFormFieldNotificationListStyle = NgxFormFieldListStyle;
export type NgxFormFieldNotificationTone = 'auto' | 'error' | 'warning';

/**
 * Grouped validation notification for fieldsets and custom summary blocks.
 *
 * This component is intentionally simpler than `NgxFormFieldError`: the caller
 * decides when the notification should render and passes the relevant grouped
 * errors or warnings. The component focuses on presenting that message set as a
 * surfaced notification card with an optional title.
 *
 * Use it for:
 * - grouped fieldset feedback above/below a section
 * - custom summary cards inside headless flows
 * - design-system style notifications driven by `ValidationError[]`
 */
@Component({
  selector: 'ngx-form-field-notification',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: [
    '../form-field/feedback-tokens.css',
    './form-field-notification.css',
  ],
  template: `
    <!--
      Dual stable live regions: role is fixed per container so the alert/status
      role is never re-assigned at the same tick as content insertion. Toggling
      role between alert and status when the first message arrives is the same
      bug class NgxFormFieldError works around (NVDA + Chrome miss the very
      first announcement when role and content arrive together).
    -->
    <div
      class="ngx-form-field-notification ngx-form-field-notification--error"
      [class.ngx-form-field-notification--empty]="!showErrorContainer()"
      [attr.id]="showErrorContainer() ? errorContainerId() : null"
      role="alert"
      [attr.aria-hidden]="showErrorContainer() ? null : 'true'"
      [hidden]="!showErrorContainer()"
    >
      @if (showErrorContainer()) {
        @if (title()) {
          <p class="ngx-form-field-notification__title">{{ title() }}</p>
        }

        @if (usesBulletList()) {
          <ul class="ngx-form-field-notification__list" role="list">
            @for (
              message of resolvedMessages();
              track message.kind + ':' + message.message + ':' + $index
            ) {
              <li class="ngx-form-field-notification__message">
                {{ message.message }}
              </li>
            }
          </ul>
        } @else {
          <div class="ngx-form-field-notification__stack">
            @for (
              message of resolvedMessages();
              track message.kind + ':' + message.message + ':' + $index
            ) {
              <p class="ngx-form-field-notification__message">
                {{ message.message }}
              </p>
            }
          </div>
        }
      }
    </div>

    <div
      class="ngx-form-field-notification ngx-form-field-notification--warning"
      [class.ngx-form-field-notification--empty]="!showWarningContainer()"
      [attr.id]="showWarningContainer() ? warningContainerId() : null"
      role="status"
      [attr.aria-hidden]="showWarningContainer() ? null : 'true'"
      [hidden]="!showWarningContainer()"
    >
      @if (showWarningContainer()) {
        @if (title()) {
          <p class="ngx-form-field-notification__title">{{ title() }}</p>
        }

        @if (usesBulletList()) {
          <ul class="ngx-form-field-notification__list" role="list">
            @for (
              message of resolvedMessages();
              track message.kind + ':' + message.message + ':' + $index
            ) {
              <li class="ngx-form-field-notification__message">
                {{ message.message }}
              </li>
            }
          </ul>
        } @else {
          <div class="ngx-form-field-notification__stack">
            @for (
              message of resolvedMessages();
              track message.kind + ':' + message.message + ':' + $index
            ) {
              <p class="ngx-form-field-notification__message">
                {{ message.message }}
              </p>
            }
          </div>
        }
      }
    </div>
  `,
})
export class NgxFormFieldNotification {
  readonly #errorMessagesRegistry = inject(NGX_ERROR_MESSAGES, {
    optional: true,
  });

  /**
   * Grouped validation messages to present.
   *
   * Accepts a signal so the component composes naturally with `computed()`
   * fieldset aggregations. Callers holding a static array should wrap it in
   * `signal([…])` or `computed(() => […])` — keeping a single signal-based
   * shape keeps the reactive graph consistent with the rest of the toolkit
   * (notably `NgxFormFieldError.errors`).
   */
  readonly errors = input<Signal<readonly ValidationError[]>>();

  /**
   * Optional field/group identifier used to produce deterministic ids for
   * `aria-describedby` linkage.
   */
  readonly fieldName = input<string | null | undefined>();

  /**
   * Optional title rendered above the message list.
   */
  readonly title = input<string | null | undefined>();

  /**
   * Present grouped messages as a bullet list or as stacked paragraphs.
   */
  readonly listStyle = input<NgxFormFieldListStyle>('bullets');

  /**
   * Visual and ARIA tone for the notification.
   *
   * `auto` inspects the provided errors and treats an all-warning list as a
   * warning notification. Mixed lists resolve to error, which mirrors the
   * toolkit rule that blocking errors win over warnings.
   *
   * Explicit `tone='error'` is ignored when every provided message is a
   * warning — overriding content-driven semantics would raise `role='alert'`
   * over non-urgent warning text, which screen readers announce with greater
   * urgency than the content warrants. An explicit `tone='warning'` is always
   * honored.
   */
  readonly tone = input<NgxFormFieldNotificationTone>('auto');

  protected readonly usesBulletList = computed(() => {
    return this.listStyle() === 'bullets';
  });

  readonly #resolvedErrors = computed<readonly ValidationError[]>(() => {
    const provided = this.errors();
    return provided === undefined ? [] : provided();
  });

  protected readonly hasMessages = computed(() => {
    return this.#resolvedErrors().length > 0;
  });

  protected readonly resolvedTone = computed<'error' | 'warning'>(() => {
    const explicit = this.tone();
    const messages = this.#resolvedErrors();
    const hasBlockingError = messages.some(
      (message) => !isWarningError(message),
    );

    // Content wins both ways: a blocking error keeps `role='alert'` even when
    // the caller explicitly requested `tone='warning'`, and an all-warning
    // list stays `role='status'` even when the caller requested `tone='error'`.
    // Downgrading real errors to a polite live region would bury the alert;
    // upgrading warnings would over-announce non-urgent text.
    if (hasBlockingError) {
      return 'error';
    }

    if (explicit === 'warning') {
      return 'warning';
    }

    const allWarnings = messages.length > 0 && !hasBlockingError;
    if (allWarnings) {
      return 'warning';
    }

    return 'error';
  });

  protected readonly showErrorContainer = computed(
    () => this.hasMessages() && this.resolvedTone() === 'error',
  );

  protected readonly showWarningContainer = computed(
    () => this.hasMessages() && this.resolvedTone() === 'warning',
  );

  protected readonly errorContainerId = computed<string | null>(() => {
    const fieldName = this.fieldName()?.trim();
    return fieldName ? generateErrorId(fieldName) : null;
  });

  protected readonly warningContainerId = computed<string | null>(() => {
    const fieldName = this.fieldName()?.trim();
    return fieldName ? generateWarningId(fieldName) : null;
  });

  protected readonly resolvedMessages = computed(() => {
    return this.#resolvedErrors().map((error) => ({
      kind: error.kind,
      message: resolveValidationErrorMessage(
        error,
        this.#errorMessagesRegistry,
      ),
    }));
  });
}
