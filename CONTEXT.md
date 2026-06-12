# Context

> **TODO:** Fill this in. The engineering skills (`improve-codebase-architecture`, `diagnose`, `tdd`,
> `to-issues`, `qa`) read this file to learn the project's domain language and key concepts.
> The `/grill-with-docs` skill can populate it incrementally as terms get resolved during real work.

## Project

ngx-signal-forms — an Angular toolkit for working with Signal Forms.

## Glossary

<!-- Populate with domain terms as they get resolved. Each entry: term, definition, and any
     synonyms to *avoid* drifting to. -->

- **Built-in validation error** — a validation error produced by Angular's own
  validators, i.e. a member of the `NgValidationError` union (`required`,
  `min`, `max`, `minDate`, `maxDate`, `minLength`, `maxLength`, `pattern`,
  `email`, `parse`, `standardSchema`). Has a known, typed `kind` and typed
  discriminating fields. The toolkit narrows these structurally (on `kind`,
  not `instanceof`) so they survive realm boundaries.
- **Custom validation error** — any validation error with a `kind` outside the
  `NgValidationError` union: async validators, cross-field checks, warnings
  (`warn:*` prefix), Vest results, etc. Shape is not known at compile time; the
  toolkit humanizes its `kind` string for display and types its registry
  factory params as `any`.
- **Warning** — a _non-blocking_ validation error, identified by a `warn:`
  prefix on its `kind`. It is **per-error**: one field can simultaneously carry
  a blocking error _and_ a warning, and the toolkit splits the two on the
  prefix. Deliberately **not** modelled on Angular's per-field `SEVERITY`
  metadata (which appears in post-22.0.0 docs and is absent from the pinned
  `22.0.0`): `SEVERITY` aggregates to a field's _highest_ severity and so
  cannot express "error A on this field blocks, error B is a warning". The
  toolkit will only retire `warn:` for a _per-`ValidationError`_ severity/blocking
  signal from Angular, not for field-level `SEVERITY`. Synonym to avoid: "soft
  error".
- **WCAG 2.2 AA** — the accessibility conformance level this project targets.
  Toolkit components must satisfy it unconditionally (hard fail in Vitest browser
  specs). Demo apps track compliance against a versioned baseline; deviations
  create GitHub issues but do not block PRs.
- **a11y baseline** — a per-demo-app JSON file (`a11y-baseline.json`) that
  records known axe violations. The CI `a11y` job diffs the current run against
  this file; new violations trigger auto-issue creation and a baseline update.
  Synonym to avoid: "known violations list" (ambiguous — use "a11y baseline").

## Key concepts

<!-- Populate with the load-bearing ideas a new contributor (or agent) needs to know before
     touching the code. -->

- **Structural vs. nominal error narrowing** — error-message resolution keys on
  the public `kind` discriminant rather than `instanceof NgValidationError`.
  Angular brands its error classes with a private field, so `instanceof` breaks
  across duplicated `@angular/forms` copies (monorepo / module federation) and
  for the plain objects custom validators emit. A compile-time exhaustiveness
  guard (`Record<NgValidationError['kind'], true>` + an `assertNever` switch
  default) forces review whenever an Angular minor adds a new built-in kind.
