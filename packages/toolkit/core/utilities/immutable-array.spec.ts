import { describe, expect, it } from 'vitest';
import {
  append,
  insertAt,
  moveItem,
  prepend,
  removeAt,
  updateAt,
  updateNested,
} from './immutable-array';

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

    it('should handle empty array', () => {
      const result = updateAt([], 0, () => 'x');
      expect(result).toEqual([]);
    });
  });

  describe('removeAt', () => {
    it('should remove item at specified index', () => {
      const items = ['a', 'b', 'c'];
      const result = removeAt(items, 1);

      expect(result).toEqual(['a', 'c']);
      expect(result).not.toBe(items);
    });

    it('should handle removing first item', () => {
      const items = [1, 2, 3];
      expect(removeAt(items, 0)).toEqual([2, 3]);
    });

    it('should handle removing last item', () => {
      const items = [1, 2, 3];
      expect(removeAt(items, 2)).toEqual([1, 2]);
    });

    it('should not modify original array', () => {
      const items = ['a', 'b'];
      removeAt(items, 0);
      expect(items).toEqual(['a', 'b']);
    });
  });

  describe('insertAt', () => {
    it('should insert item at specified index', () => {
      const items = ['a', 'c'];
      const result = insertAt(items, 1, 'b');

      expect(result).toEqual(['a', 'b', 'c']);
      expect(result).not.toBe(items);
    });

    it('should handle inserting at start', () => {
      const items = [2, 3];
      expect(insertAt(items, 0, 1)).toEqual([1, 2, 3]);
    });

    it('should handle inserting at end', () => {
      const items = [1, 2];
      expect(insertAt(items, 2, 3)).toEqual([1, 2, 3]);
    });

    it('should not modify original array', () => {
      const items = ['a', 'b'];
      insertAt(items, 1, 'x');
      expect(items).toEqual(['a', 'b']);
    });
  });

  describe('append', () => {
    it('should add item to end of array', () => {
      const items = ['a', 'b'];
      const result = append(items, 'c');

      expect(result).toEqual(['a', 'b', 'c']);
      expect(result).not.toBe(items);
    });

    it('should work with empty array', () => {
      expect(append([], 'x')).toEqual(['x']);
    });
  });

  describe('prepend', () => {
    it('should add item to start of array', () => {
      const items = ['b', 'c'];
      const result = prepend(items, 'a');

      expect(result).toEqual(['a', 'b', 'c']);
      expect(result).not.toBe(items);
    });

    it('should work with empty array', () => {
      expect(prepend([], 'x')).toEqual(['x']);
    });
  });

  describe('moveItem', () => {
    it('should move item from one index to another', () => {
      const items = ['a', 'b', 'c', 'd'];
      const result = moveItem(items, 0, 2);

      expect(result).toEqual(['b', 'c', 'a', 'd']);
      expect(result).not.toBe(items);
    });

    it('should handle moving to earlier index', () => {
      const items = ['a', 'b', 'c'];
      expect(moveItem(items, 2, 0)).toEqual(['c', 'a', 'b']);
    });

    it('should return copy when from === to', () => {
      const items = ['a', 'b', 'c'];
      const result = moveItem(items, 1, 1);

      expect(result).toEqual(['a', 'b', 'c']);
      expect(result).not.toBe(items);
    });

    it('should not modify original array', () => {
      const items = ['a', 'b', 'c'];
      moveItem(items, 0, 2);
      expect(items).toEqual(['a', 'b', 'c']);
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
