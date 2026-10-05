# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Layout: single-context

This repo uses a single global context. ADRs live at `docs/decisions/` (this repo's convention) — **not** the default `docs/adr/`.

## Before exploring, read these

- **`GLOSSARY.md`** at the repo root
- **`docs/agents/domain-invariants.md`** for implementation-level constraints
- **`docs/decisions/`** — read ADRs that touch the area you're about to work in

If a file is missing or a stub, do not treat that as a problem by itself. Add or update glossary terms when work settles their meaning. Record an architectural decision when it is hard to reverse, surprising without context, and the result of a real trade-off.

## File structure

```
/
├── GLOSSARY.md
├── docs/
│   ├── decisions/
│   │   └── 0001-control-semantics-architecture.md
│   └── agents/
│       └── domain-invariants.md
├── apps/
└── packages/
```

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `GLOSSARY.md`. Don't drift to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, decide whether it is a real
project term. Add a concise definition to `GLOSSARY.md` when the work settles
its meaning.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0001 (control-semantics-architecture) — but worth reopening because…_
