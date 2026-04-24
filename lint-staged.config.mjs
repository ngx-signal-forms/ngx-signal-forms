import { relative } from 'node:path';

const toRepoRelativePath = (filePath) => relative(process.cwd(), filePath);

const toPosixPath = (filePath) => filePath.replaceAll('\\', '/');

const toCommandArguments = (filePaths) =>
  filePaths.map((filePath) => JSON.stringify(filePath)).join(' ');

const isOxlintIgnoredGeneratedFile = (filePath) =>
  toPosixPath(filePath) === 'apps/demo/public/mockServiceWorker.js';

const createOxcCommands = (files) => {
  const repoRelativeFiles = files.map(toRepoRelativePath);
  const lintableFiles = repoRelativeFiles.filter(
    (filePath) => !isOxlintIgnoredGeneratedFile(filePath),
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
