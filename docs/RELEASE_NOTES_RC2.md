# 1.0.0-rc.1 (2026-04-06)

**Compare:** [v1.0.0-rc.0...v1.0.0-rc.1](https://github.com/ngx-signal-forms/ngx-signal-forms/compare/v1.0.0-rc.0...v1.0.0-rc.1)

This release candidate focuses on three things:

- clarifying how the toolkit layers on top of Angular Signal Forms
- adding first-class form-level summary primitives
- reducing demo and documentation sprawl so the recommended patterns are easier to find and adopt

Compared to **RC1** (`v1.0.0-rc.0`), this release is mostly additive and consolidating. The main consumer-facing migration is that toolkit-backed forms must now opt in explicitly with `ngxSignalForm`.

---

## Breaking changes

### Toolkit API and behavior

- **Toolkit form enhancement is now explicit**
  - `NgxSignalFormDirective` no longer enhances plain `form[formRoot]` by itself.
  - Toolkit-backed forms must now opt in with `ngxSignalForm`.
  - Before:

    ```html
    <form [formRoot]="myForm">...</form>
    ```

  - After:

    ```html
    <form [formRoot]="myForm" ngxSignalForm>...</form>
    ```

  - This applies to forms that rely on toolkit behavior such as injected toolkit form context, form-level `errorStrategy`, submitted-status tracking, or child toolkit components that expect toolkit form context.

- **Form-level error strategy now belongs on the `ngxSignalForm` host**
  - Move form-level strategy configuration onto the explicit toolkit host:

    ```html
    <form [formRoot]="myForm" ngxSignalForm [errorStrategy]="'on-submit'">
      ...
    </form>
    ```

- **`shouldShowErrors()` changed signature**
  - The helper no longer accepts a field-state object.
  - Before:

    ```typescript
    shouldShowErrors(fieldState, strategy, submittedStatus);
    ```

  - After:

    ```typescript
    shouldShowErrors(isInvalid, isTouched, strategy, submittedStatus);
    ```

  - Migrate imperative callers by passing booleans such as `field.invalid()` and `field.touched()`.

---

## `@ngx-signal-forms/toolkit`

### Toolkit highlights

- **Explicit additive Angular integration** — `NgxSignalFormToolkit` now bundles Angular's `FormRoot` together with the toolkit directives, and `NgxSignalFormDirective` is now an explicit enhancer on `form[formRoot][ngxSignalForm]`. This makes the ownership model clearer: Angular owns native form submission behavior, while the toolkit adds form context, submitted-state tracking, and error strategy behavior.

- **New form-level summary APIs** — Added `NgxSignalFormErrorSummaryComponent` to the assistive entry point and `NgxHeadlessErrorSummaryDirective` to the headless entry point. These APIs make accessible summary-level validation flows a first-class part of the toolkit instead of something every consumer has to rebuild.

- **Stronger error and warning composition** — Added `provideFieldLabels(...)`, surfaced stronger low-level helpers such as `splitByKind(...)` and `readDirectErrors(...)`, and improved error-message resolution behavior and test coverage.

- **Better headless utility ergonomics** — Added `createFieldStateFlags(...)` and improved shared summary, visibility, and focus behavior across assistive and headless layers.

- **Internal cleanup without broad public API churn** — Simplified strategy resolution, deduplicated summary-related logic, and tightened type safety across toolkit internals.

---

## Demo application (`apps/demo`)

### Demo highlights

- **Consolidated live learning path** — The live demo now centers on the examples users should copy first: Getting Started, Toolkit Core, Headless, Form Field Wrapper, and Advanced Scenarios.

- **Stronger submission and summary UX examples** — `submission-patterns` now demonstrates summary rendering, invalid-submit focus behavior, and recovery flows more clearly.

- **More focused example surface** — `fieldset-utilities` is now the main headless showcase, `complex-forms` and `custom-controls` are now the primary form-field-wrapper examples, and the advanced wizard, async validation, cross-field validation, Vest, and Zod + Vest examples were retained and aligned to the new navigation model.

- **Less exploratory noise** — Older exploratory routes were removed from the live navigation surface, resulting in a more opinionated and easier-to-follow demo experience.

---

## Documentation

### Documentation highlights

- Updated the root and package docs to reflect the new additive `ngxSignalForm` model.
- Expanded guidance for Angular public API policy, custom controls, parsing errors and warnings, nested form arrays, warnings support, and migration from `ngx-vest-forms`.
- Removed outdated overview material and streamlined form guides.

## Migration guide

### 1. Update toolkit-backed forms

Search for forms that use toolkit primitives and add `ngxSignalForm`.

Typical candidates:

- forms using `NgxSignalFormToolkit`
- forms using toolkit wrappers
- forms using toolkit error components
- forms relying on form-level strategy behavior
- forms expecting submitted-status-aware behavior from toolkit children

Recommended update:

```html
<form [formRoot]="myForm" ngxSignalForm></form>
```

If you also configure form-level strategy behavior, move that configuration onto the same host:

```html
<form [formRoot]="myForm" ngxSignalForm [errorStrategy]="'on-submit'"></form>
```

### 2. Re-test submit-time validation flows

After adding `ngxSignalForm`, verify:

- `on-submit` strategy behavior
- invalid-submit focus behavior
- summary visibility behavior
- `aria-describedby` and `aria-invalid` wiring on invalid fields

### 3. Adopt the new summary APIs where appropriate

If you currently maintain a custom summary implementation, consider switching to:

- `NgxSignalFormErrorSummaryComponent` for styled summary UI
- `NgxHeadlessErrorSummaryDirective` for custom markup with toolkit-managed state

This is not required, but it is the recommended direction for RC2.

### 4. Improve label and warning handling

Where grouped or summary-level errors need better wording or clearer separation:

- use `provideFieldLabels(...)` for human-friendly or localized field names
- use `splitByKind(...)` for explicit warning vs blocking-error handling

### 5. Update imperative `shouldShowErrors()` usage

If you call `shouldShowErrors()` directly in custom imperative logic, update those call sites to pass booleans instead of a field-state object.

Before:

```typescript
shouldShowErrors(fieldState, strategy, submittedStatus);
```

After:

```typescript
shouldShowErrors(
  fieldState.invalid(),
  fieldState.touched(),
  strategy,
  submittedStatus,
);
```

### 6. Update demo links and references

The live demo route graph was consolidated. If you reference older demo routes in docs, tests, screenshots, or bookmarks, update them.

Suggested replacements:

| RC1-era route                            | RC2 replacement                                             |
| ---------------------------------------- | ----------------------------------------------------------- |
| `/signal-forms-only/pure-signal-form`    | `/getting-started/your-first-form`                          |
| `/toolkit-core/accessibility-comparison` | `/toolkit-core/error-display-modes`                         |
| `/toolkit-core/field-states`             | `/headless/fieldset-utilities` or debugger-related examples |
| `/headless/error-state`                  | `/headless/fieldset-utilities`                              |
| `/form-field-wrapper/basic-usage`        | `/form-field-wrapper/complex-forms`                         |
| `/form-field-wrapper/fieldset-grouping`  | `/form-field-wrapper/complex-forms`                         |
| `/advanced-scenarios/error-messages`     | `/advanced-scenarios/submission-patterns`                   |

---

## Changed

### Toolkit changes

- `NgxSignalFormToolkit` now bundles Angular `FormRoot` together with toolkit directives.
- `NgxSignalFormDirective` now targets `form[formRoot][ngxSignalForm]` as an explicit additive enhancer.
- Added `NgxSignalFormErrorSummaryComponent`.
- Added `NgxHeadlessErrorSummaryDirective`.
- Added `provideFieldLabels(...)`.
- Added or surfaced stronger low-level helpers including `splitByKind(...)` and `readDirectErrors(...)`.
- Improved error-message resolution coverage and supporting tests.
- Simplified shared strategy and error-visibility logic.
- Improved internal type safety and deduplicated summary logic.

### Demo app changes

- Consolidated the live route graph around the strongest onboarding and reference examples.
- Removed several exploratory demo routes from the live navigation surface.
- Promoted `your-first-form` as the main onboarding example.
- Promoted `fieldset-utilities` as the main headless example.
- Promoted `complex-forms` and `custom-controls` as the main form-field-wrapper examples.
- Expanded `submission-patterns` around summary and focus behavior.
- Kept advanced validation examples while aligning them to the new route model.
- Updated E2E coverage to match the consolidated live app surface.

### Documentation changes

- Refreshed package and root docs to reflect the additive toolkit model.
- Added and updated migration and integration guidance across the docs surface.
- Removed outdated overview material and simplified the reference path through the docs.

---

## Verification

Validated during release preparation on **macOS**:

- `pnpm nx build toolkit --skip-nx-cache && pnpm nx build demo --skip-nx-cache`
- `npx nx run-many -t lint`
- `npx nx e2e demo-e2e --skip-nx-cache`

Result: all checks passed, including the full demo E2E suite (`173 passed`).

---

**Full Changelog:** [v1.0.0-rc.0...v1.0.0-rc.1](https://github.com/ngx-signal-forms/ngx-signal-forms/compare/v1.0.0-rc.0...v1.0.0-rc.1)
