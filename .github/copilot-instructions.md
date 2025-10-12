---
description: 'GitHub Copilot instructions for ngx-signal-forms'
applyTo: '**'
---

# ngx-signal-forms Copilot Instructions

## LLM Output

- Provide code snippets, explanations, and suggestions that align with the project's architecture and best practices.
- Ensure all code adheres to TypeScript strict mode and Angular 20+ standards.
- Do not make up code or API's always use real libraries and APIs. And check documentation if unsure. Use context7 if possible.
- When reporting information to me, be very concise and to the point. But also descriptive enough to be useful.
- Eliminate: emojis (expect checkmarks, etc), filler, hype, soft asks, conversational transitions, call-to-action appendixes

## Quick Reference

- **Framework**: Angular 21+ with signals, standalone components (see [angular.instructions.md](./instructions/angular.instructions.md))
- **Forms**: Angular 21 Signal Forms (see [signal-forms.instructions.md](./instructions/signal-forms.instructions.md))
- **Forms Enhancement**: @ngx-signal-forms/toolkit (see [signal-forms-toolkit.instructions.md](./instructions/signal-forms-toolkit.instructions.md))
- **Testing**: Vitest (unit), Playwright (E2E)
- **Styling**: Tailwind CSS 4.x (see [tailwind.instructions.md](./instructions/tailwind.instructions.md))
- **TypeScript**: 5.8+ with strict mode

## Project Structure

### Library Entry Points

[TODO: Update if needed]

### Developer Commands

[TODO: Update if needed]

## Core Guidelines

### General Approach

- [ ] Provide implementation plan before coding
- [ ] Request user approval for changes
- [ ] Use real APIs and libraries (no hallucination)
- [ ] Optimize for clarity over purity
- [ ] Make conscious tradeoffs

### Code Quality

Follow [`.github/instructions/security-and-owasp.instructions.md`](./instructions/security-and-owasp.instructions.md) for secure coding practices.

- [ ] TypeScript strict mode enabled
- [ ] Meaningful variable names
- [ ] Kebab-case filenames
- [ ] Single quotes for strings
- [ ] Avoid `any` type (use `unknown`)
- [ ] Use ES `#` private fields instead of TypeScript `private` keyword

### Form Implementation Checklist

[TODO: Update if needed]

### Example Pattern

[TODO : Update if needed]

## Angular 21+ Checklist

Follow [`.github/instructions/angular.instructions.md`](./instructions/angular.instructions.md) for comprehensive Angular coding standards.

### Must Use

- [ ] Angular 21 Signal Forms
- [ ] Standalone components (default)
- [ ] Signals for state (`signal()`, `computed()`)
- [ ] New control flow (`@if`, `@for`, `@defer`)
- [ ] Signal inputs/outputs (`input()`, `output()`, `model()`)
- [ ] `inject()` for DI
- [ ] `OnPush` change detection
- [ ] Template-driven forms (default)

### Must Avoid

- [ ] `@Injectable({ providedIn: 'root' })`
- [ ] Traditional `@Input()/@Output()`
- [ ] `@ViewChild()/@ContentChild()`
- [ ] Constructor injection
- [ ] Zone.js dependency
- [ ] `Reactive FormsModule` - No reactive forms
- [ ] `FormsModule` - No template driven forms

## Testing Requirements

- Always prefer `#runTests` tools in VSCode over terminal commands

### Unit Tests (Vitest)

- Follow [`.github/instructions/vitest.instructions.md`](./instructions/vitest.instructions.md)
- Use Testing Library patterns
- Test behavior, not implementation

### E2E Tests (Playwright)

- Follow [`.github/instructions/playwright.instructions.md`](./instructions/playwright.instructions.md)
- Use accessible locators
- use #playwright and #chrome-devtools for debugging
- Test real user flows

## Accessibility Checklist

Follow [`.github/instructions/a11y.instructions.md`](./instructions/a11y.instructions.md) for comprehensive accessibility guidance.

- [ ] Semantic HTML elements used
- [ ] Labels associated with controls
- [ ] ARIA only when HTML insufficient
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast ≥4.5:1
- [ ] Error messages accessible

## Performance Checklist

- [ ] Zoneless compatible
- [ ] `@defer` for non-critical content
- [ ] Signals prevent unnecessary renders
- [ ] Pure pipes for computations
- [ ] Images optimized (`NgOptimizedImage`)

## Commit Messages

Follow [`.github/instructions/commit.instructions.md`](./instructions/commit.instructions.md):

- Format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `test`, `refactor`, `chore`
- Imperative mood in description
- Max 80 chars in summary
- be concise but descriptive

## Documentation Requirements

Follow [`.github/instructions/self-explanatory-code-commenting.instructions.md`](./instructions/self-explanatory-code-commenting.instructions.md) for commenting guidelines.

- [ ] JSDoc for public APIs
- [ ] Comments explain "why" not "what"
- [ ] Examples for components/services
- [ ] README updated for features

## File Templates

### Component Template

```typescript
import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [], // Add required imports
  template: ``,
})
export class ExampleComponent {
  // Use ES # private fields for internal state
  readonly #state = signal({});

  // Use computed for derived state
  protected readonly derived = computed(() => this.#state());
}
```

## Additional Resources

### Instruction Files

**Core Framework & Language:**

- [Angular Standards](./instructions/angular.instructions.md) - Angular 21+ coding standards and best practices
- [TypeScript & Security](./instructions/security-and-owasp.instructions.md) - Secure coding based on OWASP Top 10
- [Code Documentation](./instructions/self-explanatory-code-commenting.instructions.md) - Self-explanatory code with minimal comments

**Forms:**

- [Signal Forms](./instructions/signal-forms.instructions.md) - Angular 21+ Signal Forms API and patterns
- [Signal Forms Toolkit](./instructions/signal-forms-toolkit.instructions.md) - Enhancement library for accessibility and UX

**UI & Styling:**

- [Tailwind CSS](./instructions/tailwind.instructions.md) - Tailwind CSS 4.x usage and best practices
- [Accessibility (a11y)](./instructions/a11y.instructions.md) - WCAG 2.2 Level AA compliance guidelines

**Testing:**

- [Vitest](./instructions/vitest.instructions.md) - Unit testing with Vitest and Testing Library
- [Playwright](./instructions/playwright.instructions.md) - E2E testing with Playwright

**Development Workflow:**

- [Commit Messages](./instructions/commit.instructions.md) - Conventional Commits specification
