import { Injectable, signal, TemplateRef } from '@angular/core';

const RAIL_COLLAPSED_KEY = 'ngx-demo:rail-collapsed';

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(RAIL_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

@Injectable({ providedIn: 'root' })
export class PageControlsService {
  readonly template = signal<TemplateRef<unknown> | null>(null);

  /** Slide-over open state (used below the persistent-rail breakpoint). */
  readonly panelOpen = signal(false);

  /** Whether the persistent rail is collapsed on wide screens. Persisted so
   *  the preference survives reloads. */
  readonly railCollapsed = signal(readCollapsed());

  register(ref: TemplateRef<unknown>): void {
    this.template.set(ref);
  }

  clearIfOwner(ref: TemplateRef<unknown>): void {
    if (this.template() === ref) {
      this.template.set(null);
    }
  }

  openPanel(): void {
    this.panelOpen.set(true);
  }

  togglePanel(): void {
    this.panelOpen.update((v) => !v);
  }

  closePanel(): void {
    this.panelOpen.set(false);
  }

  collapseRail(): void {
    this.#setRailCollapsed(true);
  }

  expandRail(): void {
    this.#setRailCollapsed(false);
  }

  #setRailCollapsed(collapsed: boolean): void {
    this.railCollapsed.set(collapsed);
    try {
      localStorage.setItem(RAIL_COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch {
      /* storage unavailable — keep in-memory state only */
    }
  }
}
