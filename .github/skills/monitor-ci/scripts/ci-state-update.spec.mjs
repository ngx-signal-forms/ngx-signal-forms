import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('./ci-state-update.mjs', import.meta.url));

function cycleCheck(code) {
  const result = spawnSync(
    process.execPath,
    [
      script,
      'cycle-check',
      '--code',
      code,
      '--agent-triggered',
      '--cycle-count',
      '9',
      '--max-cycles',
      '10',
    ],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

void test('preserves a successful current result when the cycle budget is reached', () => {
  const result = cycleCheck('ci_success');

  assert.equal(result.code, 'ci_success');
  assert.equal(result.cycleCount, 10);
  assert.equal(result.limitReached, true);
  assert.match(result.message, /do not start another CI Attempt/);
});

void test('preserves an actionable current result when the cycle budget is reached', () => {
  const result = cycleCheck('fix_needs_review');

  assert.equal(result.code, 'fix_needs_review');
  assert.equal(result.cycleCount, 10);
  assert.equal(result.limitReached, true);
});
