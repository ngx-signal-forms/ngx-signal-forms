import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  disabled,
  FormField,
  form,
  minLength,
  pattern,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import { NgxSignalFormToolkit, warningError } from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import {
  type BrandThemingModel,
  initialBrandThemingModel,
} from './brand-theming.model';

/** A monthly budget above this value is flagged as a non-blocking warning. */
const HIGH_BUDGET_THRESHOLD = 5000;

const brandThemingSchema = schema<BrandThemingModel>((path) => {
  // Blocking error #1 — required + minLength.
  required(path.teamName, { message: 'Team name is required' });
  minLength(path.teamName, 2, {
    message: 'Team name must be at least 2 characters',
  });

  // Blocking error #2 — required + pattern, a second danger-color surface.
  required(path.workspaceSlug, { message: 'Workspace URL is required' });
  pattern(path.workspaceSlug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Use lowercase letters, numbers, and hyphens only',
  });

  // Non-blocking warning — never blocks submit, exercises the warning color.
  validate(path.monthlyBudget, (ctx) => {
    const value = ctx.value();
    if (value != null && value > HIGH_BUDGET_THRESHOLD) {
      return warningError(
        'high-budget',
        `Budgets above $${HIGH_BUDGET_THRESHOLD.toLocaleString()}/mo need finance sign-off`,
      );
    }
    return null;
  });

  // Always disabled — exercises the disabled background/opacity tokens.
  disabled(path.legacyWorkspaceId, { when: () => true });
});

/**
 * Brand-theming demo form.
 *
 * A small workspace-settings form used purely as a canvas for the brand
 * palette: one required text field, one pattern-validated field, one
 * non-blocking warning, and one permanently disabled field, so every
 * stateful color the theming guide documents (error, warning, disabled,
 * focus) has a field to land on.
 */
@Component({
  selector: 'ngx-brand-theming-form',
  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [FormField, NgxSignalFormToolkit, NgxFormField],
  templateUrl: './brand-theming.form.html',
  styles: `
    :host {
      display: block;
    }

    .brand-theming-stack {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `,
})
export class BrandThemingFormComponent {
  readonly #model = signal<BrandThemingModel>(initialBrandThemingModel);

  readonly brandThemingForm = form(this.#model, brandThemingSchema);
}
