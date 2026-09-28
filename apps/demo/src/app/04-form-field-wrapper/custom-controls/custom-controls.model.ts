/**
 * Model interface for the custom controls demo form.
 * Demonstrates custom FormValueControl components with Signal Forms.
 */
export interface CustomControlsModel {
  /** Product name */
  productName: string;

  /** Framework selected with the Angular Aria autocomplete control */
  framework: string;

  /** Framework selected with the Angular Aria select control */
  frameworkSelect: string;

  /** Product rating (1-5 stars) using custom RatingControl */
  rating: number;

  /** Service quality rating */
  serviceRating: number;

  /** Would recommend to friend (boolean rating mapped to 0/1) */
  wouldRecommend: number;

  /** Email updates preference controlled by a switch */
  emailUpdates: boolean;

  /** Standard checkbox that explicitly opts into checkbox semantics */
  shareReviewPublicly: boolean;

  /** Custom slider control that owns its ARIA relationships manually */
  accessibilityAudit: number;

  /** Optional feedback text */
  feedback: string;

  /**
   * Date of birth, edited through a `FormValueControl<Date | null>` adapter
   * wrapped around a self-contained fake "legacy" datepicker widget (its
   * own value/change API, not a native input). Optional — see
   * `LegacyDatepickerAdapterComponent` for the adapter boundary itself.
   */
  birthDate: Date | null;

  /**
   * Country, edited through a minimal mocked autocomplete
   * (`MockAutocompleteComponent`) that binds `[formField]` directly to its
   * own inner `role="combobox"` input. Demonstrates the padding-ownership
   * recipe (#475): a `[prefix]` icon, a `[suffix]` clear button, and a
   * popup anchored to the field shell.
   */
  country: string;
}

/**
 * Initial values for the custom controls form.
 */
export const initialCustomControlsModel: CustomControlsModel = {
  productName: '',
  framework: '',
  frameworkSelect: '',
  rating: 0,
  serviceRating: 0,
  wouldRecommend: 0,
  emailUpdates: false,
  shareReviewPublicly: false,
  accessibilityAudit: 0,
  feedback: '',
  birthDate: null,
  country: '',
};
