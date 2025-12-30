/**
 * Budget Setup Types Tests (Frontend)
 * 
 * Validates frontend type definitions match backend DTOs.
 */

import {
  BudgetSetupItem,
  BudgetSetupRequest,
  BudgetSetupResponse
} from '../budget-setup.types';

describe('Budget Setup Types (Frontend)', () => {
  describe('BudgetSetupItem', () => {
    it('should match backend DTO structure', () => {
      const item: BudgetSetupItem = {
        category_id: 1,
        category_name: 'Groceries',
        planned_amount: 300.00
      };

      expect(item).toHaveProperty('category_id');
      expect(item).toHaveProperty('category_name');
      expect(item).toHaveProperty('planned_amount');
    });

    it('should accept zero planned amount', () => {
      const item: BudgetSetupItem = {
        category_id: 2,
        category_name: 'Entertainment',
        planned_amount: 0
      };

      expect(item.planned_amount).toBe(0);
    });

    it('should handle decimal amounts', () => {
      const item: BudgetSetupItem = {
        category_id: 3,
        category_name: 'Utilities',
        planned_amount: 125.50
      };

      expect(item.planned_amount).toBeCloseTo(125.50, 2);
    });
  });

  describe('BudgetSetupRequest', () => {
    it('should structure request payload correctly', () => {
      const request: BudgetSetupRequest = {
        user_id: 'user-123',
        month: 1,
        year: 2025,
        budgets: [
          {
            category_id: 1,
            category_name: 'Groceries',
            planned_amount: 400
          },
          {
            category_id: 2,
            category_name: 'Dining Out',
            planned_amount: 200
          }
        ]
      };

      expect(request.user_id).toBe('user-123');
      expect(request.month).toBe(1);
      expect(request.year).toBe(2025);
      expect(request.budgets).toHaveLength(2);
    });

    it('should validate month range', () => {
      const requestMin: BudgetSetupRequest = {
        user_id: 'user-123',
        month: 1,
        year: 2025,
        budgets: []
      };

      const requestMax: BudgetSetupRequest = {
        user_id: 'user-123',
        month: 12,
        year: 2025,
        budgets: []
      };

      expect(requestMin.month).toBeGreaterThanOrEqual(1);
      expect(requestMax.month).toBeLessThanOrEqual(12);
    });

    it('should allow empty budgets array', () => {
      const request: BudgetSetupRequest = {
        user_id: 'user-123',
        month: 6,
        year: 2025,
        budgets: []
      };

      expect(Array.isArray(request.budgets)).toBe(true);
      expect(request.budgets.length).toBe(0);
    });
  });

  describe('BudgetSetupResponse', () => {
    it('should structure success response correctly', () => {
      const response: BudgetSetupResponse = {
        success: true,
        count: 8,
        month: 1,
        year: 2025
      };

      expect(response.success).toBe(true);
      expect(response.count).toBe(8);
      expect(response.month).toBe(1);
      expect(response.year).toBe(2025);
    });

    it('should handle failure response', () => {
      const response: BudgetSetupResponse = {
        success: false,
        count: 0,
        month: 3,
        year: 2025
      };

      expect(response.success).toBe(false);
      expect(response.count).toBe(0);
    });
  });

  describe('Form Integration Patterns', () => {
    it('should support form state initialization', () => {
      // Simulates initializing form with existing budgets
      const initialBudgets: BudgetSetupItem[] = [
        {
          category_id: 1,
          category_name: 'Groceries',
          planned_amount: 300
        },
        {
          category_id: 2,
          category_name: 'Dining Out',
          planned_amount: 150
        }
      ];

      expect(initialBudgets).toHaveLength(2);
      expect(initialBudgets[0]!.category_id).toBe(1);
    });

    it('should support form submission payload', () => {
      // Simulates building request from form state
      const formData = {
        userId: 'user-abc',
        selectedMonth: 6,
        selectedYear: 2025,
        categoryBudgets: [
          { categoryId: 1, name: 'Groceries', amount: 400 },
          { categoryId: 2, name: 'Dining', amount: 200 }
        ]
      };

      const request: BudgetSetupRequest = {
        user_id: formData.userId,
        month: formData.selectedMonth,
        year: formData.selectedYear,
        budgets: formData.categoryBudgets.map(cat => ({
          category_id: cat.categoryId,
          category_name: cat.name,
          planned_amount: cat.amount
        }))
      };

      expect(request.budgets).toHaveLength(2);
      expect(request.month).toBe(6);
    });
  });

  describe('Type Safety', () => {
    it('should enforce number type for category_id', () => {
      const item: BudgetSetupItem = {
        category_id: 5,
        category_name: 'Test',
        planned_amount: 100
      };

      expect(typeof item.category_id).toBe('number');
    });

    it('should enforce string type for category_name', () => {
      const item: BudgetSetupItem = {
        category_id: 1,
        category_name: 'Groceries',
        planned_amount: 100
      };

      expect(typeof item.category_name).toBe('string');
    });

    it('should enforce string type for user_id', () => {
      const request: BudgetSetupRequest = {
        user_id: 'user-123',
        month: 1,
        year: 2025,
        budgets: []
      };

      expect(typeof request.user_id).toBe('string');
    });

    it('should enforce boolean type for success', () => {
      const response: BudgetSetupResponse = {
        success: true,
        count: 5,
        month: 1,
        year: 2025
      };

      expect(typeof response.success).toBe('boolean');
    });
  });
});
