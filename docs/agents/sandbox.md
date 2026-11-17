# Agent sandbox

Facts an agent needs to run tasks in this repo from a sandboxed shell
(Claude Code on the maintainer's machine). Each one cost earlier sessions
retries.

## Environment

Keep the Nx Daemon enabled. Sandboxes block Unix sockets by default, but Nx
uses them for the daemon, plugin workers, and forked tasks. Allow the sandbox
to read and write under `/tmp/.nx` and `~/.nx`, and allow Unix sockets under
both roots. Nx uses `/tmp/.nx/<uid>/sockets` first and falls back to
`~/.nx/sockets`.

For Claude Code, add those roots to the sandbox settings in
`.claude/settings.json`:

```json
{
  "sandbox": {
    "filesystem": {
      "allowRead": ["/tmp/.nx", "~/.nx"],
      "allowWrite": ["/tmp/.nx", "~/.nx"]
    },
    "network": {
      "allowUnixSockets": ["/tmp/.nx", "~/.nx"]
    }
  }
}
```

For other agents, follow Nx's platform-specific sandbox guidance. Prefer a
scoped socket allowlist; some sandboxes cannot scope socket access by path.

Avoid setting `NX_SOCKET_DIR`: it replaces Nx's default socket roots. If an
environment requires an override, use a private directory only your user can
reach, and allowlist that directory.

Start the Nx Daemon outside the sandbox. A daemon that starts inside the
sandbox gets no file-change events, so Nx keeps old file hashes and can
restore a stale cached result after you edit a file. The sandbox also blocks
the signal that stops it, so `pnpm nx daemon --stop` has no effect from inside.

The sign of a sandbox-started daemon is a project graph that fails for each
`playwright.config.ts` with `Failed to load native binding`. Run these two
commands outside the sandbox, then continue inside it:

```sh
pnpm nx daemon --stop
pnpm nx daemon --start
```

The daemon stops when it is idle for some hours. For one command without a
daemon, prefix it with `NX_DAEMON=false`. Keep `SWC_NATIVE_BINDING_CACHE` and
`SWC_NODE_CACHE_DIR` unset: they hide the error and leave the stale hashes.

For a sandbox where Nx Cloud access is unavailable, prefix the task with
`NX_NO_CLOUD=true`:

```sh
NX_NO_CLOUD=true pnpm nx <target>
```

Omit `NX_NO_CLOUD` where Cloud access is configured. If npm cannot write to
`~/.npm`, set
`npm_config_cache=$TMPDIR/npmcache` for that command. The
`check-published-package` check sets its own cache path.

Keep the Nx cache. If a result looks stale, run `pnpm nx reset` once.

`.claude/settings.json` turns off Angular CLI analytics
(`NG_CLI_ANALYTICS=false`), so the sandbox needs no analytics host.

## Run outside the sandbox

Ask for escalation per command. These always fail inside:

| Task                        | Command                                                                   |
| --------------------------- | ------------------------------------------------------------------------- |
| New worktree with install   | `tools/scripts/new-worktree.sh <branch> [base]`                           |
| Remove a worktree           | `git worktree remove <path>`, then `git branch -D <branch>`               |
| Install or add a dependency | `pnpm install --frozen-lockfile`, `pnpm add -w <pkg>` (`-w` for the root) |
| Start or stop the Nx Daemon | `pnpm nx daemon --start`, `pnpm nx daemon --stop`                         |
| Browser specs, e2e and a11y | `browser-tests <project> <test-browser\|e2e\|e2e-ci\|a11y> [-- <spec>]`   |

`new-worktree.sh` puts the worktree in the sibling
`ngx-signal-forms.worktrees/<branch>` folder, which the sandbox can write.
Set `WORKTREE_ROOT` (and `WORKTREE_TOOL`, such as `claude` or `codex`) to use
`$WORKTREE_ROOT/ngx-signal-forms/<tool>-<branch>` instead.
A commit in a worktree with no `node_modules` fails with
`Command "lint-staged" not found`.

The workspace sets `virtualStoreType: global`, so every worktree's
`node_modules` is a set of symlinks into the shared pnpm store
(`pnpm store path`, under `links/`). A second worktree installs in seconds and
adds little disk. CI turns the setting off. After pulling a change to it, delete
`node_modules` and reinstall in each checkout.

`browser-tests` is the maintainer's wrapper for Chromium, which cannot start
in the sandbox. Never write a brief that forbids it.

## Push

Push a feature branch with `git push -u origin <branch>`. Run it as a single
command, from the worktree of the branch. The maintainer's settings run it
outside the sandbox, where the SSH key is available; inside the sandbox it
fails on `~/.ssh`. Use `git push --dry-run origin <branch>` to test.

A guard in the maintainer's Claude Code settings refuses every other form. It
refuses a long-lived branch (such as `main`, `release/*`, `beta` or `rc`), a
tag, a delete, a refspec, another remote and `--force`. It allows
`--force-with-lease`. GitHub rulesets also refuse a direct push, a force push
and a delete on `main`, so `main` changes only through a pull request. Do not
use the old `agent-push` wrapper.

The push goes over SSH, which needs the 1Password agent. When it is locked,
the push hangs: stop and ask the maintainer to unlock it.

Commit signing also uses 1Password. If a commit fails with
`1Password: agent returned an error`, stop and ask the maintainer to unlock
it. Do not commit unsigned.

## `gh`

Issue and pull request commands are in [issue tracker](./issue-tracker.md).

- Run `gh` as a single command. The maintainer's settings run `gh *` outside
  the sandbox, but a chain (`;`, `&&`, a pipe) stays inside, where `gh` cannot
  read its login.
- Run `gh run view <id> --log-failed` as a plain command too. Outside the
  sandbox it needs no cache path and no extra host.
- Pass a full commit SHA to `gh pr merge --match-head-commit`.

## Tests

How to run one spec per project, and the known flakes:
[`docs/TESTING.md#run-one-spec`](../TESTING.md#run-one-spec).

Nx MCP tools provide Nx documentation, graph visualization, CI information,
and output from Nx tasks already running in the CLI. Use the local `pnpm nx`
CLI to inspect this workspace's projects and targets and to start tasks. The
MCP server does not change the local daemon socket or sandbox permissions.

See Nx's [sandbox Unix socket guide](https://nx.dev/docs/kb/nx-sandbox-unix-sockets)
for platform-specific setup and socket-path details.
