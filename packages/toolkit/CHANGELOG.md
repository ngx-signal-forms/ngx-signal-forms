## 1.0.0-beta.1 (2026-01-30)

### 🚀 Features

- ⚠️  **toolkit:** create assistive components entry point ([b1d003b](https://github.com/ngx-signal-forms/ngx-signal-forms/commit/b1d003b))
- ⚠️  **form-field:** rename form field wrapper API ([4588f54](https://github.com/ngx-signal-forms/ngx-signal-forms/commit/4588f54))

### ⚠️  Breaking Changes

- **toolkit:** create assistive components entry point  ([b1d003b](https://github.com/ngx-signal-forms/ngx-signal-forms/commit/b1d003b))
  NgxSignalFormErrorComponent moved from @ngx-signal-forms/toolkit to @ngx-signal-forms/toolkit/assistive. Update imports:
  Before:
  import { NgxSignalFormErrorComponent } from '@ngx-signal-forms/toolkit';
  After:
  import { NgxSignalFormErrorComponent } from '@ngx-signal-forms/toolkit/assistive';
- **form-field:** rename form field wrapper API  ([4588f54](https://github.com/ngx-signal-forms/ngx-signal-forms/commit/4588f54))
  The form field wrapper component and related
  selectors were renamed. Update imports to
  NgxSignalFormFieldWrapperComponent and replace
  <ngx-signal-form-field> with <ngx-signal-form-field-wrapper>.
  Hint and character count selectors are now
  ngx-signal-form-field-wrapper-hint and
  ngx-signal-form-field-wrapper-character-count.

### ❤️ Thank You

- The Ult

## 1.0.0-beta.0 (2026-01-28)

### 🚀 Features

- **toolkit:** add headless primitives ([e934072](https://github.com/ngx-signal-forms/ngx-signal-forms/commit/e934072))
- **toolkit:** prepare beta release with enhanced a11y and docs ([e414c20](https://github.com/ngx-signal-forms/ngx-signal-forms/commit/e414c20))
- **toolkit/form-field:** add NgxSignalFormFieldsetComponent for aggregated validation ([8078516](https://github.com/ngx-signal-forms/ngx-signal-forms/commit/8078516))
- **toolkit:** add status classes utility and global outline config ([f261e71](https://github.com/ngx-signal-forms/ngx-signal-forms/commit/f261e71))
- **toolkit:** implement comprehensive accessibility improvements ([6277c28](https://github.com/ngx-signal-forms/ngx-signal-forms/commit/6277c28))
- **core:** add optional error-message registry with 3-tier resolution ([a20bc84](https://github.com/ngx-signal-forms/ngx-signal-forms/commit/a20bc84))
- **core:** add focusFirstInvalid & submission helper utilities; ([1ee0e0f](https://github.com/ngx-signal-forms/ngx-signal-forms/commit/1ee0e0f))
- **toolkit/form-field:** add 4-layer semantic theming architecture ([01a7e54](https://github.com/ngx-signal-forms/ngx-signal-forms/commit/01a7e54))
- **toolkit/form-field:** add outlined layout with character count and hint components ([0b1c70e](https://github.com/ngx-signal-forms/ngx-signal-forms/commit/0b1c70e))
- **demo:** comprehensive demo app with examples and documentation ([2e9f54a](https://github.com/ngx-signal-forms/ngx-signal-forms/commit/2e9f54a))
- **toolkit:** add warnings support with convention-based approach ([6203104](https://github.com/ngx-signal-forms/ngx-signal-forms/commit/6203104))
- **toolkit:** implement core utilities, directives, and testing infrastructure ([e5962eb](https://github.com/ngx-signal-forms/ngx-signal-forms/commit/e5962eb))
- **toolkit:** add initial toolkit setup ([026038f](https://github.com/ngx-signal-forms/ngx-signal-forms/commit/026038f))

### 🩹 Fixes

- **deps:** add missing @angular/forms dependency in package.json ([5a35579](https://github.com/ngx-signal-forms/ngx-signal-forms/commit/5a35579))
- **theming:** align feedback vars and demo overrides ([a8fa1a9](https://github.com/ngx-signal-forms/ngx-signal-forms/commit/a8fa1a9))
- **toolkit:** resolve eslint errors for directive selectors and unused variables ([1ad3829](https://github.com/ngx-signal-forms/ngx-signal-forms/commit/1ad3829))

### ❤️ Thank You

- The Ult