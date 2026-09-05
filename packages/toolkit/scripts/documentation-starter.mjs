import assert from 'node:assert/strict';

const starterPattern =
  /<!-- documentation-starter:start -->\s*```typescript\n([\s\S]*?)\n```\s*<!-- documentation-starter:end -->/g;

export function documentationStarter(readme) {
  const matches = [...readme.matchAll(starterPattern)];
  assert.equal(
    matches.length,
    1,
    'README must contain exactly one marked TypeScript starter',
  );
  return matches[0][1];
}
