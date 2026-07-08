import { describe, expect, it } from 'vitest';
import {
  humanizeFieldPath,
  stripAngularFormPrefix,
} from './humanize-field-path';

describe('stripAngularFormPrefix', () => {
  it('strips the default production app-id prefix ("ng.form0.")', () => {
    expect(stripAngularFormPrefix('ng.form0.email')).toBe('email');
  });

  it('strips a non-default app-id prefix (any app-id segment, not just "ng")', () => {
    // BrowserTestingModule uses 'a' as the app id, and provideAppId() lets
    // consumers configure any custom id — the prefix regex must not
    // hardcode 'ng'.
    expect(stripAngularFormPrefix('a.form0.email')).toBe('email');
    expect(stripAngularFormPrefix('my-custom-app.form3.address.city')).toBe(
      'address.city',
    );
  });

  it('matches an arbitrary form index, not just form0', () => {
    expect(stripAngularFormPrefix('ng.form12.email')).toBe('email');
  });

  it('only strips a prefix that matches the exact pattern (app-id with no dots, then "formN.")', () => {
    // No "formN." segment at all — nothing to strip.
    expect(stripAngularFormPrefix('address.postalCode')).toBe(
      'address.postalCode',
    );
  });

  it('trims surrounding whitespace before stripping', () => {
    expect(stripAngularFormPrefix('  ng.form0.email  ')).toBe('email');
  });

  it('returns the input unchanged when there is no prefix to strip', () => {
    expect(stripAngularFormPrefix('email')).toBe('email');
  });

  it('only strips one prefix occurrence, leaving any nested dotted path intact', () => {
    expect(stripAngularFormPrefix('ng.form0.address.postalCode')).toBe(
      'address.postalCode',
    );
  });
});

describe('humanizeFieldPath', () => {
  // Focused direct coverage — this resolver is already exercised indirectly
  // via field-labels.provider.spec.ts and headless/utilities.spec.ts, but it
  // had no spec co-located with its own module.

  it('splits camelCase segments and capitalizes them', () => {
    expect(humanizeFieldPath('postalCode')).toBe('Postal code');
  });

  it('joins nested dotted paths with " / "', () => {
    expect(humanizeFieldPath('address.postalCode')).toBe(
      'Address / Postal code',
    );
  });

  it('strips the Angular internal form prefix before humanizing', () => {
    expect(humanizeFieldPath('ng.form0.email')).toBe('Email');
  });

  it('normalizes underscores and hyphens to spaces', () => {
    expect(humanizeFieldPath('first_name')).toBe('First name');
    expect(humanizeFieldPath('last-name')).toBe('Last name');
  });

  it('falls back to the raw field name when every segment is empty after stripping', () => {
    expect(humanizeFieldPath('ng.form0.')).toBe('ng.form0.');
  });
});
