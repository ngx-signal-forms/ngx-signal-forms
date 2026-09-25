import assert from 'node:assert/strict';
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { issueExists } from './a11y-report-violations.mjs';

/**
 * `issueExists` guards against duplicate issue creation by searching for an
 * open issue first. If that search fails (rate limit, auth, network), the
 * caller must not treat "search failed" as "no issue found" — that reading
 * created a fresh issue every time `gh issue list` broke, instead of duplicate
 * of the real bug this test encodes: a broken search must stop issue
 * creation, not silently wave it through.
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
