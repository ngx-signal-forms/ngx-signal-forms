'use strict';

const { CODE_SPAN_OR_FENCE } = require('./code-span.cjs');

// AGENTS.md requires every `@word` in a commit subject to be backticked
// (`` `@group` ``, not `@group`), because GitHub renders a bare `@word` in
// release notes as a mention of a stranger's account. This local commitlint
// rule enforces it on the header only.
// `tools/release/project-changelog-renderer.ts` covers the change-list and
// breaking-change lines it builds from a commit's description, scope, and
// body with the same escape, as a second guard for whatever reaches those
// lines.
//
// A `@` preceded by a word character is an email's local part
// (`me@example.com`), not a mention, so it is not flagged. Matched code
// spans (single- or double-backtick, or a fenced block) are stripped
// before the check, so `` `foo @bar` `` or ``@a`` do not trip it. The
// lookbehind excludes only word characters, not a backtick: an UNMATCHED
// backtick (e.g. `` `@foo `` with no closing backtick) is not a code span
// and must not shield the mention that follows it.
const BARE_MENTION = /(?<!\w)@\w/u;

/** @type {import('@commitlint/types').Plugin} */
module.exports = {
  rules: {
    'no-bare-mention': (parsed) => {
      const header = (parsed.header ?? '').replace(CODE_SPAN_OR_FENCE, '');
      return [
        !BARE_MENTION.test(header),
        'commit subject must backtick every `@word` (write `` `@group` ``, not `@group`) so GitHub does not render it as a user mention',
      ];
    },
  },
};
