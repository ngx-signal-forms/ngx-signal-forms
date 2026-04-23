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

export type NgxFormFieldNotificationListStyle = 'plain' | 'bullets';
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
  styleUrl: './form-field-notification.scss',
  template: `
    <div
      class="ngx-form-field-notification"
      [class.ngx-form-field-notification--error]="resolvedTone() === 'error'"
      [class.ngx-form-field-notification--warning]="
        resolvedTone() === 'warning'
      "
      [class.ngx-form-field-notification--empty]="!hasMessages()"
      [id]="hasMessages() ? containerId() : null"
      [attr.role]="resolvedTone() === 'warning' ? 'status' : 'alert'"
      [attr.aria-hidden]="hasMessages() ? null : 'true'"
    >
      @if (hasMessages()) {
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
   * Accepts either a static array or a signal that resolves to an array so the
   * component composes naturally with `computed()` fieldset aggregations.
   */
  readonly errors = input<
    readonly ValidationError[] | Signal<readonly ValidationError[]> | undefined
  >();

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
  readonly listStyle = input<NgxFormFieldNotificationListStyle>('bullets');

  /**
   * Visual and ARIA tone for the notification.
   *
   * `auto` inspects the provided errors and treats an all-warning list as a
   * warning notification. Mixed lists resolve to error, which mirrors the
   * toolkit rule that blocking errors win over warnings.
   */
  readonly tone = input<NgxFormFieldNotificationTone>('auto');

  protected readonly usesBulletList = computed(() => {
    return this.listStyle() === 'bullets';
  });

  readonly #resolvedErrors = computed(() => {
    const provided = this.errors();

    if (provided === undefined) {
      return [] as readonly ValidationError[];
    }

    return typeof provided === 'function' ? provided() : provided;
  });

  protected readonly hasMessages = computed(() => {
    return this.#resolvedErrors().length > 0;
  });

  protected readonly resolvedTone = computed<'error' | 'warning'>(() => {
    const explicit = this.tone();
    if (explicit === 'error' || explicit === 'warning') {
      return explicit;
    }

    const messages = this.#resolvedErrors();
    if (messages.length > 0 && messages.every(isWarningError)) {
      return 'warning';
    }

    return 'error';
  });

  protected readonly containerId = computed<string | null>(() => {
    const fieldName = this.fieldName()?.trim();
    if (!fieldName) {
      return null;
    }

    return this.resolvedTone() === 'warning'
      ? generateWarningId(fieldName)
      : generateErrorId(fieldName);
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
