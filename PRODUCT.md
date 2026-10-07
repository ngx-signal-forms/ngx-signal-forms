# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Angular developers building applications with Signal Forms, especially teams
that need reusable field feedback and accessible form interactions. Toolkit
maintainers are a secondary audience. The demo is a more specific learning
surface that shows developers how to adopt the toolkit; it is not the primary
product.

## Product Purpose

`@ngx-signal-forms/toolkit` adds reusable feedback and interaction support to
Angular Signal Forms. It helps teams show validation feedback at the right
time, connect feedback to controls, and guide users to invalid fields. Success
means developers can add these behaviors without replacing Angular's form
model or validation flow.

## Positioning

Angular owns form state, validation, and submission. The toolkit adds the UI
layer: configurable error timing, ARIA relationships, warnings, invalid-submit
focus, and optional field UI. Teams can adopt styled wrappers, feedback parts,
or headless state utilities, and can compose the toolkit with their existing
design system.

## Operating Context

Developers install the npm package and use its public entry points in Angular
applications. They start with Angular validators, then add an optional schema
or business-rule integration when needed. The repository's docs and demo
provide a learning path from a first form through nested forms, custom
controls, validation, and advanced submission patterns. The demo has its own
surface-specific design context.

## Capabilities and Constraints

- The published package is `@ngx-signal-forms/toolkit`, licensed under MIT.
- The supported Angular peer range is `>=22.0.0 <23.0.0`. Validate a new
  Angular major before extending this range.
- The package provides root, `/assistive`, `/form-field`, `/headless`, `/vest`,
  and `/testing` entry points. `vest` and `axe-core` are optional integrations.
- Angular remains responsible for form state, validation, and submission.
- The toolkit provides accessibility-related behavior, but does not guarantee
  that an integrating application conforms to WCAG. Integrators must test the
  finished experience.
- The browser support policy follows the last two major versions of Chrome,
  Edge, Firefox, and Safari, subject to the documented CSS runtime minimums.

## Brand Commitments

Use the public product name `@ngx-signal-forms/toolkit`. The project presents
the toolkit as a focused Angular enhancement, not a replacement for Angular
Signal Forms.

## Evidence on Hand

- Root README: install instructions, tested quick start, API levels, and
  behavior examples.
- `docs/` and the package entry-point READMEs: compatibility, integration, and
  usage guidance.
- `apps/demo/`: working examples for toolkit adoption; this is not evidence of
  customer deployments or outcomes.
- `packages/toolkit/testing/`: accessibility test helpers using axe-core's
  WCAG 2.2 AA rules.
- No customer testimonials, case studies, or outcome benchmarks are recorded
  as approved product evidence.

## Product Principles

- Preserve Angular's ownership of form state, validation, and submission.
- Make feedback behavior configurable at the app, form, and field levels.
- Support progressive adoption, from styled components to headless utilities.
- Keep integrations optional when they are not needed by the chosen entry
  point.
- Help teams build accessible forms and be clear that the final application
  still needs its own accessibility testing.

## Accessibility & Inclusion

WCAG 2.2 Level AA is the repository's accessibility target. The toolkit
supports accessible form interactions through ARIA relationships, feedback
timing, announcements, and focus management. These helpers do not replace
keyboard, screen-reader, and contrast testing in the integrating application.
