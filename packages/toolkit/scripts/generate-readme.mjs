import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const NOT_RELATIVE = /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i;

/** True when a Markdown link target points at a file, not at a URL or an in-page anchor. */
export function isRelativeLink(target) {
  return !NOT_RELATIVE.test(target);
}

/**
 * Calls `map(target)` for every inline link, image and reference definition
 * outside fenced code blocks, and returns the Markdown with each target
 * replaced by the result.
 */
export function mapReadmeLinks(markdown, map) {
  let fence = null;
  return markdown
    .split('\n')
    .map((line) => {
      const marker = line.match(/^\s*(`{3,}|~{3,})/);
      if (marker) {
        if (!fence) fence = marker[1];
        else if (marker[1][0] === fence[0] && marker[1].length >= fence.length)
          fence = null;
        return line;
      }
      if (fence) return line;
      return line
        .replaceAll(
          /(!?\[[^\]\n]*\]\()([^\s)]+)([^)]*\))/g,
          (_, start, target, end) => start + map(target) + end,
        )
        .replace(
          /^(\s*\[[^\]]+\]:\s*)(\S+)(.*)$/,
          (_, start, target, end) => start + map(target) + end,
        );
    })
    .join('\n');
}

/**
 * Rewrites relative links to absolute GitHub URLs pinned to `ref`.
 *
 * `sourceDir` is the repo-relative folder of the README being rewritten
 * (`''` for the root README). `isShipped(repoPath)` says whether a
 * repo-relative path also exists in the package. Links to shipped files keep
 * their relative form because they still resolve after install.
 */
export function publishedReadme(
  markdown,
  ref,
  { sourceDir = '', isShipped = () => false } = {},
) {
  const base = `https://github.com/ngx-signal-forms/ngx-signal-forms/blob/${encodeURIComponent(ref)}/`;
  return mapReadmeLinks(markdown, (target) => {
    if (!isRelativeLink(target)) return target;
    const suffixAt = target.search(/[#?]/);
    const path = suffixAt === -1 ? target : target.slice(0, suffixAt);
    const suffix = suffixAt === -1 ? '' : target.slice(suffixAt);
    const fromRepoRoot = path.startsWith('/');
    const repoPath = posix.normalize(
      fromRepoRoot ? path.slice(1) : posix.join(sourceDir, path),
    );
    if (!fromRepoRoot && isShipped(repoPath)) return target;
    return base + repoPath + suffix;
  });
}

/**
 * Writes the published README of the root entry point, and of every secondary
 * entry point that ng-packagr already copied into `distRoot`.
 */
export function writePublishedReadmes({ root, distRoot, ref }) {
  const toolkitDir = 'packages/toolkit';
  const isShipped = (repoPath) =>
    repoPath.startsWith(`${toolkitDir}/`) &&
    existsSync(resolve(distRoot, repoPath.slice(toolkitDir.length + 1)));
  mkdirSync(distRoot, { recursive: true });
  writeFileSync(
    resolve(distRoot, 'README.md'),
    publishedReadme(readFileSync(resolve(root, 'README.md'), 'utf8'), ref),
  );
  for (const entry of readdirSync(distRoot, { withFileTypes: true })) {
    const source = resolve(root, toolkitDir, entry.name, 'README.md');
    const destination = resolve(distRoot, entry.name, 'README.md');
    if (!entry.isDirectory() || !existsSync(source) || !existsSync(destination))
      continue;
    writeFileSync(
      destination,
      publishedReadme(readFileSync(source, 'utf8'), ref, {
        sourceDir: `${toolkitDir}/${entry.name}`,
        isShipped,
      }),
    );
  }
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const ref = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  }).trim();
  writePublishedReadmes({
    root,
    distRoot: resolve(root, 'dist/packages/toolkit'),
    ref,
  });
}
