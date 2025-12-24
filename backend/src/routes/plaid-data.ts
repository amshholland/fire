/**
 * Plaid Data Persistence API Routes
 * 
 * Endpoints for saving Plaid account and transaction data to the database
 */

import { Router, Request, Response, NextFunction } from 'express';
import { createAccount, updateAccount } from '../data-access/account-dal';
import { createTransaction } from '../data-access/transaction-dal';
import { updateUserPlaidStatus } from '../data-access/user-dal';

export const plaidDataRouter = Router();

/**
 * POST /api/user/:userId/plaid/sync-accounts
 * Save Plaid accounts to database
 * 
 * Request body:
 * {
 *   "accounts": [
 *     {
 *       "id": "plaid_account_id",
 *       "name": "Checking Account",
 *       "type": "depository",
 *       "subtype": "checking",
 *       "balances": { "current": 1000.50 }
 *     }
 *   ],
 *   "institution": {
 *     "name": "Bank of America"
 *   }
 * }
 */
plaidDataRouter.post('/user/:userId/plaid/sync-accounts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { accounts, institution } = req.body;

    if (!accounts || !Array.isArray(accounts)) {
      return res.status(400).json({ error: 'accounts array is required' });
    }

    console.log('Syncing accounts:', JSON.stringify(accounts, null, 2));

    const savedAccounts = [];

    for (const plaidAccount of accounts) {
      // Plaid API returns account_id, not id
      const plaidAccountId = plaidAccount.account_id || plaidAccount.id;
      const account = createAccount({
        user_id: userId,
        plaid_account_id: plaidAccountId,
        name: plaidAccount.name,
        type: plaidAccount.type,
        subtype: plaidAccount.subtype,
        current_balance: plaidAccount.balances?.current || 0,
        institution: institution?.name || null
      });

      savedAccounts.push(account);
    }

    // Mark user as having linked Plaid
    updateUserPlaidStatus(userId, true);

    res.status(201).json({
      success: true,
      message: `Synced ${savedAccounts.length} account(s)`,
      accounts: savedAccounts
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/user/:userId/plaid/sync-transactions
 * Save Plaid transactions to database
 * 
 * Request body:
 * {
 *   "accountId": 1,  // Our database account ID (not Plaid's)
 *   "transactions": [
 *     {
 *       "transaction_id": "tx_123",
 *       "date": "2025-12-20",
 *       "amount": -45.32,
 *       "merchant_name": "Whole Foods",
 *       "personal_finance_category": { "primary": "FOOD_AND_DRINK" }
 *     }
 *   ]
 * }
 */
plaidDataRouter.post('/user/:userId/plaid/sync-transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { accountId, transactions } = req.body;

    console.log(`[SYNC-TX] User ${userId} syncing transactions for account ${accountId}`);
    console.log(`[SYNC-TX] Received ${transactions?.length || 0} transactions`);

    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }

    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({ error: 'transactions array is required' });
    }

    const savedTransactions = [];
    const skippedTransactions = [];

    for (const plaidTx of transactions) {
      try {
        console.log(`[SYNC-TX] Creating transaction: ${plaidTx.transaction_id} - ${plaidTx.merchant_name} - $${plaidTx.amount}`);
        const transaction = createTransaction({
          user_id: userId,
          account_id: accountId,
          plaid_transaction_id: plaidTx.transaction_id,
          date: plaidTx.date,
          amount: plaidTx.amount,
          merchant: plaidTx.merchant_name || null,
          is_manual: false
        });

        savedTransactions.push(transaction);
      } catch (error: any) {
        // Skip duplicate transactions (plaid_transaction_id already exists)
        if (error.message?.includes('UNIQUE constraint failed')) {
          skippedTransactions.push({
            plaidId: plaidTx.transaction_id,
            reason: 'duplicate'
          });
        } else {
          console.error(`[SYNC-TX] Error creating transaction:`, error.message);
          throw error;
        }
      }
    }

    console.log(`[SYNC-TX] Successfully saved ${savedTransactions.length} transactions, skipped ${skippedTransactions.length}`);

    res.status(201).json({
      success: true,
      message: `Synced ${savedTransactions.length} transaction(s)`,
      transactions: savedTransactions,
      skipped: skippedTransactions.length
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/plaid/all-transactions
 * Fetch all transactions from Plaid for initial sync
 * Returns all available transactions for all accounts
 */
plaidDataRouter.get('/plaid/all-transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accessToken = req.query.access_token as string;
    
    if (!accessToken) {
      return res.status(400).json({ error: 'access_token is required' });
    }

    const { plaidClient } = await import('../clients/plaidClient');
    
    // Use transactionsSync to get all transactions
    const response = await plaidClient.transactionsSync({ access_token: accessToken });
    const allTransactions = response.data.added || [];
    
    console.log(`[PLAID] Fetched ${allTransactions.length} transactions from Plaid`);
    
    res.json({
      transactions: allTransactions,
      total: allTransactions.length
    });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/user/:userId/plaid/update-balances
 * Update account balances from Plaid data
 * Called periodically to keep balances current
 * 
 * Request body:
 * {
 *   "balances": [
 *     {
 *       "accountId": 1,  // Our database account ID
 *       "current": 1500.75
 *     }
 *   ]
 * }
 */
plaidDataRouter.post('/user/:userId/plaid/update-balances', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { balances } = req.body;

    if (!balances || !Array.isArray(balances)) {
      return res.status(400).json({ error: 'balances array is required' });
    }

    const updatedAccounts = [];

    for (const balance of balances) {
      const account = updateAccount(balance.accountId, {
        current_balance: balance.current
      });

      if (account) {
        updatedAccounts.push(account);
      }
    }

    res.json({
      success: true,
      message: `Updated ${updatedAccounts.length} account balance(s)`,
      accounts: updatedAccounts
    });
  } catch (e) {
    next(e);
  }
});
