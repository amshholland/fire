/**
 * Budgets Data Access Layer
 * 
 * Handles database operations for budget records.
 * Focus on persistence - no business logic or calculations.
 */

import { db } from './database';
import { BudgetSetupItem } from '../types/budget-setup.types';

/**
 * Budget record interface matching database schema
 */
export interface BudgetRecord {
  id: number;
  user_id: string;
  category_id: number;
  month: number;
  year: number;
  amount: number;
  created_at: string;
  updated_at: string;
}

/**
 * Result of budget creation/update operation
 */
export interface CreateBudgetsResult {
  success: boolean;
  created: number;
  updated: number;
  total: number;
  error?: string;
}

/**
 * Create or update budget records for a specific month/year
 * 
 * Uses UPSERT logic (INSERT OR REPLACE) to handle both creation and updates.
 * The UNIQUE constraint on (user_id, category_id, month, year) ensures
 * that existing budgets are overwritten.
 * 
 * @param userId - User ID
 * @param month - Budget month (1-12)
 * @param year - Budget year (YYYY)
 * @param budgetItems - Array of budget items with category_id and planned_amount
 * @returns Result with counts of created/updated records
 */
export function createOrUpdateBudgets(
  userId: string,
  month: number,
  year: number,
  budgetItems: BudgetSetupItem[]
): CreateBudgetsResult {
  try {
    // Start transaction for atomic operation
    const transaction = db.transaction(() => {
      let created = 0;
      let updated = 0;

      // Check if each budget already exists
      const checkQuery = db.prepare(`
        SELECT id FROM budgets
        WHERE user_id = ? AND category_id = ? AND month = ? AND year = ?
      `);

      // Use INSERT OR REPLACE for UPSERT behavior
      // This maintains the UNIQUE constraint and updates existing records
      const upsertQuery = db.prepare(`
        INSERT INTO budgets (user_id, category_id, month, year, amount, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(user_id, category_id, month, year)
        DO UPDATE SET
          amount = excluded.amount,
          updated_at = datetime('now')
      `);

      for (const item of budgetItems) {
        // Check if record exists
        const existing = checkQuery.get(userId, item.category_id, month, year);
        
        // Execute upsert
        upsertQuery.run(userId, item.category_id, month, year, item.planned_amount);
        
        if (existing) {
          updated++;
        } else {
          created++;
        }
      }

      return { created, updated };
    });

    // Execute transaction
    const result = transaction();

    return {
      success: true,
      created: result.created,
      updated: result.updated,
      total: result.created + result.updated
    };
  } catch (error) {
    console.error('Error creating/updating budgets:', error);
    return {
      success: false,
      created: 0,
      updated: 0,
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

/**
 * Delete all budgets for a specific user/month/year
 * 
 * Used when user wants to clear all budgets for a period.
 * 
 * @param userId - User ID
 * @param month - Budget month (1-12)
 * @param year - Budget year (YYYY)
 * @returns Number of deleted records
 */
export function deleteBudgetsByMonth(
  userId: string,
  month: number,
  year: number
): number {
  try {
    const query = db.prepare(`
      DELETE FROM budgets
      WHERE user_id = ? AND month = ? AND year = ?
    `);

    const result = query.run(userId, month, year);
    return result.changes;
  } catch (error) {
    console.error('Error deleting budgets:', error);
    return 0;
  }
}

/**
 * Get budget records for a specific user/month/year
 * 
 * @param userId - User ID
 * @param month - Budget month (1-12)
 * @param year - Budget year (YYYY)
 * @returns Array of budget records
 */
export function getBudgetsByMonth(
  userId: string,
  month: number,
  year: number
): BudgetRecord[] {
  try {
    const query = db.prepare(`
      SELECT id, user_id, category_id, month, year, amount, created_at, updated_at
      FROM budgets
      WHERE user_id = ? AND month = ? AND year = ?
      ORDER BY category_id ASC
    `);

    return query.all(userId, month, year) as BudgetRecord[];
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return [];
  }
}

/**
 * Get a specific budget record
 * 
 * @param userId - User ID
 * @param categoryId - Category ID
 * @param month - Budget month (1-12)
 * @param year - Budget year (YYYY)
 * @returns Budget record or null if not found
 */
export function getBudgetByCategory(
  userId: string,
  categoryId: number,
  month: number,
  year: number
): BudgetRecord | null {
  try {
    const query = db.prepare(`
      SELECT id, user_id, category_id, month, year, amount, created_at, updated_at
      FROM budgets
      WHERE user_id = ? AND category_id = ? AND month = ? AND year = ?
    `);

    const result = query.get(userId, categoryId, month, year) as BudgetRecord | undefined;
    return result || null;
  } catch (error) {
    console.error('Error fetching budget by category:', error);
    return null;
  }
}

/**
 * Check if a budget exists for a specific category/month/year
 * 
 * @param userId - User ID
 * @param categoryId - Category ID
 * @param month - Budget month (1-12)
 * @param year - Budget year (YYYY)
 * @returns True if budget exists, false otherwise
 */
export function budgetExists(
  userId: string,
  categoryId: number,
  month: number,
  year: number
): boolean {
  try {
    const query = db.prepare(`
      SELECT COUNT(*) as count
      FROM budgets
      WHERE user_id = ? AND category_id = ? AND month = ? AND year = ?
    `);

    const result = query.get(userId, categoryId, month, year) as { count: number };
    return result.count > 0;
  } catch (error) {
    console.error('Error checking budget existence:', error);
    return false;
  }
}
