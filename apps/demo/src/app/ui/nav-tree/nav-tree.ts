import {
  ChangeDetectionStrategy,
  Component,
  inject,
  linkedSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { DEMO_CATEGORIES } from '@ngx-signal-forms/demo-shared';
import { filter, map } from 'rxjs';

type CategoryId = (typeof DEMO_CATEGORIES)[number]['id'];

@Component({
  selector: 'ngx-nav-tree',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  host: {
    class: 'nav-tree-host',
  },
  styleUrl: './nav-tree.scss',
  templateUrl: './nav-tree.html',
})
export class NavTreeComponent {
  readonly #router = inject(Router);

  protected readonly categories = DEMO_CATEGORIES;

  readonly #currentPath = toSignal(
    this.#router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.#router.url.split('?')[0]),
    ),
    { initialValue: this.#router.url.split('?')[0] },
  );

  protected readonly expandedId = linkedSignal(
    () => DEMO_CATEGORIES.find((c) => c.pattern.test(this.#currentPath()))?.id,
  );

  protected isOpen(id: CategoryId): boolean {
    return this.expandedId() === id;
  }

  protected toggle(id: CategoryId): void {
    this.expandedId.update((current) => (current === id ? undefined : id));
  }
}
