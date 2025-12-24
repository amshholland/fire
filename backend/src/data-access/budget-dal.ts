/**
 * Budget Data Access Layer
 * 
 * Handles all database operations for Budget entity.
 * Manages monthly budget allocations per category for users.
 */

import { getDatabase } from '../database/database';

export interface Budget {
  id: number;
  user_id: string;
  category_id: number;
  month: number;
  year: number;
  amount: number;
}

export interface CreateBudgetParams {
  user_id: string;
  category_id: number;
  month: number;
  year: number;
  amount: number;
}

/**
 * Create a new budget entry
 * Enforces unique constraint on (user_id, category_id, month, year)
 * 
 * @param params - Budget creation parameters
 * @returns Created budget object
 */
export function createBudget(params: CreateBudgetParams): Budget {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO budgets (user_id, category_id, month, year, amount)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    params.user_id,
    params.category_id,
    params.month,
    params.year,
    params.amount
  );
  
  return getBudgetById(Number(result.lastInsertRowid))!;
}

/**
 * Get budget by ID
 * 
 * @param id - Budget ID
 * @returns Budget object or undefined if not found
 */
export function getBudgetById(id: number): Budget | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM budgets WHERE id = ?');
  const row = stmt.get(id) as any;
  
  if (!row) return undefined;
  
  return {
    id: row.id,
    user_id: row.user_id,
    category_id: row.category_id,
    month: row.month,
    year: row.year,
    amount: row.amount
  };
}

/**
 * Get budget for specific user, category, month, and year
 * 
 * @param userId - User UUID
 * @param categoryId - Category ID
 * @param month - Month (1-12)
 * @param year - Year
 * @returns Budget object or undefined if not found
 */
export function getBudgetByPeriod(
  userId: string,
  categoryId: number,
  month: number,
  year: number
): Budget | undefined {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM budgets 
    WHERE user_id = ? AND category_id = ? AND month = ? AND year = ?
  `);
  const row = stmt.get(userId, categoryId, month, year) as any;
  
  if (!row) return undefined;
  
  return {
    id: row.id,
    user_id: row.user_id,
    category_id: row.category_id,
    month: row.month,
    year: row.year,
    amount: row.amount
  };
}

/**
 * Get all budgets for a user in a specific month/year
 * 
 * @param userId - User UUID
 * @param month - Month (1-12)
 * @param year - Year
 * @returns Array of budgets for the period
 */
export function getBudgetsByPeriod(userId: string, month: number, year: number): Budget[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM budgets 
    WHERE user_id = ? AND month = ? AND year = ?
    ORDER BY category_id
  `);
  const rows = stmt.all(userId, month, year) as any[];
  
  return rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    category_id: row.category_id,
    month: row.month,
    year: row.year,
    amount: row.amount
  }));
}

/**
 * Get all budgets for a user
 * 
 * @param userId - User UUID
 * @returns Array of all budgets for the user ordered by year, month
 */
export function getBudgetsByUserId(userId: string): Budget[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM budgets 
    WHERE user_id = ?
    ORDER BY year DESC, month DESC
  `);
  const rows = stmt.all(userId) as any[];
  
  return rows.map(row => ({
    id: row.id,
    user_id: row.user_id,
    category_id: row.category_id,
    month: row.month,
    year: row.year,
    amount: row.amount
  }));
}

/**
 * Update budget amount
 * 
 * @param budgetId - Budget ID
 * @param newAmount - New budget amount
 * @returns Updated budget object
 */
export function updateBudgetAmount(budgetId: number, newAmount: number): Budget | undefined {
  const db = getDatabase();
  const stmt = db.prepare('UPDATE budgets SET amount = ? WHERE id = ?');
  
  stmt.run(newAmount, budgetId);
  
  return getBudgetById(budgetId);
}

/**
 * Update or create budget (upsert)
 * If budget exists for the period, updates amount; otherwise creates new budget
 * 
 * @param params - Budget parameters
 * @returns Updated or created budget object
 */
export function upsertBudget(params: CreateBudgetParams): Budget {
  const existing = getBudgetByPeriod(params.user_id, params.category_id, params.month, params.year);
  
  if (existing) {
    return updateBudgetAmount(existing.id, params.amount)!;
  }
  
  return createBudget(params);
}

/**
 * Delete budget
 * 
 * @param budgetId - Budget ID
 * @returns True if budget was deleted
 */
export function deleteBudget(budgetId: number): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM budgets WHERE id = ?');
  const result = stmt.run(budgetId);
  
  return result.changes > 0;
}

/**
 * Get total budget amount for a user in a specific month/year
 * 
 * @param userId - User UUID
 * @param month - Month (1-12)
 * @param year - Year
 * @returns Sum of all budget amounts for the period
 */
export function getTotalBudgetForPeriod(userId: string, month: number, year: number): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT SUM(amount) as total FROM budgets 
    WHERE user_id = ? AND month = ? AND year = ?
  `);
  const result = stmt.get(userId, month, year) as any;
  
  return result.total || 0;
}
