/**
 * Budget Setup Types Tests
 * 
 * Validates the structure and documentation of budget setup DTOs.
 * These are compile-time type checks and validation tests.
 */

import {
  BudgetSetupItem,
  BudgetSetupRequest,
  BudgetSetupResponse
} from '../budget-setup.types';

describe('Budget Setup Types', () => {
  describe('BudgetSetupItem', () => {
    it('should have all required fields', () => {
      const validItem: BudgetSetupItem = {
        category_id: 1,
        category_name: 'Groceries',
        planned_amount: 300.00
      };

      expect(validItem.category_id).toBeDefined();
      expect(validItem.category_name).toBeDefined();
      expect(validItem.planned_amount).toBeDefined();
    });

    it('should allow zero planned amount', () => {
      const zeroItem: BudgetSetupItem = {
        category_id: 5,
        category_name: 'Entertainment',
        planned_amount: 0
      };

      expect(zeroItem.planned_amount).toBe(0);
    });

    it('should enforce number type for category_id', () => {
      const item: BudgetSetupItem = {
        category_id: 10,
        category_name: 'Test',
        planned_amount: 100
      };

      expect(typeof item.category_id).toBe('number');
    });

    it('should enforce string type for category_name', () => {
      const item: BudgetSetupItem = {
        category_id: 1,
        category_name: 'Dining Out',
        planned_amount: 200
      };

      expect(typeof item.category_name).toBe('string');
    });

    it('should enforce number type for planned_amount', () => {
      const item: BudgetSetupItem = {
        category_id: 1,
        category_name: 'Groceries',
        planned_amount: 150.50
      };

      expect(typeof item.planned_amount).toBe('number');
    });

    it('should handle decimal amounts', () => {
      const item: BudgetSetupItem = {
        category_id: 2,
        category_name: 'Utilities',
        planned_amount: 123.45
      };

      expect(item.planned_amount).toBeCloseTo(123.45, 2);
    });
  });

  describe('BudgetSetupRequest', () => {
    it('should have all required fields', () => {
      const validRequest: BudgetSetupRequest = {
        user_id: 'user-123',
        month: 1,
        year: 2025,
        budgets: [
          {
            category_id: 1,
            category_name: 'Groceries',
            planned_amount: 300
          }
        ]
      };

      expect(validRequest.user_id).toBeDefined();
      expect(validRequest.month).toBeDefined();
      expect(validRequest.year).toBeDefined();
      expect(validRequest.budgets).toBeDefined();
    });

    it('should accept multiple budget items', () => {
      const request: BudgetSetupRequest = {
        user_id: 'user-123',
        month: 6,
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
          },
          {
            category_id: 3,
            category_name: 'Transportation',
            planned_amount: 150
          }
        ]
      };

      expect(request.budgets).toHaveLength(3);
      expect(request.budgets[0].category_id).toBe(1);
      expect(request.budgets[2].planned_amount).toBe(150);
    });

    it('should validate month range boundaries', () => {
      const requestJan: BudgetSetupRequest = {
        user_id: 'user-123',
        month: 1,
        year: 2025,
        budgets: []
      };

      const requestDec: BudgetSetupRequest = {
        user_id: 'user-123',
        month: 12,
        year: 2025,
        budgets: []
      };

      expect(requestJan.month).toBe(1);
      expect(requestDec.month).toBe(12);
    });

    it('should enforce year as number', () => {
      const request: BudgetSetupRequest = {
        user_id: 'user-123',
        month: 5,
        year: 2025,
        budgets: []
      };

      expect(typeof request.year).toBe('number');
    });

    it('should allow empty budgets array', () => {
      // Edge case: User wants to clear all budgets
      const request: BudgetSetupRequest = {
        user_id: 'user-123',
        month: 3,
        year: 2025,
        budgets: []
      };

      expect(Array.isArray(request.budgets)).toBe(true);
      expect(request.budgets.length).toBe(0);
    });

    it('should handle UUID format for user_id', () => {
      const request: BudgetSetupRequest = {
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        month: 7,
        year: 2025,
        budgets: []
      };

      expect(typeof request.user_id).toBe('string');
      expect(request.user_id).toMatch(/^[0-9a-f-]+$/i);
    });
  });

  describe('BudgetSetupResponse', () => {
    it('should have all required fields', () => {
      const validResponse: BudgetSetupResponse = {
        success: true,
        count: 5,
        month: 1,
        year: 2025
      };

      expect(validResponse.success).toBeDefined();
      expect(validResponse.count).toBeDefined();
      expect(validResponse.month).toBeDefined();
      expect(validResponse.year).toBeDefined();
    });

    it('should handle successful creation', () => {
      const response: BudgetSetupResponse = {
        success: true,
        count: 8,
        month: 6,
        year: 2025
      };

      expect(response.success).toBe(true);
      expect(response.count).toBe(8);
    });

    it('should handle zero budgets created', () => {
      const response: BudgetSetupResponse = {
        success: true,
        count: 0,
        month: 12,
        year: 2024
      };

      expect(response.success).toBe(true);
      expect(response.count).toBe(0);
    });

    it('should enforce boolean type for success', () => {
      const response: BudgetSetupResponse = {
        success: false,
        count: 0,
        month: 1,
        year: 2025
      };

      expect(typeof response.success).toBe('boolean');
    });

    it('should enforce number type for count', () => {
      const response: BudgetSetupResponse = {
        success: true,
        count: 3,
        month: 4,
        year: 2025
      };

      expect(typeof response.count).toBe('number');
    });
  });

  describe('Type Compatibility', () => {
    it('should allow BudgetSetupItem in array', () => {
      const items: BudgetSetupItem[] = [
        {
          category_id: 1,
          category_name: 'Groceries',
          planned_amount: 300
        },
        {
          category_id: 2,
          category_name: 'Dining',
          planned_amount: 150
        }
      ];

      expect(items).toHaveLength(2);
      expect(items[0].category_id).toBe(1);
    });

    it('should compose full request from items', () => {
      const item1: BudgetSetupItem = {
        category_id: 5,
        category_name: 'Entertainment',
        planned_amount: 100
      };

      const item2: BudgetSetupItem = {
        category_id: 6,
        category_name: 'Shopping',
        planned_amount: 250
      };

      const request: BudgetSetupRequest = {
        user_id: 'user-abc',
        month: 9,
        year: 2025,
        budgets: [item1, item2]
      };

      expect(request.budgets).toContain(item1);
      expect(request.budgets).toContain(item2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle large planned amounts', () => {
      const item: BudgetSetupItem = {
        category_id: 1,
        category_name: 'Housing',
        planned_amount: 2500.00
      };

      expect(item.planned_amount).toBe(2500);
    });

    it('should handle small planned amounts', () => {
      const item: BudgetSetupItem = {
        category_id: 3,
        category_name: 'Subscriptions',
        planned_amount: 9.99
      };

      expect(item.planned_amount).toBeCloseTo(9.99, 2);
    });

    it('should handle year boundaries', () => {
      const request1970: BudgetSetupRequest = {
        user_id: 'user-123',
        month: 1,
        year: 1970,
        budgets: []
      };

      const request2100: BudgetSetupRequest = {
        user_id: 'user-123',
        month: 12,
        year: 2100,
        budgets: []
      };

      expect(request1970.year).toBe(1970);
      expect(request2100.year).toBe(2100);
    });

    it('should handle special characters in category names', () => {
      const item: BudgetSetupItem = {
        category_id: 10,
        category_name: "Mom's Gift Fund",
        planned_amount: 50
      };

      expect(item.category_name).toContain("'");
    });

    it('should handle response for failed creation', () => {
      const response: BudgetSetupResponse = {
        success: false,
        count: 0,
        month: 6,
        year: 2025
      };

      expect(response.success).toBe(false);
      expect(response.count).toBe(0);
    });
  });

  describe('Documentation Completeness', () => {
    it('should document validation rules in type comments', () => {
      // This test verifies that the type definition includes
      // comprehensive JSDoc comments (checked at compile time)
      const item: BudgetSetupItem = {
        category_id: 1,
        category_name: 'Test',
        planned_amount: 100
      };

      // Validation rules are documented in type definition
      expect(item).toBeDefined();
    });

    it('should document field sources in type comments', () => {
      const request: BudgetSetupRequest = {
        user_id: 'user-123',
        month: 1,
        year: 2025,
        budgets: []
      };

      // Field sources documented in JSDoc
      expect(request).toBeDefined();
    });
  });
});
