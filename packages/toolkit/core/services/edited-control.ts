import {
  DestroyRef,
  DOCUMENT,
  Injectable,
  afterNextRender,
  inject,
  signal,
  type Signal,
} from '@angular/core';
import type { FieldState } from '@angular/forms/signals';

/**
 * Publishes the control the user is editing: the element that received an
 * `input` event since it last gained focus. Any focus change or form submit
 * clears it.
 *
 * `'on-touch'` error and warning visibility read this to hide a field's
 * feedback while the user types, so the live regions do not re-announce on
 * every keystroke. Leaving the field or submitting re-checks it.
 *
 * The state is driven by DOM events rather than by signal history, so every
 * consumer of the same field sees the same answer. Listeners are installed in
 * `afterNextRender`, which never runs on the server, so the signal stays
 * `null` there.
 *
 * @internal
 */
@Injectable({ providedIn: 'root' })
export class NgxEditedControl {
  readonly #element = signal<Element | null>(null);

  readonly element: Signal<Element | null> = this.#element.asReadonly();

  constructor() {
    const document = inject(DOCUMENT);
    const destroyRef = inject(DestroyRef);

    const clear = (): void => {
      this.#element.set(null);
    };
    const onInput = (event: Event): void => {
      if (event.target instanceof Element) this.#element.set(event.target);
    };
    const listeners: readonly (readonly [string, (event: Event) => void])[] = [
      ['focusin', clear],
      ['focusout', clear],
      ['submit', clear],
      ['input', onInput],
    ];

    afterNextRender(() => {
      for (const [type, listener] of listeners) {
        document.addEventListener(type, listener, true);
      }
      destroyRef.onDestroy(() => {
        for (const [type, listener] of listeners) {
          document.removeEventListener(type, listener, true);
        }
      });
    });
  }
}

/**
 * Returns a check that is `true` while the user edits a control bound to
 * the given field. It reads the edited element only when called, so callers
 * can skip it when the answer cannot matter.
 *
 * Must run in an injection context. Without `NgxEditedControl` (for example
 * in a bare test injector) the check is always `false`.
 *
 * @internal
 */
export function injectIsEditingField(): (fieldState: unknown) => boolean {
  const editedControl =
    inject(NgxEditedControl, { optional: true })?.element ?? null;
  if (editedControl === null) return () => false;

  return (fieldState) => {
    const element = editedControl();
    if (element === null) return false;
    const bindings = (
      fieldState as
        | Partial<Pick<FieldState<unknown>, 'formFieldBindings'>>
        | null
        | undefined
    )?.formFieldBindings?.();
    return (
      bindings?.some((binding) => binding.element.contains(element)) ?? false
    );
  };
}
