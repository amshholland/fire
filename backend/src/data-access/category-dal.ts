/**
 * Category Data Access Layer
 * 
 * Handles all database operations for Category entity.
 * Supports both system-defined categories (available to all users) 
 * and user-custom categories (specific to individual users).
 */

import { getDatabase } from '../database/database';

export interface Category {
  id: number;
  name: string;
  is_system: boolean;
  user_id: string | null;
}

/**
 * Create a user-custom category
 * 
 * @param userId - User UUID
 * @param name - Category name
 * @returns Created category object
 */
export function createCategory(userId: string, name: string): Category {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO categories (name, is_system, user_id)
    VALUES (?, 0, ?)
  `);
  
  const result = stmt.run(name, userId);
  
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
    user_id: row.user_id
  };
}

/**
 * Get all categories available to a user (system + user-custom)
 * 
 * @param userId - User UUID
 * @returns Array of categories ordered by name
 */
export function getCategoriesForUser(userId: string): Category[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM categories 
    WHERE is_system = 1 OR user_id = ?
    ORDER BY name
  `);
  const rows = stmt.all(userId) as any[];
  
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    is_system: Boolean(row.is_system),
    user_id: row.user_id
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
    user_id: row.user_id
  }));
}

/**
 * Get user-custom categories only
 * 
 * @param userId - User UUID
 * @returns Array of user's custom categories
 */
export function getUserCustomCategories(userId: string): Category[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY name');
  const rows = stmt.all(userId) as any[];
  
  return rows.map(row => ({
    id: row.id,
    name: row.name,
    is_system: Boolean(row.is_system),
    user_id: row.user_id
  }));
}

/**
 * Update category name
 * Only user-custom categories can be updated (system categories are read-only)
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
 * Only user-custom categories can be deleted (system categories are protected)
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
 * Check if category name already exists for user
 * Useful for preventing duplicate category names
 * 
 * @param userId - User UUID
 * @param name - Category name to check
 * @returns True if category name exists
 */
export function categoryNameExists(userId: string, name: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT COUNT(*) as count FROM categories 
    WHERE (is_system = 1 OR user_id = ?) AND name = ?
  `);
  const result = stmt.get(userId, name) as any;
  
  return result.count > 0;
}
