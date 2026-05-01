import { defineConfig } from 'oxlint';

// NOTE: `options.typeAware` enables tsgolint-powered rules (see
// https://oxc.rs/docs/guide/usage/linter/type-aware). Several rules in this
// file — `no-unnecessary-condition`, `strict-void-return`,
// `no-unsafe-type-assertion`, `no-unnecessary-type-assertion`,
// `prefer-readonly`, `prefer-readonly-parameter-types`,
// `consistent-type-exports`, `no-unnecessary-type-parameters`,
// `consistent-return` — silently disappear if this option is turned off.
//
// `typeCheck` is intentionally NOT enabled: it surfaces raw TSC diagnostics
// (TS2322, TS2345, etc.) through oxlint for files that aren't in the build
// tsconfig. Type checking is tsc's responsibility; lint should be for lint
// rules. Leaving `typeCheck` on turns oxlint into a noisy second type checker.

export default defineConfig({
  plugins: [
    'typescript',
    'unicorn',
    'oxc',
    'import',
    'promise',
    'node',
    'jsdoc',
    'vitest',
  ],
  categories: {
    correctness: 'error',
    suspicious: 'error',
    pedantic: 'warn',
    perf: 'warn',
    nursery: 'warn',
    // `style` intentionally off — oxfmt handles formatting concerns.
    // `restriction` intentionally off — opt into individual restriction
    // rules below (e.g. `no-explicit-any`) rather than enabling wholesale.
  },
  options: {
    typeAware: true,
  },
  env: {
    browser: true,
    node: true,
    es2024: true,
  },
  settings: {
    jsdoc: {
      // TSDoc standard tags that oxlint's JSDoc plugin doesn't recognize
      // out of the box. Self-mapping tells `jsdoc/check-tag-names` to treat
      // them as known, so we can keep using TSDoc conventions in public
      // API comments without the rule complaining.
      tagNamePreference: {
        remarks: 'remarks',
        packageDocumentation: 'packageDocumentation',
      },
    },
  },
  globals: {
    ngDevMode: 'readonly',
  },
  ignorePatterns: [
    '.angular',
    '.nx',
    '**/dist',
    '**/tmp',
    '**/node_modules',
    '**/vite.config.*.timestamp*',
    '**/vitest.config.*.timestamp*',
    '**/mockServiceWorker.js',
  ],
  rules: {
    // Opt-ins from the `restriction` category (kept off as a whole).
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-var-requires': 'off',

    // Opt-ins from the `style` category (kept off as a whole because oxfmt
    // handles formatting — these are structural, not whitespace).
    '@typescript-eslint/prefer-readonly': 'warn',
    '@typescript-eslint/consistent-type-exports': 'warn',

    // Severity downgrades from `suspicious: error` → warn. These rules would
    // otherwise fire as errors via the category and block CI on warnings-tier
    // issues the team wants visible but not blocking.
    '@typescript-eslint/no-unsafe-type-assertion': 'warn',
    '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
    '@typescript-eslint/no-unnecessary-type-parameters': 'warn',
    '@typescript-eslint/no-unnecessary-template-expression': 'warn',
    '@typescript-eslint/consistent-return': 'warn',
    'no-shadow': 'warn',
    'unicorn/consistent-function-scoping': 'warn',

    // Severity downgrade from `correctness: error` → warn. `no-unused-vars`
    // is noisy during refactors; we surface it without breaking CI.
    'no-unused-vars': 'warn',

    // Explicit severity + options (would otherwise be `error` via `suspicious`
    // without the `allowWithDecorator` escape hatch Angular needs).
    '@typescript-eslint/no-extraneous-class': [
      'error',
      { allowWithDecorator: true },
    ],

    // Pedantic/perf noise that never pays off in this codebase.
    // Disabling globally rather than per-file because these rules have no
    // context where they're valuable here (tests, Angular co-location of
    // classes, inline call-site comments, intentional sequential awaits,
    // file/function length limits that clash with library entrypoints).
    'max-lines': 'off',
    'max-lines-per-function': 'off',
    'max-classes-per-file': 'off',
    'no-inline-comments': 'off',
    'no-negated-condition': 'off',
    'no-await-in-loop': 'off',

    // `prefer-dom-node-dataset` auto-rewrites `setAttribute('data-x', v)` to
    // `element.dataset.x = v`, which trips TS4111 under this repo's strict
    // `noPropertyAccessFromIndexSignature` tsconfig (DOMStringMap requires
    // bracket access). The rule is incompatible with strict TS dataset typing.
    'unicorn/prefer-dom-node-dataset': 'off',

    // `prefer-at` rewrites `arr[arr.length - 1]` → `arr.at(-1)`, which
    // widens the return type from `T` to `T | undefined`. Under strict TS
    // this breaks callers that expect the non-optional form. Safe-mode fix
    // is not actually safe for strictly-typed code.
    'unicorn/prefer-at': 'off',

    // `no-useless-undefined` removes explicit `undefined` defaults and
    // `return undefined` forms, but those are sometimes load-bearing — e.g.
    // Angular `input<T>(undefined)` defaults and callback signatures that
    // must return `undefined` rather than `void`.
    'unicorn/no-useless-undefined': 'off',

    // `prefer-nullish-coalescing` rewrites `a || b` → `a ?? b`, but for
    // strings the two differ: `'' || null` is `null`, `'' ?? null` is `''`.
    // We depend on the falsy-OR behavior in a few spots (e.g. treating
    // empty `id` attributes as "no value").
    '@typescript-eslint/prefer-nullish-coalescing': 'off',

    // `vitest/require-mock-type-parameters` wants `vi.mock<typeof Module>()`
    // type params on every mock call. Significant boilerplate with marginal
    // type safety gain; vitest infers mock shapes from the imported module.
    'vitest/require-mock-type-parameters': 'off',

    // `import/no-unassigned-import` flags side-effect imports like CSS,
    // polyfills, and test setup (`import 'zone.js'`, `import './styles.css'`).
    // These are load-bearing in Angular/Vitest and can't be rewritten.
    'import/no-unassigned-import': 'off',

    // Pedantic-category jsdoc rules that demand `@param`/`@returns` tags on
    // every function. This codebase intentionally uses narrative JSDoc
    // (description-first, no tags); the `check-*` rules below still validate
    // any tags that *are* present. Disabling the `require-*` family keeps
    // pedantic: warn usable without flooding the signal with tag demands.
    'jsdoc/require-param': 'off',
    'jsdoc/require-param-type': 'off',
    'jsdoc/require-param-description': 'off',
    'jsdoc/require-returns': 'off',
    'jsdoc/require-returns-type': 'off',
    'jsdoc/require-returns-description': 'off',

    // Rules auto-enabled via category and therefore NOT listed here:
    //   - `prefer-readonly-parameter-types`, `strict-void-return` → via `pedantic: warn`
    //   - `no-unnecessary-condition`, `prefer-optional-chain` → via `nursery: warn`
  },
  overrides: [
    {
      files: [
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.js',
        '**/*.test.js',
      ],
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
      rules: {
        'unicorn/consistent-function-scoping': 'off',
        '@typescript-eslint/prefer-readonly-parameter-types': 'off',
        '@typescript-eslint/no-unnecessary-condition': 'off',
        'vitest/no-conditional-tests': 'warn',
        'vitest/no-import-node-test': 'error',
        'vitest/require-local-test-context-for-concurrent-snapshots': 'error',
      },
    },
    {
      files: ['apps/*-e2e/**/*.ts'],
      rules: {
        'unicorn/consistent-function-scoping': 'off',
        '@typescript-eslint/prefer-readonly-parameter-types': 'off',
        '@typescript-eslint/no-unnecessary-condition': 'off',
      },
    },
    {
      files: [
        'apps/demo/src/**/*.ts',
        'packages/toolkit/debugger/**/*.ts',
        'packages/toolkit/vite.config.mts',
      ],
      rules: {
        '@typescript-eslint/prefer-readonly-parameter-types': 'off',
      },
    },
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
      jsPlugins: ['@nx/eslint-plugin'],
      rules: {
        '@nx/enforce-module-boundaries': [
          'error',
          {
            enforceBuildableLibDependency: true,
            allow: ['^@ngx-signal-forms/toolkit/.*$'],
            depConstraints: [
              // The published toolkit must never reach into demo-only code.
              // This is what keeps the design-system reference apps (#40)
              // from contaminating the toolkit bundle.
              {
                sourceTag: 'scope:lib',
                onlyDependOnLibsWithTags: ['scope:lib'],
              },
              {
                sourceTag: 'scope:demo',
                onlyDependOnLibsWithTags: ['scope:lib', 'scope:demo'],
              },
              {
                sourceTag: 'type:lib',
                onlyDependOnLibsWithTags: ['type:lib'],
              },
              {
                sourceTag: 'type:app',
                onlyDependOnLibsWithTags: ['type:lib', 'type:app'],
              },
            ],
          },
        ],
      },
    },
    {
      files: [
        'apps/demo/src/**/*.ts',
        'apps/demo-material/src/**/*.ts',
        'packages/toolkit/**/*.ts',
      ],
      jsPlugins: ['@angular-eslint/eslint-plugin'],
      rules: {
        '@angular-eslint/contextual-lifecycle': 'error',
        '@angular-eslint/no-empty-lifecycle-method': 'error',
        '@angular-eslint/no-input-rename': 'error',
        '@angular-eslint/no-inputs-metadata-property': 'error',
        '@angular-eslint/no-output-native': 'error',
        '@angular-eslint/no-output-on-prefix': 'error',
        '@angular-eslint/no-output-rename': 'error',
        '@angular-eslint/no-outputs-metadata-property': 'error',
        '@angular-eslint/prefer-inject': 'error',
        '@angular-eslint/prefer-standalone': 'error',
        '@angular-eslint/use-pipe-transform-interface': 'error',
        '@angular-eslint/use-lifecycle-interface': 'warn',
      },
    },
    {
      files: ['apps/demo/src/**/*.ts', 'apps/demo-material/src/**/*.ts'],
      jsPlugins: ['@angular-eslint/eslint-plugin'],
      rules: {
        '@angular-eslint/directive-selector': [
          'error',
          { type: 'attribute', prefix: 'ngx', style: 'camelCase' },
        ],
        '@angular-eslint/component-selector': [
          'error',
          { type: 'element', prefix: 'ngx', style: 'kebab-case' },
        ],
      },
    },
    {
      files: ['packages/toolkit/**/*.ts'],
      jsPlugins: ['@angular-eslint/eslint-plugin'],
      rules: {
        '@angular-eslint/directive-selector': [
          'error',
          {
            type: 'attribute',
            prefix: ['ngxSignalForm', 'ngx'],
            style: 'camelCase',
          },
        ],
        '@angular-eslint/component-selector': [
          'error',
          {
            type: 'element',
            prefix: ['ngx-signal-form', 'ngx'],
            style: 'kebab-case',
          },
        ],
      },
    },
    {
      files: ['packages/toolkit/**/*.spec.ts'],
      jsPlugins: ['@angular-eslint/eslint-plugin'],
      rules: {
        '@angular-eslint/directive-selector': 'off',
        '@angular-eslint/component-selector': 'off',
      },
    },
    {
      files: ['apps/demo/src/**/*.ts', 'apps/demo-material/src/**/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: '@ngx-signal-forms/toolkit/core',
                message:
                  "Use '@ngx-signal-forms/toolkit'. The /core entry point is a build-time-only secondary entry, stripped from the published exports map and unavailable to consumers.",
              },
            ],
          },
        ],
      },
    },
    {
      files: ['**/*.html'],
      jsPlugins: ['@angular-eslint/eslint-plugin-template'],
      rules: {
        '@angular-eslint/template/banana-in-box': 'error',
        '@angular-eslint/template/eqeqeq': 'error',
        '@angular-eslint/template/no-negated-async': 'error',
        '@angular-eslint/template/prefer-control-flow': 'error',
        '@angular-eslint/template/alt-text': 'error',
        '@angular-eslint/template/click-events-have-key-events': 'error',
        '@angular-eslint/template/elements-content': 'error',
        '@angular-eslint/template/interactive-supports-focus': 'error',
        '@angular-eslint/template/label-has-associated-control': 'error',
        '@angular-eslint/template/mouse-events-have-key-events': 'error',
        '@angular-eslint/template/no-autofocus': 'error',
        '@angular-eslint/template/no-distracting-elements': 'error',
        '@angular-eslint/template/role-has-required-aria': 'error',
        '@angular-eslint/template/table-scope': 'error',
        '@angular-eslint/template/valid-aria': 'error',
      },
    },
    {
      files: ['apps/demo-e2e/**/*.ts'],
      jsPlugins: ['eslint-plugin-playwright'],
      rules: {
        'playwright/no-focused-test': 'error',
        'playwright/no-skipped-test': 'warn',
        'playwright/valid-expect': 'error',
        'playwright/no-force-option': 'warn',
        'playwright/no-wait-for-timeout': 'warn',
        'playwright/prefer-web-first-assertions': 'warn',
      },
    },
    {
      files: ['packages/toolkit/**/*.ts'],
      rules: {
        'jsdoc/check-tag-names': 'warn',
        'jsdoc/check-property-names': 'warn',
        'jsdoc/empty-tags': 'warn',
        'jsdoc/no-defaults': 'warn',
        'jsdoc/require-param-name': 'warn',
        'jsdoc/require-property-name': 'warn',
      },
    },
    {
      files: ['packages/toolkit/**/*.json', 'packages/demo-shared/**/*.json'],
      jsPlugins: ['@nx/eslint-plugin'],
      rules: {
        '@nx/dependency-checks': [
          'error',
          {
            ignoredFiles: [
              '{projectRoot}/vite.config.{js,cjs,mjs,ts,cts,mts}',
              '{projectRoot}/test-setup.ts',
            ],
          },
        ],
      },
    },
  ],
});
