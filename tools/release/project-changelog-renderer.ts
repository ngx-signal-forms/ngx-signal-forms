import { existsSync } from 'node:fs';
import _DefaultChangelogRendererImport, {
  type ChangelogChange,
} from 'nx/release/changelog-renderer/index.js';

type DefaultChangelogRendererClass = typeof _DefaultChangelogRendererImport;

/// CJS/ESM interop: when this file is loaded as ESM, importing a CJS module
/// yields the full module.exports as the default — unwrap .default if present.
const DefaultChangelogRenderer = (
  _DefaultChangelogRendererImport as unknown as {
    readonly default: DefaultChangelogRendererClass;
  }
).default;

type Area = 'toolkit' | 'demo' | 'shared' | 'other';

type AreaGroups = Record<Area, ChangelogChange[]>;

type ChangeTypeConfig = {
  changelog?: {
    title?: string;
  };
};

type ChangeTypeConfigs = Record<string, ChangeTypeConfig>;

const TOOLKIT_SCOPE_ALIASES = new Set([
  'assistive',
  'core',
  'debugger',
  'form-field',
  'headless',
  'toolkit',
  'toolkit-core',
  'vest',
]);

const AREA_ORDER: Area[] = ['toolkit', 'demo', 'shared', 'other'];
const PRIMARY_TYPE_ORDER = ['feat', 'fix', 'refactor', 'docs'];
const MAX_SUMMARY_ITEMS_PER_AREA = 2;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export default class ProjectChangelogRenderer extends DefaultChangelogRenderer {
  override async render(): Promise<string> {
    if (this.project === null) {
      return super.render();
    }

    this.assertMigrationGuideExists();

    const sections: Array<readonly string[]> = [];

    this.preprocessChanges();

    if (this.shouldRenderEmptyEntry()) {
      return this.renderEmptyEntry();
    }

    sections.push([this.renderVersionTitle()]);

    const highlights = this.renderHighlights();
    if (highlights.length > 0) {
      sections.push(highlights);
    }

    const migrationNotes = this.renderMigrationNotes();
    if (migrationNotes.length > 0) {
      sections.push(migrationNotes);
    }

    const changesByArea = this.renderChangesByAreaThenType();
    if (changesByArea.length > 0) {
      sections.push(changesByArea);
    }

    if (this.hasBreakingChanges()) {
      sections.push(this.renderBreakingChanges());
    }

    if (this.hasDependencyBumps()) {
      sections.push(this.renderDependencyBumps());
    }

    if (this.shouldRenderAuthors()) {
      sections.push(await this.renderAuthors());
    }

    return sections
      .filter((section): section is readonly string[] => section.length > 0)
      .map((section) => section.join('\n').trim())
      .join('\n\n')
      .trim();
  }

  private renderHighlights(): string[] {
    const markdownLines: string[] = [];
    const areaGroups = this.groupChangesByArea(this.relevantChanges);
    const orderedTypes = this.getOrderedChangeTypes(
      this.getChangeTypeConfigs(),
    );

    for (const area of AREA_ORDER) {
      const changesForArea = areaGroups[area];
      if (changesForArea.length === 0) {
        continue;
      }

      markdownLines.push(
        `- ${this.renderAreaSummaryLabel(area)}: ${this.summarizeAreaChanges(changesForArea, orderedTypes)}`,
      );
    }

    if (markdownLines.length === 0) {
      return [];
    }

    return ['', '### Highlights', '', ...markdownLines];
  }

  private renderMigrationNotes(): string[] {
    const count = new Set(this.breakingChanges).size;
    const suffix = count === 1 ? '' : 's';
    const guideUrl =
      `https://github.com/ngx-signal-forms/ngx-signal-forms/blob/main/` +
      `docs/migrations/v${this.changelogEntryVersion}.md`;
    const summary =
      count === 0
        ? 'Review consumer-visible changes and upgrade steps in the'
        : `This release includes ${count} breaking change${suffix}.`;

    return [
      '',
      '### Migration notes',
      '',
      `- ${summary} [versioned migration guide](${guideUrl}).`,
    ];
  }

  private assertMigrationGuideExists(): void {
    const guidePath = `docs/migrations/v${this.changelogEntryVersion}.md`;
    // oxlint-disable-next-line strict-boolean-expressions, no-unsafe-call -- Oxc cannot resolve Node's existsSync type through this ESM renderer.
    if (!existsSync(guidePath)) {
      throw new Error(
        `Missing required migration guide: ${guidePath}. Add it before releasing.`,
      );
    }
  }

  private renderChangesByAreaThenType(): string[] {
    const markdownLines: string[] = [];
    const changeTypes = this.getChangeTypeConfigs();
    const areaGroups = this.groupChangesByArea(this.relevantChanges);
    const orderedTypes = this.getOrderedChangeTypes(changeTypes);

    for (const area of AREA_ORDER) {
      const changesForArea = areaGroups[area];
      if (changesForArea.length === 0) {
        continue;
      }

      markdownLines.push('', `### ${this.renderAreaTitle(area)}`, '');

      const changesByType = this.groupAreaChangesByType(changesForArea);
      for (const type of orderedTypes) {
        const changesForType = changesByType[type] ?? [];
        if (changesForType.length === 0) {
          continue;
        }

        const title = changeTypes[type]?.changelog?.title ?? type;
        markdownLines.push(`#### ${title}`, '');

        for (const change of changesForType) {
          markdownLines.push(this.formatChange(change));

          if (change.isBreaking === true && !this.isVersionPlans) {
            this.breakingChanges.push(this.formatBreakingChange(change));
          }
        }

        markdownLines.push('');
      }

      while (markdownLines.at(-1) === '') {
        markdownLines.pop();
      }
    }

    return markdownLines;
  }

  private getChangeTypeConfigs(): ChangeTypeConfigs {
    // oxlint-disable-next-line no-unsafe-assignment -- Nx's CJS renderer type is unresolved through the ESM interop bridge above.
    const configuredTypes = this.conventionalCommitsConfig.types;
    if (!isRecord(configuredTypes)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(configuredTypes).map(([type, configuredType]) => {
        if (!isRecord(configuredType) || !isRecord(configuredType.changelog)) {
          return [type, {}];
        }

        const title = configuredType.changelog.title;
        return [
          type,
          typeof title === 'string' ? { changelog: { title } } : {},
        ];
      }),
    );
  }

  private getOrderedChangeTypes(
    changeTypes: Readonly<ChangeTypeConfigs>,
  ): string[] {
    const configuredTypes = Object.keys(changeTypes);

    return [
      ...PRIMARY_TYPE_ORDER.filter((type) => configuredTypes.includes(type)),
      ...configuredTypes.filter((type) => !PRIMARY_TYPE_ORDER.includes(type)),
    ];
  }

  private summarizeAreaChanges(
    changes: readonly ChangelogChange[],
    orderedTypes: readonly string[],
  ): string {
    const changesByType = this.groupAreaChangesByType(changes);
    const orderedChanges: ChangelogChange[] = [];

    for (const type of orderedTypes) {
      const changesForType = changesByType[type] ?? [];
      if (changesForType.length === 0) {
        continue;
      }

      orderedChanges.push(...changesForType);
    }

    const summaryItems = orderedChanges
      .slice(0, MAX_SUMMARY_ITEMS_PER_AREA)
      .map((change) => this.toSingleLine(change.description));
    const remainingCount = orderedChanges.length - summaryItems.length;

    if (remainingCount > 0) {
      summaryItems.push(`and ${remainingCount} more`);
    }

    return summaryItems.join('; ');
  }

  private toSingleLine(text: string): string {
    return text.split('\n')[0]?.trim() ?? '';
  }

  private groupAreaChangesByType(
    changes: readonly ChangelogChange[],
  ): Record<string, ChangelogChange[]> {
    const typeGroups: Record<string, ChangelogChange[]> = {};

    for (const change of changes) {
      const existingGroup = typeGroups[change.type] ?? [];
      existingGroup.push(change);
      typeGroups[change.type] = existingGroup;
    }

    return typeGroups;
  }

  private groupChangesByArea(changes: readonly ChangelogChange[]): AreaGroups {
    const areaGroups: AreaGroups = {
      toolkit: [],
      demo: [],
      shared: [],
      other: [],
    };

    for (const change of changes) {
      areaGroups[this.resolveArea(change)].push(change);
    }

    return areaGroups;
  }

  private resolveArea(change: Readonly<ChangelogChange>): Area {
    const scopeParts = (change.scope || '')
      .split(',')
      .map((part) => part.trim().toLowerCase())
      .filter((part) => part.length > 0);

    if (scopeParts.length === 0) {
      return this.project === 'toolkit' ? 'toolkit' : 'other';
    }

    const matchesToolkit = scopeParts.some((scope) =>
      this.isToolkitScope(scope),
    );
    const matchesDemo = scopeParts.some((scope) => this.isDemoScope(scope));

    if (matchesToolkit && matchesDemo) {
      return 'shared';
    }

    if (matchesDemo) {
      return 'demo';
    }

    if (matchesToolkit) {
      return 'toolkit';
    }

    return 'other';
  }

  private isToolkitScope(scope: string): boolean {
    return (
      TOOLKIT_SCOPE_ALIASES.has(scope) ||
      scope.startsWith('toolkit/') ||
      scope.startsWith('toolkit-')
    );
  }

  private isDemoScope(scope: string): boolean {
    return (
      scope === 'demo' ||
      scope === 'demo-e2e' ||
      scope === 'apps/demo' ||
      scope.startsWith('demo/') ||
      scope.startsWith('demo-')
    );
  }

  private renderAreaTitle(area: Area): string {
    switch (area) {
      case 'toolkit':
        return '`@ngx-signal-forms/toolkit`';
      case 'demo':
        return 'Demo (`apps/demo`)';
      case 'shared':
        return 'Shared toolkit + demo changes';
      case 'other':
        return 'Other repository changes';
      default:
        return area satisfies never;
    }
  }

  private renderAreaSummaryLabel(area: Area): string {
    switch (area) {
      case 'toolkit':
        return 'Toolkit';
      case 'demo':
        return 'Demo';
      case 'shared':
        return 'Shared';
      case 'other':
        return 'Other';
      default:
        return area satisfies never;
    }
  }
}
