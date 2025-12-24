/**
 * User Accounts API Routes
 * 
 * Endpoints for managing user financial accounts (bank accounts, credit cards, etc.)
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  getAccountsByUserId,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getTotalBalanceByUserId,
  CreateAccountParams
} from '../data-access/account-dal';

export const userAccountsRouter = Router();

/**
 * GET /api/user/:userId/accounts
 * Get all accounts for a specific user
 */
userAccountsRouter.get('/user/:userId/accounts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const accounts = getAccountsByUserId(userId);
    res.json({ accounts });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/user/:userId/accounts/:accountId
 * Get specific account details
 */
userAccountsRouter.get('/user/:userId/accounts/:accountId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params;
    const account = getAccountById(Number(accountId));
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json({ account });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/user/:userId/accounts
 * Create a new account for user
 */
userAccountsRouter.post('/user/:userId/accounts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { name, type, subtype, current_balance, institution, plaid_account_id } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({ error: 'name and type are required' });
    }
    
    const params: CreateAccountParams = {
      user_id: userId,
      name,
      type,
      subtype,
      current_balance,
      institution,
      plaid_account_id
    };
    
    const account = createAccount(params);
    res.status(201).json({ account });
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /api/user/:userId/accounts/:accountId
 * Update account information
 */
userAccountsRouter.patch('/user/:userId/accounts/:accountId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params;
    const updates = req.body;
    
    const account = updateAccount(Number(accountId), updates);
    
    if (!account) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json({ account });
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/user/:userId/accounts/:accountId
 * Delete an account
 */
userAccountsRouter.delete('/user/:userId/accounts/:accountId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params;
    const deleted = deleteAccount(Number(accountId));
    
    if (!deleted) {
      return res.status(404).json({ error: 'Account not found' });
    }
    
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/user/:userId/accounts/total-balance
 * Get total balance across all accounts
 */
userAccountsRouter.get('/user/:userId/accounts-total-balance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const totalBalance = getTotalBalanceByUserId(userId);
    res.json({ totalBalance });
  } catch (e) {
    next(e);
  }
});
