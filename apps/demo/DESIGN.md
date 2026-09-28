# Demo design rules

These rules keep the demo calm and consistent. The form is the hero. The chrome stays quiet.

The tokens live in `src/styles.scss` (`@theme` and `.dark`). The app-chrome tokens are in their own `@theme static` block, because Tailwind does not scan component SCSS and would drop them. Use a token, not a raw hex value. If a token is missing, add it there first.

## Principles

- Use one accent: the brand indigo-to-violet.
- Contrast must pass WCAG 2.2 AA in light **and** dark mode. Measure both before you merge.
- Build every state: hover, pressed, keyboard focus, disabled, loading, empty, error and success.
- Keep one main (primary) button per page.

## Color

| Token                                                | Light                   | Dark                    | Use                                      |
| ---------------------------------------------------- | ----------------------- | ----------------------- | ---------------------------------------- |
| `--color-bg`                                         | gray-50                 | gray-900                | Page background                          |
| `--color-bg-elevated`                                | white                   | gray-800                | Cards, inputs, panels                    |
| `--color-text`                                       | gray-900                | gray-100                | Body text                                |
| `--color-text-muted`                                 | gray-600                | gray-400                | Hints, captions, secondary text          |
| `--color-placeholder`                                | gray-500                | gray-400                | Input placeholders                       |
| `--color-border`                                     | gray-200                | gray-700                | Borders, dividers                        |
| `--color-border-focus`                               | indigo-600              | violet-400              | Focus outlines                           |
| `--color-brand-strong`                               | indigo-600              | —                       | Brand text and links                     |
| `--gradient-brand`                                   | indigo-600 → violet-600 | same                    | Primary button fill (white text ≥ 5.7:1) |
| `--gradient-brand-text`                              | indigo-600 → violet-600 | indigo-400 → violet-300 | Logo and page title only                 |
| `--color-error` / `-soft` / `-border`                | red-700 on `#fdebeb`    | red-300 on red-900/20   | Error text, alert surface and border     |
| `--color-success`, `--color-warning`, `--color-info` | 700 shades              | 300 shades              | Status text                              |

### App chrome

The shell, nav tree, right rail and segmented toggles use the gray family, like the page tokens above. Each token has a light and a dark value, so a component needs no `.dark` rule for its colors.

| Token                                      | Light                     | Dark                          | Use                                    |
| ------------------------------------------ | ------------------------- | ----------------------------- | -------------------------------------- |
| `--color-bg-chrome`                        | white                     | gray-900                      | Nav, mobile bar, rail                  |
| `--color-surface-hover`                    | gray-100                  | gray-800                      | Hover fill, count pill                 |
| `--color-border-strong`                    | gray-300                  | gray-600                      | Hover border                           |
| `--color-icon-muted`                       | gray-400                  | gray-500                      | Chevrons and decorative glyphs only    |
| `--color-accent` / `-text` / `-soft`       | indigo-500 / 700 / 50     | indigo-400 / 200 / 900 at 32% | Active nav item: border, text, fill    |
| `--color-accent-border`                    | indigo-500 at 20%         | indigo-400 at 25%             | Panel borders and dividers             |
| `--color-link` / `-hover`                  | indigo-600 / 800          | violet-300 / indigo-50        | Links in the chrome                    |
| `--color-selected` / `--color-on-selected` | `#e8f4fb` / `#005d96`     | gray-700 / blue-300           | Selected option of a segmented toggle  |
| `--color-on-brand`, `--color-brand-deep`   | white, indigo-700         | same                          | Text on, and end stop of, a brand fill |
| `--color-warning-border`                   | amber-500 at 38%          | amber-400 at 34%              | Dashed warning divider                 |
| `--color-backdrop`, `--color-shadow`       | gray-900 at 40%, gray-900 | same, black                   | Modal scrim; mix into shadows          |

- Use the gradient only on the logo, the page title and the primary button. Use solid colors for everything else.
- In dark mode, use gray-400 or lighter for muted text. gray-500 fails on gray-900.
- Don't use `#db1818` as text on `#fdebeb` (4.39:1). Use `--color-error`.

## Type

The font is Inter (`@fontsource-variable/inter`), with a system-ui fallback.

| Role                    | Size | Weight  |
| ----------------------- | ---- | ------- |
| Page title (h1)         | 30px | 700     |
| Section (h2)            | 20px | 600     |
| Card title (h3)         | 18px | 600     |
| Body, inputs, buttons   | 16px | 400/500 |
| Labels, hints, nav, UI  | 14px | 500/400 |
| Caption, badge, eyebrow | 12px | 600     |

- Heading levels go in order. Never skip a level to get a smaller size. Change the size with a class instead.
- Long API names in headings must wrap (`overflow-wrap: anywhere`).
- Don't put emoji in headings or legends. An icon, when you need one, is a monochrome SVG in `currentColor`.

## Spacing

Use the 4px grid, with the Tailwind steps 1, 2, 3, 4, 6 and 8.

- Space between fields: 1rem to 1.5rem. Keep hints inside the field block.
- Space between sections: 1.5rem.
- Card padding: 1.5rem, or 1rem when compact.
- Page padding: 16px on phones.

## Reflow and zoom

- Every route must fit a 320px viewport with no sideways scrolling (WCAG 1.4.10).
- Every route must fit 200% text at a 640px viewport. That equals 200% browser zoom on a 1280px window, which is what WCAG 1.4.4 tests.
- 200% text at 320px is not a WCAG requirement. Some wide examples, such as code and the debugger, don't fit it, and that is accepted.

## Radius and elevation

- Controls (inputs, buttons, badges): 6px (`rounded-md`).
- Cards and panels: 8–12px (`rounded-lg` / `rounded-xl`).
- Pills and segmented toggles: full.
- `shadow-sm` for cards and buttons. `shadow-lg` only for overlays (drawer, slide-over, pin).

## Components

- **Buttons:** use `.btn-primary` or `.btn-secondary`. They are at least 44px tall. Don't define local `.btn-*` classes in a component.
- **Touch targets:** at least 44×44px for shell controls. Never smaller than 24×24px.
- **Form fields:** use the toolkit wrapper. Don't hard-code a required `*` in a label, because the wrapper adds it.
- **Lists:** every `@for` that a user can empty has an `@empty` block.
- **Deferred content:** every `@defer` has a `@placeholder` (with a fixed min-height, so the layout doesn't jump) and an `@error`.
- **Status messages:** keep the `role="status"` or `role="alert"` container in the DOM. Change only its content, so screen readers announce it.
- **Motion:** use native CSS and `animate.enter` / `animate.leave`. The global `prefers-reduced-motion` rule turns it off.
