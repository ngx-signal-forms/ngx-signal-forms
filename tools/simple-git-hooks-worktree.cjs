#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { PREPEND_SCRIPT, skipInstall } = require('simple-git-hooks');

const VALID_GIT_HOOKS = [
  'applypatch-msg',
  'pre-applypatch',
  'post-applypatch',
  'pre-commit',
  'pre-merge-commit',
  'prepare-commit-msg',
  'commit-msg',
  'post-commit',
  'pre-rebase',
  'post-checkout',
  'post-merge',
  'pre-push',
  'pre-receive',
  'update',
  'proc-receive',
  'post-receive',
  'post-update',
  'reference-transaction',
  'push-to-checkout',
  'pre-auto-gc',
  'post-rewrite',
  'sendemail-validate',
  'fsmonitor-watchman',
  'p4-changelist',
  'p4-prepare-changelist',
  'p4-post-changelist',
  'p4-pre-submit',
  'post-index-change',
];

const VALID_OPTIONS = new Set(['preserveUnused']);
const projectRoot = process.cwd();

function getPackageJson(projectDirectory) {
  const packageJsonPath = path.join(projectDirectory, 'package.json');
  const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf8');

  return JSON.parse(packageJsonContent);
}

function getConfig(projectDirectory) {
  const packageJson = getPackageJson(projectDirectory);
  const config = packageJson['simple-git-hooks'];

  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error(
      '[ERROR] Config was not found! Please add a `simple-git-hooks` entry in package.json.',
    );
  }

  for (const key of Object.keys(config)) {
    if (!VALID_GIT_HOOKS.includes(key) && !VALID_OPTIONS.has(key)) {
      throw new Error(
        '[ERROR] Config was not in correct format. Please check git hooks or options name.',
      );
    }
  }

  return config;
}

function resolveHooksDirectory(projectDirectory) {
  const hooksPath = execFileSync('git', ['rev-parse', '--git-path', 'hooks'], {
    cwd: projectDirectory,
    encoding: 'utf8',
  }).trim();

  return path.isAbsolute(hooksPath)
    ? hooksPath
    : path.resolve(projectDirectory, hooksPath);
}

function getPreservedHooks(config) {
  if (Array.isArray(config.preserveUnused)) {
    return new Set(config.preserveUnused);
  }

  if (config.preserveUnused) {
    return new Set(VALID_GIT_HOOKS);
  }

  return new Set();
}

function writeHook(hooksDirectory, hook, command) {
  const hookPath = path.join(hooksDirectory, hook);
  fs.writeFileSync(hookPath, PREPEND_SCRIPT + String(command));
  fs.chmodSync(hookPath, 0o755);
  console.info(`[INFO] Successfully set the ${hook} with command: ${command}`);
}

function removeHook(hooksDirectory, hook) {
  const hookPath = path.join(hooksDirectory, hook);

  if (fs.existsSync(hookPath)) {
    fs.unlinkSync(hookPath);
  }
}

function installHooks(projectDirectory) {
  if (skipInstall()) {
    return;
  }

  const config = getConfig(projectDirectory);
  const hooksDirectory = resolveHooksDirectory(projectDirectory);
  const preservedHooks = getPreservedHooks(config);

  fs.mkdirSync(hooksDirectory, { recursive: true });

  for (const hook of VALID_GIT_HOOKS) {
    if (Object.prototype.hasOwnProperty.call(config, hook)) {
      writeHook(hooksDirectory, hook, config[hook]);
      continue;
    }

    if (!preservedHooks.has(hook)) {
      removeHook(hooksDirectory, hook);
    }
  }
}

try {
  installHooks(projectRoot);
} catch (error) {
  console.error(
    `[ERROR], Was not able to set git hooks. Error: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
  );
  process.exitCode = 1;
}
