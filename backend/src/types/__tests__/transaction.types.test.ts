/**
 * Transaction Types Tests
 * 
 * Validates the structure and documentation of transaction DTOs.
 * These are compile-time type checks and documentation tests only.
 */

import {
  TransactionItemDTO,
  TransactionPageResponseDTO,
  TransactionPageQueryParams
} from '../transaction.types';

describe('Transaction Types', () => {
  describe('TransactionItemDTO', () => {
    it('should have all required fields', () => {
      const validTransaction: TransactionItemDTO = {
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

      expect(validTransaction.transaction_id).toBeDefined();
      expect(validTransaction.date).toBeDefined();
      expect(validTransaction.merchant_name).toBeDefined();
      expect(validTransaction.amount).toBeDefined();
      expect(validTransaction.app_category_id).toBeDefined();
      expect(validTransaction.app_category_name).toBeDefined();
      expect(validTransaction.plaid_category_primary).toBeDefined();
      expect(validTransaction.plaid_category_detailed).toBeDefined();
      expect(validTransaction.account_name).toBeDefined();
    });

    it('should allow null for nullable fields', () => {
      const uncategorizedTransaction: TransactionItemDTO = {
        transaction_id: 'txn-456',
        date: '2025-01-16',
        merchant_name: 'Unknown Merchant',
        amount: -25.00,
        app_category_id: null,
        app_category_name: null,
        plaid_category_primary: null,
        plaid_category_detailed: null,
        account_name: null
      };

      expect(uncategorizedTransaction.app_category_id).toBeNull();
      expect(uncategorizedTransaction.app_category_name).toBeNull();
      expect(uncategorizedTransaction.plaid_category_primary).toBeNull();
      expect(uncategorizedTransaction.plaid_category_detailed).toBeNull();
      expect(uncategorizedTransaction.account_name).toBeNull();
    });

    it('should handle expense amounts (negative)', () => {
      const expense: TransactionItemDTO = {
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
      const refund: TransactionItemDTO = {
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
      const transaction: TransactionItemDTO = {
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
      const transaction: TransactionItemDTO = {
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

    it('should distinguish between app_category and plaid_category fields', () => {
      // Scenario: User overrode Plaid's suggestion
      const overriddenTransaction: TransactionItemDTO = {
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

      // User's category is authoritative
      expect(overriddenTransaction.app_category_name).toBe('Groceries');
      // Plaid's category is preserved as metadata
      expect(overriddenTransaction.plaid_category_primary).toBe('SHOPS');
    });
  });

  describe('TransactionPageResponseDTO', () => {
    it('should structure paginated response correctly', () => {
      const response: TransactionPageResponseDTO = {
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
          },
          {
            transaction_id: 'txn-2',
            date: '2025-01-14',
            merchant_name: 'Store B',
            amount: -30.00,
            app_category_id: 2,
            app_category_name: 'Dining Out',
            plaid_category_primary: 'FOOD_AND_DRINK',
            plaid_category_detailed: 'Food and Drink, Restaurants',
            account_name: 'Credit Card'
          }
        ],
        total_count: 150,
        page: 1,
        page_size: 50
      };

      expect(response.transactions).toHaveLength(2);
      expect(response.total_count).toBe(150);
      expect(response.page).toBe(1);
      expect(response.page_size).toBe(50);
    });

    it('should handle empty transaction list', () => {
      const emptyResponse: TransactionPageResponseDTO = {
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

    it('should support optional pagination parameters', () => {
      const paginatedParams: TransactionPageQueryParams = {
        userId: 'user-123',
        page: 2,
        page_size: 25
      };

      expect(paginatedParams.page).toBe(2);
      expect(paginatedParams.page_size).toBe(25);
    });

    it('should support optional date range filters', () => {
      const dateFilterParams: TransactionPageQueryParams = {
        userId: 'user-123',
        start_date: '2025-01-01',
        end_date: '2025-01-31'
      };

      expect(dateFilterParams.start_date).toBe('2025-01-01');
      expect(dateFilterParams.end_date).toBe('2025-01-31');
    });

    it('should support optional category filter', () => {
      const categoryFilterParams: TransactionPageQueryParams = {
        userId: 'user-123',
        category_id: 5
      };

      expect(categoryFilterParams.category_id).toBe(5);
    });

    it('should support optional account filter', () => {
      const accountFilterParams: TransactionPageQueryParams = {
        userId: 'user-123',
        account_id: 'account-456'
      };

      expect(accountFilterParams.account_id).toBe('account-456');
    });

    it('should support optional search query', () => {
      const searchParams: TransactionPageQueryParams = {
        userId: 'user-123',
        search: 'starbucks'
      };

      expect(searchParams.search).toBe('starbucks');
    });

    it('should support combination of all filters', () => {
      const fullParams: TransactionPageQueryParams = {
        userId: 'user-123',
        page: 1,
        page_size: 50,
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        category_id: 2,
        account_id: 'account-checking',
        search: 'coffee'
      };

      expect(fullParams).toMatchObject({
        userId: 'user-123',
        page: 1,
        page_size: 50,
        start_date: '2025-01-01',
        end_date: '2025-01-31',
        category_id: 2,
        account_id: 'account-checking',
        search: 'coffee'
      });
    });
  });

  describe('Type Safety', () => {
    it('should enforce number type for app_category_id', () => {
      const transaction: TransactionItemDTO = {
        transaction_id: 'txn-type-test',
        date: '2025-01-15',
        merchant_name: 'Test',
        amount: -10.00,
        app_category_id: 5, // Must be number
        app_category_name: 'Test',
        plaid_category_primary: null,
        plaid_category_detailed: null,
        account_name: 'Test'
      };

      expect(typeof transaction.app_category_id).toBe('number');
    });

    it('should enforce string type for date', () => {
      const transaction: TransactionItemDTO = {
        transaction_id: 'txn-date-type',
        date: '2025-01-15', // Must be string
        merchant_name: 'Test',
        amount: -10.00,
        app_category_id: 1,
        app_category_name: 'Test',
        plaid_category_primary: null,
        plaid_category_detailed: null,
        account_name: 'Test'
      };

      expect(typeof transaction.date).toBe('string');
    });

    it('should enforce number type for amount', () => {
      const transaction: TransactionItemDTO = {
        transaction_id: 'txn-amount-type',
        date: '2025-01-15',
        merchant_name: 'Test',
        amount: -142.53, // Must be number
        app_category_id: 1,
        app_category_name: 'Test',
        plaid_category_primary: null,
        plaid_category_detailed: null,
        account_name: 'Test'
      };

      expect(typeof transaction.amount).toBe('number');
    });
  });
});
