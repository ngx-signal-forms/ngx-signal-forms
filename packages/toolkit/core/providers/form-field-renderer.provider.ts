import type {
  EnvironmentProviders,
  InjectionToken,
  Provider,
  Type,
} from '@angular/core';
import { inject, makeEnvironmentProviders } from '@angular/core';
import {
  NGX_FORM_FIELD_ERROR_RENDERER,
  NGX_FORM_FIELD_HINT_RENDERER,
  type NgxFormFieldErrorRenderer,
  type NgxFormFieldHintRenderer,
} from '../tokens';

// Deliberately not an alias of `RendererOverride` — aliasing changes the
// emitted `.d.ts` form; see `RendererOverride`'s comment.
/**
 * Override shape for the error renderer provider. Pass `{ component }` to
 * set a renderer; pass `{}` to inherit from a parent scope's provider.
 *
 * @public
 */
export interface NgxFormFieldErrorRendererOverride {
  readonly component?: Type<unknown>;
}

// Deliberately not an alias of `RendererOverride` — aliasing changes the
// emitted `.d.ts` form; see `RendererOverride`'s comment.
/**
 * Override shape for the hint renderer provider.
 *
 * @public
 */
export interface NgxFormFieldHintRendererOverride {
  readonly component?: Type<unknown>;
}

/**
 * Structural shape shared by {@link NgxFormFieldErrorRendererOverride} and
 * {@link NgxFormFieldHintRendererOverride}. Do not alias the public
 * interfaces to this type — that would change them from flat interfaces to
 * type aliases in the generated `.d.ts`, which is a visible (if harmless)
 * shape change this refactor must not introduce.
 *
 * @internal
 */
interface RendererOverride {
  readonly component?: Type<unknown>;
}

/**
 * Builds the `useFactory` for a renderer token: return the override's
 * component (run through `buildRenderer`) when set, otherwise defer to a
 * parent scope's provider (or `null` if none is registered).
 *
 * `buildRenderer` — rather than a generic `{ component } as TRenderer`
 * assertion — is what lets the compiler catch a future renderer interface
 * growing a second required field: the object literal each caller writes in
 * `buildRenderer` is checked structurally against the concrete
 * `NgxFormField*Renderer` type, not merely against the loose
 * `RendererOverride` constraint every renderer shape satisfies today.
 *
 * @internal
 */
function createRendererFactory<TRenderer extends RendererOverride>(
  token: InjectionToken<TRenderer | null>,
  override: RendererOverride,
  buildRenderer: (component: Type<unknown>) => TRenderer,
): () => TRenderer | null {
  return () => {
    if (override.component !== undefined) {
      return buildRenderer(override.component);
    }

    // `skipSelf: true` is what lets a component-scoped override (registered
    // on the same token) compose with an environment-level default instead
    // of injecting its own just-registered factory and recursing.
    return inject(token, { optional: true, skipSelf: true });
  };
}

/**
 * Environment-scope + component-scope provider pair for a single renderer
 * token. Both `provideFormFieldErrorRenderer*` and
 * `provideFormFieldHintRenderer*` are thin wrappers around one instance of
 * this, parameterized by token — see the audit note on
 * `form-field-renderer.provider.ts` (C8) for why these four functions used
 * to be ~55 duplicated lines apiece.
 *
 * @internal
 */
function createRendererProviders<TRenderer extends RendererOverride>(
  token: InjectionToken<TRenderer | null>,
  buildRenderer: (component: Type<unknown>) => TRenderer,
): {
  readonly provide: (override: RendererOverride) => EnvironmentProviders;
  readonly provideForComponent: (override: RendererOverride) => Provider[];
} {
  return {
    provide: (override) =>
      makeEnvironmentProviders([
        {
          provide: token,
          useFactory: createRendererFactory(token, override, buildRenderer),
        },
      ]),
    provideForComponent: (override) => [
      {
        provide: token,
        useFactory: createRendererFactory(token, override, buildRenderer),
      },
    ],
  };
}

const errorRendererProviders = createRendererProviders(
  NGX_FORM_FIELD_ERROR_RENDERER,
  (component): NgxFormFieldErrorRenderer => ({ component }),
);
const hintRendererProviders = createRendererProviders(
  NGX_FORM_FIELD_HINT_RENDERER,
  (component): NgxFormFieldHintRenderer => ({ component }),
);

/**
 * Provides the error renderer at environment scope.
 *
 * @public
 */
export function provideFormFieldErrorRenderer(
  override: NgxFormFieldErrorRendererOverride,
): EnvironmentProviders {
  return errorRendererProviders.provide(override);
}

/**
 * Component-scoped override for the error renderer.
 *
 * @public
 */
export function provideFormFieldErrorRendererForComponent(
  override: NgxFormFieldErrorRendererOverride,
): Provider[] {
  return errorRendererProviders.provideForComponent(override);
}

/**
 * Provides the hint renderer at environment scope.
 *
 * @public
 */
export function provideFormFieldHintRenderer(
  override: NgxFormFieldHintRendererOverride,
): EnvironmentProviders {
  return hintRendererProviders.provide(override);
}

/**
 * Component-scoped override for the hint renderer.
 *
 * @public
 */
export function provideFormFieldHintRendererForComponent(
  override: NgxFormFieldHintRendererOverride,
): Provider[] {
  return hintRendererProviders.provideForComponent(override);
}
