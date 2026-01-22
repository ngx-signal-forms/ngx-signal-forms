# @ngx-signal-forms/toolkit - Interactive Demo

> Progressive examples demonstrating Angular 21+ Signal Forms with and without the toolkit

## 🎯 Demo Structure

This demo follows a **progressive learning path** from vanilla Angular Signal Forms to full toolkit adoption:

```text
📂 Demo Structure (9 Examples)
├─ 00-signal-forms-only/     [0% toolkit]  ← Baseline: What Signal Forms looks like
├─ 01-getting-started/       [20% toolkit] ← First steps with toolkit
├─ 02-toolkit-core/          [100%]        ← Core toolkit features (4 examples)
├─ 03-form-field-wrapper/    [100%]        ← Form field component (2 examples)
└─ 04-advanced/              [100%]        ← Production patterns (2 examples)
```

## 📚 Learning Path

### Level 1: Signal Forms Only (0% Toolkit)

**Path:** `00-signal-forms-only/`

Start here to understand what Angular Signal Forms looks like **without** the toolkit.

- ✅ Manual ARIA attributes (`aria-invalid`, `aria-describedby`)
- ✅ Manual error visibility logic
- ✅ Template-based error display
- ⚠️ ~67% more boilerplate code

**Example:** `pure-signal-form` - Login form with email/password validation

### Level 2: Getting Started (20% Toolkit)

**Path:** `01-getting-started/`

Your first toolkit experience - see the immediate benefits.

- ✅ Auto-ARIA (no manual attributes needed)
- ✅ Automatic error component
- ✅ Progressive error disclosure
- ❌ No form field wrapper yet (still manual layout)

**Example:** `your-first-form` - Contact form with name/email/message

### Level 3: Toolkit Core (100% Toolkit)

**Path:** `02-toolkit-core/`

Deep dive into core toolkit features.

| Example                      | Focus                          | What You Learn                          |
| ---------------------------- | ------------------------------ | --------------------------------------- |
| **accessibility-comparison** | Side-by-side manual vs toolkit | 67% code reduction, auto-ARIA benefits  |
| **error-display-modes**      | Error strategies               | immediate, on-touch, on-submit, manual  |
| **warning-support**          | Non-blocking validation        | Warnings vs errors, WCAG compliance     |
| **field-states**             | State visualization            | touched, dirty, pending, invalid states |

### Level 4: Form Field Wrapper (100% Toolkit)

**Path:** `03-form-field-wrapper/`

"Batteries included" approach with the form field component.

| Example           | Focus                       | What You Learn                                  |
| ----------------- | --------------------------- | ----------------------------------------------- |
| **basic-usage**   | NgxSignalFormFieldComponent | Content projection, automatic error display     |
| **complex-forms** | Real-world registration     | 8 fields, nested objects, password confirmation |

### Level 5: Advanced Patterns (100% Toolkit)

**Path:** `04-advanced/`

Production-ready patterns for real applications.

| Example                  | Focus                       | What You Learn                                |
| ------------------------ | --------------------------- | --------------------------------------------- |
| **global-configuration** | provideNgxSignalFormsConfig | Custom defaults, field resolution, debug mode |
| **submission-patterns**  | Async submission            | Loading states, server errors, WCAG patterns  |

## Quick Start

### Run the Demo

```bash
# Development server
pnpm nx serve demo

# Production build
pnpm nx build demo

# Run tests
pnpm nx test demo
```

### Navigate Examples

1. Start at **Signal Forms Only** to see the baseline
2. Progress to **Getting Started** for first toolkit benefits
3. Explore **Toolkit Core** for deep feature understanding
4. Try **Form Field Wrapper** for production-ready patterns
5. Study **Advanced** for complex scenarios

## Key Concepts

### Angular Signal Forms (Core API)

```typescript
import { form, FormField, required, email } from '@angular/forms/signals';

@Component({
  imports: [Field],
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
    <form [ngxSignalForm]="myForm">
      <input [formField]="myForm.email" />
      <ngx-signal-form-error [formField]="myForm.email" fieldName="email" />
    </form>
  `,
})
```

```typescript
// Level 2: Form Field Wrapper (100% toolkit)
import { NgxSignalFormFieldComponent } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  imports: [FormField, NgxSignalFormFieldComponent],
  template: `
    <ngx-signal-form-field [formField]="myForm.email" fieldName="email">
      <label for="email">Email</label>
      <input id="email" [formField]="myForm.email" />
    </ngx-signal-form-field>
  `,
})
```

## Toolkit Value Proposition

### What the Toolkit Adds

| Feature                 | Without Toolkit                           | With Toolkit                 |
| ----------------------- | ----------------------------------------- | ---------------------------- |
| **ARIA Attributes**     | Manual `aria-invalid`, `aria-describedby` | Automatic ✅                 |
| **Error Display**       | Manual templates + conditions             | Component ✅                 |
| **Error Strategies**    | Manual state tracking                     | 4 built-in strategies ✅     |
| **Warning Support**     | Not supported                             | Built-in ✅                  |
| **Field States**        | Manual tracking                           | Automatic visualization ✅   |
| **Form Field Wrapper**  | Manual layout                             | Component with projection ✅ |
| **WCAG 2.2 Compliance** | Manual implementation                     | Automatic ✅                 |
| **Code Reduction**      | Baseline                                  | ~67% less code ✅            |

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

- **Angular**: 21.0.0-next.7 (Signal Forms experimental API)
- **TypeScript**: 5.8+ (strict mode)
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

**Next:** Start with `00-signal-forms-only/` to see the baseline, then progress through each section! 🚀
