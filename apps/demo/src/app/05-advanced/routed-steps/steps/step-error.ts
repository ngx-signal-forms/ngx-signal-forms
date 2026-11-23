import {
  Component,
  computed,
  type ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import { focusHeadingOnStepChange } from './step-focus';

/**
 * The `errorComponent` of each step route. The router shows it in the outlet
 * in place of a step that threw, and gives it the error through the `error`
 * input.
 *
 * The form, the step navigation and the entries of the other steps are above
 * the outlet, so they stay. "Try again" runs the same navigation again, and
 * the router then creates a new instance of the step.
 */
@Component({
  selector: 'ngx-step-error',
  styleUrl: './step.scss',
  template: `
    <div class="step-error">
      <h2
        #heading
        tabindex="-1"
        class="step-heading"
        aria-describedby="step-error-message"
      >
        This step could not be shown
      </h2>
      <p id="step-error-message" class="step-text">
        Your entries in the other steps are safe. Try again, or go to another
        step.
      </p>
      @if (reason(); as reason) {
        <p class="step-error__reason">Reason: {{ reason }}</p>
      }
      <button type="button" class="btn-primary" (click)="retry()">
        Try again
      </button>
    </div>
  `,
})
export class StepErrorComponent {
  readonly #router = inject(Router);

  /** The error that the step threw. The router sets it. */
  readonly error = input<unknown>();

  /**
   * A failed `resource()` throws a wrapper error when its value is read. The
   * `cause` of the wrapper is the error of the loader.
   */
  protected readonly reason = computed(() => {
    const error = this.error();
    const source =
      error instanceof Error && error.cause instanceof Error
        ? error.cause
        : error;
    return source instanceof Error ? source.message : null;
  });

  // TS `private`, not `#`: see the note on AppComponent's queries.
  private readonly heading =
    viewChild.required<ElementRef<HTMLHeadingElement>>('heading');

  constructor() {
    focusHeadingOnStepChange(this.heading);
  }

  protected retry(): void {
    void this.#router.navigateByUrl(this.#router.url, {
      onSameUrlNavigation: 'reload',
    });
  }
}
