import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkRemovedSymbols } from './check-removed-symbols.mjs';

const base = {
  sources: ['export class NgxFormFieldError {}', 'export { X as NgxAlias };'],
  apiReports: new Map([
    ['api-reports/index.d.ts', 'export declare class NgxFormFieldError {}'],
  ]),
  removed: ['readErrors', 'SignalLike'],
};

void test('flags a live doc that still teaches a removed API, with its line', () => {
  const errors = checkRemovedSymbols({
    ...base,
    docs: new Map([['docs/FAQ.md', 'Intro\nCall `readErrors(field)`.']]),
  });
  assert.deepEqual(errors, ['docs/FAQ.md:2: names removed API readErrors']);
});

void test('lets removal records name removed APIs, since mapping them to replacements is their job', () => {
  const docs = new Map([
    ['docs/migrations/v1.0.0-rc.16.md', '`readErrors` is internal.'],
    ['docs/decisions/0006-one-cascade-seam.md', '`readErrors` history.'],
    ['.agents/review/2026-09-03-review.md', '`readErrors` finding.'],
    ['.agents/skills/ngx-signal-forms/migrations/guide.md', '`readErrors`'],
    ['.agents/skills/ngx-signal-forms/references/pitfalls.md', '`readErrors`'],
  ]);
  assert.deepEqual(checkRemovedSymbols({ ...base, docs }), []);
});

void test('matches whole names only, so a prefixed successor does not trip the old name', () => {
  const errors = checkRemovedSymbols({
    ...base,
    sources: [...base.sources, 'export type NgxSignalLike<T> = T;'],
    docs: new Map([['README.md', 'Use `NgxSignalLike` and `readErrorsFor`.']]),
  });
  assert.deepEqual(errors, []);
});

void test('rejects a registry entry the api-reports still export, so the registry cannot hide a live API', () => {
  const errors = checkRemovedSymbols({
    ...base,
    removed: ['NgxFormFieldError'],
    docs: new Map(),
  });
  assert.deepEqual(errors, [
    'removed-symbols.json lists NgxFormFieldError, but the api-reports still export it',
  ]);
});

void test('reads exports from export clauses, but not from JSDoc or the internal core report, so a name made internal counts as removed', () => {
  const errors = checkRemovedSymbols({
    ...base,
    removed: ['readErrors', 'SignalLike', 'toHintDescriptors'],
    apiReports: new Map([
      [
        'api-reports/headless.d.ts',
        '/** Replaces the former `SignalLike`. */\ndeclare const a: 1;\nexport { a, readErrors };',
      ],
      [
        'api-reports/core.internal.d.ts',
        'declare function toHintDescriptors(): void;\nexport { toHintDescriptors };',
      ],
    ]),
    docs: new Map(),
  });
  assert.deepEqual(errors, [
    'removed-symbols.json lists readErrors, but the api-reports still export it',
  ]);
});

void test('flags an Ngx name that no source declares, without needing a registry entry', () => {
  const errors = checkRemovedSymbols({
    ...base,
    docs: new Map([
      [
        'packages/toolkit/README.md',
        '`NgxFormFieldError`, `NgxAlias` and `NgxFormFieldNotification`',
      ],
    ]),
  });
  assert.deepEqual(errors, [
    'packages/toolkit/README.md:1: names NgxFormFieldNotification, which no .ts file declares',
  ]);
});

void test('ignores declarations in comments, JSDoc examples and strings, so a deleted class cannot hide there', () => {
  const errors = checkRemovedSymbols({
    ...base,
    sources: [
      ...base.sources,
      '// export class NgxGone {}',
      '/** ```ts\n * export class NgxExample {}\n * ``` */',
      "const snippet = 'export class NgxQuoted {}';",
    ],
    docs: new Map([['README.md', '`NgxGone`, `NgxExample`, `NgxQuoted`']]),
  });
  assert.deepEqual(errors, [
    'README.md:1: names NgxGone, which no .ts file declares',
    'README.md:1: names NgxExample, which no .ts file declares',
    'README.md:1: names NgxQuoted, which no .ts file declares',
  ]);
});
