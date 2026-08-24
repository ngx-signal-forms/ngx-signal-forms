import { ApplicationRef, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
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
      <ng-template ngxWizardStep="step1" label="Step 1">Step 1 content</ng-template>
      <ng-template ngxWizardStep="step2" label="Step 2">Step 2 content</ng-template>
      <ng-template ngxWizardStep="step3" label="Step 3">Step 3 content</ng-template>
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
  const wizard = fixture.debugElement.query(
    (el) => el.componentInstance instanceof WizardComponent,
  ).componentInstance as WizardComponent;
  return { fixture, wizard };
}

describe('WizardComponent navigation', () => {
  it('next() advances from step 1 to a never-visited step 2', async () => {
    // Regression test for the high-severity finding: goToStep() used to
    // gate EVERY navigation (including from next()) on canNavigateToStep(),
    // which only allows the current/visited/completed step — so a fresh
    // forward step (never visited, not completed) could never be reached.
    // This fails on the old code (goToStep unconditionally checking
    // canNavigateToStep before proceeding).
    const { fixture, wizard } = await renderThreeStepWizard();

    expect(wizard.currentStep()).toBe('step1');

    await wizard.next();
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(wizard.currentStep()).toBe('step2');
  });

  it('direct step-click to an unvisited future step is still blocked', async () => {
    const { fixture, wizard } = await renderThreeStepWizard();

    // step3 has never been visited or completed, and is not the current
    // step — canNavigateToStep() must keep blocking header clicks.
    expect(wizard.canNavigateToStep('step3')).toBe(false);

    await wizard.goToStep('step3');
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(wizard.currentStep()).toBe('step1');
  });

  it('previous() moves back to the prior step', async () => {
    const { fixture, wizard } = await renderThreeStepWizard();

    await wizard.next();
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(wizard.currentStep()).toBe('step2');

    await wizard.previous();
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(wizard.currentStep()).toBe('step1');
  });

  it('allows click-navigation to an already-visited step', async () => {
    const { fixture, wizard } = await renderThreeStepWizard();

    await wizard.next(); // step1 -> step2, step2 now visited
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    await wizard.next(); // step2 -> step3
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();
    expect(wizard.currentStep()).toBe('step3');

    // step2 was visited on the way through — a header click back to it
    // must be allowed.
    expect(wizard.canNavigateToStep('step2')).toBe(true);

    await wizard.goToStep('step2');
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(wizard.currentStep()).toBe('step2');
  });

  it('allows click-navigation to an already-completed step even if never visited', async () => {
    const { fixture } = await render(ThreeStepHostComponent);
    await TestBed.inject(ApplicationRef).whenStable();

    // Mark step3 completed without ever visiting it.
    fixture.componentInstance.completedSteps.set(['step3']);
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    const wizard = fixture.debugElement.query(
      (el) => el.componentInstance instanceof WizardComponent,
    ).componentInstance as WizardComponent;

    expect(wizard.canNavigateToStep('step3')).toBe(true);

    await wizard.goToStep('step3');
    fixture.detectChanges();
    await TestBed.inject(ApplicationRef).whenStable();

    expect(wizard.currentStep()).toBe('step3');
  });
});
