import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';

import { WizardComponent } from './wizard';
import { WizardStepDirective } from './wizard-step';

/**
 * Minimal three-step host used across these specs. Mirrors the shape of a
 * real consumer (`<ngx-wizard>` with three `ngxWizardStep` templates), with
 * `currentStep`/`completedSteps` bound so tests can drive and observe
 * navigation.
 */
@Component({
  template: `
    <ngx-wizard
      [(currentStep)]="currentStep"
      [completedSteps]="completedSteps()"
    >
      <ng-template ngxWizardStep="step1" label="Step 1"
        >Step 1 content</ng-template
      >
      <ng-template ngxWizardStep="step2" label="Step 2"
        >Step 2 content</ng-template
      >
      <ng-template ngxWizardStep="step3" label="Step 3"
        >Step 3 content</ng-template
      >
    </ngx-wizard>
  `,
  imports: [WizardComponent, WizardStepDirective],
})
class ThreeStepHostComponent {
  readonly currentStep = signal('step1');
  readonly completedSteps = signal<string[]>([]);
}

async function renderThreeStepWizard() {
  const { fixture } = await render(ThreeStepHostComponent);
  await TestBed.inject(ApplicationRef).whenStable();
  return fixture;
}

/** The progress-header button for a given step label, e.g. "Step 2". */
function stepHeaderButton(label: string) {
  return screen.getByRole('button', { name: new RegExp(label) });
}

function navButton(label: 'Next' | 'Previous') {
  return screen.getByRole('button', { name: label });
}

describe('WizardComponent navigation', () => {
  it('next() advances from step 1 to a never-visited step 2', async () => {
    // Regression test for the high-severity finding: goToStep() used to
    // gate EVERY navigation (including from next()) on canNavigateToStep(),
    // which only allows the current/visited/completed step — so a fresh
    // forward step (never visited, not completed) could never be reached.
    // This fails on the old code (goToStep unconditionally checking
    // canNavigateToStep before proceeding).
    const fixture = await renderThreeStepWizard();
    expect(screen.getByText('Step 1 content')).toBeInTheDocument();

    navButton('Next').click();
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(screen.getByText('Step 2 content')).toBeInTheDocument();
    expect(screen.queryByText('Step 1 content')).not.toBeInTheDocument();
  });

  it('direct step-click to an unvisited future step is still blocked', async () => {
    const fixture = await renderThreeStepWizard();

    // step3 has never been visited or completed, and is not the current
    // step — the header button must render disabled, and clicking it must
    // not change the visible step.
    const step3Button = stepHeaderButton('Step 3');
    expect(step3Button).toBeDisabled();

    step3Button.click();
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(screen.getByText('Step 1 content')).toBeInTheDocument();
  });

  it('previous() moves back to the prior step', async () => {
    const fixture = await renderThreeStepWizard();

    navButton('Next').click();
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(screen.getByText('Step 2 content')).toBeInTheDocument();

    navButton('Previous').click();
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(screen.getByText('Step 1 content')).toBeInTheDocument();
  });

  it('allows click-navigation to an already-visited step', async () => {
    const fixture = await renderThreeStepWizard();

    navButton('Next').click(); // step1 -> step2, step2 now visited
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    navButton('Next').click(); // step2 -> step3
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(screen.getByText('Step 3 content')).toBeInTheDocument();

    // step2 was visited on the way through — its header button must be
    // enabled, and clicking it must be allowed.
    const step2Button = stepHeaderButton('Step 2');
    expect(step2Button).not.toBeDisabled();

    step2Button.click();
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(screen.getByText('Step 2 content')).toBeInTheDocument();
  });

  it('allows click-navigation to an already-completed step even if never visited', async () => {
    const { fixture } = await render(ThreeStepHostComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    // Mark step3 completed without ever visiting it.
    fixture.componentInstance.completedSteps.set(['step3']);
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    const step3Button = stepHeaderButton('Step 3');
    expect(step3Button).not.toBeDisabled();

    step3Button.click();
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(screen.getByText('Step 3 content')).toBeInTheDocument();
  });
});
