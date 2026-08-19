import {
  afterEveryRender,
  signal,
  type Injector,
  type Signal,
} from '@angular/core';
import { isElementCssVisible } from '@ngx-signal-forms/toolkit';

/**
 * Tracks whether the element that carries `aria-invalid` still has a CSS
 * layout box, and publishes the answer as a signal for
 * `createAriaInvalidSignal`'s third parameter.
 *
 * A wrapper that composes the pure ARIA factories opts out of
 * `NgxSignalFormAutoAria`, so it inherits no layout probe and must own one.
 * `docs/CUSTOM_WRAPPERS.md` ("Composing ARIA primitives") explains why.
 *
 * The probe runs in `afterEveryRender`'s `earlyRead` phase because
 * `checkVisibility()` is a layout read. Effects flush before render hooks,
 * so an effect-based probe would report pre-layout geometry.
 * `NgxSignalFormAutoAria` (`packages/toolkit/core/directives/auto-aria.ts`)
 * is the reference for the phasing.
 *
 * The probe fails open: the signal starts `true` and stays `true` while
 * `resolveElement` returns `null`. An element that has not been through
 * layout reports `false`, which would flicker the attribute off and back on
 * during the first render.
 *
 * Each design-system demo app carries its own copy. The repo has no shared
 * Angular library for demo code — `packages/demo-shared` is framework-free
 * Playwright metadata — so there is nowhere else to put it today.
 *
 * @param resolveElement Returns the element that carries `aria-invalid`,
 *   which is not necessarily the wrapper host. A shim that writes onto an
 *   inner focusable element must probe that element.
 * @param injector Registers the render hook, so a field initializer can call
 *   this helper instead of only a constructor.
 */
export function createControlVisibilitySignal(
  resolveElement: () => HTMLElement | null,
  injector: Injector,
): Signal<boolean> {
  const isControlVisible = signal(true);

  afterEveryRender(
    {
      earlyRead: () => {
        const element = resolveElement();

        return element === null ? true : isElementCssVisible(element);
      },
      write: (visible) => {
        isControlVisible.set(visible);
      },
    },
    { injector },
  );

  return isControlVisible.asReadonly();
}
