/**
 * Transaction Page Data Transfer Objects
 * 
 * Defines the response structure for the transactions page view.
 * This DTO aggregates data from Transaction, Category, and Account entities
 * to provide a comprehensive transaction listing with categorization.
 * 
 * DATA SOURCES:
 * - Transaction: Core transaction data (id, date, merchant, amount)
 * - Category: User's application category (app_category_id, app_category_name)
 * - Plaid: Enrichment data from Plaid API (plaid_category_primary, plaid_category_detailed)
 * - Account: Account information (account_name)
 */

/**
 * Transaction Item DTO
 * 
 * Represents a single transaction for display on the transactions page.
 * Combines transaction data with category and account information.
 */
export interface TransactionItemDTO {
  /**
   * Unique transaction identifier
   * SOURCE: Transaction.id (primary key)
   * TYPE: string (UUID format recommended)
   * EXAMPLE: "txn-demo-1" or "550e8400-e29b-41d4-a716-446655440000"
   */
  transaction_id: string;

  /**
   * Transaction date (YYYY-MM-DD format)
   * SOURCE: Transaction.date
   * TYPE: string (ISO 8601 date format)
   * EXAMPLE: "2025-01-15"
   * NOTE: Should be the posted date, not the authorization date
   */
  date: string;

  /**
   * Merchant or payee name
   * SOURCE: Transaction.merchant_name (if available) OR Transaction.name (fallback)
   * TYPE: string
   * EXAMPLE: "Whole Foods Market" or "Amazon.com"
   * NOTE: merchant_name is enriched by Plaid; name is the raw description
   */
  merchant_name: string;

  /**
   * Transaction amount
   * SOURCE: Transaction.amount
   * TYPE: number (decimal)
   * SIGN CONVENTION:
   * - Negative: Expenses/debits (e.g., -50.00 for $50 purchase)
   * - Positive: Income/credits/refunds (e.g., +25.00 for $25 refund)
   * EXAMPLE: -142.53 (spent $142.53)
   * NOTE: Always store with 2 decimal precision
   */
  amount: number;

  /**
   * Application category ID (user's categorization)
   * SOURCE: Transaction.category_id → Category.id
   * TYPE: number (integer, foreign key)
   * EXAMPLE: 5
   * NOTE: This is the AUTHORITATIVE category for budget calculations
   * NULL if transaction is uncategorized
   */
  app_category_id: number | null;

  /**
   * Application category name (user's categorization)
   * SOURCE: Category.name (joined via Transaction.category_id)
   * TYPE: string
   * EXAMPLE: "Groceries", "Dining Out", "Transportation"
   * NULL if transaction is uncategorized
   * NOTE: This is the category user selected or system assigned, NOT Plaid's suggestion
   */
  app_category_name: string | null;

  /**
   * Plaid primary category (metadata)
   * SOURCE: Transaction.plaid_primary_category (from Plaid enrichment)
   * TYPE: string
   * EXAMPLE: "FOOD_AND_DRINK", "TRANSPORTATION", "TRANSFER"
   * NULL if Plaid did not categorize
   * NOTE: This is Plaid's top-level category suggestion (metadata only, not used in calculations)
   */
  plaid_category_primary: string | null;

  /**
   * Plaid detailed category (metadata)
   * SOURCE: Transaction.plaid_category (from Plaid enrichment)
   * TYPE: string
   * EXAMPLE: "Food and Drink, Restaurants", "Travel, Taxi"
   * NULL if Plaid did not categorize
   * NOTE: This is Plaid's detailed category path (metadata only, for display/suggestions)
   */
  plaid_category_detailed: string | null;

  /**
   * Account name where transaction occurred
   * SOURCE: Account.name (joined via Transaction.account_id)
   * TYPE: string
   * EXAMPLE: "Chase Freedom Checking", "Amex Blue Cash"
   * NULL if account information is not available
   * NOTE: Helps users identify which account a transaction belongs to
   */
  account_name: string | null;
}

/**
 * Transaction Page Response DTO
 * 
 * Contains paginated list of transactions and metadata for the transactions page.
 */
export interface TransactionPageResponseDTO {
  /**
   * Array of transaction items
   */
  transactions: TransactionItemDTO[];

  /**
   * Total count of transactions (for pagination)
   * SOURCE: Calculated from query COUNT(*)
   */
  total_count: number;

  /**
   * Current page number (1-indexed)
   * SOURCE: Query parameter
   */
  page: number;

  /**
   * Number of items per page
   * SOURCE: Query parameter
   */
  page_size: number;
}

/**
 * Transaction Page Query Parameters
 * 
 * Defines the parameters for fetching transaction data.
 */
export interface TransactionPageQueryParams {
  /**
   * User ID to filter transactions
   * REQUIRED: Yes
   */
  userId: string;

  /**
   * Page number (1-indexed)
   * DEFAULT: 1
   */
  page?: number;

  /**
   * Number of items per page
   * DEFAULT: 50
   * MAX: 100
   */
  page_size?: number;

  /**
   * Start date filter (YYYY-MM-DD)
   * OPTIONAL: Include only transactions on or after this date
   */
  start_date?: string;

  /**
   * End date filter (YYYY-MM-DD)
   * OPTIONAL: Include only transactions on or before this date
   */
  end_date?: string;

  /**
   * Category ID filter
   * OPTIONAL: Include only transactions in this category
   */
  category_id?: number;

  /**
   * Account ID filter
   * OPTIONAL: Include only transactions from this account
   */
  account_id?: string;

  /**
   * Search query for merchant name
   * OPTIONAL: Filter by merchant name (case-insensitive partial match)
   */
  search?: string;
}

/**
 * IMPLEMENTATION NOTES (NOT TO BE IMPLEMENTED IN THIS TICKET):
 * 
 * 1. Database Query Pattern:
 *    ```sql
 *    SELECT 
 *      t.id as transaction_id,
 *      t.date,
 *      COALESCE(t.merchant_name, t.name) as merchant_name,
 *      t.amount,
 *      t.category_id as app_category_id,
 *      c.name as app_category_name,
 *      t.plaid_primary_category,
 *      t.plaid_category as plaid_category_detailed,
 *      a.name as account_name
 *    FROM transactions t
 *    LEFT JOIN categories c ON t.category_id = c.id
 *    LEFT JOIN accounts a ON t.account_id = a.id
 *    WHERE t.user_id = ?
 *    ORDER BY t.date DESC
 *    LIMIT ? OFFSET ?
 *    ```
 * 
 * 2. Category Sourcing Strategy:
 *    - app_category_id/app_category_name: User's authoritative categorization
 *    - plaid_category_primary/plaid_category_detailed: Plaid's suggestions (metadata)
 *    - If user overrides a category, app_category reflects the override
 *    - Plaid categories never change in response to user overrides
 * 
 * 3. Merchant Name Resolution:
 *    - Prefer merchant_name (enriched by Plaid) over name (raw description)
 *    - Use COALESCE(merchant_name, name) in query
 * 
 * 4. Sorting:
 *    - Default: ORDER BY date DESC (most recent first)
 *    - Consider secondary sort by created_at for same-day transactions
 * 
 * 5. Pagination:
 *    - Use LIMIT and OFFSET for pagination
 *    - Always include total_count for pagination UI
 *    - Validate page and page_size parameters
 * 
 * 6. Filtering:
 *    - Date range: Use >= start_date AND <= end_date
 *    - Category: Filter by category_id (NULL for uncategorized)
 *    - Account: Filter by account_id
 *    - Search: Use LIKE '%search%' on merchant_name (case-insensitive)
 * 
 * 7. Performance Optimization:
 *    - Create indexes on (user_id, date DESC)
 *    - Create indexes on (user_id, category_id)
 *    - Create indexes on (user_id, account_id)
 *    - Consider materialized view for frequently accessed data
 * 
 * 8. Edge Cases:
 *    - Uncategorized transactions (category_id = NULL)
 *    - Deleted accounts (account_name = NULL)
 *    - Missing Plaid enrichment (plaid_category = NULL)
 *    - Pending transactions (may want separate handling)
 * 
 * 9. Future Enhancements:
 *    - Support for multiple sort orders (amount, merchant, category)
 *    - Transaction notes/memos field
 *    - Recurring transaction detection
 *    - Split transactions (one transaction, multiple categories)
 *    - Attachment support (receipts)
 */
