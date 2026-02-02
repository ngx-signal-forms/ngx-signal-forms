import { ChangelogRenderer, type ChangelogRenderOptions } from '@nx/js/release';

/**
 * Custom changelog renderer that includes ALL conventional commits,
 * not just those affecting the toolkit package.
 *
 * This ensures demo improvements and other workspace changes are captured
 * in a separate "Demo Application" section.
 */
export default class CustomChangelogRenderer extends ChangelogRenderer {
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
