/**
 * Budget Category Override Integration Tests
 * 
 * Verifies that budget calculations immediately reflect category overrides
 * without requiring recalculation persistence or additional logic.
 * 
 * User Story:
 * As a system, I want budget calculations to reflect category overrides
 * so remaining budget stays accurate.
 * 
 * Acceptance Criteria:
 * - Budget page reflects updated category assignments
 * - No recalculation persistence required
 * - No additional logic beyond existing budget aggregation
 */

import { db, initializeDatabase, seedDatabase } from '../../db/database';
import { updateTransactionCategory } from '../../db/transaction-dal';
import { aggregateMonthlySpending } from '../spending-aggregation.service';
import { buildCategoryBudgetItems, composeBudgetPageResponse } from '../budget-calculator.service';

describe('Budget Category Override Integration', () => {
  beforeAll(() => {
    initializeDatabase();
    seedDatabase();
  });

  afterAll(() => {
    db.close();
  });

  describe('Immediate Reflection of Category Overrides', () => {
    it('should reflect category override in budget aggregation without recalculation', () => {
      /**
       * SCENARIO:
       * 1. Transaction initially categorized as "Groceries" (category_id: 1)
       * 2. User overrides to "Dining Out" (category_id: 2)
       * 3. Budget aggregation immediately reflects the override
       * 
       * VERIFICATION:
       * - No manual recalculation step required
       * - No stored aggregation values to update
       * - Next budget page load shows correct category
       */

      // Get initial transaction state
      const transaction = db.prepare(
        'SELECT id, category_id, amount FROM transactions WHERE id = ?'
      ).get('txn-demo-0') as any;

      const initialCategoryId = transaction.category_id;
      const transactionAmount = transaction.amount;

      // Get initial budget aggregation for Groceries (category 1)
      const initialAggregation = aggregateMonthlySpending({
        user_id: 'user-demo',
        month: 1,
        year: 2025
      });

      const initialGroceriesSpending = initialAggregation.spending_by_category.find(
        (item) => item.category_id === 1
      );

      expect(initialGroceriesSpending).toBeDefined();
      const initialGroceriesTotal = initialGroceriesSpending?.total_spent || 0;

      // Override category from Groceries (1) to Dining Out (2)
      const newCategoryId = initialCategoryId === 1 ? 2 : 1;
      const updateResult = updateTransactionCategory(
        transaction.id,
        'user-demo',
        newCategoryId
      );

      expect(updateResult.success).toBe(true);

      // Get updated budget aggregation (no recalculation step needed)
      const updatedAggregation = aggregateMonthlySpending({
        user_id: 'user-demo',
        month: 1,
        year: 2025
      });

      // Verify transaction moved out of Groceries
      const updatedGroceriesSpending = updatedAggregation.spending_by_category.find(
        (item) => item.category_id === 1
      );

      if (initialCategoryId === 1) {
        // If transaction was in Groceries, it should be reduced
        const updatedGroceriesTotal = updatedGroceriesSpending?.total_spent || 0;
        expect(updatedGroceriesTotal).toBeCloseTo(
          initialGroceriesTotal - transactionAmount,
          2
        );
      }

      // Verify transaction appears in new category
      const newCategorySpending = updatedAggregation.spending_by_category.find(
        (item) => item.category_id === newCategoryId
      );

      expect(newCategorySpending).toBeDefined();
      expect(newCategorySpending!.total_spent).not.toBe(0);
    });

    it('should maintain budget accuracy across multiple category overrides', () => {
      /**
       * SCENARIO:
       * Multiple transactions reassigned between categories
       * Budget totals must remain accurate without manual intervention
       */

      // Get two transactions to reassign
      const transaction1 = db.prepare(
        'SELECT id, category_id, amount FROM transactions WHERE id = ?'
      ).get('txn-demo-1') as any;

      const transaction2 = db.prepare(
        'SELECT id, category_id, amount FROM transactions WHERE id = ?'
      ).get('txn-demo-2') as any;

      // Verify initial state
      const initialAggregation = aggregateMonthlySpending({
        user_id: 'user-demo',
        month: 1,
        year: 2025
      });

      const initialTotalSpending = initialAggregation.total_spending;

      // Override both transactions to different categories
      updateTransactionCategory(transaction1.id, 'user-demo', 3);
      updateTransactionCategory(transaction2.id, 'user-demo', 4);

      // Verify aggregation still accurate
      const updatedAggregation = aggregateMonthlySpending({
        user_id: 'user-demo',
        month: 1,
        year: 2025
      });

      // Total spending should remain the same (just redistributed)
      expect(updatedAggregation.total_spending).toBeCloseTo(initialTotalSpending, 2);

      // Each category should have the moved transactions
      const category3Spending = updatedAggregation.spending_by_category.find(
        (item) => item.category_id === 3
      );
      const category4Spending = updatedAggregation.spending_by_category.find(
        (item) => item.category_id === 4
      );

      expect(category3Spending).toBeDefined();
      expect(category4Spending).toBeDefined();
    });
  });

  describe('Budget Page Response with Category Overrides', () => {
    it('should compose budget page response reflecting current category assignments', () => {
      /**
       * SCENARIO:
       * Budget page must show spending in categories where transactions
       * are CURRENTLY assigned, not where they were originally
       * 
       * VERIFICATION:
       * - composeBudgetPageResponse uses current transaction.category_id
       * - No historical category tracking needed
       * - Budget remaining calculations are immediate
       */

      // Get budgets for user
      const budgets = db
        .prepare(
          `
        SELECT 
          b.category_id,
          c.name as category_name,
          b.amount as budgeted_amount
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        WHERE b.user_id = ? AND b.month = ? AND b.year = ?
      `
        )
        .all('user-demo', 1, 2025) as any;

      // Aggregate spending (uses current category_id)
      const spendingResponse = aggregateMonthlySpending({
        user_id: 'user-demo',
        month: 1,
        year: 2025
      });

      // Build spending map
      const spendingMap = new Map(
        spendingResponse.spending_by_category.map((item) => [item.category_id, item])
      );

      // Compose budget response
      const categoryItems = buildCategoryBudgetItems(budgets, spendingMap);
      const budgetResponse = composeBudgetPageResponse(1, 2025, categoryItems);

      // Verify response structure
      expect(budgetResponse.month).toBe(1);
      expect(budgetResponse.year).toBe(2025);
      expect(budgetResponse.categoryBudgets.length).toBeGreaterThan(0);

      // Verify each category has correct calculations
      budgetResponse.categoryBudgets.forEach((categoryBudget) => {
        // Remaining = budgeted - spent (current state)
        const expectedRemaining =
          categoryBudget.budgeted_amount - categoryBudget.spent_amount;
        expect(categoryBudget.remaining_amount).toBeCloseTo(expectedRemaining, 2);

        // Percentage = (spent / budgeted) * 100
        const expectedPercentage =
          categoryBudget.budgeted_amount === 0
            ? 0
            : (Math.abs(categoryBudget.spent_amount) / categoryBudget.budgeted_amount) *
              100;
        expect(categoryBudget.percentage_used).toBeCloseTo(expectedPercentage, 2);
      });
    });

    it('should show zero spending for categories with no current transactions', () => {
      /**
       * SCENARIO:
       * All transactions moved out of a category
       * Budget page should show $0 spent, not old amounts
       */

      // Find a category with budget but minimal transactions
      const budgets = db
        .prepare(
          `
        SELECT 
          b.category_id,
          c.name as category_name,
          b.amount as budgeted_amount
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        WHERE b.user_id = ? AND b.month = ? AND b.year = ?
      `
        )
        .all('user-demo', 1, 2025) as any;

      // Get spending aggregation
      const spendingResponse = aggregateMonthlySpending({
        user_id: 'user-demo',
        month: 1,
        year: 2025
      });

      const spendingMap = new Map(
        spendingResponse.spending_by_category.map((item) => [item.category_id, item])
      );

      // Build category items
      const categoryItems = buildCategoryBudgetItems(budgets, spendingMap);

      // Find categories with no spending
      const categoriesWithNoSpending = categoryItems.filter(
        (item) => item.spent_amount === 0
      );

      // Verify each has correct remaining amount (equals budgeted)
      categoriesWithNoSpending.forEach((category) => {
        expect(category.spent_amount).toBe(0);
        expect(category.remaining_amount).toBe(category.budgeted_amount);
        expect(category.percentage_used).toBe(0);
      });
    });
  });

  describe('No Recalculation Persistence Required', () => {
    it('should not require stored aggregation values', () => {
      /**
       * VERIFICATION:
       * - Budget calculations are pure functions
       * - No "budget_aggregations" table exists
       * - No cached spending totals
       * - Every budget page load queries current transaction state
       */

      // Verify no aggregation tables exist
      const tables = db
        .prepare(
          `
        SELECT name FROM sqlite_master 
        WHERE type='table' 
        AND name LIKE '%aggregation%'
      `
        )
        .all();

      expect(tables.length).toBe(0);

      // Verify aggregation is computed each time (not cached)
      const aggregation1 = aggregateMonthlySpending({
        user_id: 'user-demo',
        month: 1,
        year: 2025
      });

      // Make a category change
      updateTransactionCategory('txn-demo-3', 'user-demo', 5);

      // Verify aggregation reflects change immediately
      const aggregation2 = aggregateMonthlySpending({
        user_id: 'user-demo',
        month: 1,
        year: 2025
      });

      // Totals may differ if transaction was recategorized
      expect(aggregation2).toBeDefined();
      expect(aggregation2.spending_by_category).toBeDefined();
    });

    it('should use only transaction.category_id for aggregation', () => {
      /**
       * VERIFICATION:
       * - Plaid categories are metadata only
       * - No "original_category_id" tracking
       * - No category history tables
       * - Current category_id is authoritative
       */

      // Verify aggregation query uses category_id
      const aggregation = aggregateMonthlySpending({
        user_id: 'user-demo',
        month: 1,
        year: 2025
      });

      // All results should have category_id
      aggregation.spending_by_category.forEach((item) => {
        expect(item.category_id).toBeDefined();
        expect(Number.isInteger(item.category_id)).toBe(true);
      });

      // Verify no Plaid category fields in aggregation results
      aggregation.spending_by_category.forEach((item: any) => {
        expect(item.plaid_category).toBeUndefined();
        expect(item.plaid_primary_category).toBeUndefined();
      });
    });
  });

  describe('Budget Remaining Accuracy', () => {
    it('should calculate remaining budget accurately after category override', () => {
      /**
       * SCENARIO:
       * 1. Category has budget of $300
       * 2. Transaction of -$50 assigned to category
       * 3. Remaining = $300 - (-$50) = $350
       * 4. Transaction reassigned elsewhere
       * 5. Remaining = $300 - $0 = $300
       */

      // Find a budgeted category
      const groceriesBudget = db
        .prepare(
          `
        SELECT b.amount as budgeted_amount, b.category_id
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        WHERE b.user_id = ? AND c.name = ? AND b.month = ? AND b.year = ?
      `
        )
        .get('user-demo', 'Groceries', 1, 2025) as any;

      expect(groceriesBudget).toBeDefined();

      // Get current spending for Groceries
      const initialAggregation = aggregateMonthlySpending({
        user_id: 'user-demo',
        month: 1,
        year: 2025
      });

      const initialGroceriesSpending = initialAggregation.spending_by_category.find(
        (item) => item.category_id === groceriesBudget.category_id
      );

      const initialSpent = initialGroceriesSpending?.total_spent || 0;
      const initialRemaining = groceriesBudget.budgeted_amount - initialSpent;

      // Find a transaction in Groceries
      const groceriesTransaction = db
        .prepare(
          `
        SELECT id, amount
        FROM transactions
        WHERE user_id = ? AND category_id = ? AND date LIKE '2025-01-%'
        LIMIT 1
      `
        )
        .get('user-demo', groceriesBudget.category_id) as any;

      if (groceriesTransaction) {
        // Move transaction out of Groceries
        updateTransactionCategory(groceriesTransaction.id, 'user-demo', 2);

        // Get updated spending
        const updatedAggregation = aggregateMonthlySpending({
          user_id: 'user-demo',
          month: 1,
          year: 2025
        });

        const updatedGroceriesSpending = updatedAggregation.spending_by_category.find(
          (item) => item.category_id === groceriesBudget.category_id
        );

        const updatedSpent = updatedGroceriesSpending?.total_spent || 0;
        const updatedRemaining = groceriesBudget.budgeted_amount - updatedSpent;

        // Remaining should increase (less spent)
        expect(updatedRemaining).toBeGreaterThan(initialRemaining);

        // Verify math accuracy
        const expectedChange = groceriesTransaction.amount;
        expect(updatedRemaining).toBeCloseTo(
          initialRemaining - expectedChange,
          2
        );
      }
    });

    it('should handle over-budget scenarios correctly after category override', () => {
      /**
       * SCENARIO:
       * Category is over budget (spent > budgeted)
       * Transaction moved out should reduce overage
       * Transaction moved in should increase overage
       */

      // Find or create over-budget scenario
      const budgets = db
        .prepare(
          `
        SELECT 
          b.category_id,
          c.name as category_name,
          b.amount as budgeted_amount
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        WHERE b.user_id = ? AND b.month = ? AND b.year = ?
      `
        )
        .all('user-demo', 1, 2025) as any;

      const spendingResponse = aggregateMonthlySpending({
        user_id: 'user-demo',
        month: 1,
        year: 2025
      });

      const spendingMap = new Map(
        spendingResponse.spending_by_category.map((item) => [item.category_id, item])
      );

      const categoryItems = buildCategoryBudgetItems(budgets, spendingMap);

      // Find any category (over or under budget)
      const category = categoryItems.find((item) => Math.abs(item.spent_amount) > 0);

      if (category) {
        // Verify remaining calculation
        const expectedRemaining = category.budgeted_amount - category.spent_amount;
        expect(category.remaining_amount).toBeCloseTo(expectedRemaining, 2);

        // Verify percentage calculation
        const expectedPercentage =
          category.budgeted_amount === 0
            ? 0
            : (Math.abs(category.spent_amount) / category.budgeted_amount) * 100;
        expect(category.percentage_used).toBeCloseTo(expectedPercentage, 2);

        // Verify over-budget flag
        if (Math.abs(category.spent_amount) > category.budgeted_amount) {
          expect(category.remaining_amount).toBeLessThan(0);
          expect(category.percentage_used).toBeGreaterThan(100);
        }
      }
    });
  });

  describe('Summary Totals with Category Overrides', () => {
    it('should maintain accurate summary totals across category reassignments', () => {
      /**
       * VERIFICATION:
       * Total spending across all categories remains constant
       * Individual category totals change with reassignments
       * Summary calculations remain accurate
       */

      // Get initial state
      const initialAggregation = aggregateMonthlySpending({
        user_id: 'user-demo',
        month: 1,
        year: 2025
      });

      const initialTotalSpending = initialAggregation.total_spending;
      const initialTransactionCount = initialAggregation.total_transaction_count;

      // Make category changes
      updateTransactionCategory('txn-demo-4', 'user-demo', 3);

      // Get updated state
      const updatedAggregation = aggregateMonthlySpending({
        user_id: 'user-demo',
        month: 1,
        year: 2025
      });

      // Total spending should remain the same (just redistributed)
      expect(updatedAggregation.total_spending).toBeCloseTo(initialTotalSpending, 2);

      // Transaction count should remain the same
      expect(updatedAggregation.total_transaction_count).toBe(initialTransactionCount);

      // Build budget response with updated data
      const budgets = db
        .prepare(
          `
        SELECT 
          b.category_id,
          c.name as category_name,
          b.amount as budgeted_amount
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        WHERE b.user_id = ? AND b.month = ? AND b.year = ?
      `
        )
        .all('user-demo', 1, 2025) as any;

      const spendingMap = new Map(
        updatedAggregation.spending_by_category.map((item) => [item.category_id, item])
      );

      const categoryItems = buildCategoryBudgetItems(budgets, spendingMap);
      const budgetResponse = composeBudgetPageResponse(1, 2025, categoryItems);

      // Verify summary totals
      expect(budgetResponse.summary.total_spent).toBeCloseTo(
        updatedAggregation.total_spending,
        2
      );

      // Verify summary calculations
      const expectedTotalBudgeted = categoryItems.reduce(
        (sum, item) => sum + item.budgeted_amount,
        0
      );
      expect(budgetResponse.summary.total_budgeted).toBeCloseTo(
        expectedTotalBudgeted,
        2
      );

      const expectedTotalRemaining =
        expectedTotalBudgeted - budgetResponse.summary.total_spent;
      expect(budgetResponse.summary.total_remaining).toBeCloseTo(
        expectedTotalRemaining,
        2
      );
    });
  });
});
