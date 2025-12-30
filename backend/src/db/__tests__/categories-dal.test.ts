/**
 * Categories DAL Tests
 * 
 * Tests for categories data access layer operations.
 */

import { initializeDatabase, seedDatabase, db } from '../database';
import {
  getAvailableCategories,
  getCategoryById,
  categoryExists,
  getCategoriesByIds,
  Category
} from '../categories-dal';

describe('Categories DAL', () => {
  beforeAll(() => {
    initializeDatabase();
    seedDatabase();
  });

  afterAll(() => {
    db.close();
  });

  describe('getAvailableCategories', () => {
    it('should return all categories sorted alphabetically', () => {
      const categories = getAvailableCategories('user-demo');

      expect(categories.length).toBeGreaterThan(0);
      expect(categories[0]).toHaveProperty('id');
      expect(categories[0]).toHaveProperty('name');
      expect(categories[0]).toHaveProperty('description');
      expect(categories[0]).toHaveProperty('created_at');

      // Verify alphabetical order
      for (let i = 1; i < categories.length; i++) {
        expect(categories[i].name.localeCompare(categories[i - 1].name)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should return categories with correct structure', () => {
      const categories = getAvailableCategories('user-demo');
      const category = categories[0];

      expect(typeof category.id).toBe('number');
      expect(typeof category.name).toBe('string');
      expect(typeof category.created_at).toBe('string');
      // description can be null or string
      if (category.description !== null) {
        expect(typeof category.description).toBe('string');
      }
    });

    it('should return same categories for different users (system categories)', () => {
      const user1Categories = getAvailableCategories('user-1');
      const user2Categories = getAvailableCategories('user-2');

      expect(user1Categories.length).toBe(user2Categories.length);
      expect(user1Categories.map(c => c.id)).toEqual(user2Categories.map(c => c.id));
    });

    it('should handle empty database gracefully', () => {
      // Create a temporary in-memory database
      const Database = require('better-sqlite3');
      const tempDb = new Database(':memory:');
      tempDb.exec('CREATE TABLE categories (id INTEGER PRIMARY KEY, name TEXT, description TEXT, created_at TEXT)');
      
      // Mock the db module temporarily
      const originalDb = require('../database').db;
      (require('../database') as any).db = tempDb;

      const categories = getAvailableCategories('user-test');
      expect(categories).toEqual([]);

      // Restore original db
      (require('../database') as any).db = originalDb;
      tempDb.close();
    });
  });

  describe('getCategoryById', () => {
    it('should return category by ID', () => {
      const categories = getAvailableCategories('user-demo');
      const firstCategory = categories[0];

      const category = getCategoryById(firstCategory.id);

      expect(category).not.toBeNull();
      expect(category?.id).toBe(firstCategory.id);
      expect(category?.name).toBe(firstCategory.name);
    });

    it('should return null for non-existent category', () => {
      const category = getCategoryById(99999);
      expect(category).toBeNull();
    });

    it('should return category with all fields', () => {
      const categories = getAvailableCategories('user-demo');
      const category = getCategoryById(categories[0].id);

      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('description');
      expect(category).toHaveProperty('created_at');
    });
  });

  describe('categoryExists', () => {
    it('should return true for existing category', () => {
      const categories = getAvailableCategories('user-demo');
      const exists = categoryExists(categories[0].id);

      expect(exists).toBe(true);
    });

    it('should return false for non-existent category', () => {
      const exists = categoryExists(99999);
      expect(exists).toBe(false);
    });

    it('should return false for negative ID', () => {
      const exists = categoryExists(-1);
      expect(exists).toBe(false);
    });

    it('should return false for zero ID', () => {
      const exists = categoryExists(0);
      expect(exists).toBe(false);
    });
  });

  describe('getCategoriesByIds', () => {
    it('should return multiple categories by IDs', () => {
      const allCategories = getAvailableCategories('user-demo');
      const idsToFetch = [allCategories[0].id, allCategories[1].id];

      const categories = getCategoriesByIds(idsToFetch);

      expect(categories.length).toBe(2);
      expect(categories.map(c => c.id).sort()).toEqual(idsToFetch.sort());
    });

    it('should return empty array for empty input', () => {
      const categories = getCategoriesByIds([]);
      expect(categories).toEqual([]);
    });

    it('should filter out non-existent IDs', () => {
      const allCategories = getAvailableCategories('user-demo');
      const idsToFetch = [allCategories[0].id, 99999, 99998];

      const categories = getCategoriesByIds(idsToFetch);

      expect(categories.length).toBe(1);
      expect(categories[0].id).toBe(allCategories[0].id);
    });

    it('should remove duplicate IDs', () => {
      const allCategories = getAvailableCategories('user-demo');
      const duplicateIds = [allCategories[0].id, allCategories[0].id, allCategories[1].id];

      const categories = getCategoriesByIds(duplicateIds);

      expect(categories.length).toBe(2);
      // Verify no duplicates in result
      const uniqueIds = new Set(categories.map(c => c.id));
      expect(uniqueIds.size).toBe(categories.length);
    });

    it('should return categories sorted alphabetically', () => {
      const allCategories = getAvailableCategories('user-demo');
      const idsToFetch = allCategories.slice(0, 5).map(c => c.id);

      const categories = getCategoriesByIds(idsToFetch);

      // Verify alphabetical order
      for (let i = 1; i < categories.length; i++) {
        expect(categories[i].name.localeCompare(categories[i - 1].name)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle single ID', () => {
      const allCategories = getAvailableCategories('user-demo');
      const categories = getCategoriesByIds([allCategories[0].id]);

      expect(categories.length).toBe(1);
      expect(categories[0].id).toBe(allCategories[0].id);
    });
  });

  describe('Category Structure', () => {
    it('should match expected TypeScript interface', () => {
      const categories = getAvailableCategories('user-demo');
      const category: Category = categories[0];

      // TypeScript will catch type mismatches at compile time
      // This test verifies runtime structure
      expect(category).toBeDefined();
      expect(Number.isInteger(category.id)).toBe(true);
      expect(category.id).toBeGreaterThan(0);
    });

    it('should have valid name', () => {
      const categories = getAvailableCategories('user-demo');
      
      categories.forEach(category => {
        expect(category.name).toBeTruthy();
        expect(category.name.length).toBeGreaterThan(0);
      });
    });

    it('should have valid created_at timestamp', () => {
      const categories = getAvailableCategories('user-demo');
      
      categories.forEach(category => {
        expect(category.created_at).toBeTruthy();
        // Verify it's a valid date string
        const date = new Date(category.created_at);
        expect(date.toString()).not.toBe('Invalid Date');
      });
    });
  });
});
