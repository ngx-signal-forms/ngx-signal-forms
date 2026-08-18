import {
  afterEveryRender,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { isElementCssVisible } from '@ngx-signal-forms/toolkit';

/** One render's worth of the bound control's managed ARIA state. */
interface ProbeReading {
  /** The `id` the widget generated for itself. */
  readonly controlId: string | null;
  readonly ariaInvalid: string | null;
  readonly ariaRequired: string | null;
  /** Each `aria-describedby` token, with whether it resolves to an element. */
  readonly describedBy: readonly { id: string; resolves: boolean }[];
  /** What `isElementCssVisible()` — the toolkit's own probe — reports. */
  readonly laidOut: boolean;
}

const EMPTY_READING: ProbeReading = {
  controlId: null,
  ariaInvalid: null,
  ariaRequired: null,
  describedBy: [],
  laidOut: false,
};

/**
 * Live readout of the ARIA attributes the toolkit wrote onto the bound
 * control, so the page can be read without opening DevTools.
 *
 * It reads the DOM rather than the injected `NgxFieldIdentity` on purpose.
 * The identity's resolved signals are public, but `NgxFieldIdentityProvider`
 * publishes only the name channel, so `controlId()` and `hintIds()` are
 * deliberately empty there — the DOM is the ground truth for what a screen
 * reader will actually see, and "the rendered ids resolve" is the claim this
 * page needs to demonstrate.
 *
 * The read runs in `afterEveryRender`'s `read` phase, after the toolkit's
 * `write` phase has settled the attributes for this render.
 */
@Component({
  selector: 'ngx-demo-identity-probe',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dl
      class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-md bg-gray-50 p-3 font-mono text-xs text-gray-700 dark:bg-gray-900/50 dark:text-gray-300"
      [attr.data-field-name]="declaredFieldName()"
      data-testid="identity-probe"
    >
      <dt class="text-gray-500 dark:text-gray-400">field name</dt>
      <dd class="m-0 font-semibold" data-probe="field-name">
        {{ declaredFieldName() }}
      </dd>

      <dt class="text-gray-500 dark:text-gray-400">control id</dt>
      <dd class="m-0" data-probe="control-id">
        {{ reading().controlId ?? '—' }}
      </dd>

      <dt class="text-gray-500 dark:text-gray-400">aria-invalid</dt>
      <dd class="m-0" data-probe="aria-invalid">
        {{ reading().ariaInvalid ?? '(absent)' }}
      </dd>

      <dt class="text-gray-500 dark:text-gray-400">aria-describedby</dt>
      <dd class="m-0" data-probe="aria-describedby">
        @if (reading().describedBy.length === 0) {
          (absent)
        } @else {
          @for (token of reading().describedBy; track token.id) {
            <span
              class="mr-1 inline-block rounded px-1"
              [class.bg-green-100]="token.resolves"
              [class.text-green-900]="token.resolves"
              [class.bg-red-100]="!token.resolves"
              [class.text-red-900]="!token.resolves"
              [attr.data-resolves]="token.resolves"
              >{{ token.id }} {{ token.resolves ? '✓' : '✗ dangling' }}</span
            >
          }
        }
      </dd>

      <dt class="text-gray-500 dark:text-gray-400">laid out</dt>
      <dd class="m-0" data-probe="laid-out">{{ reading().laidOut }}</dd>
    </dl>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class IdentityProbeComponent {
  readonly declaredFieldName = input.required<string>();

  readonly #host = inject(ElementRef<HTMLElement>);
  readonly #reading = signal<ProbeReading>(EMPTY_READING);

  /**
   * Serialized form of the last reading. `#reading` holds a fresh object
   * every time, so without this guard `set()` would always look like a
   * change and each render would schedule the next one forever.
   */
  #lastKey = '';

  protected readonly reading = this.#reading.asReadonly();

  constructor() {
    afterEveryRender({
      read: () => {
        const next = this.#probe();
        const key = JSON.stringify(next);
        if (key === this.#lastKey) return;
        this.#lastKey = key;
        this.#reading.set(next);
      },
    });
  }

  #probe(): ProbeReading {
    const wrapper = (this.#host.nativeElement as HTMLElement).closest(
      'ngx-demo-identity-field',
    );
    const control = wrapper?.querySelector<HTMLElement>(
      'input, select, textarea',
    );
    if (!control) return EMPTY_READING;

    const describedBy = (control.getAttribute('aria-describedby') ?? '')
      .split(/\s+/u)
      .filter(Boolean)
      .map((id) => ({ id, resolves: document.getElementById(id) !== null }));

    return {
      controlId: control.getAttribute('id'),
      ariaInvalid: control.getAttribute('aria-invalid'),
      ariaRequired: control.getAttribute('aria-required'),
      describedBy,
      laidOut: isElementCssVisible(control),
    };
  }
}
