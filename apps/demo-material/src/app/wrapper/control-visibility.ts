import {
  afterEveryRender,
  signal,
  type Injector,
  type Signal,
} from '@angular/core';
import { isElementCssVisible } from '@ngx-signal-forms/toolkit';

/**
 * Tracks whether the element that carries `aria-invalid` still has a CSS
 * layout box, and publishes the answer as a signal fit for
 * `createAriaInvalidSignal`'s third parameter.
 *
 * **Why a wrapper needs this.** `NgxSignalFormAutoAria` probes its own host
 * element every read phase, so plain `[formField]` controls drop
 * `aria-invalid` for free when a collapsed `<details>`, an inactive tab
 * panel, or a non-current wizard step takes their layout box away. A
 * reference wrapper that opts out of auto-ARIA and composes the pure
 * factories instead inherits nothing — without this probe its
 * `aria-invalid` freezes at whatever it was when the container closed, and
 * is wrong the instant the container reopens with a different validation
 * state.
 *
 * **Why `afterEveryRender`'s `earlyRead` phase.** `checkVisibility()` is a
 * layout read. Effects flush strictly *before* render hooks in the same
 * change-detection cycle, so an effect-based probe would report pre-layout
 * geometry. `earlyRead` runs after layout and before any write phase, so
 * the write that sets the attribute sees a value settled for this render.
 * `NgxSignalFormAutoAria` (`packages/toolkit/core/directives/auto-aria.ts`)
 * is the reference for the phasing.
 *
 * The signal starts at `true` and stays `true` while `resolveElement`
 * returns `null`: an element that has not been through layout reports
 * `false`, and stripping `aria-invalid` on the strength of a pre-layout
 * probe would flicker the attribute off and back on every first render.
 * Fail open, then correct on the first real read phase.
 *
 * Each of the three design-system reference apps carries its own copy of
 * this helper on purpose — they are standalone references, and neither
 * depends on the others.
 *
 * @param resolveElement Returns the element that carries `aria-invalid` —
 *   NOT necessarily the wrapper host. Shims that write onto an inner
 *   focusable element must probe that element.
 * @param injector Injector used to register the render hook, so the helper can
 *   be called from a field initializer rather than only inside a constructor.
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
        if (isControlVisible() !== visible) {
          isControlVisible.set(visible);
        }
      },
    },
    { injector },
  );

  return isControlVisible.asReadonly();
}
