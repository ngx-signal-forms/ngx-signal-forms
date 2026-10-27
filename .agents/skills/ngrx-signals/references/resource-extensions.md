# NgRx resource extensions

Use this branch for loading/error value policies on Angular resources, inside or outside a store. These APIs come from `@ngrx/signals/resource` in v22 and are experimental. Toolkit is not required.

## Choose a policy

| Extension                      | Value policy                                                       |
| ------------------------------ | ------------------------------------------------------------------ |
| `withPreviousValueOnLoading()` | Keep the last resolved value during loading                        |
| `withValueOnLoading(value)`    | Supply a fallback during loading                                   |
| `withPreviousValueOnError()`   | Keep the last successfully resolved value after failure            |
| `withValueOnError(value)`      | Supply a fallback instead of throwing on an error-state value read |

Choose stale values only when the UI can identify them as stale. Retaining a previous detail record after its requested id changes can display one record under another record's heading. Test first-load failure too, when there is no previous result.

`defaultValue` alone does not prevent native error-state reads from throwing. Keep an error branch even when a fallback makes `value()` safe; fallback data is not evidence of a successful request.

## Extend the resource

```ts
import { httpResource } from '@angular/common/http';
import { signal } from '@angular/core';
import {
  extendResource,
  withPreviousValueOnLoading,
  withValueOnError,
} from '@ngrx/signals/resource';

type Ticket = { id: string; title: string };

// Create in a component/service initializer or another injection context.
const page = signal(1);
const tickets = extendResource(
  httpResource<Ticket[]>(() => `/api/tickets?page=${page()}`),
  withPreviousValueOnLoading(),
  withValueOnError(undefined),
);
```

`extendResource` patches and returns the same resource, preserving its original type, including writable or HTTP-specific members. It does not register store state or create `<name>Value` members. Use `withProps` to hold a resource object in a SignalStore; use Toolkit `withResource` only when you want its flattened store integration.

## Injector scope and precedence

`provideResourceExtensions(...)` installs defaults in an application, route, or component injector. `extendResource(resource)` applies those defaults. Bare resources that never pass through `extendResource` are unaffected.

Parent defaults compose with child defaults. Per-resource extensions come after those defaults. Extensions are objects with a `type` symbol and an `apply` function; for the same `type`, the last extension wins. Choose one loading policy and one error policy per resource rather than relying on accidental ordering.

## Combining with Toolkit

Toolkit's `withResource(..., { errorHandling })` is a separate wrapper. If NgRx extensions own the error policy, choose Toolkit's `errorHandling: "native"` to preserve the extended behavior. Otherwise Toolkit's default undefined-on-error proxy can mask the extension's fallback.

Use one layer as the policy owner. Test its `value`, `error`, `hasValue`, and `snapshot` together: Toolkit v22 forwards the source snapshot directly rather than rebuilding it from its proxied value. Do not assume all representations use the same fallback.

## Checks

- Change request inputs and assert the loading policy.
- Fail the first load and a later refetch; assert fallback and visible error behavior.
- Change a detail id; verify stale data cannot be submitted as the new record.
- Exercise parent, child, and local defaults; assert same-type precedence.
- On NgRx 21, keep native guarded reads or the installed Toolkit policy instead of importing the v22 entry point.

Sources: [guide](https://ngrx.io/guide/signals/resource-extensions), [v22 announcement](https://dev.to/ngrx/announcing-ngrx-v22-resource-extensions-dynamic-deep-signals-a-light-theme-and-more-5gci), [Toolkit wrapper audit](../../ngrx-toolkit/references/toolkit-v22-audit.md). Verified 2026-09-08, including Context7 `/ngrx/platform`.
