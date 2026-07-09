# Commit Instructions

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification — nx release derives versions and changelogs from it (see `release.conventionalCommits` in `nx.json`).

- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `build`, `ci`, `perf`, `revert`
- Scope: project name from `project.json` (e.g., `toolkit`, `demo`) or a short domain path (e.g., `form-field`)
- Summary: imperative mood, max 80 chars, one line
- Body: explain "why" and "how", one commit per functionality (not per file)
- Footer: `Closes #123`, `BREAKING CHANGE: <impact>`
