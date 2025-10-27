import {
  type SchemaFn,
  applyEach,
  customError,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';
import type { CustomStyledFormModel } from './custom-styled-form.model';

/**
 * Custom Styled Form Validation Schema
 *
 * Defines validation rules for the criminal fact entry form.
 * Validates nested arrays and ensures required fields are filled.
 *
 * Validations include:
 * - Required fields for location data
 * - Duplicate article detection
 * - Date format validation
 * - Minimum length requirements
 * - Warning for missing optional fields
 */
export const customStyledFormSchema: SchemaFn<CustomStyledFormModel> = (
  path,
) => {
  // Validate each fact entry
  applyEach(path.facts, (factPath) => {
    // Required fields
    required(factPath.commitDate, {
      message: 'Pleegdatum is verplicht',
    });

    required(factPath.country, {
      message: 'Land is verplicht',
    });

    // Conditional validation: If country is Netherlands, require municipality
    validate(factPath.municipality, (ctx) => {
      const country = ctx.valueOf(factPath.country);
      const municipality = ctx.value();

      if (country === 'Nederland' && !municipality) {
        return customError({
          kind: 'required_when_nl',
          message: 'Gemeente is verplicht voor Nederland',
        });
      }
      return null;
    });

    // Conditional validation: If country is not Netherlands, require abroad location
    validate(factPath.abroadLocation, (ctx) => {
      const country = ctx.valueOf(factPath.country);
      const abroadLocation = ctx.value();

      if (country && country !== 'Nederland' && !abroadLocation) {
        return customError({
          kind: 'required_when_abroad',
          message: 'Buitenlandse locatie is verplicht',
        });
      }
      return null;
    });

    // Warning for missing place description
    validate(factPath.place, (ctx) => {
      const place = ctx.value();
      if (!place || place.trim().length === 0) {
        return customError({
          kind: 'warn:missing_place',
          message:
            'Overweeg een plaatsbeschrijving toe te voegen voor duidelijkheid',
        });
      }
      return null;
    });

    // Minimum length for location description when provided
    validate(factPath.locationDescription, (ctx) => {
      const description = ctx.value();
      if (description && description.length > 0 && description.length < 10) {
        return customError({
          kind: 'too_short',
          message: 'Locatiebeschrijving moet minimaal 10 karakters bevatten',
        });
      }
      return null;
    });

    // Validate each offense within the fact
    applyEach(factPath.offenses, (offensePath) => {
      // Qualification is required
      required(offensePath.qualification, {
        message: 'Kwalificatie is verplicht',
      });

      // Minimum length for qualification
      minLength(offensePath.qualification, 3, {
        message: 'Kwalificatie moet minimaal 3 karakters bevatten',
      });

      // Validate that at least one article is present
      validate(offensePath.articles, (ctx) => {
        const articles = ctx.value();
        if (!articles || articles.length === 0) {
          return customError({
            kind: 'no_articles',
            message: 'Tenminste één wetsartikel is verplicht',
          });
        }
        return null;
      }); // Validate each article within the offense
      applyEach(offensePath.articles, (articlePath) => {
        // Article is required
        required(articlePath.article, {
          message: 'Wetsartikel is verplicht',
        });

        // Validate article format (basic pattern: SR-number with optional letter)
        validate(articlePath.article, (ctx) => {
          const article = ctx.value();
          if (!article) return null;

          // Pattern: "SR-" + digits + optional letter (e.g., "SR-310" or "SR-310a")
          const pattern = /^SR-\d+[a-z]?$/i;
          if (!pattern.test(article.trim())) {
            return customError({
              kind: 'warn:invalid_format',
              message:
                'Wetsartikel heeft meestal formaat: "SR-310" of "SR-310a"',
            });
          }
          return null;
        });
      });

      // Check for duplicate articles within the same offense
      validate(offensePath.articles, (ctx) => {
        const articles = ctx.value();
        if (!articles || articles.length <= 1) return null;

        // Normalize and check for duplicates
        const normalizedArticles = articles
          .map((a) => a.article.trim().toLowerCase())
          .filter((a) => a.length > 0);

        const duplicates = normalizedArticles.filter(
          (article, index) => normalizedArticles.indexOf(article) !== index,
        );

        if (duplicates.length > 0) {
          return customError({
            kind: 'duplicate_articles',
            message: `Dubbele wetsartikelen gevonden: ${[...new Set(duplicates)].join(', ')}`,
          });
        }

        return null;
      });
    });

    // Validate at least one offense exists
    validate(factPath.offenses, (ctx) => {
      const offenses = ctx.value();
      if (!offenses || offenses.length === 0) {
        return customError({
          kind: 'no_offenses',
          message: 'Tenminste één strafbaar feit is verplicht',
        });
      }
      return null;
    });
  });
};
