import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  ViewContainerRef,
  type ComponentRef,
} from '@angular/core';
import {
  createUniqueId,
  NGX_FORM_FIELD_HINT_RENDERER,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
} from '@ngx-signal-forms/toolkit';

/**
 * Form field hint component for displaying helper text.
 *
 * Provides visual guidance and instructions without blocking form submission.
 * Commonly used for format examples, field instructions, or contextual help.
 *
 * ## Renderer dispatch
 *
 * When `NGX_FORM_FIELD_HINT_RENDERER` is registered (typically by a custom
 * wrapper via `provideFormFieldHintRenderer(...)`), `<ngx-form-field-hint>`
 * lifts its projected children off the host after the first render and
 * mounts the configured renderer component as a host child, forwarding the
 * lifted nodes into the renderer's default `<ng-content />` slot. The
 * dispatched renderer receives the metadata `<ngx-form-field-hint>` already
 * exposes as inputs: `{ resolvedFieldName: string | null, resolvedId:
 * string, position: 'left' | 'right' | null }` — renderers must declare all
 * three with `input()` because Angular's `componentRef.setInput` rejects
 * writes to undeclared inputs.
 *
 * The dispatch only runs in browser contexts (`afterNextRender`); SSR keeps
 * the projected fallback content. When no renderer is registered, content
 * is projected directly via `<ng-content />` — preserving backwards
 * compatibility for consumers using `<ngx-form-field-hint>` outside a
 * wrapper.
 *
 * Key features:
 * - Content projection for flexible hint text
 * - Renderer-token dispatch for design-system-flavoured chrome
 * - Semantic HTML for accessibility
 * - Themeable via CSS custom properties
 * - Optional position control (left/right alignment)
 *
 * @example Basic hint text
 * ```html
 * <ngx-form-field-wrapper [formField]="form.phone">
 *   <label for="phone">Phone Number</label>
 *   <input id="phone" [formField]="form.phone" />
 *   <ngx-form-field-hint>
 *     Format: 123-456-7890
 *   </ngx-form-field-hint>
 * </ngx-form-field-wrapper>
 * ```
 *
 * @example With position control
 * ```html
 * <ngx-form-field-hint position="left">
 *   Use at least 8 characters
 * </ngx-form-field-hint>
 * ```
 *
 * @example Rich content
 * ```html
 * <ngx-form-field-hint>
 *   <strong>Tip:</strong> Use keywords that describe your product
 * </ngx-form-field-hint>
 * ```
 *
 * Customization:
 * Use CSS custom properties to theme hint appearance:
 *
 * ```css
 * :root {
 *   --ngx-form-field-hint-font-size: 0.75rem;
 *   --ngx-form-field-hint-line-height: 1rem;
 *   --ngx-form-field-hint-color: rgba(50, 65, 85, 0.75);
 * }
 * ```
 *
 * Accessibility:
 * - Use semantic text content (avoid decorative images without alt text)
 * - Ensure sufficient color contrast (4.5:1 minimum)
 * - Consider using aria-describedby to link hint to input (handled by parent component)
 */
@Component({
  selector: 'ngx-form-field-hint',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  styles: `
    :host {
      display: var(--ngx-form-field-hint-display, block);
      font-size: var(
        --ngx-form-field-hint-font-size,
        var(--ngx-signal-form-feedback-font-size, 0.75rem)
      );
      line-height: var(
        --ngx-form-field-hint-line-height,
        var(--ngx-signal-form-feedback-line-height, 1rem)
      );
      color: var(--ngx-form-field-hint-color, rgba(50, 65, 85, 0.75));
      /*
       * Hint shares the input's border-left edge (no padding offset) and reads
       * from the start by default, vertically in line with the label above and
       * the error below — the convention every accessible form guide follows
       * (Gestalt proximity + LTR reading order). The assistive row still flips
       * this to start-aligned when a right-slot (e.g. character count) is
       * present; position="right" opts a single hint back to end-aligned.
       */
      padding-inline-start: var(--ngx-form-field-hint-padding-inline-start, 0);
      padding-inline-end: var(--ngx-form-field-hint-padding-inline-end, 0);
      text-align: var(--ngx-form-field-hint-align, left);
    }

    :host([position='left']) {
      text-align: left;
    }

    :host([position='right']) {
      text-align: right;
    }
  `,
  host: {
    '[attr.position]': 'position() ?? null',
    '[attr.id]': 'resolvedId()',
    '[attr.data-ngx-signal-form-hint]': '"true"',
    '[attr.data-signal-field]': 'resolvedFieldName()',
  },
})
export class NgxFormFieldHint {
  readonly #elementRef = inject(ElementRef<HTMLElement>);
  readonly #viewContainerRef = inject(ViewContainerRef);
  readonly #fieldContext = inject(NGX_SIGNAL_FORM_FIELD_CONTEXT, {
    optional: true,
  });
  readonly #hintRenderer = inject(NGX_FORM_FIELD_HINT_RENDERER, {
    optional: true,
  });

  readonly #explicitId = signal<string | null>(null);

  /**
   * Component reference for the dispatched renderer (when one is registered).
   * Created imperatively after the first render so the projected children
   * are already attached to the host and can be moved into the dynamic
   * component's `<ng-content />` slot via `projectableNodes`.
   */
  #dispatchedRef: ComponentRef<unknown> | null = null;

  /**
   * Text alignment position.
   *
   * @default null (hint aligns to the start/left; pass `position="right"` to
   * opt into end alignment. The assistive row also forces start alignment when
   * a character count shares the row.)
   */
  readonly position = input<'left' | 'right' | null>(null);

  /**
   * Explicit id, accepted as either a static `id="…"` attribute or a
   * property-bound `[id]="expr"`. Angular maps both forms onto this input
   * (static attributes matching a declared input are read as the input's
   * initial value), so a parent-computed id is picked up reactively instead
   * of being missed the way a one-shot constructor `getAttribute('id')` read
   * misses it. Falls through to {@link resolvedId}'s other sources when
   * `null` or empty.
   */
  readonly id = input<string | null>(null);

  /**
   * Resolved field name from the wrapper's `NGX_SIGNAL_FORM_FIELD_CONTEXT`,
   * or `null` when the hint is rendered outside a wrapper. Public so wrappers
   * can expose it through `NGX_SIGNAL_FORM_HINT_REGISTRY` for auto-ARIA.
   */
  readonly resolvedFieldName = computed(() => {
    return this.#fieldContext?.fieldName() ?? null;
  });

  /**
   * Stable DOM id used by `aria-describedby`. Public so wrappers can forward
   * it to auto-ARIA via the hint registry without reading the DOM.
   * An empty-string explicit id or fieldName is treated as "not set" and falls through to the generated id.
   */
  /**
   * Stable fallback id minted once in the injection context (field
   * initializer), NOT lazily inside {@link resolvedId}'s computed. Minting
   * inside the computed ran `createUniqueId()` outside an injection context
   * (host-binding evaluation), forcing the SSR-unsafe module-counter fallback
   * with a dev warning, and re-minted a fresh id whenever the computed
   * re-evaluated — leaving `aria-describedby` consumers pointing at a stale id.
   */
  readonly #generatedId = createUniqueId('hint');

  /**
   * True when this hint has neither a bound (`id`/`[id]`) nor an explicit
   * host-attribute id and therefore needs the generated fallback id.
   * Public so a wrapper's {@link NgxSignalFormFieldContext.hintOrdinal}
   * implementation can restrict its sibling count to hints that actually
   * compete for the same `${fieldName}-hint` fallback — a hint with its
   * own id never claims an ordinal slot.
   *
   * @internal
   */
  readonly usesGeneratedFallbackId = computed(() => {
    const bound = this.id();
    // oxlint-disable-next-line @typescript-eslint/strict-boolean-expressions -- empty-string is "not set", same as below
    if (bound) return false;

    const explicit = this.#explicitId();
    // oxlint-disable-next-line @typescript-eslint/strict-boolean-expressions -- empty-string id/fieldName is intentionally treated as "not set"; freezing semantic for v1
    return !explicit;
  });

  readonly resolvedId = computed(() => {
    const bound = this.id();
    // oxlint-disable-next-line @typescript-eslint/strict-boolean-expressions -- empty-string is "not set", same as below
    if (bound) return bound;

    const explicit = this.#explicitId();
    // oxlint-disable-next-line @typescript-eslint/strict-boolean-expressions -- empty-string id/fieldName is intentionally treated as "not set"; freezing semantic for v1
    if (explicit) return explicit;

    const fieldName = this.resolvedFieldName();
    // oxlint-disable-next-line @typescript-eslint/strict-boolean-expressions -- empty-string id/fieldName is intentionally treated as "not set"; freezing semantic for v1
    if (fieldName) {
      // Ask the field context (typically the form-field wrapper) for this
      // hint's 0-based position among sibling hints that also need the
      // fallback id. The first such hint keeps the short, stable
      // `${fieldName}-hint` name so existing ids and consumer CSS keep
      // working; later hints get a unique numbered suffix (WCAG 1.3.1).
      // Contexts that don't track hints (e.g. no wrapper) omit
      // `hintOrdinal`, so every such hint resolves to ordinal 0.
      const ordinal = this.#fieldContext?.hintOrdinal?.(this) ?? 0;
      return ordinal > 0
        ? `${fieldName}-hint-${ordinal + 1}`
        : `${fieldName}-hint`;
    }

    return this.#generatedId;
  });

  constructor() {
    // Also read the host `id` attribute at construction time. `resolvedId`
    // checks the `id` input first — see above. Angular maps a static
    // `id="…"` attribute onto a declared `id` input. So the input already
    // covers the static and the property-bound (`[id]="expr"`) cases.
    // This read still matters for one case: `viewContainerRef.createComponent`
    // with a `hostElement` that already has an `id` attribute. That path
    // sets the DOM attribute directly. It does not go through template input
    // mapping, so the `id` input stays `null` and this attribute read is the
    // only way to pick up the id. This runs on both platforms. The server
    // DOM supports `getAttribute`. The server-rendered `id` matches what the
    // client resolves on hydration.
    const existingId = this.#elementRef.nativeElement.getAttribute('id');
    if (existingId !== null && existingId.length > 0) {
      this.#explicitId.set(existingId);
    }

    const renderer = this.#hintRenderer;
    if (renderer === null) return;

    // Dispatch path: after the first render, lift the projected children
    // off the host and hand them to the configured renderer's default
    // `<ng-content />` via `projectableNodes`. The dynamic component is
    // appended as a sibling inside the host element, so the host keeps
    // owning the live region the wrapper or auto-aria layer points at.
    //
    // `afterNextRender` is browser-only by design — the dispatch path
    // walks live DOM and is meaningless server-side; SSR keeps the
    // projected fallback content from the static template.
    afterNextRender(() => {
      const host = this.#elementRef.nativeElement;
      const projected: Node[] = [];
      while (host.firstChild !== null) {
        projected.push(host.removeChild(host.firstChild));
      }
      this.#dispatchedRef = this.#viewContainerRef.createComponent<unknown>(
        renderer.component,
        { projectableNodes: [projected] },
      );
      this.#applyRendererInputs(this.#dispatchedRef);
      // Move the dynamic component's host element into our own host so the
      // rendered chrome sits visually inside `<ngx-form-field-hint>` rather
      // than next to it. `ViewContainerRef` anchors the new view at a
      // sibling position by default; relocating keeps the wrapper's host
      // styles (font-size, color, padding) wrapping the renderer's chrome.
      host.append(this.#dispatchedRef.location.nativeElement);
    });

    // Keep the dispatched renderer's inputs in lockstep with the metadata
    // signals — `position` and the resolved id/field-name flow through
    // here whenever they change after the dispatch is wired up.
    effect(() => {
      // Track signal reads so the effect re-fires on changes.
      this.position();
      this.resolvedFieldName();
      this.resolvedId();
      if (this.#dispatchedRef !== null) {
        this.#applyRendererInputs(this.#dispatchedRef);
      }
    });
  }

  #applyRendererInputs(ref: ComponentRef<unknown>): void {
    ref.setInput('resolvedFieldName', this.resolvedFieldName());
    ref.setInput('resolvedId', this.resolvedId());
    ref.setInput('position', this.position());
  }
}
