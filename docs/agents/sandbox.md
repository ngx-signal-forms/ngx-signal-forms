# Agent sandbox

Facts an agent needs to run tasks in this repo from a sandboxed shell
(Claude Code on the maintainer's machine). Each one cost earlier sessions
retries.

## Environment

Prefix Nx and npm commands with:

```sh
NX_NO_CLOUD=true NX_DAEMON=false NX_SOCKET_DIR=/tmp/.nx/<task-name> npm_config_cache=$TMPDIR/npmcache
```

- `NX_NO_CLOUD`: the Nx Cloud org is disabled and the sandbox blocks it.
  Without it, Nx prints an error and `nx affected` can do nothing.
- `NX_DAEMON`: the daemon's file watcher does not work in a sandboxed
  worktree.
- `NX_SOCKET_DIR`: only `/tmp/.nx/*` may hold a Unix socket. Any other path
  fails with "denied permission to use its unix socket" or "exceeds the
  maximum socket length".
- `npm_config_cache`: the sandbox cannot write `~/.npm`.
  `check-published-package` sets its own, other npm commands do not.

Keep the Nx cache. If a result looks stale, run `pnpm nx reset` once.

## Run outside the sandbox

Ask for escalation per command. These always fail inside:

| Task                          | Command                                                                   |
| ----------------------------- | ------------------------------------------------------------------------- |
| New worktree with install     | `tools/scripts/new-worktree.sh <branch> [base]`                           |
| Remove a worktree             | `git worktree remove <path>`, then `git branch -D <branch>`               |
| Install or add a dependency   | `pnpm install --frozen-lockfile`, `pnpm add -w <pkg>` (`-w` for the root) |
| Browser specs, e2e and a11y   | `browser-tests <project> <test-browser\|e2e\|e2e-ci\|a11y> [-- <spec>]`   |
| Push when the SSH agent hangs | see [Push](#push)                                                         |

`new-worktree.sh` puts the worktree in the sibling
`ngx-signal-forms.worktrees/<branch>` folder, which the sandbox can write.
A commit in a worktree with no `node_modules` fails with
`Command "lint-staged" not found`.

`browser-tests` is the maintainer's wrapper for Chromium, which cannot start
in the sandbox. Never write a brief that forbids it.

## Push

Push with an explicit refspec: `git push origin HEAD:refs/heads/<branch>`.
SSH needs the 1Password agent. When it is locked, the push hangs. Push over
HTTPS with the `gh` login instead:

```sh
env -u GITHUB_TOKEN -u GH_TOKEN git -c credential.helper= \
  -c credential.helper='!gh auth git-credential' \
  push https://github.com/ngx-signal-forms/ngx-signal-forms.git HEAD:refs/heads/<branch>
```

Commit signing also uses 1Password. If a commit fails with
`1Password: agent returned an error`, stop and ask the maintainer to unlock
it. Do not commit unsigned.

## `gh`

Issue and pull request commands are in [issue tracker](./issue-tracker.md).

- `gh run view --log-failed` needs a writable cache:
  `XDG_CACHE_HOME=$TMPDIR/ghcache`. Job logs download from
  `*.blob.core.windows.net`, so allow that host.
- Pass a full commit SHA to `gh pr merge --match-head-commit`.

## Tests

How to run one spec per project, and the known flakes:
[`docs/TESTING.md#run-one-spec`](../TESTING.md#run-one-spec).
