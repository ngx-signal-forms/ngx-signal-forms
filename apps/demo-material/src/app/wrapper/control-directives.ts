import {
  Directive,
  ElementRef,
  forwardRef,
  inject,
  signal,
  type Signal,
} from '@angular/core';
import {
  NGX_SIGNAL_FORM_ARIA_MODE,
  type NgxSignalFormControlAriaMode,
} from '@ngx-signal-forms/toolkit';

/**
 * Frozen signal that yields `'manual'` for every read. Re-used by every
 * per-control directive in this file — Material's `MatFormFieldControl`
 * always owns `aria-describedby` on the projected control, so auto-aria
 * must always stand aside on a Material setup.
 */
const MANUAL_ARIA_MODE: Signal<NgxSignalFormControlAriaMode | null> =
  signal('manual');

/**
 * Abstract base for Material per-control directives.
 *
 * Used as the query token by `MatFormFieldWrapper`:
 * `contentChildren(NgxMatBoundControl)` finds every concrete per-control
 * directive in one shot regardless of which Material control kind it wraps.
 *
 * Each concrete directive registers itself under this token via a
 * `{ provide: NgxMatBoundControl, useExisting: forwardRef(() => Self) }`
 * provider — the canonical Angular pattern for queryable abstract bases
 * (mirrors `MatFormFieldControl` / `MatInput` / `MatSelect`).
 *
 * ## Why not host-directive composition over the toolkit's
 *    `NgxSignalFormControlSemanticsDirective`?
 *
 * Angular's host-directive metadata supports forwarding consumer-bound
 * inputs but does **not** support setting default input values. There is
 * therefore no way to compose the toolkit directive AND force its
 * `ariaMode` to `'manual'` at construction time. Two paths remain:
 *
 * - Have consumers write `ngxSignalFormControlAria="manual"` on every
 *   Material control (the previous iteration of this demo). The boilerplate
 *   that produced is exactly what this refactor removes.
 * - A Material-specific base class that hardcodes `manual` via a direct
 *   `NGX_SIGNAL_FORM_ARIA_MODE` provider. One small abstract class, no
 *   per-control consumer ceremony, single compile-time guarantee that
 *   auto-aria always stands aside on Material.
 *
 * The published `@ngx-signal-forms/material` package re-exports this base
 * class so consumers can extend it for custom Material controls (e.g. their
 * own `MatFormFieldControl` implementor).
 */
@Directive({
  providers: [
    {
      provide: NGX_SIGNAL_FORM_ARIA_MODE,
      useValue: MANUAL_ARIA_MODE,
    },
  ],
})
export abstract class NgxMatBoundControl {
  readonly elementRef = inject(ElementRef<HTMLElement>);
}

/**
 * Material text input — both `<input matInput>` and `<textarea matInput>`.
 * The toolkit treats every input `type` (text, email, number, …) the same
 * for kind/ARIA/strategy purposes, so a single directive covers them all.
 *
 * @example
 * ```html
 * <mat-form-field [ngxMatFormField]="form.email">
 *   <mat-label>Email</mat-label>
 *   <input matInput [formField]="form.email" ngxMatTextControl />
 * </mat-form-field>
 * ```
 */
@Directive({
  selector:
    'input[matInput][ngxMatTextControl], textarea[matInput][ngxMatTextControl]',
  providers: [
    {
      provide: NgxMatBoundControl,
      useExisting: forwardRef(() => NgxMatTextControl),
    },
  ],
})
export class NgxMatTextControl extends NgxMatBoundControl {}

/**
 * Material select — `<mat-select>` host element.
 *
 * @example
 * ```html
 * <mat-form-field [ngxMatFormField]="form.topic">
 *   <mat-label>Topic</mat-label>
 *   <mat-select [formField]="form.topic" ngxMatSelectControl>...</mat-select>
 * </mat-form-field>
 * ```
 */
@Directive({
  selector: 'mat-select[ngxMatSelectControl]',
  providers: [
    {
      provide: NgxMatBoundControl,
      useExisting: forwardRef(() => NgxMatSelectControl),
    },
  ],
})
export class NgxMatSelectControl extends NgxMatBoundControl {}

/**
 * Material checkbox — `<mat-checkbox>` host element.
 *
 * `<mat-checkbox>` does not implement `MatFormFieldControl`, so it lives
 * outside `<mat-form-field>`. Pair it with `*ngxMatFeedback` adjacent to
 * render errors and warnings in Material's idiom.
 */
@Directive({
  selector: 'mat-checkbox[ngxMatCheckboxControl]',
  providers: [
    {
      provide: NgxMatBoundControl,
      useExisting: forwardRef(() => NgxMatCheckboxControl),
    },
  ],
})
export class NgxMatCheckboxControl extends NgxMatBoundControl {}

/**
 * Material slide toggle — `<mat-slide-toggle>` host element.
 *
 * Behaves identically to `NgxMatCheckboxControl` for kind/ARIA purposes
 * (the toolkit treats `role="switch"` as a checkbox variant). Dedicated
 * directive for symmetry with Material's per-control naming and so the
 * future `@ngx-signal-forms/material` package can diverge if a switch-vs-
 * checkbox semantic distinction surfaces.
 */
@Directive({
  selector: 'mat-slide-toggle[ngxMatSlideToggleControl]',
  providers: [
    {
      provide: NgxMatBoundControl,
      useExisting: forwardRef(() => NgxMatSlideToggleControl),
    },
  ],
})
export class NgxMatSlideToggleControl extends NgxMatBoundControl {}
