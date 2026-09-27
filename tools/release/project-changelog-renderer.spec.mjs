import assert from 'node:assert/strict';
import { test } from 'node:test';

import ProjectChangelogRenderer, {
  escapeBareMentions,
} from './project-changelog-renderer.ts';

// AGENTS.md requires every `@word` in a commit subject to be backticked,
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
