import type { ValidationError } from '@angular/forms/signals';
import type {
  ErrorReadableState,
  ErrorVisibilityState,
} from '@ngx-signal-forms/toolkit';
import { describe, expectTypeOf, it } from 'vitest';

describe('public field-state types', () => {
  it('exposes boolean invalid and touched readers', () => {
    expectTypeOf<
      ReturnType<ErrorVisibilityState['invalid']>
    >().toEqualTypeOf<boolean>();
    expectTypeOf<
      ReturnType<ErrorVisibilityState['touched']>
    >().toEqualTypeOf<boolean>();
  });

  it('exposes direct validation errors', () => {
    type Errors = ReturnType<ErrorReadableState['errors']>;
    expectTypeOf<Errors[number]>().toExtend<ValidationError>();
  });
});
