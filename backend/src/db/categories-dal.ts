/**
 * Categories Data Access Layer
 * 
 * Handles database operations for categories.
 * Read-only operations - no category creation or editing.
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
