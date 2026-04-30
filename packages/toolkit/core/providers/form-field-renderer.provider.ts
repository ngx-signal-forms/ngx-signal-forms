import type { EnvironmentProviders, Provider, Type } from '@angular/core';
import { inject, makeEnvironmentProviders } from '@angular/core';
import {
  NGX_FORM_FIELD_ERROR_RENDERER,
  NGX_FORM_FIELD_HINT_RENDERER,
  type NgxFormFieldErrorRenderer,
  type NgxFormFieldHintRenderer,
} from '../tokens';

/**
 * Override shape for the error renderer provider. Pass `{ component }` to
 * set a renderer; pass `{}` to inherit from a parent scope's provider.
 *
 * @public
 */
export interface NgxFormFieldErrorRendererOverride {
  readonly component?: Type<unknown>;
}

/**
 * Override shape for the hint renderer provider.
 *
 * @public
 */
export interface NgxFormFieldHintRendererOverride {
  readonly component?: Type<unknown>;
}

function createErrorRendererFactory(
  override: NgxFormFieldErrorRendererOverride,
): () => NgxFormFieldErrorRenderer | null {
  return () => {
    if (override.component !== undefined) {
      return { component: override.component };
    }

    const parent = inject(NGX_FORM_FIELD_ERROR_RENDERER, {
      optional: true,
      skipSelf: true,
    });

    return parent;
  };
}

function createHintRendererFactory(
  override: NgxFormFieldHintRendererOverride,
): () => NgxFormFieldHintRenderer | null {
  return () => {
    if (override.component !== undefined) {
      return { component: override.component };
    }

    const parent = inject(NGX_FORM_FIELD_HINT_RENDERER, {
      optional: true,
      skipSelf: true,
    });

    return parent;
  };
}

/**
 * Provides the error renderer at environment scope.
 *
 * @public
 */
export function provideFormFieldErrorRenderer(
  override: NgxFormFieldErrorRendererOverride,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: NGX_FORM_FIELD_ERROR_RENDERER,
      useFactory: createErrorRendererFactory(override),
    },
  ]);
}

/**
 * Component-scoped override for the error renderer.
 *
 * @public
 */
export function provideFormFieldErrorRendererForComponent(
  override: NgxFormFieldErrorRendererOverride,
): Provider[] {
  return [
    {
      provide: NGX_FORM_FIELD_ERROR_RENDERER,
      useFactory: createErrorRendererFactory(override),
    },
  ];
}

/**
 * Provides the hint renderer at environment scope.
 *
 * @public
 */
export function provideFormFieldHintRenderer(
  override: NgxFormFieldHintRendererOverride,
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: NGX_FORM_FIELD_HINT_RENDERER,
      useFactory: createHintRendererFactory(override),
    },
  ]);
}

/**
 * Component-scoped override for the hint renderer.
 *
 * @public
 */
export function provideFormFieldHintRendererForComponent(
  override: NgxFormFieldHintRendererOverride,
): Provider[] {
  return [
    {
      provide: NGX_FORM_FIELD_HINT_RENDERER,
      useFactory: createHintRendererFactory(override),
    },
  ];
}
