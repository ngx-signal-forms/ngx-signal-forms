# Skill-guidance evaluation cases

Branch-only reference for the controller. These are evaluation inputs, not
instructions to run tests during documentation editing. A fresh independent
context per prompt is recommended, with only the installed skill and the
consumer fixture available. If contexts are reused sequentially, report that
reuse and the prior cases because loaded references can hide routing gaps.
Supply the prompt alone
to the implementing agent; keep the rubric separate until review.

Use the installed Angular/toolkit versions and the fixture's existing tooling.
Record files read, decisions, changed files, commands and results, plus browser
observations where required. Missing evidence is an open check, not a pass.

Report two separate results per case:

- **Routing dry-run PASS/FAIL:** Did the root route to every required local
  contract and identify deeper evidence needed? A read-only walkthrough can
  establish this result, not implementation correctness.
- **Runtime PASS/FAIL/NOT RUN:** Use actual implementation and verification
  evidence against the rubric below. A routing-only run is `NOT RUN` here.
  Missing runtime evidence remains an open gate; it never inherits a routing
  PASS. Keep all seven prompts and their implementation gates unchanged.

## Prompts

### 1. Native form

> Add a small profile form with name and email fields, validation feedback, and
> a Save button. Use our toolkit and the app's existing visual defaults. Keep
> the native form setup simple. Saving can record a local snapshot for this demo.

### 2. Async submission

> Add a signup form that checks username availability and saves through our
> asynchronous service. Saving must not run while the availability check is
> pending. Show validation feedback after a submit attempt, handle a failed
> save, and prevent duplicate saves. Choose the validation approach that fits
> this requirement without adding unnecessary libraries.

### 3. Warning-only submission

> The password form shows required/minimum-length failures and advice about
> stronger passwords. Users may continue with advice, but not with a real
> failure, including failures in nested fields. Fix the submit path and retain
> feedback after refused attempts. Explain what happens if validation is pending.

### 4. Existing widget adapter

> Integrate our legacy date widget with a `Date | null` Signal Forms field.
> The widget accepts and emits strings and contains an input, a trigger, and a
> calendar popup. Preserve partial typing, show invalid date feedback, support
> model changes and reset, and make error-summary focus work with toolkit feedback.

### 5. Custom wrapper

> Build a design-system field wrapper around a third-party control whose inner
> ID is generated. It needs projected hints and independently configurable
> warning/error feedback. Our error renderer must work for individual fields
> and plain fieldset feedback; our hint renderer adds visual chrome. Use public
> toolkit APIs and preserve the design system's ARIA ownership.

### 6. Collapsed radio group

> The radio group in a collapsible section keeps stale invalid-state ARIA.
> Diagnose and fix the wrapper integration. One option can be hidden while
> other options remain visible, and the whole section can also collapse. Verify
> the behavior when reopened after the value changes, in both supported themes.

### 7. Release-candidate migration

> Upgrade this RC11 integration to RC13. It has grouped notifications, a custom
> error-summary factory, warning submission, and custom field-shaped controls.
> Identify all required changes across the intervening releases. Do not assume
> a source tag proves npm availability. Preserve unrelated behavior and show
> how you verified the upgrade.

## Expected evidence rubric

### 1. Native form

- Reads the Angular reference and form-field surface. Uses a writable model,
  schema validators, correct entry-point imports, labeled controls, and IDs.
- Complete example has `FormRoot` and configured `submission.action`, with no
  competing handler or unnecessary enhancer. Action resolves Angular's
  validation-result contract, not a service payload. Appearance is inherited;
  feedback uses default `on-touch` timing.
- Evidence covers initial/touched invalid states, valid save, description IDs,
  and keyboard operation. No repeated outline settings or unrelated dependency.

### 2. Async submission

- Reads Angular submission/async rules, validation choice, core, and testing.
  Uses Angular async validation unless a concrete existing-suite/reuse reason
  justifies another library. `onError`, debounce, and current API names are valid.
- One submit owner; enhancer provides shared submit-only status. Async action
  maps its service result to `TreeValidationResult` success/errors.
- Tests pending refusal through `ignoreValidators: 'none'` or an equivalent
  explicit policy, a later deliberate retry, invalid focus/feedback, save
  rejection, and duplicate attempts. Does not claim wait-and-retry behavior.

### 3. Warning-only submission

- Recognizes that `warn:` still sets Angular invalid and ordinary submission
  blocks it. Warning-aware gate checks descendant blockers before any bypass.
- No helper call inside an active Angular action and no competing event paths.
  Refused manual submit-only attempts have a status source.
- Evidence distinguishes valid, warning-only, nested blocking, pending,
  rejected, and overlapping calls. Reports `Promise<boolean>` semantics and
  that one microtask does not await async validation. Checks independent timing
  and mounted alert/status hosts.

### 4. Existing widget adapter

- Loads the bundled Angular transformation contract and existing toolkit
  adapter example. Implements `FormValueControl<Date | null>` with `value`,
  not the optional-state base alone and not both value/checked models.
- Proves widget-to-model and model-to-widget round trips, partial/invalid raw
  text, parse errors, reset without replacement, and reset with a supplied value.
- Keyboard evidence moves within the composite without touch, then exits with
  touch. `focus(options)` reaches the real input. ARIA lands on that input with
  one writer and existing label/hint/error targets.

### 5. Custom wrapper

- Loads headless and the relevant canonical wrapper contracts. Public identity
  provider is on the wrapper host; naming is separate from hints and timing.
  No `/core` consumer import, internal writer, or internal bridge call.
- Demonstrates provider bound-null versus unbound behavior, and identity hint
  `null` fallback versus authoritative `[]`. Custom hints have unique IDs.
- Shared renderer accepts both caller input sets, respects pre-filtered fieldset
  errors and nullable names, and preserves stable error/warning container IDs.
  Hint renderer declares all inputs and projection; its host owns the hint ID.
- Evidence covers independent timing, one ARIA writer, every description target,
  keyboard focus, and live-region transitions under the intended theme.

### 6. Collapsed radio group

- Reads testing and ARIA composition guidance. Probes the actual attribute
  carrier in the render read phase, not a convenient wrapper or group cache.
- Browser assertions cover visible invalid, one hidden option with visible
  siblings, whole-group collapse, validation changes while collapsed, and reopen.
  Each option's `aria-invalid` is checked independently.
- Checks keyboard navigation, focus visibility, description targets, mounted
  live-region transitions, and themed axe with the full baseline. Reports any
  missing screen-reader evidence rather than calling axe full conformance.

### 7. Release-candidate migration

- Pins installed/source and target versions; reads the migration index and both
  RC12 and RC13 guides. Records each required item as applied or inapplicable.
- Searches crossed-guide removals. Checks notification/panel changes, required
  wrapper inputs, `errorsOverride`, summary `showWarnings`, boolean submission
  return types, warning timing, and field-shaped control behavior.
- Distinguishes local RC13 tag/manifest evidence from registry publication.
  Preserves R01–R04 as historical audit context without inventing runtime fixes.
- Captures actual build/type-check and focused test results for the target
  package, plus relevant browser behavior. Does not reuse a previous baseline
  as evidence that this migration passed.
