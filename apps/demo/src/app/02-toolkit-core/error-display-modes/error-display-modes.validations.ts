import {
  customError,
  email,
  max,
  maxLength,
  min,
  minLength,
  required,
  schema,
  validate,
} from '@angular/forms/signals';

export interface ProductFeedbackModel {
  // Personal Information
  name: string;
  email: string;
  company: string;

  // Feedback
  productUsed: string;
  overallRating: number;
  improvementSuggestions: string;
  detailedFeedback: string;

  // Preferences
  allowFollowUp: boolean;
  newsletter: boolean;
}

export const productFeedbackSchema = schema<ProductFeedbackModel>((path) => {
  // Personal Information Section
  required(path.name, { message: 'Name is required' });
  minLength(path.name, 2, {
    message: 'Name must be at least 2 characters',
  });
  maxLength(path.name, 50, {
    message: 'Name cannot exceed 50 characters',
  });

  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Please enter a valid email address' });

  // Company is optional but has max length
  maxLength(path.company, 100, {
    message: 'Company name cannot exceed 100 characters',
  });

  // Feedback Section
  required(path.productUsed, {
    message: 'Please select which product you used',
  });

  required(path.overallRating, { message: 'Please rate your experience' });
  min(path.overallRating, 1, { message: 'Rating must be at least 1' });
  max(path.overallRating, 5, { message: 'Rating must be at most 5' });

  // Conditional validation: improvement suggestions required for low ratings
  required(path.improvementSuggestions, {
    when: ({ valueOf }) => {
      const rating = valueOf(path.overallRating);
      return rating > 0 && rating <= 3;
    },
    message: 'Please help us understand what could be improved',
  });

  validate(path.improvementSuggestions, (ctx) => {
    const value = ctx.value();
    const rating = ctx.fieldOf(path.overallRating)().value();

    if (rating > 0 && rating <= 3 && value && value.length < 10) {
      return customError({
        kind: 'too-short',
        message: 'Please provide at least 10 characters of feedback',
      });
    }
    return null;
  });

  maxLength(path.improvementSuggestions, 500, {
    message: 'Feedback cannot exceed 500 characters',
  });

  maxLength(path.detailedFeedback, 1000, {
    message: 'Detailed feedback cannot exceed 1000 characters',
  });
});

export const productFeedbackValidationSuite = schema<ProductFeedbackModel>(
  (path) => {
    required(path.name, { message: 'Name is required' });
    minLength(path.name, 2, { message: 'Name must be at least 2 characters' });

    required(path.email, { message: 'Email is required' });
    email(path.email, { message: 'Please enter a valid email address' });

    required(path.detailedFeedback, { message: 'Feedback is required' });
    minLength(path.detailedFeedback, 10, {
      message: 'Feedback must be at least 10 characters',
    });
  },
);
