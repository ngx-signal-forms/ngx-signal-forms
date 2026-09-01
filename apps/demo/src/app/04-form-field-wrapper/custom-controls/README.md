# Custom Controls Integration

## Intent

Angular Signal Forms replaces the legacy `ControlValueAccessor` boilerplate with plain signals and `FormValueControl`. This demo shows two common paths:

- **Field-shaped** combobox and closed select. The trigger stays naked. The wrapper owns outline, focus, invalid chrome, type scale, and placeholder color (`input-like`).
- **Widget-shaped** star rating, switch, slider, and a third-party datepicker adapter. Those keep their own chrome, usually with `appearance="plain"`.

## Toolkit features showcased

- `FormValueControl` interface — lightweight contract exposing value/touched signals in place of CVA.
- `NgxFormField` wrapper — automatic label/error/hint linkage for custom components.
- Field-shaped `input-like` — Angular Aria combobox infers this from inner `role="combobox"`; closed select sets `ngxSignalFormControl="input-like"` on the host. Both inherit `--ngx-form-field-input-*` / outline aliases / `--ngx-form-field-placeholder-color`.
- `ngxSignalFormControl="switch"` — native checkbox switch semantics (inline row layout).
- `ngxSignalFormControl="checkbox"` — opt-in checkbox semantics for a standard checkbox.
- `ngxSignalFormControl="slider"` — custom slider with `layout: 'custom'` and `ariaMode: 'manual'` so the control owns its own `aria-describedby` chain.
- Component-scoped control presets inherited via `provideNgxSignalFormControlPresetsForComponent()`.
- `LegacyDatepickerAdapterComponent` — a `FormValueControl<Date | null>` adapter wrapped around a self-contained fake third-party datepicker widget (`LegacyDatepickerComponent`), demonstrating `ngxSignalFormControlAria="manual"` plus Angular's `transformedValue()` for the parse/format boundary. See [docs/CUSTOM_CONTROLS.md](../../../../../../docs/CUSTOM_CONTROLS.md#adapting-an-existing-third-party-widget).

## Form model

- Signal model: `signal<CustomControlsModel>({ productName, framework, frameworkSelect, rating, serviceRating, emailUpdates, shareReviewPublicly, accessibilityAudit })`.
- Schema: `form(model, customControlsSchema)`.

## Validation rules

### Errors

- Product name — required.
- Framework — required; must be one of `angular`, `react`, `svelte`, `vue`, or `solid`.
- Framework select — required; must be one of `angular`, `react`, `svelte`, `vue`, or `solid`.
- Rating — required; min 1.
- Service rating — required; min 1.
- Email updates switch — required (must be toggled on).
- Share-review checkbox — required.
- Accessibility audit slider — required; min 1.

### Warnings

- None.

## Strong suites

- Puts a native Product Name input next to a combobox and a closed select so they share outline, font size, line height, placeholder color, and content height.
- Exercises `switch`, `checkbox`, and `slider` semantics side by side with the field-shaped path.
- Shows that custom controls need no CVA glue — just a signal contract and the `ngxSignalFormControl` hint.
- Proves that a custom component can own its own ARIA wiring (`ariaMode: 'manual'`) while still rendering wrapper errors.

## Key files

- [custom-controls.form.ts](custom-controls.form.ts) — consuming form and wrapper bindings.
- [custom-controls.html](custom-controls.html) — template with the three control semantics paths.
- [custom-controls.validations.ts](custom-controls.validations.ts) — schema rules.
- [custom-controls.legacy-datepicker.spec.ts](custom-controls.legacy-datepicker.spec.ts) — unit coverage for the third-party widget adapter (value round-trip, `parse` errors, composite touched hook, programmatic reset).
- `apps/demo/src/app/shared/controls/rating-control` — reusable star rating implementation.
- `apps/demo/src/app/shared/controls/legacy-datepicker-widget` — the fake, self-contained "legacy" third-party datepicker widget (its own value/change API; no Signal Forms awareness).
- `apps/demo/src/app/shared/controls/legacy-datepicker-adapter` — the `FormValueControl<Date | null>` adapter that bridges the widget above; see its class-level doc comment for the full design writeup.

## How to test

1. Run the demo and navigate to `/form-field-wrapper/custom-controls`.
2. Switch to Outline. Product Name, Preferred framework, and the closed select should share font size, line height, placeholder color, and content height.
3. Click stars to set a rating; watch the debug panel update instantly.
4. Tab into the rating control, use arrow keys, and blur — confirm "touched" state updates and errors render below.
5. Blur the share-review checkbox without checking it and verify the wrapper error appears via explicit checkbox semantics.
6. Blur the accessibility-audit slider empty and confirm it keeps its own `aria-describedby` chain while still rendering wrapper errors.
7. Toggle the email-updates switch to observe the inline-row preset applied at the app level.
8. Type `not-a-date` into Date of Birth and tab out — a `parse` error renders; replace it with a real date to clear it.
9. Click the 📅 button, pick a day from the popup, then click Reset — confirm the text field clears, proving the value round-trips through the adapter in both directions.

## Related

- [Custom controls guide](../../../../../../docs/CUSTOM_CONTROLS.md#field-shaped-vs-widget-shaped-custom-controls) — field-shaped vs widget-shaped, and public input tokens.
- [Complex Forms](../complex-forms/README.md) — wrapper usage for nested/array-heavy forms.
- [Global Configuration](../../05-advanced/global-configuration/README.md) — where the app-level presets are registered.
