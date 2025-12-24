/**
 * Category Data Access Layer
 * 
 * Handles all database operations for Category entity.
 * Supports system-defined categories (global) and account-scoped categories.
 * 
 * DESIGN NOTES:
 * - System categories (is_system=1, account_id=NULL) are global and available for all accounts
 * - Account-scoped categories (is_system=0, account_id=X) apply only to transactions from that account
 * - Categories are account-scoped, not user-scoped
 * - This enables per-account categorization rules without cross-account conflicts
 */

import { getDatabase } from '../database/database';

export interface Category {
  id: number;
  name: string;
  is_system: boolean;
  account_id: number | null;
}

/**
 * Create an account-scoped category
 * 
 * @param accountId - Account ID to scope this category to
 * @param name - Category name
 * @returns Created category object
 */
export function createCategory(accountId: number, name: string): Category {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO categories (name, is_system, account_id)
    VALUES (?, 0, ?)
  `);
  
  const result = stmt.run(name, accountId);
  
  return getCategoryById(Number(result.lastInsertRowid))!;
}

/**
 * Get category by ID
 * 
 * @param id - Category ID
 * @returns Category object or undefined if not found
 */
export function getCategoryById(id: number): Category | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM categories WHERE id = ?');
  const row = stmt.get(id) as any;
  
  if (!row) return undefined;
  
  return {
    id: row.id,
    name: row.name,
    is_system: Boolean(row.is_system),
    account_id: row.account_id
  };
}

/**
 * Get all categories available for an account (system + account-scoped)
 * 
 * @param accountId - Account ID
 * @returns Array of categories ordered by name
 */
export function getCategoriesForAccount(accountId: number): Category[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM categories 
    WHERE is_system = 1 OR account_id = ?
    ORDER BY name
  `);
  const rows = stmt.all(accountId) as any[];
  
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    is_system: Boolean(row.is_system),
    account_id: row.account_id
  }));
}

/**
 * Get all system categories
 * 
 * @returns Array of system categories
 */
export function getSystemCategories(): Category[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM categories WHERE is_system = 1 ORDER BY name');
  const rows = stmt.all() as any[];
  
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    is_system: Boolean(row.is_system),
    account_id: row.account_id
  }));
}

/**
 * Get account-scoped categories only (excludes system categories)
 * 
 * @param accountId - Account ID
 * @returns Array of account's custom categories
 */
export function getAccountCategories(accountId: number): Category[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM categories WHERE account_id = ? ORDER BY name');
  const rows = stmt.all(accountId) as any[];
  
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    is_system: Boolean(row.is_system),
    account_id: row.account_id
  }));
}

/**
 * Update category name
 * Only account-scoped categories can be updated (system categories are read-only)
 * 
 * @param categoryId - Category ID
 * @param newName - New category name
 * @returns Updated category object or undefined if not found/not allowed
 */
export function updateCategoryName(categoryId: number, newName: string): Category | undefined {
  const db = getDatabase();
  
  // Check if category exists and is not a system category
  const category = getCategoryById(categoryId);
  if (!category || category.is_system) {
    return undefined;
  }
  
  const stmt = db.prepare('UPDATE categories SET name = ? WHERE id = ?');
  stmt.run(newName, categoryId);
  
  return getCategoryById(categoryId);
}

/**
 * Delete category
 * Only account-scoped categories can be deleted (system categories are protected)
 * Transactions with this category will have category_id set to NULL (via ON DELETE SET NULL)
 * 
 * @param categoryId - Category ID
 * @returns True if category was deleted
 */
export function deleteCategory(categoryId: number): boolean {
  const db = getDatabase();
  
  // Check if category exists and is not a system category
  const category = getCategoryById(categoryId);
  if (!category || category.is_system) {
    return false;
  }
  
  const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
  const result = stmt.run(categoryId);
  
  return result.changes > 0;
}

/**
 * Check if category name already exists for account
 * Useful for preventing duplicate category names
 * 
 * @param accountId - Account ID
 * @param name - Category name to check
 * @returns True if category name exists
 */
export function categoryNameExists(accountId: number, name: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM categories 
    WHERE (is_system = 1 OR account_id = ?) AND name = ?
  `);
  const result = stmt.get(accountId, name) as any;
  
  return result.count > 0;
}
