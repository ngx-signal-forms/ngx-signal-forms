import assert from 'node:assert/strict';
import { cp, mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_GITHUB_MAIN_RE =
  /^https:\/\/github\.com\/ngx-signal-forms\/ngx-signal-forms\/(blob|tree)\/main\/([^#]+?)(?:#(.+))?$/u;

function prose(markdown) {
  return markdown.replaceAll(
    /^\s*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\s*\1\s*$/gmu,
    '',
  );
}

function stripTags(text) {
  // Repeat until stable so nested/malformed markup (e.g. "<<script>>") can't survive a single pass.
  let stripped = text;
  let previous;
  do {
    previous = stripped;
    stripped = previous.replaceAll(/<[^>]*>/gu, '');
  } while (stripped !== previous);
  return stripped;
}

function anchors(markdown) {
  const ids = new Set();
  const counts = new Map();
  for (const [, heading] of markdown.matchAll(/^#{1,6}\s+(.+)$/gmu)) {
    const slug = stripTags(heading.replaceAll(/\[([^\]]+)\]\([^)]*\)/gu, '$1'))
      .toLowerCase()
      .replaceAll(/[^\p{L}\p{N}\s_-]/gu, '')
      .replaceAll(/\s/gu, '-');
    const count = counts.get(slug) ?? 0;
    ids.add(count ? `${slug}-${count}` : slug);
    counts.set(slug, count + 1);
  }
  for (const [, id] of markdown.matchAll(/\bid=["']([^"']+)["']/gu))
    ids.add(id);
  return ids;
}

export async function checkSkillPackage(directory) {
  const root = resolve(directory);
  const errors = [];
  const files = new Map();
  async function visit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isSymbolicLink())
        errors.push(`Symlink: ${relative(root, path)}`);
      else if (entry.isDirectory()) await visit(path);
      else
        files.set(
          path,
          entry.name.endsWith('.md') ? await readFile(path, 'utf8') : null,
        );
    }
  }
  await visit(root);
  const main = join(root, 'SKILL.md');
  const content = files.get(main) ?? '';
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/u);
  if (
    !frontmatter ||
    !/^name: ngx-signal-forms\s*$/mu.test(frontmatter[1]) ||
    !/^description: \S.+$/mu.test(frontmatter[1])
  ) {
    errors.push('Root SKILL.md needs the package name and a description');
  }
  const graph = new Map();
  for (const [file, text] of files) {
    const label = relative(root, file);
    if (file !== main && file.endsWith(`${sep}SKILL.md`))
      errors.push(`Nested skill: ${label}`);
    if (text === null) continue;
    if (/\/(?:Users|home)\/[^\s/]+\//u.test(text))
      errors.push(`Machine path: ${label}`);
    const body = prose(text);
    const links = [
      ...[...body.matchAll(/\]\(([^\s)]+)(?:\s+"[^"]*")?\)/gu)].map(
        (match) => match[1],
      ),
      ...[...body.matchAll(/^\s*\[[^\]]+\]:\s*(\S+)/gmu)].map(
        (match) => match[1],
      ),
    ];
    const edges = [];
    graph.set(file, edges);
    for (const link of links) {
      if (/^(?:https?:|mailto:)/iu.test(link)) continue;
      const [path, fragment] = link.split('#');
      let decodedPath;
      try {
        decodedPath = path ? decodeURIComponent(path) : '';
      } catch {
        errors.push(`Malformed link: ${label} -> ${link}`);
        continue;
      }
      const target = path ? resolve(dirname(file), decodedPath) : file;
      if (target !== root && !target.startsWith(root + sep)) {
        errors.push(`Escaping link: ${label} -> ${link}`);
        continue;
      }
      if (!files.has(target)) {
        errors.push(`Missing link: ${label} -> ${link}`);
        continue;
      }
      edges.push(target);
      if (fragment) {
        let decodedFragment;
        try {
          decodedFragment = decodeURIComponent(fragment);
        } catch {
          errors.push(`Malformed link: ${label} -> ${link}`);
          continue;
        }
        if (!anchors(prose(files.get(target) ?? '')).has(decodedFragment)) {
          errors.push(`Missing anchor: ${label} -> ${link}`);
        }
      }
    }
  }
  const reached = new Set();
  function walk(file) {
    if (reached.has(file)) return;
    reached.add(file);
    for (const target of graph.get(file) ?? []) walk(target);
  }
  walk(main);
  for (const file of graph.keys()) {
    if (!reached.has(file))
      errors.push(`Unreachable guide: ${relative(root, file)}`);
  }
  return errors;
}

function checkPeerRanges(label, body, peerDependencies, errors) {
  for (const peer of ['vest', 'axe-core']) {
    const expected = peerDependencies[peer];
    if (!expected) continue;
    const pattern = new RegExp(`\`${peer}@([^\`]+)\``, 'gu');
    for (const [, stated] of body.matchAll(pattern)) {
      if (stated !== expected) {
        errors.push(
          `Peer range mismatch: ${label} states ${peer}@${stated}, expected ${peer}@${expected}`,
        );
      }
    }
  }
}

/**
 * Verifies repository-backed claims inside the skill package:
 * 1. Every GitHub `blob/main` or `tree/main` link points to a file or directory
 *    that exists in `repoRoot`, and any `#anchor` exists in that Markdown file.
 * 2. Every explicit `vest@...` or `axe-core@...` peer range matches
 *    `packages/toolkit/package.json`'s `peerDependencies`.
 */
export async function checkRepoSkillLinks(directory, repoRoot) {
  const root = resolve(directory);
  const repo = resolve(repoRoot);
  const errors = [];
  const files = new Map();

  async function visit(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.name.endsWith('.md'))
        files.set(path, await readFile(path, 'utf8'));
    }
  }
  await visit(root);

  const toolkitPkgPath = join(repo, 'packages/toolkit/package.json');
  let peerDependencies = null;
  try {
    const pkg = JSON.parse(await readFile(toolkitPkgPath, 'utf8'));
    peerDependencies = pkg.peerDependencies ?? null;
  } catch {
    // Callers running against a minimal fixture may omit packages/toolkit/package.json.
  }

  const anchorCache = new Map();
  async function getTargetAnchors(targetPath) {
    if (!anchorCache.has(targetPath)) {
      anchorCache.set(
        targetPath,
        anchors(prose(await readFile(targetPath, 'utf8'))),
      );
    }
    return anchorCache.get(targetPath);
  }

  for (const [file, text] of files) {
    const label = relative(root, file);
    const body = prose(text);
    const links = [
      ...[...body.matchAll(/\]\(([^\s)]+)(?:\s+"[^"]*")?\)/gu)].map(
        (match) => match[1],
      ),
      ...[...body.matchAll(/^\s*\[[^\]]+\]:\s*(\S+)/gmu)].map(
        (match) => match[1],
      ),
    ];

    for (const link of links) {
      const match = link.match(REPO_GITHUB_MAIN_RE);
      if (!match) continue;
      const [, kind, rawRepoPath, rawFragment] = match;
      let decodedPath;
      try {
        decodedPath = decodeURIComponent(rawRepoPath);
      } catch {
        errors.push(`Malformed GitHub link: ${label} -> ${link}`);
        continue;
      }
      const target = resolve(repo, decodedPath);
      if (target !== repo && !target.startsWith(repo + sep)) {
        errors.push(`Escaping GitHub link: ${label} -> ${link}`);
        continue;
      }
      let targetStat;
      try {
        targetStat = await stat(target);
      } catch {
        errors.push(`Missing GitHub target: ${label} -> ${decodedPath}`);
        continue;
      }
      if (kind === 'tree' && !targetStat.isDirectory()) {
        errors.push(
          `GitHub tree link is not a directory: ${label} -> ${decodedPath}`,
        );
        continue;
      }
      if (kind === 'blob' && !targetStat.isFile()) {
        errors.push(
          `GitHub blob link is not a file: ${label} -> ${decodedPath}`,
        );
        continue;
      }
      if (kind === 'blob' && rawFragment && target.endsWith('.md')) {
        let decodedFragment;
        try {
          decodedFragment = decodeURIComponent(rawFragment);
        } catch {
          errors.push(`Malformed GitHub anchor: ${label} -> ${link}`);
          continue;
        }
        const targetAnchors = await getTargetAnchors(target);
        if (!targetAnchors.has(decodedFragment)) {
          errors.push(
            `Missing GitHub anchor: ${label} -> ${decodedPath}#${decodedFragment}`,
          );
        }
      }
    }

    if (peerDependencies) {
      checkPeerRanges(label, body, peerDependencies, errors);
    }
  }

  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const source = resolve(
    process.argv[2] ?? join(root, '.agents/skills/ngx-signal-forms'),
  );
  const scratch = await mkdtemp(join(tmpdir(), 'ngx-skill-check-'));
  try {
    const isolated = join(scratch, 'ngx-signal-forms');
    await cp(source, isolated, { recursive: true, dereference: false });
    const errors = [
      ...(await checkSkillPackage(isolated)),
      ...(await checkRepoSkillLinks(source, root)),
    ];
    assert.deepEqual(errors, [], errors.join('\n'));
    console.log(
      'Standalone skill: one entry, reachable guides, local links, GitHub targets, and peer ranges passed.',
    );
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}
