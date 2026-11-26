import { provideZonelessChangeDetection } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { SingleModelWizardComponent } from './single-model-wizard.form';

describe('SingleModelWizardComponent', () => {
  it('starts a new order with untouched, pristine fields', async () => {
    const { fixture } = await render(SingleModelWizardComponent, {
      providers: [provideZonelessChangeDetection()],
    });
    const fill = (label: string, value: string) => {
      const input = screen.getByLabelText(label);
      fireEvent.input(input, { target: { value } });
      fireEvent.blur(input);
    };
    fill('Full name', 'Ada Lovelace');
    fill('Email', 'ada@example.com');
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    await screen.findByLabelText('Street address');
    fill('Street address', '1 Main Street');
    fill('City', 'Amsterdam');
    fill('Postal code', '1234 AB');
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Confirm order' }),
    );
    fireEvent.click(
      await screen.findByRole('button', { name: 'Start a new order' }),
    );

    const tree = fixture.componentInstance.formTree;
    expect(tree().touched()).toBe(false);
    expect(tree().dirty()).toBe(false);
    expect(screen.getByLabelText('Full name')).toHaveValue('');
    expect(screen.queryByText('Full name is required')).not.toBeInTheDocument();
  });
});
