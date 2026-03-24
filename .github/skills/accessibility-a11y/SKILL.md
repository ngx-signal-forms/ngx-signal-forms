---
name: accessibility-a11y
description: Implement web accessibility (a11y) best practices following WCAG guidelines to create inclusive, accessible user interfaces.
---

# Accessibility (a11y) Best Practices

You are an expert in web accessibility and inclusive design. Code MUST conform to [WCAG 2.2 Level AA](https://www.w3.org/TR/WCAG22/). Go beyond minimal conformance wherever possible for a more inclusive experience.

After generating code, review it against WCAG 2.2 and iterate until accessible. Do not claim code is "fully accessible" — tell the user it was built with accessibility in mind but may still have issues. Suggest [Accessibility Insights](https://accessibilityinsights.io/) for testing.

## Inclusive Language

- Use people-first language (e.g., "person using a screen reader," not "blind user")
- Avoid stereotypes or assumptions about ability, cognition, or experience
- Include reasoning or references to standards when suggesting accessibility implementations
- Be neutral and helpful — avoid patronizing language or overconfidence about nuanced accessibility decisions

## Semantic HTML

- Use semantic elements: `<header>`, `<main>`, `<footer>`, `<nav>`, `<article>`, `<section>`, `<aside>`
- Use `<button>` for interactive elements, not `<div>` or `<span>`
- Proper heading hierarchy (h1–h6), no skipping levels; only one `<h1>` per page
- Use landmarks for screen reader navigation
- Avoid deprecated markup

## ARIA

- Prefer native HTML elements over ARIA when possible
- Use `aria-label` for elements without visible text labels; it MUST contain the visual label text (for voice access)
- Use `aria-describedby` for additional context (e.g., help text, error messages)
- Use `aria-live` regions for dynamic content updates
- Use `aria-expanded` for collapsible content
- Use `aria-hidden="true"` for decorative elements
- Use `aria-current="page"` for navigation highlighting
- In Angular, use attribute binding syntax: `[attr.aria-label]="'descriptive text'"`

### Angular / ngx-signal-forms Toolkit

When using `@ngx-signal-forms/toolkit` (`NgxSignalFormToolkit`), the following are managed automatically by `NgxSignalFormAutoAriaDirective` — **do NOT add manually**:

| Attribute          | When Applied                          |
| ------------------ | ------------------------------------- |
| `aria-invalid`     | Field is invalid + errors should show |
| `aria-required`    | Field has `required()` validator      |
| `aria-describedby` | Field has errors/warnings visible     |

## Color and Contrast

- Text contrast: at least **4.5:1** (normal text), **3:1** (large text: 18.5px bold or 24px)
- Graphics required to understand content: at least **3:1** with adjacent colors
- Control borders/states (focus, checked, pressed): at least **3:1**
- Color MUST NOT be the only way to convey information — use text and/or shapes alongside color
- Prefer dark text on light backgrounds (or light on dark); avoid same-lightness pairings
- Calculate contrast against parent background when element has no/transparent background

## Focus Management

- Visible focus indicators on all interactive elements at all times
- Logical tab order (following reading order)
- Static elements must NOT be in the tab order; no `tabindex` attribute
  - Exception: static elements that receive programmatic focus (e.g., headings after step changes) should have `tabindex="-1"`
- Hidden elements must not be keyboard focusable
- Focus must not become trapped without an escape mechanism (e.g., `Escape` closes dialogs)
- Hover states must have equivalent focus styles

## Keyboard Navigation

Common commands: `Tab` (next element), `Arrow` (within composites), `Enter` (activate), `Escape` (close surfaces)

- All functionality accessible by keyboard alone; touch targets minimum 44×44px
- Support `Enter` and `Space` for activating buttons
- Avoid keyboard traps

### Skip Links (Bypass Blocks)

A skip link MUST be provided as the first focusable element, visually hidden until focused:

```html
<header>
  <a href="#maincontent" class="sr-only">Skip to main</a>
</header>
<main id="maincontent"></main>
```

```css
.sr-only:not(:focus):not(:active) {
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}
```

### Composite Components (Roving Tabindex)

For composites (grids, comboboxes, listboxes, menus, tabs, radio groups): one tab stop for the container; arrow keys move focus within.

Roving tabindex algorithm:

1. On load: `tabindex="0"` on the element that gets initial focus; `tabindex="-1"` on all others
2. On arrow key: set `tabindex="-1"` on current, set `tabindex="0"` and call `.focus()` on next

### Composite Components (aria-activedescendant)

- Container: `tabindex="0"` + `aria-activedescendant="IDREF"` pointing to the active child
- Use CSS to draw a focus outline around the referenced element
- Update `aria-activedescendant` on arrow key press

## Screen Reader

- All elements correctly convey: name, role, value, states, properties via native HTML or ARIA
- Use semantic landmarks: `<header>`, `<nav>`, `<main>`, `<footer>`
- Headings introduce sections; heading levels reflect page hierarchy; only one `<h1>`
- Avoid skipping heading levels

## Voice Access

- Accessible name of all interactive elements MUST contain the visual label text
  - If `aria-label` is used, it MUST include the visual label (so "Click Email" works)
- Interactive elements must have appropriate roles and keyboard behaviors

## Cognitive

- Prefer plain language
- Consistent page structure (landmarks, navigation order) across the application
- Keep interfaces clean and simple — reduce unnecessary distractions

## Low Vision

- Prefer dark text on light backgrounds
- Text resizable to 200% without loss of functionality; use `rem`/`em` units
- Avoid justified text (creates uneven spacing)

## Forms

- Labels accurately describe each control's purpose
- Required fields: indicate visually (asterisk) AND with `aria-required="true"`
- Error messages must be provided for invalid inputs and associated via `aria-describedby`
- Group related fields with `<fieldset>` and `<legend>`
- Placeholder text is supplementary — not a replacement for labels
- If many controls share the same label ("remove", "read more"), use `aria-label` to add context

## Multi-page / Wizard Forms

Reference: [WAI Forms Tutorial: Multi-page Forms](https://www.w3.org/WAI/tutorials/forms/multi-page/)

### Progress Indication

- Page `<title>`: `Step 2 of 4: Shipping Address – Booking – Site Name`
- Page `<h1>`: `Shipping Address (Step 2 of 4)`
- Visual step indicator with `aria-current="step"` on current step:

```html
<nav aria-label="Wizard progress">
  <ol class="wizard-steps">
    <li class="completed">
      <span class="sr-only">Completed: </span
      ><a href="#step1">1. Personal Info</a>
    </li>
    <li class="current" aria-current="step">
      <span class="sr-only">Current: </span><span>2. Trip Details</span>
    </li>
    <li><span>3. Review</span></li>
  </ol>
</nav>
```

### Navigation Behavior

- **DO NOT disable the Next/Submit button** when step is invalid — let users click and see validation errors
- On validation failure: move focus to the first invalid field
- On validation success: proceed and move focus to the step heading or first form field
- Allow backward navigation; save step data (even incomplete) before navigating away
- Restore previously entered data when returning to a step

```typescript
protected nextStep(): void {
  this.form.markAllAsTouched();
  if (this.form.invalid()) {
    this.focusFirstInvalid(); // move focus to first invalid field
    return;
  }
  this.currentStep++;
  // move focus to next step heading
}
```

### Time Limits

- Avoid time limits; if required: allow turn off/extend, warn before expiry, provide ≥20s to extend

### Review Step

- Provide a review step for irreversible submissions; allow back-navigation to edit any step

## Images and Graphics

- Meaningful images: descriptive `alt` text; do NOT use `title` attribute as alt text
- Decorative images: `alt=""` or `aria-hidden="true"` (for `role="img"`)
- Parts of graphics required to understand content: 3:1 contrast with adjacent colors

## Navigation Menus

```html
<nav>
  <ul>
    <li>
      <button aria-expanded="false" tabindex="0">Section 1</button>
      <ul hidden>
        <li><a href="..." tabindex="-1">Link 1</a></li>
      </ul>
    </li>
  </ul>
</nav>
```

- Use `<nav>` + `<ul>` + links — NOT `role="menu"` (reserve `menu`/`menubar` for app-like action menus)
- Toggle `aria-expanded` when expanding/collapsing
- Roving tabindex: `Tab` to nav, `Arrow` across top items, `Arrow down` into submenu
- `Escape` closes expanded menus

## Page Title

- MUST be in `<title>` in `<head>`
- MUST describe the page purpose; SHOULD be unique; SHOULD front-load unique info
- Format: `[Unique page] – [Section] – [Site name]`

## Tables and Grids

- Use `<th>` for all column/row headers; column headers in the first `<tr>`
- Use tables for static tabular data; use grids (`role="grid"`) for interactive/dynamic data
- `role="gridcell"` MUST be nested within `role="row"` — missing `role="row"` breaks header association
- Prefer simple tables; avoid cells spanning multiple columns/rows when possible

## Responsive and Adaptive Design

- Design mobile-first; touch targets minimum 44×44px
- Respect `prefers-reduced-motion` for animations
- Support `prefers-color-scheme` (dark/light)
- Consider `prefers-contrast` and `prefers-reduced-transparency`

## Testing

### Automated

- Lighthouse, axe-core, [Accessibility Insights](https://accessibilityinsights.io/)
- Run axe in CI/CD; address all critical and serious issues

### Manual

- Keyboard-only navigation
- Screen readers: NVDA, JAWS, VoiceOver
- Browser zoom at 200%
- Test with actual users with disabilities when possible

## CSS

- Ensure hover states have equivalent focus styles
- Use `outline` for focus; do not remove without an accessible alternative
- Leverage Flexbox/Grid for robust, adapatable layouts
- Responsive with media queries
