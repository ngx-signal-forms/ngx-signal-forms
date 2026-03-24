# Copilot Commit Instructions

## Commit Messages

### 1. Adhere to the Conventional Commits Specification

#### a. Structure

- `<type>(<scope>): <description> [optional body] [optional footer]`

#### b. Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, whitespace, etc.)
- **refactor**: Code restructuring (no functional changes)
- **test**: Test-related changes (adding, modifying, or removing tests)
- **chore**: Miscellaneous tasks (build, dependencies, configuration changes)
- **build**: Changes related to the build system or dependencies (e.g., `package.json`, `Dockerfile`, `.vscode/*`)
- **ci**: Changes related to Continuous Integration/Continuous Deployment pipelines
- **perf**: Performance improvements
- **revert**: Revert a previous commit

#### c. Scope

- Context of the change. Use a concise, lowercase name related to the relevant part of the codebase. Preferably based on the project structure.
- **Examples**:
  - `user-authentication`
  - `product-page`
  - `api`
  - `vonnis/raadplegen`
  - `ui/button`
- Use the `project.json` name or a small part of the domain/folder structure for consistency and easy searching.

#### d. Description (Summary)

- Concise and clear, under 80 characters.
- Written in the imperative mood (e.g., "Add login form", "Fix button alignment").
- Completes the sentence: "This commit will..." (e.g., "This commit will add disabled button styling").
- Use a single line for the summary. If you need to provide more details, use the body section.

#### e. Body

- Provide a more detailed explanation of the changes.
- Explain the "why" and "how."
- Use multiple paragraphs if needed.
- Can include code snippets or examples.
- Don't do this per file, but per functionality. For example, if you change the button and the input field, use `ui/button` as scope and describe both changes in the description.

#### f. Footer

- References to issues (e.g., `Closes #123`, `See #456 for more details`).
- Pull request links.
- Breaking changes (use `BREAKING CHANGE:` prefix followed by a clear description of the impact, e.g., `BREAKING CHANGE: API endpoint renamed from /users to /customers`).

---

### 2. Additional Rules

- Summary: max 80 chars, imperative mood, blank line before body
- Body: explain "why" and "how"; separate paragraphs with blank lines
- Footer: link issues (`Closes #123`), breaking changes (`BREAKING CHANGE: ...`)
