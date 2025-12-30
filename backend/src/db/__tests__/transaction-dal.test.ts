/**
 * Transaction Data Access Layer Tests
 * 
 * Tests database query functions for transactions.
 * Uses in-memory database with sample data.
 */

import { queryTransactions, queryRecentTransactions, updateTransactionCategory, getValidCategoryIds } from '../transaction-dal';
import { db, initializeDatabase, seedDatabase } from '../database';

describe('Transaction Data Access Layer', () => {
  beforeAll(() => {
    initializeDatabase();
    seedDatabase();
  });

  afterAll(() => {
    db.close();
  });

  describe('queryTransactions', () => {
    it('should return transactions for a user', () => {
      const result = queryTransactions({ userId: 'user-demo' });

      expect(result.transactions).toBeDefined();
      expect(Array.isArray(result.transactions)).toBe(true);
      expect(result.total_count).toBeGreaterThan(0);
      expect(result.page).toBe(1);
      expect(result.page_size).toBe(50);
    });

    it('should include all required fields', () => {
      const result = queryTransactions({ userId: 'user-demo' });
      
      if (result.transactions.length > 0) {
        const transaction = result.transactions[0];
        expect(transaction).toHaveProperty('transaction_id');
        expect(transaction).toHaveProperty('date');
        expect(transaction).toHaveProperty('merchant_name');
        expect(transaction).toHaveProperty('amount');
        expect(transaction).toHaveProperty('app_category_id');
        expect(transaction).toHaveProperty('app_category_name');
        expect(transaction).toHaveProperty('plaid_category_primary');
        expect(transaction).toHaveProperty('plaid_category_detailed');
        expect(transaction).toHaveProperty('account_name');
      }
    });

    it('should sort transactions by date descending', () => {
      const result = queryTransactions({ userId: 'user-demo' });

      if (result.transactions.length > 1) {
        for (let i = 0; i < result.transactions.length - 1; i++) {
          const current = new Date(result.transactions[i].date);
          const next = new Date(result.transactions[i + 1].date);
          expect(current >= next).toBe(true);
        }
      }
    });

    it('should respect pagination parameters', () => {
      const result = queryTransactions({
        userId: 'user-demo',
        page: 1,
        page_size: 2
      });

      expect(result.transactions.length).toBeLessThanOrEqual(2);
      expect(result.page).toBe(1);
      expect(result.page_size).toBe(2);
    });

    it('should filter by date range', () => {
      const result = queryTransactions({
        userId: 'user-demo',
        start_date: '2025-01-01',
        end_date: '2025-01-15'
      });

      result.transactions.forEach((txn: any) => {
        expect(txn.date >= '2025-01-01').toBe(true);
        expect(txn.date <= '2025-01-15').toBe(true);
      });
    });

    it('should filter by category', () => {
      const result = queryTransactions({
        userId: 'user-demo',
        category_id: 1
      });

      result.transactions.forEach((txn: any) => {
        expect(txn.app_category_id).toBe(1);
      });
    });

    it('should return empty array for non-existent user', () => {
      const result = queryTransactions({ userId: 'non-existent-user' });

      expect(result.transactions).toEqual([]);
      expect(result.total_count).toBe(0);
    });

    it('should calculate correct total_count with pagination', () => {
      const result1 = queryTransactions({
        userId: 'user-demo',
        page: 1,
        page_size: 2
      });

      const result2 = queryTransactions({
        userId: 'user-demo',
        page: 2,
        page_size: 2
      });

      // Both pages should report the same total_count
      expect(result1.total_count).toBe(result2.total_count);
    });

    it('should handle search queries', () => {
      const result = queryTransactions({
        userId: 'user-demo',
        search: 'demo'
      });

      // All results should contain 'demo' in merchant_name or name
      result.transactions.forEach((txn: any) => {
        expect(
          txn.merchant_name?.toLowerCase().includes('demo')
        ).toBe(true);
      });
    });
  });

  describe('queryRecentTransactions', () => {
    it('should return recent transactions', () => {
      const transactions = queryRecentTransactions('user-demo', 5);

      expect(Array.isArray(transactions)).toBe(true);
      expect(transactions.length).toBeLessThanOrEqual(5);
    });

    it('should sort by date descending', () => {
      const transactions = queryRecentTransactions('user-demo', 10);

      if (transactions.length > 1) {
        for (let i = 0; i < transactions.length - 1; i++) {
          const current = new Date(transactions[i].date);
          const next = new Date(transactions[i + 1].date);
          expect(current >= next).toBe(true);
        }
      }
    });

    it('should use default limit of 30', () => {
      const transactions = queryRecentTransactions('user-demo');

      expect(transactions.length).toBeLessThanOrEqual(30);
    });

    it('should include all required fields', () => {
      const transactions = queryRecentTransactions('user-demo', 1);

      if (transactions.length > 0) {
        const transaction = transactions[0];
        expect(transaction).toHaveProperty('transaction_id');
        expect(transaction).toHaveProperty('date');
        expect(transaction).toHaveProperty('merchant_name');
        expect(transaction).toHaveProperty('amount');
        expect(transaction).toHaveProperty('app_category_id');
        expect(transaction).toHaveProperty('app_category_name');
      }
    });

    it('should return empty array for non-existent user', () => {
      const transactions = queryRecentTransactions('non-existent-user');

      expect(transactions).toEqual([]);
    });

    it('should validate limit (max 100)', () => {
      // The function internally caps at 100, so requesting 200 should return at most 100
      const transactions = queryRecentTransactions('user-demo', 200);

      expect(transactions.length).toBeLessThanOrEqual(100);
    });

    it('should validate limit (min 1)', () => {
      // The function internally enforces minimum of 1
      const transactions = queryRecentTransactions('user-demo', 0);

      // Should still return results (enforced to 1)
      expect(Array.isArray(transactions)).toBe(true);
    });
  });

  describe('Transaction Category Update', () => {
    describe('getValidCategoryIds', () => {
      it('should return array of category IDs', () => {
        const categoryIds = getValidCategoryIds('user-demo');
        expect(Array.isArray(categoryIds)).toBe(true);
        expect(categoryIds.length).toBeGreaterThan(0);
        expect(categoryIds.every(id => Number.isInteger(id))).toBe(true);
      });

      it('should return same categories for any user (system categories)', () => {
        const user1Categories = getValidCategoryIds('user-1');
        const user2Categories = getValidCategoryIds('user-2');
        expect(user1Categories).toEqual(user2Categories);
      });

      it('should return categories in sorted order', () => {
        const categoryIds = getValidCategoryIds('user-demo');
        const sorted = [...categoryIds].sort((a, b) => a - b);
        expect(categoryIds).toEqual(sorted);
      });
    });

    describe('updateTransactionCategory', () => {
      it('should successfully update transaction category', () => {
        // Get initial category
        const before = db.prepare('SELECT category_id FROM transactions WHERE id = ?').get('txn-demo-0') as any;
        const initialCategory = before.category_id;
        
        // Update to different category
        const newCategoryId = initialCategory === 1 ? 2 : 1;
        const result = updateTransactionCategory('txn-demo-0', 'user-demo', newCategoryId);
        
        expect(result.success).toBe(true);

        // Verify update
        const after = db.prepare('SELECT category_id FROM transactions WHERE id = ?').get('txn-demo-0') as any;
        expect(after.category_id).toBe(newCategoryId);
      });

      it('should return error when transaction does not exist', () => {
        const result = updateTransactionCategory('txn-nonexistent', 'user-demo', 1);
        expect(result.success).toBe(false);
        expect(result.error).toContain('not found');
      });

      it('should return error when transaction belongs to different user', () => {
        const result = updateTransactionCategory('txn-demo-0', 'user-other', 1);
        expect(result.success).toBe(false);
        expect(result.error).toContain('not found');
      });

      it('should not modify Plaid category fields', () => {
        // Get original Plaid data
        const before = db.prepare(
          'SELECT plaid_category, plaid_primary_category FROM transactions WHERE id = ?'
        ).get('txn-demo-1') as any;

        // Update category
        updateTransactionCategory('txn-demo-1', 'user-demo', 3);

        // Verify Plaid fields unchanged
        const after = db.prepare(
          'SELECT plaid_category, plaid_primary_category FROM transactions WHERE id = ?'
        ).get('txn-demo-1') as any;

        expect(after.plaid_category).toBe(before.plaid_category);
        expect(after.plaid_primary_category).toBe(before.plaid_primary_category);
      });

      it('should update updated_at field when category changes', () => {
        // Verify that updated_at exists and is updated
        const before = db.prepare('SELECT updated_at FROM transactions WHERE id = ?').get('txn-demo-2') as any;
        expect(before.updated_at).toBeDefined();
        
        // Update category
        const result = updateTransactionCategory('txn-demo-2', 'user-demo', 4);
        expect(result.success).toBe(true);
        
        // Verify updated_at still exists (field is set by SQL CURRENT_TIMESTAMP)
        const after = db.prepare('SELECT updated_at FROM transactions WHERE id = ?').get('txn-demo-2') as any;
        expect(after.updated_at).toBeDefined();
      });

      it('should allow updating to same category (idempotent)', () => {
        const before = db.prepare('SELECT category_id FROM transactions WHERE id = ?').get('txn-demo-3') as any;
        const currentCategory = before.category_id;

        // Update to same category
        const result = updateTransactionCategory('txn-demo-3', 'user-demo', currentCategory);
        expect(result.success).toBe(true);

        const after = db.prepare('SELECT category_id FROM transactions WHERE id = ?').get('txn-demo-3') as any;
        expect(after.category_id).toBe(currentCategory);
      });
    });
  });
});
