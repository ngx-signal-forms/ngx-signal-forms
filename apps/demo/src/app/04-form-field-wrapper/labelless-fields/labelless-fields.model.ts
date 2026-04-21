/**
 * Form model for the labelless-fields demo. Each field demonstrates a
 * different pattern where a wrapper-level <label> would feel redundant
 * given the surrounding context (search bar, grouped fields, narrow
 * numeric inputs).
 */
export interface LabellessFieldsModel {
  /** Section 1 — search input. */
  searchQuery: string;

  /** Section 2 — grouped phone number parts under a single heading. */
  phoneCountry: string;
  phoneNumber: string;
  phoneExtension: string;

  /** Section 3 — amount input, labelled by its card heading. */
  amount: number;

  /** Section 4 — same field used twice (with/without label). */
  comparison: string;

  /** Section 5 — narrow inputs where errors must escape the input width. */
  age: number;
  zipCode: string;
  /** Six-character OTP entered as a single string. */
  otp: string;
}

export const initialLabellessFieldsModel: LabellessFieldsModel = {
  searchQuery: '',
  phoneCountry: '',
  phoneNumber: '',
  phoneExtension: '',
  amount: 0,
  comparison: '',
  age: 0,
  zipCode: '',
  otp: '',
};
