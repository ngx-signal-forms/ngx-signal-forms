// Bundle size budget for the built toolkit FESM output. Guards against an
// unnoticed regression in what a consumer downloads (#514).
//
// `size-limit` reports brotli size by default, with `KB` meaning 1000 bytes
// (`size-limit --json`'s `sizeLimit` for a `"1.5 KB"` limit is exactly
// `1500`, not the 1024-based `1536`). Each `limit` below is the entry's
// built size when the budget was set, plus roughly 25% headroom for normal
// growth (rounded to two significant figures, not necessarily a whole
// number) — tight enough that a real regression still trips it, loose
// enough that routine feature work does not.
//
// To update after an intentional size change:
//   1. `pnpm nx build toolkit`
//   2. `pnpm nx run toolkit:check-size` and read the reported size.
//   3. Set `limit` to that size plus ~25% headroom.
module.exports = [
  {
    name: 'index (root entry)',
    path: '../../dist/packages/toolkit/fesm2022/ngx-signal-forms-toolkit.mjs',
    limit: '1.5 KB',
  },
  {
    name: 'assistive',
    path: '../../dist/packages/toolkit/fesm2022/ngx-signal-forms-toolkit-assistive.mjs',
    limit: '32 KB',
  },
  {
    // `core` is not itself part of the published `exports` map (see
    // strip-internal-exports.mjs), but every published entry imports it at
    // runtime via a relative specifier, so its weight is part of what every
    // consumer downloads and belongs under the same budget discipline.
    name: 'core (shared by every entry)',
    path: '../../dist/packages/toolkit/fesm2022/ngx-signal-forms-toolkit-core.mjs',
    limit: '80 KB',
  },
  {
    name: 'form-field',
    path: '../../dist/packages/toolkit/fesm2022/ngx-signal-forms-toolkit-form-field.mjs',
    limit: '38 KB',
  },
  {
    name: 'headless',
    path: '../../dist/packages/toolkit/fesm2022/ngx-signal-forms-toolkit-headless.mjs',
    limit: '28 KB',
  },
  {
    name: 'testing',
    path: '../../dist/packages/toolkit/fesm2022/ngx-signal-forms-toolkit-testing.mjs',
    limit: '8 KB',
  },
  {
    name: 'vest',
    path: '../../dist/packages/toolkit/fesm2022/ngx-signal-forms-toolkit-vest.mjs',
    limit: '24 KB',
  },
];
