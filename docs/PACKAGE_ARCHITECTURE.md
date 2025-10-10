# Package Architecture

## Overview

The `@ngx-signal-forms` ecosystem consists of two main packages:

1. **`@ngx-signal-forms/toolkit`** - Main package with core functionality
2. **`@ngx-signal-forms/vestjs`** - Separate optional package for Vest.js integration

## Package Structure

### @ngx-signal-forms/toolkit (Main Package)

```
@ngx-signal-forms/toolkit/
├── src/
│   ├── core/                          # Internal core implementation
│   │   ├── directives/
│   │   │   ├── auto-aria.directive.ts
│   │   │   ├── auto-touch.directive.ts
│   │   │   ├── form-busy.directive.ts
│   │   │   └── form-provider.directive.ts
│   │   ├── components/
│   │   │   └── form-error.component.ts
│   │   ├── utilities/
│   │   │   ├── error-strategies.ts
│   │   │   ├── field-resolution.ts
│   │   │   └── show-errors.ts
│   │   ├── providers/
│   │   │   └── config.provider.ts
│   │   ├── tokens.ts
│   │   └── types.ts
│   ├── form-field/                    # Secondary entry point
│   │   ├── form-field.component.ts
│   │   └── index.ts
│   ├── testing/                       # Secondary entry point
│   │   ├── test-helpers.ts
│   │   └── index.ts
│   └── index.ts                       # Primary entry (exports core)
├── form-field/
│   └── index.ts                       # Re-export for secondary entry
├── testing/
│   └── index.ts                       # Re-export for secondary entry
└── package.json
```

**Entry Points:**

- `@ngx-signal-forms/toolkit` - Core directives, utilities, components (always available)
- `@ngx-signal-forms/toolkit/form-field` - Form field wrapper (optional)
- `@ngx-signal-forms/toolkit/testing` - Test utilities (optional, dev only)

### @ngx-signal-forms/vestjs (Separate Package)

```
@ngx-signal-forms/vestjs/
├── src/
│   ├── validators/                    # Vest.js validators
│   ├── adapters/                      # Vest to Signal Forms adapters
│   └── index.ts
└── package.json
```

**Entry Point:**

- `@ngx-signal-forms/vestjs` - Vest.js integration

## Installation

```bash
# Main toolkit (required for most users)
npm install @ngx-signal-forms/toolkit

# Vest.js integration (optional - separate package)
npm install @ngx-signal-forms/vestjs
```

## Usage

### Primary Entry (Core Features)

```typescript
import { NgxSignalFormAutoAria, NgxSignalFormAutoTouch, NgxSignalFormErrorComponent, provideNgxSignalFormsConfig } from '@ngx-signal-forms/toolkit';
```

### Secondary Entry (Form Field - Optional)

```typescript
import { NgxSignalFormField } from '@ngx-signal-forms/toolkit/form-field';
```

### Secondary Entry (Testing - Optional)

```typescript
import { createTestForm } from '@ngx-signal-forms/toolkit/testing';
```

### Separate Package (Vest.js - Optional)

```typescript
import { vestValidator } from '@ngx-signal-forms/vestjs';
```

## Dependency Graph

```
@angular/core (peer)
@angular/forms/signals (peer) ← Signal Forms API
        ↓
@ngx-signal-forms/toolkit (main package)
├── Primary: Core directives + utilities
├── /form-field (optional secondary entry)
└── /testing (optional secondary entry)

@ngx-signal-forms/vestjs (separate optional package)
├── Depends on: @angular/forms/signals
└── Can be used alongside toolkit
```

## Key Design Decisions

### Why Toolkit is the Main Package

1. **Simplified Installation**: Most users only need one package
2. **Core Functionality**: Contains all essential directives and utilities
3. **Optional Features**: Secondary entry points for form-field and testing
4. **Tree-shakable**: Unused secondary entries are excluded from bundle

### Why Vest.js is Separate

1. **Optional Integration**: Not all users need Vest.js validation
2. **Independent Evolution**: Can version and release separately
3. **Clear Separation**: Different concern from core toolkit
4. **Composition**: Can be used alongside toolkit without conflicts

### Why Form-field is a Secondary Entry

1. **Easy Opt-out**: Developers can choose not to use it
2. **Tree-shakable**: Only included when imported
3. **Part of Toolkit**: Conceptually belongs to the main package
4. **Smaller Bundle**: Not included unless explicitly imported

## Future Considerations

If the toolkit grows too large or if both `toolkit` and `vestjs` need shared utilities, consider extracting a shared core:

```
@ngx-signal-forms/core (internal shared package)
        ↓
├── @ngx-signal-forms/toolkit
└── @ngx-signal-forms/vestjs
```

However, for v1.0, the current structure is simpler and sufficient.

## Publishing Strategy

### @ngx-signal-forms/toolkit

- **Scope**: Main functionality
- **Versioning**: Semantic versioning
- **Breaking Changes**: Major version bumps
- **Release Cadence**: Regular releases with features/fixes

### @ngx-signal-forms/vestjs

- **Scope**: Vest.js integration
- **Versioning**: Independent from toolkit
- **Breaking Changes**: Follows toolkit major versions when possible
- **Release Cadence**: As needed for Vest.js compatibility

## Package.json Configuration

### toolkit/package.json

```json
{
  "name": "@ngx-signal-forms/toolkit",
  "version": "1.0.0",
  "description": "Zero-intrusive toolkit for Angular Signal Forms",
  "exports": {
    ".": {
      "types": "./index.d.ts",
      "esm2022": "./esm2022/index.mjs",
      "esm": "./esm/index.mjs",
      "default": "./fesm2022/index.mjs"
    },
    "./form-field": {
      "types": "./form-field/index.d.ts",
      "esm2022": "./esm2022/form-field/index.mjs",
      "esm": "./esm/form-field/index.mjs",
      "default": "./fesm2022/form-field/index.mjs"
    },
    "./testing": {
      "types": "./testing/index.d.ts",
      "esm2022": "./esm2022/testing/index.mjs",
      "esm": "./esm/testing/index.mjs",
      "default": "./fesm2022/testing/index.mjs"
    }
  },
  "peerDependencies": {
    "@angular/core": "^21.0.0",
    "@angular/forms": "^21.0.0"
  }
}
```

### vestjs/package.json

```json
{
  "name": "@ngx-signal-forms/vestjs",
  "version": "1.0.0",
  "description": "Vest.js integration for Angular Signal Forms",
  "exports": {
    ".": {
      "types": "./index.d.ts",
      "esm2022": "./esm2022/index.mjs",
      "esm": "./esm/index.mjs",
      "default": "./fesm2022/index.mjs"
    }
  },
  "peerDependencies": {
    "@angular/core": "^21.0.0",
    "@angular/forms": "^21.0.0",
    "vest": "^5.0.0"
  }
}
```
