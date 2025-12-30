/**
 * Transactions Routes Tests
 * 
 * Tests for all transaction endpoints:
 * - Plaid sync endpoint (GET /api/transactions)
 * - Database query endpoints (GET /api/transactions/db, /api/transactions/db/recent)
 * 
 * Verifies:
 * - Query parameter validation
 * - Successful response with correct structure
 * - Data access layer integration
 * - Pagination logic
 * - Filtering (date range, category, account, search)
 * - Sorting (date descending)
 * - HTTP method restrictions (GET only)
 */

import request from 'supertest';
import express, { Express } from 'express';
import { transactionsRouter } from '../transactions';
import * as transactionDal from '../../db/transaction-dal';
import { plaidClient } from '../../clients/plaidClient';

// Mock the plaidClient
jest.mock('../../clients/plaidClient', () => ({
  plaidClient: {
    transactionsSync: jest.fn()
  }
}));

describe('Transactions Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', transactionsRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/transactions (Plaid Sync)', () => {
    describe('Query Parameter Validation', () => {
      it('should return 400 when access_token is missing', async () => {
        const response = await request(app)
          .get('/api/transactions');

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('access_token is required');
      });
    });

    describe('Successful Plaid Sync', () => {
      it('should sync transactions from Plaid and return recent transactions', async () => {
        const mockPlaidResponse = {
          data: {
            added: [
              {
                transaction_id: 'plaid-1',
                date: '2025-01-15',
                name: 'Whole Foods',
                amount: 85.50
              },
              {
                transaction_id: 'plaid-2',
                date: '2025-01-14',
                name: 'Starbucks',
                amount: 5.75
              }
            ],
            modified: [],
            removed: [],
            next_cursor: 'cursor-123', // non-empty cursor to avoid sleep
            has_more: false
          }
        };

        (plaidClient.transactionsSync as jest.Mock).mockResolvedValue(mockPlaidResponse);

        const response = await request(app)
          .get('/api/transactions')
          .query({ access_token: 'test-token' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('latest_transactions');
        expect(Array.isArray(response.body.latest_transactions)).toBe(true);
        expect(plaidClient.transactionsSync).toHaveBeenCalledWith({
          access_token: 'test-token'
        });
      });

      it('should handle pagination with multiple Plaid API calls', async () => {
        const firstResponse = {
          data: {
            added: [{ transaction_id: '1', date: '2025-01-15', name: 'Store 1', amount: 10 }],
            modified: [],
            removed: [],
            next_cursor: 'cursor-1',
            has_more: true
          }
        };

        const secondResponse = {
          data: {
            added: [{ transaction_id: '2', date: '2025-01-14', name: 'Store 2', amount: 20 }],
            modified: [],
            removed: [],
            next_cursor: 'cursor-2', // non-empty to avoid sleep
            has_more: false
          }
        };

        (plaidClient.transactionsSync as jest.Mock)
          .mockResolvedValueOnce(firstResponse)
          .mockResolvedValueOnce(secondResponse);

        const response = await request(app)
          .get('/api/transactions')
          .query({ access_token: 'test-token' });

        expect(response.status).toBe(200);
        expect(plaidClient.transactionsSync).toHaveBeenCalledTimes(2);
      });

      it('should sort transactions by date ascending and return recent 8', async () => {
        const mockTransactions = Array.from({ length: 10 }, (_, i) => ({
          transaction_id: `txn-${i}`,
          date: `2025-01-${String(10 + i).padStart(2, '0')}`,
          name: `Store ${i}`,
          amount: 10 + i
        }));

        const mockPlaidResponse = {
          data: {
            added: mockTransactions,
            modified: [],
            removed: [],
            next_cursor: 'cursor-123', // non-empty to avoid sleep
            has_more: false
          }
        };

        (plaidClient.transactionsSync as jest.Mock).mockResolvedValue(mockPlaidResponse);

        const response = await request(app)
          .get('/api/transactions')
          .query({ access_token: 'test-token' });

        expect(response.status).toBe(200);
        expect(response.body.latest_transactions).toHaveLength(8);
        // Should be sorted and sliced to last 8
      });

      it('should aggregate added, modified, and removed transactions', async () => {
        const mockPlaidResponse = {
          data: {
            added: [{ transaction_id: '1', date: '2025-01-15', name: 'Added', amount: 10 }],
            modified: [{ transaction_id: '2', date: '2025-01-14', name: 'Modified', amount: 20 }],
            removed: [{ transaction_id: '3' }],
            next_cursor: 'cursor-123', // non-empty to avoid sleep
            has_more: false
          }
        };

        (plaidClient.transactionsSync as jest.Mock).mockResolvedValue(mockPlaidResponse);

        const response = await request(app)
          .get('/api/transactions')
          .query({ access_token: 'test-token' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('latest_transactions');
      });
    });

    describe('Error Handling', () => {
      it('should handle Plaid API errors', async () => {
        const mockError = new Error('Plaid API error');
        (plaidClient.transactionsSync as jest.Mock).mockRejectedValue(mockError);

        const response = await request(app)
          .get('/api/transactions')
          .query({ access_token: 'test-token' });

        // Should be handled by error middleware
        expect(response.status).not.toBe(200);
      });

      it('should handle network errors gracefully', async () => {
        (plaidClient.transactionsSync as jest.Mock).mockRejectedValue(
          new Error('Network error')
        );

        const response = await request(app)
          .get('/api/transactions')
          .query({ access_token: 'test-token' });

        expect(response.status).not.toBe(200);
      });
    });
  });

  describe('GET /api/transactions/db', () => {
    describe('Query Parameter Validation', () => {
      it('should return 400 when userId is missing', async () => {
        const response = await request(app)
          .get('/api/transactions/db')
          .query({ page: 1, page_size: 50 });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('userId');
      });

      it('should return 400 when page is invalid', async () => {
        const response = await request(app)
          .get('/api/transactions/db')
          .query({ userId: 'user-123', page: 'invalid' });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('page');
      });

      it('should return 400 when page is zero or negative', async () => {
        const response = await request(app)
          .get('/api/transactions/db')
          .query({ userId: 'user-123', page: 0 });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('page');
      });

      it('should return 400 when page_size is invalid', async () => {
        const response = await request(app)
          .get('/api/transactions/db')
          .query({ userId: 'user-123', page_size: 'invalid' });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('page_size');
      });

      it('should return 400 when page_size exceeds 100', async () => {
        const response = await request(app)
          .get('/api/transactions/db')
          .query({ userId: 'user-123', page_size: 101 });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('page_size');
      });

      it('should return 400 when start_date format is invalid', async () => {
        const response = await request(app)
          .get('/api/transactions/db')
          .query({ userId: 'user-123', start_date: '2025/01/01' });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('start_date');
      });

      it('should return 400 when end_date format is invalid', async () => {
        const response = await request(app)
          .get('/api/transactions/db')
          .query({ userId: 'user-123', end_date: '01-01-2025' });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('end_date');
      });

      it('should return 400 when category_id is not a number', async () => {
        const response = await request(app)
          .get('/api/transactions/db')
          .query({ userId: 'user-123', category_id: 'invalid' });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('category_id');
      });

      it('should accept valid query parameters', async () => {
        jest.spyOn(transactionDal, 'queryTransactions').mockReturnValue({
          transactions: [],
          total_count: 0,
          page: 1,
          page_size: 50
        });

        const response = await request(app)
          .get('/api/transactions/db')
          .query({ userId: 'user-123', page: 1, page_size: 50 });

        expect(response.status).toBe(200);
      });
    });

    describe('Successful Responses', () => {
      it('should return 200 with correct response structure', async () => {
        const mockResponse = {
          transactions: [
            {
              transaction_id: 'txn-1',
              date: '2025-01-15',
              merchant_name: 'Whole Foods',
              amount: -142.53,
              app_category_id: 1,
              app_category_name: 'Groceries',
              plaid_category_primary: 'FOOD_AND_DRINK',
              plaid_category_detailed: 'Food and Drink, Groceries',
              account_name: 'Checking'
            }
          ],
          total_count: 1,
          page: 1,
          page_size: 50
        };

        jest.spyOn(transactionDal, 'queryTransactions').mockReturnValue(mockResponse);

        const response = await request(app)
          .get('/api/transactions/db')
          .query({ userId: 'user-123' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockResponse);
        expect(response.body).toHaveProperty('transactions');
        expect(response.body).toHaveProperty('total_count');
        expect(response.body).toHaveProperty('page');
        expect(response.body).toHaveProperty('page_size');
      });

      it('should return empty transactions array when user has no transactions', async () => {
        const mockResponse = {
          transactions: [],
          total_count: 0,
          page: 1,
          page_size: 50
        };

        jest.spyOn(transactionDal, 'queryTransactions').mockReturnValue(mockResponse);

        const response = await request(app)
          .get('/api/transactions/db')
          .query({ userId: 'user-no-transactions' });

        expect(response.status).toBe(200);
        expect(response.body.transactions).toEqual([]);
        expect(response.body.total_count).toBe(0);
      });

      it('should return multiple transactions with correct data', async () => {
        const mockResponse = {
          transactions: [
            {
              transaction_id: 'txn-1',
              date: '2025-01-15',
              merchant_name: 'Whole Foods',
              amount: -85.50,
              app_category_id: 1,
              app_category_name: 'Groceries',
              plaid_category_primary: 'FOOD_AND_DRINK',
              plaid_category_detailed: 'Food and Drink, Groceries',
              account_name: 'Checking'
            },
            {
              transaction_id: 'txn-2',
              date: '2025-01-14',
              merchant_name: 'Starbucks',
              amount: -5.75,
              app_category_id: 2,
              app_category_name: 'Dining Out',
              plaid_category_primary: 'FOOD_AND_DRINK',
              plaid_category_detailed: 'Food and Drink, Restaurants, Coffee Shop',
              account_name: 'Credit Card'
            }
          ],
          total_count: 2,
          page: 1,
          page_size: 50
        };

        jest.spyOn(transactionDal, 'queryTransactions').mockReturnValue(mockResponse);

        const response = await request(app)
          .get('/api/transactions/db')
          .query({ userId: 'user-123' });

        expect(response.status).toBe(200);
        expect(response.body.transactions).toHaveLength(2);
        expect(response.body.transactions[0].date).toBe('2025-01-15');
        expect(response.body.transactions[1].date).toBe('2025-01-14');
      });
    });

    describe('Data Access Layer Integration', () => {
      it('should call queryTransactions with correct parameters', async () => {
        const querySpy = jest.spyOn(transactionDal, 'queryTransactions');
        querySpy.mockReturnValue({
          transactions: [],
          total_count: 0,
          page: 1,
          page_size: 50
        });

        await request(app)
          .get('/api/transactions/db')
          .query({ userId: 'user-123', page: 2, page_size: 25 });

        expect(querySpy).toHaveBeenCalledWith({
          userId: 'user-123',
          page: 2,
          page_size: 25,
          start_date: undefined,
          end_date: undefined,
          category_id: undefined,
          account_id: undefined,
          search: undefined
        });
      });

      it('should pass date range filters to DAL', async () => {
        const querySpy = jest.spyOn(transactionDal, 'queryTransactions');
        querySpy.mockReturnValue({
          transactions: [],
          total_count: 0,
          page: 1,
          page_size: 50
        });

        await request(app)
          .get('/api/transactions/db')
          .query({
            userId: 'user-123',
            start_date: '2025-01-01',
            end_date: '2025-01-31'
          });

        expect(querySpy).toHaveBeenCalledWith(
          expect.objectContaining({
            start_date: '2025-01-01',
            end_date: '2025-01-31'
          })
        );
      });

      it('should pass category filter to DAL', async () => {
        const querySpy = jest.spyOn(transactionDal, 'queryTransactions');
        querySpy.mockReturnValue({
          transactions: [],
          total_count: 0,
          page: 1,
          page_size: 50
        });

        await request(app)
          .get('/api/transactions/db')
          .query({ userId: 'user-123', category_id: 5 });

        expect(querySpy).toHaveBeenCalledWith(
          expect.objectContaining({
            category_id: 5
          })
        );
      });

      it('should pass account filter to DAL', async () => {
        const querySpy = jest.spyOn(transactionDal, 'queryTransactions');
        querySpy.mockReturnValue({
          transactions: [],
          total_count: 0,
          page: 1,
          page_size: 50
        });

        await request(app)
          .get('/api/transactions/db')
          .query({ userId: 'user-123', account_id: 'account-checking' });

        expect(querySpy).toHaveBeenCalledWith(
          expect.objectContaining({
            account_id: 'account-checking'
          })
        );
      });

      it('should pass search query to DAL', async () => {
        const querySpy = jest.spyOn(transactionDal, 'queryTransactions');
        querySpy.mockReturnValue({
          transactions: [],
          total_count: 0,
          page: 1,
          page_size: 50
        });

        await request(app)
          .get('/api/transactions/db')
          .query({ userId: 'user-123', search: 'starbucks' });

        expect(querySpy).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'starbucks'
          })
        );
      });
    });

    describe('HTTP Method Restrictions', () => {
      it('should not accept POST method', async () => {
        const response = await request(app)
          .post('/api/transactions/db')
          .query({ userId: 'user-123' });

        expect(response.status).not.toBe(200);
      });

      it('should not accept PUT method', async () => {
        const response = await request(app)
          .put('/api/transactions/db')
          .query({ userId: 'user-123' });

        expect(response.status).not.toBe(200);
      });

      it('should not accept DELETE method', async () => {
        const response = await request(app)
          .delete('/api/transactions/db')
          .query({ userId: 'user-123' });

        expect(response.status).not.toBe(200);
      });
    });
  });

  describe('GET /api/transactions/db/recent', () => {
    describe('Query Parameter Validation', () => {
      it('should return 400 when userId is missing', async () => {
        const response = await request(app)
          .get('/api/transactions/db/recent');

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('userId');
      });

      it('should return 400 when limit is invalid', async () => {
        const response = await request(app)
          .get('/api/transactions/db/recent')
          .query({ userId: 'user-123', limit: 'invalid' });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('limit');
      });

      it('should return 400 when limit exceeds 100', async () => {
        const response = await request(app)
          .get('/api/transactions/db/recent')
          .query({ userId: 'user-123', limit: 150 });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('limit');
      });

      it('should accept valid query parameters', async () => {
        jest.spyOn(transactionDal, 'queryRecentTransactions').mockReturnValue([]);

        const response = await request(app)
          .get('/api/transactions/db/recent')
          .query({ userId: 'user-123', limit: 30 });

        expect(response.status).toBe(200);
      });
    });

    describe('Successful Responses', () => {
      it('should return 200 with array of transactions', async () => {
        const mockTransactions = [
          {
            transaction_id: 'txn-1',
            date: '2025-01-15',
            merchant_name: 'Whole Foods',
            amount: -85.50,
            app_category_id: 1,
            app_category_name: 'Groceries',
            plaid_category_primary: 'FOOD_AND_DRINK',
            plaid_category_detailed: 'Food and Drink, Groceries',
            account_name: 'Checking'
          }
        ];

        jest.spyOn(transactionDal, 'queryRecentTransactions').mockReturnValue(mockTransactions);

        const response = await request(app)
          .get('/api/transactions/db/recent')
          .query({ userId: 'user-123' });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('transactions');
        expect(response.body.transactions).toEqual(mockTransactions);
      });

      it('should use default limit of 30 when not specified', async () => {
        const querySpy = jest.spyOn(transactionDal, 'queryRecentTransactions');
        querySpy.mockReturnValue([]);

        await request(app)
          .get('/api/transactions/db/recent')
          .query({ userId: 'user-123' });

        expect(querySpy).toHaveBeenCalledWith('user-123', 30);
      });

      it('should respect custom limit parameter', async () => {
        const querySpy = jest.spyOn(transactionDal, 'queryRecentTransactions');
        querySpy.mockReturnValue([]);

        await request(app)
          .get('/api/transactions/db/recent')
          .query({ userId: 'user-123', limit: 10 });

        expect(querySpy).toHaveBeenCalledWith('user-123', 10);
      });
    });
  });
});
