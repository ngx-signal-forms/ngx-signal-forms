import { email, minLength, required, schema } from '@angular/forms/signals';
import type { ErrorMessagesModel } from './error-messages.model';

/**
 * Validation schema for error messages example
 *
 * Demonstrates 3-tier message priority:
 * - Email: Uses validator message (Tier 1 - highest priority)
 * - Password: No validator message, uses registry (Tier 2)
 * - Bio: No validator message, no registry entry, uses default fallback (Tier 3)
 */
export const errorMessagesSchema = schema<ErrorMessagesModel>((path) => {
  // Email: Uses validator message (Tier 1 - highest priority)
  required(path.email); // No message - will use registry
  email(path.email, { message: 'Valid email required' }); // Has message - Tier 1!

  // Password: No validator message, uses registry (Tier 2)
  required(path.password); // No message
  minLength(path.password, 8); // No message - falls back to registry

  // Bio: No validator message, no registry entry, uses default fallback (Tier 3)
  required(path.bio); // No message - will use default "This field is required"
});
