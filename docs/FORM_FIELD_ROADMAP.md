# Form Field Component Roadmap

**Last Updated:** October 20, 2025
**Status:** Planning Phase

## Executive Summary

Analysis of Figma designs and current `@ngx-signal-forms/toolkit/form-field` implementation reveals opportunities for enhancement. This document outlines a phased approach to improve the form field component while maintaining API stability and backward compatibility.

---

## Current State ✅

### What We Have (v1.0)

1. **Standard Layout** - Vertical label above input with optional styling via CSS custom properties
2. **Outlined Layout** - Floating label inside container (Material Design style) via `outline` directive
3. **Character Count Component** - Progressive color states (ok → warning → danger → exceeded)
4. **Hint Component** - Helper text with position control
5. **60+ CSS Custom Properties** - Extensive theming capabilities
6. **Auto-Required Marker** - CSS `:has()` selector-based detection with customizable character
7. **WCAG 2.2 Level AA Compliance** - Built-in accessibility
8. **Error Display Integration** - Automatic error/warning display with configurable strategies
9. **Prefix/Suffix Slots** - Icons or text adornments via `prefix`/`suffix` attributes

### Architecture

```
NgxSignalFormFieldComponent
├── Content projection (label + input)
├── NgxFloatingLabelDirective (optional, selector: outline)
├── NgxSignalFormFieldHintComponent (optional)
├── NgxSignalFormFieldCharacterCountComponent (optional)
└── NgxSignalFormErrorComponent (automatic)
```

---

## Figma Design Analysis 🎨

**Key Observations:**

1. ✅ Label above input (implemented)
2. ✅ Focus states with border color changes (implemented)
3. ✅ Error states with red borders (implemented)
4. 📝 Description text between label and input (gap)
5. ✅ Icons inside inputs (prefix/suffix) (implemented)
6. 📝 Select dropdowns with custom chevrons (gap)
7. ✅ Disabled states (implemented)
8. 📝 Readonly states (partial - needs visual distinction)
9. 📝 Checkbox/radio groups (not in scope)
10. 📝 Toggle switches (not in scope)

---

## Roadmap Overview

| Version  | Focus                           | Timeline   | Status   |
| -------- | ------------------------------- | ---------- | -------- |
| **v1.0** | Core form field wrapper         | ✅ Shipped | Complete |
| **v1.1** | Polish & configuration          | Q4 2025    | Planned  |
| **v1.x** | Enhanced content projection     | Q1 2026    | Proposed |
| **v2.0** | Input groups & advanced layouts | Q2 2026+   | Future   |

---

## Version 1.1 Plan (Next Release)

**Goal:** Add global configuration and improve developer experience without breaking changes.

### Features

#### 1. Global Configuration Provider ⭐⭐⭐

**Priority:** High | **Effort:** Medium (2-3 hours)

**Problem:**
Currently, developers must configure options per-field. No way to set project-wide defaults.

**Solution:**

```typescript
// Proposed API
export interface NgxFormFieldConfig {
  /** Whether to show required marker by default */
  showRequiredMarkerByDefault: boolean;

  /** Default required marker character */
  defaultRequiredMarker: string;

  /** Default error display strategy for fields */
  defaultErrorStrategy: ErrorDisplayStrategy;

  /** Auto-add novalidate to forms */
  autoAddNoValidate: boolean;
}

// Provider function
export function provideNgxSignalFormsConfig(
  ...features: NgxSignalFormsFeature[]
): EnvironmentProviders;

// Feature function for form field config
export function withFormField(
  config: Partial<NgxFormFieldConfig>,
): NgxSignalFormsFeature;
```

**Usage:**

```typescript
// app.config.ts
import {
  provideNgxSignalFormsConfig,
  withFormField,
} from '@ngx-signal-forms/toolkit';

export const appConfig: ApplicationConfig = {
  providers: [
    provideNgxSignalFormsConfig(
      withFormField({
        showRequiredMarkerByDefault: true,
        defaultRequiredMarker: ' *',
        autoAddNoValidate: true,
      }),
    ),
  ],
};
```

**Implementation Notes:**

- Extends existing `provideNgxSignalFormsConfig` from core package
- Uses feature flag pattern (`withFormField()`)
- Backward compatible (all config optional)
- Component reads config via `inject(NGX_FORM_FIELD_CONFIG, { optional: true })`

---

#### 2. Enhanced Readonly State Styling ⭐⭐

**Priority:** Medium | **Effort:** Low (30 minutes)

**Problem:**
Readonly inputs look identical to editable inputs. Users can't distinguish at a glance.

**Solution:**

```scss
// Add to form-field.component.scss

// Readonly state for standard layout
:host ::ng-deep input[readonly],
:host ::ng-deep textarea[readonly],
:host ::ng-deep select[readonly] {
  background-color: var(--ngx-form-field-input-readonly-bg, #f9fafb);
  border-color: var(--ngx-form-field-input-readonly-border, #e5e7eb);
  cursor: not-allowed;
}

// Readonly state for outlined layout
:host(.ngx-floating-label) .ngx-signal-form-field__content:has(input[readonly]),
:host(.ngx-floating-label)
  .ngx-signal-form-field__content:has(textarea[readonly]) {
  background-color: var(--ngx-form-field-outline-readonly-bg, #f9fafb);
  border-color: var(--ngx-form-field-outline-readonly-border, #e5e7eb);
  cursor: not-allowed;
}
```

**New CSS Custom Properties:**

- `--ngx-form-field-input-readonly-bg`
- `--ngx-form-field-input-readonly-border`
- `--ngx-form-field-outline-readonly-bg`
- `--ngx-form-field-outline-readonly-border`

---

#### 3. Better Select Styling ⭐⭐

**Priority:** Medium | **Effort:** Low (1 hour)

**Problem:**
Native `<select>` dropdowns use browser-default chevron, inconsistent across platforms.

**Solution:**

```scss
// Auto-style select elements in outlined layout
:host(.ngx-floating-label) ::ng-deep select {
  appearance: none;
  padding-right: 2.5rem;
  background-image: var(
    --ngx-form-field-outline-select-chevron,
    url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6L8 10L12 6" stroke="%23324155" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>')
  );
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1rem;
  cursor: pointer;
}

// Standard layout
:host ::ng-deep select {
  appearance: none;
  padding-right: 2.5rem;
  background-image: var(
    --ngx-form-field-select-chevron,
    url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6L8 10L12 6" stroke="%23324155" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>')
  );
  background-position: right 0.75rem center;
  background-repeat: no-repeat;
  background-size: 1rem;
  cursor: pointer;
}
```

**New CSS Custom Properties:**

- `--ngx-form-field-select-chevron` (standard layout)
- `--ngx-form-field-outline-select-chevron` (outlined layout)

---

### Breaking Changes

**None.** All changes are additive and backward compatible.

---

## Version 1.x Plan (Future Minor)

**Goal:** Enhanced content projection for richer input compositions.

### Features Under Consideration

#### 1. Description Component 📝

**Priority:** TBD | **Effort:** Low (1-2 hours)

**Question:**
Should this be v1.1 or v1.x? Description text is common in forms but not critical.

**Proposed API:**

```html
<!-- Option A: Separate component -->
<ngx-signal-form-field [formField]="form.email" outline>
  <label for="email">Email Address</label>
  <ngx-signal-form-field-description>
    Enter the email you use for business communications
  </ngx-signal-form-field-description>
  <input id="email" [formField]="form.email" />
</ngx-signal-form-field>

<!-- Option B: Slot-based (more flexible) -->
<ngx-signal-form-field [formField]="form.email" outline>
  <label for="email">Email Address</label>
  <span slot="description"
    >Enter the email you use for business communications</span
  >
  <input id="email" [formField]="form.email" />
</ngx-signal-form-field>
```

**Implementation:**

- Projects between label and input
- Lighter color than label (matches Figma designs)
- Links to input via `aria-describedby`
- CSS custom properties for theming

**Recommendation:** Include in v1.1 if effort allows, otherwise defer to v1.x.

---

#### 2. Prefix/Suffix Slots (Shipped) ✅

Prefix/suffix support has shipped and can be used with the `prefix`/`suffix`
attributes on projected elements. See the form-field README for examples.

---

### Naming Consideration: Rename Directive File?

**Current:** `floating-label.directive.ts` (selector: `ngx-signal-form-field[outline]`)
**Question:** Should we rename the file to `outline.directive.ts` to match the selector?

**Pros:**

- File name matches attribute name (`outline`)
- More discoverable for developers
- Clearer intent ("outline" is more descriptive than "floating label")

**Cons:**

- Requires update to imports across codebase
- May confuse existing users familiar with "floating label" terminology
- "Floating label" is industry-standard term (Material Design, etc.)

**Recommendation:**
**Keep current file name.** Rationale:

1. "Floating label" is the design pattern name (widely recognized)
2. `outline` is the UI style/variant, not the pattern itself
3. File name describes the pattern, selector describes the style
4. No breaking change to public API (directive class name stays same)
5. JSDoc already clarifies: "outlined/floating label layout"

**Alternative:** Add JSDoc note clarifying naming:

```typescript
/**
 * Attribute directive for outlined form field layout (floating label pattern).
 *
 * **File name:** floating-label.directive.ts (pattern name)
 * **Selector:** outline (style variant)
 *
 * The file name reflects the design pattern (floating label),
 * while the selector reflects the visual style (outlined container).
 */
@Directive({ selector: 'ngx-signal-form-field[outline]' })
export class NgxFloatingLabelDirective {}
```

---

## Version 2.0 Plan (Major Release)

**Goal:** Advanced input compositions and layout helpers.

### Potential Features

#### 1. Checkbox/Radio Group Components ⭐⭐⭐

**Priority:** High | **Effort:** High (1-2 days)

**Proposed API:**

```html
<ngx-signal-form-field-group [formField]="form.interests" legend="Interests">
  <ngx-signal-form-field-checkbox value="sports">
    Sports
  </ngx-signal-form-field-checkbox>
  <ngx-signal-form-field-checkbox value="music">
    Music
  </ngx-signal-form-field-checkbox>
  <ngx-signal-form-field-checkbox value="travel">
    Travel
  </ngx-signal-form-field-checkbox>
</ngx-signal-form-field-group>

<ngx-signal-form-field-group [formField]="form.plan" legend="Plan">
  <ngx-signal-form-field-radio value="free">Free</ngx-signal-form-field-radio>
  <ngx-signal-form-field-radio value="pro">Pro</ngx-signal-form-field-radio>
  <ngx-signal-form-field-radio value="enterprise"
    >Enterprise</ngx-signal-form-field-radio
  >
</ngx-signal-form-field-group>
```

**Why V2?**
Requires new component architecture (group state management, keyboard navigation, ARIA relationships).

---

#### 2. Size Variants ⭐

**Priority:** Low | **Effort:** Low (1 hour)

```html
<ngx-signal-form-field [formField]="form.search" size="sm" outline>
  <input [formField]="form.search" />
</ngx-signal-form-field>
```

**Sizes:** `xs`, `sm`, `md` (default), `lg`, `xl`

---

#### 3. Multi-Column Layout Helper ⭐

**Priority:** Low | **Effort:** Low (1 hour)

```html
<ngx-signal-form-row columns="2" gap="1rem">
  <ngx-signal-form-field [formField]="form.firstName"
    >...</ngx-signal-form-field
  >
  <ngx-signal-form-field [formField]="form.lastName">...</ngx-signal-form-field>
</ngx-signal-form-row>
```

---

## Implementation Priority Matrix

| Feature                     | Priority | Effort | Impact | Version       | Decision   |
| --------------------------- | -------- | ------ | ------ | ------------- | ---------- |
| **Global Config Provider**  | ⭐⭐⭐   | Medium | High   | **v1.1**      | ✅ Include |
| **Enhanced Readonly State** | ⭐⭐     | Low    | Medium | **v1.1**      | ✅ Include |
| **Better Select Styling**   | ⭐⭐     | Low    | Medium | **v1.1**      | ✅ Include |
| **Description Component**   | ⭐⭐     | Low    | Medium | **v1.1/v1.x** | 🤔 TBD     |
| **Icon Support (slots)**    | ⭐⭐⭐   | Medium | High   | **v1.0**      | ✅ Shipped |
| **Checkbox/Radio Groups**   | ⭐⭐⭐   | High   | High   | **v2.0**      | 📝 Future  |
| **Size Variants**           | ⭐       | Low    | Low    | **v2.0**      | 📝 Future  |
| **Multi-Column Layout**     | ⭐       | Low    | Low    | **v2.0**      | 📝 Future  |

---

## Open Questions

### For v1.1 Scope

1. **Description Component Timing**
   - ✅ Include in v1.1 (adds value, low effort)
   - ❌ Defer to v1.x (focus on config)

   **Recommendation:** Include if effort allows. Common use case, low implementation cost.

2. **Configuration API Design**
   - Should `withFormField()` be separate from core config?
   - Or merge into single `provideNgxSignalFormsConfig({ formField: {...} })`?

   **Recommendation:** Separate feature function (`withFormField`) for modularity and tree-shaking.

3. **Select Chevron Default**
   - Provide default SVG chevron (as shown in implementation)
   - Or require developers to supply via CSS variable?

   **Recommendation:** Provide default, allow override via CSS variable.

### For v1.x Scope

4. **Icon Slot API**
   - Use content projection with `slot` attribute (shown in proposal)
   - Or dedicated components (`<ngx-form-field-prefix>`, `<ngx-form-field-suffix>`)?

   **Recommendation:** Slot-based approach (more flexible, less boilerplate).

### Naming Question

5. **Directive File Name**
   - ✅ Keep as `floating-label.directive.ts` (pattern name)
   - ❌ Rename to `outline.directive.ts` (selector name)

   **Recommendation:** Keep current name. File describes pattern, selector describes style.

---

## Success Metrics

### v1.1 Success Criteria

- ✅ Zero breaking changes
- ✅ Global config adopted in demo app
- ✅ Readonly visual distinction meets WCAG 2.2 AA
- ✅ Select chevron renders consistently across Chrome, Firefox, Safari, Edge
- ✅ Build size increase < 2KB (gzipped)
- ✅ Documentation updated with new features
- ✅ All existing tests pass
- ✅ New features have >90% test coverage

### v1.x Success Criteria

- ✅ Description component used in >50% of demo forms
- ✅ Icon slots support both SVG and text content
- ✅ Prefix/suffix spacing works with all input types
- ✅ Accessibility audit passes (WAVE, axe DevTools)

---

## Implementation Timeline

### Phase 1: v1.1 (Target: Q4 2025)

**Week 1:**

- [ ] Implement global config provider (`provideNgxSignalFormsConfig` + `withFormField`)
- [ ] Add readonly state CSS styling
- [ ] Add select chevron styling
- [ ] Write unit tests for config injection

**Week 2:**

- [ ] Update documentation (README, JSDoc)
- [ ] Update demo app to use new config
- [ ] Manual testing across browsers
- [ ] Accessibility audit

**Week 3:**

- [ ] Code review and refinements
- [ ] Final testing
- [ ] Release v1.1

### Phase 2: v1.x (Target: Q1 2026)

**TBD based on v1.1 feedback and prioritization discussion.**

---

## Migration Guide (v1.0 → v1.1)

### No Breaking Changes

All v1.0 code continues to work without modification. New features are opt-in.

### Recommended Upgrades

#### Adopt Global Configuration

**Before (v1.0):**

```typescript
// Repeated per component
<ngx-signal-form-field [formField]="form.email" outline [showRequiredMarker]="true">
```

**After (v1.1):**

```typescript
// app.config.ts - Set once
providers: [
  provideNgxSignalFormsConfig(
    withFormField({ showRequiredMarkerByDefault: true })
  )
]

// Components - No need to repeat
<ngx-signal-form-field [formField]="form.email" outline>
```

#### Customize Readonly Appearance

**Before (v1.0):**

```css
/* Manual styling required */
input[readonly] {
  background-color: #f9fafb;
}
```

**After (v1.1):**

```css
/* Use new CSS custom property */
:root {
  --ngx-form-field-input-readonly-bg: #fef3c7; /* Custom yellow tint */
}
```

---

## Appendix

### Related Documents

- [Toolkit README](../packages/toolkit/README.md)
- [Form Field README](../packages/toolkit/form-field/README.md)
- [Signal Forms Instructions](.github/instructions/signal-forms.instructions.md)
- [Toolkit Instructions](.github/instructions/signal-forms-toolkit.instructions.md)

### Design References

- Figma: [Expo Design Library - Form Fields](https://www.figma.com/design/umjx7RAVOJYAtnoladhfZ2/Expo-Design-library?node-id=2017-682)
- Figma: [Expo Design Library - Select](https://www.figma.com/design/umjx7RAVOJYAtnoladhfZ2/Expo-Design-library?node-id=3436-2095)
- Figma: [Expo Design Library - Text Field](https://www.figma.com/design/umjx7RAVOJYAtnoladhfZ2/Expo-Design-library?node-id=3436-1978)

### Prior Art

- [Material Design 3 - Text Fields](https://m3.material.io/components/text-fields)
- [Angular Material - Form Field](https://material.angular.io/components/form-field)
- [Fluent UI - Input](https://fluent2.microsoft.design/components/input)

---

**Document Maintainer:** @ngx-signal-forms
**Last Review:** October 20, 2025
**Next Review:** November 2025 (post v1.1 release)
