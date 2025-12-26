/**
 * Budget Calculator Service
 *
 * Computes remaining budget dynamically based on budgeted amounts and actual spending.
 * Pure calculation layer - no database writes, no side effects, no persistence.
 *
 * Formula: Remaining = budgeted_amount - spent_amount
 */

import { CategorySpendingResult } from './spending-aggregation.service';
import {
  BudgetPageResponseDTO,
  CategoryBudgetItemDTO,
  BudgetSummaryDTO
} from '../types/budget.types';

/**
 * Calculate remaining budget for a single category
 *
 * Remaining = budgeted_amount - spent_amount
 *
 * @param budgetedAmount - Amount allocated for the category
 * @param spentAmount - Total amount spent in the category
 * @returns Remaining budget (positive = under budget, negative = over budget)
 */
export function calculateCategoryRemaining(
  budgetedAmount: number,
  spentAmount: number
): number {
  return budgetedAmount - spentAmount;
}

/**
 * Calculate percentage of budget used
 *
 * Percentage = (spent_amount / budgeted_amount) * 100
 *
 * @param spentAmount - Total amount spent
 * @param budgetedAmount - Amount allocated
 * @returns Percentage used (0-100+)
 */
export function calculatePercentageUsed(
  spentAmount: number,
  budgetedAmount: number
): number {
  if (budgetedAmount === 0) return 0;
  return (Math.abs(spentAmount) / budgetedAmount) * 100;
}

/**
 * Build category budget items from budgets and spending data
 *
 * Combines budget allocations with actual spending to calculate remaining amounts.
 * Handles categories with no transactions gracefully (defaults spent_amount to 0).
 *
 * @param budgets - Array of budget items with amounts and category info
 * @param spending - Map of category_id to spending results
 * @returns Array of category budget items with remaining calculations
 */
export function buildCategoryBudgetItems(
  budgets: Array<{
    category_id: number;
    category_name: string;
    budgeted_amount: number;
  }>,
  spending: Map<number, CategorySpendingResult>
): CategoryBudgetItemDTO[] {
  return budgets.map((budget) => {
    const spendingData = spending.get(budget.category_id);
    const spentAmount = spendingData?.total_spent ?? 0;

    const remainingAmount = calculateCategoryRemaining(
      budget.budgeted_amount,
      spentAmount
    );

    const percentageUsed = calculatePercentageUsed(
      spentAmount,
      budget.budgeted_amount
    );

    return {
      category_id: budget.category_id,
      category_name: budget.category_name,
      budgeted_amount: budget.budgeted_amount,
      spent_amount: spentAmount,
      remaining_amount: remainingAmount,
      percentage_used: percentageUsed
    };
  });
}

/**
 * Calculate budget summary totals
 *
 * Aggregates all category items to produce overall budget statistics.
 *
 * @param categoryItems - Array of category budget items
 * @returns Summary with totals and overall percentage
 */
export function calculateBudgetSummary(
  categoryItems: CategoryBudgetItemDTO[]
): BudgetSummaryDTO {
  const totalBudgeted = categoryItems.reduce(
    (sum, item) => sum + item.budgeted_amount,
    0
  );

  const totalSpent = categoryItems.reduce(
    (sum, item) => sum + item.spent_amount,
    0
  );

  const totalRemaining = calculateCategoryRemaining(totalBudgeted, totalSpent);

  const overallPercentageUsed = calculatePercentageUsed(
    totalSpent,
    totalBudgeted
  );

  return {
    total_budgeted: totalBudgeted,
    total_spent: totalSpent,
    total_remaining: totalRemaining,
    overall_percentage_used: overallPercentageUsed
  };
}

/**
 * Compose complete budget page response
 *
 * Combines category items and summary into the final DTO.
 * Pure calculation - no database calls or side effects.
 *
 * @param month - Budget month (1-12)
 * @param year - Budget year (YYYY)
 * @param categoryItems - Calculated category budget items
 * @returns Complete budget page response DTO
 */
export function composeBudgetPageResponse(
  month: number,
  year: number,
  categoryItems: CategoryBudgetItemDTO[]
): BudgetPageResponseDTO {
  return {
    month,
    year,
    categoryBudgets: categoryItems,
    summary: calculateBudgetSummary(categoryItems)
  };
}
