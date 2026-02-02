import { ComponentRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  DebuggerBadgeComponent,
  DebuggerBadgeIconDirective,
} from './debugger-badge.component';

describe('DebuggerBadgeComponent', () => {
  let fixture: ComponentFixture<DebuggerBadgeComponent>;
  let component: DebuggerBadgeComponent;
  let componentRef: ComponentRef<DebuggerBadgeComponent>;
  let badgeEl: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DebuggerBadgeComponent, DebuggerBadgeIconDirective],
    }).compileComponents();

    fixture = TestBed.createComponent(DebuggerBadgeComponent);
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
    expect(badgeEl.classList.contains('ngx-debugger-badge--solid')).toBe(true);
    expect(badgeEl.classList.contains('ngx-debugger-badge--neutral')).toBe(
      true,
    );
  });

  describe('Variants', () => {
    it('should update to outline variant', () => {
      componentRef.setInput('variant', 'outline');
      fixture.detectChanges();
      expect(badgeEl.getAttribute('data-variant')).toBe('outline');
      expect(badgeEl.classList.contains('ngx-debugger-badge--outline')).toBe(
        true,
      );
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
        expect(
          badgeEl.classList.contains(`ngx-debugger-badge--${appearance}`),
        ).toBe(true);
      });
    });
  });
});
