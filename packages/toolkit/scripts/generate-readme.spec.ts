import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { findBrokenReadmeLinks } from './check-published-package.mjs';
import { publishedReadme, writePublishedReadmes } from './generate-readme.mjs';

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

  describe('secondary entry point README', () => {
    const sourceDir = 'packages/toolkit/assistive';
    const shipped = new Set([
      'packages/toolkit/form-field/README.md',
      'packages/toolkit/README.md',
    ]);
    const rewrite = (text: string) =>
      publishedReadme(text, 'abc123', {
        sourceDir,
        isShipped: (repoPath: string) => shipped.has(repoPath),
      });

    it('resolves a repo doc from the README folder, keeping the anchor', () => {
      expect(
        rewrite('[Warnings](../../../docs/WARNINGS_SUPPORT.md#timing)'),
      ).toBe(`[Warnings](${base}docs/WARNINGS_SUPPORT.md#timing)`);
    });

    it('resolves a root README anchor from three levels up', () => {
      expect(rewrite('[Levels](../../../README.md#choose-your-level)')).toBe(
        `[Levels](${base}README.md#choose-your-level)`,
      );
    });

    it('keeps a sibling entry point link that ships in the package', () => {
      expect(rewrite('[Form field](../form-field/README.md)')).toBe(
        '[Form field](../form-field/README.md)',
      );
      expect(rewrite('[Toolkit](../README.md#configuration)')).toBe(
        '[Toolkit](../README.md#configuration)',
      );
    });

    it('makes a link to a sibling file that does not ship absolute', () => {
      expect(rewrite('[Theming](../form-field/THEMING.md#tokens)')).toBe(
        `[Theming](${base}packages/toolkit/form-field/THEMING.md#tokens)`,
      );
    });

    it('leaves in-page anchors alone', () => {
      expect(rewrite('[Top](#quick-start)')).toBe('[Top](#quick-start)');
    });
  });

  describe('writePublishedReadmes', () => {
    let dir: string | undefined;
    afterEach(() => {
      if (dir !== undefined) rmSync(dir, { recursive: true, force: true });
    });

    it('leaves no packed README with a link that fails to resolve in the tarball', () => {
      dir = mkdtempSync(join(tmpdir(), 'generate-readme-'));
      const write = (path: string, text: string) => {
        mkdirSync(join(dir!, path, '..'), { recursive: true });
        writeFileSync(join(dir!, path), text);
      };
      write('README.md', '[Docs](docs/A.md)');
      write(
        'packages/toolkit/vest/README.md',
        '[Doc](../../../docs/A.md) [Home](../README.md) [Theme](../form-field/THEMING.md)',
      );
      write('dist/README.md', '');
      write('dist/vest/README.md', 'copied by ng-packagr');
      const distRoot = join(dir, 'dist');

      writePublishedReadmes({ root: dir, distRoot, ref: 'abc123' });

      expect(readFileSync(join(distRoot, 'vest/README.md'), 'utf8')).toBe(
        `[Doc](${base}docs/A.md) [Home](../README.md) [Theme](${base}packages/toolkit/form-field/THEMING.md)`,
      );
      expect(
        findBrokenReadmeLinks(distRoot, ['README.md', 'vest/README.md']),
      ).toEqual([]);
    });
  });
});
