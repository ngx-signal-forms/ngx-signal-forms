// Primary public entry point. Re-exports the `/core` secondary entry point
// so consumers importing from `@ngx-signal-forms/toolkit` get the same
// directives, tokens, providers, and utilities they always have. `/core`
// itself is a build-time-only secondary entry — it's stripped from the
// published `exports` map by a post-build step, so consumers cannot reach
// it via the supported resolver path.
export * from '@ngx-signal-forms/toolkit/core';
