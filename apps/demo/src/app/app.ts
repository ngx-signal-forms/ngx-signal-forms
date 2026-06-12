import { Component, effect, inject } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { getRouteTitle } from '@ngx-signal-forms/demo-shared';
import { NavTreeComponent } from './ui/nav-tree';
import { RightRailComponent } from './ui/right-rail';
import { NgxThemeSwitcherComponent } from './ui/theme-switcher/theme-switcher';
import { PageControlsService } from './ui/page-controls';

@Component({
  selector: 'ngx-root',

  imports: [
    RouterOutlet,
    RouterLink,
    NavTreeComponent,
    RightRailComponent,
    NgxThemeSwitcherComponent,
  ],
  styles: `
    :host {
      display: block;
    }

    /* ── Shell layout ── */
    .shell {
      display: flex;
      height: 100dvh;
      min-width: 900px;
      overflow: hidden;
      background: rgb(248 250 252);
    }

    :host-context(.dark) .shell {
      background: rgb(2 6 23);
    }

    /* ── Left nav ── */
    .shell__nav {
      width: 15rem;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      height: 100%;
      background: rgb(255 255 255);
      border-right: 1px solid rgb(226 232 240);
      overflow-y: auto;
      scrollbar-gutter: stable;
    }

    :host-context(.dark) .shell__nav {
      background: rgb(2 6 23);
      border-right-color: rgb(15 23 42);
    }

    .shell__nav-header {
      padding: 1.4rem 1rem 0.45rem 1.25rem;
      flex-shrink: 0;
    }

    .shell__brand {
      display: inline-block;
      font-size: 1.65rem;
      font-weight: 800;
      line-height: 1;
      letter-spacing: -0.055em;
      text-decoration: none;
      white-space: nowrap;
    }

    .shell__brand:focus-visible {
      outline: 2px solid rgb(99 102 241);
      outline-offset: 4px;
      border-radius: 0.5rem;
    }

    .shell__brand:hover {
      filter: saturate(1.05) brightness(1.02);
    }

    .shell__nav-tree {
      flex: 1;
      padding: 0.2rem 0 0.75rem;
      overflow-y: auto;
    }

    .shell__nav-footer {
      padding: 0.85rem 1rem;
      border-top: 1px solid rgb(226 232 240);
      display: flex;
      align-items: center;
      gap: 0.65rem;
      flex-shrink: 0;
    }

    :host-context(.dark) .shell__nav-footer {
      border-top-color: rgb(15 23 42);
    }

    .shell__footer-link {
      display: inline-flex;
      align-items: center;
      color: rgb(79 70 229);
      transition: color 140ms ease;
    }

    .shell__footer-link:hover {
      color: rgb(55 48 163);
    }

    :host-context(.dark) .shell__footer-link {
      color: rgb(196 181 253);
    }

    :host-context(.dark) .shell__footer-link:hover {
      color: rgb(238 242 255);
    }

    .shell__footer-link svg {
      width: 1rem;
      height: 1rem;
    }

    /* ── Floating reopen pin ──────────────────────────────────
       The single affordance to reopen the controls panel: expands the
       collapsed rail on wide screens, opens the slide-over below. */
    .shell__pin {
      position: fixed;
      top: 1.5rem;
      right: 0;
      z-index: 45;
      display: inline-flex;
      align-items: center;
      height: 2.75rem;
      padding: 0 0.9rem;
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-right: none;
      border-radius: 9999px 0 0 9999px;
      background: linear-gradient(180deg, #4f46e5 0%, #4338ca 100%);
      color: #fff;
      cursor: pointer;
      box-shadow:
        -6px 10px 24px -10px rgba(67, 56, 202, 0.55),
        0 2px 6px -2px rgba(15, 23, 42, 0.3);
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      animation: pinIn 240ms cubic-bezier(0.16, 1, 0.3, 1);
      transition:
        transform 160ms ease,
        box-shadow 160ms ease,
        filter 160ms ease;
    }

    .shell__pin-icon {
      width: 1.1rem;
      height: 1.1rem;
      flex-shrink: 0;
    }

    /* Icon-only at rest; the label reveals on hover/focus, expanding the
       ribbon leftward from the right edge it is anchored to. */
    .shell__pin-label {
      max-width: 0;
      margin-left: 0;
      opacity: 0;
      overflow: hidden;
      white-space: nowrap;
      transition:
        max-width 240ms cubic-bezier(0.16, 1, 0.3, 1),
        margin-left 240ms cubic-bezier(0.16, 1, 0.3, 1),
        opacity 160ms ease;
    }

    .shell__pin:hover,
    .shell__pin:focus-visible {
      transform: translateX(-3px);
      filter: brightness(1.06);
      box-shadow:
        -10px 14px 30px -10px rgba(67, 56, 202, 0.6),
        0 3px 8px -2px rgba(15, 23, 42, 0.35);
    }

    .shell__pin:hover .shell__pin-label,
    .shell__pin:focus-visible .shell__pin-label {
      max-width: 12rem;
      margin-left: 0.55rem;
      opacity: 1;
    }

    .shell__pin:focus-visible {
      outline: 2px solid rgb(99 102 241);
      outline-offset: 3px;
    }

    @keyframes pinIn {
      from {
        opacity: 0;
        transform: translateX(14px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* Visibility: shown only while the panel is hidden.
       Narrow (default): visible unless the slide-over is open. */
    .shell__pin.is-slideover-open {
      display: none;
    }

    /* Wide: hidden unless the rail is collapsed. */
    @media (width >= 1280px) {
      .shell__pin {
        display: none;
      }

      .shell__pin.is-rail-collapsed {
        display: inline-flex;
      }
    }

    /* ── Main content ── */
    .shell__main {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .shell__scroll {
      flex: 1;
      overflow-y: auto;
      scrollbar-gutter: stable;
      padding: 1.75rem 2rem 2rem;
    }

    @media (width >= 1024px) {
      .shell__scroll {
        padding: 2rem 2.5rem 2.5rem;
      }
    }

    /* Center the form content within the (full-width) main column. */
    .shell__container {
      width: 100%;
      max-width: 72rem;
      margin-inline: auto;
    }

    /* ── Right rail ── */
    .shell__rail {
      display: none;
      width: 21rem;
      flex-shrink: 0;
      height: 100%;
      border-left: 1px solid rgb(226 232 240);
      background: rgb(252 253 255);
      overflow: hidden;
    }

    :host-context(.dark) .shell__rail {
      background: rgb(4 9 30);
      border-left-color: rgb(15 23 42);
    }

    @media (width >= 1280px) {
      .shell__rail {
        display: block;
      }
    }

    /* Collapsed on wide screens — main content reclaims the space. */
    .shell__rail.shell__rail--collapsed {
      display: none;
    }
  `,
  template: `
    <a
      href="#maincontent"
      class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-gray-900 focus:shadow focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:focus:bg-gray-900 dark:focus:text-gray-100"
    >
      Skip to main content
    </a>

    <div class="shell text-gray-900 dark:text-gray-100">
      <!-- ── Left nav ── -->
      <nav class="shell__nav" aria-label="Site navigation">
        <div class="shell__nav-header">
          <a
            [routerLink]="'/getting-started/your-first-form'"
            class="shell__brand brand-gradient"
            aria-label="ngx-signal-forms home"
          >
            ngx-signal-forms
          </a>
        </div>

        <div class="shell__nav-tree">
          <ngx-nav-tree />
        </div>

        <div class="shell__nav-footer">
          <a
            href="https://angular.dev/api/forms/signals"
            target="_blank"
            rel="noopener"
            aria-label="Angular Signal Forms API"
            class="shell__footer-link"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path
                d="M9.931 12.645h4.138l-2.07-4.908m0-7.737L.68 3.982l1.726 14.771L12 24l9.596-5.242L23.32 3.982zM12 2.882l8.458 18.816h-3.153L16.28 16.1H7.672l-1.996 4.287H2.522z"
              />
            </svg>
          </a>
          <a
            href="https://github.com/ngx-signal-forms/ngx-signal-forms"
            target="_blank"
            rel="noopener"
            aria-label="GitHub Repository"
            class="shell__footer-link"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path
                d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577 0-.285-.011-1.04-.016-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.776.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.932 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.984-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.652.242 2.873.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.92.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .319.192.694.801.576C20.566 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z"
              />
            </svg>
          </a>
          <a
            href="https://bsky.app/profile/arzy.dev"
            target="_blank"
            rel="noopener"
            aria-label="Bluesky"
            class="shell__footer-link"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path
                d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 0 1-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8Z"
              />
            </svg>
          </a>
          <a
            href="https://github.com/ngx-signal-forms/ngx-signal-forms/tree/main/packages/toolkit"
            target="_blank"
            rel="noopener"
            aria-label="Toolkit docs"
            class="shell__footer-link font-mono text-[10px] font-bold tracking-wide"
          >
            TK
          </a>

          <ngx-theme-switcher class="ml-auto" />
        </div>
      </nav>

      <!-- ── Main content ── -->
      <main id="maincontent" tabindex="-1" class="shell__main">
        <div class="shell__scroll">
          <div class="shell__container">
            <router-outlet />
          </div>
        </div>
      </main>

      <!-- ── Right rail (xl+) ── -->
      <aside
        id="right-panel"
        class="shell__rail"
        [class.shell__rail--collapsed]="railCollapsed()"
        aria-label="Page configuration"
      >
        <ngx-right-rail variant="rail" />
      </aside>
    </div>

    <!-- Floating pin — reopens the controls panel (wide: expands the rail,
         narrow: opens the slide-over). Hidden while the panel is visible. -->
    <button
      type="button"
      class="shell__pin"
      [class.is-rail-collapsed]="railCollapsed()"
      [class.is-slideover-open]="panelOpen()"
      aria-label="Open display controls"
      aria-controls="right-panel"
      (click)="reopenPanel()"
    >
      <svg
        class="shell__pin-icon"
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
        <circle cx="10.5" cy="11.5" r="1.7" fill="currentColor" stroke="none" />
      </svg>
      <span class="shell__pin-label" aria-hidden="true">Display Controls</span>
    </button>

    <!-- Slide-over (< xl) — outside the shell so it is never inside a
         display:none container; renders only while the panel is open. -->
    <ngx-right-rail variant="slideover" />
  `,
})
export class AppComponent {
  readonly #router = inject(Router);
  readonly #title = inject(Title);
  readonly #pageControls = inject(PageControlsService);

  protected readonly panelOpen = this.#pageControls.panelOpen;
  protected readonly railCollapsed = this.#pageControls.railCollapsed;

  readonly #currentPath = toSignal(
    this.#router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.#router.url.split('?')[0]),
    ),
    { initialValue: this.#router.url.split('?')[0] },
  );

  // Named Angular effect fields are intentionally unread.
  // Angular registers and destroys the effect for the component lifecycle.
  // oxlint-disable-next-line no-unused-private-class-members -- EffectRef is intentionally kept as a named field to document the side effect.
  readonly #syncRouteTitleEffect = effect(() => {
    const path = this.#currentPath();
    const t = getRouteTitle(path);
    if (t) this.#title.setTitle(t);
  });

  /**
   * Reopen the controls panel using the affordance that fits the current
   * breakpoint: expand the persistent rail on wide screens, open the
   * slide-over below.
   */
  protected reopenPanel(): void {
    const wide = window?.matchMedia?.('(min-width: 1280px)')?.matches;
    if (wide) {
      this.#pageControls.expandRail();
    } else {
      this.#pageControls.openPanel();
    }
  }
}
