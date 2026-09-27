'use strict';

// AGENTS.md requires every `@word` in a commit subject to be backticked
// (`` `@group` ``, not `@group`), because GitHub renders a bare `@word` in
// release notes as a mention of a stranger's account. This local commitlint
// rule enforces it on the header only. It covers the change-list and
// breaking-change lines this renderer builds from a commit's description,
// scope, and body — `tools/release/project-changelog-renderer.ts` escapes
// any bare `@word` still reaching those lines as a second guard.
//
// A `@` preceded by a word character is an email's local part
// (`me@example.com`), not a mention, so it is not flagged. Code spans are
// stripped before the check, so `` `foo @bar` `` in code does not trip it.
const CODE_SPAN = /`[^`]*`/gu;
const BARE_MENTION = /(?<![\w`])@\w/u;

/** @type {import('@commitlint/types').Plugin} */
module.exports = {
  rules: {
    'no-bare-mention': (parsed) => {
      const header = (parsed.header ?? '').replace(CODE_SPAN, '');
      return [
        !BARE_MENTION.test(header),
        'commit subject must backtick every `@word` (write `` `@group` ``, not `@group`) so GitHub does not render it as a user mention',
      ];
    },
  },
};
