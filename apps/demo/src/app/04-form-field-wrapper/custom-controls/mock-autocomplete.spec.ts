import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { form } from '@angular/forms/signals';
import { render, screen, waitFor } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MockAutocompleteComponent } from './mock-autocomplete';

/**
 * Focused coverage for `MockAutocompleteComponent` (issue #475), run
 * directly against a small host with a real Signal Forms `form()` field
 * rather than through the full `custom-controls` demo form. The browser
 * specs in `packages/toolkit/form-field/form-field-wrapper.autocomplete-padding.browser.spec.ts`
 * cover the padding/geometry recipe with a bare `role="combobox"` input;
 * this spec covers the component's own filtering, keyboard, and ARIA
 * behavior.
 */
describe('MockAutocompleteComponent (custom-controls demo, #475)', () => {
  @Component({
    selector: 'ngx-test-mock-autocomplete-host',
    imports: [MockAutocompleteComponent],
    template: `
      <label for="country">Country</label>
      <ngx-mock-autocomplete
        #autocomplete
        inputId="country"
        [field]="testForm.country"
      />
      <button type="button" (click)="autocomplete.clear()">Clear</button>
    `,
  })
  class Host {
    protected readonly testForm = form(signal({ country: '' }));
  }

  async function setup() {
    return render(Host, {
      providers: [provideZonelessChangeDetection()],
    });
  }

  it('filters the options as the user types', async () => {
    const user = userEvent.setup();
    await setup();

    const input = screen.getByRole('combobox') as HTMLInputElement;
    await user.type(input, 'ger');

    expect(screen.getByRole('option', { name: 'Germany' })).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'France' }),
    ).not.toBeInTheDocument();
  });

  it('selects the active option with ArrowDown + Enter and writes it to the field', async () => {
    const user = userEvent.setup();
    await setup();

    const input = screen.getByRole('combobox') as HTMLInputElement;
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(input).toHaveValue('Netherlands');
  });

  it('points aria-activedescendant at the active option id', async () => {
    const user = userEvent.setup();
    await setup();

    const input = screen.getByRole('combobox') as HTMLInputElement;
    await user.click(input);
    await user.keyboard('{ArrowDown}');

    const activeId = input.getAttribute('aria-activedescendant');
    expect(activeId).toBe('country-option-0');
    expect(screen.getByRole('option', { name: 'Netherlands' })).toHaveAttribute(
      'id',
      activeId,
    );
  });

  it('closes the popup and sets aria-expanded="false" on Escape', async () => {
    const user = userEvent.setup();
    await setup();

    const input = screen.getByRole('combobox') as HTMLInputElement;
    await user.click(input);
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('empties the field and returns focus to the input via the clear button', async () => {
    const user = userEvent.setup();
    await setup();

    const input = screen.getByRole('combobox') as HTMLInputElement;
    await user.click(input);
    await user.keyboard('{ArrowDown}{Enter}');
    expect(input).toHaveValue('Netherlands');

    const clearButton = screen.getByRole('button', { name: 'Clear' });
    await user.click(clearButton);

    expect(input).toHaveValue('');
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
  });

  it('announces the empty-results status text when nothing matches', async () => {
    const user = userEvent.setup();
    await setup();

    expect(screen.getByRole('status')).toHaveTextContent('');

    const input = screen.getByRole('combobox') as HTMLInputElement;
    await user.type(input, 'nowhere-country');

    expect(await screen.findByRole('status')).toHaveTextContent(
      'No matching countries',
    );
    // The message is a live region next to the popup, not an option inside
    // the listbox -- a listbox must not expose a non-option child.
    expect(
      screen.queryByText('No matching countries', { selector: 'li' }),
    ).not.toBeInTheDocument();
  });
});
