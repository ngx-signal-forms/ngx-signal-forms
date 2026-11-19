import { ComponentRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxSignalFormDebuggerBadge } from './debugger-badge';

describe('NgxSignalFormDebuggerBadge', () => {
  let fixture: ComponentFixture<NgxSignalFormDebuggerBadge>;
  let componentRef: ComponentRef<NgxSignalFormDebuggerBadge>;
  let badgeEl: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxSignalFormDebuggerBadge],
    }).compileComponents();

    fixture = TestBed.createComponent(NgxSignalFormDebuggerBadge);
    componentRef = fixture.componentRef;
    badgeEl = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('should have default solid/neutral styling', () => {
    expect(badgeEl.getAttribute('data-variant')).toBe('solid');
    expect(badgeEl.getAttribute('data-appearance')).toBe('neutral');
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
