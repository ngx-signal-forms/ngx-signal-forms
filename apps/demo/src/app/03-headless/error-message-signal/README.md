# Error Message Signal

> **Flat error iteration:** `createErrorMessageSignal` — visibility gating, message resolution, and stable ARIA IDs in one primitive.

## 🎯 What this demo shows

A password field wired to three simultaneous `createErrorMessageSignal` instances, each demonstrating a different `includeWarnings` mode, plus a live registry swap button to show reactive message re-resolution.

## 📐 Key patterns

### Flat `@for` — no outer `@if`

```html
<ul>
  @for (entry of errors(); track entry.kind) {
  <li [id]="entry.id">{{ entry.message }}</li>
  }
</ul>
```

The signal already handles visibility gating: when errors shouldn't be shown (field untouched, form not submitted) it returns `[]`, so the list renders nothing naturally. No wrapper `@if` required.

### `aria-describedby` from signal IDs

```typescript
readonly ariaDescribedByBlocking = computed(() => {
  const ids = this.blockingErrors().map(e => e.id);
  return ids.length > 0 ? ids.join(' ') : null;
});
```

```html
<input [attr.aria-describedby]="ariaDescribedByBlocking()" />
```

IDs are `{fieldName}-error-{kind}` — the same format the in-tree wrapper uses, so swapping between headless and wrapper never breaks `aria-describedby` chains.

### Reactive registry swap

```typescript
readonly activeRegistry = signal<ErrorMessageRegistry>(REGISTRY_VERBOSE);

readonly errors = createErrorMessageSignal(
  () => this.form.password(),
  { fieldName: 'password', errorMessages: this.activeRegistry },
);

toggleRegistry(): void {
  this.activeRegistry.set(this.verboseRegistry() ? REGISTRY_TERSE : REGISTRY_VERBOSE);
}
```

Swapping `activeRegistry` causes all three signal instances to re-resolve their messages without re-creating them.

## 🔍 Three `includeWarnings` modes

| Mode          | Option                    | Output                                  |
| ------------- | ------------------------- | --------------------------------------- |
| Blocking only | _(default)_               | `required`, `minLength` errors          |
| All           | `includeWarnings: true`   | Blocking first, then warnings           |
| Warnings only | `includeWarnings: 'only'` | `warn:*` entries, rendered in `<aside>` |

## ➡️ Related

- [Headless section README](../README.md) — overview of all headless demos
- [packages/toolkit/headless/README.md](../../../../../../packages/toolkit/headless/README.md) — `createErrorMessageSignal` API reference
