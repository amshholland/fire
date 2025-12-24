/**
 * Categories API Routes
 * 
 * Endpoints for managing transaction categories (system and user-custom)
 */

import { Router, Request, Response, NextFunction } from 'express';
import {
  createCategory,
  getCategoriesForUser,
  getSystemCategories,
  getUserCustomCategories,
  updateCategoryName,
  deleteCategory,
  categoryNameExists
} from '../data-access/category-dal';

export const categoriesRouter = Router();

/**
 * GET /api/user/:userId/categories
 * Get all categories available to user (system + custom)
 */
categoriesRouter.get('/user/:userId/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const categories = getCategoriesForUser(userId);
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
 * GET /api/user/:userId/categories/custom
 * Get user's custom categories only
 */
categoriesRouter.get('/user/:userId/categories/custom', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const categories = getUserCustomCategories(userId);
    res.json({ categories });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/user/:userId/categories
 * Create a new custom category for user
 */
categoriesRouter.post('/user/:userId/categories', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'name is required' });
    }
    
    // Check if category name already exists
    if (categoryNameExists(userId, name)) {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    
    const category = createCategory(userId, name);
    res.status(201).json({ category });
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /api/user/:userId/categories/:categoryId
 * Update category name (only for user-custom categories)
 */
categoriesRouter.patch('/user/:userId/categories/:categoryId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, categoryId } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'name is required' });
    }
    
    // Check if new name already exists
    if (categoryNameExists(userId, name)) {
      return res.status(409).json({ error: 'Category name already exists' });
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
 * DELETE /api/user/:userId/categories/:categoryId
 * Delete category (only user-custom categories)
 */
categoriesRouter.delete('/user/:userId/categories/:categoryId', async (_req: Request, res: Response, next: NextFunction) => {
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
