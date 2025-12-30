/**
 * Categories Routes
 * 
 * Handles endpoints for fetching available budget categories.
 * Read-only operations - no category creation or editing.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { getAvailableCategories } from '../db/categories-dal';

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
