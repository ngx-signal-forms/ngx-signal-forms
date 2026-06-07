import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
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

@Component({
  selector: 'ngx-nav-tree',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  host: {
    class: 'nav-tree-host',
  },
  styles: `
    :host {
      display: block;
    }

    .nav {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    /* ── Category (disclosure) ───────────────────────────── */
    .cat {
      display: flex;
      flex-direction: column;
    }

    .cat__trigger {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.5rem 0.6rem;
      border: 0;
      border-radius: 0.5rem;
      background: transparent;
      cursor: pointer;
      color: rgb(100 116 139);
      text-align: left;
      transition:
        background-color 140ms ease,
        color 140ms ease;
    }

    .cat__trigger:hover {
      background: rgb(241 245 249);
      color: rgb(51 65 85);
    }

    .cat__trigger:focus-visible {
      outline: 2px solid rgb(99 102 241);
      outline-offset: -2px;
    }

    :host-context(.dark) .cat__trigger {
      color: rgb(100 116 139);
    }

    :host-context(.dark) .cat__trigger:hover {
      background: rgb(30 41 59 / 0.55);
      color: rgb(203 213 225);
    }

    .cat__chevron {
      width: 0.7rem;
      height: 0.7rem;
      flex-shrink: 0;
      color: rgb(148 163 184);
      transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .cat__trigger[aria-expanded='true'] .cat__chevron {
      transform: rotate(90deg);
      color: rgb(99 102 241);
    }

    .cat__label {
      flex: 1;
      min-width: 0;
      font-family:
        'ui-monospace', 'SFMono-Regular', 'Cascadia Code', 'Menlo', monospace;
      font-size: 0.66rem;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }

    /* count pill */
    .cat__count {
      font-family:
        'ui-monospace', 'SFMono-Regular', 'Cascadia Code', 'Menlo', monospace;
      font-size: 0.62rem;
      font-weight: 600;
      line-height: 1;
      padding: 0.18rem 0.36rem;
      border-radius: 999px;
      color: rgb(148 163 184);
      background: rgb(241 245 249);
      transition:
        color 140ms ease,
        background-color 140ms ease;
    }

    .cat__trigger[aria-expanded='true'] .cat__count {
      color: rgb(79 70 229);
      background: rgb(238 242 255);
    }

    :host-context(.dark) .cat__count {
      color: rgb(100 116 139);
      background: rgb(30 41 59 / 0.7);
    }

    :host-context(.dark) .cat__trigger[aria-expanded='true'] .cat__count {
      color: rgb(165 180 252);
      background: rgb(49 46 129 / 0.4);
    }

    /* ── Animated panel (grid-rows trick) ────────────────── */
    .cat__panel {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 220ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .cat__panel[data-open='true'] {
      grid-template-rows: 1fr;
    }

    .cat__panel-inner {
      overflow: hidden;
      min-height: 0;
    }

    .cat__list {
      list-style: none;
      margin: 0.1rem 0 0.35rem;
      padding: 0;
      /* guide rail */
      margin-left: 1.05rem;
      border-left: 1px solid rgb(226 232 240);
    }

    :host-context(.dark) .cat__list {
      border-left-color: rgb(30 41 59);
    }

    /* ── Leaf link ───────────────────────────────────────── */
    .leaf {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 0.45rem;
      margin: 0.05rem 0 0.05rem -1px;
      padding: 0.4rem 0.6rem 0.4rem 0.85rem;
      border-left: 2px solid transparent;
      font-size: 0.83rem;
      line-height: 1.35;
      color: rgb(100 116 139);
      text-decoration: none;
      transition:
        color 130ms ease,
        background-color 130ms ease,
        border-color 130ms ease;
    }

    .leaf__label {
      flex: 1;
      min-width: 0;
    }

    /* config-availability glyph */
    .leaf__controls {
      flex-shrink: 0;
      width: 0.85rem;
      height: 0.85rem;
      margin-top: 0.12rem;
      color: rgb(148 163 184);
      opacity: 0.55;
      transition:
        color 130ms ease,
        opacity 130ms ease;
    }

    .leaf:hover .leaf__controls {
      opacity: 0.9;
    }

    .leaf--active .leaf__controls {
      color: rgb(99 102 241);
      opacity: 1;
    }

    :host-context(.dark) .leaf--active .leaf__controls {
      color: rgb(129 140 248);
    }

    .leaf:hover {
      color: rgb(15 23 42);
      border-left-color: rgb(203 213 225);
    }

    :host-context(.dark) .leaf {
      color: rgb(100 116 139);
    }

    :host-context(.dark) .leaf:hover {
      color: rgb(226 232 240);
      border-left-color: rgb(51 65 85);
    }

    .leaf:focus-visible {
      outline: 2px solid rgb(99 102 241);
      outline-offset: -2px;
      border-radius: 0.3rem;
    }

    /* active */
    .leaf--active {
      color: rgb(67 56 202);
      font-weight: 600;
      border-left-color: rgb(99 102 241);
      background: linear-gradient(
        to right,
        rgb(238 242 255) 0%,
        rgb(238 242 255 / 0) 100%
      );
    }

    .leaf--active:hover {
      color: rgb(67 56 202);
      border-left-color: rgb(99 102 241);
    }

    :host-context(.dark) .leaf--active {
      color: rgb(199 210 254);
      border-left-color: rgb(129 140 248);
      background: linear-gradient(
        to right,
        rgb(49 46 129 / 0.32) 0%,
        rgb(49 46 129 / 0) 100%
      );
    }

    :host-context(.dark) .leaf--active:hover {
      color: rgb(199 210 254);
    }
  `,
  template: `
    <nav class="nav" aria-label="Documentation sections">
      @for (cat of categories; track cat.id) {
        <div class="cat">
          <button
            type="button"
            class="cat__trigger"
            [attr.aria-expanded]="isOpen(cat.id)"
            [attr.aria-controls]="cat.id + '-panel'"
            (click)="toggle(cat.id)"
          >
            <svg
              class="cat__chevron"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fill-rule="evenodd"
                d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 1 1-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 0 1 0-1.06Z"
                clip-rule="evenodd"
              />
            </svg>
            <span class="cat__label">{{ cat.label }}</span>
            <span class="cat__count">{{ cat.links.length }}</span>
          </button>

          <div
            class="cat__panel"
            [attr.data-open]="isOpen(cat.id)"
            [id]="cat.id + '-panel'"
          >
            <div class="cat__panel-inner" [inert]="!isOpen(cat.id)">
              <ul class="cat__list">
                @for (link of cat.links; track link.path) {
                  <li>
                    <a
                      class="leaf"
                      [routerLink]="link.path"
                      routerLinkActive="leaf--active"
                      ariaCurrentWhenActive="page"
                      [attr.title]="
                        link.hasControls
                          ? link.label + ' — has display controls'
                          : link.label
                      "
                    >
                      <span class="leaf__label">{{ link.label }}</span>
                      @if (link.hasControls) {
                        <svg
                          class="leaf__controls"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.5"
                          stroke-linecap="round"
                          aria-label="Has display controls"
                          role="img"
                        >
                          <line x1="2.5" y1="4.5" x2="13.5" y2="4.5" />
                          <circle
                            cx="6"
                            cy="4.5"
                            r="1.6"
                            fill="currentColor"
                            stroke="none"
                          />
                          <line x1="2.5" y1="11.5" x2="13.5" y2="11.5" />
                          <circle
                            cx="10.5"
                            cy="11.5"
                            r="1.6"
                            fill="currentColor"
                            stroke="none"
                          />
                        </svg>
                      }
                    </a>
                  </li>
                }
              </ul>
            </div>
          </div>
        </div>
      }
    </nav>
  `,
})
export class NavTreeComponent {
  private readonly router = inject(Router);

  protected readonly categories = DEMO_CATEGORIES;

  private readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.router.url.split('?')[0]),
    ),
    { initialValue: this.router.url.split('?')[0] },
  );

  private readonly activeCategoryId = computed(
    () => DEMO_CATEGORIES.find((c) => c.pattern.test(this.currentPath()))?.id,
  );

  /** Single-open accordion: only one category is expanded at a time. */
  protected readonly expandedId = signal<string | null>(null);

  constructor() {
    // Auto-open the category that owns the active route on navigation.
    effect(() => {
      const activeId = this.activeCategoryId();
      if (activeId) {
        this.expandedId.set(activeId);
      }
    });
  }

  protected isOpen(id: string): boolean {
    return this.expandedId() === id;
  }

  protected toggle(id: string): void {
    this.expandedId.update((current) => (current === id ? null : id));
  }
}
