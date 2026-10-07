import { describe, expect, it } from 'vitest';
import { getEmailDomain } from './email-domain';

describe('getEmailDomain', () => {
  it('normalizes whitespace and domain casing', () => {
    expect(getEmailDomain('  User@Example.COM  ')).toBe('example.com');
  });

  it('returns null when the address has no domain', () => {
    expect(getEmailDomain('user@')).toBeNull();
  });

  it('returns null for empty input', () => {
    expect(getEmailDomain('')).toBeNull();
  });
});
