/**
 * Categories Data Access Layer
 * 
 * Handles database operations for categories.
 */

import { db } from './database';

/**
 * Category interface matching database schema
 */
export interface Category {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

/**
 * Get all categories available for budget planning
 * 
 * Currently returns system categories only.
 * Future: Could be extended to include user-specific or account-scoped categories.
 * 
 * @param _userId - User ID (for future account-scoped category filtering)
 * @returns Array of categories sorted alphabetically by name
 */
export function getAvailableCategories(_userId: string): Category[] {
  try {
    const query = `
      SELECT id, name, description, created_at
      FROM categories
      ORDER BY name ASC
    `;
    
    const results = db.prepare(query).all() as Category[];
    return results;
  } catch (error) {
    console.error('Error fetching available categories:', error);
    return [];
  }
}

/**
 * Get category by ID
 * 
 * @param categoryId - Category ID
 * @returns Category or null if not found
 */
export function getCategoryById(categoryId: number): Category | null {
  try {
    const query = `
      SELECT id, name, description, created_at
      FROM categories
      WHERE id = ?
    `;
    
    const result = db.prepare(query).get(categoryId) as Category | undefined;
    return result || null;
  } catch (error) {
    console.error('Error fetching category by ID:', error);
    return null;
  }
}

/**
 * Create a new category
 * 
 * @param name - Category name
 * @param description - Optional category description
 * @returns Created category or null if failed
 */
export function createCategory(name: string, description?: string): Category | null {
  try {
    const insertStmt = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
    const result = insertStmt.run(name, description || null);
    
    // Return the created category
    return getCategoryById(result.lastInsertRowid as number);
  } catch (error) {
    console.error('Error creating category:', error);
    return null;
  }
}

/**
 * Update an existing category
 * 
 * @param categoryId - Category ID to update
 * @param name - New category name
 * @param description - Optional new category description
 * @returns Updated category or null if failed
 */
export function updateCategory(categoryId: number, name: string, description?: string): Category | null {
  try {
    const updateStmt = db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?');
    const result = updateStmt.run(name, description || null, categoryId);
    
    if (result.changes === 0) {
      return null; // Category not found
    }
    
    // Return the updated category
    return getCategoryById(categoryId);
  } catch (error) {
    console.error('Error updating category:', error);
    return null;
  }
}

/**
 * Check if a category exists
 * 
 * @param categoryId - Category ID
 * @returns True if category exists, false otherwise
 */
export function categoryExists(categoryId: number): boolean {
  try {
    const query = `
      SELECT COUNT(*) as count
      FROM categories
      WHERE id = ?
    `;
    
    const result = db.prepare(query).get(categoryId) as { count: number };
    return result.count > 0;
  } catch (error) {
    console.error('Error checking category existence:', error);
    return false;
  }
}

/**
 * Get unique categories from a list of category IDs
 * 
 * Filters out duplicates and non-existent categories.
 * 
 * @param categoryIds - Array of category IDs
 * @returns Array of unique, valid categories sorted alphabetically
 */
export function getCategoriesByIds(categoryIds: number[]): Category[] {
  try {
    if (categoryIds.length === 0) {
      return [];
    }

    // Remove duplicates
    const uniqueIds = [...new Set(categoryIds)];

    // Create placeholders for SQL IN clause
    const placeholders = uniqueIds.map(() => '?').join(',');
    
    const query = `
      SELECT id, name, description, created_at
      FROM categories
      WHERE id IN (${placeholders})
      ORDER BY name ASC
    `;
    
    const results = db.prepare(query).all(...uniqueIds) as Category[];
    return results;
  } catch (error) {
    console.error('Error fetching categories by IDs:', error);
    return [];
  }
}

/**
 * Get distinct Plaid primary categories from user transactions
 * Used to initialize budget setup with categories from actual spending
 * 
 * @param userId - User ID
 * @returns Array of distinct Plaid primary categories
 */
export interface PlaidCategory {
  plaid_primary_category: string;
}

export function getPlaidCategoriesFromTransactions(userId: string): string[] {
  try {
    const query = `
      SELECT DISTINCT plaid_primary_category
      FROM transactions
      WHERE user_id = ?
        AND plaid_primary_category IS NOT NULL
        AND plaid_primary_category != ''
      ORDER BY plaid_primary_category ASC
    `;
    
    const results = db.prepare(query).all(userId) as PlaidCategory[];
    return results.map((row) => row.plaid_primary_category);
  } catch (error) {
    console.error('Error fetching Plaid categories from transactions:', error);
    return [];
  }
}
