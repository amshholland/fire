/**
 * Transaction Data Access Layer
 * 
 * Provides database query functions for transaction data.
 * Follows the TransactionItemDTO contract defined in types/transaction.types.ts
 */

import { db } from './database';
import { TransactionItemDTO, TransactionPageQueryParams, TransactionPageResponseDTO } from '../types/transaction.types';

/**
 * Fetch transactions with category and account information
 * 
 * Joins transactions with categories and accounts to provide complete display data.
 * Uses Transaction.category_id as authoritative category (not Plaid categories).
 * 
 * @param params - Query parameters (userId, pagination, filters)
 * @returns Paginated list of transactions with metadata
 */
export function queryTransactions(
  params: TransactionPageQueryParams
): TransactionPageResponseDTO {
  const {
    userId,
    page = 1,
    page_size = 50,
    start_date,
    end_date,
    category_id,
    account_id,
    search
  } = params;

  // Validate pagination parameters
  const validatedPage = Math.max(1, page);
  const validatedPageSize = Math.min(100, Math.max(1, page_size));
  const offset = (validatedPage - 1) * validatedPageSize;

  // Build WHERE clauses
  const whereClauses: string[] = ['t.user_id = ?'];
  const queryParams: any[] = [userId];

  if (start_date) {
    whereClauses.push('t.date >= ?');
    queryParams.push(start_date);
  }

  if (end_date) {
    whereClauses.push('t.date <= ?');
    queryParams.push(end_date);
  }

  if (category_id !== undefined) {
    whereClauses.push('t.category_id = ?');
    queryParams.push(category_id);
  }

  if (account_id) {
    whereClauses.push('t.account_id = ?');
    queryParams.push(account_id);
  }

  if (search) {
    whereClauses.push('(LOWER(t.merchant_name) LIKE ? OR LOWER(t.name) LIKE ?)');
    const searchPattern = `%${search.toLowerCase()}%`;
    queryParams.push(searchPattern, searchPattern);
  }

  const whereClause = whereClauses.join(' AND ');

  // Query for total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM transactions t
    WHERE ${whereClause}
  `;
  const countResult = db.prepare(countQuery).get(...queryParams) as { total: number };
  const total_count = countResult.total;

  // Query for transactions with category and account joins
  const transactionsQuery = `
    SELECT 
      t.id as transaction_id,
      t.date,
      COALESCE(t.merchant_name, t.name) as merchant_name,
      t.amount,
      t.category_id as app_category_id,
      c.name as app_category_name,
      t.plaid_primary_category as plaid_category_primary,
      t.plaid_category as plaid_category_detailed,
      a.name as account_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts a ON t.account_id = a.id
    WHERE ${whereClause}
    ORDER BY t.date DESC, t.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const transactions = db.prepare(transactionsQuery).all(
    ...queryParams,
    validatedPageSize,
    offset
  ) as TransactionItemDTO[];

  return {
    transactions,
    total_count,
    page: validatedPage,
    page_size: validatedPageSize
  };
}

/**
 * Fetch recent transactions (convenience method)
 * 
 * Returns the most recent transactions for a user without pagination.
 * Useful for dashboard displays.
 * 
 * @param userId - User ID
 * @param limit - Maximum number of transactions to return (default: 30)
 * @returns Array of recent transactions
 */
export function queryRecentTransactions(
  userId: string,
  limit: number = 30
): TransactionItemDTO[] {
  const validatedLimit = Math.min(100, Math.max(1, limit));

  const query = `
    SELECT 
      t.id as transaction_id,
      t.date,
      COALESCE(t.merchant_name, t.name) as merchant_name,
      t.amount,
      t.category_id as app_category_id,
      c.name as app_category_name,
      t.plaid_primary_category as plaid_category_primary,
      t.plaid_category as plaid_category_detailed,
      a.name as account_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN accounts a ON t.account_id = a.id
    WHERE t.user_id = ?
    ORDER BY t.date DESC, t.created_at DESC
    LIMIT ?
  `;

  return db.prepare(query).all(userId, validatedLimit) as TransactionItemDTO[];
}

/**
 * Update transaction category
 * 
 * Updates the category_id for a single transaction.
 * Does not modify Plaid category fields (metadata preserved).
 * 
 * @param transactionId - Transaction ID to update
 * @param userId - User ID (for authorization check)
 * @param categoryId - New category ID to assign
 * @returns Success status
 */
export function updateTransactionCategory(
  transactionId: string,
  userId: string,
  categoryId: number
): { success: boolean; error?: string } {
  try {
    // Verify transaction exists and belongs to user
    const checkQuery = `
      SELECT id FROM transactions
      WHERE id = ? AND user_id = ?
    `;
    const existingTransaction = db.prepare(checkQuery).get(transactionId, userId);

    if (!existingTransaction) {
      return {
        success: false,
        error: 'Transaction not found or does not belong to user'
      };
    }

    // Update category_id only (Plaid fields untouched)
    const updateQuery = `
      UPDATE transactions
      SET category_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `;

    const result = db.prepare(updateQuery).run(categoryId, transactionId, userId);

    if (result.changes === 0) {
      return {
        success: false,
        error: 'Failed to update transaction category'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating transaction category:', error);
    return {
      success: false,
      error: 'Database error during category update'
    };
  }
}

/**
 * Get valid category IDs for a user
 * 
 * Returns all category IDs that the user can assign to transactions.
 * Currently returns all system categories (no user-specific categories yet).
 * 
 * @param _userId - User ID
 * @returns Array of valid category IDs
 */
export function getValidCategoryIds(_userId: string): number[] {
  try {
    const query = `SELECT id FROM categories ORDER BY id`;
    const results = db.prepare(query).all() as Array<{ id: number }>;
    return results.map(row => row.id);
  } catch (error) {
    console.error('Error fetching valid categories:', error);
    return [];
  }
}
