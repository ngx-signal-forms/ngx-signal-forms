# Signal Forms Only (0% Toolkit)

> **Baseline:** Pure Angular Signal Forms without any toolkit enhancements

## 🎯 Purpose

This section demonstrates what Angular 21+ Signal Forms looks like **without** the `@ngx-signal-forms/toolkit`. Use this as your baseline to understand:

1. **Manual ARIA implementation** - How much work accessibility requires
2. **Manual error display logic** - Template conditions and state tracking
3. **Boilerplate overhead** - The code you write without automation

**Key Insight:** This shows WHY the toolkit exists and WHAT problems it solves.

## 📂 Examples

### pure-signal-form

**Focus:** Login form with email/password validation

**What you'll see:**

- Manual `aria-invalid` and `aria-describedby` attributes
- Custom error visibility logic in template
- No automatic error display
- Full control over ARIA semantics
- ~67% more code than toolkit equivalent

**Technologies:**

- Angular 21+ Signal Forms (`@angular/forms/signals`)
- `Control` directive for form binding
- Signal-based state management
- OnPush change detection

## 💡 Key Takeaways

### What Signal Forms Provides (Core API)

✅ **Reactive State Management**

```typescript
readonly #model = signal({ email: '', password: '' });
readonly loginForm = form(this.#model, validators);
```

✅ **Type-Safe Validation**

```typescript
form(model, (path) => {
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Valid email required' });
});
```

✅ **Control Directive**

```html
<input id="email" [formField]="loginForm.email" />
```

### What Signal Forms Does NOT Provide

❌ **Automatic ARIA Attributes**

```html
<!-- You must manually add: -->
<input
  [formField]="loginForm.email"
  [attr.aria-invalid]="loginForm.email().invalid() ? 'true' : null"
  [attr.aria-describedby]="loginForm.email().invalid() ? 'email-error' : null"
/>
```

❌ **Error Display Components**

```html
<!-- You must build error templates manually: -->
@if (loginForm.email().invalid() && loginForm.email().touched()) {
<div id="email-error" role="alert">
  @for (error of loginForm.email().errors(); track error.kind) {
  <p>{{ error.message }}</p>
  }
</div>
}
```

❌ **Progressive Error Disclosure**

```html
<!-- You must track submission state manually: -->
@if ((loginForm.email().invalid() && loginForm.email().touched()) ||
(loginForm.email().invalid() && formSubmitted())) {
<!-- error display -->
}
```

## 📊 Code Comparison

### Without Toolkit (This Section)

**Template:** ~25 lines for basic form with 2 fields

```html
<input
  id="email"
  [formField]="loginForm.email"
  [attr.aria-invalid]="loginForm.email().invalid() ? 'true' : null"
  [attr.aria-describedby]="loginForm.email().invalid() ? 'email-error' : null"
/>
@if (loginForm.email().invalid() && loginForm.email().touched()) {
<div id="email-error" role="alert">
  @for (error of loginForm.email().errors(); track error.kind) {
  <p class="text-red-600">{{ error.message }}</p>
  }
</div>
}
```

### With Toolkit (Next Sections)

**Template:** ~8 lines for same functionality

```html
<ngx-signal-form-field-wrapper [formField]="loginForm.email" fieldName="email">
  <label for="email">Email</label>
  <input id="email" [formField]="loginForm.email" />
</ngx-signal-form-field-wrapper>
```

**Reduction:** ~67% less code with toolkit

## 🔍 Common Pain Points (Without Toolkit)

1. **ARIA Duplication**
   - Every input needs manual `aria-invalid` binding
   - Every input needs manual `aria-describedby` linking
   - Easy to forget or misconfigure

2. **Error Logic Repetition**
   - Same `invalid() && touched()` condition everywhere
   - Submission state tracking duplicated per field
   - Inconsistent error display timing

3. **Template Verbosity**
   - Error display requires nested `@if` and `@for`
   - ID management for `aria-describedby` linkage
   - Role attributes must be manually added

4. **No Warning Support**
   - All validation is blocking (errors only)
   - No concept of non-blocking guidance
   - Can't distinguish severity levels

5. **Accessibility Risk**
   - Easy to violate WCAG 2.2 guidelines
   - No automatic screen reader announcements
   - Manual live region management

## ➡️ Next Steps

### Try Getting Started (20% Toolkit)

**Path:** `01-getting-started/your-first-form`

**What changes:**

- Auto-ARIA (no manual attributes)
- NgxSignalFormErrorComponent (automatic error display)
- Progressive error disclosure built-in
- Still some manual layout

### Skip to Full Toolkit (100%)

**Path:** `02-toolkit-core/` or `04-form-field-wrapper/`

**What changes:**

- Form field wrapper component
- Consistent layout and spacing
- Error display strategies
- Warning support
- Zero manual ARIA

## 🤔 When to Use Signal Forms Only

**Use pure Signal Forms (0% toolkit) when:**

- ✅ You need absolute control over every ARIA attribute
- ✅ You're building a custom design system
- ✅ You want to understand the underlying mechanics
- ✅ You're learning Angular Signal Forms basics

**Switch to toolkit when:**

- ✅ You need WCAG 2.2 compliance automatically
- ✅ You want to reduce boilerplate
- ✅ You need consistent error UX across forms
- ✅ You want warning support (non-blocking validation)
- ✅ You're building production applications

---

**Next:** Head to `01-getting-started/` to see your first toolkit benefits! 🚀
