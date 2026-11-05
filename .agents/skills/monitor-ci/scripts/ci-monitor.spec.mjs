import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const scriptPath = (name) => fileURLToPath(new URL(name, import.meta.url));

function runScript(name, args) {
  const result = spawnSync(process.execPath, [scriptPath(name), ...args], {
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function runGate(type, ...args) {
  return runScript('ci-state-update.mjs', [
    'gate',
    '--gate-type',
    type,
    ...args,
  ]);
}

function runCycleCheck(code, ...args) {
  return runScript('ci-state-update.mjs', [
    'cycle-check',
    '--code',
    code,
    ...args,
  ]);
}

function runPoll(args) {
  return runScript('ci-poll-decide.mjs', ['not-json', '0', 'minimal', ...args]);
}

test('local verification gate retains the configured attempt budget', () => {
  const allowed = runGate(
    'local-fix',
    '--local-verify-count',
    '2',
    '--local-verify-attempts',
    '3',
  );
  const blocked = runGate(
    'local-fix',
    '--local-verify-count',
    String(allowed.localVerifyCount),
    '--local-verify-attempts',
    '3',
  );

  assert.deepEqual(allowed, {
    allowed: true,
    localVerifyCount: 3,
    message: null,
  });
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.localVerifyCount, 3);
});

test('environment rerun gate retains its two-rerun budget', () => {
  const allowed = runGate('env-rerun', '--env-rerun-count', '1');
  const blocked = runGate(
    'env-rerun',
    '--env-rerun-count',
    String(allowed.envRerunCount),
  );

  assert.equal(allowed.allowed, true);
  assert.equal(allowed.envRerunCount, 2);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.envRerunCount, 2);
});

test('a successful final cycle is reported after the cycle budget is reached', () => {
  const result = runCycleCheck(
    'ci_success',
    '--agent-triggered',
    '--cycle-count',
    '0',
    '--max-cycles',
    '1',
  );

  assert.equal(result.cycleCount, 1);
  assert.equal(result.limitReached, false);
  assert.equal(result.approachingLimit, false);
});

test('the cycle budget blocks a remediation cycle at its limit', () => {
  const result = runCycleCheck(
    'fix_failed',
    '--agent-triggered',
    '--cycle-count',
    '0',
    '--max-cycles',
    '1',
  );

  assert.equal(result.limitReached, true);
});

test('invalid CI responses stop when the elapsed timeout is reached', () => {
  const result = runPoll(['--timeout', '1', '--elapsed-seconds', '60']);

  assert.equal(result.code, 'polling_timeout');
  assert.equal(result.noProgressCount, 1);
});

test('invalid CI responses stop at the no-progress circuit breaker', () => {
  const result = runPoll(['--no-progress-count', '12']);

  assert.equal(result.code, 'circuit_breaker');
  assert.equal(result.noProgressCount, 13);
});

test('invalid CI responses remain explicit before a stop limit is reached', () => {
  const result = runPoll(['--no-progress-count', '0']);

  assert.equal(result.code, 'error');
  assert.equal(result.message, 'Failed to parse ci_information JSON');
  assert.equal(result.noProgressCount, 1);
});
