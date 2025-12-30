/**
 * Transaction Category Service Tests
 * 
 * Tests pure validation logic for category updates.
 */

import { validateCategoryUpdate } from '../transaction-category.service';

describe('Transaction Category Service', () => {
  describe('validateCategoryUpdate', () => {
    const validCategories = [1, 2, 3, 5, 10];

    it('should accept valid category ID', () => {
      const result = validateCategoryUpdate(5, validCategories);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject category ID not in valid list', () => {
      const result = validateCategoryUpdate(99, validCategories);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('does not exist');
    });

    it('should reject negative category ID', () => {
      const result = validateCategoryUpdate(-1, validCategories);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('positive integer');
    });

    it('should reject zero category ID', () => {
      const result = validateCategoryUpdate(0, validCategories);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('positive integer');
    });

    it('should reject non-integer category ID', () => {
      const result = validateCategoryUpdate(5.5, validCategories);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('positive integer');
    });

    it('should handle empty valid categories list', () => {
      const result = validateCategoryUpdate(1, []);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('does not exist');
    });

    it('should accept first category in list', () => {
      const result = validateCategoryUpdate(1, validCategories);
      expect(result.valid).toBe(true);
    });

    it('should accept last category in list', () => {
      const result = validateCategoryUpdate(10, validCategories);
      expect(result.valid).toBe(true);
    });
  });
});
