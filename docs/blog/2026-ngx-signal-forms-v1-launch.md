---
title: 'Accessible Angular Signal Forms, without the boilerplate — @ngx-signal-forms/toolkit v1.0.0'
published: false
description: 'Angular Signal Forms gives you the model, validation, and submission lifecycle. This toolkit adds everything Angular leaves to you: automatic ARIA wiring, error timing, non-blocking warnings, and a themable field wrapper.'
tags: 'angular, typescript, webdev, a11y'
cover_image: ''
canonical_url: ''
---

## Hi, quick intro

I've been an Angular developer for a long time — long enough that "Angular" still means AngularJS in my muscle memory. I've built forms through every era of it: `ng-model`, template-driven, reactive, and all the `Validators` and `ControlValueAccessor` glue that came with each.

So when **Angular Signal Forms** landed and stabilized in Angular 22, I was genuinely excited. It's a great primitive. A `signal()` is your model, `form()` gives you reactive field state, and validation and submission are first-class. Cleanest form model Angular has ever shipped.

But if you've built production forms, you already know the catch: Signal Forms deliberately stops at the _behavior_. It hands you `invalid()`, `touched()`, `errors()`, and `pending()` and says _the rest is yours_ — which ARIA attributes to wire, when to show an error, how to render a warning that shouldn't block submit, how to keep it consistent across a whole app.

I wanted something that enhanced Signal Forms **without replacing it**, with **accessibility as the default instead of an afterthought**. I couldn't find one I liked, so I built it — and I've been tweaking and improving it since those first early Signal Forms releases.

Today it hits **v1.0.0: `@ngx-signal-forms/toolkit`**.

---

## The problem, in one field's worth of code

Here's a single accessible email field in **plain Angular Signal Forms**. It works — it's also the code you'll copy onto every field and get subtly wrong on at least one:

```html
<label for="email">Email</label>
<input
  id="email"
  [formField]="userForm.email"
  [attr.aria-invalid]="userForm.email().invalid() ? 'true' : null"
  [attr.aria-describedby]="
    userForm.email().invalid() &&
    (userForm.email().touched() || userForm().touched())
      ? 'email-error' : null
  "
/>
@if ( userForm.email().invalid() && (userForm.email().touched() ||
userForm().touched()) ) {
<span id="email-error" role="alert">
  {{ userForm.email().errors()[0].message }}
</span>
}
```

That's `aria-invalid`, `aria-describedby`, the "touched or submitted" timing, the `role="alert"` element, and the id wiring — for **one** field. Multiply across a form and never let a refactor break the id/`aria-describedby` link. This is exactly the repetitive, easy-to-break work that ends up shipping inaccessible forms.

Same field, with the toolkit:

```html
<ngx-form-field-wrapper [formField]="userForm.email">
  <label for="email">Email</label>
  <input id="email" type="email" [formField]="userForm.email" />
</ngx-form-field-wrapper>
```

The wrapper handles ARIA, error timing, `role="alert"` for errors vs `role="status"` for warnings, hint projection, and character counts — automatically. And your `form()`, `[formRoot]`, and `[formField]` code didn't change. **The toolkit is additive.**

---

## What it is (and isn't)

It's **not** a form library. Angular Signal Forms is the form library. The toolkit is the accessibility-and-presentation layer on top:

| Angular Signal Forms owns                 | `@ngx-signal-forms/toolkit` adds                              |
| ----------------------------------------- | ------------------------------------------------------------- |
| `form()`, `schema()`, validators          | Strategy-aware error and warning display                      |
| `[formRoot]`, `[formField]`               | Automatic `aria-invalid`, `aria-required`, `aria-describedby` |
| Field state (`invalid()`, `touched()`, …) | Wrapper, fieldset, assistive, and headless surfaces           |
| Model updates and submission lifecycle    | Focus helpers, warning helpers, app-wide config               |

There's a one-line test for using it right: **if deleting a toolkit API would change the data you submit, you're on the wrong side of the boundary.** Angular stays the single source of truth. The toolkit only changes how a form _looks_ and how it _announces itself to assistive tech_ — never what it _does_.

That boundary is also a promise about the future: **the moment a piece of functionality lands in Angular itself, I deprecate the toolkit's version and/or ship a migration for it.** The toolkit is meant to fill the gaps Angular leaves today, not to compete with Angular tomorrow. As Signal Forms grows, the toolkit shrinks toward it — on purpose.

---

## 30-second quick start

```bash
npm install @ngx-signal-forms/toolkit
```

```typescript
import { Component, signal } from '@angular/core';
import {
  form,
  schema,
  required,
  email,
  FormField,
} from '@angular/forms/signals';
import {
  NgxSignalFormToolkit,
  createOnInvalidHandler,
} from '@ngx-signal-forms/toolkit';
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

From that markup you get, for free:

- ✅ `aria-invalid`, `aria-required`, `aria-describedby` wired automatically
- ✅ Errors after blur or submit (default `on-touch`), with `role="alert"`
- ✅ Warnings rendered as `role="status"`
- ✅ Hints and character counts with proper ARIA association
- ✅ First invalid field focused on failed submit

Notice there's no `ngxSignalForm` directive. You don't need it for the common path — plain `[formRoot]` and the default `on-touch` timing cover most forms. You add form-level context only when you want a different error strategy or submit-lifecycle tracking. Progressive complexity, not upfront ceremony.

---

## Why accessibility is the headline

Most form libraries treat accessibility as a bolt-on. I inverted that — the toolkit is designed around the **WCAG 2.2 AA** form patterns it can automate:

- automatic `aria-invalid`, `aria-required`, `aria-describedby` on supported controls
- `role="alert"` for blocking errors and `role="status"` for warnings, using each role's implicit live-region semantics (no redundant `aria-live` that some AT + browser combos double-announce)
- `on-touch` timing by default, so screen-reader users aren't shouted at before they've typed a character
- focus helpers (`focusFirstInvalid`, `createOnInvalidHandler`) so a failed submit lands on the first problem

And it's not just a claim: **the toolkit's ARIA output is checked against the WCAG 2.2 AA axe-core ruleset on every change in the toolkit's Chromium-based Vitest browser a11y specs, while the demo apps also run cross-engine Chromium + Firefox scans with baseline tracking.** A regression in the accessibility mechanics the toolkit controls can't reach a release.

One honest caveat: that covers the mechanics _the toolkit owns_. Full WCAG conformance is a property of your finished page — your labels, contrast, copy, and keyboard order still matter. Treat the automation as a verified head start, then audit the deployed form.

---

## The features that made it worth building

**Error timing, in plain English.** Pick one strategy and every wrapper, the auto-ARIA layer, and the assistive components obey it — no more hand-writing "touched OR submitted" per field:

- `'immediate'` — as soon as a validator reports it
- `'on-touch'` — after the field is touched or the form is submitted _(default)_
- `'on-submit'` — hidden until a submit attempt

**Warnings that don't block submit.** A warning is a non-blocking message — "this password is weak, but you can proceed." Angular treats every `ValidationError` as blocking, so the toolkit models warnings as a per-error `warn:` convention and gives you helpers to submit past them:

```typescript
import { form, schema, minLength, validate } from '@angular/forms/signals';
import { warningError, submitWithWarnings, canSubmitWithWarnings } from '@ngx-signal-forms/toolkit';

protected readonly signupForm = form(this.model, schema((path) => {
  minLength(path.password, 8, { message: 'Minimum 8 characters' }); // blocking
  validate(path.password, (ctx) =>
    ctx.value().length < 12
      ? warningError('weak', 'Consider 12+ characters for better security')
      : null,
  ); // non-blocking — renders role="status", submission passes through
}));

protected readonly submit = () =>
  submitWithWarnings(this.signupForm, async () => this.api.save(this.model()));

protected readonly canSubmit = canSubmitWithWarnings(this.signupForm); // ignores warnings
```

`submitWithWarnings` touches all fields, yields one microtask so sync validation can settle, bails out if async validators are still pending, and guards against double-submit — the boilerplate you'd otherwise get wrong under a slow network.

**One configuration cascade.** Every presentation setting — strategy, appearance, orientation, markers, presets, renderers — resolves through one precedence chain, most-specific wins:

```text
field / component input
  ?? form context (ngxSignalForm)
  ?? component-scoped provider (…ForComponent)
  ?? app-wide provider (provideNgxSignalForms…)
  ?? built-in default
```

Merging is per-key with nullish `??`, so you override the one key that differs and inherit the rest. Set org defaults once in `app.config.ts`, flip a single key for one feature area, keep field-level inputs for genuine one-offs.

**Validator-agnostic.** It doesn't lock you into one validation style — layer them:

```typescript
form(model, (path) => {
  required(path.email); // Angular — small local rules
  validateStandardSchema(path, SignupSchema); // Zod / OpenAPI — contract & shape
  validateVest(path, businessSuite, { includeWarnings: true }); // Vest — business policy
});
```

Vest support lives behind an optional `/vest` entry point — you only pull it in if you want it.

---

## Make it yours: theming, then your own wrappers

Adopting the wrapper doesn't mean adopting my design taste. Styling is a graceful slope, and you get off wherever you want:

**Start with theming.** The wrapper ships three appearances out of the box (`appearance="standard" | "outline" | "plain"`), and everything visual — colors, spacing, typography, borders, dark mode — is driven by **CSS custom properties**. No `::ng-deep`, no hacking internals, no rebuild to re-theme:

```css
:root {
  --ngx-form-field-color-primary: #6da305; /* focus & active borders     */
  --ngx-form-field-color-error: #d93025; /* invalid states + markers    */
  --ngx-form-field-gap: 0.5rem; /* space between label & input */
}

/* Runtime theming — flip the whole toolkit to dark instantly */
[data-theme='dark'] {
  --ngx-form-field-color-border: #334155;
}
```

Because it's just custom properties, mapping your existing Bootstrap / Tailwind / Material tokens onto the toolkit is a handful of lines — e.g. `--ngx-form-field-color-primary: var(--bs-primary);`. The wrapper also exposes stable `data-*` hooks (control kind, layout, ARIA mode) so you can style by control type without coupling to internal markup.

**If theming isn't enough, build your own wrapper.** This is the part I'm proudest of: you can throw out my markup entirely and keep all the behavior. The `/headless` directives hand you the toolkit-managed _state_ — strategy-aware error visibility, error aggregation, focus behavior, character counts, ARIA id generation — with **zero markup opinions**, and the `/assistive` components give you ready-made, WCAG-compliant error, hint, counter, and summary pieces to drop into your own layout. Compose those two and a bespoke field wrapper that matches your design system exactly is a small, pleasant component — not a fork.

That's the whole ladder of ownership:

- **`/form-field`** — the ready-made wrapper (the 90% path)
- **`/assistive`** — standalone error, hint, counter, and summary components for when you already have a layout
- **`/headless`** — renderless directives that give you toolkit-managed state while **you own every element and class**
- **`/vest`** — the optional Vest adapter

---

## Works with your component library

Not "it should probably work" — three runnable reference wrappers ship in the repo, each with its own demo app **and** its own e2e suite:

- **Angular Material** — wraps `<mat-form-field>`, letting Material keep its own `aria-describedby` ownership while the toolkit adds strategy, warnings, and centralized DI.
- **Spartan** — wraps `BrnField` and bridges its a11y service.
- **PrimeNG** — a projected-control wrapper for `pInputText` and friends.

When a widget already manages its ARIA, you hand it ownership explicitly (`ngxSignalFormControlAria="manual"`) and the toolkit stays out of its way — because the golden rule of accessible forms is **one ARIA owner per attribute**.

---

## Not a toy: examples and e2e tests

Here's why this is a `1.0.0` and not a hopeful `0.x`.

The repo ships **~20 runnable demo examples** covering the real cases: your-first-form, error-display modes, warnings, complex nested forms, custom controls, label-less fields, fieldset appearance, multi-step wizards, async validation, cross-field validation, field-state patterns, global configuration, submission patterns, and Zod / Vest / Zod+Vest. Every one is a live page you can open, read the source for, and copy.

**And every example is written against the latest Angular v22 best practices** — standalone components, signal `input()`s, the new `@if`/`@for` control flow, `OnPush`, and `signal()`/`computed()` state throughout. No legacy patterns to unlearn.

Behind the demos is a large **end-to-end suite** — the main demo app alone has dozens of Playwright specs, plus dedicated suites for the Material, Spartan, and PrimeNG integrations, on top of the cross-engine axe-core scans. When I say it works, there's a machine proving it on every commit.

Browse them all: **[ngx-signal-forms.github.io/ngx-signal-forms](https://ngx-signal-forms.github.io/ngx-signal-forms/)**

---

## Best practices, short version

1. **Configure at the highest tier that's true.** App-wide defaults, `…ForComponent` for feature exceptions, field inputs only for one-offs. Don't repeat `appearance="outline"` on 40 wrappers.
2. **Keep Angular as the single source of truth.** Warnings are for ignorable advice; anything that must hold before saving stays a blocking error.
3. **Start native, zero API.** A stable `id` per control plus DOM inference and auto-ARIA cover native fields. Reach for explicit control APIs only where inference can't go — custom and third-party widgets.
4. **Pick the right surface — and exactly one ARIA owner.** Never let two systems write the same `aria-*` attribute.
5. **Layer validation deliberately.** Angular validators for local rules, Standard Schema for contracts, Vest for business policy — side by side in one schema.

---

## Getting started

```bash
npm install @ngx-signal-forms/toolkit
```

Requirements: Angular `22.x`, TypeScript 6.0+, modern browsers. Signal Forms is stable as of Angular 22, and the toolkit's public API is stable as of this release.

- 🚀 **[Live demo](https://ngx-signal-forms.github.io/ngx-signal-forms/)**
- 📦 **[npm](https://www.npmjs.com/package/@ngx-signal-forms/toolkit)**
- 📖 **[GitHub + full docs](https://github.com/ngx-signal-forms/ngx-signal-forms)**

**Building with an AI agent?** I maintain and ship an official **`ngx-signal-forms` skill** alongside the library, so your agent gets the real patterns — entry points, ARIA automation, the config cascade, and demo references — instead of guessing. Drop it in with:

```bash
npx skills add https://github.com/ngx-signal-forms/ngx-signal-forms --skill ngx-signal-forms
```

---

## One last thing

Angular Signal Forms is the best form primitive the framework has ever had. It just, very intentionally, leaves the accessibility and presentation layer to you. After years of writing that layer by hand — and getting it wrong often enough to respect how hard it is — I wanted the accessible path to be the _default_ path, with Angular firmly in charge and real examples and tests behind it.

That's `@ngx-signal-forms/toolkit` v1.0.0. Give it a try, open an issue, tell me what breaks. I'd love for this to be the last time any of us hand-writes `aria-describedby` on an input.

If you build something with it, I'd genuinely love to hear about it in the comments. 🚀
