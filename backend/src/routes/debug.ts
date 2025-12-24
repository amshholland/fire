/**
 * Debug API Routes
 * 
 * Endpoints for inspecting database contents during development
 * ⚠️ Remove in production
 */

import { Router, Request, Response, NextFunction } from 'express';
import { getDatabase } from '../database/database';
import { getAllUsers } from '../data-access/user-dal';

export const debugRouter = Router();

/**
 * GET /api/debug/database
 * View all database contents
 */
debugRouter.get('/debug/database', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDatabase();
    
    const users = getAllUsers();
    const accounts = db.prepare('SELECT * FROM accounts').all();
    const transactions = db.prepare('SELECT * FROM transactions ORDER BY date DESC LIMIT 20').all();
    const categories = db.prepare('SELECT * FROM categories ORDER BY is_system DESC, name').all();
    const budgets = db.prepare('SELECT * FROM budgets').all();
    const assetsLiabilities = db.prepare('SELECT * FROM assets_liabilities').all();
    
    res.json({
      users,
      accounts,
      transactions,
      categories,
      budgets,
      assetsLiabilities
    });
  } catch (e) {
    next(e);
  }
});
