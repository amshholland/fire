/**
 * User Transactions API Routes
 * 
 * Endpoints for managing financial transactions (both Plaid-synced and manual)
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  createTransaction,
  getTransactionById,
  queryTransactions,
  updateTransaction,
  deleteTransaction,
  CreateTransactionParams,
  TransactionQueryParams
} from '../data-access/transaction-dal';

export const userTransactionsRouter = Router();

/**
 * GET /api/user/:userId/transactions
 * Get transactions for a user with optional filters
 * Query params: accountId, categoryId, startDate, endDate, limit, offset
 */
userTransactionsRouter.get('/user/:userId/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { accountId, categoryId, startDate, endDate, limit, offset } = req.query;
    
    const queryParams: TransactionQueryParams = {
      userId,
      accountId: accountId ? Number(accountId) : undefined,
      categoryId: categoryId ? Number(categoryId) : undefined,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined
    };
    
    const transactions = queryTransactions(queryParams);
    res.json({ transactions, count: transactions.length });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/user/:userId/transactions/:transactionId
 * Get specific transaction details
 */
userTransactionsRouter.get('/user/:userId/transactions/:transactionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId } = req.params;
    const transaction = getTransactionById(Number(transactionId));
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({ transaction });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/user/:userId/transactions/manual
 * Create a manual transaction
 */
userTransactionsRouter.post('/user/:userId/transactions/manual', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { account_id, date, amount, merchant, category_id } = req.body;
    
    if (!account_id || !date || amount === undefined) {
      return res.status(400).json({ error: 'account_id, date, and amount are required' });
    }
    
    const params: CreateTransactionParams = {
      user_id: userId,
      account_id,
      date,
      amount,
      merchant,
      category_id,
      is_manual: true
    };
    
    const transaction = createTransaction(params);
    res.status(201).json({ transaction });
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /api/user/:userId/transactions/:transactionId
 * Update transaction (e.g., change category, amount, merchant)
 */
userTransactionsRouter.patch('/user/:userId/transactions/:transactionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId } = req.params;
    const updates = req.body;
    
    const transaction = updateTransaction(Number(transactionId), updates);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({ transaction });
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/user/:userId/transactions/:transactionId
 * Delete a transaction
 */
userTransactionsRouter.delete('/user/:userId/transactions/:transactionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { transactionId } = req.params;
    const deleted = deleteTransaction(Number(transactionId));
    
    if (!deleted) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});
