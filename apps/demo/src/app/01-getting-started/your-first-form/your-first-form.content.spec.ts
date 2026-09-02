import { describe, expect, it } from 'vitest';
import { YOUR_FIRST_FORM_CONTENT } from './your-first-form.content';

describe('Your First Form educational copy', () => {
  it('quotes live schema messages and does not claim native required', () => {
    const items = [
      ...YOUR_FIRST_FORM_CONTENT.demonstrated.sections.flatMap(
        (section) => section.items,
      ),
      ...YOUR_FIRST_FORM_CONTENT.learning.sections.flatMap(
        (section) => section.items,
      ),
    ].join('\n');

    expect(items).toContain('Name must be at least 2 characters');
    expect(items).toContain('Please enter a valid email address');
    expect(items).toMatch(/Signal Forms owns requiredness|owns requiredness/i);
    expect(items).not.toMatch(
      /Keep semantic control attributes such as <code>type<\/code>, <code>required<\/code>/,
    );
  });
});
