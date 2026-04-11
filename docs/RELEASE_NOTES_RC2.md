# 1.0.0-rc.1 (2026-04-06)

## Breaking changes

### Form field appearance naming

The appearance rename was intentional and is a breaking API change for wrapper appearance inputs and config defaults.

- `standard` was renamed to `stacked`
- `bare` was renamed to `plain`

Recommended migration mapping:

- `appearance="standard"` → `appearance="stacked"`
- `appearance="bare"` → `appearance="plain"`
- `defaultFormFieldAppearance: 'standard'` → `defaultFormFieldAppearance: 'stacked'`
- `defaultFormFieldAppearance: 'bare'` → `defaultFormFieldAppearance: 'plain'`

Rationale:

- `stacked` better describes the default label-above-control layout
- `plain` clearly communicates low-chrome wrapper behavior for custom controls

## Verification note

Before publishing, run appearance-focused validation to confirm the new defaults:

- wrapper unit tests covering `stacked`, `outline`, and `inherit` behavior
- focused form-field visual checks (including `custom-controls-stacked` snapshots)
