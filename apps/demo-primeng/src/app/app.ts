import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProfileFormComponent } from './profile-form/profile-form';

/**
 * Root component for the PrimeNG reference demo.
 *
 * Hosts a single representative form (text + select + checkbox + warnings)
 * built on top of `PrimeFormFieldComponent`. The shell wraps that form in an
 * editorial-style hero + panel — purely cosmetic chrome so the demo doubles
 * as a presentable showcase. Every toolkit-relevant moving part lives inside
 * `<demo-primeng-profile-form>`; see `apps/demo-primeng/README.md`.
 */
@Component({
  selector: 'ngx-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProfileFormComponent],
  template: `
    <main class="shell">
      <header class="shell__hero">
        <p class="shell__eyebrow">PrimeNG reference demo</p>
        <h1 class="shell__title">
          ngx-signal-forms <span aria-hidden="true">♥</span> PrimeNG
        </h1>
        <p class="shell__lede">
          A sharper PrimeNG editorial shell with submit-time validation that
          actually behaves.
        </p>
      </header>

      <section class="shell__panel">
        <demo-primeng-profile-form />
      </section>
    </main>
  `,
})
export class AppComponent {}
