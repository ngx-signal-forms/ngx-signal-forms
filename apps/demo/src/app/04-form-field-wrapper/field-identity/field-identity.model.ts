/**
 * Form model for the field-identity demo.
 *
 * Both fields are rendered through a *custom* wrapper that owns its own
 * field identity, and both are bound to a widget that mints its own inner
 * `id`. The property names below are therefore the field names the wrapper
 * declares — they never appear as a DOM `id` anywhere on the page.
 */
export interface FieldIdentityModel {
  /** Section 1 — always visible, shows name-vs-id and hint chaining. */
  emailAddress: string;

  /** Section 2 — lives inside a collapsible container. */
  deliveryNote: string;
}

export const initialFieldIdentityModel: FieldIdentityModel = {
  emailAddress: '',
  deliveryNote: '',
};
