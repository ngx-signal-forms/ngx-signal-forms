import { Component, inject, input } from '@angular/core';
import { PanelHelpService } from './panel-help.service';

@Component({
  selector: 'ngx-display-controls-section',

  styles: `
    :host {
      display: grid;
      gap: 0.5rem;
    }

    :host + :host {
      padding-top: 0.8rem;
      border-top: 1px solid var(--color-border);
    }

    .control-panel__title {
      margin: 0;
      font-size: 0.86rem;
      font-weight: 600;
      color: var(--color-text);
    }

    .control-panel__description {
      margin: -0.1rem 0 0.1rem;
      font-size: 0.8rem;
      line-height: 1.5;
      color: var(--color-text-muted);
    }
  `,
  template: `
    <h3 class="control-panel__title">{{ title() }}</h3>
    @if (description() && help.showDetails()) {
      <p class="control-panel__description">{{ description() }}</p>
    }
    <ng-content />
  `,
})
export class DisplayControlsSectionComponent {
  protected readonly help = inject(PanelHelpService);

  readonly title = input.required<string>();
  readonly description = input('');
}
