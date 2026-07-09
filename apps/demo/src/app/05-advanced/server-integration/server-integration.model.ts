/**
 * Server Integration Model
 *
 * Model for the "real-world edit flow" demo: load a record from a fake API,
 * edit it, and submit it back — including server-side field/form errors.
 */

export interface ProfileFormModel {
  name: string;
  email: string;
}

/**
 * The blank shape shown for the briefest instant before the initial
 * `resource()` load resolves. Real apps typically pair this with a loading
 * skeleton (see `server-integration.form.ts`) rather than rendering the empty
 * form.
 */
export function createEmptyProfileFormModel(): ProfileFormModel {
  return { name: '', email: '' };
}
