# ui-helm

Spartan's `@spartan-ng/helm` UI components, originally scaffolded into the
workspace via the Spartan CLI (`nx g @spartan-ng/cli:ui …`). Spartan ships
with a copy-the-source distribution model (à la shadcn/ui): the helm
components are installed _into_ your repo so you own them and can theme
them locally.

## These files are NOT kept identical to CLI output

Earlier revisions of this README claimed the files under
`libs/spartan/ui/{checkbox,icon,input,label,select,utils}` were kept
byte-identical to the Spartan CLI's output. That claim is false and has
been for a while — diffing against `@spartan-ng/cli@1.0.4`'s generator
templates shows real divergence, most of it intentional:

- **Deep form-state integration.** `hlm-input`'s `error: 'auto' | true`
  CVA variant, `hlm-checkbox`'s `_spartanInvalid`/`_errorStateClass`
  wiring, and `hlm-select-trigger`'s `afterEveryRender`-gated
  `aria-invalid` correction (see the doc comment in
  `select/src/lib/hlm-select-trigger.ts`) all exist to make these
  components track `ngx-signal-forms`' field state correctly — upstream's
  stock output has no equivalent. Regenerating via the CLI would silently
  drop this integration, not just cosmetic styling.
- **Restored-but-previously-dropped upstream surface (audit #148 / #182).**
  `forceInvalid` forwarding on `hlm-input` and `hlm-select-trigger`, the
  `data-slot="input"` host attribute on `hlm-input`, and
  `ChangeDetectionStrategy.OnPush` on `hlm-select-content`,
  `hlm-select-trigger`, `hlm-select-item`, `hlm-checkbox`, and the
  scroll-up/down affordances had drifted out of these files relative to
  upstream v1.0.4 with no accompanying reason — those have been restored
  to match upstream, since they don't conflict with the form-state
  integration above.
- **Older Tailwind utility styling.** The class strings in this lib
  predate upstream's newer semantic `spartan-*` class-name convention
  (visible by diffing e.g. `hlm-select-trigger.ts` against the CLI
  template) and have not been migrated. Swapping to the new class names
  requires vendoring upstream's companion CSS layer too, which this repo
  does not currently do — left as-is rather than half-migrated.

## Regenerating from the CLI is a manual merge, not a drop-in

Because of the above, **do not** run `nx g @spartan-ng/cli:ui …` and
blindly accept its output for these files — it will regress the
form-state integration this demo depends on. Treat a regenerate as a
three-way diff: upstream's new baseline, this repo's current file, and
the toolkit-integration bits that must survive the merge.

PR review suggestions that target `libs/spartan/ui/*` should call out
which category (integration / restorable drift / styling-convention drift)
a proposed change falls into — restorable-drift fixes (like #182 above)
are welcome; wholesale regeneration is not, without a plan for
re-threading the integration pieces.

## Consumed in-tree only

This library is not consumed from built or published artifacts in this
repo. Apps consume it through the `@spartan-ng/helm/*` tsconfig path
aliases declared in
`tsconfig.base.json`, which point directly at each secondary
entrypoint's `src/index.ts`. The build target, `package.json`
peerDependencies, and `ng-package.json` files are leftover Spartan-CLI
scaffolding for a hypothetical future publish path; if/when the lib
becomes a real package, the executor (`@nx/angular:ng-packagr-lite` →
`@nx/angular:package`) and peerDeps need to be revisited at that point.
