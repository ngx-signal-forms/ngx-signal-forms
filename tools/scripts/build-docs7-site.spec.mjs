import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { buildSite, githubSlug, rewriteLinks } from './build-docs7-site.mjs';

const REF = 'abc123';
const BLOB = `https://github.com/ngx-signal-forms/ngx-signal-forms/blob/${REF}`;

function rewrite(
  markdown,
  { file = 'docs/GUIDE.md', kind = () => 'file' } = {},
) {
  const routes = new Map([
    ['README.md', 'README'],
    ['docs/GUIDE.md', 'docs/GUIDE'],
    ['docs/migrations/v1.0.0-rc.16.md', 'docs/migrations/v1-0-0-rc-16'],
  ]);
  return rewriteLinks(markdown, { file, routes, ref: REF, kind });
}

async function site(t, files) {
  const root = await mkdtemp(join(tmpdir(), 'ngx-docs7-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [name, content] of Object.entries(files)) {
    await mkdir(dirname(join(root, name)), { recursive: true });
    await writeFile(join(root, name), content);
  }
  const outDir = join(root, 'out');
  const errors = buildSite({ root, outDir, ref: REF });
  return { errors, read: (path) => readFile(join(outDir, path), 'utf8') };
}

const docsJson = (pages) =>
  JSON.stringify({
    name: 't',
    navigation: { groups: [{ group: 'G', pages }] },
  });

// Docs7 serves `X.md` as raw markdown, so a link left as written drops the
// reader out of the site.
void test('a link to another page becomes its site route and keeps the anchor', () => {
  const { markdown } = rewrite(
    'See [home](../README.md#install) and [guide](./GUIDE.md).',
  );
  assert.equal(
    markdown,
    'See [home](/README#install) and [guide](/docs/GUIDE).',
  );
});

// Docs7 strips dots from URLs, so `v1.0.0-rc.16` would 404 under its own name.
void test('a link to a page with dots in its name uses the dash route', () => {
  const { markdown } = rewrite('[rc.16](./migrations/v1.0.0-rc.16.md)');
  assert.equal(markdown, '[rc.16](/docs/migrations/v1-0-0-rc-16)');
});

// Source files are not on the site; the pinned GitHub URL is the only place
// they exist.
void test('a link to a repo file that is not a page points at GitHub at the build ref', () => {
  const { markdown } = rewrite('[type](../packages/toolkit/core/types.ts#L10)');
  assert.equal(markdown, `[type](${BLOB}/packages/toolkit/core/types.ts#L10)`);
});

// GitHub answers a /blob/ URL for a folder with a 404 page.
void test('a link to a repo folder points at the GitHub folder view', () => {
  const { markdown } = rewrite('[demo](../apps/demo/src/app/)', {
    kind: () => 'directory',
  });
  assert.equal(
    markdown,
    '[demo](https://github.com/ngx-signal-forms/ngx-signal-forms/tree/abc123/apps/demo/src/app)',
  );
});

void test('a link label with brackets is still rewritten', () => {
  const { markdown } = rewrite('[`[formField]` guide](./GUIDE.md)');
  assert.equal(markdown, '[`[formField]` guide](/docs/GUIDE)');
});

void test('absolute URLs, same-page anchors and code blocks stay as written', () => {
  const source = [
    '[web](https://angular.dev) [top](#intro)',
    '```md',
    '[example](./GUIDE.md)',
    '```',
  ].join('\n');
  assert.equal(rewrite(source).markdown, source);
});

// Broken links should fail the PR check, not ship to the site.
void test('a link to a missing file or outside the repo is an error', () => {
  const { errors } = rewrite('[gone](./GONE.md) [out](../../../x.md)', {
    kind: () => undefined,
  });
  assert.deepEqual(errors, [
    'docs/GUIDE.md: link to a missing file: ./GONE.md',
    'docs/GUIDE.md: link leaves the repo: ../../../x.md',
  ]);
});

void test('githubSlug follows GitHub: punctuation goes, code text stays', () => {
  assert.equal(githubSlug('Errors, submit & UX'), 'errors-submit--ux');
  assert.equal(
    githubSlug('Wire up a `<select>` with `[formField]`?'),
    'wire-up-a-select-with-formfield',
  );
  assert.equal(
    githubSlug('See [the guide](./x.md) (e.g. rc.16)'),
    'see-the-guide-eg-rc16',
  );
});

// Docs7 ids keep `&`, so `#errors-submit--ux` only works with an explicit id.
void test('a linked heading with punctuation gets an explicit GitHub id; plain headings do not', async (t) => {
  const { errors, read } = await site(t, {
    'docs.json': docsJson(['README', 'docs/GUIDE']),
    'README.md':
      '[a](docs/GUIDE.md#errors-submit--ux) [b](docs/GUIDE.md#setup)\n',
    'docs/GUIDE.md': '## Setup\n\ntext\n\n## Errors, submit & UX\n\ntext\n',
  });
  assert.deepEqual(errors, []);
  assert.equal(
    await read('docs/GUIDE.md'),
    '## Setup\n\ntext\n\n<a id="errors-submit--ux"></a>\n\n## Errors, submit & UX\n\ntext\n',
  );
});

void test('repeated headings get GitHub-style -1 suffixes', async (t) => {
  const { errors, read } = await site(t, {
    'docs.json': docsJson(['README']),
    'README.md': '[second](#why-1)\n\n## Why\n\n## Why\n',
  });
  assert.deepEqual(errors, []);
  assert.match(await read('README.md'), /<a id="why-1"><\/a>\n\n## Why\n$/);
});

// A heading that already ends in `-1` takes that id, so GitHub gives the
// next repeat `-2`. Reusing `-1` would break a correct `#foo-2` link.
void test('a repeat skips suffixes that another heading already took', async (t) => {
  const { errors, read } = await site(t, {
    'docs.json': docsJson(['README']),
    'README.md': '[third](#foo-2)\n\n## Foo\n\n## Foo-1\n\n## Foo\n',
  });
  assert.deepEqual(errors, []);
  assert.match(await read('README.md'), /<a id="foo-2"><\/a>\n\n## Foo\n$/);
});

void test('a link to an anchor no heading has is an error, and nothing is written', async (t) => {
  const { errors, read } = await site(t, {
    'docs.json': docsJson(['README', 'docs/GUIDE']),
    'README.md': '[a](docs/GUIDE.md#gone)\n',
    'docs/GUIDE.md': '## Setup\n',
  });
  assert.deepEqual(errors, [
    'README.md: link to a missing anchor: docs/GUIDE.md#gone',
  ]);
  await assert.rejects(read('docs.json'));
});

// Otherwise the second page overwrites the first and the build still passes.
void test('two pages that map to the same site route are an error', async (t) => {
  const { errors } = await site(t, {
    'docs.json': docsJson(['docs/a.b', 'docs/a-b']),
    'docs/a.b.md': 'one\n',
    'docs/a-b.md': 'two\n',
  });
  assert.deepEqual(errors, [
    'docs/a-b.md: its site route is already used by another page: docs/a-b.md',
  ]);
});

void test('docs.json lists the dash routes so the sidebar matches the files', async (t) => {
  const { read } = await site(t, {
    'docs.json': docsJson(['README', 'docs/v1.0.0-rc.16']),
    'README.md': '# Home\n',
    'docs/v1.0.0-rc.16.md': '# rc.16\n',
  });
  const navigation = JSON.parse(await read('docs.json')).navigation;
  assert.deepEqual(navigation.groups[0].pages, ['README', 'docs/v1-0-0-rc-16']);
  assert.equal(await read('docs/v1-0-0-rc-16.md'), '# rc.16\n');
});
