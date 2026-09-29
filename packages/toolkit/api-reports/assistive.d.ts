import * as _angular_core from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import * as _ngx_signal_forms_toolkit_headless from '@ngx-signal-forms/toolkit/headless';
import { CharacterCountLimitState, CharacterCountValue, NgxHeadlessErrorState, NgxHeadlessErrorSummary } from '@ngx-signal-forms/toolkit/headless';
import { FieldMarkingMode } from '@ngx-signal-forms/toolkit';

/**
 * Supported value shape for the character-count `formField` input.
 *
 * Re-exports {@link CharacterCountValue} from the headless entry so the
 * styled component's input type cannot drift from what the underlying
 * `createCharacterCount()` utility actually supports.
 *
 * The component counts length of either:
 * - A `string` value (e.g. `<input>`, `<textarea>`)
 * - A `string[]` value (e.g. tokenized inputs where each array entry is
 *   one token). The displayed count is `array.length`, not the combined
 *   string length — this matches the intuitive "X of N tokens" UX.
 *
 * `null` / `undefined` are treated as length `0`. Any other value type
 * logs a dev-mode warning via `createCharacterCount` and renders `0`.
 */
type NgxCharacterCountValue = CharacterCountValue;
/**
 * Non-`'ok'` limit states that ever produce a live-announcement string.
 * `'ok'` is intentionally excluded — no announcement is emitted for it, so
 * an {@link NgxCharacterCountAnnouncementFormatter} is never invoked with it.
 */
type NgxCharacterCountAnnouncementState = Exclude<CharacterCountLimitState, 'ok'>;
/**
 * Details passed to a custom {@link NgxCharacterCountAnnouncementFormatter}.
 */
interface NgxCharacterCountAnnouncementInfo {
    /** Current character/token count. */
    readonly current: number;
    /** The resolved maximum length. */
    readonly max: number;
    /** Characters remaining before the limit (`0` once at or past it). */
    readonly remaining: number;
    /** Characters over the limit (`0` unless `state === 'exceeded'`). */
    readonly over: number;
}
/**
 * Formats the polite live-announcement text for a given limit-state
 * transition. Bind `[announcementFormatter]` to localize the built-in
 * English strings ("Approaching limit: N characters remaining.", etc.) —
 * the component has no other i18n hook, so non-English apps otherwise
 * cannot translate what screen readers announce without forking it.
 *
 * @example
 * ```typescript
 * announcementFormatter = (state, { remaining, over }) => {
 *   switch (state) {
 *     case 'warning': return `Plus que ${remaining} caractères.`;
 *     case 'danger': return `Attention, plus que ${remaining} caractères.`;
 *     case 'exceeded': return `Limite dépassée de ${over} caractères.`;
 *   }
 * };
 * ```
 */
type NgxCharacterCountAnnouncementFormatter = (state: NgxCharacterCountAnnouncementState, info: NgxCharacterCountAnnouncementInfo) => string;
/**
 * Form field character count component with progressive color states.
 *
 * This styled wrapper uses the headless `createCharacterCount()` utility internally,
 * demonstrating how to build custom character count displays with full styling control.
 *
 * Displays current/maximum character count with visual feedback as the limit is approached.
 * Color progression indicates usage level: ok → warning → danger → exceeded.
 *
 * Key features:
 * - Reactive character counting via headless utility
 * - Progressive color states (configurable thresholds)
 * - Optional disable color progression
 * - Themeable via CSS custom properties
 * - Position control (left/right alignment)
 *
 * @example Basic character count
 * ```html
 * <ngx-form-field-wrapper [formField]="form.bio">
 *   <label for="bio">Bio</label>
 *   <textarea id="bio" [formField]="form.bio"></textarea>
 *   <ngx-form-field-character-count
 *     [formField]="form.bio"
 *     [maxLength]="500"
 *   />
 * </ngx-form-field-wrapper>
 * ```
 *
 * @example Left-aligned
 * ```html
 * <ngx-form-field-character-count
 *   [formField]="form.tweet"
 *   [maxLength]="280"
 *   position="left"
 * />
 * ```
 *
 * @example Disable color progression
 * ```html
 * <ngx-form-field-character-count
 *   [formField]="form.message"
 *   [maxLength]="1000"
 *   [showLimitColors]="false"
 * />
 * ```
 *
 * @example Custom thresholds (CSS-only — no component input)
 * ```css
 * ngx-form-field-character-count {
 *   --ngx-form-field-char-count-warning-threshold: 90;
 *   --ngx-form-field-char-count-danger-threshold: 98;
 * }
 * ```
 *
 * Color States (aligned with Figma design tokens):
 * - **ok**: 0-80% of limit (text/secondary)
 * - **warning**: 80-95% of limit (amber)
 * - **danger**: 95-100% of limit (interaction/danger)
 * - **exceeded**: >100% of limit (darker red, bold)
 *
 * The 80%/95% warning/danger split is a *presentation* detail, not a
 * component input — see `--ngx-form-field-char-count-warning-threshold` /
 * `--ngx-form-field-char-count-danger-threshold` below. The "exceeded" state
 * (>100%) is not configurable — it is tied to the field's actual
 * `maxLength`, not a percentage.
 *
 * Customization:
 * Use CSS custom properties to theme character count appearance:
 *
 * ```css
 * :root {
 *   --ngx-form-field-char-count-font-size: 0.75rem;
 *   --ngx-form-field-char-count-line-height: 1.25;
 *   --ngx-form-field-char-count-color-ok: rgba(50, 65, 85, 0.75);
 *   --ngx-form-field-char-count-color-warning: #a16207;
 *   --ngx-form-field-char-count-color-danger: #db1818;
 *   --ngx-form-field-char-count-color-exceeded: #991b1b;
 *   --ngx-form-field-char-count-weight-exceeded: 600;
 *   --ngx-form-field-char-count-warning-threshold: 80;
 *   --ngx-form-field-char-count-danger-threshold: 95;
 * }
 * ```
 *
 * `-warning-threshold` / `-danger-threshold` are the two public, CSS-only
 * configuration knobs — plain numbers (percent of `maxLength`, no `%`
 * unit). The component publishes the live
 * `--ngx-form-field-char-count-percent-used` custom property (an internal
 * coordination hook, not a theming knob — same status as
 * `--ngx-form-field-hint-display`, see THEMING.md — set by the component,
 * not meant to be overridden), and a pure-CSS `color-mix()`/`clamp()`
 * expression compares it against the two threshold knobs to pick the
 * rendered color. No component input, no JS re-render on override — restyle
 * a wrapper (Material, PrimeNG, …) purely in CSS.
 *
 * Accessibility:
 * - Ensure color is not the only indicator (text content also changes)
 * - Color contrast meets WCAG 2.2 Level AA (4.5:1 minimum)
 * - `[liveAnnounce]` announcements ("Approaching limit…", "Almost at
 *   limit…", "Character limit exceeded…") always fire at the toolkit's
 *   fixed 80%/95% defaults, independent of any CSS threshold override.
 *   Announcement wording is accessible *behavior* and must stay predictable
 *   for screen reader users; restyling `-warning-threshold` /
 *   `-danger-threshold` only shifts when the *color* changes, never when the
 *   announcement fires.
 * - Inside a wrapper whose bound control's `aria-describedby` auto-aria
 *   actually manages, a resolved limit renders a visually-hidden element
 *   stating the limit (e.g. "Up to 200 characters") and links it into the
 *   control's `aria-describedby`, so a screen reader user hears the limit on
 *   focus even with `liveAnnounce` off (issue #499). The visible "n/max"
 *   text becomes `aria-hidden` **only once that link exists** — it is not
 *   read twice, and never as "n slash max". The visible text stays exposed
 *   to assistive technology unless the field context explicitly confirms
 *   the link (`NgxSignalFormFieldContext.isControlDescribedByManaged`
 *   returning `true`) — a missing confirmation defaults to "not hidden",
 *   not the other way round. This covers three cases: a bare count with no
 *   field context (no wrapper, no `NGX_SIGNAL_FORM_FIELD_CONTEXT`); a
 *   wrapped control with `ngxSignalFormControlAria="manual"`, where
 *   auto-aria never writes to the manually-owned `aria-describedby`; and a
 *   custom wrapper's context that resolves a field name but never
 *   registers `limitId()` into its own `NGX_SIGNAL_FORM_HINT_REGISTRY` (see
 *   `docs/CUSTOM_WRAPPERS.md`).
 * - Without a wrapper, set the `fieldName` input to render the same hidden
 *   limit element with the id `{fieldName}-char-count-limit`, and put that
 *   id in the control's `aria-describedby` yourself (issue #589). The
 *   visible "n/max" text stays exposed, because the component cannot tell
 *   whether you linked the id.
 *
 * @see {@link createCharacterCount} for the underlying headless utility
 */
declare class NgxFormFieldCharacterCount {
    #private;
    /**
     * Form field to track character count from.
     *
     * Supported value shapes: `string`, `readonly string[]`, `null`, or
     * `undefined` — see {@link NgxCharacterCountValue}. Anything else
     * degrades to a displayed count of `0` and logs a dev-mode warning.
     */
    readonly formField: _angular_core.InputSignal<FieldTree<CharacterCountValue>>;
    /**
     * Maximum character length for the field.
     *
     * If not provided, the component will attempt to auto-detect the limit
     * from the field's validation rules (maxLength validator).
     *
     * **Auto-detection:**
     * - Checks field state for `maxLength()` signal
     * - Only accepts a positive `number`; any other shape falls through to
     *   "no explicit limit"
     *
     * **When to provide manually:**
     * - Display limit differs from validation limit
     * - No maxLength validator defined
     * - Custom validation logic determines limit
     *
     * @example Auto-detect from validation
     * ```typescript
     * // In form schema:
     * maxLength(path.bio, 500);
     * ```
     * ```html
     * <!-- maxLength auto-detected as 500 -->
     * <ngx-form-field-character-count [formField]="form.bio" />
     * ```
     *
     * @example Manual override
     * ```html
     * <!-- Display limit is 300, even if validation allows 500 -->
     * <ngx-form-field-character-count
     *   [formField]="form.bio"
     *   [maxLength]="300"
     * />
     * ```
     */
    readonly maxLength: _angular_core.InputSignal<number | undefined>;
    /**
     * Text alignment position.
     *
     * @default 'right'
     */
    readonly position: _angular_core.InputSignal<"left" | "right">;
    /**
     * Enable/disable color progression based on character limit.
     *
     * When disabled, the character count displays in the default color
     * regardless of how close to the limit the user is.
     *
     * @default true
     */
    readonly showLimitColors: _angular_core.InputSignal<boolean>;
    /**
     * Enable polite live announcements when approaching or exceeding the limit.
     *
     * Announcements are only triggered when the limit state changes.
     *
     * @default false
     */
    readonly liveAnnounce: _angular_core.InputSignalWithTransform<boolean, unknown>;
    /**
     * Optional formatter for the polite live-announcement text, for
     * localizing the built-in English strings. See
     * {@link NgxCharacterCountAnnouncementFormatter}.
     *
     * @default undefined — falls back to the built-in English strings.
     */
    readonly announcementFormatter: _angular_core.InputSignal<NgxCharacterCountAnnouncementFormatter | undefined>;
    /**
     * Field name for the limit id when no wrapper supplies one.
     *
     * Outside a wrapper, set it to mint the stable
     * `{fieldName}-char-count-limit` id, then put that id in the control's
     * `aria-describedby` so screen readers read the limit on focus. Inside a
     * wrapper, the wrapper's field name wins and this input is ignored.
     *
     * @example Standalone count linked to its control
     * ```html
     * <textarea
     *   id="bio"
     *   aria-describedby="bio-char-count-limit"
     *   [formField]="form.bio"
     * ></textarea>
     * <ngx-form-field-character-count [formField]="form.bio" fieldName="bio" />
     * ```
     */
    readonly fieldName: _angular_core.InputSignal<string | undefined>;
    /**
     * Resolved field name: the wrapper's `NGX_SIGNAL_FORM_FIELD_CONTEXT` field
     * name first, then the {@link fieldName} input, else `null`. Blank names
     * count as unset.
     *
     * The context wins, which reverses the usual "explicit input wins" order
     * of `resolveFieldNameFromCandidates`. A wrapper registers {@link limitId}
     * in `NGX_SIGNAL_FORM_HINT_REGISTRY` tagged with this name, and auto-ARIA
     * only links registry ids whose name matches the control's field. An
     * input that overrode the wrapper's name would drop the limit from
     * `aria-describedby`. Public so a wrapper can read it (issue #499).
     */
    readonly resolvedFieldName: _angular_core.Signal<string | null>;
    /**
     * Stable id of the visually-hidden limit description, or `null` when a
     * wrapper cannot register it — no field name resolved, or no limit
     * resolved. `null` means "register nothing": a wrapper must not add a
     * dangling id to `aria-describedby`.
     *
     * Public so a wrapper can forward it to `NGX_SIGNAL_FORM_HINT_REGISTRY`
     * without reading the DOM, mirroring `NgxFormFieldHint.resolvedId`.
     *
     * Derived from `resolvedFieldName` alone (no per-instance ordinal, unlike
     * `NgxFormFieldHint.resolvedId`): two counts projected for the same field
     * would collide on this id, an authoring mistake the toolkit does not
     * guard against — a field has exactly one length limit to describe, so
     * more than one `NgxFormFieldCharacterCount` per field is not a supported
     * configuration.
     */
    readonly limitId: _angular_core.Signal<string | null>;
    /**
     * Whether it is safe to hide the visible "n/max" text from assistive
     * technology, i.e. whether the limit description {@link limitId} mints
     * will actually reach the control's `aria-describedby`.
     *
     * `limitId` only proves an id *can* be minted — a wrapper's bound control
     * with `ngxSignalFormControlAria="manual"` leaves `aria-describedby`
     * entirely author-owned, so `NgxSignalFormAutoAria` never appends a
     * registry id there even though the wrapper still registers it (see
     * `NgxSignalFormFieldContext.isControlDescribedByManaged`). Hiding the
     * visible text in that case would silence the count for assistive
     * technology with nothing replacing it — the exact regression this
     * signal exists to prevent. `NgxFormFieldHint` has no equivalent gate
     * because its content stays directly visible either way.
     *
     * Missing `isControlDescribedByManaged` (a context that doesn't publish
     * it) defaults to `false`, not `true`. `NgxFormFieldWrapper` always
     * publishes it, so the only contexts that omit it are custom wrappers —
     * `docs/CUSTOM_WRAPPERS.md` requires them to opt in by registering
     * `limitId()` into their `NGX_SIGNAL_FORM_HINT_REGISTRY` themselves, a
     * step nothing forces them to add. A wrapper that resolves a field name
     * but skips that registration would otherwise get "safe to hide" for
     * free — silencing the count exactly like the manual-ARIA case above.
     */
    protected readonly hidesVisibleText: _angular_core.Signal<boolean>;
    /**
     * Visually-hidden text describing the limit, e.g. "Up to 200 characters".
     * Rendered by the `[id]="limitId()"` element that `aria-describedby` links
     * to — the running count stays in the `[liveAnnounce]` live region (issue
     * #499's decision). Configurable through
     * `NgxSignalFormsConfig.characterCountLimitText`'s `{max}` placeholder.
     * Empty string when no limit is resolved. Warns once in dev mode when the
     * configured text carries no `{max}` placeholder — the rendered text would
     * silently never state a number.
     */
    protected readonly limitText: _angular_core.Signal<string>;
    protected readonly currentLength: _angular_core.Signal<number>;
    /**
     * Percentage of `maxLength` used (0-100+), published as the
     * `--ngx-form-field-char-count-percent-used` custom property (see the
     * `host` binding) so the pure-CSS threshold comparison in `styles` above
     * can pick a color. `0` when no limit is resolved — the `disabled`
     * `data-limit-state` attribute selector takes over the color in that
     * case, so this value never actually feeds the color-mix() expression
     * for "no limit configured" fields.
     */
    protected readonly percentUsed: _angular_core.Signal<number>;
    /**
     * Formatted character count text (e.g., "42/500").
     */
    protected readonly characterCountText: _angular_core.Signal<string>;
    /**
     * Current limit state for display, accounting for disabled color progression.
     */
    protected readonly displayLimitState: _angular_core.Signal<CharacterCountLimitState | "disabled">;
    /**
     * Computed announcement text. Reads `#announceableState` as the
     * change-trigger and produces a string per limit state. Unlike the
     * previous `effect()` + `signal.set` loop, this stays pure and
     * side-effect-free — Angular 21 idiom.
     */
    protected readonly announcementText: _angular_core.Signal<string>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<NgxFormFieldCharacterCount, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<NgxFormFieldCharacterCount, "ngx-form-field-character-count", never, { "formField": { "alias": "formField"; "required": true; "isSignal": true; }; "maxLength": { "alias": "maxLength"; "required": false; "isSignal": true; }; "position": { "alias": "position"; "required": false; "isSignal": true; }; "showLimitColors": { "alias": "showLimitColors"; "required": false; "isSignal": true; }; "liveAnnounce": { "alias": "liveAnnounce"; "required": false; "isSignal": true; }; "announcementFormatter": { "alias": "announcementFormatter"; "required": false; "isSignal": true; }; "fieldName": { "alias": "fieldName"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

type NgxFormFieldListStyle = 'plain' | 'bullets';
/**
 * @deprecated Use {@link NgxFormFieldListStyle} instead.
 */
type NgxFormFieldErrorListStyle = NgxFormFieldListStyle;
/**
 * Visual treatment for the rendered live regions.
 *
 * - `'inline'` (default) — bare messages under a single control, no card
 *   chrome. The shape `NgxFormFieldWrapper` and per-field usage render.
 * - `'panel'` — a bordered, padded card with its own theme tokens
 *   (`--ngx-signal-form-error-panel-*`). For grouped fieldset feedback and
 *   custom summary blocks — what `NgxFormFieldNotification` used to render
 *   as a standalone component, folded here as a presentation mode instead
 *   (pre-1.0, no alias kept — see `docs/migrations/`).
 */
type NgxFormFieldErrorPresentation = 'inline' | 'panel';
/**
 * Reusable error and warning display component with WCAG 2.2 compliance.
 *
 * Accepts a FieldTree from Angular Signal Forms.
 *
 * ## Architecture
 *
 * `NgxFormFieldError` is a thin styled shell. All error-state logic
 * (strategy resolution, error splitting, message priority) lives exclusively
 * in `NgxHeadlessErrorState`, which is composed via `hostDirectives`. The
 * template renders that directive's `resolvedErrors()` / `resolvedWarnings()`
 * as-is; the component never re-resolves a message or re-runs a visibility
 * cascade. What it adds on top:
 *
 * - Template rendering (live regions, list/paragraph layouts)
 * - `fieldName` resolution from `NGX_SIGNAL_FORM_FIELD_CONTEXT` (parent
 *   wrapper), and the container IDs derived from it
 * - `listStyle` for visual layout choice
 * - The rendered-container booleans, published to
 *   `NGX_SIGNAL_FORM_FIELD_VISIBILITY_REGISTRY` so auto-ARIA references only
 *   what is on screen
 *
 * `strategy` and `warningStrategy` are *forwarded* to the headless directive,
 * not redeclared here — the two cascades resolve in one place. See
 * `NgxHeadlessErrorState.warningStrategy` for the warning cascade.
 *
 * ## Bridge pattern for `formField`
 *
 * Angular's `FormField` directive uses `[formField]` as its CSS selector
 * (`selector: "[formField]"`) AND declares `passThroughInput: "formField"`.
 * Forwarding `field: formField` via `hostDirectives` `inputs` makes Angular
 * try to apply `FormField` to `ngx-form-field-error` and lose the
 * pass-through flag, throwing NG01914.
 *
 * Solution: keep `formField` as a **direct class input** (which preserves
 * `FormField`'s pass-through check) and bridge it to `NgxHeadlessErrorState`
 * by calling `headless.connectFieldState(computed(() => formField()?.()))`
 * in the constructor. The headless directive uses this bridged signal for
 * strategy-based `shouldShowErrors` and error-split computation.
 *
 * ## Signal Forms Limitation: No Native Warning Support
 *
 * Signal Forms only has "errors" - it doesn't have a built-in concept of "warnings".
 * This component provides warnings support using a **convention-based approach**:
 *
 * - **Errors** (blocking): `kind` does NOT start with `'warn:'`
 * - **Warnings** (non-blocking): `kind` starts with `'warn:'`
 *
 * @example Simplest Usage (no NgxSignalFormToolkit needed!)
 * ```html
 * <form [formRoot]="form">
 *   <input [formField]="form.email" />
 *   <ngx-form-field-error [formField]="form.email" fieldName="email" />
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 *
 * @example With Form-Level Strategy Override
 * ```html
 * <form [formRoot]="form" ngxSignalForm errorStrategy="immediate">
 *   <ngx-form-field-error [formField]="form.email" fieldName="email" />
 * </form>
 * ```
 *
 * Features:
 * - **Errors**: `role="alert"` (implies `aria-live="assertive"` + `aria-atomic="true"`)
 * - **Warnings**: `role="status"` (implies `aria-live="polite"` + `aria-atomic="true"`)
 * - With an `NgxFormFieldErrorSummary` in the same `[ngxSignalForm]` form,
 *   errors revealed by a submit render outside the `role="alert"` region, so
 *   only the summary announces. See {@link NgxFormFieldError.errorsQuiet}
 *   and ADR-0012.
 * - Each message carries a visually hidden "Error:" / "Warning:" prefix, so
 *   the accessible description tells the two channels apart without relying
 *   on colour (WCAG 1.4.1, 1.3.1). Configure the text through
 *   `NgxSignalFormsConfig.errorPrefixText` / `warningPrefixText`; pass `''`
 *   to disable a channel's prefix. Rendered even when `title` is set — the
 *   title names the group, not a given message's channel. See "Telling
 *   errors and warnings apart without colour" in the assistive `README.md`
 *   for the CSS hook that adds a visible icon.
 * - Strategy-aware error/warning display — warnings follow their own cascade
 *   so informational feedback stays visible; override via `warningStrategy`
 * - Structured rendering from Signal Forms
 * - Auto-generated IDs for aria-describedby linking
 */
declare class NgxFormFieldError {
    #private;
    /**
     * Injected headless error state directive (composed via hostDirectives).
     * All strategy resolution, error splitting, message priority, and resolved
     * message computation delegates to this instance.
     */
    protected readonly headless: NgxHeadlessErrorState<any>;
    /**
     * The Signal Forms field to observe for errors and strategy-based visibility.
     *
     * Kept as a direct class input (not forwarded via `hostDirectives`) to
     * preserve Angular's `FormField` directive pass-through check
     * (`passThroughInput: "formField"`). The value is bridged to
     * `NgxHeadlessErrorState` via `headless.connectFieldState()` in the
     * constructor.
     */
    readonly formField: _angular_core.InputSignal<FieldTree<unknown> | undefined>;
    /**
     * The field name used for generating error/warning IDs.
     *
     * When omitted the field name is inherited from the parent
     * `ngx-form-field-wrapper` via `NGX_SIGNAL_FORM_FIELD_CONTEXT`.
     */
    readonly fieldName: _angular_core.InputSignal<string | undefined>;
    /**
     * Visual layout for rendered validation messages.
     *
     * - `plain` (default): stacked paragraph messages for inline field feedback
     * - `bullets`: unordered list for grouped summaries such as fieldsets
     */
    readonly listStyle: _angular_core.InputSignal<NgxFormFieldListStyle>;
    /**
     * Optional title rendered above the message list when a container is
     * visible. Additive to both presentation modes; most useful in
     * `presentation="panel"`, where the folded-in `NgxFormFieldNotification`
     * used it for grouped fieldset feedback and custom summary cards.
     */
    readonly title: _angular_core.InputSignal<string | null | undefined>;
    /**
     * Visual treatment for the rendered live regions — see
     * {@link NgxFormFieldErrorPresentation}.
     */
    readonly presentation: _angular_core.InputSignal<NgxFormFieldErrorPresentation>;
    /**
     * Blocking errors and warnings, read straight off the host directive.
     *
     * Both signals are un-gated message lists: the directive splits the
     * field's (or `errorsOverride`'s) entries by kind and applies the 3-tier
     * message cascade, and nothing else. Timing lives in
     * `errorContainerVisible` / `warningContainerVisible` below, which read
     * the same directive's `shouldShowErrors()` / `shouldShowWarnings()`. One
     * cascade per channel, resolved once (ADR-0006).
     */
    protected readonly resolvedErrors: _angular_core.Signal<readonly _ngx_signal_forms_toolkit_headless.ResolvedError[]>;
    protected readonly resolvedWarnings: _angular_core.Signal<readonly _ngx_signal_forms_toolkit_headless.ResolvedError[]>;
    /**
     * Visually hidden "Error:" prefix rendered inside each blocking-error
     * message, sourced from `NgxSignalFormsConfig.errorPrefixText`. It sits
     * inside the same element `aria-describedby` points to, so a screen
     * reader announces "Error: …" instead of relying on colour to tell an
     * error apart from a warning (WCAG 1.4.1, 1.3.1).
     *
     * Carries its own trailing separator space so the rendered text reads
     * "Error: message" with exactly one space, with no reliance on HTML
     * whitespace between the `<span>` and `{{ error.message }}` (which
     * Angular's template compiler collapses to a single space, or trims
     * entirely at a block edge) or on an `&#32;` entity (which decodes to a
     * plain space before that same trimming pass runs, so it gets swept up
     * as if it were source whitespace too — both confirmed empirically
     * against this file's own a11y specs, including after a `pnpm format`
     * reflow). A literal space *inside* an interpolated binding's string
     * value is never trimmed, regardless of surrounding source formatting.
     * The template renders the `<span>` unconditionally (no `@if`) and glues
     * its closing `>` directly to `{{ error.message }}` for the same reason:
     * an empty string collapses the visually-hidden span to nothing.
     *
     * Empty only when `errorPrefixText` is `''` (per-channel opt-out).
     * Rendered even when a `title` is shown: the title names the group (e.g.
     * "Delivery notes"), not the channel of a given message, so it cannot
     * stand in for the per-message prefix — `NgxFormFieldset` passes a title
     * to both the error and warning container, and a titled warning would
     * otherwise be colour-only again (WCAG 1.4.1, 1.3.1).
     */
    protected readonly resolvedErrorPrefix: _angular_core.Signal<string>;
    /**
     * Same as {@link resolvedErrorPrefix}, for warning messages, sourced from
     * `NgxSignalFormsConfig.warningPrefixText`.
     */
    protected readonly resolvedWarningPrefix: _angular_core.Signal<string>;
    constructor();
    protected readonly errorId: _angular_core.Signal<string | null>;
    protected readonly warningId: _angular_core.Signal<string | null>;
    /**
     * Warning visibility now uses the headless directive's shouldShowWarnings
     * which follows the warning-specific strategy cascade, independent of errors.
     */
    protected readonly showWarnings: _angular_core.Signal<boolean>;
    protected readonly usesBulletList: _angular_core.Signal<boolean>;
    /**
     * True when the blocking errors are on screen, in the role="alert"
     * container or, after a submit with a summary, in the quiet container
     * (see {@link errorsQuiet}). The role="alert" container always stays in
     * the DOM for WCAG 4.1.3 live-region first-insertion semantics.
     */
    protected readonly errorContainerVisible: _angular_core.Signal<boolean>;
    /**
     * True while the visible blocking errors were revealed by a submit and an
     * error summary on the same form announces them (ADR-0012). The errors
     * then render outside the `role="alert"` region, so one submit makes one
     * announcement, the summary's, instead of one per field.
     *
     * The state starts when the errors appear or change in the render that
     * follows a submit attempt, including when this component mounts in that
     * render (the wrapper mounts its error slot only while messages show). It
     * ends when the errors change or hide, so the next error the user causes
     * by editing enters the always-mounted live region and announces as
     * usual. It also ends when no summary of the form shows errors any more
     * (the summary was removed or hid), because nothing else announces them. Without a summary, outside a
     * `[ngxSignalForm]` form, or with `errorSummaryAnnouncesAlone: false`, it
     * is never true and the component renders exactly as before.
     */
    protected readonly errorsQuiet: _angular_core.WritableSignal<boolean>;
    /** Errors render inside the `role="alert"` region and announce. */
    protected readonly liveErrorsVisible: _angular_core.Signal<boolean>;
    /** Errors render outside the live region. See {@link errorsQuiet}. */
    protected readonly quietErrorsVisible: _angular_core.Signal<boolean>;
    /**
     * Same as `errorContainerVisible` but for the warnings live region.
     *
     * Guarded by `!errorContainerVisible()` — the README's "Warning support"
     * section documents "blocking errors present → warnings hidden", and
     * `NgxFormFieldset` already enforces this ("UX best practice", see
     * `filteredErrorsSignal`). Without the guard, a field with both blocking
     * errors and warnings would render BOTH the `role="alert"` and
     * `role="status"` containers at once — an assertive *and* a polite
     * announcement for the same field — and `createAriaDescribedBySignal`
     * would still compose `${fieldName}-warning` into a control's
     * `aria-describedby` even while this container is visible, so the two
     * are guarded in lockstep.
     */
    protected readonly warningContainerVisible: _angular_core.Signal<boolean>;
    /**
     * True when neither the alert nor the status container has visible
     * content. Drives the `ngx-form-field-error-host--empty` host class so
     * the CSS can zero `:host`'s own `margin-top` — see the `host` binding
     * above for why that margin needs a separate collapse from the inner
     * containers' `--empty` class.
     */
    protected readonly hostEmpty: _angular_core.Signal<boolean>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<NgxFormFieldError, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<NgxFormFieldError, "ngx-form-field-error", never, { "formField": { "alias": "formField"; "required": false; "isSignal": true; }; "fieldName": { "alias": "fieldName"; "required": false; "isSignal": true; }; "listStyle": { "alias": "listStyle"; "required": false; "isSignal": true; }; "title": { "alias": "title"; "required": false; "isSignal": true; }; "presentation": { "alias": "presentation"; "required": false; "isSignal": true; }; }, {}, never, never, true, [{ directive: typeof _ngx_signal_forms_toolkit_headless.NgxHeadlessErrorState; inputs: { "strategy": "strategy"; "warningStrategy": "warningStrategy"; "submittedStatus": "submittedStatus"; "errorsOverride": "errors"; }; outputs: {}; }]>;
}

/**
 * Heading levels `NgxFormFieldErrorSummary` can render its label as.
 *
 * @group Directives
 */
type NgxErrorSummaryHeadingLevel = 2 | 3 | 4 | 5 | 6;
/**
 * Form-level error summary component with WCAG 2.2 compliance.
 *
 * Renders a clickable list of validation errors aggregated from a form tree.
 * Each entry focuses the associated control on click via Angular's `focusBoundControl()`.
 *
 * Built on top of `NgxHeadlessErrorSummary` which provides all the
 * error aggregation, deduplication, strategy resolution, and focus management.
 *
 * ## Accessibility
 *
 * - `role="alert"` (implicit `aria-live="assertive"` + `aria-atomic="true"`)
 *   for immediate screen reader announcement — the explicit live/atomic
 *   attributes are intentionally omitted to avoid duplicate announcements
 *   on NVDA+Firefox.
 * - The label renders as a native heading (`h2`–`h6`, default `h2`,
 *   configurable via `headingLevel`), matching WCAG 2.4.6. Native elements
 *   are preferred over `role="heading"` + `aria-level` — they get
 *   heading-navigation (NVDA/JAWS "H" key) without relying on ARIA.
 * - The summary host has `role="group"` — a role-less custom element
 *   computes to the generic role, and ARIA 1.2 forbids naming a generic
 *   element, so the host needs a namable role for its `aria-labelledby`
 *   (below) to be valid. Not `role="region"`: a region is a page landmark,
 *   and one per form-level error summary would be landmark noise most
 *   forms don't want.
 * - The summary host's `aria-labelledby` points at the heading, so
 *   focusing the host (see below) announces the label as its accessible
 *   name (WCAG 1.3.1, 2.4.6, 4.1.2).
 * - Error links are focusable buttons for keyboard navigation
 * - Each entry identifies the field and the error message
 * - An entry whose error has no focusable bound control renders as plain
 *   text instead of a button — a control that calls a no-op `focus()`
 *   looks interactive but does nothing (WCAG 4.1.2).
 * - The summary host has `tabindex="-1"` and is **programmatically focused**
 *   the first time it appears with non-zero entries under the resolved
 *   `'on-submit'` strategy (GOV.UK / WAI tutorial pattern for WCAG 2.4.3 +
 *   3.3.1). This guarantees screen reader users land on the summary after a
 *   failed submit instead of being left where they were. Auto-focus is
 *   intentionally skipped for `'on-touch'` / `'immediate'` strategies: the
 *   root FieldTree's `touched()` aggregates children, so the summary can
 *   appear the moment the user blurs the first invalid field — focusing it
 *   then would be an unexpected mid-fill context change (WCAG 3.2.1/3.2.2),
 *   not the documented "arrive after a failed submit" contract. Opt out of
 *   the on-submit auto-focus with `[autoFocus]="false"`.
 * - Inside a `[ngxSignalForm]` form, the summary is the only live region
 *   that announces after a submit: field errors revealed by that submit
 *   show outside their own live regions, so one submit makes one
 *   announcement instead of one per field. Later edits announce through
 *   the field as usual. Turn this off with
 *   `NgxSignalFormsConfig.errorSummaryAnnouncesAlone: false` (ADR-0012).
 *
 * ## Usage
 *
 * ```html
 * <ngx-form-field-error-summary
 *   [formTree]="myForm"
 *   summaryLabel="Please fix the following errors:"
 * />
 * ```
 *
 * ## With Form-Level Strategy
 *
 * ```html
 * <form [formRoot]="myForm" ngxSignalForm errorStrategy="on-submit">
 *   ...fields...
 *   <ngx-form-field-error-summary [formTree]="myForm" />
 *   <button type="submit">Submit</button>
 * </form>
 * ```
 */
declare class NgxFormFieldErrorSummary {
    #private;
    protected readonly summary: NgxHeadlessErrorSummary;
    /**
     * Stable id for the label heading, minted once in the injection context
     * (class-field initializer — see `createUniqueId`'s SSR-safety notes).
     * Used both as the heading's `id` and as the target of the host's
     * `aria-labelledby`.
     */
    protected readonly headingId: string;
    /**
     * Label displayed above the error list.
     * @default 'Please fix the following errors:'
     */
    readonly summaryLabel: _angular_core.InputSignal<string>;
    /**
     * Heading level the label renders as (a native `h2`–`h6` element).
     *
     * @default 2
     */
    readonly headingLevel: _angular_core.InputSignal<NgxErrorSummaryHeadingLevel>;
    /**
     * The host's `aria-labelledby`, pointing at the label heading. `null`
     * whenever the heading is not actually in the DOM — either the summary
     * itself is empty/hidden (`summary.shouldShow() && summary.hasErrors()`
     * is `false`, e.g. before the first submit) or `summaryLabel` is empty.
     * The heading only renders inside that same visibility condition (see
     * the template), so this must match it exactly: pointing `aria-
     * labelledby` at an id that is not yet in the DOM is an invalid ARIA
     * reference.
     */
    protected readonly ariaLabelledBy: _angular_core.Signal<string | null>;
    /**
     * Whether to programmatically focus the summary host the first time it
     * appears with non-zero entries **under the resolved `'on-submit'`
     * strategy**.
     *
     * The default (`true`) follows the GOV.UK / WAI error-summary pattern so
     * screen-reader users hear the announcement and arrive at the summary
     * after a failed submit. Set to `false` if your flow already moves focus
     * elsewhere (e.g. straight to the first invalid field) or if focus
     * theft is undesirable in your design.
     *
     * This input has no effect under `'on-touch'` or `'immediate'` strategies
     * — auto-focus is always skipped for those, regardless of this value,
     * because the summary can appear mid-fill (e.g. on blurring the first
     * invalid field) and stealing focus then would be an unexpected context
     * change (WCAG 3.2.1/3.2.2), not the documented "arrive after a failed
     * submit" contract.
     *
     * @default true
     */
    readonly autoFocus: _angular_core.InputSignal<boolean>;
    constructor();
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<NgxFormFieldErrorSummary, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<NgxFormFieldErrorSummary, "ngx-form-field-error-summary", never, { "summaryLabel": { "alias": "summaryLabel"; "required": false; "isSignal": true; }; "headingLevel": { "alias": "headingLevel"; "required": false; "isSignal": true; }; "autoFocus": { "alias": "autoFocus"; "required": false; "isSignal": true; }; }, {}, never, never, true, [{ directive: typeof _ngx_signal_forms_toolkit_headless.NgxHeadlessErrorSummary; inputs: { "formTree": "formTree"; "strategy": "strategy"; "warningStrategy": "warningStrategy"; "submittedStatus": "submittedStatus"; }; outputs: {}; }]>;
}

/**
 * Form-level legend that explains the field marker (e.g. "* indicates a
 * required field").
 *
 * Place it once wherever it reads well in a form or page — there is no
 * automatic injection. It is mode-aware and form-aware:
 *
 * - In `'required'` mode it shows the required legend and hides when the form
 *   has no required fields.
 * - In `'optional'` mode it shows the optional legend and hides when the form
 *   has no optional fields.
 * - In `'none'` mode it renders nothing.
 *
 * The marking mode and marker characters fall back to
 * {@link NgxSignalFormsConfig}, so by default the legend matches whatever the
 * fields render. Override per instance with the inputs below.
 *
 * ## Accessibility
 *
 * The legend is plain, **visible** text (not `aria-hidden`): unlike the marker
 * glyph it is the explanation, useful to everyone. Required state still reaches
 * assistive tech via each control's `aria-required`, so the legend is
 * supplementary rather than a duplicate announcement. It carries no `role` or
 * live region — it is static guidance, not a status update.
 *
 * ## Usage
 *
 * ```html
 * <form [formRoot]="userForm" ngxSignalForm>
 *   <ngx-form-marking-legend />
 *   <!-- fields… -->
 * </form>
 * ```
 *
 * Outside a form host, pass the tree explicitly:
 *
 * ```html
 * <ngx-form-marking-legend [formTree]="userForm" />
 * ```
 */
declare class NgxFormMarkingLegend {
    #private;
    /**
     * The form tree the legend reflects. Optional — falls back to the ambient
     * form context (`NgxSignalForm` on `form[formRoot]`). When neither is
     * available the legend renders nothing and emits a dev-mode error.
     */
    readonly formTree: _angular_core.InputSignal<FieldTree<unknown> | undefined>;
    /** Override the marking mode. Falls back to config `showMarkerWhen`. */
    readonly showMarkerWhen: _angular_core.InputSignal<FieldMarkingMode | undefined>;
    /**
     * Override the legend text entirely. `{marker}` is still substituted with the
     * resolved marker for the active mode.
     */
    readonly text: _angular_core.InputSignal<string | undefined>;
    /** Override the required marker used for `{marker}`. Falls back to config. */
    readonly requiredMarker: _angular_core.InputSignal<string | undefined>;
    /** Override the optional marker used for `{marker}`. Falls back to config. */
    readonly optionalMarker: _angular_core.InputSignal<string | undefined>;
    constructor();
    /**
     * The legend text to render, or `null` when nothing should show (mode is
     * `'none'`, no form tree, or the form has no field of the relevant kind).
     */
    protected readonly resolvedText: _angular_core.Signal<string | null>;
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<NgxFormMarkingLegend, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<NgxFormMarkingLegend, "ngx-form-marking-legend", never, { "formTree": { "alias": "formTree"; "required": false; "isSignal": true; }; "showMarkerWhen": { "alias": "showMarkerWhen"; "required": false; "isSignal": true; }; "text": { "alias": "text"; "required": false; "isSignal": true; }; "requiredMarker": { "alias": "requiredMarker"; "required": false; "isSignal": true; }; "optionalMarker": { "alias": "optionalMarker"; "required": false; "isSignal": true; }; }, {}, never, never, true, never>;
}

/**
 * Form field hint component for displaying helper text.
 *
 * Provides visual guidance and instructions without blocking form submission.
 * Commonly used for format examples, field instructions, or contextual help.
 *
 * ## Renderer dispatch
 *
 * When `NGX_FORM_FIELD_HINT_RENDERER` is registered (typically by a custom
 * wrapper via `provideFormFieldHintRenderer(...)`), `<ngx-form-field-hint>`
 * lifts its projected children off the host after the first render and
 * mounts the configured renderer component as a host child, forwarding the
 * lifted nodes into the renderer's default `<ng-content />` slot. The
 * dispatched renderer receives the metadata `<ngx-form-field-hint>` already
 * exposes as inputs: `{ resolvedFieldName: string | null, resolvedId:
 * string, position: 'left' | 'right' | null }` — renderers must declare all
 * three with `input()` because Angular's `componentRef.setInput` rejects
 * writes to undeclared inputs.
 *
 * The dispatch only runs in browser contexts (`afterNextRender`); SSR keeps
 * the projected fallback content. When no renderer is registered, content
 * is projected directly via `<ng-content />` — preserving backwards
 * compatibility for consumers using `<ngx-form-field-hint>` outside a
 * wrapper.
 *
 * Key features:
 * - Content projection for flexible hint text
 * - Renderer-token dispatch for design-system-flavoured chrome
 * - Semantic HTML for accessibility
 * - Themeable via CSS custom properties
 * - Optional position control (left/right alignment)
 *
 * @example Basic hint text
 * ```html
 * <ngx-form-field-wrapper [formField]="form.phone">
 *   <label for="phone">Phone Number</label>
 *   <input id="phone" [formField]="form.phone" />
 *   <ngx-form-field-hint>
 *     Format: 123-456-7890
 *   </ngx-form-field-hint>
 * </ngx-form-field-wrapper>
 * ```
 *
 * @example With position control
 * ```html
 * <ngx-form-field-hint position="left">
 *   Use at least 8 characters
 * </ngx-form-field-hint>
 * ```
 *
 * @example Rich content
 * ```html
 * <ngx-form-field-hint>
 *   <strong>Tip:</strong> Use keywords that describe your product
 * </ngx-form-field-hint>
 * ```
 *
 * Customization:
 * Use CSS custom properties to theme hint appearance:
 *
 * ```css
 * :root {
 *   --ngx-form-field-hint-font-size: 0.75rem;
 *   --ngx-form-field-hint-line-height: 1rem;
 *   --ngx-form-field-hint-color: rgba(50, 65, 85, 0.75);
 * }
 * ```
 *
 * Accessibility:
 * - Use semantic text content (avoid decorative images without alt text)
 * - Ensure sufficient color contrast (4.5:1 minimum)
 * - Consider using aria-describedby to link hint to input (handled by parent component)
 */
declare class NgxFormFieldHint {
    #private;
    /**
     * Text alignment position.
     *
     * @default null (hint aligns to the start/left; pass `position="right"` to
     * opt into end alignment. The assistive row also forces start alignment when
     * a character count shares the row.)
     */
    readonly position: _angular_core.InputSignal<"left" | "right" | null>;
    /**
     * Explicit id, accepted as either a static `id="…"` attribute or a
     * property-bound `[id]="expr"`. Angular maps both forms onto this input
     * (static attributes matching a declared input are read as the input's
     * initial value), so a parent-computed id is picked up reactively instead
     * of being missed the way a one-shot constructor `getAttribute('id')` read
     * misses it. Falls through to {@link resolvedId}'s other sources when
     * `null` or empty.
     */
    readonly id: _angular_core.InputSignal<string | null>;
    /**
     * Resolved field name from the wrapper's `NGX_SIGNAL_FORM_FIELD_CONTEXT`,
     * or `null` when the hint is rendered outside a wrapper. Public so wrappers
     * can expose it through `NGX_SIGNAL_FORM_HINT_REGISTRY` for auto-ARIA.
     */
    readonly resolvedFieldName: _angular_core.Signal<string | null>;
    readonly resolvedId: _angular_core.Signal<string>;
    constructor();
    static ɵfac: _angular_core.ɵɵFactoryDeclaration<NgxFormFieldHint, never>;
    static ɵcmp: _angular_core.ɵɵComponentDeclaration<NgxFormFieldHint, "ngx-form-field-hint", never, { "position": { "alias": "position"; "required": false; "isSignal": true; }; "id": { "alias": "id"; "required": false; "isSignal": true; }; }, {}, never, ["*"], true, never>;
}

export { NgxFormFieldCharacterCount, NgxFormFieldError, NgxFormFieldErrorSummary, NgxFormFieldHint, NgxFormMarkingLegend };
export type { NgxCharacterCountAnnouncementFormatter, NgxCharacterCountAnnouncementInfo, NgxCharacterCountAnnouncementState, NgxCharacterCountValue, NgxErrorSummaryHeadingLevel, NgxFormFieldErrorListStyle, NgxFormFieldErrorPresentation, NgxFormFieldListStyle };
