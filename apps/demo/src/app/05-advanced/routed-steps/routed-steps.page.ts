import { Component, computed, inject } from '@angular/core';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/debugger';

import {
  DisplayControlsCardComponent,
  ExampleCardsComponent,
  NgxPageControlsDirective,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';

import { WorkshopApiService } from './routed-steps.api';
import { BookingForm } from './routed-steps.booking';
import { ROUTED_STEPS_CONTENT } from './routed-steps.content';
import { RoutedStepsComponent } from './routed-steps.form';

@Component({
  selector: 'ngx-routed-steps-page',

  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .checkbox-row {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      cursor: pointer;
    }
  `,
  imports: [
    RoutedStepsComponent,
    DisplayControlsCardComponent,
    ExampleCardsComponent,
    NgxPageControlsDirective,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
  ],
  template: `
    <ng-template ngxPageControls>
      <ngx-display-controls-card
        title="Step failure"
        description="Make the time slot step fail. The router shows the fallback of that step in place of the step. The form, the step navigation and the other entries stay."
        [chips]="currentControlChips()"
      >
        <label display-controls-primary class="checkbox-row">
          <input
            #failTimeSlots
            type="checkbox"
            [checked]="api.failTimeSlots()"
            (change)="api.failTimeSlots.set(failTimeSlots.checked)"
          />
          <span>Fail the time slot list</span>
        </label>
      </ngx-display-controls-card>
    </ng-template>

    <ngx-page-header
      title="Routed Steps"
      subtitle="One form() across child routes, with a router error boundary for each step"
    />

    <ngx-example-cards
      [demonstrated]="content.demonstrated"
      [learning]="content.learning"
    >
      <ngx-split-layout>
        <ngx-routed-steps left />

        <div right>
          @defer (on idle) {
            <ngx-signal-form-debugger
              [formTree]="bookingForm"
              title="Whole-form state"
            />
          } @placeholder {
            <div class="debugger-placeholder" aria-hidden="true"></div>
          } @error {
            <p class="debugger-placeholder">
              The form debugger failed to load.
            </p>
          }
        </div>
      </ngx-split-layout>
    </ngx-example-cards>
  `,
})
export default class RoutedStepsPage {
  protected readonly api = inject(WorkshopApiService);
  protected readonly bookingForm = inject(BookingForm).form;
  protected readonly content = ROUTED_STEPS_CONTENT;

  protected readonly currentControlChips = computed(() => [
    {
      label: 'Time slot list',
      value: this.api.failTimeSlots() ? 'Fails' : 'Loads',
    },
  ]);
}
