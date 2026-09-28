/**
 * Platform-safe type guards for the `HTMLElement` constructor family.
 *
 * `value instanceof HTMLElement` throws a `ReferenceError` wherever the DOM
 * constructors are not global — a Node render pass (`@angular/platform-server`,
 * Angular's own SSR pipeline), a Node unit test, or any worker context. Every
 * toolkit call site runs inside a render/DOM-read phase that a server pass is
 * *supposed* to skip, but a partial mock, a custom wrapper, or a consumer that
 * calls a utility directly can still reach one on the server. These guards keep
 * such a call a `false` instead of a crash.
 *
 * In a browser the guards are exactly the `instanceof` checks they replace. Off
 * the DOM they fall back to a structural check (`nodeType === 1` plus the
 * expected `tagName`), which is what a server-side element double provides.
 *
 * @internal
 */

/** Element `nodeType`, spelled out so the guards read without a DOM global. */
const ELEMENT_NODE = 1;

/**
 * Structural stand-in for `instanceof HTMLElement` when the constructor is
 * missing: an object that reports itself as an element node and carries a
 * tag name.
 */
function hasElementShape(value: unknown): value is HTMLElement {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<HTMLElement>;
  return (
    candidate.nodeType === ELEMENT_NODE && typeof candidate.tagName === 'string'
  );
}

/**
 * Whether `value` is an `HTMLElement`.
 *
 * @internal
 */
export function isHtmlElement(value: unknown): value is HTMLElement {
  return typeof HTMLElement === 'function'
    ? value instanceof HTMLElement
    : hasElementShape(value);
}

/**
 * Whether `value` is an `<input>` element.
 *
 * @internal
 */
export function isHtmlInputElement(value: unknown): value is HTMLInputElement {
  return typeof HTMLInputElement === 'function'
    ? value instanceof HTMLInputElement
    : hasElementShape(value) && value.tagName === 'INPUT';
}

/**
 * Whether `value` is a `<textarea>` element.
 *
 * @internal
 */
export function isHtmlTextAreaElement(
  value: unknown,
): value is HTMLTextAreaElement {
  return typeof HTMLTextAreaElement === 'function'
    ? value instanceof HTMLTextAreaElement
    : hasElementShape(value) && value.tagName === 'TEXTAREA';
}

/**
 * Whether `value` is a `<select>` element.
 *
 * @internal
 */
export function isHtmlSelectElement(
  value: unknown,
): value is HTMLSelectElement {
  return typeof HTMLSelectElement === 'function'
    ? value instanceof HTMLSelectElement
    : hasElementShape(value) && value.tagName === 'SELECT';
}

/**
 * Whether `value` is a `<button>` element.
 *
 * @internal
 */
export function isHtmlButtonElement(
  value: unknown,
): value is HTMLButtonElement {
  return typeof HTMLButtonElement === 'function'
    ? value instanceof HTMLButtonElement
    : hasElementShape(value) && value.tagName === 'BUTTON';
}
