import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  afterNextRender,
  Component,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  viewChild,
} from '@angular/core';
import { PageControlsService } from '../page-controls/page-controls.service';
import { PanelHelpService } from '../display-controls-card/panel-help.service';

/**
 * The configuration panel. The panel *is* the card — a single surface with a
 * pinned "Display Controls" header and a scrolling body. The page's registered
 * controls render flat inside it (no card-within-a-card).
 *
 * Two variants share one implementation:
 * - `rail` — persistent right column (mounted ≥1280px).
 * - `slideover` — fixed overlay used below 1280px. Mounted at the shell root so
 *   its fixed positioning is never trapped inside the rail's `display:none`.
 */
@Component({
  selector: 'ngx-right-rail',
  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [NgTemplateOutlet],
  host: {
    '[class.is-rail]': "variant() === 'rail'",
  },
  styleUrl: './right-rail.scss',
  templateUrl: './right-rail.html',
})
export class RightRailComponent {
  readonly #pageControls = inject(PageControlsService);
  readonly #help = inject(PanelHelpService);
  readonly #injector = inject(Injector);

  readonly variant = input<'rail' | 'slideover'>('rail');
  readonly panelOpen = this.#pageControls.panelOpen;
  readonly showDetails = this.#help.showDetails;
  readonly template = this.#pageControls.template;

  // Native `#private` fields on a `viewChild()` query miscompile under this
  // workspace's dev toolchain (Vite + @analogjs/vite-plugin-angular JIT
  // compilation of an external `templateUrl`): the query silently corrupts
  // the component's view and Angular's runtime throws a nonsensical
  // NG0304 "'ngx-root' is not a known element" from deep inside
  // RightRailComponent on first render. A TypeScript `private` (compile-time
  // only, not a real JS private field) query behaves identically at
  // runtime and reproduces the bug in neither dev nor prod builds — use it
  // for query fields in this file instead of `#`.
  private readonly slideoverDialog =
    viewChild<ElementRef<HTMLDialogElement>>('slideoverDialog');

  constructor() {
    // Keep the native <dialog>'s open/closed state in lockstep with
    // `panelOpen`. showModal() (not show()) is what makes the dialog
    // "modal": it renders the ::backdrop, makes the rest of the document
    // inert, traps Tab focus, and moves focus in — see right-rail.html for
    // the full rationale.
    effect(() => {
      const dialog = this.slideoverDialog()?.nativeElement;
      if (!dialog) return;

      const shouldBeOpen = this.panelOpen();
      if (shouldBeOpen && !dialog.open) {
        // The dialog's content (including the `autofocus` close button) is
        // gated on this same `panelOpen` signal in the template — deferring
        // to afterNextRender guarantees that content has actually been
        // committed to the DOM before showModal() runs its focusing steps.
        // showModal() looks for an `[autofocus]` descendant synchronously,
        // once, at call time; calling it before the content renders would
        // silently fall back to focusing the dialog itself instead.
        afterNextRender(
          () => {
            dialog.showModal();
          },
          { injector: this.#injector },
        );
      } else if (!shouldBeOpen && dialog.open) {
        dialog.close();
      }
    });
  }

  protected toggleHelp(): void {
    this.#help.toggle();
  }

  protected closePanel(): void {
    this.#pageControls.closePanel();
  }

  protected collapseRail(): void {
    this.#pageControls.collapseRail();
  }

  /**
   * Fires for every way the native dialog closes — our own `close()` call
   * above, the Escape key (browser-default `cancel` -> `close`), or
   * `HTMLDialogElement.close()` called from anywhere else. Syncing back
   * into the service here (rather than only handling Escape specially)
   * means `panelOpen` can never drift out of sync with the DOM's actual
   * open/closed state.
   */
  protected onDialogClosed(): void {
    this.#pageControls.closePanel();
  }

  /**
   * Native <dialog> does not close on ::backdrop clicks by itself. A click
   * whose coordinates land outside the dialog's own content box (i.e. on
   * the backdrop) reports `event.target` as the dialog element — the
   * bounding-rect check below is the standard light-dismiss pattern and is
   * robust even when the dialog has padding.
   */
  protected onDialogBackdropClick(event: MouseEvent): void {
    const dialog = event.currentTarget;
    if (!(dialog instanceof HTMLDialogElement)) return;

    const rect = dialog.getBoundingClientRect();
    const clickedOutsideContent =
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom;

    if (clickedOutsideContent) {
      this.closePanel();
    }
  }
}
