import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import {
  NGX_FIELD_LABEL_RESOLVER,
  provideFieldLabels,
  type FieldLabelResolver,
} from './field-labels.provider';

describe('Field Label Provider', () => {
  describe('provideFieldLabels with static map', () => {
    it('should resolve mapped field paths', () => {
      TestBed.configureTestingModule({
        providers: [
          provideFieldLabels({
            contactEmail: 'E-mailadres',
            'address.postalCode': 'Postcode',
          }),
        ],
      });

      const resolver = TestBed.inject(NGX_FIELD_LABEL_RESOLVER);
      expect(resolver('contactEmail')).toBe('E-mailadres');
      expect(resolver('address.postalCode')).toBe('Postcode');
    });

    it('should fall back to humanizeFieldPath for unmapped fields', () => {
      TestBed.configureTestingModule({
        providers: [
          provideFieldLabels({
            contactEmail: 'E-mailadres',
          }),
        ],
      });

      const resolver = TestBed.inject(NGX_FIELD_LABEL_RESOLVER);
      expect(resolver('address.street')).toBe('Address / Street');
      expect(resolver('address.postalCode')).toBe('Address / Postal code');
      expect(resolver('ng.form0.email')).toBe('Email');
    });

    it('should prefer mapped labels over humanized fallback', () => {
      TestBed.configureTestingModule({
        providers: [
          provideFieldLabels({
            'address.postalCode': 'Postcode',
          }),
        ],
      });

      const resolver = TestBed.inject(NGX_FIELD_LABEL_RESOLVER);
      expect(resolver('address.postalCode')).toBe('Postcode');
    });
  });

  describe('provideFieldLabels with factory function', () => {
    it('should use the returned resolver function', () => {
      const customResolver: FieldLabelResolver = (path) => `Custom: ${path}`;

      TestBed.configureTestingModule({
        providers: [provideFieldLabels(() => customResolver)],
      });

      const resolver = TestBed.inject(NGX_FIELD_LABEL_RESOLVER);
      expect(resolver('email')).toBe('Custom: email');
    });
  });

  describe('NGX_FIELD_LABEL_RESOLVER without provider', () => {
    it('should return null when injected optionally without a provider', () => {
      TestBed.configureTestingModule({});

      const resolver = TestBed.inject(NGX_FIELD_LABEL_RESOLVER, null, {
        optional: true,
      });
      expect(resolver).toBeNull();
    });
  });
});
