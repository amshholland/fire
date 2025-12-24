/**
 * Categories API Routes
 * 
 * Endpoints for managing transaction categories (system and account-scoped)
 * 
 * NOTE: Categories are account-scoped, not user-scoped.
 * Users can create different categories for each account they own.
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  createCategory,
  getCategoriesForAccount,
  getSystemCategories,
  getAccountCategories,
  updateCategoryName,
  deleteCategory,
  categoryNameExists
} from '../data-access/category-dal';

export const categoriesRouter = Router();

/**
 * GET /api/accounts/:accountId/categories
 * Get all categories available for an account (system + account-scoped)
 */
categoriesRouter.get('/accounts/:accountId/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params;
    const categories = getCategoriesForAccount(Number(accountId));
    res.json({ categories });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/categories/system
 * Get system-defined categories
 */
categoriesRouter.get('/categories/system', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = getSystemCategories();
    res.json({ categories });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/accounts/:accountId/categories/custom
 * Get account's custom categories only (excludes system categories)
 */
categoriesRouter.get('/accounts/:accountId/categories/custom', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params;
    const categories = getAccountCategories(Number(accountId));
    res.json({ categories });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/accounts/:accountId/categories
 * Create a new custom category for an account
 */
categoriesRouter.post('/accounts/:accountId/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'name is required' });
    }
    
    // Check if category name already exists for this account
    if (categoryNameExists(Number(accountId), name)) {
      return res.status(409).json({ error: 'Category name already exists for this account' });
    }
    
    const category = createCategory(Number(accountId), name);
    res.status(201).json({ category });
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /api/accounts/:accountId/categories/:categoryId
 * Update category name (only for account-scoped categories)
 */
categoriesRouter.patch('/accounts/:accountId/categories/:categoryId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId, categoryId } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'name is required' });
    }
    
    // Check if new name already exists for this account
    if (categoryNameExists(Number(accountId), name)) {
      return res.status(409).json({ error: 'Category name already exists for this account' });
    }
    
    const category = updateCategoryName(Number(categoryId), name);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found or is a system category' });
    }
    
    res.json({ category });
  } catch (e) {
    next(e);
  }
});

/**
 * DELETE /api/accounts/:accountId/categories/:categoryId
 * Delete category (only account-scoped categories)
 */
categoriesRouter.delete('/accounts/:accountId/categories/:categoryId', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId } = _req.params;
    const deleted = deleteCategory(Number(categoryId));
    
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found or is a system category' });
    }
    
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});
