import { min, required, schema } from '@angular/forms/signals';
import type { CustomControlsModel } from './custom-controls.model';

/**
 * Validation schema for the custom controls demo form.
 *
 * Demonstrates:
 * - Required validation on custom rating controls
 * - Native checkbox switch control inside the form field wrapper
 * - Min value validation for ratings
 * - Standard text field validation
 */
export const customControlsSchema = schema<CustomControlsModel>((path) => {
  // Product name is required
  required(path.productName, { message: 'Product name is required' });

  // Rating must be at least 1 star
  required(path.rating, { message: 'Please provide a rating' });
  min(path.rating, 1, { message: 'Rating must be at least 1 star' });

  // Service rating must be at least 1 star
  required(path.serviceRating, { message: 'Please rate the service' });
  min(path.serviceRating, 1, {
    message: 'Service rating must be at least 1 star',
  });

  // Would recommend is optional but if provided must be valid
  // (0 = not answered, 1+ = answered)

  // Require the switch in this demo so the compact wrapper row can exercise
  // the same error/ARIA flows as the other controls.
  required(path.emailUpdates, {
    message: 'Enable email updates to complete this demo',
  });

  // Standard checkbox that only participates in toolkit checkbox flows when it
  // explicitly opts into checkbox semantics.
  required(path.shareReviewPublicly, {
    message: 'Please confirm that this review can be shared publicly',
  });

  // Slider-style custom control with component-owned ARIA wiring.
  required(path.accessibilityAudit, {
    message: 'Please rate the accessibility experience',
  });
  min(path.accessibilityAudit, 1, {
    message: 'Accessibility audit must be at least 1 star',
  });
});
