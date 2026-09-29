import { NgComponentOutlet } from '@angular/common';
import {
  Component,
  ViewContainerRef,
  inject,
  input,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Pins what Angular does with an input a renderer does not declare. The
 * JSDoc on `NGX_FORM_FIELD_ERROR_RENDERER` (core/tokens.ts) and on `NgxFormFieldHint`
 * (assistive/hint.ts), and `docs/CUSTOM_WRAPPERS.md`, describe this behavior.
 *
 * The error renderer is mounted with `*ngComponentOutlet`. The hint renderer
 * is mounted with `ViewContainerRef.createComponent` plus `setInput`.
 * `NgComponentOutlet` also calls `componentRef.setInput` for each entry in
 * `inputs`, so both paths behave the same way.
 */
@Component({ selector: 'spec-renderer', template: '{{ declared() }}' })
class RendererComponent {
  readonly declared = input<string | null>(null);
}

@Component({
  imports: [NgComponentOutlet],
  template: `<ng-container
    *ngComponentOutlet="renderer; inputs: { declared: 'yes', extra: 'no' }"
  />`,
})
class OutletHostComponent {
  protected readonly renderer = RendererComponent;
}

@Component({ template: '' })
class ImperativeHostComponent {
  readonly vcr = inject(ViewContainerRef);
}

describe('undeclared renderer inputs', () => {
  afterEach(() => vi.restoreAllMocks());

  it('logs an error and still delivers declared inputs through *ngComponentOutlet', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });

    const fixture = TestBed.createComponent(OutletHostComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('yes');
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining("Can't set value of the 'extra' input"),
    );
  });

  it('throws through setInput when the app enables errorOnUnknownProperties', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      errorOnUnknownProperties: true,
    });

    const host = TestBed.createComponent(ImperativeHostComponent);
    const ref = host.componentInstance.vcr.createComponent(RendererComponent);

    expect(() => {
      ref.setInput('extra', 'no');
    }).toThrow(/Can't set value of the 'extra' input/);
  });
});
