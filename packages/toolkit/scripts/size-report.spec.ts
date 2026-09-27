import { describe, expect, it } from 'vitest';
import { formatSizeLimitMarkdownTable } from './size-report.mjs';

// #514 asks for a bundle-size change to be visible in the PR, not just
// pass/fail in a CI log. This is the formatter that turns `size-limit
// --json`'s raw byte counts into the Markdown table `ci.yml` appends to
// `$GITHUB_STEP_SUMMARY`.

describe('formatSizeLimitMarkdownTable', () => {
  it('renders a passing and a failing entry with a 1000-based KB size', () => {
    const table = formatSizeLimitMarkdownTable([
      { name: 'index', passed: true, size: 1060, sizeLimit: 1500 },
      { name: 'core', passed: false, size: 90000, sizeLimit: 80000 },
    ]);

    expect(table).toContain('| ✅ | index | 1.06 KB | 1.50 KB |');
    expect(table).toContain('| ❌ | core | 90.00 KB | 80.00 KB |');
  });

  it('renders a header row so the table is valid standalone Markdown', () => {
    const table = formatSizeLimitMarkdownTable([]);

    expect(table).toContain('| --- | --- | --- | --- |');
  });
});
