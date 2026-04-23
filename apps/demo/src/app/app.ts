import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import {
  NavigationEnd,
  Router,
  RouterModule,
  RouterOutlet,
} from '@angular/router';
import { DEMO_CATEGORIES, getRouteTitle } from '@ngx-signal-forms/demo-shared';
import { filter, map } from 'rxjs';
import { NgxThemeSwitcherComponent } from './ui/theme-switcher/theme-switcher';

@Component({
  selector: 'ngx-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxThemeSwitcherComponent, RouterOutlet, RouterModule],
  styles: `
    :host {
      display: block;
    }

    .app-shell__header {
      position: relative;
      z-index: 40;
      background: linear-gradient(
        180deg,
        rgb(255 255 255 / 0.95) 0%,
        rgb(255 255 255 / 0.9) 100%
      );
      transition:
        background 180ms ease,
        box-shadow 180ms ease,
        backdrop-filter 180ms ease;
    }

    .app-shell__header--scrolled {
      background: linear-gradient(
        180deg,
        rgb(255 255 255 / 0.8) 0%,
        rgb(255 255 255 / 0.68) 100%
      );
      backdrop-filter: blur(18px) saturate(165%);
    }

    .app-shell__header-main {
      min-width: 0;
    }

    .app-shell__header-main--scrolled {
      box-shadow: 0 12px 24px -22px rgb(15 23 42 / 0.28);
    }

    .app-shell__brand-rail,
    .app-shell__sidebar {
      width: 15rem;
      flex-shrink: 0;
    }

    .app-shell__brand-rail {
      padding-inline: 1.25rem;
    }

    .app-shell__topnav {
      padding-left: 1rem;
    }

    .app-shell__theme-slot {
      padding-inline: 1rem 1.5rem;
    }

    .app-shell__sidebar {
      position: relative;
      padding: 1.25rem 1rem 1rem 1.25rem;
      background: linear-gradient(
        180deg,
        rgb(255 255 255 / 0.98) 0%,
        rgb(248 250 252 / 0.96) 100%
      );
    }

    .app-shell__sidebar::after {
      content: none;
    }

    .app-shell__sidebar-title {
      margin-bottom: 0.85rem;
      font-size: 0.68rem;
      letter-spacing: 0.18em;
    }

    .app-shell__section-nav {
      gap: 0.2rem;
    }

    .nav-grad-link.app-shell__section-link {
      padding: 0.6rem 0.75rem 0.7rem;
      border-radius: 0.95rem;
      font-size: 0.95rem;
      line-height: 1.35;
    }

    .nav-grad-link.app-shell__section-link::after {
      left: 0.75rem;
      right: 0.75rem;
      bottom: 0.3rem;
    }

    .app-shell__sidebar-footer {
      gap: 1rem;
      padding-top: 1.25rem;
    }

    .app-shell__sidebar-footer a {
      transform: translateY(0);
      transition:
        transform 160ms ease,
        color 160ms ease;
    }

    .app-shell__sidebar-footer a:hover,
    .app-shell__sidebar-footer a:focus-visible {
      transform: translateY(-1px);
    }

    .app-shell__main {
      position: relative;
      min-width: 0;
      isolation: isolate;
    }

    .app-shell__main-scroll {
      position: relative;
      height: 100%;
      overflow-y: auto;
      scrollbar-gutter: stable;
      transition:
        -webkit-mask-image 180ms ease,
        mask-image 180ms ease;
    }

    .app-shell__main-scroll--scrolled {
      -webkit-mask-image: linear-gradient(
        180deg,
        transparent 0,
        rgb(0 0 0 / 0.24) 1.25rem,
        rgb(0 0 0 / 0.92) 3.1rem,
        rgb(0 0 0 / 1) 4.4rem,
        rgb(0 0 0 / 1) 100%
      );
      mask-image: linear-gradient(
        180deg,
        transparent 0,
        rgb(0 0 0 / 0.24) 1.25rem,
        rgb(0 0 0 / 0.92) 3.1rem,
        rgb(0 0 0 / 1) 4.4rem,
        rgb(0 0 0 / 1) 100%
      );
    }

    :host-context(.dark) .app-shell__header {
      background: linear-gradient(
        180deg,
        rgb(3 7 18 / 0.96) 0%,
        rgb(3 7 18 / 0.9) 100%
      );
    }

    :host-context(.dark) .app-shell__header--scrolled {
      background: linear-gradient(
        180deg,
        rgb(2 6 23 / 0.8) 0%,
        rgb(2 6 23 / 0.66) 100%
      );
    }

    :host-context(.dark) .app-shell__header-main--scrolled {
      box-shadow: 0 14px 28px -24px rgb(2 6 23 / 0.5);
    }

    :host-context(.dark) .app-shell__sidebar {
      background: linear-gradient(
        180deg,
        rgb(2 6 23 / 0.98) 0%,
        rgb(15 23 42 / 0.94) 100%
      );
    }

    :host-context(.dark) .app-shell__main-scroll--scrolled {
      -webkit-mask-image: linear-gradient(
        180deg,
        transparent 0,
        rgb(0 0 0 / 0.2) 1.25rem,
        rgb(0 0 0 / 0.9) 3.1rem,
        rgb(0 0 0 / 1) 4.4rem,
        rgb(0 0 0 / 1) 100%
      );
      mask-image: linear-gradient(
        180deg,
        transparent 0,
        rgb(0 0 0 / 0.2) 1.25rem,
        rgb(0 0 0 / 0.9) 3.1rem,
        rgb(0 0 0 / 1) 4.4rem,
        rgb(0 0 0 / 1) 100%
      );
    }

    @media (width <= 1024px) {
      .app-shell__brand-rail,
      .app-shell__sidebar {
        width: 13.75rem;
      }

      .nav-grad-link.app-shell__section-link {
        font-size: 0.9rem;
      }
    }
  `,
  templateUrl: './app.html',
})
export class AppComponent {
  private readonly router = inject(Router);
  private readonly title = inject(Title);

  private readonly mainScroll =
    viewChild<ElementRef<HTMLDivElement>>('mainScroll');
  protected readonly scrolled = signal(false);

  protected readonly pageTitle = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.#currentRouteTitle()),
    ),
    { initialValue: this.#currentRouteTitle() },
  );

  #currentRouteTitle(): string {
    const url = this.router.routerState.snapshot.url.split('?')[0];
    return getRouteTitle(url);
  }

  // Keep the browser tab title in sync with the current route title.
  // Named Angular effect fields are intentionally unread because Angular owns their lifecycle.
  // oxlint-disable-next-line no-unused-private-class-members -- EffectRef is intentionally kept as a named field to document the side effect.
  readonly #syncTitle = effect(() => {
    const t = this.pageTitle();
    if (t) this.title.setTitle(t);
  });

  // Category + link metadata (single source of truth for sidebar + top nav labels)
  // Organized to show progression: baseline → getting started → toolkit features → advanced
  private readonly categories = DEMO_CATEGORIES;

  protected readonly categoriesList = this.categories;

  protected readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );

  protected readonly currentCategory = computed(() => {
    const path = this.currentPath();
    return (
      this.categories.find((c) => c.pattern.test(path)) ?? this.categories[0]
    );
  });

  protected readonly currentCategoryLinks = computed(
    () => this.currentCategory().links,
  );

  protected handleMainScroll(): void {
    const element = this.mainScroll()?.nativeElement;
    const isScrolled = (element?.scrollTop ?? 0) > 4;

    if (this.scrolled() !== isScrolled) {
      this.scrolled.set(isScrolled);
    }
  }

  // Reset scroll position on navigation after the view is initialized.
  // Named Angular effect fields are intentionally unread because Angular owns their lifecycle.
  // oxlint-disable-next-line no-unused-private-class-members -- EffectRef is intentionally kept as a named field to document the side effect.
  readonly #resetScrollEffect = effect(() => {
    this.currentPath();
    queueMicrotask(() => {
      const element = this.mainScroll()?.nativeElement;
      if (element) {
        element.scrollTo({ top: 0 });
      }
      // Also reset scrolled state
      if (this.scrolled()) this.scrolled.set(false);
    });
  });
}
