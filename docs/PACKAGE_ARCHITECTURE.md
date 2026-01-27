# Package Architecture

## Overview

The current `@ngx-signal-forms` ecosystem in this repository consists of a
single publishable package:

1. **`@ngx-signal-forms/toolkit`** - Main package with core functionality

## Package Structure

### @ngx-signal-forms/toolkit (Main Package)

```
packages/toolkit/
├── core/                               # Core implementation (public entry)
│   ├── components/
│   │   └── form-error.component.ts
│   ├── directives/
│   │   ├── auto-aria.directive.ts
│   │   └── ngx-signal-form.directive.ts
│   ├── utilities/
│   │   ├── error-strategies.ts
│   │   ├── field-resolution.ts
│   │   ├── show-errors.ts
│   │   ├── status-classes.ts
│   │   └── warning-error.ts
│   ├── providers/
│   │   ├── config.provider.ts
│   │   └── error-messages.provider.ts
│   ├── tokens.ts
│   ├── types.ts
│   └── public_api.ts
├── form-field/                          # Optional form-field entry
│   ├── form-field.component.ts
│   ├── form-fieldset.component.ts
│   ├── floating-label.directive.ts
│   ├── form-field-hint.component.ts
│   ├── form-field-character-count.component.ts
│   └── public_api.ts
├── headless/                            # Headless primitives entry
│   ├── src/
│   │   └── lib/
│   │       ├── error-state.directive.ts
│   │       ├── character-count.directive.ts
│   │       ├── fieldset.directive.ts
│   │       ├── field-name.directive.ts
│   │       └── utilities.ts            # Shared utility functions
│   ├── index.ts
│   └── public_api.ts
├── index.ts                             # Primary entry (providers/types)
├── README.md
└── package.json
```

**Entry Points:**

- `@ngx-signal-forms/toolkit` - Providers, directives, utilities, components
- `@ngx-signal-forms/toolkit/form-field` - Form field wrapper (optional)
- `@ngx-signal-forms/toolkit/headless` - Headless primitives (optional)

## Installation

```bash
# Main toolkit (required for most users)
npm install @ngx-signal-forms/toolkit
```

## Usage

### Primary Entry (Providers/Types)

```typescript
import { provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
```

### Core Entry (Directives/Utilities/Components)

```typescript
import {
  NgxSignalFormAutoAriaDirective,
  NgxSignalFormDirective,
  NgxSignalFormErrorComponent,
} from '@ngx-signal-forms/toolkit';
```

### Secondary Entry (Form Field - Optional)

```typescript
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';
```

### Secondary Entry (Headless Primitives - Optional)

```typescript
import {
  NgxHeadlessErrorStateDirective,
  NgxHeadlessCharacterCountDirective,
  NgxHeadlessFieldsetDirective,
  NgxHeadlessFieldNameDirective,
  createErrorState,
  createCharacterCount,
  readFieldFlag,
  readErrors,
  dedupeValidationErrors,
  createUniqueId,
} from '@ngx-signal-forms/toolkit/headless';
```

## Dependency Graph

```
@angular/core (peer)
@angular/forms/signals (peer) ← Signal Forms API
        ↓
@ngx-signal-forms/toolkit (main package)
├── Primary: Providers/types
├── /core (directives, utilities, components)
├── /form-field (optional secondary entry)
└── /headless (optional secondary entry - renderless primitives)
```

## Key Design Decisions

### Why Toolkit is the Main Package

1. **Simplified Installation**: Most users only need one package
2. **Core Functionality**: Contains all essential directives and utilities
3. **Optional Features**: Secondary entry point for form-field
4. **Tree-shakable**: Unused secondary entries are excluded from bundle

### Why Form-field is a Secondary Entry

1. **Easy Opt-out**: Developers can choose not to use it
2. **Tree-shakable**: Only included when imported
3. **Part of Toolkit**: Conceptually belongs to the main package
4. **Smaller Bundle**: Not included unless explicitly imported

### Why Headless is a Secondary Entry

1. **Renderless Primitives**: State-only directives without UI rendering
2. **Shared Utilities**: Common functions (`readFieldFlag`, `readErrors`, `dedupeValidationErrors`, `createUniqueId`) used by both form-field and custom components
3. **Design System Integration**: Perfect for custom component libraries
4. **Host Directive Composition**: Works with Angular's Directive Composition API
5. **Minimal Bundle**: Include only what you need

## Future Considerations

If the toolkit grows too large, consider extracting shared utilities into a
dedicated internal package.

## Publishing Strategy

### @ngx-signal-forms/toolkit

- **Scope**: Main functionality
- **Versioning**: Semantic versioning
- **Breaking Changes**: Major version bumps
- **Release Cadence**: Regular releases with features/fixes

## Key Design Decisions
