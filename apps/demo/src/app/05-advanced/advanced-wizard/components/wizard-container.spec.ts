import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createEmptyDestination,
  createEmptyTraveler,
} from '../schemas/wizard.schemas';
import { WIZARD_DRAFT_STORAGE_KEY } from '../stores/features/saved-draft.feature';
import { WizardStore } from '../stores/wizard.store';
import { WizardContainerComponent } from './wizard-container';

/**
 * While the saved draft loads, the step forms still show the empty wizard.
 * Moving to another step then would commit that empty data over the draft,
 * so the step buttons stay disabled until the load ends. A failed load must
 * say so, and leave an empty wizard the user can fill in.
 */
describe('WizardContainerComponent draft resume', () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem(
      WIZARD_DRAFT_STORAGE_KEY,
      JSON.stringify({ draftId: 'draft-1' }),
    );
  });

  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
  });

  async function setup() {
    const rendered = await render(WizardContainerComponent, {
      providers: [WizardStore, provideHttpClient(), provideHttpClientTesting()],
    });
    const request = TestBed.inject(HttpTestingController).expectOne(
      '/api/wizard/draft/draft-1',
    );
    return { ...rendered, request };
  }

  it('disables the step buttons and shows a loading state while the draft loads', async () => {
    const { fixture, request } = await setup();

    expect(screen.getByText('Loading saved draft...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();

    request.flush({
      traveler: { ...createEmptyTraveler(), firstName: 'Ada' },
      destinations: [createEmptyDestination()],
    });
    await fixture.whenStable();

    expect(screen.queryByText('Loading saved draft...')).toBeNull();
    expect(screen.getByRole('button', { name: 'Next' })).not.toHaveAttribute(
      'aria-disabled',
    );
  });

  it('shows an error and an empty, usable wizard when the draft fails to load', async () => {
    const { fixture, request } = await setup();

    request.flush(
      { error: 'Draft not found' },
      { status: 404, statusText: 'Not Found' },
    );
    await fixture.whenStable();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Your saved draft could not be loaded.',
    );
    expect(screen.getByRole('button', { name: 'Next' })).not.toHaveAttribute(
      'aria-disabled',
    );
  });
});
