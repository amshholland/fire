/**
 * Transaction Types Tests (Frontend)
 * 
 * Validates the frontend type definitions match backend DTOs.
 */

import {
  TransactionItem,
  TransactionPageResponse,
  TransactionPageQueryParams
} from '../transaction.types';

describe('Transaction Types (Frontend)', () => {
  describe('TransactionItem', () => {
    it('should match backend DTO structure', () => {
      const transaction: TransactionItem = {
        transaction_id: 'txn-123',
        date: '2025-01-15',
        merchant_name: 'Whole Foods',
        amount: -142.53,
        app_category_id: 5,
        app_category_name: 'Groceries',
        plaid_category_primary: 'FOOD_AND_DRINK',
        plaid_category_detailed: 'Food and Drink, Groceries',
        account_name: 'Chase Freedom Checking'
      };

      // Verify all fields exist
      expect(transaction).toHaveProperty('transaction_id');
      expect(transaction).toHaveProperty('date');
      expect(transaction).toHaveProperty('merchant_name');
      expect(transaction).toHaveProperty('amount');
      expect(transaction).toHaveProperty('app_category_id');
      expect(transaction).toHaveProperty('app_category_name');
      expect(transaction).toHaveProperty('plaid_category_primary');
      expect(transaction).toHaveProperty('plaid_category_detailed');
      expect(transaction).toHaveProperty('account_name');
    });

    it('should allow null values for optional fields', () => {
      const uncategorized: TransactionItem = {
        transaction_id: 'txn-uncategorized',
        date: '2025-01-16',
        merchant_name: 'Unknown',
        amount: -25.00,
        app_category_id: null,
        app_category_name: null,
        plaid_category_primary: null,
        plaid_category_detailed: null,
        account_name: null
      };

      expect(uncategorized.app_category_id).toBeNull();
      expect(uncategorized.app_category_name).toBeNull();
    });

    it('should handle expense amounts (negative)', () => {
      const expense: TransactionItem = {
        transaction_id: 'txn-expense',
        date: '2025-01-15',
        merchant_name: 'Starbucks',
        amount: -5.75,
        app_category_id: 2,
        app_category_name: 'Dining Out',
        plaid_category_primary: 'FOOD_AND_DRINK',
        plaid_category_detailed: 'Food and Drink, Restaurants, Coffee Shop',
        account_name: 'Checking'
      };

      expect(expense.amount).toBeLessThan(0);
    });

    it('should handle income/refund amounts (positive)', () => {
      const refund: TransactionItem = {
        transaction_id: 'txn-refund',
        date: '2025-01-17',
        merchant_name: 'Amazon',
        amount: 49.99,
        app_category_id: 6,
        app_category_name: 'Shopping',
        plaid_category_primary: 'TRANSFER',
        plaid_category_detailed: 'Transfer, Credit',
        account_name: 'Credit Card'
      };

      expect(refund.amount).toBeGreaterThan(0);
    });

    it('should use string type for transaction_id', () => {
      const transaction: TransactionItem = {
        transaction_id: '550e8400-e29b-41d4-a716-446655440000',
        date: '2025-01-15',
        merchant_name: 'Test',
        amount: -10.00,
        app_category_id: 1,
        app_category_name: 'Test',
        plaid_category_primary: null,
        plaid_category_detailed: null,
        account_name: 'Test Account'
      };

      expect(typeof transaction.transaction_id).toBe('string');
    });

    it('should use ISO date format (YYYY-MM-DD)', () => {
      const transaction: TransactionItem = {
        transaction_id: 'txn-date-test',
        date: '2025-01-15',
        merchant_name: 'Test',
        amount: -10.00,
        app_category_id: 1,
        app_category_name: 'Test',
        plaid_category_primary: null,
        plaid_category_detailed: null,
        account_name: 'Test Account'
      };

      expect(transaction.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('TransactionPageResponse', () => {
    it('should structure API response correctly', () => {
      const response: TransactionPageResponse = {
        transactions: [
          {
            transaction_id: 'txn-1',
            date: '2025-01-15',
            merchant_name: 'Store A',
            amount: -50.00,
            app_category_id: 1,
            app_category_name: 'Groceries',
            plaid_category_primary: 'FOOD_AND_DRINK',
            plaid_category_detailed: 'Food and Drink, Groceries',
            account_name: 'Checking'
          }
        ],
        total_count: 100,
        page: 1,
        page_size: 50
      };

      expect(response.transactions).toBeInstanceOf(Array);
      expect(response.total_count).toBe(100);
      expect(response.page).toBe(1);
      expect(response.page_size).toBe(50);
    });

    it('should handle empty transaction list', () => {
      const emptyResponse: TransactionPageResponse = {
        transactions: [],
        total_count: 0,
        page: 1,
        page_size: 50
      };

      expect(emptyResponse.transactions).toHaveLength(0);
      expect(emptyResponse.total_count).toBe(0);
    });
  });

  describe('TransactionPageQueryParams', () => {
    it('should have required userId field', () => {
      const minimalParams: TransactionPageQueryParams = {
        userId: 'user-123'
      };

      expect(minimalParams.userId).toBeDefined();
    });

    it('should support all query parameters', () => {
      const params: TransactionPageQueryParams = {
        userId: 'user-123',
        page: 2,
        page_size: 25,
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        category_id: 5,
        account_id: 'account-456',
        search: 'coffee'
      };

      expect(params.userId).toBe('user-123');
      expect(params.page).toBe(2);
      expect(params.page_size).toBe(25);
      expect(params.start_date).toBe('2025-01-01');
      expect(params.end_date).toBe('2025-01-31');
      expect(params.category_id).toBe(5);
      expect(params.account_id).toBe('account-456');
      expect(params.search).toBe('coffee');
    });

    it('should make optional parameters truly optional', () => {
      const minimalParams: TransactionPageQueryParams = {
        userId: 'user-123'
      };

      expect(minimalParams.page).toBeUndefined();
      expect(minimalParams.page_size).toBeUndefined();
      expect(minimalParams.start_date).toBeUndefined();
      expect(minimalParams.end_date).toBeUndefined();
      expect(minimalParams.category_id).toBeUndefined();
      expect(minimalParams.account_id).toBeUndefined();
      expect(minimalParams.search).toBeUndefined();
    });
  });

  describe('Type Safety and Consistency', () => {
    it('should enforce correct types across all fields', () => {
      const transaction: TransactionItem = {
        transaction_id: 'txn-test',
        date: '2025-01-15',
        merchant_name: 'Test Merchant',
        amount: -99.99,
        app_category_id: 10,
        app_category_name: 'Test Category',
        plaid_category_primary: 'TEST_PRIMARY',
        plaid_category_detailed: 'Test, Detailed',
        account_name: 'Test Account'
      };

      expect(typeof transaction.transaction_id).toBe('string');
      expect(typeof transaction.date).toBe('string');
      expect(typeof transaction.merchant_name).toBe('string');
      expect(typeof transaction.amount).toBe('number');
      expect(typeof transaction.app_category_id).toBe('number');
      expect(typeof transaction.app_category_name).toBe('string');
      expect(typeof transaction.plaid_category_primary).toBe('string');
      expect(typeof transaction.plaid_category_detailed).toBe('string');
      expect(typeof transaction.account_name).toBe('string');
    });

    it('should distinguish between user categories and Plaid categories', () => {
      // Scenario: User overrode Plaid's suggestion
      const transaction: TransactionItem = {
        transaction_id: 'txn-override',
        date: '2025-01-15',
        merchant_name: 'Costco',
        amount: -85.50,
        app_category_id: 1, // User chose "Groceries"
        app_category_name: 'Groceries',
        plaid_category_primary: 'SHOPS', // Plaid suggested "Shops"
        plaid_category_detailed: 'Shops, Warehouses and Wholesale Stores',
        account_name: 'Checking'
      };

      // User's category should be authoritative
      expect(transaction.app_category_name).toBe('Groceries');
      // Plaid's category should be preserved as metadata
      expect(transaction.plaid_category_primary).toBe('SHOPS');
    });
  });
});
