import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ContactFormComponent } from './contact-form/contact-form';

/**
 * Application shell for the Material reference demo.
 *
 * Intentionally minimal — the point of this app is to showcase one
 * Material-wrapped form, not to repeat the structure of the main demo
 * (`apps/demo`). The README explains the four contracts and the
 * Material-specific gotchas; this shell just hosts the form.
 */
@Component({
  selector: 'ngx-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ContactFormComponent],
  template: `
    <main class="app-shell">
      <p class="app-shell__eyebrow">Angular Material reference demo</p>
      <section class="app-shell__hero" aria-labelledby="app-title">
        <h1 id="app-title">Material feedback, with better rhythm.</h1>
        <p class="lead">
          A focused contact form built with <code>@angular/material</code> and
          <code>@ngx-signal-forms/toolkit</code>, tuned so blocking errors stay
          close to their fields, non-blocking warnings read gently, and Material
          keeps ownership of <code>aria-describedby</code> exactly where it
          should.
        </p>
      </section>

      <ngx-contact-form />
    </main>
  `,
})
export class AppComponent {}
