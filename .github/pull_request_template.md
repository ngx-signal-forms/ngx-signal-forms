## Summary

<!-- What changed and why? Link the issue: "Closes #123".
     Add the smallest useful visual: pseudocode, call tree, component tree,
     file tree, Mermaid diagram, or diff. The /pr skill can fill this section. -->

## Evidence

<!-- Show concrete before/after evidence. Prefer screenshots for visual changes.
     Do not invent before evidence when none exists. Include exact test/build
     commands and results for execution evidence. The /pr skill can fill this
     section; keep commands and outcomes exact. -->

- **Before:** <!-- screenshot, output, failing test, or "not applicable" -->
  **After:** <!-- screenshot, output, passing test -->
- **Commands:** <!-- exact commands and results -->

## Merge Danger

<!-- Door: one-way or two-way. Say briefly why. Blast Radius: one word
     (for example: internal, toolkit, demo, consumer-facing), followed by any
     important ramifications. The /pr skill can fill this section. -->

**Door:** <!-- one-way or two-way -->

**Blast Radius:** <!-- one-word scope -->

## Checklist

- [ ] The PR title follows Conventional Commits, with every `@word` in backticks. The squash merge uses it as the commit subject.
- [ ] Tests cover the change, or the PR says why they are not needed.
- [ ] Docs are updated for any public API or behavior change.
- [ ] Accessibility: no new WCAG 2.2 AA violations.
