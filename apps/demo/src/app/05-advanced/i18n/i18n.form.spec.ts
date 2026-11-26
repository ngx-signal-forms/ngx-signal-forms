import { provideZonelessChangeDetection } from '@angular/core';
import { fireEvent, render } from '@testing-library/angular';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { I18nDemoComponent } from './i18n.form';

describe('I18nDemoComponent', () => {
  afterEach(() => vi.useRealTimers());

  it('translates the confirmation when the language changes', async () => {
    vi.useFakeTimers();
    const { container, fixture } = await render(I18nDemoComponent, {
      providers: [provideZonelessChangeDetection()],
    });
    const form = container.querySelector('form')!;
    const fullName = form.querySelector<HTMLInputElement>('#i18n-full-name')!;
    const email = form.querySelector<HTMLInputElement>('#i18n-email')!;
    const status = container.querySelector(
      'ngx-submit-status [role="status"]',
    )!;

    fireEvent.click(container.querySelector('button[lang="nl"]')!);
    fireEvent.submit(form);
    fixture.detectChanges();

    const error = container.querySelector('#i18n-full-name-error');
    expect(error).toHaveTextContent('Dit veld is verplicht.');
    expect(error).not.toHaveTextContent('Error:');

    fireEvent.input(fullName, { target: { value: 'Ada Lovelace' } });
    fireEvent.input(email, { target: { value: 'ada@example.com' } });
    fireEvent.submit(form);
    await vi.advanceTimersByTimeAsync(500);
    fixture.detectChanges();

    expect(status).toHaveTextContent(
      'Het formulier is verzonden. De velden zijn gereset.',
    );
    expect(status.closest('[lang]')).toHaveAttribute('lang', 'nl');

    fireEvent.click(container.querySelector('button[lang="ja"]')!);
    expect(status).toHaveTextContent(
      'フォームを送信しました。入力欄をリセットしました。',
    );
    expect(status.closest('[lang]')).toHaveAttribute('lang', 'ja');

    fireEvent.click(container.querySelector('button[lang="en"]')!);
    expect(status).toHaveTextContent('Form submitted. The fields were reset.');
    expect(status.closest('[lang]')).toHaveAttribute('lang', 'en');
  });
});
