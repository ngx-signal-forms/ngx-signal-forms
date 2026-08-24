# Coverage

One command produces one number:

```bash
pnpm coverage        # -> pnpm nx run workspace:coverage
```

It writes `coverage/lcov.info` (for reporting services), an HTML report at
`coverage/index.html`, and a summary in the terminal.

## What the number covers

Toolkit source only — `core`, `assistive`, `form-field`, `headless`, and `vest`
under `packages/toolkit`. Specs, barrel files (`index.ts`, `public_api.ts`), and
test setup are excluded, as are the demo apps and build scripts. They are not
part of the published package, and including them would dilute the figure.

Three Vitest projects feed it, and all three are required:

| Project           | Environment             | Covers                          |
| ----------------- | ----------------------- | ------------------------------- |
| `toolkit-jsdom`   | jsdom, forks pool       | the bulk of the unit specs      |
| `toolkit-browser` | Chromium via Playwright | `*.browser.spec.ts`, incl. a11y |
| `demo`            | jsdom, forks pool       | demo specs driving the toolkit  |

Vitest instruments once across all three projects and emits a single merged
report. There is no separate merge step.

`demo-shared` is not listed: its one spec covers route metadata, not toolkit
code.

The run pins `--maxWorkers=2`. Vitest refuses to start two projects that share
a `sequence.groupOrder` but resolve different `maxWorkers`, which these configs
do under CI. A CLI value applies to every project at the highest priority and
removes the divergence — a percentage does not, since it resolves per project.

## Why the config lives at the root

`coverage` is a **root-only** Vitest option. A `coverage` block declared inside
a project config is silently ignored, so the settings live in
`vitest.coverage.config.mts` at the workspace root rather than in
`packages/toolkit/vitest.shared.mts`.

See <https://vitest.dev/guide/projects.html#unsupported-options>.

## Never gate a single project

Both toolkit configs share one `include` glob spanning the whole source tree,
but each project runs only its own specs. Measured alone, `toolkit-browser`
reports around 70% — not because that code is untested, but because its tests
live in the jsdom project. The two only make sense together.

Thresholds therefore apply once, to the merged result, and are declared only in
`vitest.coverage.config.mts`.

## Nx and Playwright

Nx does not merge coverage; Vitest does. The `@nx/vitest:test` executor has no
`coverage` option at all — its `configFile`, `reportsDirectory`, `mode`,
`runMode`, `testFiles`, and `watch` are the complete set, and `reportsDirectory`
is not wired to Vitest. So `toolkit:test` and `toolkit:test-browser` stay plain
test targets, and coverage runs through the dedicated `workspace:coverage`
target instead.

The `demo-e2e` Playwright suite is not yet part of the number. It does drive
toolkit code through the demo app, so counting it is coherent — but it needs
source instrumentation (`vite-plugin-istanbul` behind an env flag), a fixture
that drains `window.__coverage__` after each test, and a merge across the four
CI shards. Until that lands, end-to-end behaviour stays gated by the a11y
baseline and the visual snapshot suites instead.

Note that `toolkit-browser` uses Playwright too — as Vitest's browser provider.
That one _is_ included, and is why the merged run needs browsers installed.
