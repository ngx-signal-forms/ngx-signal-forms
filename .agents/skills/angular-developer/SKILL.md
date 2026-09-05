---
name: angular-developer
description: Generates Angular code and provides architectural guidance. Trigger when creating projects, components, services, or HTTP communication, or for best practices on reactivity (signals, linkedSignal, resource, httpResource), forms, dependency injection, routing, SSR, accessibility (ARIA), animations, styling (component styles, Tailwind CSS), testing, or CLI tooling.
license: MIT
metadata:
  author: Copyright 2026 Google LLC
  version: '1.0'
---

# Angular Developer Guidelines

1. Check the project's installed Angular version before choosing APIs. Preserve its form strategy unless the user authorizes a migration.

2. Follow Angular's style guide. In an Nx workspace, use the `nx-generate` skill and the workspace's configured generators. Outside Nx, use the project's Angular CLI for generation.

3. After generating code, build the affected project and fix relevant errors. In Nx, use `nx-run-tasks` to run its configured build target through the workspace package manager. Outside Nx, use its configured build command or local Angular CLI.

## Creating new projects

In an existing Nx workspace, use `nx-generate` first and match the workspace's Angular version. Do not create a separate CLI workspace inside it unless requested.

For a new project outside Nx:

1. If the user specifies a version, use `npx @angular/cli@<requested_version> new <project-name>`.
2. Otherwise select the latest stable CLI explicitly with `npx @angular/cli@latest new <project-name>`. A global CLI installation does not determine the new project's version.
3. Prefer Signal Forms for new Angular v22+ projects. They are stable in v22 and experimental in v21. Read [Signal Forms](references/signal-forms.md) before implementation.

## Components

When working with Angular components, consult the following references based on the task:

- **Fundamentals**: Anatomy, metadata, core concepts, and template control flow (@if, @for, @switch). Read [components.md](references/components.md)
- **Inputs**: Signal-based inputs, transforms, and model inputs. Read [inputs.md](references/inputs.md)
- **Outputs**: Signal-based outputs and custom event best practices. Read [outputs.md](references/outputs.md)
- **Host Elements**: Host bindings and attribute injection. Read [host-elements.md](references/host-elements.md)

If you require deeper documentation not found in the references above, read the documentation at `https://angular.dev/guide/components`.

## Reactivity and Data Management

When managing state and data reactivity, use Angular Signals and consult the following references:

- **Signals Overview**: Core signal concepts (`signal`, `computed`), reactive contexts, and `untracked`. Read [signals-overview.md](references/signals-overview.md)
- **Dependent State (`linkedSignal`)**: Creating writable state linked to source signals. Read [linked-signal.md](references/linked-signal.md)
- **Async Reactivity (`resource`)**: Fetching asynchronous data directly into signal state. Read [resource.md](references/resource.md)
- **Side Effects (`effect`)**: Logging, third-party DOM manipulation (`afterRenderEffect`), and when NOT to use effects. Read [effects.md](references/effects.md)

## HTTP Communication

When communicating with backend services, use Angular HTTP APIs and consult the following reference:

- **HTTP Client and Resources**: `provideHttpClient`, `HttpClient`, interceptors, and `httpResource`. Read [http-client.md](references/http-client.md)

## Forms

Preserve the application's existing form strategy, including new forms added to that application, unless the user authorizes a change. For new Angular v22+ applications, prefer Signal Forms. Complexity alone does not require Reactive Forms.

- **Signal Forms**: Read [signal-forms.md](references/signal-forms.md) for APIs, submission, validation, and custom controls. This repository owns the canonical project-specific reference; update it here rather than copying it to user-level skills.
- **Template-driven forms**: Read [template-driven-forms.md](references/template-driven-forms.md) when maintaining or explicitly choosing this strategy.
- **Reactive forms**: Read [reactive-forms.md](references/reactive-forms.md) when maintaining or explicitly choosing this strategy.

## Dependency Injection

When implementing dependency injection in Angular, follow these guidelines:

- **Fundamentals**: Overview of Dependency Injection, services, and the `inject()` function. Read [di-fundamentals.md](references/di-fundamentals.md)
- **Creating and Using Services**: Creating services, the `providedIn: 'root'` option, and injecting into components or other services. Read [creating-services.md](references/creating-services.md)
- **Defining Dependency Providers**: Automatic vs manual provision, `InjectionToken`, `useClass`, `useValue`, `useFactory`, and scopes. Read [defining-providers.md](references/defining-providers.md)
- **Injection Context**: Where `inject()` is allowed, `runInInjectionContext`, and `assertInInjectionContext`. Read [injection-context.md](references/injection-context.md)
- **Hierarchical Injectors**: The `EnvironmentInjector` vs `ElementInjector`, resolution rules, modifiers (`optional`, `skipSelf`), and `providers` vs `viewProviders`. Read [hierarchical-injectors.md](references/hierarchical-injectors.md)

## Pipes

When formatting values in templates, creating custom pipes, or reusing pipe-like logic in TypeScript, consult the following reference. Prefer pipes in templates; outside templates, avoid injecting pipe classes just to call `transform()`.

- **Pipes**: Built-in pipe imports, custom pipe naming and implementation, pure vs impure pipes, and TypeScript reuse patterns using standalone formatting functions or extracted plain functions. Read [pipes.md](references/pipes.md)

## Angular Aria

When building accessible custom components for any of the following patterns: Accordion, Listbox, Combobox, Menu, Tabs, Toolbar, Tree, Grid, consult the following reference:

- **Angular Aria Components**: Building headless, accessible components (Accordion, Listbox, Combobox, Menu, Tabs, Toolbar, Tree, Grid) and styling ARIA attributes. Read [angular-aria.md](references/angular-aria.md)

## Routing

When implementing navigation in Angular, consult the following references:

- **Define Routes**: URL paths, static vs dynamic segments, wildcards, and redirects. Read [define-routes.md](references/define-routes.md)
- **Route Loading Strategies**: Eager vs lazy loading, and context-aware loading. Read [loading-strategies.md](references/loading-strategies.md)
- **Show Routes with Outlets**: Using `<router-outlet>`, nested outlets, and named outlets. Read [show-routes-with-outlets.md](references/show-routes-with-outlets.md)
- **Navigate to Routes**: Declarative navigation with `RouterLink` and programmatic navigation with `Router`. Read [navigate-to-routes.md](references/navigate-to-routes.md)
- **Control Route Access with Guards**: Implementing `CanActivate`, `CanMatch`, and other guards for security. Read [route-guards.md](references/route-guards.md)
- **Data Resolvers**: Pre-fetching data before route activation with `ResolveFn`. Read [data-resolvers.md](references/data-resolvers.md)
- **Router Lifecycle and Events**: Chronological order of navigation events and debugging. Read [router-lifecycle.md](references/router-lifecycle.md)
- **Rendering Strategies**: CSR, SSG (Prerendering), and SSR with hydration. Read [rendering-strategies.md](references/rendering-strategies.md)
- **Route Transition Animations**: Enabling and customizing the View Transitions API. Read [route-animations.md](references/route-animations.md)

If you require deeper documentation or more context, visit the [official Angular Routing guide](https://angular.dev/guide/routing).

## Styling and Animations

When implementing styling and animations in Angular, consult the following references:

- **Using Tailwind CSS with Angular**: Integrating Tailwind CSS into Angular projects. Read [tailwind-css.md](references/tailwind-css.md)
- **Angular Animations**: Using native CSS (recommended) or the legacy DSL for dynamic effects. Read [angular-animations.md](references/angular-animations.md)
- **Styling components**: Best practices for component styles and encapsulation. Read [component-styling.md](references/component-styling.md)

## Testing

When writing or updating tests, consult the following references based on the task:

- **Fundamentals**: Best practices for unit testing (Vitest), async patterns, and `TestBed`. Read [testing-fundamentals.md](references/testing-fundamentals.md)
- **Component Harnesses**: Standard patterns for robust component interaction. Read [component-harnesses.md](references/component-harnesses.md)
- **Router Testing**: Using `RouterTestingHarness` for reliable navigation tests. Read [router-testing.md](references/router-testing.md)
- **End-to-End (E2E) Testing**: Setting up and running E2E tests. Read [e2e-testing.md](references/e2e-testing.md)

## Tooling

When working with Angular tooling, consult the following references:

- **Angular CLI**: Creating applications, generating code (components, routes, services), serving, and building. Read [cli.md](references/cli.md)
- **Code Modernization**: Automatically refactoring to modern standards using migrations. Read [migrations.md](references/migrations.md)
- **Angular MCP Server**: Available tools, configuration, and experimental features. Read [mcp.md](references/mcp.md)
- **Environment Configuration**: Strategies for build-time and runtime configuration. Read [environment-configuration.md](references/environment-configuration.md)
