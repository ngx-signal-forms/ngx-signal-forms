import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'ngx-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="mx-auto max-w-md py-16 text-center">
      <h1 class="text-gradient mb-4 text-4xl font-bold">404</h1>
      <p class="mb-8 text-base text-gray-600 dark:text-gray-400">
        Page not found.
      </p>
      <a routerLink="/fundamentals/minimal-form" class="btn-primary">
        Go to Examples
      </a>
    </div>
  `,
})
// Minimal not-found view component
export class NotFoundComponent {
  // Static marker to avoid empty class lint warning
  protected readonly marker = true;
}
