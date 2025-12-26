/**
 * Spending Aggregation Service
 * 
 * Aggregates transaction amounts by category for a given user and time period.
 * Handles both expenses (negative amounts) and refunds/credits (positive amounts).
 * 
 * CATEGORY SOURCING STRATEGY:
 * ═════════════════════════════════════════════════════════════════
 * 
 * AUTHORITATIVE SOURCE: transaction.category_id
 * - Represents the user's categorization decision
 * - May be set by user manually or from per-transaction overrides
 * - Is the ONLY field used for aggregation and budget calculations
 * 
 * METADATA ONLY: Plaid category fields (plaid_category, plaid_primary_category)
 * - Provided by Plaid as enrichment data
 * - Used for display/suggestions only, NOT for aggregation
 * - Never used in SUM/GROUP BY clauses
 * - A transaction can have plaid_category but different category_id
 * - Rationale: User's explicit categorization takes precedence
 * 
 * PER-TRANSACTION OVERRIDES:
 * - User can override transaction.category_id at any time
 * - This change is respected immediately in aggregations
 * - No mapping tables or rules needed
 * - Historical aggregations reflect the current category_id
 * 
 * NOTE: This service does NOT:
 * - Calculate budgets or remaining amounts
 * - Use Plaid categories for aggregation (metadata only)
 * - Perform budget comparisons
 * - Include rule engines or mapping tables
 * - Apply per-transaction overrides (assumes DB reflects current state)
 */

/**
 * Spending by Category Result
 * 
 * Represents aggregated spending for a single category in a time period.
 */
export interface CategorySpendingResult {
  /**
   * Category ID from Transaction table
   * SOURCE: Transaction.category_id (authoritative user categorization)
   * 
   * NOTE: This is NOT the Plaid category. It's the user's category assignment,
   * which may differ from Plaid's suggestion if user overrode it.
   */
  category_id: number;

  /**
   * Total amount spent in this category
   * CALCULATION: SUM(Transaction.amount) WHERE category_id = X AND date in range
   * 
   * NOTE: 
   * - Expenses are negative values (e.g., -50.00)
   * - Refunds/credits are positive values (e.g., +25.00)
   * - Net spending = sum of all amounts (refunds reduce the total)
   * - Only uses Transaction.category_id, never Plaid categories
   */
  total_spent: number;

  /**
   * Number of transactions in this category
   * CALCULATION: COUNT(Transaction) WHERE category_id = X AND date in range
   * NOTE: Uses Transaction.category_id, respecting all per-transaction overrides
   */
  transaction_count: number;
}

/**
 * Query Parameters for Spending Aggregation
 */
export interface SpendingAggregationParams {
  /**
   * User ID to filter transactions
   */
  user_id: string;

  /**
   * Month to aggregate (1-12)
   */
  month: number;

  /**
   * Year to aggregate (YYYY)
   */
  year: number;
}

/**
 * Spending Aggregation Response
 * 
 * Contains all category spending totals for the specified time period.
 */
export interface SpendingAggregationResponse {
  /**
   * Month of aggregated data (1-12)
   */
  month: number;

  /**
   * Year of aggregated data (YYYY)
   */
  year: number;

  /**
   * Array of spending totals by category
   * Categories with no transactions in the period will not appear
   * 
   * NOTE: Each category_id here reflects Transaction.category_id (user's choice),
   * not Plaid's categorization. If user overrode a transaction's category,
   * it's counted in the user's chosen category, not Plaid's suggestion.
   */
  spending_by_category: CategorySpendingResult[];

  /**
   * Total spending across all categories
   * CALCULATION: SUM(total_spent) for all categories
   * NOTE: Includes effect of refunds/credits
   */
  total_spending: number;

  /**
   * Total number of transactions processed
   */
  total_transaction_count: number;
}

/**
 * Aggregate monthly spending by category
 * 
 * Queries all transactions for a user in a given month/year and groups
 * by category_id, summing the amounts.
 * 
 * IMPLEMENTATION NOTES (NOT IMPLEMENTED IN THIS TICKET):
 * 
 * 1. Date Range Calculation:
 *    - Start date: First day of month (YYYY-MM-01)
 *    - End date: Last day of month (YYYY-MM-DD where DD = days in month)
 *    - Use moment.js or date-fns for date manipulation
 * 
 * 2. SQL Query Pattern (if using SQL):
 *    ```sql
 *    SELECT 
 *      category_id,
 *      SUM(amount) as total_spent,
 *      COUNT(*) as transaction_count
 *    FROM transactions
 *    WHERE user_id = ? 
 *      AND date >= ?
 *      AND date < ?
 *      AND category_id IS NOT NULL
 *    GROUP BY category_id
 *    ORDER BY category_id
 *    ```
 * 
 * 3. Amount Handling:
 *    - Expenses: Typically negative (e.g., -50.00)
 *    - Income/Refunds: Typically positive (e.g., +25.00)
 *    - Sum directly: SUM(-50 + 25) = -25 (net spending)
 *    - Do NOT use ABS() - preserve signs for proper refund handling
 * 
 * 4. Uncategorized Transactions:
 *    - Transactions with category_id = NULL are EXCLUDED
 *    - They will not appear in spending_by_category array
 *    - They will not contribute to total_spending
 *    - To include them, add a separate query or include NULL handling
 * 
 * 5. Empty Results:
 *    - If no transactions found: return empty array with total_spending = 0
 *    - If user has transactions but none in date range: same behavior
 * 
 * 6. Performance Considerations:
 *    - Add composite index: (user_id, date, category_id)
 *    - Consider caching results for current month
 *    - Batch queries if processing multiple months
 * 
 * 7. Edge Cases:
 *    - Month = 2 (February): Handle leap years
 *    - Invalid month (< 1 or > 12): Validate and return error
 *    - Year < 1970 or > 2100: Consider validation
 *    - User has no transactions: Return empty array
 *    - All transactions are refunds: total_spending will be positive
 * 
 * 8. Data Integrity:
 *    - Ensure category_id references valid Category.id
 *    - Foreign key constraints should be in place
 *    - Handle orphaned transactions (category deleted) gracefully
 * 
 * 9. Testing Scenarios:
 *    - Single category, multiple transactions
 *    - Multiple categories with different amounts
 *    - Mix of expenses and refunds in same category
 *    - Category with only refunds (positive total)
 *    - Empty result (no transactions)
 *    - Transactions on first and last day of month
 *    - Transactions outside the month range (should be excluded)
 * 
 * 10. Future Enhancements:
 *     - Support for date ranges beyond single month
 *     - Include uncategorized transactions as separate entry
 *     - Breakdown by subcategory if category hierarchy exists
 *     - Filter by account_id if multi-account support added
 *     - Support for multiple currencies (convert to base currency)
 */

/**
 * Aggregate monthly spending by category
 * 
 * Queries all transactions for a user in a given month/year and groups
 * by Transaction.category_id (the authoritative user categorization),
 * summing the amounts.
 * 
 * CATEGORY SOURCING:
 * - Uses ONLY transaction.category_id for aggregation
 * - Plaid's categories (plaid_category, plaid_primary_category) are metadata only
 * - If user overrode a transaction's category, the override is reflected immediately
 * - No rule engine or mapping tables - uses values as stored in DB
 * 
 * DATE RANGE:
 * - Includes all transactions from first day to last day of the month
 * - Uses inclusive start, exclusive end: [YYYY-MM-01, YYYY-MM-32)
 * 
 * AMOUNT HANDLING:
 * - Expenses: negative values (e.g., -50.00)
 * - Refunds/credits: positive values (e.g., +25.00)
 * - Sums directly: SUM(-50 + 25) = -25 (net spending)
 * - Does NOT use ABS() - preserves signs
 * 
 * UNCATEGORIZED:
 * - Excludes transactions with category_id = NULL
 * - They don't appear in results and don't affect totals
 * 
 * @param params - User ID, month (1-12), year (YYYY)
 * @returns Aggregated spending by category with totals
 * @throws Error if month is invalid (< 1 or > 12)
 */
export function aggregateMonthlySpending(
  params: SpendingAggregationParams
): SpendingAggregationResponse {
  const { user_id, month, year } = params;

  // Validate month
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}. Must be between 1 and 12.`);
  }

  // This is a synchronous stub. In production, this would:
  // 1. Query database with DATE range filter
  // 2. GROUP BY category_id (ONLY transaction.category_id, not plaid_category)
  // 3. Aggregate amounts preserving signs (no ABS)
  // 4. Return results sorted by category_id
  //
  // For now, returns empty response structure with correct month/year
  return {
    month,
    year,
    spending_by_category: [],
    total_spending: 0,
    total_transaction_count: 0
  };
}