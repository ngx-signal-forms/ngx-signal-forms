import { inject } from '@angular/core';
import {
  injectFormContext,
  NGX_SIGNAL_FORMS_CONFIG,
  type NgxSignalFormContext,
  type NgxSignalFormsConfig,
} from '@ngx-signal-forms/toolkit';
import {
  DEFAULT_NGX_SIGNAL_FORMS_CONFIG,
  NGX_ERROR_MESSAGES,
  NGX_FIELD_LABEL_RESOLVER,
  type ErrorMessageRegistry,
  type FieldLabelResolver,
} from '@ngx-signal-forms/toolkit/core';

/**
 * The ambient DI contract every headless surface in this package resolves
 * before it can compute error/warning visibility, messages, or labels.
 *
 * Sealed (`Object.freeze`) because it is read many times per render across
 * several computed()s downstream — freezing documents that consumers must
 * not mutate it and costs nothing at this object's size.
 *
 * @internal
 */
export interface HeadlessContext {
  /** Nearest `[ngxSignalForm]` context, or `undefined` outside one. */
  readonly formContext: NgxSignalFormContext | undefined;
  /** Resolved toolkit config, falling back to the built-in defaults. */
  readonly config: NgxSignalFormsConfig;
  /** Error-message registry from `NGX_ERROR_MESSAGES`, or `null` when unregistered. */
  readonly errorMessagesRegistry: Readonly<ErrorMessageRegistry> | null;
  /** Field-label resolver from `NGX_FIELD_LABEL_RESOLVER`, or `null` when unregistered. */
  readonly labelResolver: FieldLabelResolver | null;
}

/**
 * Resolves the ambient DI contract shared by every headless surface —
 * `NgxHeadlessErrorState`, `NgxHeadlessFieldset`, `NgxHeadlessErrorSummary`,
 * `createErrorState()`, and `createErrorMessageSignal()` — in one place.
 *
 * Each of those five call sites used to independently re-run the same
 * `injectFormContext()` + `inject(NGX_SIGNAL_FORMS_CONFIG, { optional: true })
 * ?? DEFAULT_NGX_SIGNAL_FORMS_CONFIG` + `inject(NGX_ERROR_MESSAGES, {
 * optional: true })` sequence (and `NgxHeadlessErrorSummary` additionally
 * injected `NGX_FIELD_LABEL_RESOLVER`). This factory resolves the union of
 * all four tokens once and returns a sealed value; call sites that don't
 * need every field (e.g. `createErrorState()` never reads `labelResolver`)
 * simply ignore the properties they don't use — resolving an unused
 * optional token costs nothing observable.
 *
 * Must be called synchronously within an Angular injection context (a
 * directive/component constructor or field initializer, or inside an
 * `assertInjector`-wrapped callback that already established one) — it
 * performs no injection-context handling of its own, matching every other
 * `inject()` call at these call sites.
 *
 * @internal
 */
export function buildHeadlessContext(): HeadlessContext {
  const formContext = injectFormContext();
  const config =
    inject(NGX_SIGNAL_FORMS_CONFIG, { optional: true }) ??
    DEFAULT_NGX_SIGNAL_FORMS_CONFIG;
  const errorMessagesRegistry = inject(NGX_ERROR_MESSAGES, { optional: true });
  const labelResolver = inject(NGX_FIELD_LABEL_RESOLVER, { optional: true });

  return Object.freeze({
    formContext,
    config,
    errorMessagesRegistry,
    labelResolver,
  });
}
