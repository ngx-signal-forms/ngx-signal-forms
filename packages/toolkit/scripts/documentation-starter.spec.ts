import { describe, expect, it } from 'vitest';
import { documentationStarter } from './documentation-starter.mjs';

const markedStarter = (source: string) =>
  [
    '<!-- documentation-starter:start -->',
    '```typescript',
    source,
    '```',
    '<!-- documentation-starter:end -->',
  ].join('\n');

describe('documentation starter extraction', () => {
  it('returns the single marked TypeScript starter', () => {
    expect(documentationStarter(markedStarter('const valid = true;'))).toBe(
      'const valid = true;',
    );
  });

  it.each([
    ['no marked starter', '# README'],
    [
      'duplicate marked starters',
      `${markedStarter('const first = true;')}\n${markedStarter('const second = true;')}`,
    ],
  ])('rejects %s', (_, readme) => {
    expect(() => documentationStarter(readme)).toThrowError(
      'README must contain exactly one marked TypeScript starter',
    );
  });
});
