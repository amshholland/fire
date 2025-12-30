/**
 * Transaction Page Type Definitions (Frontend)
 * 
 * Matches the backend DTO structure for type safety across the stack.
 * These types are used for:
 * - API response parsing
 * - Component prop typing
 * - Table column definitions
 */

/**
 * Transaction Item
 * 
 * Represents a single transaction for display.
 * Mirrors backend TransactionItemDTO.
 */
export interface TransactionItem {
  /**
   * Unique transaction identifier
   */
  transaction_id: string;

  /**
   * Transaction date (YYYY-MM-DD format)
   */
  date: string;

  /**
   * Merchant or payee name
   */
  merchant_name: string;

  /**
   * Transaction amount
   * Negative: Expenses (e.g., -50.00)
   * Positive: Income/refunds (e.g., +25.00)
   */
  amount: number;

  /**
   * Application category ID (user's categorization)
   * null if uncategorized
   */
  app_category_id: number | null;

  /**
   * Application category name (user's categorization)
   * null if uncategorized
   */
  app_category_name: string | null;

  /**
   * Plaid primary category (metadata)
   * null if not categorized by Plaid
   */
  plaid_category_primary: string | null;

  /**
   * Plaid detailed category (metadata)
   * null if not categorized by Plaid
   */
  plaid_category_detailed: string | null;

  /**
   * Account name where transaction occurred
   * null if account information not available
   */
  account_name: string | null;
}

/**
 * Transaction Page Response
 * 
 * API response structure for transaction list endpoint.
 */
export interface TransactionPageResponse {
  /**
   * Array of transaction items
   */
  transactions: TransactionItem[];

  /**
   * Total count of transactions (for pagination)
   */
  total_count: number;

  /**
   * Current page number (1-indexed)
   */
  page: number;

  /**
   * Number of items per page
   */
  page_size: number;
}

/**
 * Transaction Page Query Parameters
 * 
 * Query parameters for fetching transactions.
 */
export interface TransactionPageQueryParams {
  /**
   * User ID to filter transactions
   */
  userId: string;

  /**
   * Page number (1-indexed)
   */
  page?: number;

  /**
   * Number of items per page
   */
  page_size?: number;

  /**
   * Start date filter (YYYY-MM-DD)
   */
  start_date?: string;

  /**
   * End date filter (YYYY-MM-DD)
   */
  end_date?: string;

  /**
   * Category ID filter
   */
  category_id?: number;

  /**
   * Account ID filter
   */
  account_id?: string;

  /**
   * Search query for merchant name
   */
  search?: string;
}
