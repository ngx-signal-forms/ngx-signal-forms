/**
 * PROTOTYPE — throwaway, issue #600. Not shipped. Lives only on the
 * `prototype/600-standard-display-controls` branch.
 *
 * Question: can EVERY display control the current examples use be a
 * standard control that an example turns on in its definition (option b),
 * without the definition or the live example growing special cases?
 *
 * This module is pure (no Angular, no DOM) so the same code drives the
 * clickable demo (`demo.html`) and could lift into the real live example.
 */

// ── Value unions (copied from the toolkit so this file stays dependency-free)
export type ErrorMode = 'immediate' | 'on-touch' | 'on-submit';
export type Appearance = 'standard' | 'outline' | 'plain';
export type Orientation = 'vertical' | 'horizontal';
export type ErrorPlacement = 'top' | 'bottom';
export type MarkingMode = 'required' | 'optional' | 'none';
export type FieldsetAppearance = 'outline' | 'plain';
export type FeedbackAppearance = 'auto' | 'plain' | 'notification';
export type SurfaceTone = 'default' | 'neutral' | 'info' | 'success' | 'warning' | 'danger';
export type ValidationSurface = 'never' | 'always';
export type ListStyle = 'plain' | 'bullets';

// ── The three control kinds. A kind has one generic renderer, so adding a
//    standard control never needs a new component.
interface Choice<V extends string> {
  readonly kind: 'choice';
  readonly options: readonly { readonly value: V; readonly label: string }[];
}
interface Toggle {
  readonly kind: 'toggle';
  readonly on: string;
  readonly off: string;
}
interface Text {
  readonly kind: 'text';
}

/**
 * Where a control's value goes. Almost every control feeds a form input of
 * the same type. Brand theme is the exception: it styles the live area
 * around the form, so it has no form input.
 */
type Target = { readonly input: string } | { readonly liveArea: string };

type Spec<V> = { readonly label: string; readonly default: V } & Target &
  ([V] extends [boolean] ? Toggle : [V] extends [string] ? Choice<V & string> | Text : never);

/** Keeps each entry's literal types (input name, default) while checking it against Spec. */
const control =
  <V,>() =>
  <const S extends Spec<V>>(spec: S): S =>
    spec;

const opts = <V extends string>(...pairs: [V, string][]) =>
  pairs.map(([value, label]) => ({ value, label }));

/**
 * The standard control catalog — option (b): every control any current
 * example uses. One entry per control; the entry IS the cost of making a
 * control standard.
 */
export const CATALOG = {
  errorMode: control<ErrorMode>()({
    label: 'Error mode', input: 'errorDisplayMode', default: 'on-touch', kind: 'choice',
    options: opts<ErrorMode>(['immediate', 'Immediate'], ['on-touch', 'On touch'], ['on-submit', 'On submit']),
  }),
  appearance: control<Appearance>()({
    label: 'Appearance', input: 'appearance', default: 'outline', kind: 'choice',
    options: opts<Appearance>(['standard', 'Standard'], ['outline', 'Outline'], ['plain', 'Plain']),
  }),
  orientation: control<Orientation>()({
    label: 'Orientation', input: 'orientation', default: 'vertical', kind: 'choice',
    options: opts<Orientation>(['vertical', 'Vertical'], ['horizontal', 'Horizontal']),
  }),
  errorPlacement: control<ErrorPlacement>()({
    label: 'Grouped feedback', input: 'errorPlacement', default: 'bottom', kind: 'choice',
    options: opts<ErrorPlacement>(['top', 'Top'], ['bottom', 'Bottom']),
  }),
  brandTheme: control<boolean>()({
    label: 'Theme', liveArea: 'brand', default: true, kind: 'toggle', on: 'Brand', off: 'Stock',
  }),
  markingMode: control<MarkingMode>()({
    label: 'Marking', input: 'markingMode', default: 'required', kind: 'choice',
    options: opts<MarkingMode>(['required', 'Mark required'], ['optional', 'Mark optional'], ['none', 'No marking']),
  }),
  requiredMarkerText: control<string>()({ label: 'Required marker', input: 'requiredMarkerText', default: ' *', kind: 'text' }),
  optionalMarkerText: control<string>()({ label: 'Optional marker', input: 'optionalMarkerText', default: ' (optional)', kind: 'text' }),
  legendText: control<string>()({ label: 'Legend text', input: 'legendText', default: '', kind: 'text' }),
  phoneRequired: control<boolean>()({
    label: 'Phone', input: 'phoneRequired', default: false, kind: 'toggle', on: 'Required', off: 'Optional',
  }),
  fieldsetAppearance: control<FieldsetAppearance>()({
    label: 'Fieldset', input: 'fieldsetAppearance', default: 'outline', kind: 'choice',
    options: opts<FieldsetAppearance>(['outline', 'Outline'], ['plain', 'Plain']),
  }),
  feedbackAppearance: control<FeedbackAppearance>()({
    label: 'Feedback', input: 'feedbackAppearance', default: 'auto', kind: 'choice',
    options: opts<FeedbackAppearance>(['auto', 'Auto'], ['plain', 'Plain'], ['notification', 'Notification']),
  }),
  surfaceTone: control<SurfaceTone>()({
    label: 'Surface tone', input: 'surfaceTone', default: 'default', kind: 'choice',
    options: opts<SurfaceTone>(['default', 'Default'], ['neutral', 'Neutral'], ['info', 'Info'], ['success', 'Success'], ['warning', 'Warning'], ['danger', 'Danger']),
  }),
  validationSurface: control<ValidationSurface>()({
    label: 'Validation surface', input: 'validationSurface', default: 'never', kind: 'choice',
    options: opts<ValidationSurface>(['never', 'Never'], ['always', 'Always']),
  }),
  listStyle: control<ListStyle>()({
    label: 'Error list', input: 'listStyle', default: 'bullets', kind: 'choice',
    options: opts<ListStyle>(['bullets', 'Bullets'], ['plain', 'Plain']),
  }),
  includeNestedErrors: control<boolean>()({
    label: 'Nested errors', input: 'includeNestedErrors', default: true, kind: 'toggle', on: 'Included', off: 'Hidden',
  }),
  showNotificationTitle: control<boolean>()({
    label: 'Notification title', input: 'showNotificationTitle', default: true, kind: 'toggle', on: 'Shown', off: 'Hidden',
  }),
} as const;

export type ControlId = keyof typeof CATALOG;
export type ValueOf<K extends ControlId> = (typeof CATALOG)[K]['default'] extends boolean
  ? boolean
  : (typeof CATALOG)[K] extends { options: readonly { value: infer V }[] }
    ? V
    : string;

/** What an example writes per control in its definition. */
export type ControlConfig<K extends ControlId> = {
  readonly default?: ValueOf<K>;
} & (K extends 'errorMode' ? { readonly modes?: readonly ErrorMode[] } : unknown);

export type ControlsSection = { readonly [K in ControlId]?: ControlConfig<K> };

export type ControlState = { readonly [K in ControlId]?: ValueOf<K> };

// ── Cross-control rules. The only one today: outline forces vertical.
//    Every rule here is a special case the live example must know about.
const RULES: readonly {
  readonly why: string;
  readonly blocks: (state: ControlState, id: ControlId, value: unknown) => boolean;
  readonly repair: (state: ControlState) => ControlState;
}[] = [
  {
    why: 'Outline fields only support vertical labels.',
    blocks: (s, id, v) =>
      (id === 'orientation' && v === 'horizontal' && s.appearance === 'outline'),
    repair: (s) =>
      s.appearance === 'outline' && s.orientation === 'horizontal'
        ? { ...s, orientation: 'vertical' }
        : s,
  },
];

export function initialState(controls: ControlsSection): ControlState {
  const state: Record<string, unknown> = {};
  for (const id of Object.keys(controls) as ControlId[]) {
    state[id] = controls[id]?.default ?? CATALOG[id].default;
  }
  return RULES.reduce((s, r) => r.repair(s), state as ControlState);
}

export function allowedOptions(controls: ControlsSection, state: ControlState, id: ControlId): readonly unknown[] {
  const spec = CATALOG[id];
  if (spec.kind !== 'choice') return [];
  const modes = id === 'errorMode' ? (controls.errorMode as { modes?: readonly ErrorMode[] } | undefined)?.modes : undefined;
  return spec.options
    .map((o) => o.value)
    .filter((v) => !modes || modes.includes(v as ErrorMode))
    .filter((v) => !RULES.some((r) => r.blocks(state, id, v)));
}

export type SetResult = { readonly state: ControlState; readonly rejected?: string };

export function setControl(controls: ControlsSection, state: ControlState, id: ControlId, value: unknown): SetResult {
  if (!(id in controls)) return { state, rejected: `This example does not offer "${CATALOG[id].label}".` };
  const spec = CATALOG[id];
  if (spec.kind === 'choice' && !allowedOptions(controls, state, id).includes(value)) {
    const rule = RULES.find((r) => r.blocks(state, id, value));
    return { state, rejected: rule?.why ?? `"${String(value)}" is not offered here.` };
  }
  const next = { ...state, [id]: value } as ControlState;
  return { state: RULES.reduce((s, r) => r.repair(s), next) };
}

/** The values the live example passes to the form, keyed by input name. */
export function formInputs(state: ControlState): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const id of Object.keys(state) as ControlId[]) {
    const spec = CATALOG[id] as Target;
    if ('input' in spec) out[spec.input] = state[id];
  }
  return out;
}

/** Flags the live example puts on the live area around the form. */
export function liveAreaFlags(state: ControlState): readonly string[] {
  return (Object.keys(state) as ControlId[]).flatMap((id) => {
    const spec = CATALOG[id] as Target;
    return 'liveArea' in spec && state[id] === true ? [spec.liveArea] : [];
  });
}

export function chips(state: ControlState): readonly { label: string; value: string }[] {
  return (Object.keys(state) as ControlId[]).map((id) => {
    const spec = CATALOG[id];
    const v = state[id];
    const value =
      spec.kind === 'toggle' ? (v ? spec.on : spec.off)
      : spec.kind === 'text' ? (v === '' ? '(empty)' : JSON.stringify(v))
      : (spec.options as readonly { value: unknown; label: string }[]).find((o) => o.value === v)?.label ?? String(v);
    return { label: spec.label, value };
  });
}
