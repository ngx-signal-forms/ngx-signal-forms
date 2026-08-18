import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import { NgxSignalFormDebugger } from '@ngx-signal-forms/debugger';
import type { ResolvedErrorDisplayStrategy } from '@ngx-signal-forms/toolkit';
import {
  DisplayControlsCardComponent,
  ExampleCardsComponent,
  NgxPageControlsDirective,
  PageHeaderComponent,
  SplitLayoutComponent,
} from '../../ui';
import {
  ERROR_DISPLAY_MODE_LABELS,
  ErrorDisplayModeSelectorComponent,
} from '../../ui/error-display-mode-selector/error-display-mode-selector';
import { FIELD_IDENTITY_CONTENT } from './field-identity.content';
import { FieldIdentityFormComponent } from './field-identity.form';

@Component({
  selector: 'ngx-field-identity-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FieldIdentityFormComponent,
    ErrorDisplayModeSelectorComponent,
    ExampleCardsComponent,
    NgxPageControlsDirective,
    PageHeaderComponent,
    SplitLayoutComponent,
    NgxSignalFormDebugger,
    DisplayControlsCardComponent,
  ],
  template: `
    <ng-template ngxPageControls>
      <ngx-display-controls-card
        title="Error display mode"
        description="Display timing still resolves through the visibility registry while the wrapper owns the field name — switch modes and watch the error id enter and leave aria-describedby."
        [chips]="currentControlChips()"
      >
        <ngx-error-display-mode-selector
          [(selectedMode)]="selectedMode"
          [embedded]="true"
          display-controls-primary
          class="block min-w-0"
        />
      </ngx-display-controls-card>
    </ng-template>

    <ngx-page-header
      title="Field Identity"
      subtitle="A custom wrapper declares its own field name, and aria-invalid survives a collapsing container"
    />

    <ngx-example-cards
      [demonstrated]="demonstratedContent"
      [learning]="learningContent"
    >
      <ngx-split-layout>
        <ngx-field-identity
          #formComponent
          [errorDisplayMode]="selectedMode()"
          left
        />
        @if (formComponent) {
          <div right>
            <ngx-signal-form-debugger [formTree]="formComponent.identityForm" />
          </div>
        }
      </ngx-split-layout>
    </ngx-example-cards>
  `,
})
export class FieldIdentityPage {
  protected readonly formComponent =
    viewChild.required<FieldIdentityFormComponent>('formComponent');

  /**
   * Defaults to `immediate` so both fields are already invalid on load —
   * that is what makes the collapse behavior in section 2 observable
   * without typing anything first.
   */
  protected readonly selectedMode =
    signal<ResolvedErrorDisplayStrategy>('immediate');

  protected readonly currentControlChips = computed(() => [
    {
      label: 'Mode',
      value: ERROR_DISPLAY_MODE_LABELS[this.selectedMode()],
    },
  ]);

  protected readonly demonstratedContent = FIELD_IDENTITY_CONTENT.demonstrated;
  protected readonly learningContent = FIELD_IDENTITY_CONTENT.learning;
}
