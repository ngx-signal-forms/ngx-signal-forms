# ngx-signal-forms Skill Consolidation — Complete

## Summary

The five individual `ngx-signal-forms-toolkit-*` skills have been consolidated into a single unified **`ngx-signal-forms`** skill hub with nested sub-skills and shared references, modeled on `angular-developer`, `pr-toolkit`, and `vitest`.

## Structure

```
.github/skills/ngx-signal-forms/
├── SKILL.md                  # Hub orchestrator (routing, entry point overview)
├── core/
│   └── SKILL.md             # @ngx-signal-forms/toolkit core
├── assistive/
│   └── SKILL.md             # @ngx-signal-forms/toolkit/assistive
├── form-field/
│   └── SKILL.md             # @ngx-signal-forms/toolkit/form-field
├── headless/
│   └── SKILL.md             # @ngx-signal-forms/toolkit/headless
├── vest/
│   └── SKILL.md             # @ngx-signal-forms/toolkit/vest
├── debugger/
│   └── SKILL.md             # @ngx-signal-forms/toolkit/debugger
└── references/
    ├── api.md               # Complete public API per entry point
    ├── signal-forms.md      # Angular Signal Forms base API reference
    ├── pitfalls.md          # Common mistakes and how to avoid them
    └── demo-map.md          # Repository demo paths organized by feature
```

## Old Skills (Removed)

- `ngx-signal-forms-toolkit-core/`
- `ngx-signal-forms-toolkit-assistive/`
- `ngx-signal-forms-toolkit-debugger/`
- `ngx-signal-forms-toolkit-form-field/`
- `ngx-signal-forms-toolkit-headless/`

## Benefits of the New Structure

### 1. **Single Entry Point**

Users trigger **one skill** (`ngx-signal-forms`) instead of five competing skills. Internal routing is predictable.

### 2. **Shared Knowledge**

Reference files (`api.md`, `signal-forms.md`, `pitfalls.md`, `demo-map.md`) are centralized and reusable across all entry points.

### 3. **Progressive Disclosure**

- **Hub (SKILL.md)**: Quick decision tree for which entry point to use
- **Sub-skills**: Focused guidance on one entry point each
- **References**: Detailed API docs, pitfalls, and repository resources

### 4. **Feature Parity with Ecosystem Skills**

The nested structure mirrors `angular-developer` (many references), `pr-toolkit` (orchestrator pattern), and `vitest` (focused guidance per tool).

### 5. **Up-to-Date Insights**

All content reflects the current public API:

- Removed APIs flagged clearly (`manual` strategy, `computeShowErrors`, etc.)
- All six entry points documented (including `vest` and `debugger`)
- Modern patterns emphasized (signal calls, immutable updates, `[formRoot]`, `OnPush`)

## Updated Resources

### Toolkit Instructions

[`.github/instructions/ngx-signal-forms-toolkit.instructions.md`](../instructions/ngx-signal-forms-toolkit.instructions.md) — unchanged, still the source of truth for coding rules within the project.

### Copilot Instructions

[`.github/copilot-instructions.md`](../copilot-instructions.md) — updated to reference the new unified skill and all six entry points.

## Sub-Skill Coverage

| Sub-Skill      | Covers                                                                                                                               |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **core**       | `form[formRoot][ngxSignalForm]`, error strategies, auto-ARIA, submission helpers, warning semantics, global config, message registry |
| **assistive**  | `NgxSignalFormErrorComponent`, hints, character count, assistive rows (standalone components)                                        |
| **form-field** | `NgxSignalFormFieldWrapperComponent`, `NgxSignalFormFieldset`, floating labels, grouped fieldsets                                    |
| **headless**   | Renderless directives (`NgxHeadlessErrorStateDirective`, fieldset, char count), template/host-directive patterns, utility functions  |
| **vest**       | Vest v6+ integration, blocking vs warning validation, submission gating                                                              |
| **debugger**   | Dev-time form inspection, field state visualization, strategy highlighting                                                           |

## Reference Files

| Reference           | Purpose                                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| **api.md**          | Complete public exports, signatures, and types per entry point (60+ KB)                          |
| **signal-forms.md** | Angular Signal Forms base API quick reference (forms, validators, field state, custom controls)  |
| **pitfalls.md**     | 10 common mistakes with wrong/correct patterns (signal calls, immutability, ARIA, imports, etc.) |
| **demo-map.md**     | Repository paths organized by feature + supporting docs (optional for external use)              |

## Migration Path

Old references to individual skills (`ngx-signal-forms-toolkit-core`, etc.) will be automatically replaced:

- Old SKILL descriptions are now sub-skill descriptions within the hub
- Routing is handled by the hub `SKILL.md`
- Examples, patterns, and guidance are consolidated and improved

Tools and agents referencing the old skill names will see the new unified skill instead once it's registered.

## Quality Assurance

- ✅ All public APIs documented (checked against `packages/toolkit/*/public_api.ts` and `packages/toolkit/README.md`)
- ✅ Removed APIs explicitly flagged (`manual`, `computeShowErrors`, `canSubmit`, `isSubmitting`)
- ✅ Latest Angular 21.2+ standards reflected (signal calls, `OnPush`, `@if/@for`, helper functions)
- ✅ Vest v6+ and debugger entry points included (were missing from old skills)
- ✅ Common pitfalls documented with before/after examples
- ✅ Repository demo paths updated and organized by feature

## Next Steps

1. **Try the new skill**: Ask Claude about any toolkit task and reference `ngx-signal-forms` by name or context
2. **Validate routin**: Verify that Claude correctly routes tasks to the appropriate sub-skill
3. **Extend references**: Add more examples to `references/` as patterns emerge
4. **Monitor triggers**: The hub description is designed to be "pushy" — it should trigger on toolkit mentions
