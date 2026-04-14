import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type DisplayControlsLayout = 'single' | 'split';

export type DisplayControlChip = {
  label: string;
  value: string;
};

@Component({
  selector: 'ngx-display-controls-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .control-deck {
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(99, 102, 241, 0.16);
      border-radius: 1.75rem;
      background:
        radial-gradient(
          circle at top right,
          rgba(99, 102, 241, 0.12),
          transparent 32%
        ),
        radial-gradient(
          circle at bottom left,
          rgba(14, 165, 233, 0.12),
          transparent 28%
        ),
        linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.98) 0%,
          rgba(248, 250, 252, 0.96) 100%
        );
      box-shadow: 0 26px 60px -38px rgba(50, 65, 85, 0.45);
      padding: 1.25rem;
    }

    .control-deck::after {
      content: '';
      position: absolute;
      inset: 0;
      background:
        linear-gradient(135deg, rgba(255, 255, 255, 0.22), transparent 42%),
        repeating-linear-gradient(
          135deg,
          transparent 0,
          transparent 18px,
          rgba(99, 102, 241, 0.03) 18px,
          rgba(99, 102, 241, 0.03) 19px
        );
      pointer-events: none;
    }

    .control-deck__content {
      position: relative;
      z-index: 1;
      display: grid;
      gap: 1rem;
    }

    .control-deck__header {
      display: grid;
      gap: 0.5rem;
    }

    .control-deck__eyebrow {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #5b6fb3;
    }

    .control-deck__title {
      margin: 0;
      font-size: clamp(1.15rem, 1rem + 0.5vw, 1.45rem);
      line-height: 1.2;
      font-weight: 700;
      color: #1f2a44;
    }

    .control-deck__description {
      max-width: 62ch;
      font-size: 0.95rem;
      line-height: 1.6;
      color: #50627f;
    }

    .control-deck__chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .control-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      border: 1px solid rgba(148, 163, 184, 0.22);
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.78);
      padding: 0.45rem 0.8rem;
      font-size: 0.8rem;
      line-height: 1;
      color: #3f516c;
      backdrop-filter: blur(10px);
    }

    .control-chip strong {
      color: #1f2a44;
    }

    .control-deck__grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: minmax(0, 1.45fr) minmax(18rem, 1fr);
      align-items: start;
    }

    .control-deck__grid--single {
      grid-template-columns: 1fr;
    }

    .control-mode-surface {
      display: grid;
      gap: 0.85rem;
      min-width: 0;
      border-radius: 1.2rem;
      background: linear-gradient(
        180deg,
        rgba(228, 236, 252, 0.92) 0%,
        rgba(239, 244, 255, 0.88) 100%
      );
      padding: 1rem;
    }

    .control-stack {
      display: grid;
      gap: 1rem;
      align-content: start;
      min-width: 0;
    }

    :host-context(.dark) {
      .control-deck {
        border-color: rgba(129, 140, 248, 0.22);
        background:
          radial-gradient(
            circle at top right,
            rgba(79, 70, 229, 0.16),
            transparent 32%
          ),
          radial-gradient(
            circle at bottom left,
            rgba(8, 145, 178, 0.16),
            transparent 28%
          ),
          linear-gradient(
            180deg,
            rgba(15, 23, 42, 0.96) 0%,
            rgba(17, 24, 39, 0.94) 100%
          );
        box-shadow: 0 28px 64px -44px rgba(15, 23, 42, 0.9);
      }

      .control-deck__eyebrow {
        color: #a5b4fc;
      }

      .control-deck__title,
      .control-chip strong {
        color: #f8fafc;
      }

      .control-deck__description,
      .control-chip {
        color: #cbd5e1;
      }

      .control-chip {
        border-color: rgba(148, 163, 184, 0.16);
        background: rgba(15, 23, 42, 0.62);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
      }

      .control-mode-surface {
        background: linear-gradient(
          180deg,
          rgba(37, 99, 235, 0.18) 0%,
          rgba(30, 41, 59, 0.42) 100%
        );
      }
    }

    @media (width <= 900px) {
      .control-deck__grid {
        grid-template-columns: 1fr;
      }
    }
  `,
  template: `
    <section class="control-deck mb-6" [attr.aria-labelledby]="titleId">
      <div class="control-deck__content">
        <div class="control-deck__header">
          <span class="control-deck__eyebrow">{{ eyebrow() }}</span>
          <h2 [id]="titleId" class="control-deck__title">{{ title() }}</h2>
          @if (description()) {
            <p class="control-deck__description">{{ description() }}</p>
          }

          @if (chips().length) {
            <div
              class="control-deck__chips"
              aria-label="Current control settings"
            >
              @for (chip of chips(); track chip.label) {
                <span class="control-chip">
                  <strong>{{ chip.label }}:</strong> {{ chip.value }}
                </span>
              }
            </div>
          }
        </div>

        <div
          class="control-deck__grid"
          [class.control-deck__grid--single]="layout() === 'single'"
        >
          <div class="control-mode-surface">
            <ng-content select="[display-controls-primary]"></ng-content>
          </div>

          @if (layout() === 'split') {
            <div class="control-stack">
              <ng-content select="ngx-display-controls-section"></ng-content>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class DisplayControlsCardComponent {
  readonly eyebrow = input('Display controls');
  readonly title = input.required<string>();
  readonly description = input('');
  readonly chips = input<readonly DisplayControlChip[]>([]);
  readonly layout = input<DisplayControlsLayout>('single');

  protected readonly titleId = `display-controls-title-${crypto.randomUUID()}`;
}
