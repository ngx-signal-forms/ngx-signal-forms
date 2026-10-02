import { describe, expect, it } from 'vitest';
import {
  DestinationSchema,
  isPassportValidForDeparture,
  lastDepartureDate,
} from './wizard.schemas';

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

  // Date-times without an offset parse as local time. Only the calendar date
  // counts, in every time zone.
  it('treats a date-time like its date-only form', () => {
    const departure = '2099-03-01T23:30:00';
    const expiry = '2099-09-01T00:30:00';
    expect(isPassportValidForDeparture(expiry, departure)).toBe(
      isPassportValidForDeparture('2099-09-01', '2099-03-01'),
    );
    expect(isPassportValidForDeparture('2099-09-02T00:30:00', departure)).toBe(
      isPassportValidForDeparture('2099-09-02', '2099-03-01'),
    );
  });

  it('clamps a late-evening month-end date-time like its date-only form', () => {
    expect(
      isPassportValidForDeparture('2100-03-01', '2099-08-31T22:00:00'),
    ).toBe(true);
    expect(
      isPassportValidForDeparture('2100-02-28', '2099-08-31T22:00:00'),
    ).toBe(false);
  });
});

describe('lastDepartureDate', () => {
  it('returns null when no departure is set', () => {
    expect(lastDepartureDate([{ departureDate: '' }])).toBeNull();
  });

  it('picks the latest calendar date across date-only and date-time inputs', () => {
    expect(
      lastDepartureDate([
        { departureDate: '2099-03-01T23:30:00' },
        { departureDate: '2099-03-02' },
        { departureDate: '2099-03-01' },
      ]),
    ).toBe('2099-03-02');
    expect(
      lastDepartureDate([
        { departureDate: '2099-03-01' },
        { departureDate: '2099-03-03T00:30:00' },
      ]),
    ).toBe('2099-03-03');
  });
});

describe('DestinationSchema date-order rules', () => {
  const base = {
    id: '3f2b8a52-6d1c-4a2e-9a55-1b2c3d4e5f60',
    country: 'NL',
    city: 'Amsterdam',
    arrivalDate: '2099-03-10',
    departureDate: '2099-03-15',
    accommodation: '',
    activities: [
      {
        id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
        name: 'Canal tour',
        date: '2099-03-11',
        requirements: [],
      },
    ],
  };

  function messages(overrides: Record<string, unknown>): string[] {
    const result = DestinationSchema.safeParse({ ...base, ...overrides });
    return result.success ? [] : result.error.issues.map((i) => i.message);
  }

  const ordering = 'Departure date must be after arrival date';

  it('adds no ordering error for an empty departure', () => {
    const found = messages({ departureDate: '' });
    expect(found).toContain('Departure date required');
    expect(found).not.toContain(ordering);
  });

  it('adds no ordering error for an empty arrival', () => {
    const found = messages({ arrivalDate: '' });
    expect(found).toContain('Arrival date required');
    expect(found).not.toContain(ordering);
  });

  it('adds no ordering or past error for a malformed arrival', () => {
    const found = messages({ arrivalDate: 'nope' });
    expect(found).not.toContain(ordering);
    expect(found).not.toContain('Arrival date cannot be in the past');
  });

  it('still reports a departure before the arrival', () => {
    expect(
      messages({ arrivalDate: '2099-03-15', departureDate: '2099-03-10' }),
    ).toContain(ordering);
  });

  describe('date format', () => {
    const format = 'Enter a valid date';

    function pathsFor(
      message: string,
      overrides: Record<string, unknown>,
    ): string[] {
      const result = DestinationSchema.safeParse({ ...base, ...overrides });
      return result.success
        ? []
        : result.error.issues
            .filter((i) => i.message === message)
            .map((i) => i.path.join('.'));
    }

    it('rejects a malformed arrival on arrivalDate only', () => {
      const overrides = { arrivalDate: '2031-13-45' };
      expect(pathsFor(format, overrides)).toEqual(['arrivalDate']);
      const found = messages(overrides);
      expect(found).not.toContain(ordering);
      expect(found).not.toContain('Arrival date cannot be in the past');
    });

    it('rejects a malformed departure on departureDate only', () => {
      const overrides = { departureDate: '2031-13-45' };
      expect(pathsFor(format, overrides)).toEqual(['departureDate']);
      expect(messages(overrides)).not.toContain(ordering);
    });

    it('leaves an empty date to the required rule', () => {
      // An empty field must show one message, not two.
      expect(pathsFor('Arrival date required', { arrivalDate: '' })).toEqual([
        'arrivalDate',
      ]);
      expect(messages({ arrivalDate: '' })).not.toContain(format);
      expect(
        pathsFor('Departure date required', { departureDate: '' }),
      ).toEqual(['departureDate']);
      expect(messages({ departureDate: '' })).not.toContain(format);
    });

    it('adds no format error for valid dates', () => {
      expect(messages({})).not.toContain(format);
    });
  });
});
