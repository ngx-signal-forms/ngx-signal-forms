import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardComponent } from '../card/card';

type DemonstratedCardConfig = {
  icon: string;
  title: string;
  sections: readonly {
    title: string;
    items: readonly string[];
  }[];
};

type LearningCardConfig = {
  title: string;
  sections: readonly {
    title: string;
    items: readonly string[];
  }[];
  nextStep: {
    text: string;
    link: string;
    linkText: string;
  };
};

let nextDemonstratedHeadingId = 0;

/**
 * Reusable Educational Cards for Form Examples
 *
 * Provides consistent educational content structure across all form examples.
 * Used for both "What You'll See Demonstrated" and "Learning Journey" cards.
 */
@Component({
  selector: 'ngx-example-cards',

  imports: [CardComponent, RouterLink],
  templateUrl: './example-cards.html',
  styleUrl: './example-cards.scss',
})
export class ExampleCardsComponent {
  demonstrated = input.required<DemonstratedCardConfig>();
  learning = input.required<LearningCardConfig>();

  protected readonly demonstratedHeadingId = `example-cards-demonstrated-${++nextDemonstratedHeadingId}`;
}
