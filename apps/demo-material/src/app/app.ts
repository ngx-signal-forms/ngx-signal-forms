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
      <h1>ngx-signal-forms · Angular Material 21+ reference</h1>
      <p class="lead">
        A single contact form composed on top of
        <code>@angular/material</code> using
        <code>@ngx-signal-forms/toolkit</code>. See the README for the four
        contracts the wrapper satisfies and the Material-specific gotchas
        (especially <code>aria-describedby</code> ownership and
        <code>floatLabel</code>).
      </p>

      <ngx-contact-form />
    </main>
  `,
})
export class AppComponent {}
