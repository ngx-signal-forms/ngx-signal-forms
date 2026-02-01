import { min, required, schema } from '@angular/forms/signals';
import type { CustomControlsModel } from './custom-controls.model';

/**
 * Validation schema for the custom controls demo form.
 *
 * Demonstrates:
 * - Required validation on custom rating controls
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
});
