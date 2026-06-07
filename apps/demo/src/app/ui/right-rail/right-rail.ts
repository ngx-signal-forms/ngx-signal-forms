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
  styles: `
    :host {
      display: contents;
    }

    :host(.is-rail) {
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 0;
    }

    /* ── The card surface ──────────────────────────────────── */
    .panel {
      position: relative;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
      border: 1px solid rgba(99, 102, 241, 0.18);
      background:
        radial-gradient(
          circle at top right,
          rgba(99, 102, 241, 0.1),
          transparent 42%
        ),
        radial-gradient(
          circle at bottom left,
          rgba(14, 165, 233, 0.08),
          transparent 38%
        ),
        linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.99) 0%,
          rgba(248, 250, 252, 0.97) 100%
        );
    }

    /* faint diagonal weave for texture */
    .panel::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: repeating-linear-gradient(
        135deg,
        transparent 0,
        transparent 17px,
        rgba(99, 102, 241, 0.025) 17px,
        rgba(99, 102, 241, 0.025) 18px
      );
    }

    /* Persistent rail: full-height surface, flush with the column (mirrors
       the left nav). The aside's left border is the divider. */
    :host(.is-rail) .panel {
      flex: 1;
      margin: 0;
      border: 0;
      border-radius: 0;
      box-shadow: none;
    }

    .panel--slideover {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      z-index: 50;
      width: min(26rem, 94vw);
      border-right: 0;
      border-radius: 1.25rem 0 0 1.25rem;
      box-shadow: -10px 0 44px -18px rgba(15, 23, 42, 0.32);
      animation: slideIn 220ms cubic-bezier(0.16, 1, 0.3, 1);
    }

    :host-context(.dark) .panel {
      border-color: rgba(129, 140, 248, 0.24);
      background:
        radial-gradient(
          circle at top right,
          rgba(79, 70, 229, 0.18),
          transparent 42%
        ),
        radial-gradient(
          circle at bottom left,
          rgba(8, 145, 178, 0.14),
          transparent 38%
        ),
        linear-gradient(
          180deg,
          rgba(15, 23, 42, 0.97) 0%,
          rgba(12, 18, 33, 0.96) 100%
        );
    }

    :host-context(.dark) .panel {
      box-shadow: 0 24px 56px -38px rgba(0, 0, 0, 0.85);
    }

    :host-context(.dark) .panel--slideover {
      box-shadow: -10px 0 48px -18px rgba(0, 0, 0, 0.7);
    }

    /* ── Pinned header ─────────────────────────────────────── */
    .panel__header {
      position: relative;
      z-index: 1;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.95rem 1rem 0.7rem;
      border-bottom: 1px solid rgba(99, 102, 241, 0.14);
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.6),
        rgba(255, 255, 255, 0)
      );
    }

    :host-context(.dark) .panel__header {
      border-bottom-color: rgba(129, 140, 248, 0.22);
      background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.03),
        rgba(255, 255, 255, 0)
      );
    }

    .panel__eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.11em;
      text-transform: uppercase;
      color: #5b6fb3;
    }

    :host-context(.dark) .panel__eyebrow {
      color: #a5b4fc;
    }

    .panel__eyebrow svg {
      width: 0.9rem;
      height: 0.9rem;
    }

    .panel__actions {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }

    /* "Details" toggle — reveals the per-setting descriptions */
    .panel__help {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.28rem 0.55rem;
      border: 1px solid rgba(99, 102, 241, 0.28);
      border-radius: 9999px;
      background: rgba(255, 255, 255, 0.6);
      cursor: pointer;
      font-size: 0.66rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #5b6fb3;
      transition:
        background 120ms ease,
        border-color 120ms ease,
        color 120ms ease;
    }

    .panel__help svg {
      width: 0.78rem;
      height: 0.78rem;
    }

    .panel__help:hover {
      border-color: rgba(99, 102, 241, 0.5);
      background: rgba(238, 242, 255, 0.9);
    }

    .panel__help.is-on {
      background: rgb(79 70 229);
      border-color: rgb(79 70 229);
      color: #fff;
    }

    .panel__help:focus-visible {
      outline: 2px solid rgb(99 102 241);
      outline-offset: 2px;
    }

    :host-context(.dark) .panel__help {
      background: rgba(15, 23, 42, 0.5);
      border-color: rgba(129, 140, 248, 0.35);
      color: #a5b4fc;
    }

    :host-context(.dark) .panel__help:hover {
      background: rgba(49, 46, 129, 0.4);
    }

    :host-context(.dark) .panel__help.is-on {
      background: rgb(99 102 241);
      border-color: rgb(99 102 241);
      color: #fff;
    }

    .panel__close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 1.85rem;
      height: 1.85rem;
      border: none;
      border-radius: 0.5rem;
      background: none;
      cursor: pointer;
      color: rgb(100 116 139);
      transition:
        background 120ms ease,
        color 120ms ease;
    }

    .panel__close:hover {
      background: rgb(241 245 249);
      color: rgb(15 23 42);
    }

    :host-context(.dark) .panel__close:hover {
      background: rgb(30 41 59);
      color: rgb(226 232 240);
    }

    .panel__close:focus-visible {
      outline: 2px solid rgb(99 102 241);
      outline-offset: 2px;
    }

    /* ── Scrolling body ────────────────────────────────────── */
    .panel__body {
      position: relative;
      z-index: 1;
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      scrollbar-gutter: stable;
      padding: 0.95rem 1rem 1.25rem;
    }

    /* ── Empty state ───────────────────────────────────────── */
    .panel__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.55rem;
      padding: 1.75rem 1rem;
      text-align: center;
    }

    .panel__empty svg {
      width: 1.6rem;
      height: 1.6rem;
      color: rgb(148 163 184);
      opacity: 0.7;
    }

    .panel__empty-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: rgb(71 85 105);
    }

    :host-context(.dark) .panel__empty-title {
      color: rgb(203 213 225);
    }

    .panel__empty-text {
      font-size: 0.8rem;
      line-height: 1.5;
      color: rgb(148 163 184);
      max-width: 22ch;
    }

    /* ── Slide-over backdrop ───────────────────────────────── */
    .panel-backdrop {
      position: fixed;
      inset: 0;
      z-index: 40;
      background: rgb(15 23 42 / 0.4);
      backdrop-filter: blur(2px);
      animation: fadeIn 180ms ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
      }
      to {
        transform: translateX(0);
      }
    }
  `,
  template: `
    @if (variant() === 'rail') {
      <div class="panel">
        <ng-container [ngTemplateOutlet]="panelHeader" />
        <div class="panel__body">
          <ng-container [ngTemplateOutlet]="panelBody" />
        </div>
      </div>
    } @else if (panelOpen()) {
      <div
        class="panel-backdrop"
        (click)="closePanel()"
        aria-hidden="true"
      ></div>
      <div
        class="panel panel--slideover"
        role="dialog"
        aria-label="Display controls"
        aria-modal="true"
      >
        <ng-container
          [ngTemplateOutlet]="panelHeader"
          [ngTemplateOutletContext]="{ closable: true }"
        />
        <div class="panel__body">
          <ng-container [ngTemplateOutlet]="panelBody" />
        </div>
      </div>
    }

    <!-- Pinned header — "Display Controls" -->
    <ng-template #panelHeader let-closable="closable">
      <header class="panel__header">
        <span class="panel__eyebrow">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <line x1="2.5" y1="4.5" x2="13.5" y2="4.5" />
            <circle cx="6" cy="4.5" r="1.7" fill="currentColor" stroke="none" />
            <line x1="2.5" y1="11.5" x2="13.5" y2="11.5" />
            <circle
              cx="10.5"
              cy="11.5"
              r="1.7"
              fill="currentColor"
              stroke="none"
            />
          </svg>
          Display Controls
        </span>
        <div class="panel__actions">
          @if (template()) {
            <button
              class="panel__help"
              [class.is-on]="showDetails()"
              type="button"
              [attr.aria-pressed]="showDetails()"
              title="Toggle setting descriptions"
              (click)="toggleHelp()"
            >
              <svg
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                aria-hidden="true"
              >
                <circle cx="8" cy="8" r="6.25" />
                <line x1="8" y1="7.2" x2="8" y2="11.5" stroke-linecap="round" />
                <circle
                  cx="8"
                  cy="4.8"
                  r="0.85"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
              Details
            </button>
          }
          @if (closable) {
            <button
              class="panel__close"
              type="button"
              aria-label="Close configuration panel"
              (click)="closePanel()"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d="M1 1l12 12M13 1L1 13" />
              </svg>
            </button>
          } @else {
            <button
              class="panel__close"
              type="button"
              aria-label="Collapse display controls"
              title="Collapse panel"
              (click)="collapseRail()"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
              >
                <path d="M6 3.5l4.5 4.5L6 12.5" />
                <line x1="13" y1="3" x2="13" y2="13" />
              </svg>
            </button>
          }
        </div>
      </header>
    </ng-template>

    <!-- Body — page controls or empty state -->
    <ng-template #panelBody>
      @if (template()) {
        <ng-container [ngTemplateOutlet]="template()!" />
      } @else {
        <div class="panel__empty">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="17" x2="20" y2="17" />
            <circle cx="9" cy="7" r="2.4" />
            <circle cx="15" cy="17" r="2.4" />
            <line x1="3" y1="3" x2="21" y2="21" stroke-width="1.75" />
          </svg>
          <span class="panel__empty-title">No display controls</span>
          <p class="panel__empty-text">
            This page has no configuration options to adjust.
          </p>
        </div>
      }
    </ng-template>
  `,
})
export class RightRailComponent {
  private readonly pageControls = inject(PageControlsService);
  private readonly help = inject(PanelHelpService);

  readonly variant = input<'rail' | 'slideover'>('rail');

  protected readonly template = this.pageControls.template;
  protected readonly panelOpen = this.pageControls.panelOpen;
  protected readonly showDetails = this.help.showDetails;

  protected toggleHelp(): void {
    this.help.toggle();
  }

  protected closePanel(): void {
    this.pageControls.closePanel();
  }

  protected collapseRail(): void {
    this.pageControls.collapseRail();
  }
}
