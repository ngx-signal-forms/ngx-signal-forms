import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, of, pairwise, startWith, switchMap, timer } from 'rxjs';
import { getRouteTitle, SITE_NAME } from '@ngx-signal-forms/demo-shared';
import { NavTreeComponent } from './ui/nav-tree';
import { RightRailComponent } from './ui/right-rail';
import { NgxThemeSwitcherComponent } from './ui/theme-switcher/theme-switcher';
import { PageControlsService } from './ui/page-controls';

/** Strips the query string and fragment from a router URL. */
function toPath(url: string): string {
  return url.split(/[?#]/)[0] ?? url;
}

@Component({
  selector: 'ngx-root',

  imports: [
    RouterOutlet,
    RouterLink,
    NavTreeComponent,
    RightRailComponent,
    NgxThemeSwitcherComponent,
  ],
  host: {
    '(document:keydown.escape)': 'closeNav()',
  },
  styles: `
    :host {
      display: block;
    }

    /* ── Shell layout ──
       Below 900px the left nav becomes an off-canvas drawer (see the
       ".shell__nav" media query below) instead of forcing the shell to
       stay wide — there is no hard minimum width, so the shell reflows
       down to 320px CSS px without a horizontal scrollbar (WCAG 2.2 AA
       1.4.10 Reflow). ≥900px is visually unchanged from before. */
    .shell {
      display: flex;
      height: 100dvh;
      overflow: hidden;
      background: var(--color-bg);
    }

    /* ── Left nav ── */
    .shell__nav {
      width: 15rem;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--color-bg-chrome);
      border-right: 1px solid var(--color-border);
    }

    /* Below 900px: the nav leaves the flex flow and becomes a fixed
       off-canvas drawer, closed by default. The is-nav-open class (toggled
       by the hamburger button in .shell__mobile-bar) slides it in. */
    @media (width < 900px) {
      .shell__nav {
        position: fixed;
        inset-block: 0;
        left: 0;
        z-index: 70;
        width: min(80vw, 18rem);
        transform: translateX(-100%);
        visibility: hidden;
        transition:
          transform 220ms cubic-bezier(0.16, 1, 0.3, 1),
          visibility 0s linear 220ms;
        box-shadow: 12px 0 32px -16px
          color-mix(in srgb, var(--color-shadow) 35%, transparent);
      }

      .shell__nav.is-nav-open {
        transform: translateX(0);
        visibility: visible;
        transition:
          transform 220ms cubic-bezier(0.16, 1, 0.3, 1),
          visibility 0s;
      }

      @media (prefers-reduced-motion: reduce) {
        .shell__nav {
          transition: none;
        }
      }
    }

    /* Backdrop behind the open drawer — click closes it, same pattern as
       the display-controls slide-over. */
    .shell__nav-backdrop {
      position: fixed;
      inset: 0;
      z-index: 65;
      background: var(--color-backdrop);
      animation: navBackdropIn 160ms ease;
    }

    .shell__nav-backdrop.is-leaving {
      animation: navBackdropIn 160ms ease reverse forwards;
    }

    @keyframes navBackdropIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    /* Mobile top bar with the hamburger toggle — only exists below 900px. */
    .shell__mobile-bar {
      display: none;
    }

    @media (width < 900px) {
      .shell__mobile-bar {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-shrink: 0;
        height: 3.25rem;
        padding-inline: 1rem;
        background: var(--color-bg-chrome);
        border-bottom: 1px solid var(--color-border);
      }
    }

    .shell__nav-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.75rem;
      height: 2.75rem;
      flex-shrink: 0;
      border: 1px solid var(--color-border);
      border-radius: 0.5rem;
      background: none;
      color: var(--color-text);
      cursor: pointer;
    }

    .shell__nav-toggle:focus-visible {
      outline: 2px solid var(--color-border-focus);
      outline-offset: 2px;
    }

    .shell__nav-toggle svg {
      width: 1.15rem;
      height: 1.15rem;
    }

    .shell__mobile-bar-brand {
      font-size: 1.1rem;
      font-weight: 800;
      letter-spacing: -0.045em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .shell__nav-header {
      padding: 1.4rem 1rem 0.45rem 1.25rem;
      flex-shrink: 0;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.5rem;
    }

    /* Only meaningful once the nav is a drawer (<900px) — hidden at wide
       widths where the nav is always visible and there's nothing to close. */
    .shell__nav-close {
      display: none;
    }

    @media (width < 900px) {
      .shell__nav-close {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.75rem;
        height: 2.75rem;
        flex-shrink: 0;
        border: none;
        border-radius: 0.5rem;
        background: none;
        color: var(--color-text-muted);
        cursor: pointer;
      }

      .shell__nav-close:hover {
        background: var(--color-surface-hover);
        color: var(--color-text);
      }

      .shell__nav-close:focus-visible {
        outline: 2px solid var(--color-border-focus);
        outline-offset: 2px;
      }

      .shell__nav-close svg {
        width: 1rem;
        height: 1rem;
      }
    }

    .shell__brand {
      display: inline-block;
      font-size: 1.375rem;
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.04em;
      text-decoration: none;
      white-space: nowrap;
    }

    .shell__tagline {
      margin-top: 0.375rem;
      font-size: 0.8125rem;
      line-height: 1.35;
      color: var(--color-text-muted);
    }

    .shell__brand:focus-visible {
      outline: 2px solid var(--color-border-focus);
      outline-offset: 4px;
      border-radius: 0.5rem;
    }

    .shell__brand:hover {
      filter: saturate(1.05) brightness(1.02);
    }

    .shell__nav-tree {
      flex: 1;
      min-height: 0;
      padding: 0.2rem 0 0.75rem;
      overflow-y: auto;
    }

    .shell__nav-footer {
      padding: 0.85rem 1rem;
      border-top: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      gap: 0.25rem;
      flex-shrink: 0;
    }

    .shell__footer-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2rem;
      height: 2rem;
      border-radius: 0.375rem;
      color: var(--color-link);
      transition: color 140ms ease;
    }

    .shell__footer-link:hover {
      color: var(--color-link-hover);
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
      border: 1px solid color-mix(in srgb, var(--color-accent) 30%, transparent);
      border-right: none;
      border-radius: 9999px 0 0 9999px;
      background: linear-gradient(
        180deg,
        var(--color-brand-strong) 0%,
        var(--color-brand-deep) 100%
      );
      color: var(--color-on-brand);
      cursor: pointer;
      box-shadow:
        -6px 10px 24px -10px
          color-mix(in srgb, var(--color-brand-deep) 55%, transparent),
        0 2px 6px -2px color-mix(in srgb, var(--color-shadow) 30%, transparent);
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
        -10px 14px 30px -10px
          color-mix(in srgb, var(--color-brand-deep) 60%, transparent),
        0 3px 8px -2px color-mix(in srgb, var(--color-shadow) 35%, transparent);
    }

    .shell__pin:hover .shell__pin-label,
    .shell__pin:focus-visible .shell__pin-label {
      max-width: 12rem;
      margin-left: 0.55rem;
      opacity: 1;
    }

    .shell__pin:focus-visible {
      outline: 2px solid var(--color-border-focus);
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

    @media (width < 900px) {
      .shell__pin {
        top: 0.25rem;
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
      padding: 1.5rem 16px 2rem;
    }

    @media (width >= 640px) {
      .shell__scroll {
        scrollbar-gutter: stable;
        padding: 1.75rem 2rem 2rem;
      }
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

    /* Thin bar while a lazy route loads; only shown after a short delay so
       fast navigations don't flash it. */
    .shell__progress {
      position: fixed;
      inset-inline: 0;
      top: 0;
      z-index: 80;
      height: 3px;
      background: var(--gradient-brand);
      transform-origin: left;
      animation: shellProgress 1.2s ease-out forwards;
    }

    @keyframes shellProgress {
      from {
        transform: scaleX(0.05);
      }
      to {
        transform: scaleX(0.85);
      }
    }

    /* ── Right rail ── */
    .shell__rail {
      display: none;
      width: 21rem;
      flex-shrink: 0;
      height: 100%;
      border-left: 1px solid var(--color-border);
      background: var(--color-bg-chrome);
      overflow: hidden;
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
    @if (navigating()) {
      <div class="shell__progress" aria-hidden="true"></div>
    }

    <!-- The href is a fallback only: with <base href> a bare fragment link
         resolves against the base URL and leaves the page, so the click
         handler moves focus instead. -->
    <a
      href="#maincontent"
      [attr.inert]="drawerModal() ? '' : null"
      (click)="skipToMain($event)"
      class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-gray-900 focus:shadow focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none dark:focus:bg-gray-900 dark:focus:text-gray-100"
    >
      Skip to main content
    </a>

    <!-- Below 900px, clicking the backdrop or pressing Escape closes the
         nav drawer — the .shell__nav-backdrop only renders while it's open,
         mirroring the display-controls slide-over's backdrop pattern. -->
    @if (navOpen()) {
      <div
        class="shell__nav-backdrop"
        aria-hidden="true"
        animate.leave="is-leaving"
        (click)="closeNav()"
      ></div>
    }

    <div class="shell text-gray-900 dark:text-gray-100">
      <!-- ── Left nav ── (a plain container: the tree inside is the
           navigation landmark, so landmarks don't nest) -->
      <div
        #siteNav
        id="site-nav"
        class="shell__nav"
        [class.is-nav-open]="navOpen()"
        [attr.inert]="navInert() ? '' : null"
        (click)="onNavAreaClick($event)"
      >
        <div class="shell__nav-header">
          <div>
            <a
              [routerLink]="'/getting-started/your-first-form'"
              class="shell__brand brand-gradient"
              aria-label="ngx-signal-forms home"
            >
              ngx-signal-forms
            </a>
            <p class="shell__tagline">
              Accessible errors and fields for Angular Signal Forms.
            </p>
          </div>
          <button
            #navCloseButton
            type="button"
            class="shell__nav-close"
            aria-label="Close navigation"
            (click)="closeNav()"
          >
            <svg
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
      </div>

      <!-- ── Main content ── -->
      <main
        #mainContent
        id="maincontent"
        tabindex="-1"
        class="shell__main"
        [attr.aria-busy]="navigating() ? 'true' : null"
        [attr.inert]="drawerModal() ? '' : null"
      >
        <!-- Only visible below 900px — opens the nav drawer above. -->
        <div class="shell__mobile-bar">
          <button
            #navToggleButton
            type="button"
            class="shell__nav-toggle"
            aria-label="Open navigation"
            aria-controls="site-nav"
            [attr.aria-expanded]="navOpen()"
            (click)="toggleNav()"
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <line x1="2" y1="4.5" x2="14" y2="4.5" />
              <line x1="2" y1="8" x2="14" y2="8" />
              <line x1="2" y1="11.5" x2="14" y2="11.5" />
            </svg>
          </button>
          <span class="shell__mobile-bar-brand brand-gradient">
            ngx-signal-forms
          </span>
        </div>
        <!-- Floating pin — reopens the controls panel (wide: expands the rail,
             narrow: opens the slide-over). Hidden while the panel is visible. -->
        <button
          #pinButton
          type="button"
          class="shell__pin"
          [class.is-rail-collapsed]="railCollapsed()"
          [class.is-slideover-open]="panelOpen()"
          aria-label="Open display controls"
          [attr.aria-controls]="pinControls()"
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
            <circle
              cx="10.5"
              cy="11.5"
              r="1.7"
              fill="currentColor"
              stroke="none"
            />
          </svg>
          <span class="shell__pin-label" aria-hidden="true"
            >Display Controls</span
          >
        </button>
        <div #scrollContainer class="shell__scroll">
          <div class="shell__container">
            <router-outlet />
          </div>
        </div>
      </main>

      <!-- ── Right rail (xl+) ── -->
      <aside
        id="right-panel"
        class="shell__rail"
        [attr.inert]="drawerModal() ? '' : null"
        [class.shell__rail--collapsed]="railCollapsed()"
        aria-label="Page configuration"
      >
        <ngx-right-rail variant="rail" />
      </aside>
    </div>

    <!-- Slide-over (< xl) — outside the shell so it is never inside a
         display:none container; renders only while the panel is open. -->
    <ngx-right-rail variant="slideover" />
  `,
})
export class AppComponent {
  readonly #destroyRef = inject(DestroyRef);
  readonly #document = inject(DOCUMENT);
  readonly #router = inject(Router);
  readonly #title = inject(Title);
  readonly #pageControls = inject(PageControlsService);
  readonly #injector = inject(Injector);

  protected readonly panelOpen = this.#pageControls.panelOpen;
  protected readonly railCollapsed = this.#pageControls.railCollapsed;

  // TS `private` (compile-time only), not a native JS `#` field — see the
  // matching note on RightRailComponent.slideoverDialog for why: `#` fields
  // on `viewChild()` queries miscompile under this workspace's dev
  // toolchain and throw a nonsensical runtime error.
  private readonly pinButton =
    viewChild<ElementRef<HTMLButtonElement>>('pinButton');
  private readonly mainContent =
    viewChild<ElementRef<HTMLElement>>('mainContent');
  private readonly scrollContainer =
    viewChild<ElementRef<HTMLElement>>('scrollContainer');

  /**
   * True while a navigation is in flight for longer than 150ms — lazy
   * routes load their chunk first, and without a cue a nav click on a slow
   * network looks like it did nothing.
   */
  protected readonly navigating = toSignal(
    this.#router.events.pipe(
      filter(
        (e) =>
          e instanceof NavigationStart ||
          e instanceof NavigationEnd ||
          e instanceof NavigationCancel ||
          e instanceof NavigationError,
      ),
      switchMap((e) =>
        e instanceof NavigationStart
          ? timer(150).pipe(map(() => true))
          : of(false),
      ),
    ),
    { initialValue: false },
  );

  /** The URL path without its query string or fragment, so a query-only or
   * fragment-only change does not count as a new page. */
  readonly #currentPath = toSignal(
    this.#router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => toPath(this.#router.url)),
    ),
    { initialValue: toPath(this.#router.url) },
  );

  // Named Angular effect fields are intentionally unread.
  // Angular registers and destroys the effect for the component lifecycle.
  // oxlint-disable-next-line no-unused-private-class-members -- EffectRef is intentionally kept as a named field to document the side effect.
  readonly #syncRouteTitleEffect = effect(() => {
    const path = this.#currentPath();
    const t = getRouteTitle(path);
    // Unknown paths keep the title their own route set (the not-found page).
    if (t !== SITE_NAME) this.#title.setTitle(t);
  });

  /**
   * The page scrolls inside `.shell__scroll`, not the window, so the
   * router's own scroll reset never reaches it. Reset it on every path
   * change, and close the mobile drawer (covers Back/Forward too, not only
   * link clicks inside the drawer).
   */
  // oxlint-disable-next-line no-unused-private-class-members -- EffectRef is intentionally kept as a named field to document the side effect.
  readonly #onPathChangeEffect = effect(() => {
    this.#currentPath();
    this.navOpen.set(false);
    const scroller = this.scrollContainer()?.nativeElement;
    if (scroller) scroller.scrollTop = 0;
  });

  /**
   * Move focus to the new page's `<h1>` after a route change (#571).
   *
   * Without this, focus stays on the nav link that was clicked (or returns
   * to the hamburger on mobile), and a screen-reader user hears nothing
   * about the new page. Focusing the heading announces the page name and
   * puts the next Tab stop at the start of the page content. This is the
   * pattern the Angular accessibility guide recommends.
   *
   * It does not run on the first load (the browser already announces a new
   * document), or when only the query string or fragment changes. Pages
   * without an `<h1>` fall back to `<main>`.
   */
  readonly #pageChange = toSignal(
    this.#router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => ({ id: e.id, path: toPath(e.urlAfterRedirects) })),
      startWith({ id: 0, path: toPath(this.#router.url) }),
      pairwise(),
      // The initial navigation always has id 1. Blocking initial navigation
      // can complete before this subscription exists, so the id check covers
      // both orders.
      filter(([previous, next]) => next.id > 1 && next.path !== previous.path),
      map(([, next]) => next),
    ),
    { initialValue: null },
  );

  // oxlint-disable-next-line no-unused-private-class-members -- EffectRef is intentionally kept as a named field to document the side effect.
  readonly #focusHeadingOnPageChangeEffect = effect(() => {
    if (this.#pageChange() === null) return;

    afterNextRender(
      () => {
        const main = this.mainContent()?.nativeElement;
        const target =
          main?.querySelector<HTMLElement>('h1[tabindex="-1"]') ?? main;
        target?.focus({ preventScroll: true });
      },
      { injector: this.#injector },
    );
  });

  /** Skip link: focus `<main>` in place instead of following the fragment
   * href, which `<base href>` would resolve to another page. */
  protected skipToMain(event: Event): void {
    event.preventDefault();
    const main = this.mainContent()?.nativeElement;
    main?.focus();
    main?.scrollIntoView({ block: 'start' });
  }

  /**
   * Keep focus on a visible control when the wide rail collapses or
   * expands: the button that was pressed disappears in both cases.
   */
  #wasRailCollapsed = this.railCollapsed();
  // oxlint-disable-next-line no-unused-private-class-members -- EffectRef is intentionally kept as a named field to document the side effect.
  readonly #railFocusEffect = effect(() => {
    const collapsed = this.railCollapsed();
    if (collapsed === this.#wasRailCollapsed) return;
    this.#wasRailCollapsed = collapsed;
    if (!this.#wideViewport()) return;

    afterNextRender(
      () => {
        if (collapsed) {
          this.pinButton()?.nativeElement.focus();
        } else {
          this.#document
            .querySelector<HTMLButtonElement>('#right-panel .panel__close')
            ?.focus();
        }
      },
      { injector: this.#injector },
    );
  });

  /**
   * The mobile slide-over's native `<dialog>` already restores focus to
   * whatever was focused before `showModal()` ran (see
   * `RightRailComponent`'s dialog-sync effect) — normally the pin button
   * itself, since clicking it is what opened the panel. That restore step
   * only succeeds if the pin is actually focusable (rendered, not
   * `display: none`) at the exact moment the dialog closes, which races
   * against this same component's own `[class.is-slideover-open]` binding
   * removal on the same `panelOpen` signal. Explicitly re-focusing the pin
   * here — once, after the next render following a close — makes the
   * outcome deterministic instead of depending on CD ordering.
   */
  #wasPanelOpen = false;
  // oxlint-disable-next-line no-unused-private-class-members -- EffectRef is intentionally kept as a named field to document the side effect.
  readonly #restoreFocusToPinEffect = effect(() => {
    const isOpen = this.panelOpen();
    const wasOpen = this.#wasPanelOpen;
    this.#wasPanelOpen = isOpen;

    if (wasOpen && !isOpen) {
      afterNextRender(
        () => {
          this.pinButton()?.nativeElement.focus();
        },
        { injector: this.#injector },
      );
    }
  });

  /**
   * Reopen the controls panel using the affordance that fits the current
   * breakpoint: expand the persistent rail on wide screens, open the
   * slide-over below.
   */
  protected reopenPanel(): void {
    if (this.#wideViewport()) {
      this.#pageControls.expandRail();
    } else {
      this.#pageControls.openPanel();
    }
  }

  // ══════════════════════════════════════════════════════════════════════
  // Mobile nav drawer (<900px) — see the ".shell__nav" media query above.
  // Unlike the display-controls slide-over this isn't a native <dialog>
  // (it shares markup with the always-visible ≥900px nav, so swapping in a
  // <dialog> would mean two templates), so focus-in/focus-out, Escape (a
  // document listener in `host`) and the inert background are wired up by
  // hand instead of coming for free.
  // ══════════════════════════════════════════════════════════════════════

  protected readonly navOpen = signal(false);
  readonly #narrowViewport = signal(false);
  readonly #wideViewport = signal(false);
  protected readonly navInert = computed(
    () => this.#narrowViewport() && !this.navOpen(),
  );
  /** While the drawer is open everything behind it is inert, which keeps
   * Tab inside the drawer the way a modal dialog would. */
  protected readonly drawerModal = computed(
    () => this.#narrowViewport() && this.navOpen(),
  );
  /** The pin opens the rail on wide screens and the slide-over dialog below. */
  protected readonly pinControls = computed(() =>
    this.#wideViewport() ? 'right-panel' : 'display-controls-dialog',
  );

  constructor() {
    const view = this.#document.defaultView;
    const narrowQuery = view?.matchMedia('(width < 900px)');
    const wideQuery = view?.matchMedia('(width >= 1280px)');
    if (!narrowQuery || !wideQuery) {
      return;
    }

    const updateViewport = (): void => {
      this.#narrowViewport.set(narrowQuery.matches);
      this.#wideViewport.set(wideQuery.matches);
      // The drawer only exists below 900px; don't leave its backdrop
      // covering the page after a resize past the breakpoint.
      if (!narrowQuery.matches) this.navOpen.set(false);
    };
    updateViewport();
    narrowQuery.addEventListener('change', updateViewport);
    wideQuery.addEventListener('change', updateViewport);
    this.#destroyRef.onDestroy(() => {
      narrowQuery.removeEventListener('change', updateViewport);
      wideQuery.removeEventListener('change', updateViewport);
    });
  }

  private readonly navCloseButton =
    viewChild<ElementRef<HTMLButtonElement>>('navCloseButton');
  private readonly navToggleButton =
    viewChild<ElementRef<HTMLButtonElement>>('navToggleButton');

  #wasNavOpen = false;
  // oxlint-disable-next-line no-unused-private-class-members -- EffectRef is intentionally kept as a named field to document the side effect.
  readonly #navFocusEffect = effect(() => {
    const isOpen = this.navOpen();
    const wasOpen = this.#wasNavOpen;
    this.#wasNavOpen = isOpen;

    if (isOpen === wasOpen) return;

    afterNextRender(
      () => {
        if (isOpen) {
          this.navCloseButton()?.nativeElement.focus();
          return;
        }

        // Return focus to the toggle only when it would otherwise be lost:
        // still in the now-hidden drawer, or dropped to <body>. After a nav
        // link click, the route-change effect may already have moved focus
        // to the new page's heading, and that must win (#571).
        const active = this.#document.activeElement;
        const lostFocus =
          active === null ||
          active === this.#document.body ||
          this.#document.querySelector('.shell__nav')?.contains(active);
        if (lostFocus) {
          this.navToggleButton()?.nativeElement.focus();
        }
      },
      { injector: this.#injector },
    );
  });

  protected toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  protected closeNav(): void {
    this.navOpen.set(false);
  }

  /** Closing the drawer when a nav link is activated is standard mobile
   * drawer UX — otherwise the drawer stays open, covering the page the
   * user just navigated to, until they explicitly dismiss it. */
  protected onNavAreaClick(event: MouseEvent): void {
    if (!this.navOpen()) return;
    const target = event.target;
    if (target instanceof Element && target.closest('a')) {
      this.closeNav();
    }
  }
}
