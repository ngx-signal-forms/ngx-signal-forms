# PROTOTYPE: every display control as a standard control (issue #600)

Throwaway. This folder lives only on the `prototype/600-standard-display-controls` branch and is never merged.

## Question

Can every display control that the current examples use be a standard control that an example turns on in its definition (ADR-0016, option b)? And do the definition and the live example stay free of special cases?

## Run it

```bash
node apps/demo/src/app/_prototype-display-controls/run.mjs
```

This type-checks the definitions against the real form components and rebuilds `demo.html`. Open `demo.html` in a browser for free play and six guided walkthroughs.

## Files

- `display-controls.prototype.ts`: the pure module (catalog, state, rules, chips, form inputs). No Angular, no DOM.
- `definitions.typecheck.prototype.ts`: real definitions for six examples, plus five mistakes that must not compile.
- `demo.template.html` and `run.mjs`: the clickable demo, built from the same module.

## Verdict: option (b) works. Keep it.

- **The definition stays small:** 3 lines for the 20 standard-shape examples, 1 line for warning-support, 6 lines for field-marking and 11 lines for fieldset-appearance.
- **Type safety is complete, and costs about 12 lines of type code.** An example can only turn on a control whose form has an input of the matching type. Five mistakes fail to compile, each for the right reason:
  - a control the form has no input for
  - a default that is not an option
  - an allowed mode that does not exist
  - a form-input control on a form that has no inputs
  - fieldset-appearance's settings while they are still internal signals
- **One catalog entry (3 to 6 lines) makes a control standard.** There are 17 entries. Three generic renderers (choice, toggle, text) draw every control, so no control needs its own component.
- **Special cases:** three, and only one of them is new.
  - The outline-forces-vertical rule exists today.
  - The restricted error modes exist today.
  - A control can target the **live area** instead of a form input. This is new, and only brand theme needs it.
- **Chips:** fieldset-appearance shows 11 chips. That is the same number of controls its panel has today, so option (b) does not make it worse. A follow-up idea: show only the chips whose value differs from the default.

## Follow-ups for the implementation

- fieldset-appearance must turn its internal setting signals into inputs. This is true under option (a) as well.
- The three existing standard controls have hand-made components with descriptions and help text: the error mode selector, the appearance toggle and the orientation toggle. The catalog should be able to name a custom renderer, so they keep that polish. The generic renderers cover the other 14 controls.
