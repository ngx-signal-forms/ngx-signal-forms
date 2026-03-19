import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'ngx-display-controls-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: grid;
      gap: 0.55rem;
    }

    :host + :host {
      padding-top: 0.95rem;
      border-top: 1px solid rgba(148, 163, 184, 0.18);
    }

    .control-panel__title {
      margin: 0;
      font-size: 0.92rem;
      font-weight: 700;
      color: #22314d;
    }

    .control-panel__description {
      font-size: 0.84rem;
      line-height: 1.55;
      color: #5a6b84;
    }

    @media (prefers-color-scheme: dark) {
      :host + :host {
        border-top-color: rgba(148, 163, 184, 0.16);
      }

      .control-panel__title {
        color: #f8fafc;
      }

      .control-panel__description {
        color: #cbd5e1;
      }
    }
  `,
  template: `
    <h3 class="control-panel__title">{{ title() }}</h3>
    @if (description()) {
      <p class="control-panel__description">{{ description() }}</p>
    }
    <ng-content />
  `,
})
export class DisplayControlsSectionComponent {
  readonly title = input.required<string>();
  readonly description = input('');
}
