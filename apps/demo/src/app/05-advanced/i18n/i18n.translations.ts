import type { DemoLang } from './i18n.language';

/**
 * Toy translation dictionaries, keyed by language.
 *
 * `minLength` is a factory taking the same params Angular's built-in
 * `minLength` validator error carries, so the registry entry can forward them
 * straight through — this is the parameterised-message case from the issue
 * scope (a translated string that also interpolates a validator param).
 */
export const ERROR_MESSAGES: Record<
  DemoLang,
  {
    required: string;
    email: string;
    minLength: (params: { minLength: number }) => string;
  }
> = {
  en: {
    required: 'This field is required.',
    email: 'Enter a valid email address.',
    minLength: ({ minLength }) => `Enter at least ${minLength} characters.`,
  },
  nl: {
    required: 'Dit veld is verplicht.',
    email: 'Voer een geldig e-mailadres in.',
    minLength: ({ minLength }) => `Voer minimaal ${minLength} tekens in.`,
  },
  ja: {
    required: 'この項目は必須です。',
    email: '有効なメールアドレスを入力してください。',
    minLength: ({ minLength }) => `${minLength}文字以上入力してください。`,
  },
};

export const FIELD_LABELS: Record<DemoLang, Record<string, string>> = {
  en: {
    fullName: 'Full name',
    email: 'Email address',
  },
  nl: {
    fullName: 'Volledige naam',
    email: 'E-mailadres',
  },
  ja: {
    fullName: '氏名',
    email: 'メールアドレス',
  },
};

/**
 * The form's own UI chrome (submit/reset/saving) — translated too, so the
 * lang-scoped region (see `i18n.form.ts`) never marks left-over English
 * button text with a non-English `lang`. Without this, wrapping the whole
 * form in `[attr.lang]="langService.lang()"` while these strings stayed
 * hardcoded English would itself be a WCAG 3.1.2 violation on the switched
 * languages.
 */
export const UI_STRINGS: Record<
  DemoLang,
  {
    submit: string;
    saving: string;
    reset: string;
    languageGroupLabel: string;
    summaryLabel: string;
  }
> = {
  en: {
    submit: 'Submit',
    saving: 'Saving...',
    reset: 'Reset',
    languageGroupLabel: 'Language',
    summaryLabel: 'Please fix the following errors before submitting:',
  },
  nl: {
    submit: 'Verzenden',
    saving: 'Bezig met opslaan...',
    reset: 'Resetten',
    languageGroupLabel: 'Taal',
    summaryLabel: 'Los de volgende fouten op voordat u verzendt:',
  },
  ja: {
    submit: '送信',
    saving: '保存中...',
    reset: 'リセット',
    languageGroupLabel: '言語',
    summaryLabel: '送信する前に、次のエラーを修正してください:',
  },
};
