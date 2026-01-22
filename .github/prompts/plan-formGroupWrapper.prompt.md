# Plan: Form Group Wrapper Component

## Overview

Implement a `FormGroupWrapperComponent` for `@ngx-signal-forms/toolkit` that groups multiple `<ngx-signal-form-field>` components and displays aggregated errors/warnings for the entire group.

**Signal Forms alignment:**

- Use Signal Forms `FieldState` signals (`valid`, `invalid`, `touched`, `dirty`, `pending`, `errors`, `errorSummary`).
- No `ngModelGroup` or template-driven assumptions.
- `groupId` is optional and only used for stable ARIA IDs (not for binding).

## Inspiration: ngx-vest-forms

Reference implementation: `ngx-form-group-wrapper` from [ngx-vest-forms](https://github.com/ngx-vest-forms/ngx-vest-forms)

**Key features from ngx-vest-forms:**

- Group-safe wrapper for containers with multiple form fields
- Displays group-level errors/warnings/pending UI
- Does NOT stamp `aria-describedby` / `aria-invalid` onto descendant controls (group-safe)
- Uses group-level field state (`FieldState`) and toolkit `ErrorDisplayStrategy`
- Generates unique IDs for error/warning/pending regions
- Supports `ErrorDisplayStrategy` input (toolkit)
- Host bindings for CSS classes (invalid state, aria-busy)

## Proposed API

### Component Name

`NgxSignalFormGroupWrapperComponent`

### Selector

- `ngx-signal-form-group-wrapper`
- Attribute: `[ngxSignalFormGroupWrapper]`

### Usage Examples

```html
<!-- Element selector -->
<ngx-signal-form-group-wrapper
  [groupField]="form.address"
  [fields]="[form.address.street, form.address.city, form.address.zip]"
  groupId="address"
>
  <ngx-signal-form-field [formField]="form.address.street" fieldName="street">
    <label for="street">Street</label>
    <input id="street" [formField]="form.address.street" />
  </ngx-signal-form-field>

  <ngx-signal-form-field [formField]="form.address.city" fieldName="city">
    <label for="city">City</label>
    <input id="city" [formField]="form.address.city" />
  </ngx-signal-form-field>
</ngx-signal-form-group-wrapper>

<!-- Or with attribute selector on fieldset (recommended for accessibility) -->
<fieldset
  ngxSignalFormGroupWrapper
  [groupField]="form.address"
  [fields]="[form.address.street, form.address.city]"
  groupId="address"
>
  <legend>Address</legend>

  <ngx-signal-form-field [formField]="form.address.street" fieldName="street">
    <label for="street">Street</label>
    <input id="street" [formField]="form.address.street" />
  </ngx-signal-form-field>

  <ngx-signal-form-field [formField]="form.address.city" fieldName="city">
    <label for="city">City</label>
    <input id="city" [formField]="form.address.city" />
  </ngx-signal-form-field>
</fieldset>
```

### Inputs

| Input               | Type                                     | Default        | Description                                                    |
| ------------------- | ---------------------------------------- | -------------- | -------------------------------------------------------------- |
| `groupField`        | `FieldTree<TGroup>`                      | required       | Group field (e.g., `form.address`) for aggregate state         |
| `fields`            | `FieldTree[]`                            | optional       | Optional explicit fields for aggregation override              |
| `groupId`           | `string`                                 | auto-generated | Optional ID for ARIA region IDs (not required by Signal Forms) |
| `strategy`          | `ReactiveOrStatic<ErrorDisplayStrategy>` | inherited      | Error display strategy                                         |
| `showGroupErrors`   | `boolean`                                | `true`         | Whether to show aggregated group errors                        |
| `showGroupWarnings` | `boolean`                                | `true`         | Whether to show aggregated group warnings                      |

### Outputs

None planned (but could add `groupValidityChange` if needed)

### Exported Template Reference

```html
<ngx-signal-form-group-wrapper #wrapper="ngxSignalFormGroupWrapper">
  @if (wrapper.isGroupInvalid()) { ... }
</ngx-signal-form-group-wrapper>
```

### Exposed Signals (via exportAs)

- `isGroupInvalid()` - Any field in group is invalid
- `isGroupValid()` - All fields in group are valid
- `isGroupTouched()` - Any field in group is touched
- `isGroupDirty()` - Any field in group is dirty
- `groupErrors()` - Aggregated errors from `groupField().errorSummary()` or `fields`
- `groupWarnings()` - Aggregated warnings from `groupField().errorSummary()` or `fields`
- `shouldShowGroupErrors()` - Based on strategy and touched/submitted state

## Implementation Details

### File Structure

```
packages/toolkit/form-field/
├── form-group-wrapper.component.ts      (NEW)
├── form-group-wrapper.component.spec.ts (NEW)
├── form-group-wrapper.component.scss    (NEW, if needed)
├── index.ts                             (UPDATE - add export)
├── public_api.ts                        (UPDATE - add export)
```

### Key Implementation Decisions

1. **Group-safe ARIA handling**

- Group wrapper does NOT modify descendant controls' ARIA attributes
- Individual `<ngx-signal-form-field>` components handle their own ARIA
- Group displays errors in stable live regions with unique IDs
- Optional host `aria-describedby` can reference group-level messages

2. **Aggregation Logic**

- Prefer `groupField().errorSummary()` (FieldState) when available
- If `fields` is provided, aggregate from those fields instead
- Deduplicate identical error messages
- Separate errors from warnings (using `kind.startsWith('warn:')`)

**Recommendation:** Default to `groupField().errorSummary()` and keep `fields` as an optional override.

**Use `fields` override for:**

- Subset display (only part of a group)
- Cross-group sections (fields that are not siblings)
- Custom ordering of messages
- Virtual grouping without a dedicated parent field
- Transitional layouts with flat models

3. **Error Display Strategy**

- Reuse toolkit `ErrorDisplayStrategy` (not ngx-vest-forms specific)
- `shouldShowGroupErrors()` considers: strategy + group touched/submitted
- No `ErrorDisplayMode` type; use `ErrorDisplayStrategy`

4. **CSS Classes**

   ```
   .ngx-signal-form-group-wrapper
   .ngx-signal-form-group-wrapper--invalid
   .ngx-signal-form-group-wrapper--warning
   ```

5. **Host Bindings**
   ```typescript
   host: {
     class: 'ngx-signal-form-group-wrapper',
     '[class.ngx-signal-form-group-wrapper--invalid]': 'shouldShowGroupErrors()',
     '[class.ngx-signal-form-group-wrapper--warning]': 'showGroupWarningState()',
     '[attr.aria-busy]': 'isGroupPending() ? "true" : null',
   }
   ```

### Template Structure

```html
<div class="ngx-signal-form-group-wrapper__content">
  <ng-content />
</div>

<!-- Error region (always in DOM for stable ARIA targets) -->
<div [id]="errorId" role="alert" aria-live="assertive" aria-atomic="true">
  @if (shouldShowGroupErrors() && groupErrors().length > 0) {
  <ul class="ngx-signal-form-group-wrapper__errors">
    @for (error of groupErrors(); track error.message) {
    <li>{{ error.message }}</li>
    }
  </ul>
  }
</div>

<!-- Warning region -->
<div [id]="warningId" role="status" aria-live="polite" aria-atomic="true">
  @if (shouldShowGroupWarnings() && groupWarnings().length > 0) {
  <ul class="ngx-signal-form-group-wrapper__warnings">
    @for (warning of groupWarnings(); track warning.message) {
    <li>{{ warning.message }}</li>
    }
  </ul>
  }
</div>
```

## Alternative: Directive-Only Approach

Instead of a component, we could provide just a directive:

```typescript
@Directive({
  selector: '[ngxSignalFormGroup]',
  exportAs: 'ngxSignalFormGroup',
})
export class NgxSignalFormGroupDirective {
  readonly formFields = input.required<FieldTree[]>();
  // ... computed signals for aggregated state
}
```

**Pros:** More flexible, works with any container element
**Cons:** Requires manual template for error display

## Questions to Resolve

1. **Should individual field errors still show within the group?**
   - Option A: Show both group AND individual errors (ngx-vest-forms approach)
   - Option B: Only show group errors, suppress individual errors
   - **Recommendation:** Option A (default), with `suppressChildErrors` input for Option B

2. **How to handle `fieldset`/`legend` semantics?**
   - Should we provide a separate `NgxSignalFormFieldsetComponent` with built-in legend slot?
   - Or just document using attribute selector on native `<fieldset>`?

3. **Should we support nested groups?**
   - E.g., `<ngx-signal-form-group-wrapper>` inside another `<ngx-signal-form-group-wrapper>`

4. **Integration with form context**
   - Should the group wrapper provide a new context for children?
   - Or just read from parent form context?

## Tasks

- [ ] Create `form-group-wrapper.component.ts` with basic structure
- [ ] Implement aggregation logic for errors/warnings
- [ ] Add computed signals for group state (invalid, touched, dirty)
- [ ] Implement error display strategy logic
- [ ] Add SCSS styling (or use existing form-field styles)
- [ ] Write unit tests
- [ ] Add to exports in `index.ts` and `public_api.ts`
- [ ] Update README.md with usage examples
- [ ] Add E2E tests in demo app

## References

- [ngx-vest-forms form-group-wrapper.component.ts](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/projects/ngx-vest-forms/src/lib/components/form-group-wrapper/form-group-wrapper.component.ts)
- [ngx-vest-forms ACCESSIBILITY.md](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/ACCESSIBILITY.md)
- [ngx-vest-forms CHILD-COMPONENTS.md](https://github.com/ngx-vest-forms/ngx-vest-forms/blob/master/docs/CHILD-COMPONENTS.md)
- Existing `NgxSignalFormFieldComponent` in this project
