import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import type { FormFieldAppearance } from '@ngx-signal-forms/toolkit';

/**
 * A tiny, self-contained stand-in for a "legacy" third-party datepicker
 * widget.
 *
 * This component deliberately does **not** know anything about Angular
 * Signal Forms. It owns its own value/change API (`rawValue` /
 * `rawValueChange`), its own popup calendar, and its own internal `<input>`
 * — exactly the shape you'd get from an npm-installed date-picker library.
 * `LegacyDatepickerAdapterComponent` (in the same directory) is the piece
 * that bridges this widget to `FormValueControl<Date | null>`.
 *
 * Two things make this widget a realistic "hard case" for a Signal Forms
 * adapter:
 *
 * - Its value is a free-typed string (`YYYY-MM-DD` or garbage — the widget
 *   does not validate), not a `Date`. The adapter owns the parse/format
 *   boundary.
 * - Interacting with it moves focus across more than one element (the text
 *   input, the calendar-trigger button, and the day buttons inside the
 *   popup). A plain `(blur)` on the internal input would fire every
 *   time focus hops between those elements, long before the user is done
 *   with the widget as a whole.
 *
 * (Its selector carries the repo's mandatory `ngx` prefix only because this
 * file lives inside this workspace's lint rules — imagine it published as
 * `<legacy-datepicker>` from an unrelated npm package.)
 */
@Component({
  selector: 'ngx-legacy-datepicker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'legacy-datepicker',
    '[attr.data-appearance]': 'appearance()',
  },
  styles: `
    :host {
      --legacy-datepicker-trigger-gap: 0.375rem;
      --legacy-datepicker-trigger-size: 2rem;

      display: inline-flex;
      align-items: center;
      gap: var(--legacy-datepicker-trigger-gap);
      inline-size: 100%;
      min-inline-size: 0;
      position: relative;
    }

    /*
     * Colors below are explicit (not opacity tricks) and chosen for
     * conforming contrast in both themes:
     *  - #6b7280 (gray-500) on white / #1f2937 (gray-800) borders: ~4.8:1 /
     *    ~5.8:1 — clears the >=3:1 WCAG 1.4.11 non-text UI boundary minimum.
     *  - #4b5563 (gray-600) muted day text on white: ~7.6:1 — clears the
     *    >=4.5:1 WCAG 1.4.3 normal-text minimum (an opacity-based mute would
     *    have silently dropped below that floor).
     *  - #9ca3af (gray-400) muted day text / border on the dark popup
     *    surface (#1f2937): ~5.8:1 — same floors, dark-theme pairing.
     */
    .legacy-datepicker__input {
      flex: 1 1 auto;
      inline-size: auto;
      min-inline-size: 0;
      padding: 0.375rem 0.5rem;
      border: 1px solid #6b7280;
      border-radius: 0.25rem;
      background-color: #ffffff;
      color: #111827;
      font: inherit;
    }

    .legacy-datepicker__input[aria-invalid='true'] {
      border-color: #db1818;
    }

    .legacy-datepicker__input:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .legacy-datepicker__trigger {
      display: inline-flex;
      box-sizing: border-box;
      align-items: center;
      justify-content: center;
      flex: 0 0 var(--legacy-datepicker-trigger-size);
      inline-size: var(--legacy-datepicker-trigger-size);
      min-block-size: var(--legacy-datepicker-trigger-size);
      padding: 0.375rem 0.5rem;
      border: 1px solid #6b7280;
      border-radius: 0.25rem;
      background: transparent;
      color: #111827;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
    }

    /* Standard fields keep the third-party trigger as a separate action next
       to the bordered input. The wrapper reserves this trailing space. */
    :host([data-appearance='standard']) {
      gap: 0;
    }

    :host([data-appearance='standard']) .legacy-datepicker__trigger {
      position: absolute;
      inset-inline-start: calc(
        100% + var(--legacy-datepicker-trigger-gap) +
          var(--_padding-horizontal, 0.5rem) + 1px
      );
      inset-block-start: 50%;
      translate: 0 -50%;
    }

    /* Outline fields use the wrapper border as their shared chrome, so the
       trigger reads as an integrated suffix instead of a nested button. */
    :host([data-appearance='outline']) .legacy-datepicker__trigger {
      border-color: transparent;
      background: transparent;
    }

    :host([data-appearance='outline']) .legacy-datepicker__trigger:hover {
      background: color-mix(in srgb, currentColor 6%, transparent);
    }

    :host([data-appearance='outline'])
      .legacy-datepicker__trigger:focus-visible {
      outline: 2px solid var(--_focus-color, #007bc7);
      outline-offset: 1px;
    }

    .legacy-datepicker__trigger:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    .legacy-datepicker__popup {
      position: fixed;
      position-area: block-end span-inline-start;
      position-try-fallbacks: flip-block;
      align-self: start;
      justify-self: end;
      inset: auto;
      margin: 0.375rem 0 0;
      padding: 0.75rem;
      border: 1px solid #6b7280;
      border-radius: 0.5rem;
      background-color: #ffffff;
      color: #111827;
    }

    .legacy-datepicker__popup-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-block-end: 0.5rem;
      font-weight: 600;
    }

    .legacy-datepicker__grid {
      display: grid;
      grid-template-columns: repeat(7, 2rem);
      gap: 0.125rem;
    }

    .legacy-datepicker__day {
      inline-size: 2rem;
      block-size: 2rem;
      border: 1px solid transparent;
      border-radius: 0.25rem;
      background: transparent;
      color: inherit;
      cursor: pointer;
    }

    /* Explicit color, not opacity: opacity multiplies the already-passing
       base text contrast down below the WCAG 1.4.3 floor (~2.8:1 at 0.4). */
    .legacy-datepicker__day--outside {
      color: #4b5563;
    }

    .legacy-datepicker__day[aria-current='date'] {
      border-color: #007bc7;
    }

    .legacy-datepicker__day[aria-pressed='true'] {
      background-color: #007bc7;
      color: #fff;
    }

    :host-context(.dark) {
      .legacy-datepicker__input,
      .legacy-datepicker__trigger,
      .legacy-datepicker__popup {
        border-color: #9ca3af;
        background-color: #1f2937;
        color: #f3f4f6;
      }

      .legacy-datepicker__input[aria-invalid='true'] {
        border-color: #fca5a5;
      }

      .legacy-datepicker__day--outside {
        color: #9ca3af;
      }
    }
  `,
  template: `
    <input
      #input
      type="text"
      class="legacy-datepicker__input"
      [id]="widgetId()"
      [value]="rawValue()"
      (input)="onTextInput($event)"
      [disabled]="widgetDisabled()"
      [attr.aria-labelledby]="labelledBy()"
      [attr.aria-describedby]="ariaDescribedBy()"
      [attr.aria-invalid]="ariaInvalid() ? 'true' : 'false'"
      [attr.aria-required]="ariaRequired() ? 'true' : null"
      placeholder="YYYY-MM-DD"
      autocomplete="off"
    />
    <button
      #trigger
      type="button"
      class="legacy-datepicker__trigger"
      [disabled]="widgetDisabled()"
      (click)="preparePopup()"
      [attr.popovertarget]="popupId()"
      aria-label="Choose date"
      aria-haspopup="dialog"
    >
      📅
    </button>

    <div
      #popup
      [id]="popupId()"
      class="legacy-datepicker__popup"
      popover="auto"
      role="dialog"
      [attr.aria-label]="'Choose date'"
      (toggle)="onPopupToggle($event)"
    >
      <div class="legacy-datepicker__popup-header">
        <button
          type="button"
          (click)="previousMonth()"
          aria-label="Previous month"
        >
          ‹
        </button>
        <span [id]="widgetId() + '-caption'">{{ monthLabel() }}</span>
        <button type="button" (click)="nextMonth()" aria-label="Next month">
          ›
        </button>
      </div>
      <div
        class="legacy-datepicker__grid"
        role="group"
        [attr.aria-labelledby]="widgetId() + '-caption'"
      >
        @for (day of visibleDays(); track day.iso) {
          <button
            type="button"
            class="legacy-datepicker__day"
            [class.legacy-datepicker__day--outside]="!day.inCurrentMonth"
            [attr.aria-current]="day.isToday ? 'date' : null"
            [attr.aria-pressed]="day.isSelected"
            [attr.aria-label]="day.label"
            (click)="pickDay(day.iso)"
          >
            {{ day.dayNumber }}
          </button>
        }
      </div>
    </div>
  `,
})
export class LegacyDatepickerComponent {
  /** Id placed on the widget's real, focusable `<input>` element. */
  readonly widgetId = input.required<string>();

  /** Parent field appearance used to place and style the calendar trigger. */
  readonly appearance = input<FormFieldAppearance>('standard');

  protected readonly popupId = computed(() => `${this.widgetId()}-popup`);

  /**
   * The widget's own value/change API: a free-typed raw string, not a
   * `Date`. Two-way bound (`[(rawValue)]`) by whatever wraps this widget.
   */
  readonly rawValue = model('');

  readonly widgetDisabled = input(false);

  /** Passthrough ARIA the widget applies to its internal `<input>`. */
  readonly labelledBy = input<string | null>(null);
  readonly ariaDescribedBy = input<string | null>(null);
  readonly ariaInvalid = input(false);
  readonly ariaRequired = input(false);

  // Native `#private` fields on a `viewChild()` query miscompile under this
  // workspace's dev toolchain (see apps/demo/src/app/app.ts) — use
  // `protected` instead.
  protected readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('input');
  protected readonly triggerEl =
    viewChild<ElementRef<HTMLButtonElement>>('trigger');
  protected readonly popupEl = viewChild<ElementRef<HTMLElement>>('popup');

  protected readonly viewMonth = signal(startOfMonth(new Date()));

  protected readonly monthLabel = computed(() =>
    this.viewMonth().toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    }),
  );

  protected readonly visibleDays = computed(() => {
    const month = this.viewMonth();
    const selectedIso = /^\d{4}-\d{2}-\d{2}$/u.test(this.rawValue())
      ? this.rawValue()
      : null;
    const today = new Date();
    const todayIso = toIso(today);

    const firstOfMonth = startOfMonth(month);
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(gridStart.getDate() - firstOfMonth.getDay());

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      const iso = toIso(date);

      return {
        iso,
        dayNumber: date.getDate(),
        inCurrentMonth: date.getMonth() === month.getMonth(),
        isToday: iso === todayIso,
        isSelected: iso === selectedIso,
        label: date.toLocaleDateString(undefined, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        }),
      };
    });
  });

  /**
   * A real third-party widget would expose *something* to programmatically
   * focus its interactive element — this is that "something". It is
   * deliberately not named `focus()`: the widget was not written against
   * the `FormValueControl` contract, and the adapter is what reconciles the
   * naming difference.
   */
  focusInput(): void {
    this.inputEl()?.nativeElement.focus();
  }

  protected onTextInput(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.rawValue.set(target.value);
    }
  }

  protected preparePopup(): void {
    if (this.widgetDisabled()) return;
    // `fromIso` returns null for anything that isn't a real calendar date —
    // including regex-shaped-but-impossible text like "2026-02-30", which
    // would otherwise roll forward into March (both via `new Date(iso)`'s
    // UTC parsing and via naive y/m/d construction that doesn't validate
    // the round-trip). Falling back to today keeps the popup's month in
    // sync with what the adapter actually accepts — text the adapter
    // rejects as a `parse` error never silently redirects the calendar.
    const typedDate = fromIso(this.rawValue());
    this.viewMonth.set(startOfMonth(typedDate ?? new Date()));
  }

  protected onPopupToggle(event: Event): void {
    if ((event as ToggleEvent).newState !== 'closed') return;

    const popup = this.popupEl()?.nativeElement;
    if (popup?.contains(document.activeElement)) {
      this.triggerEl()?.nativeElement.focus();
    }
  }

  protected previousMonth(): void {
    const month = this.viewMonth();
    this.viewMonth.set(new Date(month.getFullYear(), month.getMonth() - 1, 1));
  }

  protected nextMonth(): void {
    const month = this.viewMonth();
    this.viewMonth.set(new Date(month.getFullYear(), month.getMonth() + 1, 1));
  }

  protected pickDay(iso: string): void {
    this.rawValue.set(iso);
    this.popupEl()?.nativeElement.hidePopover();
    this.triggerEl()?.nativeElement.focus();
  }
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Parses a "YYYY-MM-DD" string as a local-time `Date` (never UTC — see the
 * `openPopup()` call site for why UTC parsing is wrong here), returning
 * `null` for anything that isn't shaped like a date OR isn't a *real*
 * calendar date. `new Date(year, month - 1, day)` never throws — it happily
 * rolls "2026-02-30" forward into March — so the round-trip is checked
 * explicitly (mirrors the `isRealCalendarDate` check in the adapter's
 * `parseLegacyDate`).
 */
function fromIso(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(iso);
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day);

  const isRealCalendarDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  return isRealCalendarDate ? date : null;
}

function toIso(date: Date): string {
  const y = date.getFullYear().toString().padStart(4, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}
