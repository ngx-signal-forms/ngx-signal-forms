import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
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
import { filter, map } from 'rxjs';
import { NgxThemeSwitcherComponent } from './ui/theme-switcher/theme-switcher.component';

@Component({
  selector: 'ngx-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxThemeSwitcherComponent, RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
})
export class AppComponent implements AfterViewInit {
  private router = inject(Router);
  private title = inject(Title);
  private destroyRef = inject(DestroyRef);

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
    let route = this.router.routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.snapshot.title || 'Pure Signal Forms - No Toolkit (Baseline)';
  }

  // Keep the browser tab title in sync with the current route title
  // eslint-disable-next-line no-unused-private-class-members -- allowed for effect()
  #syncTitle = effect(() => {
    const t = this.pageTitle();
    if (t) this.title.setTitle(t);
  });

  // Category + link metadata (single source of truth for sidebar + top nav labels)
  // Organized to show progression: baseline → getting started → toolkit features → advanced
  private readonly categories = [
    {
      id: 'signal-forms-only',
      label: 'Signal Forms Only',
      pattern: /^\/signal-forms-only\//,
      links: [
        {
          path: '/signal-forms-only/pure-signal-form',
          label: 'Pure Signal Forms (Baseline)',
        },
      ],
    },
    {
      id: 'getting-started',
      label: 'Getting Started',
      pattern: /^\/getting-started\//,
      links: [
        {
          path: '/getting-started/your-first-form',
          label: 'Your First Form',
        },
      ],
    },
    {
      id: 'toolkit-core',
      label: 'Toolkit Core',
      pattern: /^\/toolkit-core\//,
      links: [
        {
          path: '/toolkit-core/accessibility-comparison',
          label: 'Accessibility Comparison',
        },
        {
          path: '/toolkit-core/error-display-modes',
          label: 'Error Display Modes',
        },
        {
          path: '/toolkit-core/warning-support',
          label: 'Warning Support',
        },
        {
          path: '/toolkit-core/field-states',
          label: 'Field States',
        },
      ],
    },
    {
      id: 'headless',
      label: 'Headless',
      pattern: /^\/headless\//,
      links: [
        {
          path: '/headless/error-state',
          label: 'Error State + Character Count',
        },
        {
          path: '/headless/fieldset-utilities',
          label: 'Fieldset + Utilities',
        },
      ],
    },
    {
      id: 'form-field-wrapper',
      label: 'Form Field Wrapper',
      pattern: /^\/form-field-wrapper\//,
      links: [
        {
          path: '/form-field-wrapper/basic-usage',
          label: 'Basic Usage',
        },
        {
          path: '/form-field-wrapper/dynamic-appearance',
          label: 'Dynamic Appearance',
        },
        {
          path: '/form-field-wrapper/custom-controls',
          label: 'Custom Controls',
        },
        {
          path: '/form-field-wrapper/complex-forms',
          label: 'Complex Forms',
        },
        {
          path: '/form-field-wrapper/fieldset',
          label: 'Fieldset',
        },
        {
          path: '/form-field-wrapper/outline-form-field',
          label: 'Outlined Form Fields',
        },
      ],
    },
    {
      id: 'advanced-scenarios',
      label: 'Advanced Scenarios',
      pattern: /^\/advanced-scenarios\//,
      links: [
        {
          path: '/advanced-scenarios/global-configuration',
          label: 'Global Configuration',
        },
        {
          path: '/advanced-scenarios/submission-patterns',
          label: 'Submission Patterns',
        },
        {
          path: '/advanced-scenarios/error-messages',
          label: 'Error Messages',
        },
        {
          path: '/advanced-scenarios/dynamic-list',
          label: 'Dynamic Lists',
        },
        {
          path: '/advanced-scenarios/nested-groups',
          label: 'Nested Groups',
        },
        {
          path: '/advanced-scenarios/async-validation',
          label: 'Async Validation',
        },
        {
          path: '/advanced-scenarios/stepper-form',
          label: 'Stepper Form',
        },
        {
          path: '/advanced-scenarios/advanced-wizard',
          label: 'Advanced Wizard',
        },
        {
          path: '/advanced-scenarios/cross-field-validation',
          label: 'Cross-Field Validation',
        },
      ],
    },
  ] as const;

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

  ngAfterViewInit(): void {
    const element = this.mainScroll()?.nativeElement;
    if (!element) return;

    let ticking = false;
    const update = () => {
      const run = () => {
        const isScrolled = element.scrollTop > 4;
        if (this.scrolled() !== isScrolled) this.scrolled.set(isScrolled);
        ticking = false;
      };
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(run);
      }
    };

    // Initial state
    update();

    // Scroll listener (passive for perf)
    element.addEventListener('scroll', update, { passive: true });

    // Clean up
    this.destroyRef.onDestroy(() =>
      element.removeEventListener('scroll', update),
    );
  }

  // Reset scroll position on navigation (after view init ensures element exists)
  // eslint-disable-next-line no-unused-private-class-members -- kept as reactive effect
  #resetScrollEffect = effect(() => {
    this.currentPath();
    queueMicrotask(() => {
      const element = this.mainScroll()?.nativeElement;
      if (element) element.scrollTo({ top: 0 });
      // Also reset scrolled state
      if (this.scrolled()) this.scrolled.set(false);
    });
  });
  // ngOnDestroy not required: DestroyRef handles listener cleanup.
}
