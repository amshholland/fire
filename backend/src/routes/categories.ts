/**
 * Categories Routes
 * 
 * Handles endpoints for fetching and creating budget categories.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { getAvailableCategories, getPlaidCategoriesFromTransactions, createCategory } from '../db/categories-dal';

export const categoriesRouter = Router();

/**
 * GET /api/categories
 * 
 * Fetch all available categories for budget planning.
 * 
 * Returns:
 * - System categories (available to all users)
 * - Account-scoped categories (future: specific to user's accounts)
 * - Categories are unique and sorted alphabetically
 * 
 * Query Parameters:
 * - user_id (required): User ID for filtering account-scoped categories
 * 
 * Response Format:
 * {
 *   "categories": [
 *     {
 *       "id": 1,
 *       "name": "Dining Out",
 *       "description": null,
 *       "created_at": "2025-01-01T00:00:00.000Z"
 *     },
 *     ...
 *   ],
 *   "count": 8
 * }
 * 
 * Status Codes:
 * - 200: Success
 * - 400: Missing or invalid user_id
 * - 500: Server error
 */
categoriesRouter.get('/categories', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.query;

    // Validate user_id parameter
    if (!user_id || typeof user_id !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid required parameter: user_id'
      });
    }

    // Fetch available categories for the user
    // Currently returns all system categories
    // Future: Will filter for account-scoped categories based on user's accounts
    const categories = getAvailableCategories(user_id);

    res.status(200).json({
      categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Error in GET /api/categories:', error);
    next(error);
  }
});

/**
 * GET /api/categories/plaid
 * 
 * Fetch distinct Plaid primary categories from user's transactions.
 * Used to initialize budget setup with categories from actual spending.
 * 
 * Query Parameters:
 * - user_id (required): User ID to fetch transactions for
 * 
 * Response Format:
 * {
 *   "categories": ["FOOD_AND_DRINK", "TRANSPORTATION", "SHOPPING"],
 *   "count": 3
 * }
 * 
 * Status Codes:
 * - 200: Success
 * - 400: Missing or invalid user_id
 * - 500: Server error
 */
categoriesRouter.get('/categories/plaid', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.query;

    // Validate user_id parameter
    if (!user_id || typeof user_id !== 'string') {
      return res.status(400).json({
        error: 'Missing or invalid required parameter: user_id'
      });
    }

    // Fetch distinct Plaid categories from user's transactions
    const plaidCategories = getPlaidCategoriesFromTransactions(user_id);

    res.status(200).json({
      categories: plaidCategories,
      count: plaidCategories.length
    });
  } catch (error) {
    console.error('Error in GET /api/categories/plaid:', error);
    next(error);
  }
});

/**
 * POST /api/categories
 * 
 * Create a new category for budget planning.
 * 
 * Request Body:
 * {
 *   "name": "New Category",
 *   "description": "Optional description"
 * }
 * 
 * Response Format:
 * {
 *   "category": {
 *     "id": 9,
 *     "name": "New Category",
 *     "description": "Optional description",
 *     "created_at": "2025-01-01T00:00:00.000Z"
 *   }
 * }
 * 
 * Status Codes:
 * - 201: Created
 * - 400: Missing or invalid name
 * - 500: Server error
 */
categoriesRouter.post('/categories', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;

    // Validate name parameter
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        error: 'Missing or invalid required parameter: name'
      });
    }

    // Create the category
    const category = createCategory(name.trim(), description);

    if (!category) {
      return res.status(500).json({
        error: 'Failed to create category'
      });
    }

    res.status(201).json({ category });
  } catch (error) {
    console.error('Error in POST /api/categories:', error);
    next(error);
  }
});
