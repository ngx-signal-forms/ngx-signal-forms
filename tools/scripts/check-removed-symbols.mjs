// Fails when a doc still names a toolkit API that no longer exists.
//
// Two rules, run over every tracked Markdown file outside the removal
// records (migration guides, ADRs, archived reviews and the two skill pages
// that map removed names to their replacements):
//
// 1. A name in `removed-symbols.json` must not appear. The registry also
//    must not name anything the api-reports still export.
// 2. An `Ngx*` name must be declared in a tracked `.ts` file. This catches
//    a renamed or deleted class, directive or type without a registry entry.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const REMOVAL_RECORDS = [
  /^docs\/migrations\//u,
  /^docs\/MIGRATING_[^/]+\.md$/u,
  /^docs\/decisions\//u,
  /^\.agents\/review\//u,
  /^\.agents\/skills\/ngx-signal-forms\/migrations\//u,
  /^\.agents\/skills\/ngx-signal-forms\/references\/pitfalls\.md$/u,
];

const DECLARATION =
  /\b(?:class|function|const|let|type|interface|enum)\s+(Ngx\w+)|\bas\s+(Ngx\w+)/gu;

/**
 * @param {{
 *   docs: Map<string, string>,
 *   sources: string[],
 *   apiReports: string,
 *   removed: string[],
 * }} input
 * @returns {string[]} one message per problem
 */
export function checkRemovedSymbols({ docs, sources, apiReports, removed }) {
  const errors = [];
  for (const name of removed) {
    if (new RegExp(`\\b${name}\\b`, 'u').test(apiReports))
      errors.push(
        `removed-symbols.json lists ${name}, but the api-reports still export it`,
      );
  }

  const declared = new Set();
  for (const source of sources)
    for (const [, a, b] of source.matchAll(DECLARATION)) declared.add(a ?? b);

  const removedPattern = new RegExp(`\\b(${removed.join('|')})\\b`, 'gu');
  for (const [path, text] of docs) {
    if (REMOVAL_RECORDS.some((record) => record.test(path))) continue;
    text.split('\n').forEach((line, index) => {
      const at = `${path}:${index + 1}`;
      if (removed.length > 0)
        for (const [name] of line.matchAll(removedPattern))
          errors.push(`${at}: names removed API ${name}`);
      for (const [name] of line.matchAll(/\bNgx[A-Z]\w*/gu))
        if (!declared.has(name))
          errors.push(`${at}: names ${name}, which no .ts file declares`);
    });
  }
  return errors;
}

function tracked(...patterns) {
  return execFileSync('git', ['ls-files', '-z', '--', ...patterns], {
    encoding: 'utf8',
  })
    .split('\0')
    .filter(Boolean);
}

function main() {
  const { symbols } = JSON.parse(
    readFileSync(new URL('removed-symbols.json', import.meta.url), 'utf8'),
  );
  const read = (path) => readFileSync(path, 'utf8');
  const errors = checkRemovedSymbols({
    docs: new Map(tracked('*.md').map((path) => [path, read(path)])),
    sources: tracked('*.ts', '*.mts').map(read),
    apiReports: tracked('packages/toolkit/api-reports/*.d.ts')
      .map(read)
      .join('\n'),
    removed: symbols,
  });
  for (const error of errors) console.error(error);
  if (errors.length > 0) {
    console.error(
      `\n${errors.length} stale API reference(s). Update the doc, or see docs/CONTRIBUTING.md#removing-a-public-export.`,
    );
    process.exitCode = 1;
  }
}

if (resolve(process.argv[1] ?? '') === import.meta.filename) main();
