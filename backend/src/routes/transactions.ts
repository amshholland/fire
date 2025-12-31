import { Router, Request, Response, NextFunction } from 'express';
import { plaidClient } from '../clients/plaidClient';
import { sleep } from '../utils/time';
import { prettyPrint } from '../utils/logger';
import { queryTransactions, queryRecentTransactions, updateTransactionCategory, getValidCategoryIds } from '../db/transaction-dal';
import { TransactionPageQueryParams } from '../types/transaction.types';
import { validateCategoryUpdate } from '../services/transaction-category.service';
import { state } from '../state/store';
import { db } from '../db/database';

export const transactionsRouter = Router();

/**
 * Sync accounts from Plaid for a user
 * 
 * @param userId - User ID to sync accounts for
 */
export async function syncAccountsForUser(userId: string): Promise<void> {
  const accessToken = state.ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('Plaid access token not found. User must connect Plaid.');
  }

  const response = await plaidClient.accountsGet({ access_token: accessToken });
  const accounts = response.data.accounts;

  // Upsert accounts into the database
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO accounts (
      id, user_id, plaid_account_id, name, type, subtype, balance, currency, created_at
    ) VALUES (
      @id, @user_id, @plaid_account_id, @name, @type, @subtype, @balance, @currency, COALESCE(@created_at, CURRENT_TIMESTAMP)
    )
  `);

  for (const account of accounts) {
    insertStmt.run({
      id: account.account_id,
      user_id: userId,
      plaid_account_id: account.account_id,
      name: account.name,
      type: account.type,
      subtype: account.subtype,
      balance: account.balances.current,
      currency: account.balances.iso_currency_code || 'USD',
      created_at: null // Let DB default
    });
  }

  console.log(`✅ Synced ${accounts.length} accounts for user: ${userId}`);
}

/**
 * Sync transactions from Plaid for a user
 * 
 * @param userId - User ID to sync transactions for
 */
export async function syncTransactionsForUser(userId: string): Promise<void> {
  const accessToken = state.ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('Plaid access token not found. User must connect Plaid.');
  }

  // Sync accounts first to ensure FK constraints are satisfied
  await syncAccountsForUser(userId);

  let cursor: string | null = null;
  let added: any[] = [];
  let hasMore = true;

  // Fetch all new transactions from Plaid
  while (hasMore) {
    const response = await plaidClient.transactionsSync({ 
      access_token: accessToken, 
      cursor: cursor || undefined 
    });
    const data = response.data;
    cursor = data.next_cursor;
    added = added.concat(data.added);
    hasMore = data.has_more;
  }

  // Upsert transactions into the database
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO transactions (
      id, user_id, account_id, category_id, plaid_transaction_id, name, amount, date, pending, plaid_category, plaid_primary_category, merchant_name, created_at, updated_at
    ) VALUES (
      @id, @user_id, @account_id, @category_id, @plaid_transaction_id, @name, @amount, @date, @pending, @plaid_category, @plaid_primary_category, @merchant_name, COALESCE(@created_at, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP
    )
  `);

  for (const txn of added) {
    insertStmt.run({
      id: txn.transaction_id,
      user_id: userId,
      account_id: txn.account_id || null,
      category_id: null, // App category is assigned later or via auto-categorization
      plaid_transaction_id: txn.transaction_id,
      name: txn.name,
      amount: txn.amount,
      date: txn.date,
      pending: txn.pending ? 1 : 0,
      plaid_category: Array.isArray(txn.category) ? txn.category.join(', ') : null,
      plaid_primary_category: Array.isArray(txn.category) && txn.category.length > 0 ? txn.category[0] : null,
      merchant_name: txn.merchant_name || null,
      created_at: null // Let DB default
    });
  }

  console.log(`✅ Synced ${added.length} transactions for user: ${userId}`);
}
/**
 * POST /api/transactions/sync
 *
 * Fetches latest transactions from Plaid, saves them to the database, and returns the synced transactions.
 * Requires user to be authenticated and Plaid access token to be present in memory.
 *
 * Request body:
 *   - userId: string (required)
 *
 * Response:
 *   - 200: { transactions: TransactionItemDTO[] }
 *   - 400: { error: string }
 *   - 500: { error: string }
 */
transactionsRouter.post('/transactions/sync', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.body;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Missing required field: userId' });
    }

    await syncTransactionsForUser(userId);

    // Return the latest transactions from the DB for this user
    const recentTransactions = queryRecentTransactions(userId, 30);
    res.status(200).json({ transactions: recentTransactions });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/transactions (Plaid Sync)
 * 
 * Fetches transactions from Plaid API and syncs them.
 * This is the original Plaid transaction sync endpoint.
 */
transactionsRouter.get('/transactions', async (req, res, next) => {
  try {
    const accessToken = req.query.access_token as string
    
    if (!accessToken) {
      return res.status(400).json({ error: 'access_token is required' })
    }

    let cursor: string | null = null;
    let added: any[] = [];
    let modified: any[] = [];
    let removed: any[] = [];
    let hasMore = true;

    while (hasMore) {
      const response = await plaidClient.transactionsSync({ access_token: accessToken });

      console.log('Fetched transactions page:', accessToken);
      const data = response.data;
      cursor = data.next_cursor;
      if (cursor === '') {
        await sleep(2000);
        continue;
      }
      added = added.concat(data.added);
      modified = modified.concat(data.modified);
      removed = removed.concat(data.removed);
      hasMore = data.has_more;
      prettyPrint(response.data);
    }

    const compareAsc = (a: any, b: any) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0);
    const recently_added = [...added].sort(compareAsc).slice(-8);
    res.json({ latest_transactions: recently_added });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/transactions/db (Database Query)
 * 
 * Fetches paginated transactions from database with category and account information.
 * 
 * Query Parameters:
 * - userId: string (required) - User ID to filter transactions
 * - page: number (optional, default: 1) - Page number (1-indexed)
 * - page_size: number (optional, default: 50, max: 100) - Items per page
 * - start_date: string (optional) - Filter by start date (YYYY-MM-DD)
 * - end_date: string (optional) - Filter by end date (YYYY-MM-DD)
 * - category_id: number (optional) - Filter by category
 * - account_id: string (optional) - Filter by account
 * - search: string (optional) - Search merchant name
 * 
 * Response:
 * - 200: TransactionPageResponseDTO
 *   - transactions: Array of transaction items
 *   - total_count: Total number of matching transactions
 *   - page: Current page number
 *   - page_size: Items per page
 * - 400: Missing or invalid query parameters
 * - 500: Server error
 */
transactionsRouter.get(
  '/transactions/db',
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, page, page_size, start_date, end_date, category_id, account_id, search } = req.query;

      // Validate required parameters
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({
          error: 'Missing required query parameter: userId (string)'
        });
      }

      // Parse optional pagination parameters
      const parsedPage = page ? parseInt(page as string, 10) : 1;
      const parsedPageSize = page_size ? parseInt(page_size as string, 10) : 50;

      // Validate pagination parameters
      if (isNaN(parsedPage) || parsedPage < 1) {
        return res.status(400).json({
          error: `Invalid page: ${page}. Must be a positive integer.`
        });
      }

      if (isNaN(parsedPageSize) || parsedPageSize < 1 || parsedPageSize > 100) {
        return res.status(400).json({
          error: `Invalid page_size: ${page_size}. Must be between 1 and 100.`
        });
      }

      // Parse optional category_id
      let parsedCategoryId: number | undefined;
      if (category_id !== undefined) {
        parsedCategoryId = parseInt(category_id as string, 10);
        if (isNaN(parsedCategoryId)) {
          return res.status(400).json({
            error: `Invalid category_id: ${category_id}. Must be a number.`
          });
        }
      }

      // Validate date formats if provided
      if (start_date && !/^\d{4}-\d{2}-\d{2}$/.test(start_date as string)) {
        return res.status(400).json({
          error: `Invalid start_date: ${start_date}. Must be in YYYY-MM-DD format.`
        });
      }

      if (end_date && !/^\d{4}-\d{2}-\d{2}$/.test(end_date as string)) {
        return res.status(400).json({
          error: `Invalid end_date: ${end_date}. Must be in YYYY-MM-DD format.`
        });
      }

      // Build query parameters
      const params: TransactionPageQueryParams = {
        userId: userId as string,
        page: parsedPage,
        page_size: parsedPageSize,
        start_date: start_date as string | undefined,
        end_date: end_date as string | undefined,
        category_id: parsedCategoryId,
        account_id: account_id as string | undefined,
        search: search as string | undefined
      };

      // Execute query
      const response = queryTransactions(params);

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/transactions/db/recent (Database Query)
 * 
 * Fetches recent transactions from database without pagination.
 * Useful for dashboard/overview displays.
 * 
 * Query Parameters:
 * - userId: string (required) - User ID to filter transactions
 * - limit: number (optional, default: 30, max: 100) - Number of transactions
 * 
 * Response:
 * - 200: { transactions: TransactionItemDTO[] }
 * - 400: Missing or invalid query parameters
 * - 500: Server error
 */
transactionsRouter.get(
  '/transactions/db/recent',
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, limit } = req.query;

      // Validate required parameters
      if (!userId || typeof userId !== 'string') {
        return res.status(400).json({
          error: 'Missing required query parameter: userId (string)'
        });
      }

      // Parse optional limit parameter
      const parsedLimit = limit ? parseInt(limit as string, 10) : 30;

      // Validate limit parameter
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({
          error: `Invalid limit: ${limit}. Must be between 1 and 100.`
        });
      }

      // Execute query
      const transactions = queryRecentTransactions(userId as string, parsedLimit);

      res.status(200).json({ transactions });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/transactions/:transactionId/category
 * 
 * Updates the category for a single transaction.
 * 
 * Request Body:
 * - category_id: number (required) - New category ID to assign
 * - userId: string (required) - User ID for authorization
 * 
 * Response:
 * - 200: { success: true, message: string }
 * - 400: { error: string } - Validation error
 * - 404: { error: string } - Transaction not found
 * - 500: { error: string } - Server error
 * 
 * Example:
 *   PUT /api/transactions/txn-123/category
 *   Body: { "category_id": 5, "userId": "user-123" }
 *   Response: { "success": true, "message": "Transaction category updated successfully" }
 */
transactionsRouter.put('/transactions/:transactionId/category', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId } = req.params;
    const { category_id, userId } = req.body;

    // Validate required parameters
    if (!transactionId || typeof transactionId !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid transactionId in URL path'
      });
    }

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        error: 'Missing required field: userId'
      });
    }

    if (category_id === undefined || category_id === null) {
      return res.status(400).json({
        error: 'Missing required field: category_id'
      });
    }

    // Parse category_id
    const parsedCategoryId = parseInt(String(category_id), 10);
    if (isNaN(parsedCategoryId)) {
      return res.status(400).json({
        error: `Invalid category_id: ${category_id}. Must be a number.`
      });
    }

    // Get valid categories for user
    const validCategoryIds = getValidCategoryIds(userId);

    // Validate category update
    const validation = validateCategoryUpdate(parsedCategoryId, validCategoryIds);
    if (!validation.valid) {
      return res.status(400).json({
        error: validation.error
      });
    }

    // Update transaction category
    const result = updateTransactionCategory(transactionId, userId, parsedCategoryId);

    if (!result.success) {
      if (result.error?.includes('not found')) {
        return res.status(404).json({
          error: result.error
        });
      }
      return res.status(500).json({
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction category updated successfully'
    });
  } catch (error) {
    next(error);
  }
});
