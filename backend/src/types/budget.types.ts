/**
 * Budget Page Data Transfer Object
 * 
 * Defines the response structure for the budget page view.
 * This DTO aggregates data from Budget, Category, and Transaction entities
 * to provide a comprehensive monthly budget overview.
 * 
 * DATA SOURCES:
 * - Budget: Monthly budget allocations (budgeted_amount)
 * - Category: Category names and metadata (category_id, category_name)
 * - Transaction: Actual spending data for calculation (spent_amount, remaining_amount)
 */

/**
 * Budget Page Response DTO
 * 
 * Represents a single month's budget overview with spending vs. budget data
 * for all categories that have budget allocations.
 */
export interface BudgetPageResponseDTO {
  /**
   * Budget month (1-12)
   * SOURCE: Budget.month
   */
  month: number;

  /**
   * Budget year (YYYY)
   * SOURCE: Budget.year
   */
  year: number;

  /**
   * Array of category budget items for the specified month/year
   */
  categoryBudgets: CategoryBudgetItemDTO[];

  /**
   * Summary totals for the entire budget period
   */
  summary: BudgetSummaryDTO;
}

/**
 * Category Budget Item DTO
 * 
 * Represents budget vs. actual spending for a single category in a given month/year.
 */
export interface CategoryBudgetItemDTO {
  /**
   * Category ID
   * SOURCE: Budget.category_id → Category.id
   */
  category_id: number;

  /**
   * Category name (e.g., "Groceries", "Dining Out")
   * SOURCE: Category.name
   */
  category_name: string;

  /**
   * Budgeted amount allocated for this category in this month/year
   * SOURCE: Budget.amount
   */
  budgeted_amount: number;

  /**
   * Total amount spent in this category during the month/year
   * SOURCE: Calculated from Transaction.amount
   * CALCULATION: SUM(transactions.amount) WHERE category_id = X AND date in month/year
   * NOTE: Transaction amounts are negative for expenses, so this will be absolute value
   */
  spent_amount: number;

  /**
   * Remaining budget (budgeted - spent)
   * SOURCE: Calculated
   * CALCULATION: budgeted_amount - spent_amount
   * NOTE: Positive value = under budget, negative value = over budget
   */
  remaining_amount: number;

  /**
   * Percentage of budget used (0-100+)
   * SOURCE: Calculated
   * CALCULATION: (spent_amount / budgeted_amount) * 100
   * NOTE: Can exceed 100% if over budget
   */
  percentage_used: number;
}

/**
 * Budget Summary DTO
 * 
 * Aggregated totals across all categories for the budget period.
 */
export interface BudgetSummaryDTO {
  /**
   * Total budgeted amount across all categories
   * SOURCE: Calculated
   * CALCULATION: SUM(Budget.amount) for all categories in month/year
   */
  total_budgeted: number;

  /**
   * Total amount spent across all categories
   * SOURCE: Calculated
   * CALCULATION: SUM(spent_amount) for all categories in month/year
   */
  total_spent: number;

  /**
   * Total remaining budget across all categories
   * SOURCE: Calculated
   * CALCULATION: total_budgeted - total_spent
   */
  total_remaining: number;

  /**
   * Overall budget usage percentage
   * SOURCE: Calculated
   * CALCULATION: (total_spent / total_budgeted) * 100
   */
  overall_percentage_used: number;
}

/**
 * Query Parameters for Budget Page Request
 * 
 * Defines the required parameters to fetch budget page data.
 */
export interface BudgetPageQueryParams {
  /**
   * User ID (UUID)
   * Used to filter budgets, categories, and transactions
   */
  userId: string;

  /**
   * Month to display (1-12)
   */
  month: number;

  /**
   * Year to display (YYYY)
   */
  year: number;
}

/**
 * IMPLEMENTATION NOTES (NOT TO BE IMPLEMENTED YET):
 * 
 * 1. Data Aggregation Strategy:
 *    - Fetch all budgets for user/month/year from Budget table
 *    - Join with Category table to get category names
 *    - Query Transaction table for spending data per category
 *    - Calculate spent_amount, remaining_amount, and percentage_used
 * 
 * 2. Transaction Query Considerations:
 *    - Filter by user_id, month/year range, and category_id
 *    - Use queryTransactions() from transaction-dal.ts
 *    - Handle transactions where category_id is NULL (uncategorized)
 *    - Consider only expenses (negative amounts) for spent_amount
 * 
 * 3. Edge Cases:
 *    - Categories with budget but no transactions (spent_amount = 0)
 *    - Transactions without budget (not shown on budget page)
 *    - Over-budget scenarios (percentage_used > 100%)
 *    - Zero budgets (handle division by zero in percentage calculation)
 * 
 * 4. Performance Optimization:
 *    - Consider caching calculated values
 *    - Use database indexes on transactions(user_id, date, category_id)
 *    - Batch queries where possible
 * 
 * 5. Future Enhancements:
 *    - Support for date range filtering (not just month/year)
 *    - Include uncategorized spending in summary
 *    - Budget rollover/carryover logic
 *    - Year-to-date comparisons
 */
