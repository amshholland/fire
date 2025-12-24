/**
 * Net Worth API Routes
 * 
 * Endpoints for calculating and retrieving net worth information
 */

import { Router, Request, Response, NextFunction } from 'express';
import { getTotalBalanceByUserId } from '../data-access/account-dal';
import {
  getAssetLiabilitiesByUserId,
  getTotalAssetValue,
  getTotalLiabilityValue,
  createAssetLiability,
  updateAssetLiability,
  deleteAssetLiability,
  CreateAssetLiabilityParams
} from '../data-access/asset-liability-dal';

export const netWorthRouter = Router();

/**
 * GET /api/user/:userId/net-worth
 * Calculate total net worth from all sources
 * Includes: account balances + manual assets - manual liabilities
 */
netWorthRouter.get('/user/:userId/net-worth', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    
    // Get balances from linked accounts
    const accountBalance = getTotalBalanceByUserId(userId);
    
    // Get manual assets and liabilities
    const manualAssets = getTotalAssetValue(userId);
    const manualLiabilities = getTotalLiabilityValue(userId);
    
    // Calculate total net worth
    const netWorth = accountBalance + manualAssets - manualLiabilities;
    
    res.json({
      netWorth,
      breakdown: {
        accountBalance,
        manualAssets,
        manualLiabilities
      }
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/user/:userId/assets-liabilities
 * Get all manual assets and liabilities for user
 */
netWorthRouter.get('/user/:userId/assets-liabilities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const items = getAssetLiabilitiesByUserId(userId);
    res.json({ items });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/user/:userId/assets-liabilities
 * Create a new manual asset or liability
 */
netWorthRouter.post('/user/:userId/assets-liabilities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { name, type, value } = req.body;
    
    if (!name || !type || value === undefined) {
      return res.status(400).json({ error: 'name, type, and value are required' });
    }
    
    if (type !== 'asset' && type !== 'liability') {
      return res.status(400).json({ error: 'type must be either "asset" or "liability"' });
    }
    
    if (value < 0) {
      return res.status(400).json({ error: 'value must be non-negative' });
    }
    
    const params: CreateAssetLiabilityParams = {
      user_id: userId,
      name,
      type,
      value
    };
    
    const item = createAssetLiability(params);
    res.status(201).json({ item });
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /api/user/:userId/assets-liabilities/:itemId
 * Update asset or liability
 */
netWorthRouter.patch('/user/:userId/assets-liabilities/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const updates = req.body;
    
    if (updates.type && updates.type !== 'asset' && updates.type !== 'liability') {
      return res.status(400).json({ error: 'type must be either "asset" or "liability"' });
    }
    
    if (updates.value !== undefined && updates.value < 0) {
      return res.status(400).json({ error: 'value must be non-negative' });
    }
    
    const item = updateAssetLiability(Number(itemId), updates);
    
    if (!item) {
      return res.status(404).json({ error: 'Asset/Liability not found' });
    }
    
    res.json({ item });
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/user/:userId/assets-liabilities/:itemId
 * Delete asset or liability
 */
netWorthRouter.delete('/user/:userId/assets-liabilities/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const deleted = deleteAssetLiability(Number(itemId));
    
    if (!deleted) {
      return res.status(404).json({ error: 'Asset/Liability not found' });
    }
    
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});
