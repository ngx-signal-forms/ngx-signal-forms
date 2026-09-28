'use strict';

// A backtick-length-aware inline code span or fenced code block. A run of N
// backticks opens the span; only the same run (not a shorter one) closes
// it, so a double-backtick span like ``@a`` survives a single backtick
// inside it.
//
// Shared by tools/commitlint/no-bare-mention.cjs and
// tools/release/project-changelog-renderer.ts so the two `@`-escaping
// guards cannot drift apart on what counts as "inside code".
exports.CODE_SPAN_OR_FENCE = /(`+)[\s\S]*?\1/gu;
