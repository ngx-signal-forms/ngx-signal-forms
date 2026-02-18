import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormField, email, form, required } from '@angular/forms/signals';
import {
  FormFieldAppearance,
  NgxSignalFormToolkit,
} from '@ngx-signal-forms/toolkit';
import { NgxFormField } from '@ngx-signal-forms/toolkit/form-field';
import {
  AppearanceToggleComponent,
  CardComponent,
  PageHeaderComponent,
  ShikiHighlightDirective,
} from '../../ui';

@Component({
  selector: 'ngx-dynamic-appearance-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormField,
    NgxSignalFormToolkit,
    NgxFormField,
    PageHeaderComponent,
    CardComponent,
    ShikiHighlightDirective,
    AppearanceToggleComponent,
  ],
  template: `
    <ngx-page-header
      title="Dynamic Appearance"
      subtitle="Switch between standard and outline appearance at runtime using the appearance input."
    />

    <section class="space-y-8">
      <!-- Interactive Demo -->
      <ngx-card>
        <div class="mb-6 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Live Appearance Switcher
          </h3>

          <!-- Appearance Toggle -->
          <ngx-appearance-toggle [(value)]="appearance" />
        </div>

        <form [ngxSignalForm]="demoForm" class="grid gap-6 md:grid-cols-2">
          <!-- Text Input -->
          <ngx-signal-form-field-wrapper
            [formField]="demoForm.firstName"
            [appearance]="appearance()"
          >
            <label for="firstName">First Name</label>
            <input id="firstName" [formField]="demoForm.firstName" />
            <ngx-signal-form-field-hint>
              Try switching appearance above
            </ngx-signal-form-field-hint>
          </ngx-signal-form-field-wrapper>

          <!-- Email Input -->
          <ngx-signal-form-field-wrapper
            [formField]="demoForm.email"
            [appearance]="appearance()"
          >
            <label for="email">Email</label>
            <input id="email" type="email" [formField]="demoForm.email" />
          </ngx-signal-form-field-wrapper>

          <!-- Select -->
          <ngx-signal-form-field-wrapper
            [formField]="demoForm.role"
            [appearance]="appearance()"
            class="md:col-span-2"
          >
            <label for="role">Role</label>
            <select id="role" [formField]="demoForm.role">
              <option value="">Select a role...</option>
              <option value="user">User</option>
              <option value="admin">Administrator</option>
            </select>
          </ngx-signal-form-field-wrapper>

          <!-- Textarea -->
          <ngx-signal-form-field-wrapper
            [formField]="demoForm.bio"
            [appearance]="appearance()"
            class="md:col-span-2"
          >
            <label for="bio">Bio</label>
            <textarea id="bio" [formField]="demoForm.bio" rows="3"></textarea>
          </ngx-signal-form-field-wrapper>
        </form>
      </ngx-card>

      <!-- Code Example -->
      <ngx-card>
        <h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Implementation
        </h3>
        <p class="mb-4 text-gray-600 dark:text-gray-400">
          Bind the <code>[appearance]</code> input to a signal to change layout
          dynamically at runtime. Global configuration via
          <code>provideNgxSignalFormsConfig</code> is static and cannot be
          changed after initialization.
        </p>

        <pre ngxShikiHighlight language="typescript">
// 1. Create a signal for the appearance state
readonly appearance = signal&lt;FormFieldAppearance&gt;('standard');

// 2. Bind it to your form fields
&lt;ngx-signal-form-field-wrapper
  [formField]="form.email"
  [appearance]="appearance()"&gt;
  &lt;label for="email"&gt;Email&lt;/label&gt;
  &lt;input id="email" [formField]="form.email" /&gt;
&lt;/ngx-signal-form-field-wrapper&gt;</pre
        >
      </ngx-card>
    </section>
  `,
})
export class DynamicAppearancePageComponent {
  readonly appearance = signal<FormFieldAppearance>('standard');

  readonly demoForm = form(
    signal({
      firstName: '',
      email: '',
      role: '',
      bio: '',
    }),
    (path) => {
      required(path.firstName);
      required(path.email);
      email(path.email);
      required(path.role);
    },
  );
}
