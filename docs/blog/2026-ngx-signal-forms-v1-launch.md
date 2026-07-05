---
title: 'Accessible Angular Signal Forms, without the boilerplate — introducing @ngx-signal-forms/toolkit v1.0.0'
published: false
description: 'Angular Signal Forms gives you the model, validation, and submission lifecycle. This toolkit adds everything Angular leaves to you: automatic ARIA wiring, error timing, non-blocking warnings, and a themable field wrapper. Here is the v1.0.0 story.'
tags: 'angular, typescript, webdev, a11y'
cover_image: ''
canonical_url: ''
---

## A quick word about who's writing this

I've been an Angular developer for a long time — long enough that "Angular" still means AngularJS in my muscle memory. I've built forms through every era of the framework: `ng-model`, template-driven forms, reactive forms, and the pile of `Validators`, `ControlValueAccessor` implementations, and `updateValueAndValidity()` calls that came with each.

I also maintain [`ngx-vest-forms`](https://github.com/simplifiedcourses/ngx-vest-forms), a library that pairs Angular template-driven forms with [Vest](https://vestjs.dev) for validation. So I've spent a lot of time thinking about what makes a form pleasant to build — and what makes it accessible for the people who actually have to use it.

When **Angular Signal Forms** landed and stabilized in Angular 22, my team and I were genuinely excited. It's a great primitive. A `signal()` is your model, `form()` gives you reactive field state, and validation and submission are first-class. It's the cleanest form model Angular has ever shipped.

But — and if you've built production forms you already know where this is going — Signal Forms deliberately stops at the *behavior*. It hands you `invalid()`, `touched()`, `errors()`, and `pending()` as signals and says: *the rest is yours.* Which ARIA attributes to wire, when to show an error, how to render a warning that shouldn't block submit, how to keep it all consistent across an app — all yours.

We looked for a library that would enhance and simplify Signal Forms **without replacing it**, with **accessibility as the default and not an afterthought**. We didn't find one we loved. So we built it.

Today I'm happy to introduce **`@ngx-signal-forms/toolkit` v1.0.0**.

---

## The problem, in one screenshot's worth of code

Here is a single accessible email field in **plain Angular Signal Forms**. It works. It's also the code you will copy-paste onto every field in your app, and get subtly wrong on at least one of them:

```html
<form [formRoot]="userForm">
  <label for="email">Email</label>
  <input
    id="email"
    [formField]="userForm.email"
    [attr.aria-invalid]="userForm.email().invalid() ? 'true' : null"
    [attr.aria-describedby]="
      userForm.email().invalid() &&
      (userForm.email().touched() || userForm().touched())
        ? 'email-error'
        : null
    "
  />
  @if (
    userForm.email().invalid() &&
    (userForm.email().touched() || userForm().touched())
  ) {
    <span id="email-error" role="alert">
      {{ userForm.email().errors()[0].message }}
    </span>
  }
</form>
```

That's `aria-invalid`, `aria-describedby`, the error-timing condition (touched *or* submitted), the `role="alert"` element, and the id wiring — for **one** field. Multiply by every field, keep it consistent, and never let a refactor break the `id`/`aria-describedby` link. This is exactly the kind of repetitive, easy-to-break work that ends up shipping inaccessible forms.

Here is the same field with the toolkit:

```html
<form [formRoot]="userForm">
  <ngx-form-field-wrapper [formField]="userForm.email">
    <label for="email">Email</label>
    <input id="email" type="email" [formField]="userForm.email" />
  </ngx-form-field-wrapper>
</form>
```

The wrapper handles ARIA, error timing, `role="alert"` for errors vs `role="status"` for warnings, hint projection, and character counts — automatically. And crucially: **your `form()`, `[formRoot]`, and `[formField]` code did not change.** The toolkit is additive.

---

## What it is (and, just as importantly, what it is not)

`@ngx-signal-forms/toolkit` is **not** a form library. Angular Signal Forms is the form library. The toolkit is the accessibility-and-presentation layer that sits on top of it.

The split is deliberate and strict:

| Angular Signal Forms owns | `@ngx-signal-forms/toolkit` adds |
| --- | --- |
| `form()`, `schema()`, validators | Strategy-aware error and warning display |
| `[formRoot]`, `[formField]` | Automatic `aria-invalid`, `aria-required`, `aria-describedby` |
| Field state (`invalid()`, `touched()`, `pending()`, …) | Form-field wrapper, fieldset, assistive, and headless surfaces |
| Model updates and submission lifecycle | Focus helpers, warning helpers, app-wide config, custom-control semantics |

There's a one-line test for whether you're using the toolkit correctly: **if deleting a toolkit API would change the data you submit, you're using it on the wrong side of the boundary.** Angular stays the single source of truth. The toolkit only changes how the form *looks* and how it *announces itself to assistive technology* — never what it *does*.

---

## 30-second quick start

```bash
npm install @ngx-signal-forms/toolkit
```

```typescript
import { Component, signal } from '@angular/core';
import { form, schema, required, email, FormField } from '@angular/forms/signals';
import { NgxSignalFormToolkit, createOnInvalidHandler } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  selector: 'app-contact',
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <form [formRoot]="contactForm">
      <ngx-form-field-wrapper [formField]="contactForm.email">
        <label for="email">Email</label>
        <input id="email" type="email" [formField]="contactForm.email" />
      </ngx-form-field-wrapper>
      <button type="submit">Send</button>
    </form>
  `,
})
export class ContactComponent {
  protected readonly model = signal({ email: '' });

  protected readonly contactForm = form(
    this.model,
    schema((path) => {
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Invalid email format' });
    }),
    {
      submission: {
        action: async () => console.log('Submit:', this.model()),
        onInvalid: createOnInvalidHandler(),
      },
    },
  );
}
```

What you get for free from that markup:

- ✅ `aria-invalid`, `aria-required`, `aria-describedby` wired automatically
- ✅ Errors appear after blur or submit (default `on-touch` strategy), with `role="alert"`
- ✅ Warnings render as `role="status"` when present
- ✅ Hints and character counts project below the input with proper ARIA association
- ✅ First invalid field focused on failed submit (`createOnInvalidHandler()`)

Notice there's no `ngxSignalForm` directive on the form. You don't need it for the common path — plain `[formRoot]` and the default `on-touch` timing cover most forms. You add form-level context only when you want a different error strategy or submit-lifecycle tracking. Progressive complexity, not upfront ceremony.

---

## Why accessibility is the headline feature

Most form libraries treat accessibility as something you bolt on later — a lint rule here, an `aria-label` there. We inverted that. The toolkit is designed around the **WCAG 2.2 AA** form patterns it can automate:

- automatic `aria-invalid`, `aria-required`, and `aria-describedby` on supported controls
- `role="alert"` for blocking errors and `role="status"` for warnings, using the roles' implicit live-region semantics (no redundant `aria-live` that some AT + browser combos double-announce)
- `on-touch` error timing by default so screen-reader users aren't shouted at before they've typed a character
- focus helpers (`focusFirstInvalid`, `createOnInvalidHandler`) so a failed submit lands the cursor on the first problem

And this isn't a marketing claim. **The toolkit's ARIA output is checked against the WCAG 2.2 AA axe-core ruleset on every change, as a hard-fail CI gate, cross-engine in Chromium and Firefox.** A regression in the accessibility mechanics the toolkit controls literally cannot reach a release.

One honest caveat I want to state clearly: this covers the mechanics *the toolkit owns*. WCAG conformance is a property of your finished page — your labels, contrast, copy, and keyboard order still matter. Treat the automation as a verified head start, then audit the deployed form. I'd rather tell you that than oversell it.

---

## The features that made it worth building

### 1. Error timing you configure once, in plain English

- `'immediate'` — show feedback as soon as a validator reports it
- `'on-touch'` — show feedback after the field is touched or the form is submitted (the default)
- `'on-submit'` — keep feedback hidden until a submit attempt happens

You don't hand-write the "touched OR submitted" condition on every field anymore. You pick a strategy, and every wrapper, the auto-ARIA layer, and the assistive components obey it.

### 2. Warnings that don't block submit

This is the feature I missed most from my `ngx-vest-forms` days. A **warning** is a non-blocking validation message — "this password is weak, but you can proceed." Angular Signal Forms treats every `ValidationError` as blocking, so the toolkit models warnings as a per-error convention (`warn:` prefix) and gives you helpers to submit past them:

```typescript
import { form, schema, minLength, validate } from '@angular/forms/signals';
import { warningError, submitWithWarnings, canSubmitWithWarnings } from '@ngx-signal-forms/toolkit';

protected readonly signupForm = form(
  this.model,
  schema((path) => {
    minLength(path.password, 8, { message: 'Minimum 8 characters' }); // blocking
    validate(path.password, (ctx) =>
      ctx.value().length < 12
        ? warningError('weak', 'Consider 12+ characters for better security')
        : null,
    ); // non-blocking — renders as role="status", submission passes through
  }),
);

protected readonly submit = () =>
  submitWithWarnings(this.signupForm, async () => this.api.save(this.model()));

protected readonly canSubmit = canSubmitWithWarnings(this.signupForm); // ignores warnings
```

`submitWithWarnings` touches all fields, waits for async validation to settle, and guards against double-submit — the boilerplate you'd otherwise hand-roll and get wrong under a slow network.

### 3. One configuration cascade, most-specific-wins

Every presentation setting — error strategy, appearance, orientation, required markers, control presets, renderers — resolves through **one** precedence chain:

```text
field / component input
  ?? form context (ngxSignalForm)
  ?? component-scoped provider (…ForComponent)
  ?? app-wide provider (provideNgxSignalForms…)
  ?? built-in default
```

Merging is per-key with nullish `??`, so you override the one key that differs and inherit the rest. Set your org defaults once in `app.config.ts`, flip a single key for one feature area, and reserve field-level inputs for genuine one-offs. An explicit input in a template becomes a signal that says "this field is an exception worth noticing."

### 4. Validation layering, not validation lock-in

Because I maintain a Vest library, people assume this toolkit is a Vest thing. It isn't. It's validator-agnostic and encourages you to layer:

```typescript
form(model, (path) => {
  required(path.email);                        // Angular validators — small local rules
  validateStandardSchema(path, SignupSchema);  // Zod / OpenAPI — shared contract & shape
  validateVest(path, businessSuite, { includeWarnings: true }); // Vest — business policy + warn()
});
```

Angular validators, Standard Schema (Zod/OpenAPI), and Vest are complementary, not mutually exclusive. Vest support lives behind an optional `/vest` entry point — you only pull it in if you want it.

### 5. Pick your level of control

Most apps only ever need the wrapper. But the toolkit ships as layered entry points so you're never trapped:

- **`/form-field`** — the ready-made wrapper (the 90% path)
- **`/assistive`** — standalone error, hint, counter, and summary components for when you already have a layout system
- **`/headless`** — renderless directives that give you toolkit-managed state (error visibility, aggregation, focus, character counts) while **you own every element and class**
- **`/vest`** — the optional Vest adapter

Bring-your-own design system is a first-class scenario, not a workaround.

---

## "But does it work with *my* component library?"

Yes — and I don't mean "it should probably work." Three runnable reference wrappers ship in the repo:

- **Angular Material** — wraps `<mat-form-field>` so Material keeps its own `aria-describedby` ownership while the toolkit adds strategy, warnings, and centralized DI.
- **Spartan** — wraps Spartan's `BrnField` and bridges its a11y service.
- **PrimeNG** — a projected-control wrapper for `pInputText` and friends.

Each has its own demo app *and* its own end-to-end test suite. When a widget already manages its ARIA, you hand it ownership explicitly (`ngxSignalFormControlAria="manual"`) and the toolkit stays out of its way — because the golden rule of accessible forms is **one ARIA owner per attribute**.

---

## This is not a toy: examples and e2e tests

I want to be concrete about why this is a `1.0.0` and not a hopeful `0.x`.

The repo ships **~20 runnable demo examples** covering the real use cases people hit: your-first-form, error-display modes, warnings, complex nested forms, custom controls, label-less fields, fieldset appearance, multi-step wizards, async validation, cross-field validation, field-state patterns, global configuration, submission patterns, and Zod / Vest / Zod+Vest validation. Every one is a live page you can open, read the source for, and copy.

Behind those demos is a large **end-to-end test suite** — the main demo app alone has dozens of Playwright specs, with additional suites for the Material, Spartan, and PrimeNG integrations, on top of automated axe-core accessibility scans running cross-engine in CI. When I say "it works properly," I mean there's a machine proving it on every commit, not just green unit tests.

Browse them all here: **[ngx-signal-forms.github.io/ngx-signal-forms](https://ngx-signal-forms.github.io/ngx-signal-forms/)**

---

## Best practices (the short version)

If you adopt the toolkit, these five habits get you the most out of it. Each expands into a full guide in the repo, but here's the essence:

1. **Configure at the highest tier that's true.** App-wide config for org defaults, `…ForComponent` for feature exceptions, field inputs only for genuine one-offs. Let the cascade do the work — don't repeat `appearance="outline"` on 40 wrappers.
2. **Keep Angular as the single source of truth.** Warnings are for ignorable advice; anything that must hold before saving stays a blocking error. If removing a toolkit API would change submitted data, it's on the wrong side of the boundary.
3. **Start native, zero API.** A stable `id` per control plus DOM inference and auto-ARIA cover native fields. Reach for `ngxSignalFormControl` and manual ARIA only where inference genuinely can't go — custom and third-party widgets.
4. **Pick the right surface — and exactly one ARIA owner.** Wrapper for the common path, fieldset for group rules, assistive/headless when you own the markup. Never let two systems write the same `aria-*` attribute.
5. **Layer validation deliberately.** Angular validators for local rules, Standard Schema for contracts, Vest for business policy — side by side in one schema callback.

---

## Coming from `ngx-vest-forms`?

If you're one of my `ngx-vest-forms` users: this is not a drop-in rename, and I won't pretend otherwise. `ngx-vest-forms` is a template-driven integration; this toolkit sits on Angular Signal Forms, where the source of truth is a `signal()` model and fields bind with `[formField]`. Treat it as a **form-by-form refactor**, not a codemod.

The good news: your Vest business rules largely survive (after a Vest 5 → 6 upgrade, which is a hard prerequisite), and there's a dedicated migration guide in the repo covering the API mapping, the warning-submit pattern, and the advanced cases (`validationConfig`, `validateRootForm`) that need deliberate review. A common, pragmatic path is to move contract rules to Zod first and keep Vest only for the genuinely business-specific logic.

---

## Getting started

```bash
npm install @ngx-signal-forms/toolkit
```

Requirements: Angular `22.x`, TypeScript 6.0+, modern browsers. Angular Signal Forms is stable as of Angular 22, and the toolkit's public API is stable as of this release.

- 🚀 **[Live demo](https://ngx-signal-forms.github.io/ngx-signal-forms/)**
- 📦 **[npm: @ngx-signal-forms/toolkit](https://www.npmjs.com/package/@ngx-signal-forms/toolkit)**
- 📖 **[GitHub + full docs](https://github.com/ngx-signal-forms/ngx-signal-forms)**

There's even an AI skill you can drop into your agent so it knows the toolkit's patterns:

```bash
npx skills add https://github.com/ngx-signal-forms/ngx-signal-forms --skill ngx-signal-forms
```

---

## Closing thought

Angular Signal Forms is the best form primitive the framework has ever had. It just, very intentionally, leaves the accessibility and presentation layer to you. After years of writing that layer by hand — and getting it wrong often enough to respect how hard it is — I wanted a library that makes the accessible path the *default* path, keeps Angular firmly in charge of the form, and proves it works with real examples and real tests.

That's `@ngx-signal-forms/toolkit` v1.0.0. Give it a try, open an issue, tell me what breaks. I've been doing Angular forms for a very long time — I'd love for this to be the last time any of us hand-writes `aria-describedby` on an input.

If you build something with it, I'd genuinely love to hear about it in the comments. 🚀
