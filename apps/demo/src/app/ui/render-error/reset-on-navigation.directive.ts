import { Directive, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

/**
 * Put this on the content of an `@error` block to reset its `@boundary` after
 * every completed navigation:
 *
 * ```html
 * @boundary { <router-outlet /> }
 * @error { <div [ngxResetOnNavigation]="$reset">…</div> }
 * ```
 *
 * Without it, a boundary around the routed outlet keeps its fallback after the
 * user navigates away. The outlet sits inside the failed block, so the next
 * route never renders until a reload.
 */
@Directive({ selector: '[ngxResetOnNavigation]' })
export class NgxResetOnNavigationDirective {
  /** The `$reset` function of the enclosing `@error` block. */
  readonly ngxResetOnNavigation = input.required<() => void>();

  constructor() {
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.ngxResetOnNavigation()();
      });
  }
}
