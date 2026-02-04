import DefaultChangelogRenderer, {
  type ChangelogChange,
  type ChangelogRenderOptions,
} from 'nx/release/changelog-renderer';

const releaseTypes = ['feat', 'fix', 'docs'] as const;
const releaseTypeSet = new Set<string>(releaseTypes);
const toolkitScopes = new Set<string>([
  'core',
  'assistive',
  'form-field',
  'debugger',
  'toolkit',
]);
const toolkitScopePriority = [
  'assistive',
  'debugger',
  'form-field',
  'core',
  'toolkit',
] as const;
const descriptionScopeMatchers: Array<{ match: RegExp; scope: string }> = [
  { match: /assistive/i, scope: 'assistive' },
  { match: /debugger/i, scope: 'debugger' },
  { match: /form[ -]?field/i, scope: 'form-field' },
  { match: /core/i, scope: 'core' },
];
const toolkitProjectScopeMap = new Map<string, string>([
  ['@ngx-signal-forms/toolkit/assistive', 'assistive'],
  ['@ngx-signal-forms/toolkit/debugger', 'debugger'],
  ['form-field', 'form-field'],
  ['core', 'core'],
  ['toolkit', 'toolkit'],
]);
const demoScopePrefixes = ['demo/', 'demo-', 'demo:'] as const;
const demoDescriptionMatchers: Array<{ match: RegExp; scopeIndex: number }> = [
  { match: /forms?\/([a-z0-9-]+)(?:\/[a-z0-9-]+)*/i, scopeIndex: 1 },
  { match: /demo\/([a-z0-9-]+)(?:\/[a-z0-9-]+)*/i, scopeIndex: 1 },
];

/**
 * Custom changelog renderer that includes ALL conventional commits,
 * not just those affecting the toolkit package.
 *
 * This ensures demo improvements and other workspace changes are captured
 * in a separate "Demo Application" section.
 */
export class CustomChangelogRenderer extends DefaultChangelogRenderer {
  async render(): Promise<string> {
    const sections: string[][] = [];

    this.preprocessChanges();

    if (this.shouldRenderEmptyEntry()) {
      return this.renderEmptyEntry();
    }

    const includedChanges = this.relevantChanges.filter((change) =>
      releaseTypeSet.has(change.type),
    );
    const toolkitChanges = includedChanges.filter(
      (change) => !this.isDemoScope(change.scope),
    );
    const demoChanges = includedChanges.filter((change) =>
      this.isDemoScope(change.scope),
    );

    this.relevantChanges = includedChanges;
    this.additionalChangesForAuthorsSection = [];

    sections.push([this.renderVersionTitle()]);

    const toolkitSection = this.renderSection('📦 Toolkit', toolkitChanges, {
      scopeResolver: (change) => this.resolveToolkitScope(change),
    });
    if (toolkitSection.length > 0) {
      sections.push(toolkitSection);
    }

    const demoSection = this.renderSection('🧪 Demo Application', demoChanges, {
      stripScope: 'demo',
      scopeResolver: (change) => this.resolveDemoScope(change),
    });
    if (demoSection.length > 0) {
      sections.push(demoSection);
    }

    const breakingChanges = this.renderBreakingChangesFor(
      includedChanges.map((change) =>
        this.normalizeBreakingChangeScope(change),
      ),
    );
    if (breakingChanges.length > 0) {
      sections.push(breakingChanges);
    }

    if (this.hasDependencyBumps()) {
      sections.push(this.renderDependencyBumps());
    }

    if (this.shouldRenderAuthors()) {
      sections.push(await this.renderAuthors());
    }

    return sections
      .filter((section) => section.length > 0)
      .map((section) => section.join('\n').trim())
      .join('\n\n')
      .trim();
  }

  protected renderSection(
    title: string,
    changes: ChangelogChange[],
    options?: {
      stripScope?: string;
      scopeResolver?: (change: ChangelogChange) => string | undefined;
    },
  ): string[] {
    if (changes.length === 0) {
      return [];
    }

    const normalizedChanges = options?.scopeResolver
      ? changes.map((change) => {
          const resolvedScope = options.scopeResolver?.(change);
          if (!resolvedScope || resolvedScope === change.scope) {
            return change;
          }

          return { ...change, scope: resolvedScope };
        })
      : changes;

    const markdownLines: string[] = [`### ${title}`];
    const changeTypes = this.conventionalCommitsConfig.types;

    for (const type of releaseTypes) {
      const group = normalizedChanges.filter((change) => change.type === type);
      if (group.length === 0) {
        continue;
      }

      const heading = changeTypes[type]?.changelog?.title ?? type;
      markdownLines.push('', `#### ${heading}`, '');

      const changesGroupedByScope = this.groupChangesByScope(group);
      const scopesSortedAlphabetically = Object.keys(
        changesGroupedByScope,
      ).sort();
      for (const scope of scopesSortedAlphabetically) {
        const scopedChanges = changesGroupedByScope[scope];
        for (const change of scopedChanges.reverse()) {
          markdownLines.push(
            this.formatChangeForSection(change, options?.stripScope),
          );
        }
      }
    }

    return markdownLines;
  }

  protected formatChangeForSection(
    change: ChangelogChange,
    stripScope?: string,
  ): string {
    if (stripScope && change.scope === stripScope) {
      return this.formatChange({ ...change, scope: undefined });
    }

    return this.formatChange(change);
  }

  protected resolveToolkitScope(change: ChangelogChange): string | undefined {
    if (
      change.scope &&
      change.scope !== 'toolkit' &&
      toolkitScopes.has(change.scope)
    ) {
      return change.scope;
    }

    if (change.affectedProjects === '*') {
      return this.resolveScopeFromDescription(change);
    }

    const affectedProjects = change.affectedProjects ?? [];
    const resolvedScopes = affectedProjects
      .map((project) => toolkitProjectScopeMap.get(project))
      .filter((scope): scope is string => !!scope);

    if (resolvedScopes.length === 0) {
      return this.resolveScopeFromDescription(change);
    }

    for (const scope of toolkitScopePriority) {
      if (resolvedScopes.includes(scope)) {
        return scope;
      }
    }

    return resolvedScopes[0] ?? this.resolveScopeFromDescription(change);
  }

  protected resolveScopeFromDescription(
    change: ChangelogChange,
  ): string | undefined {
    const description = change.description ?? '';
    const match = descriptionScopeMatchers.find((matcher) =>
      matcher.match.test(description),
    );

    return match?.scope;
  }

  protected resolveDemoScope(change: ChangelogChange): string | undefined {
    const scope = change.scope ?? '';
    const strippedScope = this.stripDemoScope(scope);
    if (strippedScope) {
      return strippedScope;
    }

    const description = change.description ?? '';
    for (const matcher of demoDescriptionMatchers) {
      const match = description.match(matcher.match);
      if (match?.[matcher.scopeIndex]) {
        return match[matcher.scopeIndex];
      }
    }

    return scope === 'demo' ? 'demo' : undefined;
  }

  protected renderBreakingChangesFor(changes: ChangelogChange[]): string[] {
    const breakingChanges = changes
      .filter((change) => change.isBreaking)
      .map((change) => this.formatBreakingChange(change));
    const uniqueBreakingChanges = Array.from(new Set(breakingChanges));

    if (uniqueBreakingChanges.length === 0) {
      return [];
    }

    return ['### ⚠️  Breaking Changes', '', ...uniqueBreakingChanges];
  }

  protected normalizeBreakingChangeScope(
    change: ChangelogChange,
  ): ChangelogChange {
    if (this.isDemoScope(change.scope)) {
      const resolvedScope = this.resolveDemoScope(change);
      if (!resolvedScope || resolvedScope === change.scope) {
        return change;
      }

      return { ...change, scope: resolvedScope };
    }

    const resolvedScope = this.resolveToolkitScope(change);
    if (!resolvedScope || resolvedScope === change.scope) {
      return change;
    }

    return { ...change, scope: resolvedScope };
  }

  protected isDemoScope(scope?: string): boolean {
    if (!scope) {
      return false;
    }

    return (
      scope === 'demo' ||
      demoScopePrefixes.some((prefix) => scope.startsWith(prefix))
    );
  }

  protected stripDemoScope(scope: string): string | undefined {
    for (const prefix of demoScopePrefixes) {
      if (scope.startsWith(prefix)) {
        const stripped = scope.slice(prefix.length).trim();
        return stripped.length > 0 ? stripped : undefined;
      }
    }

    return undefined;
  }
  async renderMarkdown(
    changes: any[],
    options: ChangelogRenderOptions,
  ): Promise<string> {
    // Use default renderer for toolkit commits
    const toolkitChangelog = await super.renderMarkdown(changes, options);

    // Get ALL commits since last release (not just toolkit-affecting)
    const { execSync } = await import('child_process');
    const fromRef = options.from || 'HEAD^';
    const toRef = options.to || 'HEAD';

    let allCommits: string[];
    try {
      const commitsOutput = execSync(
        `git log ${fromRef}..${toRef} --pretty=format:"%H:::%s:::%b" --no-merges`,
        { encoding: 'utf-8' },
      );
      allCommits = commitsOutput.trim().split('\n').filter(Boolean);
    } catch {
      // Fallback if git command fails
      return toolkitChangelog;
    }

    // Parse demo commits
    const demoCommits = allCommits
      .map((line) => {
        const [hash, subject, body] = line.split(':::');
        return { hash: hash.substring(0, 7), subject, body };
      })
      .filter((commit) => {
        // Include feat/fix/refactor commits with demo scope
        return /^(feat|fix|refactor|perf)\(demo\):/.test(commit.subject);
      });

    if (demoCommits.length === 0) {
      return toolkitChangelog;
    }

    // Build demo section
    let demoSection = '\n\n### 📦 Demo Application\n\n';
    for (const commit of demoCommits) {
      const cleanSubject = commit.subject.replace(/^[^:]+:\s*/, '');
      const repoUrl = options.repoSlug || 'ngx-signal-forms/ngx-signal-forms';
      demoSection += `- **demo:** ${cleanSubject} ([${commit.hash}](https://github.com/${repoUrl}/commit/${commit.hash}))\n`;
    }

    // Insert demo section before Breaking Changes or Thank You section
    if (toolkitChangelog.includes('### ⚠️  Breaking Changes')) {
      return toolkitChangelog.replace(
        '### ⚠️  Breaking Changes',
        demoSection + '\n### ⚠️  Breaking Changes',
      );
    } else if (toolkitChangelog.includes('### ❤️ Thank You')) {
      return toolkitChangelog.replace(
        '### ❤️ Thank You',
        demoSection + '\n### ❤️ Thank You',
      );
    } else {
      return toolkitChangelog + demoSection;
    }
  }
}
