import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';

import { dayAfter, todayPlainDate } from '../schemas/wizard.schemas';
import { WizardStore } from '../stores/wizard.store';
import { TravelerStepComponent } from './traveler-step';

/**
 * Form-practice contract for the traveler step (#682). Personal-data fields
 * name their purpose for autofill (WCAG 1.3.5), the passport fields are a
 * named group, and the expiry picker starts on the first day the schema
 * accepts.
 */
describe('TravelerStepComponent form practice', () => {
  function setup() {
    return render(TravelerStepComponent, { providers: [WizardStore] });
  }

  it('identifies the purpose of the personal-data inputs', async () => {
    await setup();

    expect(screen.getByLabelText('First Name')).toHaveAttribute(
      'autocomplete',
      'given-name',
    );
    expect(screen.getByLabelText('Last Name')).toHaveAttribute(
      'autocomplete',
      'family-name',
    );
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'autocomplete',
      'email',
    );
    // Nationality has no matching autofill token, so it must not claim one.
    expect(screen.getByLabelText('Nationality')).not.toHaveAttribute(
      'autocomplete',
    );
  });

  it('groups the passport fields under a legend', async () => {
    await setup();

    const group = screen.getByRole('group', { name: 'Passport Information' });
    expect(group).toContainElement(screen.getByLabelText('Passport Number'));
    expect(group).toContainElement(screen.getByLabelText('Expiry Date'));
  });

  it('hints how to type a passport number and bounds the expiry picker', async () => {
    await setup();

    const passportNumber = screen.getByLabelText('Passport Number');
    expect(passportNumber).toHaveAttribute('autocapitalize', 'characters');
    expect(passportNumber).toHaveAttribute('spellcheck', 'false');

    // A passport that expires today counts as expired, so the first valid day
    // is tomorrow.
    expect(screen.getByLabelText('Expiry Date')).toHaveAttribute(
      'min',
      dayAfter(todayPlainDate().toString()),
    );
  });
});
