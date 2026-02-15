import { describe, expect, it } from 'vitest';
import { updateAt, updateNested } from './immutable-array';

describe('immutable-array utilities', () => {
  describe('updateAt', () => {
    it('should update item at specified index', () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = updateAt(items, 1, (item) => ({ ...item, id: 99 }));

      expect(result).toEqual([{ id: 1 }, { id: 99 }, { id: 3 }]);
      expect(result).not.toBe(items);
    });

    it('should not modify other items', () => {
      const items = [1, 2, 3];
      const result = updateAt(items, 0, () => 10);

      expect(result).toEqual([10, 2, 3]);
      expect(items).toEqual([1, 2, 3]);
    });

    it('should throw on out-of-bounds index', () => {
      expect(() => updateAt([], 0, () => 'x')).toThrow(RangeError);
      expect(() => updateAt([1, 2], -1, () => 0)).toThrow(RangeError);
      expect(() => updateAt([1, 2], 2, () => 0)).toThrow(RangeError);
    });
  });

  describe('updateNested', () => {
    interface Activity {
      name: string;
    }

    interface Destination {
      city: string;
      activities: Activity[];
    }

    it('should update nested array item', () => {
      const destinations: Destination[] = [
        { city: 'Paris', activities: [{ name: 'Louvre' }, { name: 'Eiffel' }] },
        { city: 'Rome', activities: [{ name: 'Colosseum' }] },
      ];

      const result = updateNested(
        destinations,
        0,
        'activities',
        1,
        (activity) => ({ ...activity, name: 'Eiffel Tower' }),
      );

      expect(result[0].activities[1].name).toBe('Eiffel Tower');
      expect(result[0].activities[0].name).toBe('Louvre');
      expect(result[1]).toBe(destinations[1]); // Unchanged reference
    });

    it('should not modify original nested structure', () => {
      const destinations: Destination[] = [
        { city: 'Paris', activities: [{ name: 'Louvre' }] },
      ];

      updateNested(destinations, 0, 'activities', 0, () => ({ name: 'New' }));

      expect(destinations[0].activities[0].name).toBe('Louvre');
    });
  });
});
