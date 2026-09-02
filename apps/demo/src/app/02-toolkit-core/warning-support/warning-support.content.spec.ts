import { describe, expect, it } from 'vitest';
import { WARNING_SUPPORT_CONTENT } from './warning-support.content';

describe('Warning Support educational copy', () => {
  it('quotes the live warning strings', () => {
    const items = WARNING_SUPPORT_CONTENT.learning.sections
      .flatMap((section) => section.items)
      .join('\n');

    expect(items).toContain('Consider using 6+ characters for better security');
    expect(items).toContain(
      'Consider using 12+ characters for better security',
    );
    expect(items).toContain(
      'Consider mixing uppercase, lowercase, numbers, and special characters',
    );
  });
});
