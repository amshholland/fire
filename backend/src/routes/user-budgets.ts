/**
 * Budgets API Routes
 * 
 * Endpoints for managing monthly budget allocations
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  getBudgetsByPeriod,
  getBudgetsByUserId,
  upsertBudget,
  deleteBudget,
  getTotalBudgetForPeriod,
  CreateBudgetParams
} from '../data-access/budget-dal';

export const budgetsRouter = Router();

/**
 * GET /api/user/:userId/budgets
 * Get all budgets for a user
 * Query params: month, year (optional filters)
 */
budgetsRouter.get('/user/:userId/budgets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;
    
    let budgets;
    if (month && year) {
      budgets = getBudgetsByPeriod(userId, Number(month), Number(year));
    } else {
      budgets = getBudgetsByUserId(userId);
    }
    
    res.json({ budgets });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/user/:userId/budgets/total
 * Get total budget for a specific month/year
 * Query params: month, year (required)
 */
budgetsRouter.get('/user/:userId/budgets/total', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ error: 'month and year query parameters are required' });
    }
    
    const total = getTotalBudgetForPeriod(userId, Number(month), Number(year));
    res.json({ total, month: Number(month), year: Number(year) });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/user/:userId/budgets
 * Create or update a budget (upsert)
 */
budgetsRouter.post('/user/:userId/budgets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { category_id, month, year, amount } = req.body;
    
    if (!category_id || !month || !year || amount === undefined) {
      return res.status(400).json({ error: 'category_id, month, year, and amount are required' });
    }
    
    if (month < 1 || month > 12) {
      return res.status(400).json({ error: 'month must be between 1 and 12' });
    }
    
    if (amount < 0) {
      return res.status(400).json({ error: 'amount must be non-negative' });
    }
    
    const params: CreateBudgetParams = {
      user_id: userId,
      category_id,
      month,
      year,
      amount
    };
    
    const budget = upsertBudget(params);
    res.status(201).json({ budget });
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/user/:userId/budgets/:budgetId
 * Delete a budget
 */
budgetsRouter.delete('/user/:userId/budgets/:budgetId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { budgetId } = req.params;
    const deleted = deleteBudget(Number(budgetId));
    
    if (!deleted) {
      return res.status(404).json({ error: 'Budget not found' });
    }
    
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});
