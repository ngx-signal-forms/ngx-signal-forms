/**
 * Submission Patterns Model
 *
 * Model for demonstrating form submission patterns with server errors
 */

export interface SubmissionModel {
  username: string;
  password: string;
  confirmPassword: string;
  /// Demo control: simulate server error for testing
  simulateServerError: boolean;
}
