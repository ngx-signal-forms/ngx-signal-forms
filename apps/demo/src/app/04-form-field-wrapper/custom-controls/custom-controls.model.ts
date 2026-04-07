/**
 * Model interface for the custom controls demo form.
 * Demonstrates custom FormValueControl components with Signal Forms.
 */
export interface CustomControlsModel {
  /** Product name */
  productName: string;

  /** Product rating (1-5 stars) using custom RatingControl */
  rating: number;

  /** Service quality rating */
  serviceRating: number;

  /** Would recommend to friend (boolean rating mapped to 0/1) */
  wouldRecommend: number;

  /** Email updates preference controlled by a switch */
  emailUpdates: boolean;

  /** Optional feedback text */
  feedback: string;
}

/**
 * Initial values for the custom controls form.
 */
export const initialCustomControlsModel: CustomControlsModel = {
  productName: '',
  rating: 0,
  serviceRating: 0,
  wouldRecommend: 0,
  emailUpdates: false,
  feedback: '',
};
