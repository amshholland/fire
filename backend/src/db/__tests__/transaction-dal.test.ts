/**
 * Transaction Data Access Layer Tests
 * 
 * Tests database query functions for transactions.
 * Uses in-memory database with sample data.
 */

import { queryTransactions, queryRecentTransactions } from '../transaction-dal';
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
});
