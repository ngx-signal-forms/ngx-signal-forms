import {
  afterEveryRender,
  signal,
  type Injector,
  type Signal,
} from '@angular/core';
import { isElementCssVisible } from './field-identity';

/**
 * Track whether the element that carries `aria-invalid` still has a CSS
 * layout box, and publish the answer as a `Signal<boolean>` — the shape
 * `createAriaInvalidSignal`'s third parameter expects.
 *
 * A wrapper that composes the pure ARIA factories opts out of
 * `NgxSignalFormAutoAria`, so it inherits no layout probe and must own one.
 * `docs/CUSTOM_WRAPPERS.md` ("Composing ARIA primitives") explains why a
 * control with no layout box must not keep a stale `aria-invalid`.
 *
 * Reach for this factory when the wrapper has **no** render hook of its own.
 * A wrapper or shim that already runs `afterEveryRender` should call
 * {@link isElementCssVisible} inside its own `earlyRead` instead, and reuse
 * the element it already resolved. `NgxSignalFormAutoAria`
 * (`packages/toolkit/core/directives/auto-aria.ts`) is the reference for
 * that second form.
 *
 * The probe runs in `afterEveryRender`'s `earlyRead` phase because
 * `checkVisibility()` is a layout read. Effects flush before render hooks,
 * so an effect-based probe would report pre-layout geometry.
 *
 * **The probe fails open.** The signal starts `true` and stays `true` while
 * `resolveElement` returns `null`. An element that has not been through
 * layout reports `false`, which would flicker the attribute off and back on
 * during the first render.
 *
 * @param resolveElement Returns the element that **carries** `aria-invalid`,
 *   which is not necessarily the wrapper host. A shim that writes the
 *   attribute onto an inner focusable element must probe that element —
 *   probing the host instead reports the wrong answer whenever the two have
 *   different layout boxes.
 * @param injector Registers the render hook, so a field initializer can call
 *   this factory instead of only a constructor.
 *
 * @public
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
