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
  },
};
