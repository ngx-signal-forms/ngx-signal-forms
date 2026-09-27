import assert from 'node:assert/strict';
import { test } from 'node:test';

import { escapeBareMentions } from './project-changelog-renderer.ts';

// AGENTS.md requires every `@word` in a commit subject to be backticked,
// because GitHub renders a bare one as a mention of a stranger's account.
// Dependabot subjects such as `build(deps): bump @ng-icons/core …` reach
// this renderer with a bare `@word` regardless (see commitlint.config.cjs
// for the first guard, which does not run against dependabot).
void test('escapes a bare @word so GitHub cannot render it as a mention', () => {
  assert.equal(
    escapeBareMentions('bump @ng-icons/core to v2'),
    'bump `@ng-icons`/core to v2',
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
