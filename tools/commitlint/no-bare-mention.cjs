'use strict';

// AGENTS.md requires every `@word` in a commit subject to be backticked
// (`` `@group` ``, not `@group`), because GitHub renders a bare `@word` in
// release notes as a mention of a stranger's account. This local commitlint
// rule enforces it. `tools/release/project-changelog-renderer.ts` escapes
// any bare `@word` that still reaches the renderer as a second guard.
const BARE_MENTION = /(^|[^`])@\w/u;

/** @type {import('@commitlint/types').Plugin} */
module.exports = {
  rules: {
    'no-bare-mention': (parsed) => {
      const header = parsed.header ?? '';
      return [
        !BARE_MENTION.test(header),
        'commit subject must backtick every `@word` (write `` `@group` ``, not `@group`) so GitHub does not render it as a user mention',
      ];
    },
  },
};
