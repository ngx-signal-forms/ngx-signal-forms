import {
  email,
  minLength,
  required,
  schema,
  validate,
} from '@angular/forms/signals';
import type { ContactFormModel } from './contact-form.model';

/**
 * Validation schema for the Material reference contact form.
 *
 * One representative field per kind:
 * - `name`  — text input
 * - `topic` — select
 * - `agree` — checkbox
 *
 * `name` also exercises the **warnings** branch via a `kind: 'warn:short-name'`
 * custom error so the demo (and the smoke spec) can prove `<mat-hint>` picks
 * up the toolkit's warning slot.
 */
export const contactFormSchema = schema<ContactFormModel>((path) => {
  required(path.name, { message: 'Please enter your name' });
  minLength(path.name, 2, {
    message: 'Name must be at least 2 characters',
  });
  // Warning: a non-blocking nudge once the value is non-empty but short.
  // Renders inside `<mat-hint>` via the renderer token, not `<mat-error>`.
  validate(path.name, (ctx) => {
    const trimmed = (ctx.value() ?? '').trim();
    if (trimmed.length >= 2 && trimmed.length < 4) {
      return {
        kind: 'warn:short-name',
        message: 'Heads up — short names are easy to mis-type. Are you sure?',
      };
    }
    return null;
  });

  required(path.topic, {
    message: 'Pick a topic so we can route your message',
  });

  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Please enter a valid email address' });

  validate(path.agree, (ctx) => {
    if (!ctx.value()) {
      return {
        kind: 'agree-required',
        message: 'You need to agree before we can submit',
      };
    }
    return null;
  });
});
