import type {
  NgxSignalFormControlAriaMode,
  NgxSignalFormControlKind,
  NgxSignalFormControlLayout,
  NgxSignalFormControlPresetRegistry,
  NgxSignalFormControlSemantics,
} from '../types';

export interface ResolvedNgxSignalFormControlSemantics {
  readonly kind: NgxSignalFormControlKind | null;
  readonly layout: NgxSignalFormControlLayout | null;
  readonly ariaMode: NgxSignalFormControlAriaMode | null;
}

const TEXT_LIKE_INPUT_TYPE_VALUES = [
  'color',
  'date',
  'datetime-local',
  'email',
  'month',
  'number',
  'password',
  'search',
  'tel',
  'text',
  'time',
  'url',
  'week',
] as const satisfies readonly string[];

const TEXT_LIKE_INPUT_TYPES = new Set<string>(TEXT_LIKE_INPUT_TYPE_VALUES);

const CONTROL_KIND_VALUES = [
  'input-like',
  'standalone-field-like',
  'switch',
  'checkbox',
  'radio-group',
  'slider',
  'composite',
] as const satisfies readonly NgxSignalFormControlKind[];

const CONTROL_KINDS = new Set<string>(CONTROL_KIND_VALUES);

const CONTROL_LAYOUT_VALUES = [
  'stacked',
  'inline-control',
  'group',
  'custom',
] as const satisfies readonly NgxSignalFormControlLayout[];

const CONTROL_LAYOUTS = new Set<string>(CONTROL_LAYOUT_VALUES);

const CONTROL_ARIA_MODE_VALUES = [
  'auto',
  'manual',
] as const satisfies readonly NgxSignalFormControlAriaMode[];

const CONTROL_ARIA_MODES = new Set<string>(CONTROL_ARIA_MODE_VALUES);

/**
 * Checks whether a raw attribute value is one of the supported control kinds.
 *
 * This narrow guard is shared by both the directive and DOM-reading utilities
 * so explicit semantics declared in markup are validated in one place instead
 * of duplicating string comparisons across the toolkit.
 *
 * @param value Raw DOM attribute or directive input value to validate.
 * @returns True when the value matches a supported control kind.
 */
export function isNgxSignalFormControlKind(
  value: string | null | undefined,
): value is NgxSignalFormControlKind {
  return value !== null && value !== undefined && CONTROL_KINDS.has(value);
}

/**
 * Checks whether a raw attribute value is one of the supported wrapper layouts.
 *
 * Keeping layout validation centralized ensures wrapper metadata and directive
 * inputs stay aligned even if the set of supported layouts grows later.
 *
 * @param value Raw DOM attribute or directive input value to validate.
 * @returns True when the value matches a supported wrapper layout.
 */
export function isNgxSignalFormControlLayout(
  value: string | null | undefined,
): value is NgxSignalFormControlLayout {
  return value !== null && value !== undefined && CONTROL_LAYOUTS.has(value);
}

/**
 * Checks whether a raw attribute value is one of the supported ARIA modes.
 *
 * This exists so callers can safely treat DOM attributes as typed semantics
 * without trusting arbitrary string values rendered by user markup.
 *
 * @param value Raw DOM attribute or directive input value to validate.
 * @returns True when the value matches a supported ARIA ownership mode.
 */
export function isNgxSignalFormControlAriaMode(
  value: string | null | undefined,
): value is NgxSignalFormControlAriaMode {
  return value !== null && value !== undefined && CONTROL_ARIA_MODES.has(value);
}

/* oxlint-disable @typescript-eslint/prefer-readonly-parameter-types -- HTMLElement is a mutable DOM API surface; these helpers only inspect it. */
/**
 * Reads explicit control semantics from the stable `data-ngx-signal-form-*`
 * attributes written by `NgxSignalFormControlSemanticsDirective`.
 *
 * The wrapper and auto-ARIA layers use this instead of reading directive state
 * directly so projected controls, custom elements, and plain DOM lookups all
 * share the same transport format.
 *
 * @param element Rendered control host to inspect.
 * @returns The explicit semantics declared on the host, or an empty object.
 */
export function readNgxSignalFormControlSemantics(
  element: HTMLElement | null,
): NgxSignalFormControlSemantics {
  if (!element) {
    return {};
  }

  const kind = element.getAttribute('data-ngx-signal-form-control-kind');
  const layout = element.getAttribute('data-ngx-signal-form-control-layout');
  const ariaMode = element.getAttribute(
    'data-ngx-signal-form-control-aria-mode',
  );

  return {
    kind: isNgxSignalFormControlKind(kind) ? kind : undefined,
    layout: isNgxSignalFormControlLayout(layout) ? layout : undefined,
    ariaMode: isNgxSignalFormControlAriaMode(ariaMode) ? ariaMode : undefined,
  };
}

/**
 * Infers a semantic control kind from the rendered element shape when no
 * explicit semantics were declared.
 *
 * This fallback preserves backwards compatibility for existing wrapper usage
 * while still allowing explicit semantics to override heuristic guesses when a
 * custom control needs deterministic behavior.
 *
 * @param element Rendered control host to inspect.
 * @returns The inferred control kind, or `null` when no safe heuristic exists.
 */
export function inferNgxSignalFormControlKind(
  element: HTMLElement | null,
): NgxSignalFormControlKind | null {
  if (!element) {
    return null;
  }

  if (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    return 'standalone-field-like';
  }

  if (element instanceof HTMLInputElement) {
    if (element.type === 'checkbox') {
      return element.getAttribute('role') === 'switch' ? 'switch' : 'checkbox';
    }

    if (element.type === 'radio') {
      return 'radio-group';
    }

    if (element.type === 'range') {
      return 'slider';
    }

    if (TEXT_LIKE_INPUT_TYPES.has(element.type)) {
      return 'input-like';
    }
  }

  const role = element.getAttribute('role');
  if (role === 'switch') {
    return 'switch';
  }

  if (role === 'slider') {
    return 'slider';
  }

  if (role === 'radiogroup') {
    return 'radio-group';
  }

  if (
    element instanceof HTMLButtonElement ||
    element.hasAttribute('data-ngx-signal-form-control')
  ) {
    return 'composite';
  }

  return null;
}

/**
 * Resolves the final control semantics for a rendered control element.
 *
 * Resolution intentionally happens in three layers:
 * 1. explicit semantics from DOM attributes
 * 2. heuristic kind inference for backwards compatibility
 * 3. preset defaults for layout and ARIA mode
 *
 * This ordering keeps explicit consumer intent authoritative while still
 * providing sensible defaults for older markup and built-in control families.
 *
 * @param element Rendered control host to inspect.
 * @param presets Preset registry used for layout and ARIA fallback values.
 * @returns Fully resolved semantics used by wrapper and auto-ARIA logic.
 */
export function resolveNgxSignalFormControlSemantics(
  element: HTMLElement | null,
  presets: NgxSignalFormControlPresetRegistry,
): ResolvedNgxSignalFormControlSemantics {
  const explicit = readNgxSignalFormControlSemantics(element);
  const kind = explicit.kind ?? inferNgxSignalFormControlKind(element);
  const preset = kind ? presets[kind] : undefined;

  return {
    kind,
    layout: explicit.layout ?? preset?.layout ?? null,
    ariaMode: explicit.ariaMode ?? preset?.ariaMode ?? null,
  };
}
/* oxlint-enable @typescript-eslint/prefer-readonly-parameter-types */
