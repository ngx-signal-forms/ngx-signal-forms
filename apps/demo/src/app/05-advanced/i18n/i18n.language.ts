import { Injectable, signal } from '@angular/core';

/**
 * i18n demo — language source
 *
 * The toolkit's message/label registries are library-agnostic: they only care
 * whether an entry is a *string* (frozen at injection) or a *function*
 * (re-invoked per render). This service is the "toy" reactive language source
 * standing in for Transloco/ngx-translate/whatever else a real app uses — the
 * contract this demo proves holds exactly the same either way.
 *
 * No translation library is added on purpose: a bare `signal<Lang>` plus a
 * lookup map is enough to demonstrate the contract with nothing in front of
 * it.
 */
export type DemoLang = 'en' | 'nl' | 'ja';

export const DEMO_LANGS: readonly DemoLang[] = ['en', 'nl', 'ja'];

export const DEMO_LANG_LABELS: Record<DemoLang, string> = {
  en: 'English',
  nl: 'Nederlands',
  ja: '日本語',
};

@Injectable()
export class I18nDemoLanguageService {
  readonly lang = signal<DemoLang>('en');

  setLang(lang: DemoLang): void {
    this.lang.set(lang);
  }
}
