---
description: 'Angular-specific coding standards and best practices'
applyTo: '**/*.ts, **/*.html, **/*.scss, **/*.css'
---

# Angular Development Instructions

High-quality Angular 21+ applications with TypeScript, using Signals for state management, following https://angular.dev best practices.

## Version Detection - CRITICAL

**ALWAYS verify exact Angular version before generating code:**

1. Check `package.json` for `@angular/core` version
2. Verify framework versions match across all `@angular/*` packages
3. Check TypeScript compatibility
4. Only use features available in detected version
5. Never assume newer APIs without verification

## Core Standards

### Stack

- **Angular 21+** with Signal Forms and zoneless support
- **TypeScript 5.8+** strict mode
- **Standalone components** (no NgModules)
- **Signal-first** state management
- **OnPush** change detection
- **Zoneless** compatible patterns

### Architecture

- Standalone components ONLY (NgModules are legacy)
- Organize by feature/domain
- Lazy load feature routes
- Use `inject()` for DI (not constructors)
- Smart vs presentational component separation
- Signals for state (RxJS only for streams)

### TypeScript

- Strict mode REQUIRED
- Clear interfaces/types for all data
- Type guards and union types
- Avoid `any` - use `unknown`
- Typed forms with full inference
- Use `satisfies` operator
- Prefer `const` assertions and `readonly`

### Component Design

- **OnPush change detection** REQUIRED
- **Signal-based APIs** ONLY:
  - `input()` not `@Input()`
  - `output()` not `@Output()`
  - `model()` for two-way binding
  - `viewChild()` / `viewChildren()` not `@ViewChild()` / `@ViewChildren()`
  - `contentChild()` / `contentChildren()` not `@ContentChild()` / `@ContentChildren()`
- `inject()` for DI (no constructor injection)
- Declarative templates: `@if`, `@for`, `@switch` (not `*ngIf`, `*ngFor`, `*ngSwitch`)
- Move logic to component class or computed signals
- Use ES `#` private fields (not TypeScript `private`)

### Modern Template Syntax (Angular 17+)

```typescript
// Control flow
@if (condition()) {
  <p>Shown when true</p>
} @else {
  <p>Shown when false</p>
}

@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}

@switch (status()) {
  @case ('loading') { <spinner /> }
  @case ('error') { <error-msg /> }
  @default { <content /> }
}

@defer (on viewport) {
  <heavy-component />
} @placeholder {
  <skeleton />
}
```

### Forms

**IMPORTANT: This project focuses on Angular 21+ Signal Forms.**

**For comprehensive Signal Forms guidance, see `.github/instructions/signal-forms.instructions.md`**

**Quick reference:**

- **Signal Forms REQUIRED** for all form implementations in this project
- **Only use `id`** on inputs for label association
- **No `name` attributes** needed
- **OnPush** change detection required

```typescript
import { form, Control, required, email } from '@angular/forms/signals';

@Component({
  imports: [Control],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input [control]="userForm.email" />
    @if (userForm.email().invalid()) {
      <div>{{ userForm.email().errors()[0].message }}</div>
    }
  `,
})
export class UserFormComponent {
  readonly #userData = signal({ email: '' });

  protected readonly userForm = form(this.#userData, (path) => {
    required(path.email, { message: 'Email required' });
    email(path.email, { message: 'Valid email required' });
  });
}
```

**Reactive Forms (Legacy)** - Use only for existing apps

```typescript
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

@Component({
  imports: [ReactiveFormsModule],
  template: `<form [formGroup]="form"><input formControlName="email" /></form>`,
})
export class LegacyFormComponent {
  readonly #fb = inject(FormBuilder);
  protected readonly form = this.#fb.group({
    email: ['', [Validators.required, Validators.email]],
  });
}
```

### State Management

**Signal-first - REQUIRED:**

```typescript
import { signal, computed, effect } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p>Count: {{ count() }}</p>
    <p>Double: {{ doubleCount() }}</p>
    <button (click)="increment()">+</button>
  `,
})
export class CounterComponent {
  protected readonly count = signal(0);
  protected readonly doubleCount = computed(() => this.count() * 2);

  constructor() {
    effect(() => console.log('Count:', this.count()));
  }

  protected increment(): void {
    this.count.update((n) => n + 1);
  }
}
```

**Principles:**

1. Signals for reactive state (not RxJS Subjects)
2. Computed signals for derived state
3. Effects for side effects
4. `linkedSignal` for state depending on inputs
5. `resource()` for async data loading

**Use RxJS only for:**

- Event streams
- HTTP (convert with `toSignal()` or `resource()`)
- WebSockets
- Complex async operations

### Data Fetching

**With resource() (Angular 19+):**

```typescript
import { resource } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (userResource.isLoading()) {
      <spinner />
    } @else if (userResource.error()) {
      <error-msg />
    } @else if (userResource.hasValue()) {
      {{ userResource.value().name }}
    }
  `,
})
export class UserProfileComponent {
  readonly #userId = input.required<string>();

  protected readonly userResource = resource({
    request: () => ({ id: this.#userId() }),
    loader: ({ request }) => this.userService.getUser(request.id),
  });
}
```

**Key principles:**

- Use `resource()` for data fetching
- `inject()` for HttpClient
- Store data in signals
- Handle errors gracefully
- Use abort signals for cancellation

### Performance

**Critical optimizations:**

1. **OnPush + Zoneless**

```typescript
// main.ts
bootstrapApplication(AppComponent, {
  providers: [provideZonelessChangeDetection()],
});

// All components
@Component({ changeDetection: ChangeDetectionStrategy.OnPush })
```

2. **Defer Blocks**

```typescript
@defer (on viewport) { <heavy-chart /> }
@defer (on interaction) { <comments /> }
@defer (on idle) { <analytics /> }
```

3. **Optimize Rendering**

```typescript
// Use computed (not getters)
protected readonly items = computed(() =>
  this.data().map(/* transform */)
);

// TrackBy in loops
@for (item of items(); track item.id) { }
```

4. **Image & Route Optimization**

```typescript
// Images
<img ngSrc="hero.jpg" width="400" height="300" priority />

// Lazy routes
{ path: 'admin', loadComponent: () => import('./admin.component') }
```

5. **SSR + Hydration**

```typescript
providers: [provideClientHydration()];
```

### Testing

**Unit Testing:**

```typescript
import { TestBed } from '@angular/core/testing';

describe('Component', () => {
  it('should work', () => {
    const fixture = TestBed.createComponent(MyComponent);
    expect(fixture.componentInstance.count()).toBe(0);
  });
});
```

**E2E (Playwright):**

```typescript
import { test, expect } from '@playwright/test';

test('should display', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByRole('heading')).toBeVisible();
});
```

## Implementation Workflow

1. **Verify Angular Version** - Check `package.json` for exact version
2. **Plan Architecture** - Define features, signals, routes, forms
3. **Define Models** - TypeScript interfaces, form types, API types
4. **Scaffold** - `ng generate component/service/guard`
5. **Implement** - OnPush, signals, inject(), declarative templates
6. **Add Forms** - Prefer Signal Forms for new code
7. **Data Layer** - Use `resource()` or HttpClient with signals
8. **Route** - Lazy load with functional guards
9. **Style** - SCSS, responsive, accessible (WCAG 2.2)
10. **Test** - Vitest (unit), Playwright (E2E), >80% coverage
11. **Optimize** - Zoneless, defer blocks, lazy loading
12. **Deploy** - `ng build --configuration production`

## Quick Reference

### File Naming (kebab-case)

- Components: `user-profile.component.ts`
- Services: `user.service.ts`
- Guards: `auth.guard.ts` (functional)
- Routes: `user.routes.ts`

### File Organization

```
src/app/
├── core/           # Services, guards, interceptors
├── shared/         # Components, directives, pipes
├── features/       # Feature modules (lazy-loaded)
│   └── users/
│       ├── components/
│       ├── services/
│       └── users.routes.ts
├── app.component.ts
├── app.config.ts
└── app.routes.ts
```

### Code Generation

```bash
ng generate component features/user-list
ng generate service core/services/auth
ng generate guard core/guards/auth --functional
```

### Signal-First Checklist

**DO:**

- ✅ `signal()` for reactive state
- ✅ `computed()` for derived values
- ✅ `effect()` for side effects
- ✅ `resource()` for async data
- ✅ `input()`, `output()`, `model()`
- ✅ `viewChild()`, `contentChild()`
- ✅ `inject()` for DI
- ✅ ES `#` private fields

**DON'T:**

- ❌ `@Input()` / `@Output()`
- ❌ `@ViewChild()` / `@ContentChild()`
- ❌ Constructor injection
- ❌ RxJS for simple state
- ❌ NgModules
- ❌ `*ngIf`, `*ngFor`, `*ngSwitch`
- ❌ TypeScript `private` keyword

### Zoneless Migration

- [ ] OnPush change detection
- [ ] Replace decorators with signal APIs
- [ ] Use signals for state
- [ ] Convert observables with `toSignal()`
- [ ] Remove `ChangeDetectorRef`
- [ ] Test with `provideZonelessChangeDetection()`

### Accessibility (WCAG 2.2)

- Semantic HTML: `<button>`, `<nav>`, `<main>`
- ARIA attributes where needed
- Keyboard navigation
- Screen reader testing
- Color contrast (4.5:1)
- Focus indicators

## Resources

**Primary References for This Project:**

- **Signal Forms Guide**: `.github/instructions/signal-forms.instructions.md`
- **Angular Docs**: [https://angular.dev](https://angular.dev)
- **Style Guide**: [https://angular.dev/style-guide](https://angular.dev/style-guide)

**Additional Resources:**

- **Zoneless**: [https://angular.dev/guide/zoneless](https://angular.dev/guide/zoneless)
- **SSR**: [https://angular.dev/guide/ssr](https://angular.dev/guide/ssr)
