# Fieldset Appearance

## Intent

A focused showroom for `NgxFormFieldset` that makes the grouped-feedback presentation APIs easy to compare without the noise of a full business form page. It reuses the same grouped patterns — address section, radio-group section, and password confirmation block — while a control panel swaps summary style, surface tone, nested aggregation, and placement.

## Toolkit features showcased

- `NgxFormFieldset` grouped summary appearance via `feedbackAppearance`
- Optional notification titles via `notificationTitle`
- Summary formatting via `listStyle`
- Base surface styling via `surfaceTone`
- Validation tinting via `validationSurface`
- Aggregation mode via `includeNestedErrors`
- Shared placement comparison via `errorPlacement`

## Why this page exists

`complex-forms` is the realistic long-form reference. This page is the focused API lab for the newer fieldset presentation inputs that would be too noisy to teach inside the larger demo.

## Code structure

- `fieldset-appearance.page.ts` keeps the page shell, header, and learning-content wiring lightweight.
- `fieldset-appearance.form.ts` + `fieldset-appearance.form.html` own the interactive showcase state, display controls, and debugger split so the demo-specific behavior stays isolated from the page wrapper.

## What to compare

1. Switch grouped feedback between `auto`, `plain`, and `notification`.
2. Toggle `surfaceTone` through neutral/info/success/warning/danger and compare the base grouped surface.
3. Turn `validationSurface` on to see the invalid/warning surface tint spread across the group.
4. Switch between group-only feedback and `includeNestedErrors` to compare who owns the summary.
5. Move grouped messages between `top` and `bottom` to compare reading order.

## Related

- [Complex Forms](../complex-forms/README.md) — long-form composition with nested sections and arrays.
- [Fieldset + Utilities](../../03-headless/fieldset-utilities/README.md) — headless equivalent when you want to own the markup.
- [Toolkit form-field README](../../../../../packages/toolkit/form-field/README.md) — public API reference for wrapper and fieldset inputs.
