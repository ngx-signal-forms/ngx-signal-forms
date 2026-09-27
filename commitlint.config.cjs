'use strict';

const noBareMentionPlugin = require('./tools/commitlint/no-bare-mention.cjs');

// The commit subject drives `nx release` versioning and lands verbatim in
// GitHub release notes (see AGENTS.md). `@commitlint/config-conventional`
// already allows the types this repo uses (feat, fix, perf, refactor, docs,
// test, build, ci, chore, style, revert), so it is not overridden here.
module.exports = {
  extends: ['@commitlint/config-conventional'],
  plugins: [noBareMentionPlugin],
  rules: {
    'no-bare-mention': [2, 'always'],
    // History has commit bodies with a long single-line `BREAKING CHANGE:`
    // footer (a squash-merged PR body keeps its own wrapping). Off to match.
    'footer-max-line-length': [0],
    // Same reasoning as the footer: some commit bodies carry a long
    // single-line paragraph from the PR description. Off to match.
    'body-max-line-length': [0],
    // History has subjects over the default 100-char limit (issue numbers
    // and scopes push some past it). Off to match; PR titles are still
    // capped by GitHub's own UI limit regardless.
    'header-max-length': [0],
    // History has at least one non-lower-case subject ("refactor(headless):
    // NgxHeadlessCharacterCount delegates to createCharacterCount (audit
    // C2) (#328)"). Off rather than rewriting old commits to fit.
    'subject-case': [0],
  },
};
