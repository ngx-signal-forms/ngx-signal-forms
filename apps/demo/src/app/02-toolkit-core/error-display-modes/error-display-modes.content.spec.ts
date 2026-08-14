import { describe, expect, it } from 'vitest';
import { ERROR_DISPLAY_MODES_CONTENT } from './error-display-modes.content';
import * as errorDisplayModesBarrel from './index';

function flattenItems(
  content: typeof ERROR_DISPLAY_MODES_CONTENT,
): readonly string[] {
  return [
    ...content.demonstrated.sections.flatMap((section) => section.items),
    ...content.learning.sections.flatMap((section) => section.items),
  ];
}

describe('Error Display Modes educational copy', () => {
  it('quotes live improvement messages and does not call the rating control stars or claim cross-field validation', () => {
    const items = flattenItems(ERROR_DISPLAY_MODES_CONTENT).join('\n');

    expect(items).toContain('Please help us understand what could be improved');
    expect(items).toContain(
      'Please provide at least 10 characters of feedback',
    );
    expect(items).not.toMatch(/stars/i);
    expect(items).not.toMatch(/cross-field validation/i);
  });

  it('does not export the unused productFeedbackValidationSuite', () => {
    expect(errorDisplayModesBarrel).not.toHaveProperty(
      'productFeedbackValidationSuite',
    );
  });
});
