/**
 * Budget Data Access Layer
 *
 * Handles database operations for budgets including:
 * - Creating/updating budgets
 * - Fetching budgets by user/month/year
 * - Deleting budgets
 */

import { db } from './database';
import { BudgetSetupItem } from '../types/budget-setup.types';

/**
 * Create or update budgets for a user in a specific month/year
 *
 * Uses UPSERT pattern (INSERT OR REPLACE) to handle:
 * - New budget creation
 * - Existing budget updates
 *
 * Validates:
 * - User exists before inserting budgets
 * - All category_ids exist before inserting budgets
 *
 * @param userId - User ID
 * @param month - Month (1-12)
 * @param year - Year (YYYY)
 * @param budgetItems - Array of budget items to save
 * @returns Number of budgets created/updated
 * @throws Error if user doesn't exist or any category_id is invalid
 */
export function saveBudgets(
  userId: string,
  month: number,
  year: number,
  budgetItems: BudgetSetupItem[]
): number {
  try {
    // Validate user exists
    const userCheck = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!userCheck) {
      throw new Error(`User not found: ${userId}`);
    }

    // Validate all category_ids exist
    const categoryIds = budgetItems.map(item => item.category_id);
    if (categoryIds.length > 0) {
      const placeholders = categoryIds.map(() => '?').join(',');
      const existingCategories = db
        .prepare(`SELECT id FROM categories WHERE id IN (${placeholders})`)
        .all(...categoryIds) as { id: number }[];

      const existingIds = new Set(existingCategories.map(c => c.id));
      const missingIds = categoryIds.filter(id => !existingIds.has(id));

      if (missingIds.length > 0) {
        throw new Error(`Invalid category_ids: ${missingIds.join(', ')}`);
      }
    }

    // Begin transaction for consistency
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO budgets 
      (user_id, category_id, month, year, amount, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const transaction = db.transaction(() => {
      let count = 0;
      for (const item of budgetItems) {
        insertStmt.run(
          userId,
          item.category_id,
          month,
          year,
          item.planned_amount
        );
        count++;
      }
      return count;
    });

    return transaction();
  } catch (error) {
    console.error('Error saving budgets:', error);
    throw error;
  }
}

/**
 * Fetch budgets for a user in a specific month/year
 *
 * @param userId - User ID
 * @param month - Month (1-12)
 * @param year - Year (YYYY)
 * @returns Array of budgets with category names
 */
export function getBudgetsByMonthYear(
  userId: string,
  month: number,
  year: number
): Array<{
  id: number;
  category_id: number;
  category_name: string;
  planned_amount: number;
}> {
  try {
    const stmt = db.prepare(`
      SELECT 
        b.id,
        b.category_id,
        c.name as category_name,
        b.amount as planned_amount
      FROM budgets b
      JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = ? AND b.month = ? AND b.year = ?
      ORDER BY c.name ASC
    `);

    return stmt.all(userId, month, year) as any;
  } catch (error) {
    console.error('Error fetching budgets:', error);
    throw error;
  }
}

/**
 * Delete a specific budget
 *
 * @param budgetId - Budget ID
 * @returns true if deleted, false if not found
 */
export function deleteBudget(budgetId: number): boolean {
  try {
    const stmt = db.prepare('DELETE FROM budgets WHERE id = ?');
    const result = stmt.run(budgetId);
    return result.changes > 0;
  } catch (error) {
    console.error('Error deleting budget:', error);
    throw error;
  }
}

/**
 * Delete all budgets for a user in a specific month/year
 *
 * Useful for clearing budgets before re-importing
 *
 * @param userId - User ID
 * @param month - Month (1-12)
 * @param year - Year (YYYY)
 * @returns Number of budgets deleted
 */
export function deleteBudgetsByMonthYear(
  userId: string,
  month: number,
  year: number
): number {
  try {
    const stmt = db.prepare(`
      DELETE FROM budgets 
      WHERE user_id = ? AND month = ? AND year = ?
    `);
    const result = stmt.run(userId, month, year);
    return result.changes;
  } catch (error) {
    console.error('Error deleting budgets by month/year:', error);
    throw error;
  }
}

/**
 * Check if budgets exist for a user in a specific month/year
 *
 * @param userId - User ID
 * @param month - Month (1-12)
 * @param year - Year (YYYY)
 * @returns true if budgets exist, false otherwise
 */
export function hasBudgetsForMonth(
  userId: string,
  month: number,
  year: number
): boolean {
  try {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM budgets 
      WHERE user_id = ? AND month = ? AND year = ?
    `);
    const result = stmt.get(userId, month, year) as { count: number };
    return result.count > 0;
  } catch (error) {
    console.error('Error checking budgets existence:', error);
    throw error;
  }
}
