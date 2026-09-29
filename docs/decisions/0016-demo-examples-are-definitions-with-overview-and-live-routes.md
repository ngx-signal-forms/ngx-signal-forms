# ADR-0016: Demo Examples Are Definitions With an Overview Route and a Live Route

## Status

Accepted.

## Date

2026-09-29

## Context

Issue [#595](https://github.com/ngx-signal-forms/ngx-signal-forms/issues/595).

`apps/demo` has 26 examples. Each example is one routed `*.page.ts` file. 21 of these pages repeat the same parts: the page header, the example cards, the split layout, the display controls in the right rail, a deferred form debugger with the same `@error` block, and the chips that summarize the controls. Ten pages are near-copies of each other.

Each page also reaches into its form component through `viewChild` only to give the form's field tree to the debugger. Across the pages, 20 different property names feed the debugger.

Every path lives in three places: the route config, a `getRouteTitle('/…')` string and the navigation metadata. These lists already disagree: the metadata marks single-model-wizard as having no controls, but the page registers them.

The teaching text is spread out. Each example has content cards stored as HTML strings and rendered with `[innerHTML]`. 24 files also hold "Try this" guidance, some in content files and some inside forms.

The published demo is a teaching site. Readers must see why an example exists, which toolkit features it uses, what to try and how the form uses each feature. The page files do not teach this. They hold demo chrome, and nobody copies that chrome into a real app. The `*.form.ts` files are where the toolkit is used.

## Decision

**An example is a definition, not a page file.** Each example is one typed definition. It holds:

- the route path
- the typed teaching content
- a lazy import of the form component
- a typed accessor for the form's field tree, for example `(form) => form.profileForm`
- the display controls it offers and their defaults

One generic **example overview** and one generic **live example** render every example from its definition. The per-example page files go away.

**Every example has two routes.** The existing URL, for example `/getting-started/your-first-form`, shows the example overview: its purpose and the toolkit features it uses. A child route, `…/live`, shows the live example: the form, the debugger, the display controls, a one-line purpose with a link back to the overview, and one collapsible guidance panel with "try this" steps and "how it's used" notes. The panel remembers whether the reader collapsed it, once for all examples. It falls back to open if browser storage is not available. Published links keep working, and they now land on the overview.

**The teaching content is structured data, not HTML.** Content has fixed sections:

- purpose
- features used, as a fixed list of toolkit features, each linked to its `docs/*.md` page
- "try this" steps, each an action plus what to watch for
- "how it's used" notes, each a feature plus where the form uses it

The only inline markup is backticks for code. The template renders it as `<code>` elements, so nothing goes through `[innerHTML]` and there is no Markdown parser.

**The live example owns the display controls.** The definition lists the controls it offers and their defaults. The live example owns the state and passes it to the form through inputs. Error mode (with an optional list of allowed modes), appearance and orientation are standard controls.

The preferred option is to make **every** control that the current examples use a standard control that an example turns on in its definition. This adds brand theme, grouped-feedback placement, field marking and the fieldset variants. A prototype must show that this option stays simple before we build it. If the prototype shows that it is too complex or does not work, we fall back: a control joins the standard set only when a second example needs it.

A control that no standard control covers goes in an example controls component. That component shares state with the form through an example-scoped provider on the example's route.

**Examples that do not fit supply their own live area.** error-display-modes re-mounts the form for each mode on purpose. fieldset-appearance and advanced-wizard render their debugger in their own way. These three examples supply their own component for the live area, which takes the place of the form and debugger split. They keep the rest of the live example. fieldset-appearance moves its controls out of its form component.

**The list of example definitions is the one source for routes, navigation, titles and test route lists.** The e2e suite and the a11y scan read their route lists from it, and they cover both the overview URL and the `/live` URL of every example.

**The forms do not change**, apart from fieldset-appearance's controls. The forms are the teaching material, and their property names stay as they are. The field-tree accessor in the definition connects the live example to the form.

## Alternatives considered

**A frame component with thin per-example pages.** Each page would place its form inside a shared frame. Rejected: each page would still reach into its form to get the field tree, and the paths would still live in three places. The duplication would shrink, but it would not go away.

**Keep per-example pages, built from smaller shared parts.** Rejected: this keeps 26 files that teach nothing and still drift apart.

**Show the overview on the live screen, in a collapsible panel.** Rejected: the live screen already holds the form, the debugger and the display controls. A fourth area undoes the reason for the split.

**Markdown content files, or AnalogJS content routes.** Rejected for now: a framework change inside a content redesign doubles the risk. The structured content maps directly to Markdown frontmatter if a later AnalogJS spike shows that prerendering is worth it.

**Rename every form's field-tree property to `formTree`.** Rejected: names like `profileForm` read better in the form templates that readers learn from. The typed accessor gives the same result without changing the forms.

## Consequences

- The published URLs now show the example overview. Deep links to the form need `/live`.
- Adding an example means adding one definition and one form. A spec runs over every definition and checks that the overview and the live example render, that every content section is filled in and that the debugger gets a field tree.
- The a11y gate (ADR-0013) scans twice as many URLs.
- The navigation, the titles and the test route lists can no longer drift from the routes. This also fixes the wrong `hasControls` value for single-model-wizard.
- If the prototype confirms the preferred option, the standard control set is wider than today's shared controls. Each standard control makes the live example's interface wider. The prototype's result decides which rule applies, and this ADR is updated to record it.
- The demo's render-error boundary (issue #596) sits around the app shell's router outlet. It covers both the overview route and the live route without changes.
- An agent drafts the new teaching content for each migration batch, and a maintainer reviews it in that batch's pull request.
