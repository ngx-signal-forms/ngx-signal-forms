import { relative } from 'node:path';

const toRepoRelativePath = (filePath) => relative(process.cwd(), filePath);

const toPosixPath = (filePath) => filePath.replaceAll('\\', '/');

const toCommandArguments = (filePaths) =>
  filePaths.map((filePath) => JSON.stringify(filePath)).join(' ');

const oxlintIgnoredPathPrefixes = [
  '.agents/',
  '.github/skills/',
  '.opencode/',
  // Committed baseline snapshots of built `.d.ts` output (#514) — generated
  // files, oxlint ignores them (see `oxlint.config.ts`), and passing them
  // through anyway makes oxlint exit 1 with "No files found to lint".
  'packages/toolkit/api-reports/',
];

const oxlintIgnoredFilePaths = new Set([
  'apps/demo/public/mockServiceWorker.js',
]);

const isOxlintIgnoredFile = (filePath) => {
  const posixPath = toPosixPath(filePath);

  return (
    oxlintIgnoredFilePaths.has(posixPath) ||
    oxlintIgnoredPathPrefixes.some((prefix) => posixPath.startsWith(prefix))
  );
};

const createOxcCommands = (files) => {
  const repoRelativeFiles = files.map(toRepoRelativePath);
  const lintableFiles = repoRelativeFiles.filter(
    (filePath) => !isOxlintIgnoredFile(filePath),
  );

  if (lintableFiles.length === 0) {
    return [];
  }

  const commandArguments = toCommandArguments(lintableFiles);

  return [
    `oxlint --fix --quiet ${commandArguments}`,
    `oxfmt --write ${commandArguments}`,
  ];
};

const createOxfmtCommand = (files) => {
  const repoRelativeFiles = files.map(toRepoRelativePath);

  return `oxfmt --write ${toCommandArguments(repoRelativeFiles)}`;
};

export default {
  '*.{ts,tsx,js,jsx,mjs,cjs}': createOxcCommands,
  '*.{json,html,css,scss,md,yml,yaml}': createOxfmtCommand,
};
