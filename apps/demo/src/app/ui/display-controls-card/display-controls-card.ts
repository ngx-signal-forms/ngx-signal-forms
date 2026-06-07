import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: grid;
      gap: 0.9rem;
    }

    .dc__title {
      margin: 0;
      font-size: 0.98rem;
      line-height: 1.3;
      font-weight: 700;
      color: #1f2a44;
    }

    .dc__description {
      margin: 0;
      font-size: 0.85rem;
      line-height: 1.55;
      color: #50627f;
    }

    .dc__chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }

    .control-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      border: 1px solid rgba(148, 163, 184, 0.28);
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.7);
      padding: 0.35rem 0.65rem;
      font-size: 0.76rem;
      line-height: 1;
      color: #3f516c;
    }

    .control-chip strong {
      color: #1f2a44;
    }

    .dc__controls {
      display: grid;
      gap: 0.95rem;
    }

    .dc__primary {
      display: grid;
      gap: 0.85rem;
      min-width: 0;
    }

    /* divider between the primary control and the first extra section */
    .dc__primary:not(:last-child) {
      padding-bottom: 0.95rem;
      border-bottom: 1px solid rgba(148, 163, 184, 0.18);
    }

    :host-context(.dark) {
      .dc__title,
      .control-chip strong {
        color: #f8fafc;
      }

      .dc__description {
        color: #cbd5e1;
      }

      .control-chip {
        border-color: rgba(148, 163, 184, 0.2);
        background: rgba(15, 23, 42, 0.55);
        color: #cbd5e1;
      }

      .dc__primary:not(:last-child) {
        border-bottom-color: rgba(148, 163, 184, 0.16);
      }
    }
  `,
  template: `
    <h2 class="dc__title">{{ title() }}</h2>
    @if (description() && help.showDetails()) {
      <p class="dc__description">{{ description() }}</p>
    }

    @if (chips().length) {
      <div class="dc__chips" aria-label="Current control settings">
        @for (chip of chips(); track chip.label) {
          <span class="control-chip">
            <strong>{{ chip.label }}:</strong> {{ chip.value }}
          </span>
        }
      </div>
    }

    <div class="dc__controls">
      <div class="dc__primary">
        <ng-content select="[display-controls-primary]"></ng-content>
      </div>
      <ng-content select="ngx-display-controls-section"></ng-content>
    </div>
  `,
})
export class DisplayControlsCardComponent {
  protected readonly help = inject(PanelHelpService);

  readonly eyebrow = input('Display controls');
  readonly title = input.required<string>();
  readonly description = input('');
  readonly chips = input<readonly DisplayControlChip[]>([]);
  readonly layout = input<DisplayControlsLayout>('single');
}
