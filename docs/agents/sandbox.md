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
Keep the Nx Daemon enabled instead of setting `NX_DAEMON=false`.

Avoid setting `NX_SOCKET_DIR`: it replaces Nx's default socket roots. If an
environment requires an override, use a private directory only your user can
reach, and allowlist that directory.

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

Nx MCP tools provide Nx documentation, graph visualization, CI information,
and output from Nx tasks already running in the CLI. Use the local `pnpm nx`
CLI to inspect this workspace's projects and targets and to start tasks. The
MCP server does not change the local daemon socket or sandbox permissions.

See Nx's [sandbox Unix socket guide](https://nx.dev/docs/kb/nx-sandbox-unix-sockets)
for platform-specific setup and socket-path details.
