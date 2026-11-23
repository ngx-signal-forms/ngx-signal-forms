import {
  afterNextRender,
  type ElementRef,
  inject,
  type Signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { DEMO_PATHS } from '@ngx-signal-forms/demo-shared';

/**
 * Moves focus to the heading of a step when the step replaces other step
 * content of this example: after a step change, after "Try again", and when
 * a step fails and its fallback renders.
 *
 * The control that the visitor used is gone at that moment, so focus would
 * drop to `<body>`. The heading announces the new content.
 *
 * It does nothing when the visitor comes from another page. The app shell
 * then moves focus to the page heading. Call it from a constructor.
 */
export function focusHeadingOnStepChange(
  heading: Signal<ElementRef<HTMLElement>>,
): void {
  const previousUrl =
    inject(Router).lastSuccessfulNavigation()?.finalUrl?.toString() ?? '';
  if (!previousUrl.startsWith(DEMO_PATHS.routedSteps)) return;

  afterNextRender(() => {
    heading().nativeElement.focus();
  });
}
