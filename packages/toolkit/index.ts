// Primary public entry point for `@ngx-signal-forms/toolkit`.
//
// This file enumerates the public API surface explicitly rather than using
// `export * from '@ngx-signal-forms/toolkit/core'`. The reason is visibility
// hygiene: `/core` is a build-time-only secondary entry point (hidden from
// the published `exports` map by a post-build script) that carries both
// public symbols AND `@internal` plumbing used by the toolkit's sibling
// entries (form-field, assistive, headless, debugger). A blanket re-export
// would leak those `@internal` tokens through the root `.d.ts`. Enumerating
// the public names here keeps the root entry in lockstep with what
// `packages/toolkit/README.md` documents as the stable public API.
//
// When you add a new public symbol to `core/`, add it to the appropriate
// block below. `@internal` symbols must stay out of these lists.

export {
  DEFAULT_NGX_SIGNAL_FORM_CONTROL_PRESETS,
  NGX_SIGNAL_FORM_CONTEXT,
  NGX_SIGNAL_FORM_CONTROL_PRESETS,
  NGX_SIGNAL_FORM_FIELD_CONTEXT,
  NGX_SIGNAL_FORMS_CONFIG,
  NgxSignalFormAutoAriaDirective,
  NgxSignalFormControlSemanticsDirective,
  NgxSignalFormDirective,
  NgxSignalFormToolkit,
  buildAriaDescribedBy,
  canSubmitWithWarnings,
  combineShowErrors,
  createOnInvalidHandler,
  createShowErrorsComputed,
  createSubmittedStatusTracker,
  createUniqueId,
  focusFirstInvalid,
  generateErrorId,
  generateWarningId,
  getBlockingErrors,
  getDefaultValidationMessage,
  hasOnlyWarnings,
  hasSubmitted,
  inferNgxSignalFormControlKind,
  injectFieldControl,
  injectFormContext,
  isBlockingError,
  isFieldStateHidden,
  isFieldStateInteractive,
  isNgxSignalFormControlAriaMode,
  isNgxSignalFormControlKind,
  isNgxSignalFormControlLayout,
  isWarningError,
  provideErrorMessages,
  provideFieldLabels,
  provideNgxSignalFormControlPresets,
  provideNgxSignalFormControlPresetsForComponent,
  provideNgxSignalFormsConfig,
  provideNgxSignalFormsConfigForComponent,
  readDirectErrors,
  readNgxSignalFormControlSemantics,
  resolveErrorDisplayStrategy,
  resolveFieldName,
  resolveNgxSignalFormControlSemantics,
  resolveStrategyFromContext,
  resolveSubmittedStatusFromContext,
  resolveValidationErrorMessage,
  shouldShowErrors,
  showErrors,
  splitByKind,
  submitWithWarnings,
  unwrapValue,
  updateAt,
  updateNested,
  warningError,
} from '@ngx-signal-forms/toolkit/core';

export type {
  AriaDescribedByChainOptions,
  ErrorDisplayStrategy,
  ErrorReadableState,
  ErrorVisibilityState,
  FieldLabelMap,
  FormFieldAppearance,
  FormFieldAppearanceInput,
  NgxSignalFormContext,
  NgxSignalFormControlAriaMode,
  NgxSignalFormControlKind,
  NgxSignalFormControlLayout,
  NgxSignalFormControlPreset,
  NgxSignalFormControlPresetOverrides,
  NgxSignalFormControlPresetRegistry,
  NgxSignalFormControlSemantics,
  NgxSignalFormFieldContext,
  NgxSignalFormsConfig,
  NgxSignalFormsUserConfig,
  OnInvalidHandlerOptions,
  ReactiveOrStatic,
  ResolvedErrorDisplayStrategy,
  ResolvedFormFieldAppearance,
  ResolvedNgxSignalFormControlSemantics,
  SignalLike,
  SplitErrors,
  SubmittedStatus,
} from '@ngx-signal-forms/toolkit/core';
