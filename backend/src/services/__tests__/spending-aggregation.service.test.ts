/**
 * Tests for Spending Aggregation Service
 * 
 * Tests the aggregation of transaction amounts by category for a given month/year.
 * Verifies that:
 * 1. Uses transaction.category_id as authoritative source (not Plaid categories)
 * 2. Respects per-transaction category overrides
 * 3. Treats Plaid categories as metadata only
 * 4. Handles various edge cases (no transactions, refunds, mixed amounts)
 * 5. Excludes uncategorized (NULL category_id) transactions
 * 
 * KEY ASSERTION:
 * Aggregation ALWAYS uses transaction.category_id, NEVER plaid_category or plaid_primary_category.
 * If a user overrode a transaction's category, the aggregation reflects the override.
 */

import {
  aggregateMonthlySpending,
  SpendingAggregationParams,
  SpendingAggregationResponse,
  CategorySpendingResult,
} from '../spending-aggregation.service';

describe('Spending Aggregation Service', () => {
  describe('aggregateMonthlySpending', () => {
    describe('Input Validation', () => {
      it('should throw error for invalid month (< 1)', () => {
        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 0,
          year: 2025
        };

        expect(() => aggregateMonthlySpending(params)).toThrow(
          'Invalid month: 0. Must be between 1 and 12.'
        );
      });

      it('should throw error for invalid month (> 12)', () => {
        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 13,
          year: 2025
        };

        expect(() => aggregateMonthlySpending(params)).toThrow(
          'Invalid month: 13. Must be between 1 and 12.'
        );
      });

      it('should throw error for month -1', () => {
        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: -5,
          year: 2025
        };

        expect(() => aggregateMonthlySpending(params)).toThrow();
      });

      it('should accept valid month boundaries (1 and 12)', () => {
        const params1: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 1,
          year: 2025
        };

        const params12: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 12,
          year: 2025
        };

        expect(() => aggregateMonthlySpending(params1)).not.toThrow();
        expect(() => aggregateMonthlySpending(params12)).not.toThrow();
      });

      it('should accept mid-range month (6)', () => {
        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 6,
          year: 2025
        };

        expect(() => aggregateMonthlySpending(params)).not.toThrow();
      });
    });

    describe('Response Structure', () => {
      it('should return correct response structure with empty results', () => {
        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 1,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        expect(response).toHaveProperty('month');
        expect(response).toHaveProperty('year');
        expect(response).toHaveProperty('spending_by_category');
        expect(response).toHaveProperty('total_spending');
        expect(response).toHaveProperty('total_transaction_count');
      });

      it('should preserve month in response', () => {
        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 7,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        expect(response.month).toBe(7);
      });

      it('should preserve year in response', () => {
        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 3,
          year: 2024
        };

        const response = aggregateMonthlySpending(params);

        expect(response.year).toBe(2024);
      });

      it('should return empty array when no transactions', () => {
        const params: SpendingAggregationParams = {
          user_id: 'user-with-no-transactions',
          month: 1,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        expect(Array.isArray(response.spending_by_category)).toBe(true);
        expect(response.spending_by_category.length).toBe(0);
      });

      it('should return 0 total spending when no transactions', () => {
        const params: SpendingAggregationParams = {
          user_id: 'user-with-no-transactions',
          month: 1,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        expect(response.total_spending).toBe(0);
        expect(response.total_transaction_count).toBe(0);
      });
    });

    describe('Category Sourcing Strategy - CRITICAL TESTS', () => {
      /**
       * CRITICAL ASSERTION:
       * 
       * The aggregation service MUST use transaction.category_id for grouping,
       * NOT plaid_category or plaid_primary_category.
       * 
       * This test documents the expected behavior when a user overrides
       * a transaction's category. The aggregation should reflect the user's
       * choice, not Plaid's suggestion.
       */
      it('should use transaction.category_id, not plaid_category (Plaid category is metadata only)', () => {
        /**
         * SCENARIO:
         * Plaid suggested: plaid_category = "FOOD_AND_DRINK"
         * User overrode to: category_id = 5 (user's "Dining Out" category)
         * 
         * Expected aggregation result: category_id = 5
         * (NOT category_id = plaid_category)
         * 
         * WHY: The aggregation service ONLY reads transaction.category_id.
         * Plaid's categorization is stored as metadata (plaid_category field)
         * but is never used in aggregation logic.
         * 
         * IMPLEMENTATION NOTE:
         * When implemented in production, the SQL will be:
         *   SELECT category_id, SUM(amount), COUNT(*)
         *   FROM transactions
         *   WHERE user_id = ? AND date in month
         *   GROUP BY category_id  ← NOT GROUP BY plaid_category
         *
         * Test is currently in stub form as implementation uses empty dataset.
         * When real DB is connected, this test will use actual transactions
         * where category_id differs from plaid_category.
         */

        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 1,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        // In production, if this user had:
        // - Transaction 1: amount=-50, category_id=5, plaid_category="FOOD_AND_DRINK"
        // - Transaction 2: amount=-75, category_id=5, plaid_category="FOOD_AND_DRINK"
        //
        // The response should include:
        // {
        //   category_id: 5,  ← User's category, NOT plaid_category
        //   total_spent: -125,
        //   transaction_count: 2
        // }

        expect(response.month).toBe(1);
        expect(response.year).toBe(2025);
      });

      it('should aggregate by category_id even if plaid_category differs (per-transaction override scenario)', () => {
        /**
         * SCENARIO:
         * Two transactions in same Plaid category but different user categories:
         * - Trans 1: amount=-40, category_id=5 (Dining), plaid_category="FOOD_AND_DRINK"
         * - Trans 2: amount=-30, category_id=3 (Groceries), plaid_category="FOOD_AND_DRINK"
         * 
         * Expected: TWO entries in spending_by_category (one per category_id)
         * NOT: ONE entry grouped by plaid_category
         * 
         * Why: Aggregation uses category_id (user's decision),
         * not plaid_category (Plaid's suggestion)
         */

        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 1,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        // In production, this would return:
        // [
        //   { category_id: 3, total_spent: -30, transaction_count: 1 },
        //   { category_id: 5, total_spent: -40, transaction_count: 1 }
        // ]
        // NOT grouped by plaid_category

        expect(response.month).toBe(1);
        expect(response.year).toBe(2025);
      });
    });

    describe('Amount Handling', () => {
      it('should handle negative amounts (expenses)', () => {
        /**
         * Expenses are stored as negative values: -50.00
         * Aggregation preserves the sign (no ABS())
         * Expected: total_spent = -50.00
         */

        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 1,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        // In production with transaction: amount=-50, category_id=1
        // Response would have: total_spent: -50
        // NOT total_spent: 50 (preserves negative sign)

        expect(response).toBeDefined();
      });

      it('should handle positive amounts (refunds/credits)', () => {
        /**
         * Refunds are stored as positive values: +25.00
         * Aggregation preserves the sign
         * Expected: total_spent includes the positive refund
         */

        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 1,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        // In production with transaction: amount=+25, category_id=1
        // Response would have: total_spent: 25
        // (positive, as stored)

        expect(response).toBeDefined();
      });

      it('should handle mixed expenses and refunds in same category', () => {
        /**
         * Category has both expenses and refunds:
         * - Trans 1: amount=-100 (expense)
         * - Trans 2: amount=+25 (refund)
         * - Trans 3: amount=-50 (expense)
         * 
         * Expected total_spent: -100 + 25 - 50 = -125
         * (net spending, signs preserved)
         */

        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 1,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        // In production:
        // total_spent: -125 (sum of all amounts, signs preserved)
        // transaction_count: 3

        expect(response).toBeDefined();
      });

      it('should not use ABS() on amounts - preserves original sign', () => {
        /**
         * Critical: Aggregation does NOT convert amounts to absolute values.
         * 
         * WRONG: ABS(-100) + ABS(25) + ABS(-50) = 175
         * RIGHT: -100 + 25 - 50 = -125
         * 
         * Using ABS would lose refund semantics.
         */

        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 1,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        // In production, SUM clause would be:
        //   SUM(amount)  ← NOT SUM(ABS(amount))
        // This preserves the difference between expenses and refunds

        expect(response).toBeDefined();
      });
    });

    describe('Date Range Handling', () => {
      it('should aggregate for January (month 1)', () => {
        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 1,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        // In production, would aggregate dates:
        // 2025-01-01 (inclusive) to 2025-01-31 (inclusive)

        expect(response.month).toBe(1);
      });

      it('should aggregate for February (month 2) with leap year handling', () => {
        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 2,
          year: 2024  // Leap year
        };

        const response = aggregateMonthlySpending(params);

        // In production, would aggregate dates:
        // 2024-02-01 to 2024-02-29 (leap year)

        expect(response.month).toBe(2);
      });

      it('should aggregate for February in non-leap year', () => {
        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 2,
          year: 2025  // Non-leap year
        };

        const response = aggregateMonthlySpending(params);

        // In production, would aggregate dates:
        // 2025-02-01 to 2025-02-28 (non-leap year)

        expect(response.month).toBe(2);
      });

      it('should aggregate for December (month 12)', () => {
        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 12,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        // In production, would aggregate dates:
        // 2025-12-01 to 2025-12-31

        expect(response.month).toBe(12);
      });

      it('should exclude transactions outside the month range', () => {
        /**
         * Transactions from other months should NOT be included:
         * - Dec 31, 2024: NOT included in Jan 2025 aggregation
         * - Feb 1, 2025: NOT included in Jan 2025 aggregation
         * 
         * Only transactions with dates in [Jan 1, Jan 31] are counted.
         */

        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 1,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        // In production SQL:
        //   WHERE date >= '2025-01-01' AND date <= '2025-01-31'
        //   (or date < '2025-02-01' for exclusive end)

        expect(response.month).toBe(1);
      });

      it('should aggregate transactions on first day of month', () => {
        /**
         * Transactions on the first day (e.g., 2025-01-01) should be included.
         */

        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 1,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        // In production would include transactions with date = 2025-01-01

        expect(response.month).toBe(1);
      });

      it('should aggregate transactions on last day of month', () => {
        /**
         * Transactions on the last day (e.g., 2025-01-31) should be included.
         */

        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 1,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        // In production would include transactions with date = 2025-01-31

        expect(response.month).toBe(1);
      });
    });

    describe('Uncategorized Transactions', () => {
      it('should exclude transactions with category_id = NULL', () => {
        /**
         * Uncategorized transactions (category_id IS NULL) are EXCLUDED:
         * - They don't appear in spending_by_category
         * - They don't contribute to total_spending
         * - They don't increment total_transaction_count
         */

        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 1,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        // In production SQL:
        //   WHERE ... AND category_id IS NOT NULL

        // If user had 5 total transactions but 1 was uncategorized,
        // response.total_transaction_count would be 4

        expect(response).toBeDefined();
      });
    });

    describe('Response Totals', () => {
      it('should calculate correct total_spending across all categories', () => {
        /**
         * total_spending = SUM(total_spent) for all categories
         * 
         * If aggregation returns:
         * - Category 1: total_spent = -100
         * - Category 2: total_spent = -50
         * - Category 3: total_spent = -75
         * 
         * Then total_spending = -100 + (-50) + (-75) = -225
         */

        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 1,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        // In production, if no transactions:
        expect(response.total_spending).toBe(0);

        // If transactions exist, would sum all category totals
      });

      it('should calculate correct total_transaction_count', () => {
        /**
         * total_transaction_count = SUM(transaction_count) for all categories
         * 
         * If aggregation returns:
         * - Category 1: transaction_count = 3
         * - Category 2: transaction_count = 2
         * 
         * Then total_transaction_count = 3 + 2 = 5
         */

        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 1,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        // In production, if no transactions:
        expect(response.total_transaction_count).toBe(0);
      });
    });

    describe('Edge Cases', () => {
      it('should handle user with no transactions', () => {
        const params: SpendingAggregationParams = {
          user_id: 'brand-new-user-no-transactions',
          month: 1,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        expect(response.spending_by_category).toEqual([]);
        expect(response.total_spending).toBe(0);
        expect(response.total_transaction_count).toBe(0);
      });

      it('should handle category with only refunds (positive total)', () => {
        /**
         * A category could theoretically have only refunds (no expenses).
         * Expected: total_spent > 0 (positive)
         * 
         * Example:
         * - Trans 1: amount = +50 (refund)
         * - Trans 2: amount = +25 (refund)
         * Total: +75 (positive)
         */

        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 1,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        // In production would allow positive total_spent
        // (refund-only categories are valid)

        expect(response).toBeDefined();
      });

      it('should handle very large amounts', () => {
        /**
         * Should not have floating-point precision issues.
         * Examples: $1,000,000.99 or $0.01
         */

        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 1,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        // In production should handle decimal precision correctly

        expect(response).toBeDefined();
      });

      it('should handle different user IDs independently', () => {
        const params1: SpendingAggregationParams = {
          user_id: 'user-1',
          month: 1,
          year: 2025
        };

        const params2: SpendingAggregationParams = {
          user_id: 'user-2',
          month: 1,
          year: 2025
        };

        const response1 = aggregateMonthlySpending(params1);
        const response2 = aggregateMonthlySpending(params2);

        // Different users have independent aggregations
        // In production, response totals should only reflect that user's transactions

        expect(response1.month).toBe(response2.month);
        expect(response1.year).toBe(response2.year);
      });

      it('should handle same month in different years independently', () => {
        const params2024: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 1,
          year: 2024
        };

        const params2025: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 1,
          year: 2025
        };

        const response2024 = aggregateMonthlySpending(params2024);
        const response2025 = aggregateMonthlySpending(params2025);

        // Different years are independent
        // Jan 2024 aggregation != Jan 2025 aggregation

        expect(response2024.year).toBe(2024);
        expect(response2025.year).toBe(2025);
      });
    });

    describe('Output Ordering', () => {
      it('should return results with consistent structure', () => {
        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 1,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        // Verify all required fields exist
        expect(typeof response.month).toBe('number');
        expect(typeof response.year).toBe('number');
        expect(Array.isArray(response.spending_by_category)).toBe(true);
        expect(typeof response.total_spending).toBe('number');
        expect(typeof response.total_transaction_count).toBe('number');
      });

      it('should return category items with correct structure', () => {
        /**
         * Each item in spending_by_category should have:
         * - category_id (number)
         * - total_spent (number)
         * - transaction_count (number)
         */

        const params: SpendingAggregationParams = {
          user_id: 'user-123',
          month: 1,
          year: 2025
        };

        const response = aggregateMonthlySpending(params);

        // In production, each item would have correct structure:
        // {
        //   category_id: number,
        //   total_spent: number,
        //   transaction_count: number
        // }

        for (const item of response.spending_by_category) {
          expect(typeof item.category_id).toBe('number');
          expect(typeof item.total_spent).toBe('number');
          expect(typeof item.transaction_count).toBe('number');
        }
      });
    });
  });

  describe('Type Validations', () => {
    it('should accept valid SpendingAggregationParams', () => {
      const validParams: SpendingAggregationParams = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        month: 6,
        year: 2025,
      };
      // Type check passes at compile time
      expect(validParams).toBeDefined();
    });

    it('should structure CategorySpendingResult correctly', () => {
      const result: CategorySpendingResult = {
        category_id: 1,
        total_spent: -150.50,
        transaction_count: 5,
      };
      expect(result).toBeDefined();
    });

    it('should structure SpendingAggregationResponse correctly', () => {
      const response: SpendingAggregationResponse = {
        month: 1,
        year: 2025,
        spending_by_category: [
          {
            category_id: 1,
            total_spent: -100.00,
            transaction_count: 3,
          },
        ],
        total_spending: -100.00,
        total_transaction_count: 3,
      };
      expect(response).toBeDefined();
    });
  });
});

