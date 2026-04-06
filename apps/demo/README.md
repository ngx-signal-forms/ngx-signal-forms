# @ngx-signal-forms/toolkit - Interactive Demo

> Consolidated examples demonstrating clean Angular Signal Forms + toolkit adoption patterns

## 🎯 Demo Structure

The live demo now follows a **consolidated learning path** focused on the examples we want developers to copy first:

```text
📂 Live Demo Structure
├─ 01-getting-started/       ← Toolkit onboarding and first setup
├─ 02-toolkit-core/          ← Error strategies + warning behavior
├─ 03-headless/              ← Renderless grouping and utility patterns
├─ 04-form-field-wrapper/    ← Nested forms and custom control integration
└─ 05-advanced/              ← Configuration, submission, async, wizard, Vest
```

Archived exploratory examples still exist in the source tree for historical/reference purposes, but they are no longer part of the live route graph.

## 📚 Current Learning Path

### Level 1: Getting Started

**Path:** `01-getting-started/`

Start here for the recommended first toolkit example.

- ✅ `[formRoot]` + `ngxSignalForm` in the smallest useful setup
- ✅ Auto-ARIA and reusable error rendering
- ✅ Deterministic control `id` guidance for field linking
- ✅ Strategy toggle so you can compare timing behavior immediately

**Example:** `your-first-form` — contact form onboarding

### Level 2: Toolkit Core

**Path:** `02-toolkit-core/`

Focus on the two core behaviors most teams need first.

| Example                 | Focus                   | What You Learn                                  |
| ----------------------- | ----------------------- | ----------------------------------------------- |
| **error-display-modes** | Error strategies        | `immediate`, `on-touch`, `on-submit`            |
| **warning-support**     | Non-blocking validation | Warnings vs errors and accessible announcements |

### Level 3: Headless

**Path:** `03-headless/`

Renderless primitives for custom UI systems.

- ✅ Headless error summary
- ✅ Grouped fieldset state
- ✅ Character count + utility helpers
- ✅ Explicit field naming and custom markup ownership

**Example:** `fieldset-utilities`

### Level 4: Form Field Wrapper

**Path:** `04-form-field-wrapper/`

The batteries-included path for reusable field UI.

| Example             | Focus                     | What You Learn                                      |
| ------------------- | ------------------------- | --------------------------------------------------- |
| **complex-forms**   | Nested objects + arrays   | Wrapper composition, grouped sections, long-form UX |
| **custom-controls** | FormValueControl patterns | Custom control integration with wrapper + auto-ARIA |

### Level 5: Advanced Scenarios

**Path:** `05-advanced/`

Production-ready patterns for real applications.

| Example                    | Focus                    | What You Learn                                 |
| -------------------------- | ------------------------ | ---------------------------------------------- |
| **global-configuration**   | App-level defaults       | `provideNgxSignalFormsConfig`, local overrides |
| **submission-patterns**    | Async submission UX      | Loading, server errors, error summary patterns |
| **advanced-wizard**        | Multi-step orchestration | Wizard flow with NgRx Signal Store + Zod       |
| **async-validation**       | Remote checks            | Pending states and async validation            |
| **cross-field-validation** | Dependent rules          | Sibling-aware validation logic                 |
| **vest-validation**        | Business rules via Vest  | Standard Schema + toolkit wrapper integration  |
| **zod-vest-validation**    | Layered validation       | Contract validation + business policy together |

## Feature-to-Example Matrix

- **Toolkit onboarding** → `getting-started/your-first-form` — smallest recommended setup
- **Error strategy modes** → `toolkit-core/error-display-modes` — compare timing behavior directly
- **Warning support** → `toolkit-core/warning-support` — non-blocking validation semantics
- **Headless grouped state** → `headless/fieldset-utilities` — summary, fieldset aggregation, utility helpers
- **Wrapper long-form composition** → `form-field-wrapper/complex-forms` — consolidated wrapper basics, grouped sections, nested arrays
- **Custom control integration** → `form-field-wrapper/custom-controls` — wrapper + custom value controls
- **Global toolkit defaults** → `advanced-scenarios/global-configuration` — app-level provider composition and per-form overrides
- **Async submit + server error UX** → `advanced-scenarios/submission-patterns` — submission lifecycle and recovery
- **Async remote validation** → `advanced-scenarios/async-validation` — pending + remote validation
- **Cross-field constraints** → `advanced-scenarios/cross-field-validation` — dependent field rules
- **Business validation with Vest** → `advanced-scenarios/vest-validation` — blocking + warning policy rules
- **Contract + policy layering** → `advanced-scenarios/zod-vest-validation` — Zod + Vest without duplicate UI plumbing
- **Advanced multi-step orchestration** → `advanced-scenarios/advanced-wizard` — canonical wizard example

## Quick Start

### Run the Demo

```bash
# Development server
pnpm nx serve demo

# Production build
pnpm nx build demo

# End-to-end demo validation
pnpm nx e2e demo-e2e
```

### Navigate Examples

1. Start at **Getting Started** for the toolkit-first baseline
2. Use **Toolkit Core** to compare error timing and warning behavior
3. Explore **Headless** for custom markup patterns
4. Use **Form Field Wrapper** for production-ready field composition
5. Finish with **Advanced Scenarios** for submission, configuration, and business validation

## Key Concepts

### Angular Signal Forms (Core API)

```typescript
import { form, FormField, required, email } from '@angular/forms/signals';

@Component({
  imports: [FormField],
  template: `<input [formField]="myForm.email" />`,
})
class MyComponent {
  readonly #model = signal({ email: '' });
  readonly myForm = form(this.#model, (path) => {
    required(path.email, { message: 'Required' });
    email(path.email, { message: 'Valid email required' });
  });
}
```

### Toolkit Enhancement (Progressive)

```typescript
// Level 1: Auto-ARIA + Error Component (20% toolkit)
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';

@Component({
  imports: [FormField, NgxSignalFormToolkit],
  template: `
    <form [formRoot]="myForm" ngxSignalForm>
      <input [formField]="myForm.email" />
      <ngx-signal-form-error [formField]="myForm.email" fieldName="email" />
    </form>
  `,
})
```

```typescript
// Level 2: Form Field Wrapper (100% toolkit)
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  imports: [FormField, NgxFormField],
  template: `
    <ngx-signal-form-field-wrapper [formField]="myForm.email">
      <label for="email">Email</label>
      <input id="email" [formField]="myForm.email" />
    </ngx-signal-form-field-wrapper>
  `,
})
```

## Toolkit Value Proposition

### What the Toolkit Adds

| Feature                 | Without Toolkit                           | With Toolkit                   |
| ----------------------- | ----------------------------------------- | ------------------------------ |
| **ARIA Attributes**     | Manual `aria-invalid`, `aria-describedby` | Automatic ✅                   |
| **Error Display**       | Manual templates + conditions             | Component ✅                   |
| **Error Strategies**    | Manual state tracking                     | 3 built-in strategies ✅       |
| **Warning Support**     | Not supported                             | Built-in ✅                    |
| **Field visibility UX** | Manual timing/debug instrumentation       | Strategy + debugger tooling ✅ |
| **Form Field Wrapper**  | Manual layout                             | Component with projection ✅   |
| **WCAG 2.2 Compliance** | Manual implementation                     | Automatic ✅                   |
| **Code Reduction**      | Baseline                                  | ~67% less code ✅              |

### WCAG 2.2 Compliance Features

✅ **Automatic ARIA**

- `aria-invalid="true"` on invalid fields
- `aria-describedby` linking errors to inputs
- Proper focus management

✅ **Live Regions**

- Errors: `role="alert"` + `aria-live="assertive"`
- Warnings: `role="status"` + `aria-live="polite"`
- Screen reader announcements

✅ **Error Display Strategies**

- Progressive disclosure (on-touch recommended)
- Clear error identification
- Associated with form fields

## 🔧 Technology Stack

- **Angular**: 21.2.x (Signal Forms experimental API)
- **TypeScript**: ~5.9 (strict mode)
- **Toolkit**: @ngx-signal-forms/toolkit
- **Styling**: Tailwind CSS 4.x
- **Testing**: Vitest (unit), Playwright (E2E)

## Troubleshooting

**Issue:** Type errors with Signal Forms

- Ensure Angular 21+ is installed
- Signal Forms are experimental - API may change
- Check `@angular/forms/signals` import path

### Runtime Errors

**Issue:** Form not working

- Verify `[formField]` directive is used (not `formControlName`)
- Check that `Control` is imported from `@angular/forms/signals`
- Ensure signal-based model: `signal<Model>({...})`

**Issue:** Toolkit directives not working

- Import `NgxSignalFormToolkit` bundle (recommended)
- Or import individual directives from `@ngx-signal-forms/toolkit`
- Verify toolkit is built: `pnpm nx build toolkit`

### Accessibility Issues

**Issue:** ARIA attributes not appearing

- Auto-ARIA requires `NgxSignalFormAutoAriaDirective` (included in bundle)
- Check `id` attribute is set on input elements
- Verify toolkit directives are imported

**Next:** Start with `01-getting-started/your-first-form` and then move through the consolidated sections! 🚀
