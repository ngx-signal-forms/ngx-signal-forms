# @ngx-signal-forms/toolkit

[![skills.sh](https://skills.sh/b/ngx-signal-forms/ngx-signal-forms)](https://skills.sh/ngx-signal-forms/ngx-signal-forms)

Error and warning display, automatic ARIA, focus helpers, and themed fields for
Angular Signal Forms. Angular owns the model, validation, field state, and
submission. Keep using `form()`, `[formRoot]`, and `[formField]`.

[Live demo](https://ngx-signal-forms.github.io/ngx-signal-forms/) ·
[npm](https://www.npmjs.com/package/@ngx-signal-forms/toolkit) ·
[API reference](./packages/toolkit/README.md)

## Install

```bash
npm install @ngx-signal-forms/toolkit
```

Use Angular 22. See [compatibility](./COMPATIBILITY.md) for the supported
Angular, TypeScript, Node, and browser versions. Vest and axe-core are optional
peers needed only for their respective entry points.

The styled components include their CSS. No separate stylesheet import is
needed. Use public CSS custom properties to theme them.

Check your installed version against the [migration index](./docs/migrations/README.md)
before using features from the current source tree.

## AI agent skill

Install the `ngx-signal-forms` skill with either CLI:

- **skills.sh:** `npx skills add ngx-signal-forms/ngx-signal-forms --skill ngx-signal-forms`
- **Context7:** `npx ctx7 skills install /ngx-signal-forms/ngx-signal-forms ngx-signal-forms --universal`

Choose one installer. The Context7 command uses `.agents/skills/`, which supports
GitHub Copilot, Codex, and other agents. See the [skills.sh CLI](https://skills.sh/docs/cli)
and [Context7 skill commands](https://github.com/upstash/context7/blob/master/skills/context7-cli/references/skills.md)
for other agents and global installs.

The [skill](./.agents/skills/ngx-signal-forms/SKILL.md) includes guides for forms,
warnings, custom controls, wrappers, accessibility checks, and migrations.
It works without this repository, Nx, or another installed skill. Keep its
supporting files together. Deeper source examples and version-specific migration
guides need network access; API choices use your installed package declarations.

Ask your agent, for example: “Use ngx-signal-forms to add a profile form with
validation feedback and inherited styling.” Context7 documentation lookup is
optional and separate from installing this skill.

## Quick start

Copy this component into an Angular application and render `<app-contact />`.
The example records the submitted email locally. Replace the action with your
API call when integrating it into an application.

<!-- documentation-starter:start -->

```typescript
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';
import {
  createOnInvalidHandler,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';

@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  template: `
    <form [formRoot]="contactForm">
      <ngx-form-field-wrapper [formField]="contactForm.email">
        <label for="contact-email">Email</label>
        <input
          id="contact-email"
          type="email"
          autocomplete="email"
          [formField]="contactForm.email"
        />
      </ngx-form-field-wrapper>
      <button type="submit" [disabled]="contactForm().submitting()">
        Send
      </button>
    </form>
    <p role="status">{{ savedEmail() ? 'Saved: ' + savedEmail() : '' }}</p>
  `,
})
export class ContactComponent {
  readonly model = signal({ email: '' });
  readonly savedEmail = signal('');
  readonly contactForm = form(
    this.model,
    (path) => {
      required(path.email, { message: 'Email is required' });
      email(path.email, { message: 'Enter a valid email address' });
    },
    {
      submission: {
        action: async (tree) => {
          this.savedEmail.set(tree().value().email);
        },
        onInvalid: createOnInvalidHandler(),
      },
    },
  );
}
```

<!-- documentation-starter:end -->

`NgxSignalFormToolkit` is an import bundle. It includes Angular's `FormRoot`,
the toolkit form-context directive, auto-ARIA, and control semantics. Import
Angular's `FormField` separately. `NgxFormField` supplies the styled wrapper
and its feedback components.

Try the starter:

1. Send the empty form. The email error appears and focus moves to the input.
2. Enter an invalid email and leave the field. The error stays visible.
3. Enter `reader@example.com` and send. The saved value appears below the form.

The [starter check](./tools/scripts/check-documentation-starter.mjs) compiles
this exact block and tests its submission action. From the repository root,
run `pnpm nx run toolkit:check-documentation-starter`.

## Which part of the toolkit do I need?

| Need                                                     | Entry point or guide                                     |
| -------------------------------------------------------- | -------------------------------------------------------- |
| Styled fields and grouped sections                       | [`/form-field`](./packages/toolkit/form-field/README.md) |
| Errors, hints, counters, or summaries in your own layout | [`/assistive`](./packages/toolkit/assistive/README.md)   |
| State helpers with full control of markup                | [`/headless`](./packages/toolkit/headless/README.md)     |
| Shared timing, messages, ARIA, and submission helpers    | [Root API](./packages/toolkit/README.md)                 |
| Vest business rules                                      | [`/vest`](./packages/toolkit/vest/README.md)             |
| axe-core assertions in your tests                        | [`/testing`](./packages/toolkit/testing/README.md)       |
| A custom input or widget                                 | [Custom controls](./docs/CUSTOM_CONTROLS.md)             |
| Your own field wrapper                                   | [Custom wrappers](./docs/CUSTOM_WRAPPERS.md)             |

The repository also contains reference wrappers for
[Material](./apps/demo-material/README.md),
[Spartan](./apps/demo-spartan/README.md), and
[PrimeNG](./apps/demo-primeng/README.md). These are demo implementations,
not published toolkit entry points.

Start with Angular validators for local rules. Add Standard Schema when you
share a data contract, or Vest when you need its business-rule model. You do
not need all three. See [validation choices](./docs/VALIDATION_STRATEGY.md).

## Error strategies in plain English

- `immediate` shows feedback when validation reports it.
- `on-touch` shows feedback after touch or a recorded submit attempt.
- `on-submit` waits for a recorded submit attempt.

`on-touch` is the built-in fallback, not an unconditional standalone setting.
Explicit inputs and applicable provider defaults can override it.

### Adding form-level context with `ngxSignalForm`

The starter uses Angular submission options. Angular touches fields on submit,
so the fallback `on-touch` display works without toolkit form context.

Add `ngxSignalForm` on the same form as `[formRoot]` when you need shared
timing or submitted-status tracking. For example, use `errorStrategy="on-submit"`
and `warningStrategy="on-touch"` on that form.

### How settings resolve (the cascade)

Error and warning timing have separate channels. Each resolves an explicit
input, then form context, then the applicable provider default, then `on-touch`.
Omitting a field strategy and setting `inherit` both defer to that cascade.
Appearance and other visual settings have no form-context tier.

See [configuration](./packages/toolkit/README.md#configuration) for the API
and [timing contracts](./docs/WARNINGS_SUPPORT.md#timing-and-configuration)
for exceptions, including standalone auto-ARIA and override mode.

## Warnings that don't block submit

`warningError()` creates a normal Angular validation error with a `warn:` kind.
The toolkit displays it as advice, but ordinary Angular submission still
blocks a warning-only invalid form.

Use `submitWithWarnings()` or an equivalent blocking-error guard when warnings
should pass. Do not use `ignoreValidators: 'all'` without that guard.

**Pending validators do not block `submitWithWarnings()`.** It yields one
microtask, not until async validation settles. `canSubmitWithWarnings()` also
ignores pending validation. If a remote check must finish before saving, enforce
that policy separately and validate the submitted data on the server.

See the [submission contract](./docs/WARNINGS_SUPPORT.md#form-submission-behavior)
for event wiring, return values, re-entry, and failed-attempt tracking.

<a id="accessibility"></a>

## Accessibility and ownership

Give each control a persistent label and stable ID. The toolkit associates
rendered errors, warnings, and hints with supported bound controls.

Choose one ARIA owner. For custom markup that owns the attributes, use
`ngxSignalFormControlAria="manual"` on the bound host and import the toolkit
directive in that template. Do not rely on the global `autoAria: false` option;
the current auto-ARIA directive does not consume it.

Headless per-message IDs and wrapper feedback-container IDs are different
contracts. A renderer swap must preserve the referenced containers or update
the description chain. See [custom wrappers](./docs/CUSTOM_WRAPPERS.md).

Automated accessibility checks cover markup and ARIA rules, not complete WCAG
conformance or guaranteed screen-reader announcements. Test labels, contrast,
keyboard navigation, and screen readers in the finished application.

## Native HTML validation vs Signal Forms

Keep native semantics such as `type`, `autocomplete`, and input modes. Angular
also propagates supported validator metadata to native constraints.

Native `:invalid` and `:user-invalid` are a separate styling policy. They do
not represent all schema or server errors, warnings, or toolkit timing. For
strategy-consistent styling, use toolkit-rendered ARIA or the same visibility
signal as the feedback. See [CSS integration](./docs/CSS_FRAMEWORK_INTEGRATION.md).

## Guides

- [Theming](./packages/toolkit/form-field/THEMING.md)
- [Grouped fields and summaries](./docs/COMPLEX_NESTED_FORMS.md)
- [Warnings, timing, and message resolution](./docs/WARNINGS_SUPPORT.md)
- [Testing form components](./docs/TESTING.md)
- [Best practices](./docs/BEST_PRACTICES.md)
- [FAQ](./docs/FAQ.md)
- [Angular and toolkit ownership](./docs/ANGULAR_VS_TOOLKIT.md)
- [Versioned migrations](./docs/migrations/README.md)
- [Reactive Forms migration](./docs/MIGRATING_FROM_REACTIVE_FORMS.md)
- [Vest Forms migration](./docs/MIGRATING_FROM_NGX_VEST_FORMS.md)
- [Contributing](./docs/CONTRIBUTING.md)
