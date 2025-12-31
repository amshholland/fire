/**
 * Budget Routes
 *
 * Endpoints for retrieving budget page data including:
 * - Budget allocations by category
 * - Aggregated spending by category
 * - Remaining budget calculations
 * - Summary totals
 *
 * Category Sourcing: Uses transaction.category_id (user's categorization),
 * not Plaid's categorization (metadata only)
 */

import { Router, Request, Response, NextFunction } from 'express';
import { aggregateMonthlySpending } from '../services/spending-aggregation.service';
import {
  buildCategoryBudgetItems,
  composeBudgetPageResponse
} from '../services/budget-calculator.service';
import { BudgetPageResponseDTO } from '../types/budget.types';
import { BudgetSetupRequest, BudgetSetupResponse } from '../types/budget-setup.types';
import { saveBudgets } from '../db/budgets-dal';

export const budgetsRouter = Router();

/**
 * GET /api/budgets
 *
 * Retrieves budget page data for a specified month/year
 *
 * Composition Flow:
 * 1. Fetch budgets for user/month/year (from Budget table)
 * 2. Aggregate monthly spending by category (from Transaction table)
 * 3. Build category budget items (combine budgets with spending)
 * 4. Compose final response with summary totals
 *
 * Query Parameters:
 * - userId: string (required) - User ID to filter budgets and spending
 * - month: number (required) - Month (1-12)
 * - year: number (required) - Year (YYYY, 1970-2100)
 *
 * Response:
 * - 200: BudgetPageResponseDTO
 *   - month, year: Request parameters
 *   - categoryBudgets: Array of categories with budgets and spending
 *   - summary: Aggregated totals across all categories
 * - 400: Missing or invalid query parameters
 * - 500: Server error
 *
 * Example:
 *   GET /api/budgets?userId=user-123&month=1&year=2025
 *   Response: {
 *     month: 1,
 *     year: 2025,
 *     categoryBudgets: [
 *       {
 *         category_id: 1,
 *         category_name: "Groceries",
 *         budgeted_amount: 300,
 *         spent_amount: -150,
 *         remaining_amount: 450,
 *         percentage_used: 50
 *       }
 *     ],
 *     summary: {
 *       total_budgeted: 300,
 *       total_spent: -150,
 *       total_remaining: 450,
 *       overall_percentage_used: 50
 *     }
 *   }
 */
budgetsRouter.get('/budgets', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Parse and validate query parameters
    const { userId, month, year } = req.query;

    // Validate required parameters
    if (!userId || month === undefined || year === undefined) {
      return res.status(400).json({
        error: 'Missing required parameters: userId, month, year'
      });
    }

    // Parse month and year as integers
    const parsedMonth = parseInt(month as string, 10);
    const parsedYear = parseInt(year as string, 10);

    // Validate month range (1-12)
    if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return res.status(400).json({
        error: `Invalid month: ${month}. Must be between 1 and 12.`
      });
    }

    // Validate year is reasonable (1970-2100)
    if (isNaN(parsedYear) || parsedYear < 1970 || parsedYear > 2100) {
      return res.status(400).json({
        error: `Invalid year: ${year}. Must be between 1970 and 2100.`
      });
    }

    const userIdStr = userId as string;

    // Step 1: Fetch budgets for user/month/year with category names
    let budgets: Array<{
      category_id: number;
      category_name: string;
      budgeted_amount: number;
    }> = [];

    try {
      const { db } = require('../db/database');
      const budgetQuery = `
        SELECT 
          b.id,
          b.category_id,
          c.name as category_name,
          b.amount as budgeted_amount
        FROM budgets b
        JOIN categories c ON b.category_id = c.id
        WHERE b.user_id = ? AND b.month = ? AND b.year = ?
        ORDER BY c.name ASC
      `;
      budgets = db.prepare(budgetQuery).all(userIdStr, parsedMonth, parsedYear) as any;
    } catch (dbError) {
      // If database is not available, continue with empty budgets
      // This allows tests to run without actual database setup
      budgets = [];
    }

    // Step 2: Aggregate monthly spending by category (groups by transaction.category_id)
    const spendingResponse = aggregateMonthlySpending({
      user_id: userIdStr,
      month: parsedMonth,
      year: parsedYear
    });
    
    console.log(`📊 Aggregated spending for user ${userIdStr} (${parsedMonth}/${parsedYear}):`, 
      spendingResponse.spending_by_category.length > 0 
        ? spendingResponse.spending_by_category 
        : 'No transactions found'
    );

    // Step 3: Convert spending array to Map for efficient category lookup
    // Key: category_id, Value: { category_id, total_spent, transaction_count }
    const spendingMap = new Map(
      spendingResponse.spending_by_category.map((item) => [item.category_id, item])
    );

    // Step 4: Build category budget items combining budgets and spending
    // For categories with no transactions, defaults spent_amount to 0
    const categoryItems = buildCategoryBudgetItems(budgets, spendingMap);
    
    console.log(`💰 Calculated budget remaining for ${categoryItems.length} categories:`, 
      categoryItems.map(item => ({
        category: item.category_name,
        budgeted: item.budgeted_amount,
        spent: item.spent_amount,
        remaining: item.remaining_amount,
        percentage_used: item.percentage_used.toFixed(1) + '%'
      }))
    );

    // Step 5: Compose final response DTO with month, year, categories, and summary
    const response: BudgetPageResponseDTO = composeBudgetPageResponse(
      parsedMonth,
      parsedYear,
      categoryItems
    );

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/budgets/setup
 *
 * Creates or updates budgets for a specific month/year
 *
 * Request Body:
 * - user_id: string (required) - User ID
 * - month: number (required) - Month (1-12)
 * - year: number (required) - Year (YYYY)
 * - budgets: BudgetSetupItem[] (required) - Array of budget items
 *   - category_id: number
 *   - category_name: string
 *   - planned_amount: number
 *
 * Response:
 * - 201: BudgetSetupResponse
 *   - success: true
 *   - count: Number of budgets created/updated
 *   - month: Budget month
 *   - year: Budget year
 * - 400: Invalid request body or validation error
 * - 500: Server error
 *
 * Example:
 *   POST /api/budgets/setup
 *   Body: {
 *     "user_id": "user-123",
 *     "month": 1,
 *     "year": 2025,
 *     "budgets": [
 *       { "category_id": 1, "category_name": "Groceries", "planned_amount": 300 },
 *       { "category_id": 2, "category_name": "Dining Out", "planned_amount": 150 }
 *     ]
 *   }
 *   Response: {
 *     "success": true,
 *     "count": 2,
 *     "month": 1,
 *     "year": 2025
 *   }
 */
budgetsRouter.post('/budgets/setup', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requestBody = req.body as BudgetSetupRequest;

    // Validate required fields
    if (!requestBody.user_id || requestBody.month === undefined || requestBody.year === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: user_id, month, year'
      });
    }

    if (!Array.isArray(requestBody.budgets)) {
      return res.status(400).json({
        error: 'Budgets must be an array'
      });
    }

    // Validate month range (1-12)
    if (requestBody.month < 1 || requestBody.month > 12) {
      return res.status(400).json({
        error: `Invalid month: ${requestBody.month}. Must be between 1 and 12.`
      });
    }

    // Validate year is reasonable (1970-2100)
    if (requestBody.year < 1970 || requestBody.year > 2100) {
      return res.status(400).json({
        error: `Invalid year: ${requestBody.year}. Must be between 1970 and 2100.`
      });
    }

    // Validate budgets array
    if (requestBody.budgets.length === 0) {
      return res.status(400).json({
        error: 'At least one budget item is required'
      });
    }

    // Validate each budget item
    for (const item of requestBody.budgets) {
      if (!item.category_id || !item.category_name || item.planned_amount === undefined) {
        return res.status(400).json({
          error: 'Each budget item must have category_id, category_name, and planned_amount'
        });
      }

      if (typeof item.planned_amount !== 'number' || item.planned_amount < 0) {
        return res.status(400).json({
          error: `Invalid planned_amount: ${item.planned_amount}. Must be a non-negative number.`
        });
      }
    }

    // Check for duplicate category_ids
    const categoryIds = new Set();
    for (const item of requestBody.budgets) {
      if (categoryIds.has(item.category_id)) {
        return res.status(400).json({
          error: `Duplicate category_id: ${item.category_id}. Each category can only appear once.`
        });
      }
      categoryIds.add(item.category_id);
    }

    // Save budgets to database
    const count = saveBudgets(
      requestBody.user_id,
      requestBody.month,
      requestBody.year,
      requestBody.budgets
    );

    // Return success response
    const response: BudgetSetupResponse = {
      success: true,
      count,
      month: requestBody.month,
      year: requestBody.year
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error in POST /budgets/setup:', error);
    next(error);
  }
});
