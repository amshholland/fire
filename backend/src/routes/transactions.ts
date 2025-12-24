import { Router } from 'express';
import { plaidClient } from '../clients/plaidClient';
import { sleep } from '../utils/time';
import { prettyPrint } from '../utils/logger';
import { queryTransactions } from '../data-access/transaction-dal';
import { createTransaction } from '../data-access/transaction-dal';
import { getAccountsByUserId } from '../data-access/account-dal';

export const transactionsRouter = Router();

// Store sync cursors in memory (per user, per account)
const syncCursors: Record<string, Record<string, string | null>> = {};

/**
 * GET /api/transactions
 * Legacy endpoint - fetches from Plaid and returns latest 8 transactions
 * Kept for backwards compatibility
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
 * GET /api/user/:userId/transactions
 * Fetch all transactions for a user from the database (previously synced from Plaid)
 * Does not limit the number of transactions
 */
transactionsRouter.get('/user/:userId/transactions', async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Get all transactions for this user from the database
    const transactions = queryTransactions({ userId });
    
    console.log(`[TRANSACTIONS] Retrieved ${transactions.length} transactions for user ${userId}`);
    
    res.json({
      transactions,
      total: transactions.length
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/user/:userId/transactions/sync
 * Sync new/updated transactions from Plaid to the database
 * Uses cursor-based pagination to only fetch changes since last sync
 * Returns all transactions from the database
 */
transactionsRouter.post('/user/:userId/transactions/sync', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { accessToken } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    if (!accessToken) {
      return res.status(400).json({ error: 'accessToken is required' });
    }

    // Initialize cursors object for this user if not exists
    if (!syncCursors[userId]) {
      syncCursors[userId] = {};
    }

    const userCursors = syncCursors[userId];
    let totalAdded = 0;
    let totalModified = 0;

    // Get all accounts for this user
    const accounts = getAccountsByUserId(userId);
    console.log(`[SYNC] Syncing transactions for ${accounts.length} account(s)`);

    // Sync transactions for each account
    for (const account of accounts) {
      const accountId = account.plaid_account_id || account.id.toString();
      const accountCursor = userCursors[accountId] || null;
      let cursor: string | null = accountCursor;
      let hasMore = true;
      let pageAdded: any[] = [];
      let pageModified: any[] = [];

      while (hasMore) {
        const response = await plaidClient.transactionsSync({ 
          access_token: accessToken,
          cursor: cursor || undefined
        });

        const data = response.data;
        pageAdded = pageAdded.concat(data.added || []);
        pageModified = pageModified.concat(data.modified || []);
        
        cursor = data.next_cursor;
        hasMore = data.has_more;

        if (!hasMore && cursor) {
          // Store the cursor for next sync
          userCursors[accountId] = cursor;
        }

        // Add small delay to respect Plaid API rate limits
        if (hasMore) {
          await sleep(100);
        }
      }

      // Save new transactions to database with Plaid category data
      for (const tx of pageAdded) {
        if (tx.account_id === account.plaid_account_id) {
          try {
            // Extract Plaid category data (stored verbatim, immutable)
            const plaidCategoryPrimary = tx.personal_finance_category?.primary || null;
            const plaidCategoryDetailed = tx.personal_finance_category?.detailed || null;
            const plaidCategoryConfidence = tx.personal_finance_category?.confidence_level || null;
            
            createTransaction({
              user_id: userId,
              account_id: account.id,
              plaid_transaction_id: tx.transaction_id,
              date: tx.date,
              amount: tx.amount,
              merchant: tx.merchant_name || null,
              // Store Plaid category data verbatim
              plaid_category_primary: plaidCategoryPrimary,
              plaid_category_detailed: plaidCategoryDetailed,
              plaid_category_confidence: plaidCategoryConfidence,
              // category_id will be assigned later (defaults to null)
              is_manual: false
            });
            totalAdded++;
          } catch (error: any) {
            // Skip if duplicate (UNIQUE constraint on plaid_transaction_id)
            if (!error.message?.includes('UNIQUE constraint failed')) {
              console.error('[SYNC] Error saving transaction:', error.message);
            }
          }
        }
      }

      // Note: Modified transactions would need a separate update function
      totalModified = pageModified.length;

      console.log(`[SYNC] Account ${accountId}: added ${pageAdded.length}, modified ${pageModified.length}`);
    }

    // Return all transactions for this user
    const allTransactions = queryTransactions({ userId });

    res.json({
      success: true,
      message: `Synced ${totalAdded} new transactions, ${totalModified} modified`,
      transactions: allTransactions,
      total: allTransactions.length
    });
  } catch (e) {
    next(e);
  }
});