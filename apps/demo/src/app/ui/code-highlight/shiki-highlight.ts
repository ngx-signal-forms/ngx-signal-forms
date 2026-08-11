import {
  afterNextRender,
  Directive,
  ElementRef,
  inject,
  injectAsync,
  input,
  onIdle,
  signal,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { SupportedLanguage, SupportedTheme } from './shiki-highlight.service';

/**
 * Modern Angular directive for syntax highlighting using Shiki
 *
 * Provides VS Code-quality highlighting with TextMate grammar support,
 * including Angular-specific languages (angular-html, angular-ts).
 *
 * Usage:
 * ```html
 * <pre ngxShikiHighlight language="typescript" theme="github-dark">
 *   const greeting = "Hello, World!";
 * </pre>
 *
 * <pre ngxShikiHighlight language="angular-html" theme="github-dark">
 *   <div *ngFor="let item of items">{{ item.name }}</div>
 * </pre>
 *
 * <pre ngxShikiHighlight language="angular-ts" theme="github-dark">
 *   @Component({
 *
 *     selector: 'ngx-example',
 *   })
 *   export class ExampleComponent {}
 * </pre>
 * ```
 */
@Directive({
  selector: '[ngxShikiHighlight]',
})
export class ShikiHighlightDirective {
  readonly language = input<SupportedLanguage>('typescript');
  readonly theme = input<SupportedTheme>('tokyo-night');

  readonly #element = inject(ElementRef<HTMLElement>);
  readonly #sanitizer = inject(DomSanitizer);
  readonly #getShikiService = injectAsync(
    () =>
      import('./shiki-highlight.service').then(
        (module) => module.ShikiHighlightService,
      ),
    { prefetch: onIdle },
  );
  readonly #isHighlighted = signal(false);

  /// Initialize highlighting after render (side effect in initializer)
  // oxlint-disable-next-line no-unused-private-class-members -- Angular effect pattern, does not need to be referenced
  readonly #initHighlight = afterNextRender(() => {
    void this.#highlightCode();
  });

  async #highlightCode(): Promise<void> {
    if (this.#isHighlighted()) {
      return;
    }

    const code = this.#element.nativeElement.textContent ?? '';
    if (!code.trim()) {
      return;
    }

    try {
      const shikiService = await this.#getShikiService();
      const highlightedHtml = await shikiService.highlightCode(
        code,
        this.language(),
        this.theme(),
      );

      // SECURITY: Shiki properly escapes code content in its HTML output.
      // The highlightedHtml contains only Shiki-generated markup (spans, divs
      // with class names) and escaped user code. Using bypassSecurityTrustHtml
      // is safe here because:
      // 1. Shiki is a trusted library that escapes all code content
      // 2. The HTML structure is controlled by Shiki, not user input
      // 3. We trust the Shiki library to produce safe HTML
      this.#element.nativeElement.innerHTML =
        this.#sanitizer.bypassSecurityTrustHtml(highlightedHtml);
      this.#isHighlighted.set(true);
    } catch (error) {
      console.warn('Failed to highlight code:', error);
      // Keep original content as fallback
    }
  }
}
