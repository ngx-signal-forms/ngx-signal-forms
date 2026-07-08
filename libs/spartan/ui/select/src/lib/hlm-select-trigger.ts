import type { BooleanInput } from '@angular/cdk/coercion';
import {
  afterEveryRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';
import {
  BrnFieldControl,
  BrnFieldControlDescribedBy,
} from '@spartan-ng/brain/field';
import { BrnSelectTrigger } from '@spartan-ng/brain/select';
import { hlm } from '@spartan-ng/helm/utils';
import type { ClassValue } from 'clsx';

@Component({
  selector: 'hlm-select-trigger',
  imports: [NgIcon, BrnSelectTrigger, BrnFieldControlDescribedBy],
  providers: [provideIcons({ lucideChevronDown })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      #trigger
      brnSelectTrigger
      brnFieldControlDescribedBy
      [id]="buttonId()"
      [class]="_computedClass()"
      [attr.data-size]="size()"
      [forceInvalid]="forceInvalid()"
      data-slot="select-trigger"
    >
      <ng-content />
      <ng-icon
        name="lucideChevronDown"
        class="text-muted-foreground pointer-events-none text-base"
      />
    </button>
  `,
})
export class HlmSelectTrigger {
  /**
   * `BrnSelectTrigger` host-binds `[attr.aria-invalid]` off the raw,
   * ungated `controlState().invalid` — it has no concept of "touched" or
   * any error-display strategy, so a required-and-empty select reports
   * `aria-invalid="true"` on first paint, before the user has interacted
   * with it. This is inconsistent with the same field's `data-matches-spartan-invalid`
   * attribute (used for the destructive-ring styling below), which is
   * correctly gated by Brain's `ErrorStateMatcher` (`invalid && touched`)
   * via `BrnFieldControl.spartanInvalid()`.
   *
   * Rather than relying on directive-matching/host-binding-write-order
   * (fragile and undocumented) to make a second `[attr.aria-invalid]`
   * binding "win" against `BrnSelectTrigger`'s own, this writes the gated
   * value imperatively in `afterEveryRender`, which is guaranteed to run
   * after Angular's regular change-detection (and therefore after Brain's
   * host binding) on every render — the same technique
   * `NgxSignalFormAutoAria` uses to correct `BrnInput`'s identical ungated
   * binding when `[formField]` sits on the same DOM node it writes to.
   * Here `[formField]` sits on the ancestor `<hlm-select>`, one level above
   * this trigger's real `role="combobox"` button, so that toolkit-side
   * correction can't reach it — this fixes it at the source instead,
   * using Brain's own touched-aware signal (no toolkit coupling needed).
   *
   * `forceInvalid()` is OR'd in here too — it also feeds `[forceInvalid]`
   * on the `brnSelectTrigger` binding above, which drives Brain's own
   * `data-matches-spartan-invalid` (the destructive-ring styling below).
   * Without the OR, a forced-invalid trigger would show the destructive
   * ring without announcing invalidity to assistive tech.
   */
  private readonly _fieldControl = inject(BrnFieldControl, { optional: true });

  private readonly _gatedInvalid = computed(
    () =>
      this.forceInvalid() || (this._fieldControl?.spartanInvalid() ?? false),
  );

  private readonly _triggerButton =
    viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  constructor() {
    afterEveryRender(() => {
      const button = this._triggerButton().nativeElement;
      if (this._gatedInvalid()) {
        button.setAttribute('aria-invalid', 'true');
      } else {
        button.removeAttribute('aria-invalid');
      }
    });
  }

  private static _id = 0;

  public readonly userClass = input<ClassValue>('', { alias: 'class' });
  protected readonly _computedClass = computed(() =>
    hlm(
      "border-input data-placeholder:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50 focus-visible:border-ring focus-visible:ring-ring/50 flex w-full items-center justify-between gap-1.5 rounded-md border bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 [&_ng-icon]:pointer-events-none [&_ng-icon]:shrink-0 [&_ng-icon:not([class*='text-'])]:text-base",
      'data-[matches-spartan-invalid=true]:ring-destructive/20 dark:data-[matches-spartan-invalid=true]:ring-destructive/40 data-[matches-spartan-invalid=true]:border-destructive dark:data-[matches-spartan-invalid=true]:border-destructive/50 data-[matches-spartan-invalid=true]:ring-3',
      this.userClass(),
    ),
  );

  public readonly buttonId = input<string>(
    `hlm-select-trigger-${HlmSelectTrigger._id++}`,
  );

  public readonly size = input<'default' | 'sm'>('default');

  /** Whether to force the trigger into an invalid state. */
  public readonly forceInvalid = input<boolean, BooleanInput>(false, {
    transform: booleanAttribute,
  });
}
