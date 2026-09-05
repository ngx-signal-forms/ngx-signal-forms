import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function publishedReadme(markdown, ref) {
  const base = `https://github.com/ngx-signal-forms/ngx-signal-forms/blob/${encodeURIComponent(ref)}/`;
  const rewrite = (target) => {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(target)) return target;
    return base + target.replace(/^\.\//, '').replace(/^\//, '');
  };
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
          (_, start, target, end) => start + rewrite(target) + end,
        )
        .replace(
          /^(\s*\[[^\]]+\]:\s*)(\S+)(.*)$/,
          (_, start, target, end) => start + rewrite(target) + end,
        );
    })
    .join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  const root = fileURLToPath(new URL('../../../', import.meta.url));
  const ref = execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  }).trim();
  const destination = resolve(root, 'dist/packages/toolkit/README.md');
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(
    destination,
    publishedReadme(readFileSync(resolve(root, 'README.md'), 'utf8'), ref),
  );
}
