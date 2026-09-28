import assert from 'node:assert/strict';
import { test } from 'node:test';

import plugin from './no-bare-mention.cjs';

const rule = plugin.rules['no-bare-mention'];

void test('rejects a bare @word in the subject', () => {
  const [valid] = rule({ header: 'feat: add @group support' });
  assert.equal(valid, false);
});

void test('accepts a backticked @word', () => {
  const [valid] = rule({ header: 'feat: add `@group` support' });
  assert.equal(valid, true);
});

void test('accepts a @word inside a single-backtick code span', () => {
  const [valid] = rule({ header: 'feat: support `foo @bar` in code' });
  assert.equal(valid, true);
});

void test('accepts a @word inside a double-backtick code span', () => {
  const [valid] = rule({ header: 'fix: handle ``@a`` ok' });
  assert.equal(valid, true);
});

void test('accepts an email address', () => {
  const [valid] = rule({ header: 'fix: credit me@example.com' });
  assert.equal(valid, true);
});

void test('rejects a mention preceded by an unmatched backtick', () => {
  // No closing backtick, so this is not a real code span. GitHub still
  // renders `@foo` as a mention, so the stray backtick must not shield it.
  const [valid] = rule({ header: 'fix: `@foo' });
  assert.equal(valid, false);
});

void test('accepts a scoped package inside a bare URL', () => {
  const [valid] = rule({
    header: 'docs: link https://www.npmjs.com/package/@ng-icons/core',
  });
  assert.equal(valid, true);
});

void test('accepts a scoped package inside a markdown link target', () => {
  const [valid] = rule({
    header:
      'docs: see [the package](https://www.npmjs.com/package/@ng-icons/core)',
  });
  assert.equal(valid, true);
});
