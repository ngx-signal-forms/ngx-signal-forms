import { describe, expect, it } from 'vitest';
import { publishedReadme } from './generate-readme.mjs';

describe('published README links', () => {
  const base =
    'https://github.com/ngx-signal-forms/ngx-signal-forms/blob/abc123/';
  it('resolves repository links from the repository root, not the npm directory', () => {
    expect(
      publishedReadme(
        '[Wrapper](./packages/toolkit/form-field/README.md#quick-start)',
        'abc123',
      ),
    ).toBe(
      `[Wrapper](${base}packages/toolkit/form-field/README.md#quick-start)`,
    );
    expect(
      publishedReadme('[Warnings](docs/WARNINGS_SUPPORT.md)', 'abc123'),
    ).toBe(`[Warnings](${base}docs/WARNINGS_SUPPORT.md)`);
  });
  it('preserves external links, same-page fragments, and fenced examples', () => {
    const text =
      '[Start](#quick-start) [Web](https://example.com) [Email](mailto:a@example.com)\n```md\n[Example](./file.md)\n```';
    expect(publishedReadme(text, 'abc123')).toBe(text);
  });
  it('rewrites images and reference definitions, preserving titles', () => {
    expect(
      publishedReadme(
        '![Image](./image.png "caption")\n[guide]: /docs/FAQ.md "FAQ"',
        'abc123',
      ),
    ).toBe(
      `![Image](${base}image.png "caption")\n[guide]: ${base}docs/FAQ.md "FAQ"`,
    );
  });
});
