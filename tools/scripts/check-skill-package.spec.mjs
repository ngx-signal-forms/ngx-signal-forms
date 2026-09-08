import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { checkSkillPackage } from './check-skill-package.mjs';

const header =
  '---\nname: ngx-signal-forms\ndescription: Toolkit forms and wrappers.\n---\n';

async function fixture(t, files) {
  const root = await mkdtemp(join(tmpdir(), 'ngx-skill-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const [name, content] of Object.entries(files)) {
    await mkdir(dirname(join(root, name)), { recursive: true });
    await writeFile(join(root, name), content);
  }
  return root;
}

void test('accepts a self-contained guide graph, remote docs, and repeated headings', async (t) => {
  const root = await fixture(t, {
    'SKILL.md':
      header +
      '[Guide](references/forms.md#state-1)\n[Docs](https://angular.dev/)\n',
    'references/forms.md':
      '# State\n## State\n[Home](../SKILL.md)\n```md\n[Example](missing.md)\n```\n',
  });
  assert.deepEqual(await checkSkillPackage(root), []);
});

void test('rejects sibling skills and repository-relative links', async (t) => {
  const root = await fixture(t, {
    'SKILL.md':
      header +
      '[Other](../angular-developer/SKILL.md)\n[Docs](../../../docs/TESTING.md)',
  });
  const errors = await checkSkillPackage(root);
  assert.equal(
    errors.filter((error) => error.startsWith('Escaping link:')).length,
    2,
  );
});

void test('rejects broken files, anchors, and orphan guides', async (t) => {
  const root = await fixture(t, {
    'SKILL.md': header + '[Missing](missing.md)\n[Anchor](guide.md#missing)',
    'guide.md': '# Guide\n',
    'orphan.md': '# Orphan\n',
  });
  const errors = await checkSkillPackage(root);
  assert.ok(errors.some((error) => error.startsWith('Missing link:')));
  assert.ok(errors.some((error) => error.startsWith('Missing anchor:')));
  assert.ok(
    errors.some((error) => error.startsWith('Unreachable guide: orphan.md')),
  );
});

void test('rejects nested installable skills and missing root metadata', async (t) => {
  const root = await fixture(t, {
    'SKILL.md': '# Toolkit\n[Child](core/SKILL.md)',
    'core/SKILL.md': header,
  });
  const errors = await checkSkillPackage(root);
  assert.ok(errors.some((error) => error.startsWith('Root SKILL.md')));
  assert.ok(errors.some((error) => error.startsWith('Nested skill:')));
});

void test('rejects symlink dependencies and machine-specific paths', async (t) => {
  const root = await fixture(t, {
    'SKILL.md': header + 'Read /Users/example/private/guide.md',
  });
  await symlink(join(root, 'SKILL.md'), join(root, 'linked.md'));
  const errors = await checkSkillPackage(root);
  assert.ok(errors.some((error) => error.startsWith('Symlink:')));
  assert.ok(errors.some((error) => error.startsWith('Machine path:')));
});

void test('checks reference-style links and explicit HTML anchors', async (t) => {
  const root = await fixture(t, {
    'SKILL.md': header + '[Guide][g]\n\n[g]: guide.md#custom\n',
    'guide.md': '# Guide\n<a id="custom"></a>\n',
  });
  assert.deepEqual(await checkSkillPackage(root), []);
});
