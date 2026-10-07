import assert from 'node:assert/strict';
import { test } from 'node:test';

import ProjectChangelogRenderer, {
  escapeBareMentions,
} from './project-changelog-renderer.ts';

// CODING_STANDARDS.md requires every `@word` in a commit subject to be backticked,
// because GitHub renders a bare one as a mention of a stranger's account.
// Dependabot subjects such as `build(deps): bump @ng-icons/core …` reach
// this renderer with a bare `@word` regardless (see commitlint.config.cjs
// for the first guard, which does not run against dependabot).

void test('escapes a bare @scope/pkg as one unit', () => {
  assert.equal(
    escapeBareMentions('bump @ng-icons/core to v2'),
    'bump `@ng-icons/core` to v2',
  );
});

void test('leaves an already-backticked @word untouched', () => {
  assert.equal(
    escapeBareMentions('add `@group` support'),
    'add `@group` support',
  );
});

void test('escapes a @word at the start of the text', () => {
  assert.equal(
    escapeBareMentions('@group support added'),
    '`@group` support added',
  );
});

void test('escapes more than one bare @word in the same text', () => {
  assert.equal(
    escapeBareMentions('sync @group and @errors'),
    'sync `@group` and `@errors`',
  );
});

void test('does not touch text with no @word', () => {
  assert.equal(
    escapeBareMentions('improve error messages'),
    'improve error messages',
  );
});

void test('leaves a @word inside an inline code span untouched', () => {
  assert.equal(
    escapeBareMentions('support `foo @bar` in code'),
    'support `foo @bar` in code',
  );
});

void test('leaves an email address untouched', () => {
  assert.equal(
    escapeBareMentions('credit me@example.com in the notes'),
    'credit me@example.com in the notes',
  );
});

void test('leaves a @word inside a fenced code block untouched', () => {
  const text = 'see the example:\n```\n@foo bar\n```\ndone';
  assert.equal(escapeBareMentions(text), text);
});

void test('leaves a @word inside a double-backtick code span untouched', () => {
  assert.equal(
    escapeBareMentions('fix: handle ``@a`` ok'),
    'fix: handle ``@a`` ok',
  );
});

void test('keeps a sentence-final period outside a scoped mention', () => {
  assert.equal(escapeBareMentions('see @a/b.'), 'see `@a/b`.');
});

void test('keeps a sentence-final period outside @scope/pkg', () => {
  assert.equal(
    escapeBareMentions('bump @ng-icons/core.'),
    'bump `@ng-icons/core`.',
  );
});

void test('does not swallow a dash right after a mention', () => {
  assert.equal(
    escapeBareMentions('cc @foo - reviewer'),
    'cc `@foo` - reviewer',
  );
});

void test('tolerates null and undefined input', () => {
  assert.equal(escapeBareMentions(null), null);
  assert.equal(escapeBareMentions(undefined), undefined);
});

void test('escapes a mention preceded by an unmatched backtick', () => {
  // No closing backtick, so this is not a real code span. GitHub still
  // renders `@foo` as a mention, so the stray backtick must not shield it.
  // The stray backtick is itself backslash-escaped so it cannot combine
  // with the wrapping backtick we add into a spurious two-backtick run:
  // CommonMark reads `\`` `@foo` `` as a literal backtick followed by a
  // real code span, not as an unterminated double-backtick opener (which
  // would render `@foo` as plain text - still a real GitHub mention).
  // Verified against `marked` (a CommonMark-compliant renderer):
  //   <p>fix: `<code>@foo</code></p>
  assert.equal(escapeBareMentions('fix: `@foo'), 'fix: \\``@foo`');
});

void test('escapes a stray backtick with no adjacent mention', () => {
  assert.equal(
    escapeBareMentions('a stray ` backtick with no mention nearby'),
    'a stray \\` backtick with no mention nearby',
  );
});

void test('does not double-wrap a mention already inside a matched code span', () => {
  const text = 'see `@foo` here';
  assert.equal(escapeBareMentions(text), text);
});

void test('leaves a scoped package inside a bare URL untouched', () => {
  const text = 'see https://www.npmjs.com/package/@ng-icons/core for details';
  assert.equal(escapeBareMentions(text), text);
});

void test('leaves a scoped package inside a markdown link target untouched', () => {
  const text =
    'see [the package](https://www.npmjs.com/package/@ng-icons/core) for details';
  assert.equal(escapeBareMentions(text), text);
});

// Render-level coverage: the escaping must reach the actual changelog output,
// not just the pure helper. This is the case the previous version of this
// spec missed - `toSingleLine` (the Highlights summary) escaped a bare
// `@word`, but `formatChange` and `formatBreakingChange` did not.

function createRenderer(changes) {
  return new ProjectChangelogRenderer({
    changes,
    changelogEntryVersion: '1.0.0-rc.16',
    project: null,
    entryWhenNoChanges: false,
    isVersionPlans: false,
    changelogRenderOptions: {},
    conventionalCommitsConfig: { types: {} },
    remoteReleaseClient: {
      getRemoteRepoData: () => null,
      formatReferences: () => '',
    },
  });
}

void test('formatChange escapes a bare @word in the description and scope', () => {
  const renderer = createRenderer([]);
  const line = renderer.formatChange({
    type: 'fix',
    scope: 'deps',
    description: 'bump @ng-icons/core to v2',
    affectedProjects: '*',
  });
  assert.equal(line, '- **deps:** bump `@ng-icons/core` to v2');
});

void test('formatBreakingChange escapes a bare @word in the description and the explanation', () => {
  const renderer = createRenderer([]);
  const line = renderer.formatBreakingChange({
    type: 'feat',
    scope: 'core',
    description: 'drop @legacy-api support',
    body: 'BREAKING CHANGE: the @legacy-api export is removed.',
    affectedProjects: '*',
  });
  assert.equal(
    line,
    '- **core:** drop `@legacy-api` support\n  the `@legacy-api` export is removed.',
  );
});
