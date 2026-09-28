import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { DEMO_CATEGORIES } from '@ngx-signal-forms/demo-shared';
import { PageHeaderComponent } from '../ui';

/**
 * Wildcard route. A mistyped or stale deep link used to redirect silently to
 * the first example, which looked like the right page. This says what
 * happened and offers the way back.
 */
@Component({
  selector: 'ngx-not-found-page',
  imports: [RouterLink, PageHeaderComponent],
  template: `
    <ngx-page-header
      title="Page not found"
      subtitle="That example does not exist. It may have moved or been renamed."
    />

    <section class="not-found" aria-labelledby="not-found-sections">
      <p class="not-found__path">
        Requested: <code class="code-inline">{{ requestedPath() }}</code>
      </p>

      <p class="mt-6">
        <a
          class="btn-primary inline-block"
          routerLink="/getting-started/your-first-form"
        >
          Start with Your First Form
        </a>
      </p>

      <h2 id="not-found-sections" class="mt-10 text-xl font-semibold">
        Browse the examples
      </h2>
      <ul class="not-found__list">
        @for (category of categories; track category.id) {
          <li>
            <a class="not-found__link" [routerLink]="category.links[0].path">
              {{ category.label }}
            </a>
            <span class="not-found__count">
              {{ category.links.length }}
              {{ category.links.length === 1 ? 'example' : 'examples' }}
            </span>
          </li>
        }
      </ul>
    </section>
  `,
  styles: `
    .not-found {
      max-width: 36rem;
      margin-inline: auto;
      text-align: center;
    }

    .not-found__path {
      overflow-wrap: anywhere;
      color: var(--color-text-muted);
    }

    .not-found__list {
      display: grid;
      gap: 0.5rem;
      margin-top: 1rem;
      text-align: start;
    }

    .not-found__list li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      min-height: 2.75rem;
      padding-inline: 1rem;
      border: 1px solid var(--color-border);
      border-radius: 0.5rem;
      background: var(--color-bg-elevated);
    }

    .not-found__link {
      font-weight: 600;
      color: var(--color-brand-strong);
    }

    :host-context(.dark) .not-found__link {
      color: #a5b4fc;
    }

    .not-found__count {
      font-size: 0.875rem;
      color: var(--color-text-muted);
    }
  `,
})
export class NotFoundPageComponent {
  readonly #router = inject(Router);

  /** Follows the URL: Angular reuses this component from one unknown URL to
   * the next, so a value read once in the constructor would go stale. */
  protected readonly requestedPath = toSignal(
    this.#router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.#router.url),
    ),
    { initialValue: this.#router.url },
  );
  protected readonly categories = DEMO_CATEGORIES;
}
