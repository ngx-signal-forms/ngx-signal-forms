# Package Architecture

## Overview

The current `@ngx-signal-forms` ecosystem in this repository consists of a
single publishable package with multiple entry points:

1. **`@ngx-signal-forms/toolkit`** - Core directives, utilities, and providers
2. **`@ngx-signal-forms/toolkit/assistive`** - Styled feedback components
3. **`@ngx-signal-forms/toolkit/form-field`** - Form field wrapper components
4. **`@ngx-signal-forms/toolkit/headless`** - Renderless primitives
5. **`@ngx-signal-forms/toolkit/vest`** - Optional Vest convenience helpers
6. **`@ngx-signal-forms/toolkit/debugger`** - Development-time form inspection tools

## Package Structure

### @ngx-signal-forms/toolkit (Main Package)

```bash
packages/toolkit/
├── core/                               # Core implementation (public entry)
│   ├── directives/
│   │   ├── auto-aria.directive.ts
│   │   ├── control-semantics.directive.ts
│   │   └── ngx-signal-form.directive.ts
│   ├── utilities/
│   │   ├── control-semantics.ts
│   │   ├── error-strategies.ts
│   │   ├── field-resolution.ts
│   │   ├── show-errors.ts
│   │   └── warning-error.ts
│   ├── providers/
│   │   ├── config.provider.ts
│   │   ├── control-semantics.provider.ts
│   │   ├── error-messages.provider.ts
│   │   └── field-labels.provider.ts
│   ├── tokens.ts
│   ├── types.ts
│   └── public_api.ts
├── assistive/                           # Styled assistive components entry
│   ├── assistive-row.component.ts
│   ├── character-count.component.ts
│   ├── form-field-error.component.ts
│   ├── hint.component.ts
│   ├── warning-error.ts
│   └── index.ts
├── form-field/                          # Optional form-field entry
│   ├── form-field-wrapper.component.ts
│   ├── form-fieldset.component.ts
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
├── vest/                                # Optional Vest integration entry
│   ├── src/
│   │   ├── index.ts
│   │   └── validate-vest.ts
│   ├── ng-package.json
│   └── README.md
├── debugger/                            # Development-time debugging tools
│   ├── debugger.component.ts
│   ├── index.ts
│   └── ng-package.json
├── index.ts                             # Primary entry (providers/types)
├── README.md
└── package.json
```

**Entry Points:**

- `@ngx-signal-forms/toolkit` - Providers, directives, utilities
- `@ngx-signal-forms/toolkit/assistive` - Styled feedback components
- `@ngx-signal-forms/toolkit/form-field` - Form field wrapper (optional)
- `@ngx-signal-forms/toolkit/headless` - Headless primitives (optional)
- `@ngx-signal-forms/toolkit/vest` - Optional Vest helpers
- `@ngx-signal-forms/toolkit/debugger` - Development-time inspection tools

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

### Core Entry (Directives/Utilities)

```typescript
import {
  NgxSignalFormAutoAriaDirective,
  NgxSignalFormDirective,
} from '@ngx-signal-forms/toolkit';
import { NgxFormFieldErrorComponent } from '@ngx-signal-forms/toolkit/assistive';
```

### Secondary Entry (Assistive Components - Optional)

```typescript
import {
  NgxFormFieldErrorComponent,
  NgxFormFieldHintComponent,
  NgxFormFieldCharacterCountComponent,
  NgxFormFieldAssistiveRowComponent,
} from '@ngx-signal-forms/toolkit/assistive';
```

### Secondary Entry (Form Field - Optional)

```typescript
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
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

### Secondary Entry (Vest Helpers - Optional)

```typescript
import { validateVest } from '@ngx-signal-forms/toolkit/vest';
```

## Dependency Graph

```text
@angular/core (peer)
@angular/forms/signals (peer) ← Signal Forms API
vest ^6.0.0 (optional peer) ← Only when using /vest (v6+ required for Standard Schema)
        ↓
@ngx-signal-forms/toolkit (main package)
├── Primary: Providers/types
├── /core (directives, utilities)
├── /assistive (optional secondary entry - styled feedback)
├── /form-field (optional secondary entry)
├── /headless (optional secondary entry - renderless primitives)
├── /vest (optional secondary entry - Vest DX helpers)
└── /debugger (optional secondary entry - development-time inspection)
```

## Design Summary

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

### Why Vest is a Secondary Entry

1. **Optional dependency**: Most toolkit users do not need Vest
2. **Native Angular integration**: Angular Signal Forms already supports Standard Schema
3. **DX-focused layer**: Keeps the helper thin and discoverable for Vest users
4. **No runtime coupling**: Core, assistive, and form-field stay vendor-agnostic

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
