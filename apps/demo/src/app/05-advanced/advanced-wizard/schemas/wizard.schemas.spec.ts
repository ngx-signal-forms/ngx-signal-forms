import { describe, expect, it } from 'vitest';
import { isPassportValidForDeparture } from './wizard.schemas';

describe('isPassportValidForDeparture', () => {
  // Date inputs give date-only strings. JavaScript parses them as UTC
  // midnight, so the six-month limit must be computed in UTC. In a zone west
  // of UTC, local month maths moves the limit by a day.
  it('rejects an expiry on the exact six-month limit', () => {
    expect(isPassportValidForDeparture('2099-09-01', '2099-03-01')).toBe(false);
  });

  it('accepts an expiry one day after the six-month limit', () => {
    expect(isPassportValidForDeparture('2099-09-02', '2099-03-01')).toBe(true);
  });

  it('rejects an expiry one day before the six-month limit', () => {
    expect(isPassportValidForDeparture('2099-08-31', '2099-03-01')).toBe(false);
  });

  // Adding months must clamp to the last day of the target month. Plain
  // setUTCMonth overflows: 2099-08-31 + 6 months becomes 2100-03-03.
  it('clamps a month-end departure to the last day of February', () => {
    expect(isPassportValidForDeparture('2100-03-01', '2099-08-31')).toBe(true);
    expect(isPassportValidForDeparture('2100-02-28', '2099-08-31')).toBe(false);
  });

  it('clamps to 29 February in a leap year', () => {
    expect(isPassportValidForDeparture('2104-03-01', '2103-08-31')).toBe(true);
    expect(isPassportValidForDeparture('2104-02-29', '2103-08-31')).toBe(false);
  });

  it('skips the rule when the expiry or the departure is missing', () => {
    expect(isPassportValidForDeparture('', '2099-03-01')).toBe(true);
    expect(isPassportValidForDeparture('2099-09-01', null)).toBe(true);
  });
});
