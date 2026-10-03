# Issue tracker: GitHub

Issues and PRDs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --json title,body,labels,comments`. The `--comments` form can print nothing in an agent shell.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`
- **Rejected requests**: this repo has no `.out-of-scope/` folder. A rejected enhancement is a closed issue with the `wontfix` label, and its closing comment holds the reasoning. To check for an earlier rejection, run `gh issue list --state closed --label wontfix --search "<concept>"`.

Infer the repo from `git remote -v` — `gh` does this automatically when run inside a clone.

## When a skill says "publish to the issue tracker"

Create a GitHub issue. A security finding is the exception. See the next section.

## Security findings

A security finding in the toolkit, or in the workflows that build and publish it, never goes in a public issue, pull request, commit message or code comment. `SECURITY.md` sets this rule.

- Report it in a private draft advisory: `gh api -X POST repos/{owner}/{repo}/security-advisories` with `summary`, `description` and `severity`.
- Keep the public text of the fix neutral. Say what the change does. Do not describe the attack, name the weak file and line, list gaps that are still open, or give secret names or expiry dates.
- Put the detail and any manual steps in the advisory.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --json title,body,labels,comments`.

## Before you start an issue

- Check that no other session started it:
  `gh pr list --state all --search "<number>"` and
  `git branch -a --list '*<number>*'`.
- Check each file, symbol and command that the issue or brief names with
  `git grep`. A brief written from memory often has a wrong name.
- Create the worktree with `tools/scripts/new-worktree.sh`. See
  [sandbox](./sandbox.md).

## Pull requests

- The maintainer often turns on auto-merge. A pushed branch can merge, or get
  `main` merged in, while you work. Fetch the remote head before each push.
- To wait for a bot review after a push, turn auto-merge off first:
  `gh pr merge <number> --disable-auto`.
- Copilot reviews a pull request once, when it opens. It does not review
  again on push, and `gh pr edit --add-reviewer` does not reach it. Ask the
  maintainer to request a re-review when a fix round needs one.
- CodeRabbit limits reviews per hour. Many pushes in a short time give
  rate-limit notices instead of reviews.
