# Custom Controls Integration

## Intent

Angular Signal Forms replaces the legacy `ControlValueAccessor` boilerplate with plain signals and `FormValueControl`. This demo shows how to build custom inputs (star rating, native switch, slider) that integrate seamlessly with the toolkit's auto-ARIA, wrapper layout, and explicit control-semantics system.

## Toolkit features showcased

- `FormValueControl` interface — lightweight contract exposing value/touched signals in place of CVA.
- `NgxFormField` wrapper — automatic label/error/hint linkage for custom components.
- `ngxSignalFormControl="switch"` — native checkbox switch semantics (inline row layout).
- `ngxSignalFormControl="checkbox"` — opt-in checkbox semantics for a standard checkbox.
- `ngxSignalFormControl="slider"` — custom slider with `layout: 'custom'` and `ariaMode: 'manual'` so the control owns its own `aria-describedby` chain.
- Component-scoped control presets inherited via `provideNgxSignalFormControlPresets()`.

## Form model

- Signal model: `signal<CustomControlsModel>({ productName, rating, serviceRating, emailUpdates, shareReviewPublicly, accessibilityAudit })`.
- Schema: `form(model, customControlsSchema)`.

## Validation rules

### Errors

- Product name — required.
- Rating — required; min 1.
- Service rating — required; min 1.
- Email updates switch — required (must be toggled on).
- Share-review checkbox — required.
- Accessibility audit slider — required; min 1.

### Warnings

- None.

## Strong suites

- The only demo that exercises all three control-semantics options (`switch`, `checkbox`, `slider`) side by side.
- Shows that custom controls need no CVA glue — just a signal contract and the `ngxSignalFormControl` hint.
- Proves that a custom component can own its own ARIA wiring (`ariaMode: 'manual'`) while still rendering wrapper errors.

## Key files

- [custom-controls.form.ts](custom-controls.form.ts) — consuming form and wrapper bindings.
- [custom-controls.html](custom-controls.html) — template with the three control semantics paths.
- [custom-controls.validations.ts](custom-controls.validations.ts) — schema rules.
- `apps/demo/src/app/shared/controls/rating-control` — reusable star rating implementation.

## How to test

1. Run the demo and navigate to `/form-field-wrapper/custom-controls`.
2. Click stars to set a rating; watch the debug panel update instantly.
3. Tab into the rating control, use arrow keys, and blur — confirm "touched" state updates and errors render below.
4. Blur the share-review checkbox without checking it and verify the wrapper error appears via explicit checkbox semantics.
5. Blur the accessibility-audit slider empty and confirm it keeps its own `aria-describedby` chain while still rendering wrapper errors.
6. Toggle the email-updates switch to observe the inline-row preset applied at the app level.

## Related

- [Complex Forms](../complex-forms/README.md) — wrapper usage for nested/array-heavy forms.
- [Global Configuration](../../05-advanced/global-configuration/README.md) — where the app-level presets are registered.
