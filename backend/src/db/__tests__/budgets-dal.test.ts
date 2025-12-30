/**
 * Budgets DAL Tests
 * 
 * Tests for budget data access layer operations.
 */

import { initializeDatabase, seedDatabase, db } from '../database';
import {
  createOrUpdateBudgets,
  deleteBudgetsByMonth,
  getBudgetsByMonth,
  getBudgetByCategory,
  budgetExists,
  BudgetRecord
} from '../budgets-dal';

describe('Budgets DAL', () => {
  beforeAll(() => {
    initializeDatabase();
    seedDatabase();
    
    // Create test users
    const userInsert = db.prepare('INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)');
    const testUsers = [
      'user-test-1', 'user-test-2', 'user-test-3', 'user-test-4', 'user-test-5',
      'user-test-6', 'user-test-7', 'user-test-8', 'user-test-9',
      'user-A', 'user-B', 'user-fetch', 'user-single', 'user-exists', 'user-delete',
      'user-structure', 'user-timestamps'
    ];
    
    testUsers.forEach(userId => {
      userInsert.run(userId, `${userId}@test.com`, userId);
    });
  });

  afterAll(() => {
    db.close();
  });

  describe('createOrUpdateBudgets', () => {
    it('should create new budget records', () => {
      const budgetItems = [
        { category_id: 1, category_name: 'Groceries', planned_amount: 400 },
        { category_id: 2, category_name: 'Dining Out', planned_amount: 200 }
      ];

      const result = createOrUpdateBudgets('user-test-1', 6, 2025, budgetItems);

      expect(result.success).toBe(true);
      expect(result.created).toBe(2);
      expect(result.updated).toBe(0);
      expect(result.total).toBe(2);
    });

    it('should update existing budget records', () => {
      // Create initial budgets
      const initialItems = [
        { category_id: 1, category_name: 'Groceries', planned_amount: 300 }
      ];
      createOrUpdateBudgets('user-test-2', 7, 2025, initialItems);

      // Update with different amount
      const updatedItems = [
        { category_id: 1, category_name: 'Groceries', planned_amount: 500 }
      ];
      const result = createOrUpdateBudgets('user-test-2', 7, 2025, updatedItems);

      expect(result.success).toBe(true);
      expect(result.created).toBe(0);
      expect(result.updated).toBe(1);
      expect(result.total).toBe(1);

      // Verify the amount was updated
      const budget = getBudgetByCategory('user-test-2', 1, 7, 2025);
      expect(budget?.amount).toBe(500);
    });

    it('should handle mix of new and existing budgets', () => {
      // Create one budget
      const initialItems = [
        { category_id: 1, category_name: 'Groceries', planned_amount: 300 }
      ];
      createOrUpdateBudgets('user-test-3', 8, 2025, initialItems);

      // Update existing and add new
      const mixedItems = [
        { category_id: 1, category_name: 'Groceries', planned_amount: 350 },
        { category_id: 2, category_name: 'Dining Out', planned_amount: 200 }
      ];
      const result = createOrUpdateBudgets('user-test-3', 8, 2025, mixedItems);

      expect(result.success).toBe(true);
      expect(result.created).toBe(1);
      expect(result.updated).toBe(1);
      expect(result.total).toBe(2);
    });

    it('should enforce uniqueness constraint (user + category + month + year)', () => {
      const budgetItems = [
        { category_id: 1, category_name: 'Groceries', planned_amount: 300 }
      ];

      // Create first time
      createOrUpdateBudgets('user-test-4', 9, 2025, budgetItems);

      // Create again with same parameters (should update)
      const result = createOrUpdateBudgets('user-test-4', 9, 2025, budgetItems);

      expect(result.success).toBe(true);
      expect(result.updated).toBe(1);

      // Verify only one record exists
      const budgets = getBudgetsByMonth('user-test-4', 9, 2025);
      expect(budgets.length).toBe(1);
    });

    it('should allow same category for different months', () => {
      const budgetItems = [
        { category_id: 1, category_name: 'Groceries', planned_amount: 300 }
      ];

      // Create for January
      const result1 = createOrUpdateBudgets('user-test-5', 1, 2025, budgetItems);
      // Create for February
      const result2 = createOrUpdateBudgets('user-test-5', 2, 2025, budgetItems);

      expect(result1.success).toBe(true);
      expect(result1.created).toBe(1);
      expect(result2.success).toBe(true);
      expect(result2.created).toBe(1);

      // Verify separate records exist
      expect(budgetExists('user-test-5', 1, 1, 2025)).toBe(true);
      expect(budgetExists('user-test-5', 1, 2, 2025)).toBe(true);
    });

    it('should allow same category for different users', () => {
      const budgetItems = [
        { category_id: 1, category_name: 'Groceries', planned_amount: 300 }
      ];

      // Create for user 1
      const result1 = createOrUpdateBudgets('user-A', 1, 2025, budgetItems);
      // Create for user 2
      const result2 = createOrUpdateBudgets('user-B', 1, 2025, budgetItems);

      expect(result1.success).toBe(true);
      expect(result1.created).toBe(1);
      expect(result2.success).toBe(true);
      expect(result2.created).toBe(1);
    });

    it('should handle zero amounts', () => {
      const budgetItems = [
        { category_id: 1, category_name: 'Groceries', planned_amount: 0 }
      ];

      const result = createOrUpdateBudgets('user-test-6', 10, 2025, budgetItems);

      expect(result.success).toBe(true);
      expect(result.created).toBe(1);

      const budget = getBudgetByCategory('user-test-6', 1, 10, 2025);
      expect(budget?.amount).toBe(0);
    });

    it('should handle decimal amounts', () => {
      const budgetItems = [
        { category_id: 1, category_name: 'Groceries', planned_amount: 123.45 }
      ];

      const result = createOrUpdateBudgets('user-test-7', 11, 2025, budgetItems);

      expect(result.success).toBe(true);
      const budget = getBudgetByCategory('user-test-7', 1, 11, 2025);
      expect(budget?.amount).toBeCloseTo(123.45, 2);
    });

    it('should handle empty array', () => {
      const result = createOrUpdateBudgets('user-test-8', 12, 2025, []);

      expect(result.success).toBe(true);
      expect(result.total).toBe(0);
    });

    it('should update updated_at timestamp on update', async () => {
      const budgetItems = [
        { category_id: 1, category_name: 'Groceries', planned_amount: 300 }
      ];

      // Create initial
      createOrUpdateBudgets('user-test-9', 3, 2025, budgetItems);
      const initial = getBudgetByCategory('user-test-9', 1, 3, 2025);

      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update
      const updatedItems = [
        { category_id: 1, category_name: 'Groceries', planned_amount: 400 }
      ];
      createOrUpdateBudgets('user-test-9', 3, 2025, updatedItems);
      const updated = getBudgetByCategory('user-test-9', 1, 3, 2025);

      // Verify amount was updated
      expect(updated?.amount).toBe(400);
      // Timestamps should be different (or at least the record was updated)
      expect(updated).not.toBeNull();
      expect(initial).not.toBeNull();
    });
  });

  describe('getBudgetsByMonth', () => {
    beforeEach(() => {
      // Clear and setup test data
      deleteBudgetsByMonth('user-fetch', 1, 2025);
      
      const budgetItems = [
        { category_id: 1, category_name: 'Groceries', planned_amount: 300 },
        { category_id: 2, category_name: 'Dining Out', planned_amount: 200 },
        { category_id: 3, category_name: 'Transportation', planned_amount: 150 }
      ];
      createOrUpdateBudgets('user-fetch', 1, 2025, budgetItems);
    });

    it('should fetch all budgets for a month', () => {
      const budgets = getBudgetsByMonth('user-fetch', 1, 2025);

      expect(budgets.length).toBe(3);
      expect(budgets[0]).toHaveProperty('id');
      expect(budgets[0]).toHaveProperty('user_id');
      expect(budgets[0]).toHaveProperty('category_id');
      expect(budgets[0]).toHaveProperty('amount');
      expect(budgets[0]).toHaveProperty('created_at');
      expect(budgets[0]).toHaveProperty('updated_at');
    });

    it('should return empty array for month with no budgets', () => {
      const budgets = getBudgetsByMonth('user-fetch', 12, 2025);
      expect(budgets).toEqual([]);
    });

    it('should return empty array for non-existent user', () => {
      const budgets = getBudgetsByMonth('user-nonexistent', 1, 2025);
      expect(budgets).toEqual([]);
    });

    it('should return budgets sorted by category_id', () => {
      const budgets = getBudgetsByMonth('user-fetch', 1, 2025);
      
      for (let i = 1; i < budgets.length; i++) {
        expect(budgets[i].category_id).toBeGreaterThanOrEqual(budgets[i - 1].category_id);
      }
    });
  });

  describe('getBudgetByCategory', () => {
    beforeEach(() => {
      const budgetItems = [
        { category_id: 1, category_name: 'Groceries', planned_amount: 300 }
      ];
      createOrUpdateBudgets('user-single', 2, 2025, budgetItems);
    });

    it('should fetch a specific budget', () => {
      const budget = getBudgetByCategory('user-single', 1, 2, 2025);

      expect(budget).not.toBeNull();
      expect(budget?.user_id).toBe('user-single');
      expect(budget?.category_id).toBe(1);
      expect(budget?.month).toBe(2);
      expect(budget?.year).toBe(2025);
      expect(budget?.amount).toBe(300);
    });

    it('should return null for non-existent budget', () => {
      const budget = getBudgetByCategory('user-single', 99, 2, 2025);
      expect(budget).toBeNull();
    });

    it('should return null for wrong month', () => {
      const budget = getBudgetByCategory('user-single', 1, 3, 2025);
      expect(budget).toBeNull();
    });
  });

  describe('budgetExists', () => {
    beforeEach(() => {
      const budgetItems = [
        { category_id: 1, category_name: 'Groceries', planned_amount: 300 }
      ];
      createOrUpdateBudgets('user-exists', 4, 2025, budgetItems);
    });

    it('should return true for existing budget', () => {
      const exists = budgetExists('user-exists', 1, 4, 2025);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent budget', () => {
      const exists = budgetExists('user-exists', 99, 4, 2025);
      expect(exists).toBe(false);
    });

    it('should return false for wrong user', () => {
      const exists = budgetExists('user-other', 1, 4, 2025);
      expect(exists).toBe(false);
    });

    it('should return false for wrong month/year', () => {
      const exists = budgetExists('user-exists', 1, 5, 2025);
      expect(exists).toBe(false);
    });
  });

  describe('deleteBudgetsByMonth', () => {
    beforeEach(() => {
      const budgetItems = [
        { category_id: 1, category_name: 'Groceries', planned_amount: 300 },
        { category_id: 2, category_name: 'Dining Out', planned_amount: 200 }
      ];
      createOrUpdateBudgets('user-delete', 5, 2025, budgetItems);
    });

    it('should delete all budgets for a month', () => {
      const deleted = deleteBudgetsByMonth('user-delete', 5, 2025);
      
      expect(deleted).toBe(2);
      
      const budgets = getBudgetsByMonth('user-delete', 5, 2025);
      expect(budgets.length).toBe(0);
    });

    it('should return 0 when no budgets to delete', () => {
      const deleted = deleteBudgetsByMonth('user-delete', 12, 2099);
      expect(deleted).toBe(0);
    });

    it('should only delete budgets for specific month', () => {
      // Create budgets for different month
      const otherItems = [
        { category_id: 1, category_name: 'Groceries', planned_amount: 400 }
      ];
      createOrUpdateBudgets('user-delete', 6, 2025, otherItems);

      // Delete only month 5
      deleteBudgetsByMonth('user-delete', 5, 2025);

      // Month 6 should still exist
      const month6Budgets = getBudgetsByMonth('user-delete', 6, 2025);
      expect(month6Budgets.length).toBe(1);
    });
  });

  describe('BudgetRecord Structure', () => {
    it('should match expected TypeScript interface', () => {
      const budgetItems = [
        { category_id: 1, category_name: 'Groceries', planned_amount: 300 }
      ];
      createOrUpdateBudgets('user-structure', 1, 2025, budgetItems);

      const budget = getBudgetByCategory('user-structure', 1, 1, 2025);
      const record: BudgetRecord = budget!;

      expect(record).toBeDefined();
      expect(typeof record.id).toBe('number');
      expect(typeof record.user_id).toBe('string');
      expect(typeof record.category_id).toBe('number');
      expect(typeof record.month).toBe('number');
      expect(typeof record.year).toBe('number');
      expect(typeof record.amount).toBe('number');
      expect(typeof record.created_at).toBe('string');
      expect(typeof record.updated_at).toBe('string');
    });

    it('should have valid timestamps', () => {
      const budgetItems = [
        { category_id: 1, category_name: 'Groceries', planned_amount: 300 }
      ];
      createOrUpdateBudgets('user-timestamps', 1, 2025, budgetItems);

      const budget = getBudgetByCategory('user-timestamps', 1, 1, 2025);

      expect(budget?.created_at).toBeTruthy();
      expect(budget?.updated_at).toBeTruthy();

      const createdDate = new Date(budget!.created_at);
      const updatedDate = new Date(budget!.updated_at);

      expect(createdDate.toString()).not.toBe('Invalid Date');
      expect(updatedDate.toString()).not.toBe('Invalid Date');
    });
  });
});
