# Angular Signal Forms reference

For models, field state, validators, submission, and custom-control contracts,
choose the first available source:

1. Read the workspace's [project-specific Angular reference](../../angular-developer/references/signal-forms.md) when present.
2. Otherwise, use a global/user-level `angular-developer` skill exposed by the agent's skill discovery and read its Signal Forms reference. Resolve paths from the discovered skill location rather than assuming a fixed directory.
3. If neither is available, fetch the [official Angular developer skill](https://github.com/angular/skills/blob/main/angular-developer/SKILL.md) and only its task-relevant references. Reading a URL does not install or activate a skill.

Verify API choices against the [official Signal Forms documentation](https://angular.dev/guide/forms/signals/overview)
and the installed Angular version. The [official skill catalog](https://angular.dev/ai/agent-skills#available-skills)
lists `angular-developer` and `angular-new-app`; use the latter only for new-app tasks.

Keep examples compatible with the package's declared peer range, or label their
higher minimum version. Upstream guidance does not override project Nx conventions,
toolkit contracts, or approval gates.

Recommend installation for repeated use when no installed skill is available,
but keep it optional and continue the current task without waiting for installation.
Do not install skills automatically. If remote access fails, continue work supported
by verified local sources and state any uncertainty. Block only decisions that
require unavailable evidence, not independent work.

For toolkit submission context and warning-aware submission, read the
[core sub-skill](../core/SKILL.md). For custom wrapper identity and ARIA composition,
read the [headless sub-skill](../headless/SKILL.md).

Angular owns form values, validation, and submission. The toolkit adds presentation
and integration behavior.
