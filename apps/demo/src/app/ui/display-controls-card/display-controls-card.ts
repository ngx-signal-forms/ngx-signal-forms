import { Component, inject, input } from '@angular/core';
import { PanelHelpService } from './panel-help.service';

export type DisplayControlsLayout = 'single' | 'split';

export type DisplayControlChip = {
  label: string;
  value: string;
};

/**
 * Flat body of the configuration panel. The panel surface and the pinned
 * "Display Controls" header are owned by the right rail / slide-over, so this
 * component renders plain, divider-separated content — no card chrome of its
 * own (avoids a card-within-a-card).
 */
@Component({
  selector: 'ngx-display-controls-card',

  templateUrl: './display-controls-card.html',
  styleUrl: './display-controls-card.scss',
})
export class DisplayControlsCardComponent {
  protected readonly help = inject(PanelHelpService);

  readonly eyebrow = input('Display controls');
  readonly title = input.required<string>();
  readonly description = input('');
  readonly chips = input<readonly DisplayControlChip[]>([]);
  readonly layout = input<DisplayControlsLayout>('single');
}
