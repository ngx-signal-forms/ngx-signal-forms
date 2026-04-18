import { ComponentRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DebuggerBadge, DebuggerBadgeIcon } from './debugger-badge';

describe('DebuggerBadge', () => {
  let fixture: ComponentFixture<DebuggerBadge>;
  let component: DebuggerBadge;
  let componentRef: ComponentRef<DebuggerBadge>;
  let badgeEl: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DebuggerBadge, DebuggerBadgeIcon],
    }).compileComponents();

    fixture = TestBed.createComponent(DebuggerBadge);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    badgeEl = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default solid/neutral styling', () => {
    expect(badgeEl.getAttribute('data-variant')).toBe('solid');
    expect(badgeEl.getAttribute('data-appearance')).toBe('neutral');
    // The host retains the base `ngx-debugger-badge` class but no longer emits
    // the per-variant/appearance class couplets — selectors target the
    // `data-*` attributes instead.
    expect(badgeEl.classList.contains('ngx-debugger-badge')).toBe(true);
  });

  describe('Variants', () => {
    it('should update to outline variant', () => {
      componentRef.setInput('variant', 'outline');
      fixture.detectChanges();
      expect(badgeEl.getAttribute('data-variant')).toBe('outline');
    });

    it('should update to ghost variant', () => {
      componentRef.setInput('variant', 'ghost');
      fixture.detectChanges();
      expect(badgeEl.getAttribute('data-variant')).toBe('ghost');
    });
  });

  describe('Appearances', () => {
    const appearances = ['info', 'success', 'warning', 'danger'] as const;

    appearances.forEach((appearance) => {
      it(`should update to ${appearance} appearance`, () => {
        componentRef.setInput('appearance', appearance);
        fixture.detectChanges();
        expect(badgeEl.getAttribute('data-appearance')).toBe(appearance);
      });
    });
  });
});
