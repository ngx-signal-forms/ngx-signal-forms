import { provideZonelessChangeDetection } from '@angular/core';
import { Component } from '@angular/core';
import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { ExampleCardsComponent } from './example-cards';

const demonstrated = {
  icon: '🎯',
  title: 'Overview',
  sections: [{ title: 'Fields', items: ['Name'] }],
};

const learning = {
  title: 'Try it',
  sections: [{ title: 'Steps', items: ['Blur the name field'] }],
  nextStep: {
    text: 'Continue →',
    link: '/toolkit-core/warning-support',
    linkText: 'Warning Support',
  },
};

@Component({
  selector: 'ngx-example-cards-harness',
  imports: [ExampleCardsComponent],
  template: `
    <ngx-example-cards [demonstrated]="demonstrated" [learning]="learning" />
    <ngx-example-cards [demonstrated]="demonstrated" [learning]="learning" />
  `,
})
class ExampleCardsHarness {
  protected readonly demonstrated = demonstrated;
  protected readonly learning = learning;
}

describe('ExampleCardsComponent', () => {
  it('uses deterministic unique demonstrated heading ids', async () => {
    const { fixture } = await render(ExampleCardsHarness, {
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });

    const headings = fixture.nativeElement.querySelectorAll(
      'h2[id^="example-cards-demonstrated"]',
    ) as NodeListOf<HTMLHeadingElement>;

    expect(headings).toHaveLength(2);
    expect(headings[0].id).not.toBe(headings[1].id);
    expect(headings[0].id).toMatch(/^example-cards-demonstrated/);
    expect(headings[1].id).toMatch(/^example-cards-demonstrated/);
  });

  it('routes in-app next-step links through Angular routerLink', async () => {
    await render(ExampleCardsComponent, {
      inputs: { demonstrated, learning },
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });

    const nextStep = screen.getByRole('link', { name: /warning support/i });
    expect(nextStep.getAttribute('href')).toBe('/toolkit-core/warning-support');
  });
});
