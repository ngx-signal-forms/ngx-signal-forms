import { describe, expect, it } from 'vitest';
import { COMPLEX_FORMS_CONTENT } from './complex-forms.content';

describe('Complex Forms educational copy', () => {
  it('does not invent boilerplate percentages or line counts', () => {
    const items = [
      ...COMPLEX_FORMS_CONTENT.demonstrated.sections.flatMap(
        (section) => section.items,
      ),
      ...COMPLEX_FORMS_CONTENT.learning.sections.flatMap(
        (section) => section.items,
      ),
    ].join('\n');

    expect(items).not.toMatch(/67%/);
    expect(items).not.toMatch(/33%/);
    expect(items).not.toMatch(/320 lines/);
    expect(items).not.toMatch(/280 lines/);
    expect(items).toMatch(/contacts/i);
  });
});
