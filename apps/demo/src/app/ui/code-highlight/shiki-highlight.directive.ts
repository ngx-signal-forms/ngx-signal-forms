import {
  afterNextRender,
  Directive,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  ShikiHighlightService,
  SupportedLanguage,
  SupportedTheme,
} from './shiki-highlight.service';

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
 *   @Component({ selector: 'ngx-example' })
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
  readonly #shikiService = inject(ShikiHighlightService);
  readonly #isHighlighted = signal(false);

  /// Initialize highlighting after render (side effect in initializer)
  // eslint-disable-next-line no-unused-private-class-members -- Angular effect pattern, does not need to be referenced
  readonly #initHighlight = afterNextRender(async () => {
    await this.#highlightCode();
  });

  async #highlightCode(): Promise<void> {
    if (this.#isHighlighted()) {
      return;
    }

    const code = this.#element.nativeElement.textContent || '';
    if (!code.trim()) {
      return;
    }

    try {
      const highlightedHtml = await this.#shikiService.highlightCode(
        code,
        this.language(),
        this.theme(),
      );

      this.#element.nativeElement.innerHTML = highlightedHtml;
      this.#isHighlighted.set(true);
    } catch (error) {
      console.warn('Failed to highlight code:', error);
      // Keep original content as fallback
    }
  }
}
