/**
 * Budget Routes Tests
 *
 * Tests for the budget page API endpoint
 *
 * Verifies:
 * - Query parameter validation (userId, month, year)
 * - Successful response with correct structure
 * - Service integration (aggregation + calculation)
 * - Edge cases (leap years, over-budget, special characters)
 * - HTTP method restrictions (GET only)
 */

import request from 'supertest';
import express, { Express } from 'express';
import { budgetsRouter } from '../budgets';
import * as budgetCalculator from '../../services/budget-calculator.service';
import * as spendingAggregation from '../../services/spending-aggregation.service';
import * as budgetsDAL from '../../db/budgets-dal';

describe('Budget Routes', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', budgetsRouter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/budgets', () => {
    describe('Query Parameter Validation', () => {
      it('should return 400 when userId is missing', async () => {
        const response = await request(app)
          .get('/api/budgets')
          .query({ month: 1, year: 2025 });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Missing required parameters');
      });

      it('should return 400 when month is missing', async () => {
        const response = await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-123', year: 2025 });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Missing required parameters');
      });

      it('should return 400 when year is missing', async () => {
        const response = await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-123', month: 1 });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Missing required parameters');
      });

      it('should return 400 when month is invalid (< 1)', async () => {
        const response = await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-123', month: 0, year: 2025 });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Invalid month');
        expect(response.body.error).toContain('between 1 and 12');
      });

      it('should return 400 when month is invalid (> 12)', async () => {
        const response = await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-123', month: 13, year: 2025 });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Invalid month');
      });

      it('should return 400 when month is not a number', async () => {
        const response = await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-123', month: 'invalid', year: 2025 });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Invalid month');
      });

      it('should return 400 when month is negative', async () => {
        const response = await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-123', month: -5, year: 2025 });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Invalid month');
      });

      it('should return 400 when year is invalid (< 1970)', async () => {
        const response = await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-123', month: 1, year: 1969 });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Invalid year');
        expect(response.body.error).toContain('between 1970 and 2100');
      });

      it('should return 400 when year is invalid (> 2100)', async () => {
        const response = await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-123', month: 1, year: 2101 });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Invalid year');
      });

      it('should return 400 when year is not a number', async () => {
        const response = await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-123', month: 1, year: 'invalid' });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Invalid year');
      });

      it('should accept valid month boundaries (1 and 12)', async () => {
        const mockSpending = {
          month: 1,
          year: 2025,
          spending_by_category: [],
          total_spending: 0,
          total_transaction_count: 0
        };

        jest.spyOn(spendingAggregation, 'aggregateMonthlySpending').mockReturnValue(mockSpending);
        jest.spyOn(budgetCalculator, 'composeBudgetPageResponse').mockReturnValue({
          month: 1,
          year: 2025,
          categoryBudgets: [],
          summary: {
            total_budgeted: 0,
            total_spent: 0,
            total_remaining: 0,
            overall_percentage_used: 0
          }
        });

        const response1 = await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-123', month: 1, year: 2025 });

        const response12 = await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-123', month: 12, year: 2025 });

        expect(response1.status).toBe(200);
        expect(response12.status).toBe(200);
      });

      it('should accept valid year boundaries (1970 and 2100)', async () => {
        const mockSpending = {
          month: 1,
          year: 1970,
          spending_by_category: [],
          total_spending: 0,
          total_transaction_count: 0
        };

        jest.spyOn(spendingAggregation, 'aggregateMonthlySpending').mockReturnValue(mockSpending);
        jest.spyOn(budgetCalculator, 'composeBudgetPageResponse').mockReturnValue({
          month: 1,
          year: 1970,
          categoryBudgets: [],
          summary: {
            total_budgeted: 0,
            total_spent: 0,
            total_remaining: 0,
            overall_percentage_used: 0
          }
        });

        const response1970 = await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-123', month: 1, year: 1970 });

        const response2100 = await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-123', month: 1, year: 2100 });

        expect(response1970.status).toBe(200);
        expect(response2100.status).toBe(200);
      });
    });

    describe('Successful Responses', () => {
      it('should return 200 with correct response structure', async () => {
        const mockSpending = {
          month: 1,
          year: 2025,
          spending_by_category: [
            {
              category_id: 1,
              total_spent: -100,
              transaction_count: 3
            }
          ],
          total_spending: -100,
          total_transaction_count: 3
        };

        const mockResponse = {
          month: 1,
          year: 2025,
          categoryBudgets: [
            {
              category_id: 1,
              category_name: 'Groceries',
              budgeted_amount: 200,
              spent_amount: -100,
              remaining_amount: 300,
              percentage_used: 50
            }
          ],
          summary: {
            total_budgeted: 200,
            total_spent: -100,
            total_remaining: 300,
            overall_percentage_used: 50
          }
        };

        jest.spyOn(spendingAggregation, 'aggregateMonthlySpending').mockReturnValue(mockSpending);
        jest.spyOn(budgetCalculator, 'composeBudgetPageResponse').mockReturnValue(mockResponse);

        const response = await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-123', month: 1, year: 2025 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockResponse);
        expect(response.body).toHaveProperty('month');
        expect(response.body).toHaveProperty('year');
        expect(response.body).toHaveProperty('categoryBudgets');
        expect(response.body).toHaveProperty('summary');
      });

      it('should return empty categoryBudgets when user has no budgets', async () => {
        const mockSpending = {
          month: 1,
          year: 2025,
          spending_by_category: [],
          total_spending: 0,
          total_transaction_count: 0
        };

        const mockResponse = {
          month: 1,
          year: 2025,
          categoryBudgets: [],
          summary: {
            total_budgeted: 0,
            total_spent: 0,
            total_remaining: 0,
            overall_percentage_used: 0
          }
        };

        jest.spyOn(spendingAggregation, 'aggregateMonthlySpending').mockReturnValue(mockSpending);
        jest.spyOn(budgetCalculator, 'composeBudgetPageResponse').mockReturnValue(mockResponse);

        const response = await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-123', month: 1, year: 2025 });

        expect(response.status).toBe(200);
        expect(response.body.categoryBudgets).toEqual([]);
        expect(response.body.summary.total_budgeted).toBe(0);
      });

      it('should return correct month and year in response', async () => {
        const mockSpending = {
          month: 6,
          year: 2024,
          spending_by_category: [],
          total_spending: 0,
          total_transaction_count: 0
        };

        const mockResponse = {
          month: 6,
          year: 2024,
          categoryBudgets: [],
          summary: {
            total_budgeted: 0,
            total_spent: 0,
            total_remaining: 0,
            overall_percentage_used: 0
          }
        };

        jest.spyOn(spendingAggregation, 'aggregateMonthlySpending').mockReturnValue(mockSpending);
        jest.spyOn(budgetCalculator, 'composeBudgetPageResponse').mockReturnValue(mockResponse);

        const response = await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-123', month: 6, year: 2024 });

        expect(response.status).toBe(200);
        expect(response.body.month).toBe(6);
        expect(response.body.year).toBe(2024);
      });

      it('should return multiple categories with aggregated spending', async () => {
        const mockSpending = {
          month: 1,
          year: 2025,
          spending_by_category: [
            { category_id: 1, total_spent: -150, transaction_count: 5 },
            { category_id: 2, total_spent: -75, transaction_count: 3 },
            { category_id: 3, total_spent: -50, transaction_count: 2 }
          ],
          total_spending: -275,
          total_transaction_count: 10
        };

        const mockResponse = {
          month: 1,
          year: 2025,
          categoryBudgets: [
            {
              category_id: 1,
              category_name: 'Groceries',
              budgeted_amount: 300,
              spent_amount: -150,
              remaining_amount: 450,
              percentage_used: 50
            },
            {
              category_id: 2,
              category_name: 'Dining',
              budgeted_amount: 150,
              spent_amount: -75,
              remaining_amount: 225,
              percentage_used: 50
            },
            {
              category_id: 3,
              category_name: 'Entertainment',
              budgeted_amount: 100,
              spent_amount: -50,
              remaining_amount: 150,
              percentage_used: 50
            }
          ],
          summary: {
            total_budgeted: 550,
            total_spent: -275,
            total_remaining: 825,
            overall_percentage_used: 50
          }
        };

        jest.spyOn(spendingAggregation, 'aggregateMonthlySpending').mockReturnValue(mockSpending);
        jest.spyOn(budgetCalculator, 'composeBudgetPageResponse').mockReturnValue(mockResponse);

        const response = await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-123', month: 1, year: 2025 });

        expect(response.status).toBe(200);
        expect(response.body.categoryBudgets).toHaveLength(3);
        expect(response.body.summary.total_budgeted).toBe(550);
        expect(response.body.summary.total_spent).toBe(-275);
      });
    });

    describe('Service Integration', () => {
      it('should call aggregateMonthlySpending with correct parameters', async () => {
        const aggregateSpy = jest.spyOn(spendingAggregation, 'aggregateMonthlySpending');
        const mockSpending = {
          month: 1,
          year: 2025,
          spending_by_category: [],
          total_spending: 0,
          total_transaction_count: 0
        };

        aggregateSpy.mockReturnValue(mockSpending);
        jest.spyOn(budgetCalculator, 'composeBudgetPageResponse').mockReturnValue({
          month: 1,
          year: 2025,
          categoryBudgets: [],
          summary: {
            total_budgeted: 0,
            total_spent: 0,
            total_remaining: 0,
            overall_percentage_used: 0
          }
        });

        await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-456', month: 7, year: 2024 });

        expect(aggregateSpy).toHaveBeenCalledWith({
          user_id: 'user-456',
          month: 7,
          year: 2024
        });
      });

      it('should call composeBudgetPageResponse with correct parameters', async () => {
        const composeSpy = jest.spyOn(budgetCalculator, 'composeBudgetPageResponse');
        const mockSpending = {
          month: 1,
          year: 2025,
          spending_by_category: [],
          total_spending: 0,
          total_transaction_count: 0
        };

        jest.spyOn(spendingAggregation, 'aggregateMonthlySpending').mockReturnValue(mockSpending);
        composeSpy.mockReturnValue({
          month: 1,
          year: 2025,
          categoryBudgets: [],
          summary: {
            total_budgeted: 0,
            total_spent: 0,
            total_remaining: 0,
            overall_percentage_used: 0
          }
        });

        await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-123', month: 1, year: 2025 });

        expect(composeSpy).toHaveBeenCalledWith(1, 2025, []);
      });

      it('should not accept POST method', async () => {
        const response = await request(app)
          .post('/api/budgets')
          .query({ userId: 'user-123', month: 1, year: 2025 });

        expect(response.status).not.toBe(200);
      });

      it('should not accept PUT method', async () => {
        const response = await request(app)
          .put('/api/budgets')
          .query({ userId: 'user-123', month: 1, year: 2025 });

        expect(response.status).not.toBe(200);
      });

      it('should not accept DELETE method', async () => {
        const response = await request(app)
          .delete('/api/budgets')
          .query({ userId: 'user-123', month: 1, year: 2025 });

        expect(response.status).not.toBe(200);
      });
    });

    describe('Edge Cases', () => {
      it('should handle userId with special characters', async () => {
        const mockSpending = {
          month: 1,
          year: 2025,
          spending_by_category: [],
          total_spending: 0,
          total_transaction_count: 0
        };

        jest.spyOn(spendingAggregation, 'aggregateMonthlySpending').mockReturnValue(mockSpending);
        jest.spyOn(budgetCalculator, 'composeBudgetPageResponse').mockReturnValue({
          month: 1,
          year: 2025,
          categoryBudgets: [],
          summary: {
            total_budgeted: 0,
            total_spent: 0,
            total_remaining: 0,
            overall_percentage_used: 0
          }
        });

        const response = await request(app)
          .get('/api/budgets')
          .query({ userId: '123e4567-e89b-12d3-a456-426614174000', month: 1, year: 2025 });

        expect(response.status).toBe(200);
      });

      it('should handle leap year February', async () => {
        const mockSpending = {
          month: 2,
          year: 2024,
          spending_by_category: [],
          total_spending: 0,
          total_transaction_count: 0
        };

        jest.spyOn(spendingAggregation, 'aggregateMonthlySpending').mockReturnValue(mockSpending);
        jest.spyOn(budgetCalculator, 'composeBudgetPageResponse').mockReturnValue({
          month: 2,
          year: 2024,
          categoryBudgets: [],
          summary: {
            total_budgeted: 0,
            total_spent: 0,
            total_remaining: 0,
            overall_percentage_used: 0
          }
        });

        const response = await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-123', month: 2, year: 2024 });

        expect(response.status).toBe(200);
        expect(response.body.month).toBe(2);
        expect(response.body.year).toBe(2024);
      });

      it('should handle over-budget categories', async () => {
        const mockSpending = {
          month: 1,
          year: 2025,
          spending_by_category: [
            { category_id: 1, total_spent: -150, transaction_count: 3 }
          ],
          total_spending: -150,
          total_transaction_count: 3
        };

        const mockResponse = {
          month: 1,
          year: 2025,
          categoryBudgets: [
            {
              category_id: 1,
              category_name: 'Groceries',
              budgeted_amount: 100,
              spent_amount: -150,
              remaining_amount: 250,
              percentage_used: 150
            }
          ],
          summary: {
            total_budgeted: 100,
            total_spent: -150,
            total_remaining: 250,
            overall_percentage_used: 150
          }
        };

        jest.spyOn(spendingAggregation, 'aggregateMonthlySpending').mockReturnValue(mockSpending);
        jest.spyOn(budgetCalculator, 'composeBudgetPageResponse').mockReturnValue(mockResponse);

        const response = await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-123', month: 1, year: 2025 });

        expect(response.status).toBe(200);
        expect(response.body.categoryBudgets[0].percentage_used).toBe(150);
      });

      it('should handle categories with only refunds', async () => {
        const mockSpending = {
          month: 1,
          year: 2025,
          spending_by_category: [
            { category_id: 1, total_spent: 50, transaction_count: 2 }
          ],
          total_spending: 50,
          total_transaction_count: 2
        };

        const mockResponse = {
          month: 1,
          year: 2025,
          categoryBudgets: [
            {
              category_id: 1,
              category_name: 'Returns',
              budgeted_amount: 0,
              spent_amount: 50,
              remaining_amount: -50,
              percentage_used: 0
            }
          ],
          summary: {
            total_budgeted: 0,
            total_spent: 50,
            total_remaining: -50,
            overall_percentage_used: 0
          }
        };

        jest.spyOn(spendingAggregation, 'aggregateMonthlySpending').mockReturnValue(mockSpending);
        jest.spyOn(budgetCalculator, 'composeBudgetPageResponse').mockReturnValue(mockResponse);

        const response = await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-123', month: 1, year: 2025 });

        expect(response.status).toBe(200);
        expect(response.body.categoryBudgets[0].spent_amount).toBe(50);
      });

      it('should handle different users independently', async () => {
        const mockSpending1 = {
          month: 1,
          year: 2025,
          spending_by_category: [{ category_id: 1, total_spent: -100, transaction_count: 2 }],
          total_spending: -100,
          total_transaction_count: 2
        };

        const mockSpending2 = {
          month: 1,
          year: 2025,
          spending_by_category: [{ category_id: 1, total_spent: -200, transaction_count: 4 }],
          total_spending: -200,
          total_transaction_count: 4
        };

        const aggregateSpy = jest.spyOn(spendingAggregation, 'aggregateMonthlySpending');

        jest.spyOn(budgetCalculator, 'composeBudgetPageResponse').mockReturnValue({
          month: 1,
          year: 2025,
          categoryBudgets: [],
          summary: {
            total_budgeted: 0,
            total_spent: 0,
            total_remaining: 0,
            overall_percentage_used: 0
          }
        });

        aggregateSpy.mockReturnValueOnce(mockSpending1);
        await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-1', month: 1, year: 2025 });

        aggregateSpy.mockReturnValueOnce(mockSpending2);
        await request(app)
          .get('/api/budgets')
          .query({ userId: 'user-2', month: 1, year: 2025 });

        expect(aggregateSpy).toHaveBeenCalledWith({
          user_id: 'user-1',
          month: 1,
          year: 2025
        });
        expect(aggregateSpy).toHaveBeenCalledWith({
          user_id: 'user-2',
          month: 1,
          year: 2025
        });
      });
    });
  });

  describe('POST /api/budgets/setup', () => {
    beforeEach(() => {
      jest.spyOn(budgetsDAL, 'saveBudgets').mockReturnValue(2);
    });

    describe('Request Body Validation', () => {
      it('should return 400 when user_id is missing', async () => {
        const response = await request(app)
          .post('/api/budgets/setup')
          .send({
            month: 1,
            year: 2025,
            budgets: [
              { category_id: 1, category_name: 'Groceries', planned_amount: 300 }
            ]
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Missing required fields');
      });

      it('should return 400 when month is missing', async () => {
        const response = await request(app)
          .post('/api/budgets/setup')
          .send({
            user_id: 'user-123',
            year: 2025,
            budgets: [
              { category_id: 1, category_name: 'Groceries', planned_amount: 300 }
            ]
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Missing required fields');
      });

      it('should return 400 when year is missing', async () => {
        const response = await request(app)
          .post('/api/budgets/setup')
          .send({
            user_id: 'user-123',
            month: 1,
            budgets: [
              { category_id: 1, category_name: 'Groceries', planned_amount: 300 }
            ]
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Missing required fields');
      });

      it('should return 400 when budgets is not an array', async () => {
        const response = await request(app)
          .post('/api/budgets/setup')
          .send({
            user_id: 'user-123',
            month: 1,
            year: 2025,
            budgets: 'not-an-array'
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Budgets must be an array');
      });

      it('should return 400 when month is invalid (< 1)', async () => {
        const response = await request(app)
          .post('/api/budgets/setup')
          .send({
            user_id: 'user-123',
            month: 0,
            year: 2025,
            budgets: [
              { category_id: 1, category_name: 'Groceries', planned_amount: 300 }
            ]
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Invalid month');
      });

      it('should return 400 when budgets array is empty', async () => {
        const response = await request(app)
          .post('/api/budgets/setup')
          .send({
            user_id: 'user-123',
            month: 1,
            year: 2025,
            budgets: []
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('At least one budget item is required');
      });

      it('should return 400 when there are duplicate category_ids', async () => {
        const response = await request(app)
          .post('/api/budgets/setup')
          .send({
            user_id: 'user-123',
            month: 1,
            year: 2025,
            budgets: [
              { category_id: 1, category_name: 'Groceries', planned_amount: 300 },
              { category_id: 1, category_name: 'Groceries', planned_amount: 200 }
            ]
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toContain('Duplicate category_id');
      });
    });

    describe('Successful Responses', () => {
      it('should return 201 with correct response structure', async () => {
        const response = await request(app)
          .post('/api/budgets/setup')
          .send({
            user_id: 'user-123',
            month: 1,
            year: 2025,
            budgets: [
              { category_id: 1, category_name: 'Groceries', planned_amount: 300 },
              { category_id: 2, category_name: 'Dining Out', planned_amount: 150 }
            ]
          });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('count');
        expect(response.body).toHaveProperty('month', 1);
        expect(response.body).toHaveProperty('year', 2025);
      });

      it('should call saveBudgets with correct parameters', async () => {
        const saveBudgetsSpy = jest.spyOn(budgetsDAL, 'saveBudgets');

        await request(app)
          .post('/api/budgets/setup')
          .send({
            user_id: 'user-456',
            month: 6,
            year: 2025,
            budgets: [
              { category_id: 1, category_name: 'Groceries', planned_amount: 400 },
              { category_id: 3, category_name: 'Utilities', planned_amount: 200 }
            ]
          });

        expect(saveBudgetsSpy).toHaveBeenCalledWith(
          'user-456',
          6,
          2025,
          expect.arrayContaining([
            expect.objectContaining({
              category_id: 1,
              planned_amount: 400
            }),
            expect.objectContaining({
              category_id: 3,
              planned_amount: 200
            })
          ])
        );
      });

      it('should accept valid month boundaries', async () => {
        const response1 = await request(app)
          .post('/api/budgets/setup')
          .send({
            user_id: 'user-123',
            month: 1,
            year: 2025,
            budgets: [
              { category_id: 1, category_name: 'Groceries', planned_amount: 300 }
            ]
          });

        const response2 = await request(app)
          .post('/api/budgets/setup')
          .send({
            user_id: 'user-123',
            month: 12,
            year: 2025,
            budgets: [
              { category_id: 1, category_name: 'Groceries', planned_amount: 300 }
            ]
          });

        expect(response1.status).toBe(201);
        expect(response2.status).toBe(201);
      });

      it('should handle decimal amounts', async () => {
        const response = await request(app)
          .post('/api/budgets/setup')
          .send({
            user_id: 'user-123',
            month: 1,
            year: 2025,
            budgets: [
              { category_id: 1, category_name: 'Groceries', planned_amount: 123.45 },
              { category_id: 2, category_name: 'Dining', planned_amount: 50.99 }
            ]
          });

        expect(response.status).toBe(201);
        expect(response.body.count).toBe(2);
      });
    });
  });
});
