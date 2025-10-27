/**
 * Custom Styled Form - Data Model
 *
 * Represents the form data structure for a criminal fact entry system.
 * Based on Dutch legal system for prison sentence data entry.
 */

export interface LegalArticle {
  article: string;
}

export interface CriminalOffense {
  qualification: string;
  articles: LegalArticle[];
}

export interface FactEntry {
  factNumber: number;
  commitDate: string;
  commitPeriod: string;
  country: string;
  place: string;
  municipality: string;
  locationDescription: string;
  abroadLocation: string;
  offenses: CriminalOffense[];
}

export interface CustomStyledFormModel {
  facts: FactEntry[];
}

/**
 * Factory function to create an empty fact entry
 */
export function createEmptyFact(factNumber: number): FactEntry {
  return {
    factNumber,
    commitDate: '',
    commitPeriod: '',
    country: '',
    place: '',
    municipality: '',
    locationDescription: '',
    abroadLocation: '',
    offenses: [createEmptyOffense()],
  };
}

/**
 * Factory function to create an empty criminal offense
 */
export function createEmptyOffense(): CriminalOffense {
  return {
    qualification: '',
    articles: [createEmptyArticle()],
  };
}

/**
 * Factory function to create an empty legal article
 */
export function createEmptyArticle(): LegalArticle {
  return {
    article: '',
  };
}
