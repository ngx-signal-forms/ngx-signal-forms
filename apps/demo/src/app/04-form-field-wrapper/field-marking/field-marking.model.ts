/**
 * Form model for the field-marking demo. A small profile form with a mix of
 * required and optional fields, plus one field (`phone`) whose required-ness
 * can be toggled at runtime to show the legend appear/disappear.
 */
export interface FieldMarkingModel {
  /** Always required. */
  fullName: string;
  /** Always required. */
  email: string;
  /** Required only when the "make phone required" toggle is on. */
  phone: string;
  /** Always optional. */
  company: string;
  /** Always optional. */
  bio: string;
}

export const initialFieldMarkingModel: FieldMarkingModel = {
  fullName: '',
  email: '',
  phone: '',
  company: '',
  bio: '',
};
