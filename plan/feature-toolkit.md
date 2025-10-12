# @ngx-signal-forms/toolkit - Implementation Plan & PRD

> **Product Requirements Document & Technical Implementation Plan**
>
> Zero-intrusive toolkit for Angular 21+ Signal Forms with automatic accessibility, error display strategies, and form field wrappers.

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Product Vision](#product-vision)
3. [Technical Architecture](#technical-architecture)
4. [Feature Breakdown](#feature-breakdown)
5. [Implementation Phases](#implementation-phases)
6. [Pattern Adaptations from ngx-vest-forms](#pattern-adaptations-from-ngx-vest-forms)
7. [Angular ARIA & CDK Integration Opportunities](#angular-aria--cdk-integration-opportunities)
8. [Risk Assessment & Mitigation](#risk-assessment--mitigation)
9. [Success Metrics](#success-metrics)
10. [Timeline & Resources](#timeline--resources)

---

## Executive Summary

### What We're Building

A **zero-intrusive enhancement toolkit** for Angular 21+ Signal Forms that provides:

- ✅ **Automatic ARIA attributes** (aria-invalid, aria-describedby)
- ✅ **Automatic touch state management** (blur handlers)
- ✅ **Error display strategies** (immediate/on-touch/on-submit/manual)
- ✅ **Form field wrappers** (consistent layout + auto-error display)
- ✅ **Form busy state** (aria-busy during async operations)
- ✅ **WCAG 2.2 compliance** out-of-the-box

### Key Differentiators

| Aspect               | Signal Forms Alone       | With Toolkit            |
| -------------------- | ------------------------ | ----------------------- |
| **Lines of Code**    | ~15 lines per field      | ~7 lines per field      |
| **ARIA Compliance**  | Manual implementation    | Automatic               |
| **Touch Management** | Manual blur handlers     | Automatic               |
| **Error Display**    | Manual `@if` blocks      | Strategy-based          |
| **Accessibility**    | Developer responsibility | Built-in best practices |

### Package Structure

- **`@ngx-signal-forms/toolkit`** (main package)
  - Primary entry: Core directives + utilities
  - `/form-field`: Form field wrapper (optional)
  - `/testing`: Test utilities (optional)
- **`@ngx-signal-forms/vestjs`** (separate future package for Vest.js integration)

---

## Product Vision

### Problem Statement

Angular Signal Forms (v21+) provides excellent validation and reactivity but lacks:

1. **Automatic accessibility features** - Developers must manually add ARIA attributes
2. **Touch state management** - Requires blur handlers on every field
3. **Error display logic** - Manual `@if` conditions for every error
4. **Consistent field layouts** - No reusable wrapper component
5. **Form busy states** - Manual aria-busy during async operations

**Result**: ~53% more boilerplate code and high risk of accessibility violations.

### Solution

**Non-intrusive enhancement layer** that:

- ✅ Works **alongside** Signal Forms (zero API changes)
- ✅ Uses directives for automatic behavior (host bindings/listeners)
- ✅ Provides reusable components for common patterns
- ✅ Offers utilities for error display strategies
- ✅ Ensures WCAG 2.2 compliance by default

### Design Principles

1. **Non-Intrusive**: Enhance, don't replace Signal Forms API
2. **WCAG 2.2 First**: Accessibility by default
3. **Progressive Enhancement**: Start simple, add features as needed
4. **Zero Angular Forms Dependency**: Only depends on `@angular/forms/signals`
5. **Type-Safe**: Full TypeScript inference from Signal Forms schemas
6. **Tree-Shakable**: Use only what you need

---

## Technical Architecture

### Technology Stack

- **Angular**: 21+ (Signal Forms experimental API)
- **TypeScript**: 5.8+ (strict mode)
- **Testing**: Vitest (unit/component) + Playwright (E2E)
- **Build**: Nx 20+ with Angular CLI builders
- **Package Manager**: pnpm 9+
- **Accessibility**: WCAG 2.2 Level AA

### Dependency Graph

```text
@angular/core (peer) ← Signals API
@angular/forms/signals (peer) ← Signal Forms API (experimental)
@angular/aria (installed) ← SignalLike<T> types for API design
        ↓
@ngx-signal-forms/toolkit (main package)
├── Core directives + utilities (primary entry)
├── /form-field (secondary entry - optional)
└── /testing (secondary entry - optional)

@ngx-signal-forms/vestjs (future: separate package)
├── Depends on: @angular/forms/signals
└── Can be used alongside @ngx-signal-forms/toolkit
```

**Note**: `@angular/aria` (21.0.0-next.8) is installed and provides:

- ✅ **Type utilities** (`SignalLike<T>`, `WritableSignalLike<T>`) - Used throughout our API
- ❌ **Pattern classes** (ComboboxPattern, ListboxPattern, etc.) - Out of scope for directive-based toolkit
- 📚 **Documentation value** - Pattern classes documented for users building custom components

### Package Structure

```text
packages/toolkit/
├── src/
│   ├── core/                         # Core implementation (internal)
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
│   ├── form-field/                   # Secondary entry point
│   │   ├── form-field.component.ts
│   │   └── index.ts
│   ├── testing/                      # Secondary entry point
│   │   ├── test-helpers.ts
│   │   └── index.ts
│   └── index.ts                      # Primary entry (core exports)
├── form-field/
│   └── index.ts                      # Secondary entry point re-export
├── testing/
│   └── index.ts                      # Secondary entry point re-export
├── package.json
├── project.json
└── README.md
```

### Enhancement Types

| Type           | Examples                                       | How It Enhances Signal Forms                     |
| -------------- | ---------------------------------------------- | ------------------------------------------------ |
| **Directives** | auto-aria, auto-touch, form-busy               | Host bindings/listeners on Signal Forms controls |
| **Components** | form-error, form-field                         | Reusable UI for error display and layout         |
| **Utilities**  | `computeShowErrors()`, `fieldNameResolver()`   | Pure functions working with Signal Forms state   |
| **Providers**  | `provideNgxSignalFormsConfig()`                | DI-based configuration                           |
| **Types**      | `ErrorDisplayStrategy`, `NgxSignalFormsConfig` | TypeScript types for DX                          |

---

## Feature Breakdown

### 1. Auto-ARIA Directive (`NgxSignalFormAutoAria`)

**Purpose**: Automatically manage `aria-invalid` and `aria-describedby` attributes.

**Selector Strategy**:

```typescript
selector: `
  input[control]:not([ngxSignalFormAutoAriaDisabled]):not([type="radio"]):not([type="checkbox"]),
  textarea[control]:not([ngxSignalFormAutoAriaDisabled]),
  select[control]:not([ngxSignalFormAutoAriaDisabled])
`;
```

**Host Bindings**:

```typescript
host: {
  '[attr.aria-invalid]': 'ariaInvalid()',
  '[attr.aria-describedby]': 'ariaDescribedBy()'
}
```

**Field Name Resolution (4-tier priority)**:

1. `data-signal-field` attribute (explicit nested paths)
2. Custom resolver from config
3. `id` attribute (WCAG preferred)
4. `name` attribute (fallback)

**Key Implementation Details**:

- Uses `computed()` for reactive ARIA attributes
- Respects manual overrides via `HostAttributeToken`
- Throws error in strict mode if field name cannot be resolved
- Auto-generates error IDs in format: `{fieldName}-error`

**Adapted from ngx-vest-forms**:

- ✅ Same selector strategy
- ✅ Same 4-tier field resolution
- ✅ Same host binding approach
- ❌ Different: Uses Signal Forms field state instead of Vest.js

### 2. Auto-Touch Directive (`NgxSignalFormAutoTouch`)

**Purpose**: Automatically trigger touch state on blur.

**Selector Strategy**:

```typescript
selector: `
  input[control]:not([type="checkbox"]):not([type="radio"]):not([ngxSignalFormAutoTouchDisabled]),
  textarea[control]:not([ngxSignalFormAutoTouchDisabled]),
  select[control]:not([ngxSignalFormAutoTouchDisabled])
`;
```

**Host Listener**:

```typescript
host: {
  '(blur)': 'onBlur()'
}
```

**Key Implementation Details**:

- Only active when error strategy requires touch detection
- Calls `field().markAsTouched()` on blur
- Respects global configuration
- Opt-out via `ngxSignalFormAutoTouchDisabled` attribute

**Adapted from ngx-vest-forms**:

- ✅ Same selector strategy
- ✅ Same blur handler approach
- ❌ Different: Uses Signal Forms `markAsTouched()` instead of Vest.js

### 3. Form Provider Directive (`NgxSignalFormProvider`)

**Purpose**: Provide form context to child directives and track submission state.

**Key Features**:

- ✅ Form context via DI (`NGX_SIGNAL_FORM_CONTEXT` token)
- ✅ Submission state tracking (`hasSubmitted` signal)
- ✅ Error strategy configuration
- ✅ Auto-reset on form reset

**Implementation**:

```typescript
@Directive({
  selector: '[ngxSignalFormProvider]',
  exportAs: 'ngxSignalFormProvider',
  providers: [
    {
      provide: NGX_SIGNAL_FORM_CONTEXT,
      useExisting: NgxSignalFormProviderDirective,
    },
  ],
})
export class NgxSignalFormProviderDirective {
  form = input.required<any>();
  errorStrategy = input<ErrorDisplayStrategy>('on-touch');

  readonly hasSubmitted = signal(false);

  @HostListener('submit')
  save() {
    this.hasSubmitted.set(true);
  }

  @HostListener('reset')
  onReset() {
    this.hasSubmitted.set(false);
  }
}
```

**Adapted from ngx-vest-forms**:

- ✅ Same provider pattern
- ✅ Same submission tracking
- ✅ Same error strategy management
- ❌ Different: Works with Signal Forms instead of Vest.js

### 4. Form Busy Directive (`NgxSignalFormBusy`)

**Purpose**: Automatic `aria-busy` during async validation/submission.

**Selector Strategy**:

```typescript
selector: 'form:not([ngxSignalFormBusyDisabled])';
```

**Host Binding**:

```typescript
host: {
  '[attr.aria-busy]': 'ariaBusy()'
}
```

**Reactive State**:

```typescript
protected readonly ariaBusy = computed(() => {
  const form = this.form();
  return form.pending() || form.submitting() ? 'true' : null;
});
```

**Adapted from ngx-vest-forms**:

- ✅ Same aria-busy pattern
- ❌ Different: Uses Signal Forms `pending()` instead of Vest.js validation state

### 5. Error Display Component (`NgxSignalFormError`)

**Purpose**: Reusable error display with WCAG 2.2 compliance.

**Template**:

```typescript
@Component({
  selector: 'ngx-signal-form-error',
  template: `
    @if (showErrors()) {
      @for (error of structuredErrors(); track error.kind) {
        <p class="ngx-signal-form-error" role="alert" [id]="errorId()">
          {{ error.message }}
        </p>
      }
    }
  `,
})
```

**Key Features**:

- ✅ `role="alert"` for screen readers
- ✅ Strategy-aware error display
- ✅ Structured error rendering
- ✅ Auto-generated error IDs

**Adapted from ngx-vest-forms**:

- ✅ Same WCAG patterns (role="alert")
- ✅ Same structured error rendering
- ❌ Different: Uses Signal Forms error format instead of Vest.js

### 6. Form Field Wrapper (`NgxSignalFormField`)

**Purpose**: Consistent layout + automatic error display.

**Template**:

```typescript
@Component({
  selector: 'ngx-signal-form-field',
  template: `
    <div class="ngx-signal-form-field">
      <div class="ngx-signal-form-field__content">
        <ng-content />
      </div>
      @if (field()) {
        <ngx-signal-form-error [field]="field()!" />
      }
    </div>
  `,
  styles: `
    .ngx-signal-form-field {
      display: flex;
      flex-direction: column;
      gap: var(--ngx-signal-form-field-gap, 0.5rem);
      margin-bottom: var(--ngx-signal-form-field-margin, 1rem);
    }
  `,
})
```

**Key Features**:

- ✅ CSS custom properties for theming
- ✅ Auto-error display
- ✅ Content projection for flexibility

**Adapted from ngx-vest-forms**:

- ✅ Same wrapper pattern
- ✅ Same CSS custom properties approach
- ❌ Different: Works with Signal Forms field state

### 7. Error Display Strategies

**Strategy Types**:

```typescript
export type ErrorDisplayStrategy =
  | 'immediate' // Show errors as they occur
  | 'on-touch' // Show after blur or submit (WCAG recommended)
  | 'on-submit' // Show only after submit
  | 'manual'; // Developer controls display
```

**Implementation**:

```typescript
export function computeShowErrors(field: Signal<FieldState<any>>, strategy: ErrorDisplayStrategy | Signal<ErrorDisplayStrategy>, hasSubmitted: Signal<boolean>): Signal<boolean> {
  return computed(() => {
    const f = field();
    const hasErrors = f.invalid();
    const touched = f.touched();
    const submitted = hasSubmitted();

    const currentStrategy = typeof strategy === 'function' ? strategy() : strategy;

    switch (currentStrategy) {
      case 'immediate':
        return hasErrors;
      case 'on-touch':
        return (touched || submitted) && hasErrors;
      case 'on-submit':
        return submitted && hasErrors;
      case 'manual':
        return false;
      default:
        return (touched || submitted) && hasErrors;
    }
  });
}
```

**Adapted from ngx-vest-forms**:

- ✅ Same strategy types
- ✅ Same logic patterns
- ❌ Different: Uses Signal Forms state instead of Vest.js

### 8. Global Configuration

**Config Interface**:

```typescript
export interface NgxSignalFormsConfig {
  autoAria?: boolean; // Enable auto-ARIA (default: true)
  autoTouch?: boolean; // Enable auto-touch (default: true)
  autoFormBusy?: boolean; // Enable auto aria-busy (default: true)
  defaultErrorStrategy?: ErrorDisplayStrategy;
  fieldNameResolver?: (element: HTMLElement) => string | null;
  strictFieldResolution?: boolean; // Throw on unresolved fields
  debug?: boolean; // Enable debug logging
}

export function provideNgxSignalFormsConfig(config: NgxSignalFormsConfig) {
  return {
    provide: NGX_SIGNAL_FORMS_CONFIG,
    useValue: config,
  };
}
```

**Usage**:

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig({
      autoAria: true,
      autoTouch: true,
      autoFormBusy: true,
      defaultErrorStrategy: 'on-touch',
      debug: !environment.production,
    }),
  ],
};
```

---

## Implementation Phases

### Phase 1: Foundation & Core Directives (Weeks 1-2)

**Sprint Goal**: Implement core directives with automatic ARIA and touch management.

#### Tasks

1. **Setup Infrastructure** (Priority: P0)
   - [ ] Create `packages/toolkit` structure
   - [ ] Configure `project.json` with Nx
   - [ ] Setup TypeScript compiler options
   - [ ] Configure secondary entry points (`/form-field`, `/testing`)
   - [ ] Import `SignalLike<T>` types from `@angular/aria` (already installed)
   - [ ] Create `tokens.ts` with DI tokens using SignalLike types
   - [ ] Create `types.ts` with core types using SignalLike types

2. **Auto-ARIA Directive** (Priority: P0)
   - [ ] Create `auto-aria.directive.ts` with selector
   - [ ] Implement 4-tier field name resolution
   - [ ] Implement `ariaInvalid()` computed signal
   - [ ] Implement `ariaDescribedBy()` computed signal
   - [ ] Add manual override detection via `HostAttributeToken`
   - [ ] Add opt-out mechanism (`ngxSignalFormAutoAriaDisabled`)
   - [ ] Write unit tests (field resolution, ARIA binding)
   - [ ] Write component tests with Testing Library

3. **Form Provider Directive** (Priority: P0)
   - [ ] Create `form-provider.directive.ts`
   - [ ] Implement `NGX_SIGNAL_FORM_CONTEXT` token
   - [ ] Implement submission state tracking (`hasSubmitted`)
   - [ ] Implement `@HostListener('submit')` handler
   - [ ] Implement `@HostListener('reset')` handler
   - [ ] Add error strategy input
   - [ ] Write unit tests (DI resolution, submission tracking)

4. **Auto-Touch Directive** (Priority: P0)
   - [ ] Create `auto-touch.directive.ts` with selector
   - [ ] Implement blur handler
   - [ ] Inject form provider for strategy awareness
   - [ ] Add opt-out mechanism (`ngxSignalFormAutoTouchDisabled`)
   - [ ] Write unit tests (touch triggering, strategy awareness)
   - [ ] Write component tests with user interaction

5. **Field Resolution Utility** (Priority: P1)
   - [ ] Create `field-resolution.ts`
   - [ ] Implement `resolveFieldName()` function
   - [ ] Implement 4-tier priority logic
   - [ ] Add strict mode error throwing
   - [ ] Write unit tests (all priority tiers, fallbacks)

**Deliverables**:

- ✅ Core directives functional
- ✅ DI context established
- ✅ Test coverage >80%
- ✅ Documentation for each directive

**Success Criteria**:

- Auto-ARIA works on all input types
- Touch state triggers correctly on blur
- Form provider tracks submission state
- All tests pass with >80% coverage

---

### Phase 2: Error Display & Strategies (Week 3)

**Sprint Goal**: Implement error display component and strategies.

#### Tasks

1. **Error Strategies** (Priority: P0)
   - [ ] Create `error-strategies.ts`
   - [ ] Define `ErrorDisplayStrategy` type
   - [ ] Implement `computeShowErrors()` utility
   - [ ] Add strategy descriptions for docs
   - [ ] Write unit tests (all strategy types)

2. **Error Component** (Priority: P0)
   - [ ] Create `form-error.component.ts`
   - [ ] Implement `field` input
   - [ ] Implement `showErrors()` computed signal
   - [ ] Implement `structuredErrors()` computed signal
   - [ ] Add `role="alert"` for accessibility
   - [ ] Add CSS custom properties for theming
   - [ ] Write component tests (error rendering, strategy switching)

3. **Show Errors Utility** (Priority: P1)
   - [ ] Create `show-errors.ts`
   - [ ] Implement helper functions for common patterns
   - [ ] Add type guards for error structures
   - [ ] Write unit tests

4. **Integration Testing** (Priority: P1)
   - [ ] Create integration test suite
   - [ ] Test auto-ARIA + error component together
   - [ ] Test auto-touch + error strategies
   - [ ] Test form provider + error display
   - [ ] Write E2E tests with Playwright

**Deliverables**:

- ✅ Error component functional
- ✅ Error strategies working
- ✅ Integration tests passing
- ✅ Documentation with examples

**Success Criteria**:

- All error strategies work correctly
- Error component renders with WCAG compliance
- Integration tests cover common workflows
- E2E tests validate real-world usage

---

### Phase 3: Form Field Wrapper & Bundle (Week 4)

**Sprint Goal**: Create form field wrapper and bundle directives.

#### Tasks

1. **Form Field Component** (Priority: P0)
   - [ ] Create `form-field.component.ts` in secondary entry
   - [ ] Implement content projection
   - [ ] Integrate error component automatically
   - [ ] Add CSS custom properties for theming
   - [ ] Support disabled state styling
   - [ ] Write component tests (layout, error display)

2. **Bundle Exports** (Priority: P1)
   - [ ] Create convenience bundle in primary entry
   - [ ] Export all directives as `NgxSignalFormDirectives`
   - [ ] Export all components as `NgxSignalFormComponents`
   - [ ] Create full bundle `NgxSignalForms`
   - [ ] Update documentation with import examples

3. **Secondary Entry Points** (Priority: P1)
   - [ ] Configure `/form-field` entry point
   - [ ] Configure `/testing` entry point
   - [ ] Update `package.json` exports
   - [ ] Test tree-shaking works correctly

4. **Styling & Theming** (Priority: P2)
   - [ ] Document CSS custom properties
   - [ ] Create default theme
   - [ ] Create example theme variants
   - [ ] Test with Tailwind CSS
   - [ ] Test with Angular Material

**Deliverables**:

- ✅ Form field wrapper functional
- ✅ Bundle exports working
- ✅ Secondary entry points configured
- ✅ Theming documentation

**Success Criteria**:

- Form field wrapper reduces boilerplate
- Bundle imports work correctly
- Tree-shaking excludes unused code
- Custom theming works with popular frameworks

---

### Phase 4: Form Busy & Advanced Features (Week 5)

**Sprint Goal**: Implement form busy directive and advanced utilities.

#### Tasks

1. **Form Busy Directive** (Priority: P0)
   - [ ] Create `form-busy.directive.ts`
   - [ ] Implement `ariaBusy()` computed signal
   - [ ] Inject form provider for state
   - [ ] Add opt-out mechanism
   - [ ] Write unit tests (busy state, pending, submitting)

2. **Configuration Provider** (Priority: P0)
   - [ ] Create `config.provider.ts`
   - [ ] Define `NgxSignalFormsConfig` interface
   - [ ] Implement `provideNgxSignalFormsConfig()` function
   - [ ] Create `NGX_SIGNAL_FORMS_CONFIG` token
   - [ ] Add default configuration
   - [ ] Write unit tests (config injection, defaults)

3. **Advanced Utilities** (Priority: P1)
   - [ ] Create field state helpers
   - [ ] Create error transformation utilities
   - [ ] Add debug logging utilities
   - [ ] Write unit tests for all utilities

4. **Documentation** (Priority: P1)
   - [ ] Write API documentation with TypeDoc
   - [ ] Create usage examples for each feature
   - [ ] Write migration guide from manual approach
   - [ ] Create comparison guide vs ngx-vest-forms
   - [ ] Write best practices guide

**Deliverables**:

- ✅ Form busy directive functional
- ✅ Configuration system working
- ✅ Advanced utilities implemented
- ✅ Complete documentation

**Success Criteria**:

- Form busy state reflects validation/submission
- Configuration works globally and locally
- Documentation covers all features
- Examples are clear and actionable

---

### Phase 5: Testing & Polish (Week 6)

**Sprint Goal**: Comprehensive testing and production readiness.

#### Tasks

1. **Test Coverage** (Priority: P0)
   - [ ] Achieve >80% unit test coverage
   - [ ] Write integration tests for all workflows
   - [ ] Create E2E test suite with Playwright
   - [ ] Add accessibility tests with axe-core
   - [ ] Write visual regression tests

2. **Testing Utilities** (Priority: P1)
   - [ ] Create `test-helpers.ts` in `/testing` entry
   - [ ] Implement `createTestForm()` helper
   - [ ] Implement `mockFieldState()` helper
   - [ ] Add test matchers for common assertions
   - [ ] Write documentation for testing utilities

3. **Performance** (Priority: P1)
   - [ ] Audit bundle size
   - [ ] Optimize directive selectors
   - [ ] Profile computed signal performance
   - [ ] Test with large forms (100+ fields)
   - [ ] Document performance characteristics

4. **Documentation** (Priority: P0)
   - [ ] Complete API reference
   - [ ] Add usage examples for all features
   - [ ] Create migration guides
   - [ ] Write troubleshooting guide
   - [ ] Add FAQ section

5. **Release Preparation** (Priority: P0)
   - [ ] Create CHANGELOG.md
   - [ ] Write release notes
   - [ ] Tag v1.0.0-alpha.1
   - [ ] Publish to npm (alpha)
   - [ ] Gather community feedback

**Deliverables**:

- ✅ >80% test coverage
- ✅ Complete documentation
- ✅ Alpha release published
- ✅ Performance benchmarks

**Success Criteria**:

- All tests pass consistently
- Documentation is comprehensive
- Bundle size is optimized
- Ready for alpha release

---

## Pattern Adaptations from ngx-vest-forms

### What We're Adapting

ngx-vest-forms v2 (PR #52) provides excellent patterns for form enhancement that we can adapt to Signal Forms:

#### 1. Auto-ARIA Directive Pattern ✅

**From ngx-vest-forms**:

```typescript
@Directive({
  selector: 'input[control]:not([ngxVestFormAutoAriaDisabled])',
  host: {
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-describedby]': 'ariaDescribedBy()'
  }
})
```

**Adaptation for Signal Forms**: ✅ **Direct Port**

- Same selector strategy
- Same host bindings
- Uses Signal Forms field state instead of Vest.js

#### 2. Enhanced Field Signals API ❌

**From ngx-vest-forms**:

```typescript
// Auto-generated field accessors
form.email(); // Signal<string>
form.emailValid(); // Signal<boolean>
form.emailInvalid(); // Signal<boolean>
form.emailShowErrors(); // Signal<boolean>
form.setEmail($event); // Handles Event | string
```

**Adaptation for Signal Forms**: ❌ **NOT APPLICABLE**

- Signal Forms already provides field accessors
- `form.email()` returns full field state with `.invalid()`, `.valid()`, etc.
- No need for custom field signal generation

#### 3. Error Display Strategies ✅

**From ngx-vest-forms**:

```typescript
type ErrorDisplayStrategy = 'immediate' | 'on-touch' | 'on-submit' | 'manual';
```

**Adaptation for Signal Forms**: ✅ **Direct Port**

- Same strategy types
- Same logic patterns
- Uses Signal Forms state instead of Vest.js

#### 4. Form Field Wrapper Pattern ✅

**From ngx-vest-forms**:

```typescript
@Component({
  selector: 'ngx-vest-form-field',
  template: `
    <div class="form-field">
      <div class="content"><ng-content /></div>
      <ngx-form-error [field]="field()" />
    </div>
  `
})
```

**Adaptation for Signal Forms**: ✅ **Direct Port**

- Same wrapper pattern
- Same content projection
- Works with Signal Forms field state

#### 5. Safe Suite Wrappers ❌

**From ngx-vest-forms**:

```typescript
// staticSafeSuite/createSafeSuite to prevent only() bugs
const safeSuite = staticSafeSuite((data) => { ... });
```

**Adaptation for Signal Forms**: ❌ **NOT APPLICABLE**

- Vest.js-specific pattern
- Signal Forms doesn't have this issue
- Would be part of future `@ngx-signal-forms/vestjs` package

#### 6. Schema Integration Layer ❌

**From ngx-vest-forms**:

```typescript
// Two-layer validation: Schema + Vest
const schema = z.object({ ... });
const suite = staticSafeSuite((data) => { ... });
```

**Adaptation for Signal Forms**: ❌ **NOT APPLICABLE**

- Signal Forms already has native schema integration (Zod/Valibot)
- No need for separate layer
- Uses `validateStandardSchema()` directly

#### 7. Structured Error Parsing ⚠️

**From ngx-vest-forms**:

```typescript
parseStructuredError(error); // i18n-friendly error structure
```

**Adaptation for Signal Forms**: ⚠️ **PARTIAL ADAPTATION**

- Signal Forms errors are already structured (`kind`, `message`, `field`)
- Could add utility for i18n message lookup
- Lower priority for v1.0

#### 8. WCAG 2.2 Patterns ✅

**From ngx-vest-forms**:

- `role="alert"` for errors
- `aria-live` regions
- `aria-invalid` + `aria-describedby`
- Focus management

**Adaptation for Signal Forms**: ✅ **Direct Port**

- All WCAG patterns are framework-agnostic
- Same implementation approach
- Same accessibility requirements

### What We're NOT Adapting

#### 1. Vest.js Validation System ❌

- **Reason**: Signal Forms has its own validation API
- **Future**: Could be separate `@ngx-signal-forms/vestjs` package

#### 2. Custom Form Creation API ❌

- **Reason**: Signal Forms already provides `form()` function
- **Our Approach**: Enhance existing API via directives

#### 3. Field Signal Generation ❌

- **Reason**: Signal Forms already provides comprehensive field accessors
- **Our Approach**: Use native Signal Forms field state

#### 4. Test Suite Execution Tracking ❌

- **Reason**: Vest.js-specific feature
- **Not Needed**: Signal Forms handles this internally

#### 5. Safe Suite Wrappers ❌

- **Reason**: Vest.js-specific bug prevention
- **Not Needed**: Signal Forms doesn't have this issue

### Adaptation Summary

| Pattern                | Status            | Reason                                      |
| ---------------------- | ----------------- | ------------------------------------------- |
| Auto-ARIA Directive    | ✅ Direct Port    | Framework-agnostic, works with Signal Forms |
| Auto-Touch Directive   | ✅ Direct Port    | Framework-agnostic, works with Signal Forms |
| Error Strategies       | ✅ Direct Port    | Framework-agnostic logic                    |
| Form Field Wrapper     | ✅ Direct Port    | UI pattern, works with any form system      |
| Form Busy State        | ✅ Direct Port    | Uses Signal Forms `pending()` signal        |
| WCAG 2.2 Patterns      | ✅ Direct Port    | Accessibility is framework-agnostic         |
| Enhanced Field Signals | ❌ Not Needed     | Signal Forms already provides this          |
| Safe Suite Wrappers    | ❌ Not Applicable | Vest.js-specific                            |
| Schema Integration     | ❌ Not Needed     | Signal Forms has native support             |
| Structured Errors      | ⚠️ Partial        | Could add i18n utilities in future          |

---

## Angular ARIA & CDK Integration Opportunities

> **✅ STATUS: @angular/aria 21.0.0-next.8 is INSTALLED and ready to use!**
>
> This section documents how we leverage Angular ARIA's type utilities in our toolkit.

### What We Found

**Angular 21.0.0-next.8 introduces `@angular/aria` as a headless UI patterns library!**

Since this toolkit targets Angular 21+ next/experimental APIs, we **can and should** leverage `@angular/aria` from the same release.

#### Angular ARIA Package (`@angular/aria`) ✅ ALIGNED WITH OUR EXPERIMENTAL APPROACH

**What It Is**: Headless, signal-based accessibility pattern classes (NOT directives/components)

**Public API Exports** (from `@angular/aria/ui-patterns`):

- ✅ `ComboboxPattern` - Combobox/autocomplete with keyboard nav + typeahead
- ✅ `ListboxPattern` - Single/multi-select listbox with ARIA compliance
- ✅ `TreePattern` - Tree view with expand/collapse
- ✅ `AccordionPattern` - Accordion behavior
- ✅ `RadioGroupPattern` - Radio button group
- ✅ `TabsPattern` - Tab panel switching
- ✅ `ToolbarPattern` - Toolbar with focus management
- ✅ `SignalLike<T>` / `WritableSignalLike<T>` - Type utilities

**NOT Exported** (internal implementation):

- ❌ `KeyboardEventManager` / `PointerEventManager` - Internal behaviors
- ❌ `List`, `ListNavigation`, `ListSelection` - Internal behaviors
- ❌ Core behavior classes - Not part of public API

**Key Architecture**:

- **Signal-based inputs**: All inputs are `SignalLike<T>` (matches Signal Forms perfectly!)
- **Headless patterns**: You bring templates, they provide state/behavior
- **Framework-agnostic logic**: Pure TypeScript classes, only needs `@angular/core` signals
- **WCAG 2.2 compliant**: Angular team maintains accessibility patterns

#### What We CAN Use from @angular/aria (v1.0)

**1. SignalLike Type Utilities** ✅ **IMMEDIATE USE**

```typescript
import { SignalLike, WritableSignalLike } from '@angular/aria/ui-patterns';

// Use for type-safe signal inputs in our directives/utilities
export interface NgxSignalFormsConfig {
  defaultErrorStrategy?: SignalLike<ErrorDisplayStrategy>;
  fieldNameResolver?: SignalLike<(element: HTMLElement) => string | null>;
  // ... other config options
}
```

**Why use this?**

- Aligns with Angular's official signal types
- More flexible than `Signal<T>` (accepts any callable returning T)
- Consistent with `@angular/aria` patterns
- Zero runtime overhead (just TypeScript types)

**2. For Form Field Wrapper** ⚠️ **CONSIDER FOR v1.0**

Our form field wrapper component could benefit from `@angular/aria` types:

```typescript
import { SignalLike } from '@angular/aria/ui-patterns';

@Component({
  selector: 'ngx-signal-form-field',
  // ...
})
export class NgxSignalFormFieldComponent {
  // Accept signals or computed signals
  field = input.required<SignalLike<FieldState<any>>>();
  errorStrategy = input<SignalLike<ErrorDisplayStrategy>>();
  showLabel = input<SignalLike<boolean>>();
}
```

**Benefits**:

- More flexible than requiring `Signal<T>` specifically
- Users can pass signals, computed signals, or plain functions
- Aligns with Angular ARIA patterns

#### What We CANNOT Use (Not Exported)

**Internal Behaviors** ❌

- `KeyboardEventManager` - Would be useful for custom keyboard handling
- `List` behavior - Would be useful for custom listbox/select
- Event managers - Internal implementation details

**Our Alternative**: Build our own lightweight event handling for v1.0

#### Integration Strategy

**v1.0 (Directive-Based Toolkit) - Current Scope**:

✅ **DO USE** (available now):

- `SignalLike<T>` / `WritableSignalLike<T>` types for our API
- Add `@angular/aria` as peer dependency (same as `@angular/core`)
- Align type signatures with Angular ARIA conventions

❌ **DO NOT USE** (out of scope):

- Pattern classes (`ComboboxPattern`, `ListboxPattern`, etc.)
- Reason: These are for building **new form components**, not enhancing existing inputs
- Our v1.0 focuses on **directive-based enhancement** of native HTML inputs

**Why this makes sense**:

1. **Our scope**: Enhance native `<input>`, `<textarea>`, `<select>` with directives
2. **ARIA patterns scope**: Build custom components (autocomplete, multiselect, etc.)
3. **No overlap**: They complement each other perfectly

**v1.1+ (Optional Advanced Components)**:

✅ **THEN USE** pattern classes when building custom components:

- `<ngx-autocomplete>` using `ComboboxPattern` + Signal Forms
- `<ngx-multiselect>` using `ListboxPattern` + Signal Forms
- `<ngx-radio-group>` using `RadioGroupPattern` + Signal Forms

**But this is optional** - Users can build these themselves using `@angular/aria` directly

#### Angular CDK Accessibility (`@angular/cdk/a11y`) ⚠️

**CDK Features Still Relevant**:

1. **LiveAnnouncer** ⚠️ - Could enhance form announcements
   - Use case: Announce form submission success/errors
   - Status: Consider for v1.1+ (our `role="alert"` sufficient for v1.0)

2. **Styling Utilities** ⚠️ - Useful for visually-hidden text
   - Use case: Screen reader-only error descriptions
   - Status: Document for advanced users

3. **FocusMonitor/FocusTrap/ListKeyManager** ❌ - Not needed
   - `@angular/aria` patterns handle focus management better
   - Only relevant for complex components (not basic form inputs)

### Integration Summary

| Package/Feature            | Relevance | v1.0 Decision                           | Usage                                |
| -------------------------- | --------- | --------------------------------------- | ------------------------------------ |
| **@angular/aria Types**    | **HIGH**  | ✅ **USE** as peer dependency           | Type utilities for API design        |
| `SignalLike<T>`            | High      | ✅ Use for config & utilities           | Flexible signal input types          |
| `WritableSignalLike<T>`    | High      | ✅ Use for mutable signal inputs        | Two-way signal bindings              |
| **@angular/aria Patterns** | **LOW**   | ❌ Out of scope (for custom components) | Not needed for directive enhancement |
| `ComboboxPattern`          | N/A       | ❌ Not relevant to v1.0                 | v1.1+ if building autocomplete       |
| `ListboxPattern`           | N/A       | ❌ Not relevant to v1.0                 | v1.1+ if building multiselect        |
| `RadioGroupPattern`        | N/A       | ❌ Not relevant to v1.0                 | v1.1+ if building radio group        |
| **CDK a11y Utilities**     | **LOW**   | ❌ No dependency needed                 | Document for advanced users          |
| `LiveAnnouncer`            | Low       | ❌ Not needed (role="alert" sufficient) | Document for consumers               |
| Styling utilities          | Low       | ❌ Not needed in library                | Document for consumers               |

### Integration Summary

| Package/Feature            | Relevance | v1.0 Decision                           | Status                               |
| -------------------------- | --------- | --------------------------------------- | ------------------------------------ |
| **@angular/aria Types**    | **HIGH**  | ✅ **USE** (already installed)          | Type utilities for API design        |
| `SignalLike<T>`            | High      | ✅ Use for config & utilities           | Flexible signal input types          |
| `WritableSignalLike<T>`    | High      | ✅ Use for mutable signal inputs        | Two-way signal bindings              |
| **@angular/aria Patterns** | **LOW**   | ❌ Out of scope (for custom components) | Not needed for directive enhancement |
| `ComboboxPattern`          | N/A       | ❌ Not relevant to v1.0                 | v1.1+ if building autocomplete       |
| `ListboxPattern`           | N/A       | ❌ Not relevant to v1.0                 | v1.1+ if building multiselect        |
| `RadioGroupPattern`        | N/A       | ❌ Not relevant to v1.0                 | v1.1+ if building radio group        |
| **CDK a11y Utilities**     | **LOW**   | ❌ No dependency needed                 | Document for advanced users          |
| `LiveAnnouncer`            | Low       | ❌ Not needed (role="alert" sufficient) | Document for consumers               |
| Styling utilities          | Low       | ❌ Not needed in library                | Document for consumers               |

### Recommendations

**v1.0 (Directive-Based Enhancement Toolkit)**:

✅ **@angular/aria is already installed** - Ready to use!

**Current package.json status**:

```json
{
  "dependencies": {
    "@angular/aria": "21.0.0-next.8"
  }
}
```

✅ **IMMEDIATE: Use `SignalLike<T>` types in our API**:

```typescript
import { SignalLike, WritableSignalLike } from '@angular/aria/ui-patterns';

// In our config provider
export interface NgxSignalFormsConfig {
  autoAria?: boolean;
  defaultErrorStrategy?: SignalLike<ErrorDisplayStrategy>;
  fieldNameResolver?: SignalLike<(el: HTMLElement) => string | null>;
}

// In our utilities
export function computeShowErrors(field: SignalLike<FieldState<any>>, strategy: SignalLike<ErrorDisplayStrategy>, hasSubmitted: SignalLike<boolean>): Signal<boolean> {
  return computed(() => {
    const f = typeof field === 'function' ? field() : field;
    // ... implementation
  });
}
```

**Why this makes sense**:

1. ✅ **Aligns with Angular's signal conventions** - Same types as `@angular/aria`
2. ✅ **More flexible than `Signal<T>`** - Accepts signals, computed signals, or plain functions
3. ✅ **Zero runtime overhead** - Just TypeScript types
4. ✅ **Future-proof** - When users build custom components with ARIA patterns, type system aligns

❌ **DO NOT USE pattern classes** (`ComboboxPattern`, `ListboxPattern`, etc.):

- **Reason**: These are for building custom form components (autocomplete, multiselect)
- **Our scope**: Enhance native HTML inputs (`<input>`, `<textarea>`, `<select>`)
- **Result**: No code overlap, perfect separation of concerns

✅ **DO DOCUMENT @angular/aria** for users building custom components:

```markdown
## Advanced: Custom Form Components

If you need custom form components (autocomplete, multiselect, etc.),
consider using `@angular/aria` patterns alongside Signal Forms:

- `ComboboxPattern` for autocomplete fields
- `ListboxPattern` for custom select/multiselect
- `RadioGroupPattern` for radio groups with keyboard navigation

These patterns work seamlessly with Signal Forms validation!
```

**v1.1+ (Optional)**: If users request it, we _could_ add convenience components, but this is **NOT required** - users can build these themselves using `@angular/aria` + our toolkit.

**Key Insight**: `@angular/aria` types are **perfect** for v1.0! They provide official signal type utilities that make our API more flexible and align with Angular's patterns. The pattern classes (ComboboxPattern, etc.) are out of scope for directive-based enhancement but complement our toolkit perfectly.

---

## Risk Assessment & Mitigation

### Technical Risks

#### 1. Signal Forms API Instability ⚠️ HIGH

**Risk**: Signal Forms is experimental in Angular 21. API could change.

**Mitigation**:

- ✅ **Version constraints**: Specify `@angular/forms` peer dependency `>=21.0.0 <22.0.0`
- ✅ **Warning in docs**: Clearly state experimental status
- ✅ **Adapter pattern**: Keep Signal Forms integration isolated for easy updates
- ✅ **Community monitoring**: Track Angular team's Signal Forms development

**Impact**: HIGH | **Probability**: MEDIUM | **Priority**: P0

#### 2. Directive Selector Conflicts ⚠️ MEDIUM

**Risk**: `[control]` selector could conflict with other libraries.

**Mitigation**:

- ✅ **Opt-out mechanism**: `ngxSignalFormAutoAriaDisabled` attribute
- ✅ **Global config**: Allow disabling auto-directives globally
- ✅ **Documentation**: Clear examples of conflict resolution
- ✅ **Test suite**: Cover edge cases with multiple directives

**Impact**: MEDIUM | **Probability**: LOW | **Priority**: P1

#### 3. Performance with Large Forms ⚠️ MEDIUM

**Risk**: Computed signals could cause performance issues with 100+ fields.

**Mitigation**:

- ✅ **Benchmark suite**: Test with large forms (100, 500, 1000 fields)
- ✅ **Lazy computation**: Use `computed()` for reactive updates only
- ✅ **Profiling**: Identify and optimize hot paths
- ✅ **Documentation**: Performance best practices guide

**Impact**: MEDIUM | **Probability**: LOW | **Priority**: P1

#### 4. Field Name Resolution Failures ⚠️ MEDIUM

**Risk**: 4-tier field resolution might fail for complex forms.

**Mitigation**:

- ✅ **Strict mode**: Throw errors in dev mode for unresolved fields
- ✅ **Custom resolver**: Allow users to provide custom resolution logic
- ✅ **Explicit override**: `data-signal-field` attribute for edge cases
- ✅ **Debug logging**: Detailed logs in dev mode

**Impact**: MEDIUM | **Probability**: MEDIUM | **Priority**: P0

### Dependency Risks

#### 1. Angular Version Compatibility ⚠️ HIGH

**Risk**: Breaking changes in Angular could affect our directives.

**Mitigation**:

- ✅ **Peer dependencies**: Specify exact Angular version range
- ✅ **CI matrix**: Test against multiple Angular versions
- ✅ **Update policy**: Document supported Angular versions
- ✅ **Deprecation notices**: Proactive migration guides

**Impact**: HIGH | **Probability**: MEDIUM | **Priority**: P0

#### 2. TypeScript Compatibility ⚠️ LOW

**Risk**: TypeScript updates could break type inference.

**Mitigation**:

- ✅ **Type tests**: Comprehensive type assertion tests
- ✅ **Version constraint**: Specify TypeScript range
- ✅ **CI checks**: Run type checking in CI

**Impact**: MEDIUM | **Probability**: LOW | **Priority**: P2

### Adoption Risks

#### 1. Developer Learning Curve ⚠️ MEDIUM

**Risk**: Developers might not understand when/how to use directives.

**Mitigation**:

- ✅ **Progressive adoption**: Document 5-level learning path
- ✅ **Examples**: Real-world examples for each use case
- ✅ **Migration guide**: Clear steps from manual to toolkit
- ✅ **Video tutorials**: Screencast demonstrations

**Impact**: MEDIUM | **Probability**: MEDIUM | **Priority**: P1

#### 2. Community Adoption ⚠️ MEDIUM

**Risk**: Signal Forms might not gain traction in Angular community.

**Mitigation**:

- ✅ **Blog posts**: Publish usage guides and comparisons
- ✅ **Talks**: Present at Angular conferences
- ✅ **GitHub Discussions**: Active community engagement
- ✅ **Comparisons**: Show benefits vs Reactive/Template-driven forms

**Impact**: MEDIUM | **Probability**: MEDIUM | **Priority**: P1

### Mitigation Summary

| Risk Category | Total Risks | HIGH Priority | MEDIUM Priority | LOW Priority |
| ------------- | ----------- | ------------- | --------------- | ------------ |
| Technical     | 4           | 2             | 2               | 0            |
| Dependency    | 2           | 1             | 0               | 1            |
| Adoption      | 2           | 0             | 2               | 0            |

---

## Success Metrics

### Code Quality Metrics

- ✅ **Test Coverage**: >80% for all code
- ✅ **Type Safety**: 100% TypeScript strict mode
- ✅ **Bundle Size**: <15KB gzipped for core
- ✅ **Performance**: <1ms overhead per field

### Accessibility Metrics

- ✅ **WCAG 2.2 Level AA**: 100% compliance
- ✅ **axe-core violations**: 0 critical/serious issues
- ✅ **Screen reader testing**: Compatible with NVDA, JAWS, VoiceOver
- ✅ **Keyboard navigation**: Full support

### Developer Experience Metrics

- ✅ **Code reduction**: >50% less boilerplate vs manual
- ✅ **API simplicity**: <5 imports for basic usage
- ✅ **Documentation**: 100% API coverage
- ✅ **Examples**: >10 real-world scenarios

### Community Metrics (6 months post-launch)

- ✅ **npm downloads**: >1,000/month
- ✅ **GitHub stars**: >100
- ✅ **Issues resolved**: >80% within 7 days
- ✅ **Community PRs**: >5 accepted

---

## Timeline & Resources

### Development Schedule

| Phase                         | Duration | Start  | End    | Team Size |
| ----------------------------- | -------- | ------ | ------ | --------- |
| Phase 1: Foundation           | 2 weeks  | Week 1 | Week 2 | 1-2 devs  |
| Phase 2: Error Display        | 1 week   | Week 3 | Week 3 | 1-2 devs  |
| Phase 3: Form Field Wrapper   | 1 week   | Week 4 | Week 4 | 1-2 devs  |
| Phase 4: Form Busy & Advanced | 1 week   | Week 5 | Week 5 | 1-2 devs  |
| Phase 5: Testing & Polish     | 1 week   | Week 6 | Week 6 | 1-2 devs  |

**Total Timeline**: 6 weeks

### Resource Requirements

**Development Team**:

- 1 Senior Angular Developer (full-time)
- 1 Angular Developer (part-time, testing/docs)

**Optional**:

- 1 Accessibility Expert (consultation, 2-3 hours)
- 1 Technical Writer (documentation, 5-10 hours)

### Milestones

- **Week 2**: Core directives functional
- **Week 3**: Error display system complete
- **Week 4**: Form field wrapper ready
- **Week 5**: All features implemented
- **Week 6**: Alpha release published

---

## Conclusion

### What We're Building

A **zero-intrusive enhancement toolkit** for Angular 21+ Signal Forms that provides automatic accessibility, error display strategies, and form field wrappers through directives, components, and utilities.

**Key Integration**: Leverages `@angular/aria` (21.0.0-next.8) type utilities (`SignalLike<T>`) for flexible, Angular-aligned API design.

### Key Deliverables

1. ✅ **Core Directives**: Auto-ARIA, Auto-Touch, Form Busy, Form Provider (using SignalLike types)
2. ✅ **Components**: Error display, Form field wrapper (with SignalLike inputs)
3. ✅ **Utilities**: Error strategies, field resolution, testing helpers (SignalLike parameters)
4. ✅ **Configuration**: Global config provider (SignalLike configuration values)
5. ✅ **Documentation**: Complete API reference + examples + @angular/aria integration guide

### Success Criteria

- ✅ >80% code reduction vs manual approach
- ✅ 100% WCAG 2.2 Level AA compliance
- ✅ >80% test coverage
- ✅ <15KB gzipped bundle size
- ✅ Alpha release within 6 weeks

### Next Steps

**IMMEDIATE (Week 1) - @angular/aria Integration**:

1. ✅ **@angular/aria is installed** (21.0.0-next.8) - Ready to use!
2. **Update type signatures**:
   - [ ] Import `SignalLike<T>` and `WritableSignalLike<T>` from `@angular/aria`
   - [ ] Update `NgxSignalFormsConfig` interface to use SignalLike types
   - [ ] Update `computeShowErrors()` utility to accept SignalLike parameters
   - [ ] Update form field component inputs to accept SignalLike
3. **Setup infrastructure** (Phase 1):
   - [ ] Create `packages/toolkit` structure
   - [ ] Configure project with Nx
   - [ ] Setup TypeScript with SignalLike imports

**Week 1-2**: Implement core directives with SignalLike types
**Week 3-4**: Build error display and form field wrapper
**Week 5-6**: Testing, documentation, alpha release
**Post-launch**: Gather feedback, iterate, prepare v1.0.0

---

## Appendix

### Related Documents

- [SIGNAL_FORMS_ENHANCEMENT_LIBRARY.md](../docs/SIGNAL_FORMS_ENHANCEMENT_LIBRARY.md) - Original vision document
- [ngx-vest-forms PR #52](https://github.com/ngx-vest-forms/ngx-vest-forms/pull/52) - Pattern reference
- [Angular Signal Forms Guide](https://www.codigotipado.com/p/mastering-angular-21-signal-forms)

### Reference Links

- [Angular Signal Forms API](https://angular.dev/api/forms/signals)
- [WCAG 2.2 Guidelines](https://www.w3.org/TR/WCAG22/)
- [Angular CDK Accessibility](https://material.angular.dev/cdk/a11y/overview)

### Glossary

- **Signal Forms**: Angular 21+ experimental API for reactive forms using signals
- **WCAG 2.2**: Web Content Accessibility Guidelines version 2.2
- **ARIA**: Accessible Rich Internet Applications
- **DI**: Dependency Injection
- **CDK**: Angular Component Dev Kit
- **E2E**: End-to-End (testing)
