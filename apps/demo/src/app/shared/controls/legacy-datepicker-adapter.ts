import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import {
  transformedValue,
  type FormValueControl,
  type ParseResult,
  type ValidationError,
} from '@angular/forms/signals';
import type { FormFieldAppearance } from '@ngx-signal-forms/toolkit';
import { LegacyDatepickerComponent } from './legacy-datepicker-widget';

/**
 * Parses the legacy widget's raw text into a `Date`, or reports a `parse`
 * error when the text is non-blank but malformed or not a real calendar
 * date (e.g. `2026-02-30`). Blank/whitespace-only text is treated as "no
 * value" — `{ value: null }`, no error — matching the widget's cleared
 * state rather than flagging an empty field as unparseable.
 *
 * `kind: 'parse'` is the same built-in Angular Signal Forms error kind used
 * by `transformedValue`'s own reference example (see
 * `@angular/forms/signals` `NumberInput` doc example) and by the toolkit's
 * `resolveErrorMessage` — it renders through the wrapper's normal error
 * surface with no extra wiring.
 */
function parseLegacyDate(raw: string): ParseResult<Date | null> {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { value: null };
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(trimmed);
  if (!match) {
    return {
      error: {
        kind: 'parse',
        message: `"${trimmed}" is not a date in YYYY-MM-DD format`,
      },
    };
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(year, month - 1, day);

  const isRealCalendarDate =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day;

  if (!isRealCalendarDate) {
    return {
      error: {
        kind: 'parse',
        message: `"${trimmed}" is not a real calendar date`,
      },
    };
  }

  return { value: date };
}

function formatLegacyDate(value: Date | null): string {
  if (value === null) return '';
  return [
    value.getFullYear().toString().padStart(4, '0'),
    (value.getMonth() + 1).toString().padStart(2, '0'),
    value.getDate().toString().padStart(2, '0'),
  ].join('-');
}

/**
 * Adapter that bridges `LegacyDatepickerComponent` — a self-contained stand-in
 * for a third-party datepicker with its own value/change API — to Angular
 * Signal Forms' `FormValueControl<Date | null>` contract.
 *
 * ## Value round-trip and type mismatch (Date vs raw string)
 *
 * The widget's own API works in raw strings (`rawValue` / `rawValueChange`).
 * `transformedValue()` owns the parse/format boundary: `parse` turns the
 * widget's text into a `Date | null` (or a `parse` validation error), and
 * `format` turns an external `Date | null` model change — including a
 * programmatic `form().reset()` — back into the text the widget displays.
 * Because `transformedValue` is called inside a component bound via
 * `[formField]`, parse errors are reported to the nearest field
 * automatically; no manual `errors` wiring is needed.
 *
 * ## Touched propagation without a single native blur
 *
 * The widget spans three focusable elements (its text input, its calendar
 * trigger button, and the day buttons inside its popover). A plain
 * `(blur)` on the internal input would mark the field touched — and could
 * flash a validation error — every time focus moves from the input to the
 * trigger button, even though the user is still interacting with the same
 * logical control. Instead this adapter listens for `(focusout)` on its own
 * host and only emits `touch` when the newly focused element
 * (`event.relatedTarget`) is *not* contained anywhere inside the host. That
 * fires exactly once, when focus truly leaves the whole widget — whether
 * from the input, the trigger, or a day button in the popup (popover elements
 * stay in the same DOM subtree even while promoted to the top layer, so
 * `contains()` still sees them).
 *
 * ## Where ARIA lands
 *
 * The widget renders its own internal `<input>` — the adapter's host element
 * is not the interactive control. So the wrapper's `aria-describedby` /
 * `aria-invalid` / `aria-required` are forwarded down onto that internal
 * input via the widget's own `ariaDescribedBy` / `ariaInvalid` /
 * `ariaRequired` passthrough inputs, not set on the adapter's host. This
 * only works because the fake widget was built with those passthrough
 * inputs; a real third-party widget must expose an equivalent escape hatch
 * (or you fall back to whatever ARIA surface it does own) — see
 * `docs/CUSTOM_CONTROLS.md`.
 */
@Component({
  selector: 'ngx-legacy-datepicker-adapter',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LegacyDatepickerComponent],
  host: {
    '(focusout)': 'onHostFocusOut($event)',
  },
  styles: `
    :host {
      display: block;
      inline-size: 100%;
      min-inline-size: 0;
    }
  `,
  template: `
    <ngx-legacy-datepicker
      #widget
      [widgetId]="controlId()"
      [(rawValue)]="rawValue"
      [widgetDisabled]="disabled()"
      [labelledBy]="labelledBy()"
      [ariaDescribedBy]="describedBy()"
      [ariaInvalid]="invalid()"
      [ariaRequired]="required()"
      [appearance]="appearance()"
    />
  `,
})
export class LegacyDatepickerAdapterComponent implements FormValueControl<Date | null> {
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);

  // Native `#private` fields on a `viewChild()` query miscompile under this
  // workspace's dev toolchain (see apps/demo/src/app/app.ts) — use
  // `protected` instead.
  protected readonly widget = viewChild.required(LegacyDatepickerComponent);

  /** Id forwarded to the widget's internal, real `<input>` element. */
  readonly controlId = input.required<string>();

  /** aria-labelledby source for the label projected outside this control. */
  readonly labelledBy = input<string | null>(null);

  /**
   * Explicit aria-describedby chain — this control runs in
   * `ngxSignalFormControlAria="manual"` mode, so the parent form computes
   * hint/error id chains and passes them in, mirroring the rating-control
   * pattern used elsewhere on this page.
   */
  readonly describedBy = input<string | null>(null);

  /** Wrapper appearance used only to align the widget's calendar trigger. */
  readonly appearance = input<FormFieldAppearance>('standard');

  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly required = input(false);
  readonly errors = input<readonly ValidationError[]>([]);

  /** Required by `FormValueControl<Date | null>`. */
  readonly value = model<Date | null>(null);

  /** Emitted when focus truly leaves the whole widget — see class doc. */
  readonly touch = output();

  /**
   * Bridges the widget's raw-string value/change API to `value` (a
   * `Date | null`), reporting parse errors to the bound field automatically.
   */
  protected readonly rawValue = transformedValue(this.value, {
    parse: parseLegacyDate,
    format: formatLegacyDate,
  });

  focus(): void {
    this.widget().focusInput();
  }

  protected onHostFocusOut(event: FocusEvent): void {
    const related = event.relatedTarget;
    const relatedNode = related instanceof Node ? related : null;
    if (
      relatedNode === null ||
      !this.#host.nativeElement.contains(relatedNode)
    ) {
      this.touch.emit();
    }
  }
}
