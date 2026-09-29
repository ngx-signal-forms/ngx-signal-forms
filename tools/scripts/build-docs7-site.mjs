// Builds the Docs7 site from the repo's markdown. Pages keep GitHub-style
// relative links (`./WARNINGS_SUPPORT.md#timing`), which Docs7 serves as raw
// markdown. This copies every page listed in docs.json into one folder and
// rewrites those links: a link to another page becomes a site route, and a
// link to any other repo file becomes a GitHub URL. The publish workflow
// pushes the folder to the `docs7` branch, which Docs7 deploys.
//
// Anchors keep GitHub's heading slugs. Docs7 builds heading ids its own way
// (it keeps `&`, `/`, `—` and quotes), so a linked heading that contains
// punctuation gets an explicit `<a id>` with the GitHub slug.
//
//   node tools/scripts/build-docs7-site.mjs [--out dist/docs7] [--ref <sha>]
import { execFileSync } from 'node:child_process';
import {
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, posix, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const REPO_URL = 'https://github.com/ngx-signal-forms/ngx-signal-forms';

// `[label](target "title")`. The label may hold one level of brackets, as in
// [`[formField]` guide](./x.md).
const LINK = /(!?\[(?:[^[\]\n]|\[[^\]\n]*\])*\]\()([^\s)]+)([^)]*\))/g;

/** Every page path in a docs.json navigation tree, in order. */
export function collectPages(node, pages = []) {
  if (Array.isArray(node)) {
    for (const item of node) collectPages(item, pages);
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === 'pages') {
        for (const item of value) {
          if (typeof item === 'string') pages.push(item);
          else collectPages(item, pages);
        }
      } else if (typeof value === 'object') {
        collectPages(value, pages);
      }
    }
  }
  return pages;
}

/**
 * The page's path on the site. Docs7 drops dots from a URL segment
 * (`v1.0.0-rc.16` is served at `v100-rc16`), so they become dashes here and
 * the route stays predictable.
 */
export function siteRoute(page) {
  const segments = page.split('/');
  segments.push(segments.pop().replaceAll('.', '-'));
  return segments.join('/');
}

/** docs.json with every page path replaced by its site route. */
export function rewriteNavigation(node) {
  if (Array.isArray(node)) return node.map(rewriteNavigation);
  if (node && typeof node === 'object') {
    return Object.fromEntries(
      Object.entries(node).map(([key, value]) => [
        key,
        key === 'pages'
          ? value.map((item) =>
              typeof item === 'string'
                ? siteRoute(item)
                : rewriteNavigation(item),
            )
          : rewriteNavigation(value),
      ]),
    );
  }
  return node;
}

/** Calls `visit(line, index)` for each line outside fenced code blocks. */
function forEachProseLine(lines, visit) {
  let fence = null;
  lines.forEach((line, index) => {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length)
        fence = null;
      return;
    }
    if (!fence) visit(line, index);
  });
}

/** GitHub's id for a heading: lower case, punctuation dropped, spaces to dashes. */
export function githubSlug(heading) {
  // Code spans keep their text (`<select>` stays); outside them HTML tags go.
  const text = heading
    .replaceAll(LINK, (_, label) => label.slice(1, -2))
    .split(/(`+[^`]*`+)/)
    .map((part, index) =>
      index % 2 === 1
        ? part.replaceAll('`', '')
        : part.replaceAll(/<\/?[a-z][^>]*>/gi, ''),
    )
    .join('')
    .trim();
  return text
    .toLowerCase()
    .replaceAll(/[^\p{L}\p{M}\p{N}\p{Pc}\- ]/gu, '')
    .replaceAll(' ', '-');
}

/**
 * The anchors GitHub gives a page: one per heading (repeats get `-1`, `-2`)
 * plus explicit `id="…"` attributes. `line` is set for headings only.
 */
export function pageAnchors(markdown) {
  const anchors = new Map();
  const used = new Set();
  const repeats = new Map();
  forEachProseLine(markdown.split('\n'), (line, index) => {
    for (const [, id] of line.matchAll(/\sid="([^"]+)"/g)) anchors.set(id, {});
    const heading = line.match(/^#{1,6}\s+(.*?)\s*#*\s*$/);
    if (!heading) return;
    // Same rule as github-slugger: skip suffixes that another heading already took.
    const base = githubSlug(heading[1]);
    let slug = base;
    while (used.has(slug)) {
      const count = (repeats.get(base) ?? 0) + 1;
      repeats.set(base, count);
      slug = `${base}-${count}`;
    }
    used.add(slug);
    // Docs7 matches GitHub for plain words and spaces; anything else needs an explicit id.
    const plain = slug === base && /^[A-Za-z0-9 -]+$/.test(heading[1]);
    anchors.set(slug, { line: index, plain });
  });
  return anchors;
}

/**
 * Rewrites the relative links in one page. `file` is the page's repo path,
 * `routes` maps each page's markdown file to its site route, and `kind`
 * returns `'file'` or `'directory'` for a repo path, or undefined if it is
 * missing. Returns the new markdown, one error per
 * link that leaves the repo or points at a missing file, and every anchor
 * link into a site page as `{ file, hash }`.
 */
export function rewriteLinks(markdown, { file, routes, ref, kind }) {
  const errors = [];
  const anchorLinks = [];
  const rewrite = (target) => {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(target)) return target;
    const hashIndex = target.indexOf('#');
    const path = hashIndex === -1 ? target : target.slice(0, hashIndex);
    const hash = hashIndex === -1 ? '' : target.slice(hashIndex);
    if (path === '') {
      anchorLinks.push({ file, hash: hash.slice(1) });
      return target;
    }
    const resolved = posix
      .normalize(
        path.startsWith('/')
          ? path.slice(1)
          : posix.join(posix.dirname(file), path),
      )
      .replace(/\/$/, '');
    if (resolved === '..' || resolved.startsWith('../')) {
      errors.push(`${file}: link leaves the repo: ${target}`);
      return target;
    }
    if (routes.has(resolved)) {
      if (hash) anchorLinks.push({ file: resolved, hash: hash.slice(1) });
      return `/${routes.get(resolved)}${hash}`;
    }
    const type = kind(resolved);
    if (!type) {
      errors.push(`${file}: link to a missing file: ${target}`);
      return target;
    }
    // GitHub shows folders under /tree/ and files under /blob/.
    const view = type === 'directory' ? 'tree' : 'blob';
    return `${REPO_URL}/${view}/${ref}/${resolved}${hash}`;
  };

  const lines = markdown.split('\n');
  forEachProseLine(lines, (line, index) => {
    lines[index] = line.replaceAll(
      LINK,
      (_, start, target, end) => start + rewrite(target) + end,
    );
  });
  return { markdown: lines.join('\n'), errors, anchorLinks };
}

/** Puts `<a id="slug"></a>` above each heading in `lines` whose slug is in `ids`. */
function addHeadingIds(markdown, anchors, ids) {
  const lines = markdown.split('\n');
  const inserts = [...ids]
    .map((id) => [id, anchors.get(id)])
    .filter(([, anchor]) => anchor?.line !== undefined && !anchor.plain)
    .toSorted((a, b) => b[1].line - a[1].line);
  for (const [id, { line }] of inserts) {
    lines.splice(line, 0, `<a id="${id}"></a>`, '');
  }
  return lines.join('\n');
}

/** Writes the site into `outDir`. Returns the link errors; writes nothing if there are any. */
export function buildSite({ root, outDir, ref }) {
  const docsJson = JSON.parse(readFileSync(resolve(root, 'docs.json'), 'utf8'));
  const pages = collectPages(docsJson.navigation);
  const routes = new Map(pages.map((page) => [`${page}.md`, siteRoute(page)]));
  const kind = (path) => {
    const stat = statSync(resolve(root, path), { throwIfNoEntry: false });
    if (!stat) return undefined;
    return stat.isDirectory() ? 'directory' : 'file';
  };

  const errors = [];
  const sources = new Map();
  const rewritten = new Map();
  const linkedIds = new Map();
  for (const page of pages) {
    const file = `${page}.md`;
    const source = readFileSync(resolve(root, file), 'utf8');
    const result = rewriteLinks(source, { file, routes, ref, kind });
    sources.set(file, source);
    rewritten.set(file, result.markdown);
    errors.push(...result.errors);
    for (const { file: target, hash } of result.anchorLinks) {
      if (!linkedIds.has(target)) linkedIds.set(target, new Map());
      linkedIds.get(target).set(decodeURIComponent(hash), file);
    }
  }

  const files = new Map();
  for (const page of pages) {
    const file = `${page}.md`;
    // Line numbers come from the source; link rewrites never add or remove lines.
    const anchors = pageAnchors(sources.get(file));
    const ids = linkedIds.get(file) ?? new Map();
    for (const [id, from] of ids) {
      if (!anchors.has(id))
        errors.push(`${from}: link to a missing anchor: ${file}#${id}`);
    }
    files.set(
      `${siteRoute(page)}.md`,
      addHeadingIds(rewritten.get(file), anchors, ids.keys()),
    );
  }
  if (errors.length > 0) return errors;

  files.set(
    'docs.json',
    `${JSON.stringify(rewriteNavigation(docsJson), null, 2)}\n`,
  );
  rmSync(outDir, { recursive: true, force: true });
  for (const [path, content] of files) {
    const destination = resolve(outDir, path);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, content);
  }
  return [];
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  const root = resolve(import.meta.dirname, '../..');
  const { values } = parseArgs({
    options: {
      out: { type: 'string', default: 'dist/docs7' },
      ref: { type: 'string' },
    },
  });
  const ref =
    values.ref ??
    execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: root,
      encoding: 'utf8',
    }).trim();
  const errors = buildSite({ root, outDir: resolve(root, values.out), ref });
  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log(`Docs7 site written to ${values.out}`);
}
