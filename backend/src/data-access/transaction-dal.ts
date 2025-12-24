/**
 * Transaction Data Access Layer
 * 
 * Handles all database operations for Transaction entity.
 * Supports both Plaid-synced and manually entered transactions.
 * Includes advanced query functions for filtering and reporting.
 * 
 * DESIGN NOTES:
 * - Plaid category fields (plaid_category_*) are immutable inputs stored verbatim
 * - category_id references the app Category model (authoritative for budgets/reports)
 * - Users can override category_id without affecting Plaid data
 * - This separation enables future rule-based categorization
 */

import { getDatabase } from '../database/database';

export interface Transaction {
  id: number;
  user_id: string;
  account_id: number;
  plaid_transaction_id: string | null;
  date: string;
  amount: number;
  merchant: string | null;
  // Plaid category data (immutable, stored verbatim for audit/debugging)
  plaid_category_primary: string | null;
  plaid_category_detailed: string | null;
  plaid_category_confidence: number | null;
  // App category (authoritative for budgets/reports/FIRE calculations)
  category_id: number | null;
  is_manual: boolean;
}

export interface CreateTransactionParams {
  user_id: string;
  account_id: number;
  plaid_transaction_id?: string | null;
  date: string;
  amount: number;
  merchant?: string | null;
  // Plaid category data (optional, for Plaid-synced transactions)
  plaid_category_primary?: string | null;
  plaid_category_detailed?: string | null;
  plaid_category_confidence?: number | null;
  // App category assignment (optional, defaults to null)
  category_id?: number | null;
  is_manual?: boolean;
}

export interface TransactionQueryParams {
  userId: string;
  accountId?: number;
  categoryId?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * Create a new transaction
 * Prevents duplicate Plaid transactions via unique constraint on plaid_transaction_id
 * 
 * Plaid category fields are stored verbatim and never modified.
 * category_id can be set explicitly or left null for later assignment.
 * 
 * @param params - Transaction creation parameters
 * @returns Created transaction object
 */
export function createTransaction(params: CreateTransactionParams): Transaction {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO transactions (
      user_id, account_id, plaid_transaction_id, date, amount, merchant,
      plaid_category_primary, plaid_category_detailed, plaid_category_confidence,
      category_id, is_manual
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    params.user_id,
    params.account_id,
    params.plaid_transaction_id || null,
    params.date,
    params.amount,
    params.merchant || null,
    params.plaid_category_primary || null,
    params.plaid_category_detailed || null,
    params.plaid_category_confidence || null,
    params.category_id || null,
    params.is_manual ? 1 : 0
  );
  
  return getTransactionById(Number(result.lastInsertRowid))!;
}

/**
 * Get transaction by ID
 * 
 * @param id - Transaction ID
 * @returns Transaction object or undefined if not found
 */
export function getTransactionById(id: number): Transaction | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM transactions WHERE id = ?');
  const row = stmt.get(id) as any;
  
  if (!row) return undefined;
  
  return {
    id: row.id,
    user_id: row.user_id,
    account_id: row.account_id,
    plaid_transaction_id: row.plaid_transaction_id,
    date: row.date,
    amount: row.amount,
    merchant: row.merchant,
    plaid_category_primary: row.plaid_category_primary,
    plaid_category_detailed: row.plaid_category_detailed,
    plaid_category_confidence: row.plaid_category_confidence,
    category_id: row.category_id,
    is_manual: Boolean(row.is_manual)
  };
}

/**
 * Get transaction by Plaid transaction ID
 * Used to check for duplicates when syncing from Plaid
 * 
 * @param plaidTransactionId - Plaid's unique transaction identifier
 * @returns Transaction object or undefined if not found
 */
export function getTransactionByPlaidId(plaidTransactionId: string): Transaction | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM transactions WHERE plaid_transaction_id = ?');
  const row = stmt.get(plaidTransactionId) as any;
  
  if (!row) return undefined;
  
  return {
    id: row.id,
    user_id: row.user_id,
    account_id: row.account_id,
    plaid_transaction_id: row.plaid_transaction_id,
    date: row.date,
    amount: row.amount,
    merchant: row.merchant,
    plaid_category_primary: row.plaid_category_primary,
    plaid_category_detailed: row.plaid_category_detailed,
    plaid_category_confidence: row.plaid_category_confidence,
    category_id: row.category_id,
    is_manual: Boolean(row.is_manual)
  };
}

/**
 * Query transactions with flexible filters
 * Optimized for common use cases: filtering by user, account, category, date range
 * Includes category name from categories table
 * 
 * @param params - Query parameters for filtering
 * @returns Array of matching transactions ordered by date DESC
 */
export function queryTransactions(params: TransactionQueryParams): any[] {
  const db = getDatabase();
  
  const conditions: string[] = ['t.user_id = ?'];
  const values: any[] = [params.userId];
  
  if (params.accountId !== undefined) {
    conditions.push('t.account_id = ?');
    values.push(params.accountId);
  }
  
  if (params.categoryId !== undefined) {
    conditions.push('t.category_id = ?');
    values.push(params.categoryId);
  }
  
  if (params.startDate !== undefined) {
    conditions.push('t.date >= ?');
    values.push(params.startDate);
  }
  
  if (params.endDate !== undefined) {
    conditions.push('t.date <= ?');
    values.push(params.endDate);
  }
  
  let query = `
    SELECT 
      t.id, t.user_id, t.account_id, t.plaid_transaction_id, t.date, t.amount, t.merchant,
      t.plaid_category_primary, t.plaid_category_detailed, t.plaid_category_confidence,
      t.category_id, t.is_manual,
      c.name as category_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    WHERE ${conditions.join(' AND ')} 
    ORDER BY t.date DESC
  `;
  
  if (params.limit !== undefined) {
    query += ' LIMIT ?';
    values.push(params.limit);
    
    if (params.offset !== undefined) {
      query += ' OFFSET ?';
      values.push(params.offset);
    }
  }
  
  const stmt = db.prepare(query);
  const rows = stmt.all(...values) as any[];
  
  return rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    account_id: row.account_id,
    plaid_transaction_id: row.plaid_transaction_id,
    date: row.date,
    amount: row.amount,
    merchant: row.merchant,
    plaid_category_primary: row.plaid_category_primary,
    plaid_category_detailed: row.plaid_category_detailed,
    plaid_category_confidence: row.plaid_category_confidence,
    category_id: row.category_id,
    is_manual: Boolean(row.is_manual),
    category_name: row.category_name
  }));
}

/**
 * Get transactions by user ID (simple query, no filters)
 * 
 * @param userId - User UUID
 * @returns Array of user's transactions ordered by date DESC
 */
export function getTransactionsByUserId(userId: string): Transaction[] {
  return queryTransactions({ userId });
}

/**
 * Get transactions by account ID
 * 
 * @param accountId - Account ID
 * @returns Array of account's transactions ordered by date DESC
 */
export function getTransactionsByAccountId(accountId: number): Transaction[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM transactions WHERE account_id = ? ORDER BY date DESC');
  const rows = stmt.all(accountId) as any[];
  
  return rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    account_id: row.account_id,
    plaid_transaction_id: row.plaid_transaction_id,
    date: row.date,
    amount: row.amount,
    merchant: row.merchant,
    plaid_category_primary: row.plaid_category_primary,
    plaid_category_detailed: row.plaid_category_detailed,
    plaid_category_confidence: row.plaid_category_confidence,
    category_id: row.category_id,
    is_manual: Boolean(row.is_manual)
  }));
}

/**
 * Get transactions by date range for a user
 * 
 * @param userId - User UUID
 * @param startDate - Start date (YYYY-MM-DD format)
 * @param endDate - End date (YYYY-MM-DD format)
 * @returns Array of transactions in date range
 */
export function getTransactionsByDateRange(
  userId: string,
  startDate: string,
  endDate: string
): Transaction[] {
  return queryTransactions({ userId, startDate, endDate });
}

/**
 * Update transaction
 * 
 * @param transactionId - Transaction ID
 * @param updates - Partial transaction object with fields to update
 * @returns Updated transaction object
 */
export function updateTransaction(
  transactionId: number,
  updates: Partial<Pick<Transaction, 'date' | 'amount' | 'merchant' | 'category_id'>>
): Transaction | undefined {
  const db = getDatabase();
  
  const fields: string[] = [];
  const values: any[] = [];
  
  if (updates.date !== undefined) {
    fields.push('date = ?');
    values.push(updates.date);
  }
  
  if (updates.amount !== undefined) {
    fields.push('amount = ?');
    values.push(updates.amount);
  }
  
  if (updates.merchant !== undefined) {
    fields.push('merchant = ?');
    values.push(updates.merchant);
  }
  
  if (updates.category_id !== undefined) {
    fields.push('category_id = ?');
    values.push(updates.category_id);
  }
  
  if (fields.length === 0) {
    return getTransactionById(transactionId);
  }
  
  values.push(transactionId);
  
  const stmt = db.prepare(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);
  
  return getTransactionById(transactionId);
}

/**
 * Override transaction category
 * Users can reassign a transaction to a different app category without affecting Plaid data.
 * This enables per-transaction customization for budgets and reporting.
 * 
 * @param transactionId - Transaction ID
 * @param categoryId - New category ID (or null to uncategorize)
 * @returns Updated transaction object
 */
export function updateTransactionCategory(
  transactionId: number,
  categoryId: number | null
): Transaction | undefined {
  return updateTransaction(transactionId, { category_id: categoryId });
}

/**
 * Delete transaction
 * 
 * @param transactionId - Transaction ID
 * @returns True if transaction was deleted
 */
export function deleteTransaction(transactionId: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM transactions WHERE id = ?');
  const result = stmt.run(transactionId);
  
  return result.changes > 0;
}

/**
 * Get total transaction amount for a user within date range
 * Useful for reporting and analytics
 * 
 * @param userId - User UUID
 * @param startDate - Start date (YYYY-MM-DD format)
 * @param endDate - End date (YYYY-MM-DD format)
 * @returns Sum of transaction amounts
 */
export function getTotalTransactionAmount(
  userId: string,
  startDate?: string,
  endDate?: string
): number {
  const db = getDatabase();
  
  let query = 'SELECT SUM(amount) as total FROM transactions WHERE user_id = ?';
  const values: any[] = [userId];
  
  if (startDate) {
    query += ' AND date >= ?';
    values.push(startDate);
  }
  
  if (endDate) {
    query += ' AND date <= ?';
    values.push(endDate);
  }
  
  const stmt = db.prepare(query);
  const result = stmt.get(...values) as any;
  
  return result.total || 0;
}
