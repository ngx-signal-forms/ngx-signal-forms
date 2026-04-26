import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import {
  NgxHeadlessNotification,
  type NgxNotificationTone,
} from '@ngx-signal-forms/toolkit/headless';

import type { NgxFormFieldListStyle } from './form-field-error';

/**
 * @deprecated Use {@link NgxFormFieldListStyle} — the same union is now
 * exported under a shared name so callers can bind list-style values across
 * error, notification, and fieldset components without duplicate imports.
 */
// oxlint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- alias kept as a deprecated named export for migration.
export type NgxFormFieldNotificationListStyle = NgxFormFieldListStyle;

/**
 * @deprecated Use {@link NgxNotificationTone} from
 * `@ngx-signal-forms/toolkit/headless` — the canonical tone type now lives
 * with the headless directive that owns the resolution logic.
 */
export type NgxFormFieldNotificationTone = NgxNotificationTone;

/**
 * Grouped validation notification for fieldsets and custom summary blocks.
 *
 * ## Architecture
 *
 * Thin styled shell over `NgxHeadlessNotification` (composed via
 * `hostDirectives`). The headless directive owns tone routing, message
 * resolution (3-tier priority), and ID generation. The assistive shell only
 * adds:
 *
 * - Template rendering with the dual stable live regions (alert + status)
 * - The optional title slot
 * - List-style choice (`bullets` vs stacked paragraphs)
 *
 * Use it for:
 * - grouped fieldset feedback above/below a section
 * - custom summary cards inside headless flows
 * - design-system style notifications driven by `ValidationError[]`
 */
@Component({
  selector: 'ngx-form-field-notification',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: NgxHeadlessNotification,
      inputs: ['errors', 'fieldName', 'tone'],
    },
  ],
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
      [class.ngx-form-field-notification--empty]="
        !headless.showErrorContainer()
      "
      [attr.id]="
        headless.showErrorContainer() ? headless.errorContainerId() : null
      "
      role="alert"
      [attr.aria-hidden]="headless.showErrorContainer() ? null : 'true'"
      [hidden]="!headless.showErrorContainer()"
    >
      @if (headless.showErrorContainer()) {
        @if (title()) {
          <p class="ngx-form-field-notification__title">{{ title() }}</p>
        }

        @if (usesBulletList()) {
          <ul class="ngx-form-field-notification__list" role="list">
            @for (
              message of headless.resolvedMessages();
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
              message of headless.resolvedMessages();
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
      [class.ngx-form-field-notification--empty]="
        !headless.showWarningContainer()
      "
      [attr.id]="
        headless.showWarningContainer() ? headless.warningContainerId() : null
      "
      role="status"
      [attr.aria-hidden]="headless.showWarningContainer() ? null : 'true'"
      [hidden]="!headless.showWarningContainer()"
    >
      @if (headless.showWarningContainer()) {
        @if (title()) {
          <p class="ngx-form-field-notification__title">{{ title() }}</p>
        }

        @if (usesBulletList()) {
          <ul class="ngx-form-field-notification__list" role="list">
            @for (
              message of headless.resolvedMessages();
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
              message of headless.resolvedMessages();
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
  /**
   * Composed headless directive instance. Exposes tone routing, message
   * resolution, and ID generation. All template bindings read from here so
   * that custom UIs built directly on `NgxHeadlessNotification` stay in
   * lockstep with this surface.
   */
  protected readonly headless = inject(NgxHeadlessNotification);

  /**
   * Optional title rendered above the message list.
   */
  readonly title = input<string | null | undefined>();

  /**
   * Present grouped messages as a bullet list or as stacked paragraphs.
   */
  readonly listStyle = input<NgxFormFieldListStyle>('bullets');

  protected readonly usesBulletList = computed(() => {
    return this.listStyle() === 'bullets';
  });
}
