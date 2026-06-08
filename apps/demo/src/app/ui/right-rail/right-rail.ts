import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
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

  readonly variant = input<'rail' | 'slideover'>('rail');
  readonly panelOpen = this.#pageControls.panelOpen;
  readonly showDetails = this.#help.showDetails;
  readonly template = this.#pageControls.template;

  protected toggleHelp(): void {
    this.#help.toggle();
  }

  protected closePanel(): void {
    this.#pageControls.closePanel();
  }

  protected collapseRail(): void {
    this.#pageControls.collapseRail();
  }
}
