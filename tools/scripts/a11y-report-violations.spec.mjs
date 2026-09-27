import assert from 'node:assert/strict';
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { issueExists } from './a11y-report-violations.mjs';

/**
 * A failed search used to read as "no issue found", so every `gh issue list`
 * failure opened a duplicate issue. A broken search must stop issue creation.
 */
void test('issueExists throws when `gh issue list` fails, instead of reporting no issue found', async (t) => {
  const binDir = await mkdtemp(join(tmpdir(), 'ngx-a11y-gh-fail-'));
  t.after(() => rm(binDir, { recursive: true, force: true }));
  const fakeGh = join(binDir, 'gh');
  await writeFile(fakeGh, '#!/bin/sh\necho "gh: rate limited" >&2\nexit 1\n');
  await chmod(fakeGh, 0o755);

  const originalPath = process.env.PATH;
  process.env.PATH = `${binDir}:${originalPath}`;
  t.after(() => {
    process.env.PATH = originalPath;
  });

  assert.throws(() => issueExists('a11y(demo-e2e): color-contrast on /'));
});
