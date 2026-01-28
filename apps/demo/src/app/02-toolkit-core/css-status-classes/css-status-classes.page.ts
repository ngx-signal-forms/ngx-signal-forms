import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import {
  email,
  form,
  FormField,
  minLength,
  required,
  submit,
} from '@angular/forms/signals';
import { NgxSignalFormToolkit } from '@ngx-signal-forms/toolkit';
import {
  NgxFloatingLabelDirective,
  NgxSignalFormFieldHintComponent,
  NgxSignalFormFieldWrapperComponent,
} from '@ngx-signal-forms/toolkit/form-field';
import { PageHeaderComponent } from '../../ui';

interface UserForm {
  email: string;
  password: string;
}

@Component({
  selector: 'ngx-css-status-classes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormField,
    NgxSignalFormToolkit,
    NgxSignalFormFieldWrapperComponent,
    NgxFloatingLabelDirective,
    NgxSignalFormFieldHintComponent,
    PageHeaderComponent,
  ],
  templateUrl: './css-status-classes.page.html',
  styleUrls: ['./css-status-classes.page.scss'],
})
export class CssStatusClassesPageComponent {
  readonly #immediateModel = signal<UserForm>({ email: '', password: '' });
  readonly #onTouchModel = signal<UserForm>({ email: '', password: '' });
  readonly #nativeModel = signal<UserForm>({ email: '', password: '' });

  protected readonly immediateForm = form(this.#immediateModel, (path) => {
    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Please enter a valid email address' });
    required(path.password, { message: 'Password is required' });
    minLength(path.password, 8, {
      message: 'Password must be at least 8 characters',
    });
  });

  protected readonly onTouchForm = form(this.#onTouchModel, (path) => {
    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Please enter a valid email address' });
    required(path.password, { message: 'Password is required' });
    minLength(path.password, 8, {
      message: 'Password must be at least 8 characters',
    });
  });

  protected readonly nativeForm = form(this.#nativeModel, (path) => {
    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Please enter a valid email address' });
    required(path.password, { message: 'Password is required' });
    minLength(path.password, 8, {
      message: 'Password must be at least 8 characters',
    });
  });

  protected readonly immediateClasses = computed(() => {
    const email = this.immediateForm.email();
    return {
      invalid: email.invalid(),
      valid: email.valid(),
      touched: email.touched(),
      dirty: email.dirty(),
    };
  });

  protected readonly onTouchClasses = computed(() => {
    const email = this.onTouchForm.email();
    return {
      invalid: email.invalid(),
      valid: email.valid(),
      touched: email.touched(),
      dirty: email.dirty(),
      // Simulated on-touch: invalid class only shown when touched
      showInvalid: email.invalid() && email.touched(),
    };
  });

  protected readonly nativeClasses = computed(() => {
    const email = this.nativeForm.email();
    return {
      invalid: email.invalid(),
      valid: email.valid(),
      touched: email.touched(),
      dirty: email.dirty(),
    };
  });

  protected handleImmediateSubmit(event: Event): void {
    event.preventDefault();
    submit(this.immediateForm, async () => {
      console.log(
        '[Immediate Strategy] Form submitted:',
        this.#immediateModel(),
      );
      return null;
    });
  }

  protected handleOnTouchSubmit(event: Event): void {
    event.preventDefault();
    submit(this.onTouchForm, async () => {
      console.log('[On-Touch Strategy] Form submitted:', this.#onTouchModel());
      return null;
    });
  }

  protected handleNativeSubmit(event: Event): void {
    event.preventDefault();
    submit(this.nativeForm, async () => {
      console.log('[Angular Native] Form submitted:', this.#nativeModel());
      return null;
    });
  }
}
