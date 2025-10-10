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

- **Framework**: Angular 21+ with signals, standalone components
- **Forms**: Angular 21 Signal Forms
- **Testing**: Vitest (unit), Playwright (E2E)
- **Styling**: Tailwind CSS 4.x
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

- [ ] TypeScript strict mode enabled
- [ ] Meaningful variable names
- [ ] Kebab-case filenames
- [ ] Single quotes for strings
- [ ] Avoid `any` type (use `unknown`)

### Form Implementation Checklist

[TODO: Update if needed]

### Example Pattern

[TODO : Update if needed]

## Angular 21+ Checklist

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

- Prefer to use #runTests in VSCode over terminal commands

### Unit Tests (Vitest)

- Follow [`.github/instructions/vitest-test.instructions.md`](./instructions/vitest-test.instructions.md)
- Use Testing Library patterns
- Test behavior, not implementation

### E2E Tests (Playwright)

- Follow [`.github/instructions/playwright.instructions.md`](./instructions/playwright.instructions.md)
- Use accessible locators
- use #playwright and #chrome-devtools for debugging
- Test real user flows

## Accessibility Checklist

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

- [ ] JSDoc for public APIs
- [ ] Comments explain "why" not "what"
- [ ] Examples for components/services
- [ ] README updated for features

## File Templates

### Component Template

```typescript
import { Component, signal, computed } from '@angular/core';

@Component({
  selector: 'app-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [], // Add required imports
  template: ``,
})
export class ExampleComponent {
  // Use signals for state
  protected readonly state = signal({});

  // Use computed for derived state
  protected readonly derived = computed(() => {});
}
```

## Additional Resources

[ ] TODO ADD LINKS
