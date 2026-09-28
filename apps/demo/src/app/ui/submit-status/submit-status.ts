import { Component, input } from '@angular/core';

/**
 * Success message after a demo form submits.
 *
 * The `role="status"` container stays in the DOM and only its content
 * changes. A live region that is created together with its text is often
 * skipped by screen readers.
 *
 * @example
 * <ngx-submit-status [message]="successMessage()" />
 */
@Component({
  selector: 'ngx-submit-status',
  host: { class: 'block' },
  template: `
    <div role="status">
      @if (message(); as text) {
        <p
          class="mt-4 flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
        >
          <span aria-hidden="true">✓</span>
          <span>{{ text }}</span>
        </p>
      }
    </div>
  `,
})
export class SubmitStatusComponent {
  /** The message to show. An empty string shows nothing. */
  readonly message = input('');
}
