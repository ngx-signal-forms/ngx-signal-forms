# Install and publish the paired skills

These skills have separate entry points but share references. Distribute the complete `ngrx-signals/` and `ngrx-toolkit/` directories as siblings under one supported skill root. Copying only `SKILL.md`, or installing either folder alone, leaves required links unresolved. An installer that isolates each skill must preserve sibling access or rewrite and validate the shared-reference layout.

## External project installation

1. Place both complete directories in a skill location supported by the target host. VS Code supports project `.github/skills/`, `.claude/skills/`, and `.agents/skills/`, and personal `~/.copilot/skills/`, `~/.claude/skills/`, and `~/.agents/skills/`. Other hosts may use different discovery paths or restrict cross-folder reads. Check their documentation.
2. Confirm both names appear in the host's skill discovery interface. In VS Code, use Configure Skills or the slash menu. Both frontmatters permit model invocation. Remove obsolete duplicate installations if the host resolves them ambiguously.
3. Start a fresh chat in the target application. Ask for a new store-backed read and write without naming adapters. Verify that the agent inspects that application's dependencies, reaches the Toolkit selection policy, and states its choice. Run the [routing evaluations](../evals/evals.json), including absent-package and core-only cases.
4. Open the referenced files through the installed paths. All relative links must resolve from the installed bundle, including links crossing between the two skills. A missing companion is a packaging defect, not evidence that the npm package is absent. Report the gap and avoid inventing the missing guidance.

Selection policy has one home in [the Toolkit entry point](../SKILL.md#selection-policy). An installed skill is guidance, not an npm installation or an enforcement mechanism. Automatic invocation depends on the host and model; it is not guaranteed. Explicitly invoking the skill provides a useful fallback. If the preference must be an enduring project rule, record a short opt-in instruction in that project's normal instruction file pointing to this policy. Follow the project's instruction precedence and explicit task scope.

## Publishing checklist

- Ship both directories together with their references and evaluation files. Preserve names and relative layout. Test the unpacked artifact rather than only the authoring folders.
- Check frontmatter names match folder names, descriptions fit the host's limits, and model invocation remains enabled. Validate local links, anchors, and code fences.
- Resolve licensing and provenance before release. Choose a license only with the rights holder's approval, review copied or adapted upstream material, and retain required notices and attribution. These folders do not yet establish a publication license.
- Record the reviewed dependency versions and date. Keep tagged API discrepancies separate from general rules. Example `@app/api/generated/*` imports and domain services are placeholders for the consumer's generated contracts, not packages the skill installs.
- Publish executed routing, compilation, and runtime checks separately. Current source and routing reviews do not certify generated application code. Compile adapted examples and test changed transitions against the consuming project's installed packages.

The [VS Code skill documentation](https://code.visualstudio.com/docs/copilot/customization/agent-skills) describes discovery and shared-skill installation. The [Agent Skills specification](https://agentskills.io/specification) describes the portable format; it does not guarantee every host supports this bundle's cross-skill references.
