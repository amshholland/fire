import {
  calculateCategoryRemaining,
  calculatePercentageUsed,
  buildCategoryBudgetItems,
  calculateBudgetSummary,
  composeBudgetPageResponse
} from '../budget-calculator.service';
import { CategorySpendingResult } from '../spending-aggregation.service';
import { CategoryBudgetItemDTO } from '../../types/budget.types';

describe('Budget Calculator Service', () => {
  describe('calculateCategoryRemaining', () => {
    it('should calculate remaining as budgeted minus spent', () => {
      const result = calculateCategoryRemaining(100, 30);
      expect(result).toBe(70);
    });

    it('should return negative value when over budget', () => {
      const result = calculateCategoryRemaining(100, 150);
      expect(result).toBe(-50);
    });

    it('should handle zero amounts', () => {
      expect(calculateCategoryRemaining(0, 0)).toBe(0);
      expect(calculateCategoryRemaining(100, 0)).toBe(100);
      expect(calculateCategoryRemaining(0, 100)).toBe(-100);
    });

    it('should handle decimal amounts', () => {
      const result = calculateCategoryRemaining(99.99, 25.50);
      expect(result).toBeCloseTo(74.49, 2);
    });

    it('should handle negative spent amounts (refunds)', () => {
      const result = calculateCategoryRemaining(100, -20);
      expect(result).toBe(120);
    });
  });

  describe('calculatePercentageUsed', () => {
    it('should calculate percentage as spent divided by budgeted', () => {
      const result = calculatePercentageUsed(30, 100);
      expect(result).toBe(30);
    });

    it('should return percentage over 100 when over budget', () => {
      const result = calculatePercentageUsed(150, 100);
      expect(result).toBe(150);
    });

    it('should return 0 when budget is zero', () => {
      const result = calculatePercentageUsed(50, 0);
      expect(result).toBe(0);
    });

    it('should handle absolute value of spent amount', () => {
      const result = calculatePercentageUsed(-50, 100);
      expect(result).toBe(50);
    });

    it('should return 0 percentage when spent is 0', () => {
      const result = calculatePercentageUsed(0, 100);
      expect(result).toBe(0);
    });

    it('should handle decimal amounts', () => {
      const result = calculatePercentageUsed(33.33, 100);
      expect(result).toBeCloseTo(33.33, 2);
    });
  });

  describe('buildCategoryBudgetItems', () => {
    it('should build items from budgets and spending data', () => {
      const budgets = [
        {
          category_id: 1,
          category_name: 'Groceries',
          budgeted_amount: 200
        }
      ];

      const spending = new Map<number, CategorySpendingResult>([
        [
          1,
          {
            category_id: 1,
            total_spent: -75.5,
            transaction_count: 3
          }
        ]
      ]);

      const result = buildCategoryBudgetItems(budgets, spending);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        category_id: 1,
        category_name: 'Groceries',
        budgeted_amount: 200,
        spent_amount: -75.5,
        remaining_amount: 275.5,
        percentage_used: 37.75
      });
    });

    it('should handle categories with no transactions', () => {
      const budgets = [
        {
          category_id: 1,
          category_name: 'Entertainment',
          budgeted_amount: 50
        }
      ];

      const spending = new Map<number, CategorySpendingResult>();

      const result = buildCategoryBudgetItems(budgets, spending);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        category_id: 1,
        category_name: 'Entertainment',
        budgeted_amount: 50,
        spent_amount: 0,
        remaining_amount: 50,
        percentage_used: 0
      });
    });

    it('should handle multiple categories with mixed spending', () => {
      const budgets = [
        {
          category_id: 1,
          category_name: 'Groceries',
          budgeted_amount: 200
        },
        {
          category_id: 2,
          category_name: 'Dining',
          budgeted_amount: 100
        },
        {
          category_id: 3,
          category_name: 'Transport',
          budgeted_amount: 150
        }
      ];

      const spending = new Map<number, CategorySpendingResult>([
        [1, { category_id: 1, total_spent: -150, transaction_count: 5 }],
        [2, { category_id: 2, total_spent: -120, transaction_count: 4 }]
      ]);

      const result = buildCategoryBudgetItems(budgets, spending);

      expect(result).toHaveLength(3);
      expect(result[0].spent_amount).toBe(-150);
      expect(result[1].spent_amount).toBe(-120);
      expect(result[2].spent_amount).toBe(0);
      expect(result[0].remaining_amount).toBe(350);
      expect(result[1].remaining_amount).toBe(220);
      expect(result[2].remaining_amount).toBe(150);
    });

    it('should calculate percentage correctly for each item', () => {
      const budgets = [
        {
          category_id: 1,
          category_name: 'Test',
          budgeted_amount: 100
        }
      ];

      const spending = new Map<number, CategorySpendingResult>([
        [1, { category_id: 1, total_spent: -50, transaction_count: 1 }]
      ]);

      const result = buildCategoryBudgetItems(budgets, spending);

      expect(result[0].percentage_used).toBe(50);
    });
  });

  describe('calculateBudgetSummary', () => {
    it('should sum budgets and spending across categories', () => {
      const items: CategoryBudgetItemDTO[] = [
        {
          category_id: 1,
          category_name: 'Groceries',
          budgeted_amount: 200,
          spent_amount: -100,
          remaining_amount: 300,
          percentage_used: 50
        },
        {
          category_id: 2,
          category_name: 'Dining',
          budgeted_amount: 100,
          spent_amount: -50,
          remaining_amount: 150,
          percentage_used: 50
        }
      ];

      const result = calculateBudgetSummary(items);

      expect(result).toEqual({
        total_budgeted: 300,
        total_spent: -150,
        total_remaining: 450,
        overall_percentage_used: 50
      });
    });

    it('should handle empty category array', () => {
      const result = calculateBudgetSummary([]);

      expect(result).toEqual({
        total_budgeted: 0,
        total_spent: 0,
        total_remaining: 0,
        overall_percentage_used: 0
      });
    });

    it('should handle single category', () => {
      const items: CategoryBudgetItemDTO[] = [
        {
          category_id: 1,
          category_name: 'Test',
          budgeted_amount: 100,
          spent_amount: -30,
          remaining_amount: 130,
          percentage_used: 30
        }
      ];

      const result = calculateBudgetSummary(items);

      expect(result).toEqual({
        total_budgeted: 100,
        total_spent: -30,
        total_remaining: 130,
        overall_percentage_used: 30
      });
    });

    it('should handle categories over budget', () => {
      const items: CategoryBudgetItemDTO[] = [
        {
          category_id: 1,
          category_name: 'Groceries',
          budgeted_amount: 100,
          spent_amount: -150,
          remaining_amount: -50,
          percentage_used: 150
        },
        {
          category_id: 2,
          category_name: 'Dining',
          budgeted_amount: 100,
          spent_amount: -50,
          remaining_amount: 150,
          percentage_used: 50
        }
      ];

      const result = calculateBudgetSummary(items);

      expect(result.total_budgeted).toBe(200);
      expect(result.total_spent).toBe(-200);
      expect(result.total_remaining).toBe(400);
      expect(result.overall_percentage_used).toBe(100);
    });
  });

  describe('composeBudgetPageResponse', () => {
    it('should compose response with month, year, categories, and summary', () => {
      const items: CategoryBudgetItemDTO[] = [
        {
          category_id: 1,
          category_name: 'Groceries',
          budgeted_amount: 200,
          spent_amount: -75,
          remaining_amount: 275,
          percentage_used: 37.5
        }
      ];

      const result = composeBudgetPageResponse(1, 2025, items);

      expect(result.month).toBe(1);
      expect(result.year).toBe(2025);
      expect(result.categoryBudgets).toEqual(items);
      expect(result.summary.total_budgeted).toBe(200);
      expect(result.summary.total_spent).toBe(-75);
      expect(result.summary.total_remaining).toBe(275);
    });

    it('should calculate summary within the composed response', () => {
      const items: CategoryBudgetItemDTO[] = [
        {
          category_id: 1,
          category_name: 'Groceries',
          budgeted_amount: 100,
          spent_amount: -50,
          remaining_amount: 150,
          percentage_used: 50
        },
        {
          category_id: 2,
          category_name: 'Dining',
          budgeted_amount: 100,
          spent_amount: -75,
          remaining_amount: 175,
          percentage_used: 75
        }
      ];

      const result = composeBudgetPageResponse(12, 2025, items);

      expect(result.summary.total_budgeted).toBe(200);
      expect(result.summary.total_spent).toBe(-125);
      expect(result.summary.overall_percentage_used).toBe(62.5);
    });

    it('should handle empty category array', () => {
      const result = composeBudgetPageResponse(6, 2025, []);

      expect(result.month).toBe(6);
      expect(result.year).toBe(2025);
      expect(result.categoryBudgets).toEqual([]);
      expect(result.summary.total_budgeted).toBe(0);
      expect(result.summary.total_spent).toBe(0);
    });
  });

  describe('Integration: Full calculation flow', () => {
    it('should handle realistic budget scenario', () => {
      // Simulate: 3 categories with budgets, 2 with spending
      const budgets = [
        {
          category_id: 1,
          category_name: 'Groceries',
          budgeted_amount: 300
        },
        {
          category_id: 2,
          category_name: 'Dining Out',
          budgeted_amount: 150
        },
        {
          category_id: 3,
          category_name: 'Entertainment',
          budgeted_amount: 100
        }
      ];

      const spending = new Map<number, CategorySpendingResult>([
        [1, { category_id: 1, total_spent: -250, transaction_count: 8 }],
        [2, { category_id: 2, total_spent: -175, transaction_count: 5 }]
      ]);

      // Step 1: Build items
      const items = buildCategoryBudgetItems(budgets, spending);

      // Step 2: Compose response
      const response = composeBudgetPageResponse(1, 2025, items);

      // Assertions
      expect(response.month).toBe(1);
      expect(response.year).toBe(2025);
      expect(response.categoryBudgets).toHaveLength(3);

      // Groceries: 300 budgeted, -250 spent (expenses are negative)
      // Remaining = 300 - (-250) = 550
      // Percentage = |(-250)| / 300 * 100 = 83.33%
      expect(response.categoryBudgets[0].remaining_amount).toBe(550);
      expect(response.categoryBudgets[0].percentage_used).toBeCloseTo(83.33, 2);

      // Dining: 150 budgeted, -175 spent (over budget)
      // Remaining = 150 - (-175) = 325
      // Percentage = |(-175)| / 150 * 100 = 116.67%
      expect(response.categoryBudgets[1].remaining_amount).toBe(325);
      expect(response.categoryBudgets[1].percentage_used).toBeCloseTo(116.67, 2);

      // Entertainment: 100 budgeted, 0 spent
      expect(response.categoryBudgets[2].remaining_amount).toBe(100);
      expect(response.categoryBudgets[2].percentage_used).toBe(0);

      // Summary: 550 total budgeted, -425 spent, 975 remaining
      // Remaining = 550 - (-425) = 975
      // Percentage = |(-425)| / 550 * 100 = 77.27%
      expect(response.summary.total_budgeted).toBe(550);
      expect(response.summary.total_spent).toBe(-425);
      expect(response.summary.total_remaining).toBe(975);
      expect(response.summary.overall_percentage_used).toBeCloseTo(77.27, 2);
    });
  });
});
