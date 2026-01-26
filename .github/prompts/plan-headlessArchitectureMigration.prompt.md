# Plan: Headless Architecture Migration

**TL;DR**: Extract renderless primitives from existing components to enable custom form-field implementations. Create new `@ngx-signal-forms/toolkit/headless` secondary entry point with state-only directives/utilities while keeping current styled components intact.

## Steps

### 1. Create headless secondary entry point

**Files to create**:

- `packages/toolkit/headless/public_api.ts`
- `packages/toolkit/headless/ng-package.json`
- `packages/toolkit/headless/package.json`

This creates import path: `@ngx-signal-forms/toolkit/headless`

### 2. Extract NgxHeadlessErrorStateDirective

**Source**: `packages/toolkit/core/components/form-error.component.ts`
**Target**: `packages/toolkit/headless/error-state.directive.ts`

Exposes signals without rendering:

```typescript
@Directive({
  selector: '[ngxHeadlessErrorState]',
  exportAs: 'errorState',
})
export class NgxHeadlessErrorStateDirective<TValue = unknown> {
  // Inputs
  readonly formField = input.required<FieldTree<TValue>>();
  readonly fieldName = input.required<string>();
  readonly strategy = input<ReactiveOrStatic<ErrorDisplayStrategy>>();
  readonly submittedStatus = input<ReactiveOrStatic<SubmittedStatus>>();

  // Exposed signals (public API for custom templates)
  readonly showErrors: Signal<boolean>;
  readonly showWarnings: Signal<boolean>;
  readonly errors: Signal<ValidationError[]>;
  readonly warnings: Signal<ValidationError[]>;
  readonly resolvedErrors: Signal<{ kind: string; message: string }[]>;
  readonly resolvedWarnings: Signal<{ kind: string; message: string }[]>;
  readonly hasErrors: Signal<boolean>;
  readonly hasWarnings: Signal<boolean>;
  readonly errorId: Signal<string>;
  readonly warningId: Signal<string>;
}
```

**Usage Example**:

```html
<div
  ngxHeadlessErrorState
  #errorState="errorState"
  [formField]="form.email"
  fieldName="email"
>
  @if (errorState.showErrors() && errorState.hasErrors()) {
  <my-custom-error-display [errors]="errorState.resolvedErrors()" />
  }
</div>
```

### 3. Extract NgxHeadlessFieldsetDirective

**Source**: `packages/toolkit/form-field/form-fieldset.component.ts`
**Target**: `packages/toolkit/headless/fieldset.directive.ts`

Exposes aggregated error state for field groups:

```typescript
@Directive({
  selector: '[ngxHeadlessFieldset]',
  exportAs: 'fieldset',
})
export class NgxHeadlessFieldsetDirective<TValue = unknown> {
  readonly formField = input.required<FieldTree<TValue>>();
  readonly fieldName = input.required<string>();

  // Exposed signals
  readonly aggregatedErrors: Signal<ValidationError[]>;
  readonly aggregatedWarnings: Signal<ValidationError[]>;
  readonly hasErrors: Signal<boolean>;
  readonly hasWarnings: Signal<boolean>;
  readonly errorSummary: Signal<{ kind: string; message: string }[]>;
}
```

### 4. Create NgxHeadlessCharacterCountDirective

**Source**: `packages/toolkit/form-field/form-field-character-count.component.ts`
**Target**: `packages/toolkit/headless/character-count.directive.ts`

Exposes character count state:

```typescript
@Directive({
  selector: '[ngxHeadlessCharacterCount]',
  exportAs: 'charCount',
})
export class NgxHeadlessCharacterCountDirective<TValue = unknown> {
  readonly formField = input.required<FieldTree<TValue>>();
  readonly maxLength = input<number>();

  // Exposed signals
  readonly currentLength: Signal<number>;
  readonly resolvedMaxLength: Signal<number | undefined>;
  readonly remaining: Signal<number | undefined>;
  readonly limitState: Signal<'ok' | 'warning' | 'danger' | 'exceeded'>;
  readonly hasLimit: Signal<boolean>;
}
```

**Usage Example**:

```html
<div ngxHeadlessCharacterCount #charCount="charCount" [formField]="form.bio">
  <span [class.exceeded]="charCount.limitState() === 'exceeded'">
    {{ charCount.currentLength() }} / {{ charCount.resolvedMaxLength() }}
  </span>
</div>
```

### 5. Create ngxFieldName directive

**Target**: `packages/toolkit/headless/field-name.directive.ts`

Auto-resolves field name from DOM or generates unique ID:

```typescript
@Directive({
  selector: '[ngxFieldName]',
  exportAs: 'fieldName',
})
export class NgxFieldNameDirective {
  readonly fieldName = input<string>('ngxFieldName');

  // Auto-resolved from DOM id attribute or auto-generated
  readonly resolvedFieldName: Signal<string>;
  readonly errorId: Signal<string>;
  readonly warningId: Signal<string>;
}
```

### 6. Refactor existing components to use headless primitives

**Files to update**:

- `packages/toolkit/core/components/form-error.component.ts`
- `packages/toolkit/form-field/form-field.component.ts`
- `packages/toolkit/form-field/form-fieldset.component.ts`
- `packages/toolkit/form-field/form-field-character-count.component.ts`

Refactor to internally compose headless directives. This ensures:

- Single source of truth for logic
- Existing API remains unchanged (non-breaking)
- Styled components become thin wrappers around headless primitives

---

## Further Considerations

### 1. Separate package or secondary entry?

**Options**:

- A: Separate package (`@ngx-signal-forms/headless`)
- B: Secondary entry point (`@ngx-signal-forms/toolkit/headless`)

**Recommendation**: Option B (Secondary entry)

- Single install for users
- Shared internal utilities
- Simpler versioning (single package version)
- Tree-shakable (only imported code is bundled)

### 2. Directive vs utility function approach?

**Options**:

- A: Directives only (template-focused)
- B: Utility functions only (programmatic)
- C: Both (maximum flexibility)

**Recommendation**: Option C (Both)

- Directives: Template integration, DI composition, `exportAs` for template refs
- Utilities: Programmatic use, testing, custom directive creation

Example utility:

```typescript
// Utility function for programmatic use
export function createErrorState<T>(
  formField: FieldTree<T>,
  fieldName: string,
  options?: ErrorStateOptions,
): ErrorStateSignals<T>;
```

### 3. Bundle or individual exports?

Should we provide a convenience bundle like `NgxSignalFormToolkit`?

**Recommendation**: Yes, provide both:

```typescript
// Individual exports
export { NgxHeadlessErrorStateDirective } from './error-state.directive';
export { NgxHeadlessFieldsetDirective } from './fieldset.directive';
export { NgxHeadlessCharacterCountDirective } from './character-count.directive';
export { NgxFieldNameDirective } from './field-name.directive';

// Convenience bundle
export const NgxHeadlessToolkit = [
  NgxHeadlessErrorStateDirective,
  NgxHeadlessFieldsetDirective,
  NgxHeadlessCharacterCountDirective,
  NgxFieldNameDirective,
] as const;
```

### 4. Naming convention

Should headless directives use `ngxHeadless*` prefix or shorter names?

**Options**:

- A: `ngxHeadlessErrorState` - explicit, verbose
- B: `ngxErrorState` - shorter, assumes context
- C: `[ngxsfErrorState]` - namespaced abbreviation

**Recommendation**: Option A (`ngxHeadless*`)

- Clear distinction from styled components
- Explicit about headless nature
- Aligns with library naming (`ngx-signal-forms`)

---

## File Structure After Migration

```
packages/toolkit/
├── core/
│   ├── components/
│   │   └── form-error.component.ts      # Uses NgxHeadlessErrorStateDirective
│   └── ...
├── form-field/
│   ├── form-field.component.ts          # Uses headless primitives
│   ├── form-fieldset.component.ts       # Uses NgxHeadlessFieldsetDirective
│   └── form-field-character-count.ts    # Uses NgxHeadlessCharacterCountDirective
├── headless/                            # NEW: Secondary entry point
│   ├── ng-package.json
│   ├── package.json
│   ├── public_api.ts
│   ├── error-state.directive.ts
│   ├── fieldset.directive.ts
│   ├── character-count.directive.ts
│   ├── field-name.directive.ts
│   └── utilities/
│       ├── create-error-state.ts
│       ├── create-character-count.ts
│       └── index.ts
└── ...
```

---

## Checklist for Headless Migration

### Phase 1: Create Entry Point

- [ ] Create `packages/toolkit/headless/ng-package.json`
- [ ] Create `packages/toolkit/headless/package.json`
- [ ] Create `packages/toolkit/headless/public_api.ts`
- [ ] Update `packages/toolkit/ng-package.json` to include secondary entry

### Phase 2: Extract Directives

- [ ] Create `NgxHeadlessErrorStateDirective`
- [ ] Create `NgxHeadlessFieldsetDirective`
- [ ] Create `NgxHeadlessCharacterCountDirective`
- [ ] Create `NgxFieldNameDirective`
- [ ] Write unit tests for all headless directives

### Phase 3: Create Utilities

- [ ] Create `createErrorState()` utility
- [ ] Create `createCharacterCount()` utility
- [ ] Write unit tests for utilities

### Phase 4: Refactor Existing Components

- [ ] Refactor `NgxSignalFormErrorComponent` to use headless directive
- [ ] Refactor `NgxSignalFormFieldComponent` to use headless primitives
- [ ] Refactor `NgxSignalFormFieldsetComponent` to use headless directive
- [ ] Refactor `NgxSignalFormFieldCharacterCountComponent` to use headless directive
- [ ] Verify all existing tests still pass

### Phase 5: Documentation

- [ ] Update README.md with headless usage examples
- [ ] Add JSDoc to all headless exports
- [ ] Create migration guide for custom implementations
- [ ] Update ROADMAP.md with completed headless items
