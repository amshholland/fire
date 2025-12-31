/**
 * Categories Routes Tests
 * 
 * Tests for categories endpoints.
 */

import request from 'supertest';
import express, { Express } from 'express';
import { categoriesRouter } from '../categories';
import { initializeDatabase, seedDatabase, db } from '../../db/database';
import * as categoriesDal from '../../db/categories-dal';

describe('Categories Routes', () => {
  let app: Express;

  beforeAll(() => {
    // Initialize database with seed data
    initializeDatabase();
    seedDatabase();

    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api', categoriesRouter);
  });

  afterAll(() => {
    db.close();
  });

  describe('GET /api/categories', () => {
    it('should return all categories for valid user_id', async () => {
      const response = await request(app)
        .get('/api/categories')
        .query({ user_id: 'user-demo' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('categories');
      expect(response.body).toHaveProperty('count');
      expect(Array.isArray(response.body.categories)).toBe(true);
      expect(response.body.count).toBe(response.body.categories.length);
    });

    it('should return categories with correct structure', async () => {
      const response = await request(app)
        .get('/api/categories')
        .query({ user_id: 'user-demo' });

      expect(response.status).toBe(200);
      
      const category = response.body.categories[0];
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('description');
      expect(category).toHaveProperty('created_at');
      
      expect(typeof category.id).toBe('number');
      expect(typeof category.name).toBe('string');
      expect(typeof category.created_at).toBe('string');
    });

    it('should return categories sorted alphabetically', async () => {
      const response = await request(app)
        .get('/api/categories')
        .query({ user_id: 'user-demo' });

      expect(response.status).toBe(200);
      
      const categories = response.body.categories;
      
      // Verify alphabetical order
      for (let i = 1; i < categories.length; i++) {
        const comparison = categories[i].name.localeCompare(categories[i - 1].name);
        expect(comparison).toBeGreaterThanOrEqual(0);
      }
    });

    it('should return unique categories (no duplicates)', async () => {
      const response = await request(app)
        .get('/api/categories')
        .query({ user_id: 'user-demo' });

      expect(response.status).toBe(200);
      
      const categories = response.body.categories;
      const categoryIds = categories.map((c: any) => c.id);
      const uniqueIds = new Set(categoryIds);
      
      expect(categoryIds.length).toBe(uniqueIds.size);
    });

    it('should return 400 when user_id is missing', async () => {
      const response = await request(app)
        .get('/api/categories');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('user_id');
    });

    it('should accept numeric user_id as query param (converted to string)', async () => {
      // Express query params are always strings, so 123 becomes '123'
      const response = await request(app)
        .get('/api/categories')
        .query({ user_id: 123 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('categories');
    });

    it('should return 400 when user_id is empty string', async () => {
      const response = await request(app)
        .get('/api/categories')
        .query({ user_id: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return categories for any user_id (system categories)', async () => {
      const response1 = await request(app)
        .get('/api/categories')
        .query({ user_id: 'user-1' });

      const response2 = await request(app)
        .get('/api/categories')
        .query({ user_id: 'user-2' });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      
      // Should return same categories (system categories)
      expect(response1.body.count).toBe(response2.body.count);
    });

    it('should include all seed categories', async () => {
      const response = await request(app)
        .get('/api/categories')
        .query({ user_id: 'user-demo' });

      expect(response.status).toBe(200);
      
      const categoryNames = response.body.categories.map((c: any) => c.name);
      
      // Check for seed categories from database.ts
      const expectedCategories = [
        'Groceries',
        'Dining Out',
        'Transportation',
        'Entertainment',
        'Utilities',
        'Shopping',
        'Healthcare',
        'Other'
      ];
      
      expectedCategories.forEach(expectedName => {
        expect(categoryNames).toContain(expectedName);
      });
    });

    it('should handle database errors gracefully', async () => {
      // Mock getAvailableCategories to throw error
      jest.spyOn(categoriesDal, 'getAvailableCategories').mockImplementation(() => {
        throw new Error('Database connection error');
      });

      const response = await request(app)
        .get('/api/categories')
        .query({ user_id: 'user-demo' });

      // Should return 500 for server errors
      expect(response.status).toBe(500);

      // Restore original implementation
      jest.restoreAllMocks();
    });

    it('should return empty array when no categories exist', async () => {
      // Mock getAvailableCategories to return empty array
      jest.spyOn(categoriesDal, 'getAvailableCategories').mockReturnValue([]);

      const response = await request(app)
        .get('/api/categories')
        .query({ user_id: 'user-test' });

      expect(response.status).toBe(200);
      expect(response.body.categories).toEqual([]);
      expect(response.body.count).toBe(0);

      // Restore original implementation
      jest.restoreAllMocks();
    });

    it('should match count with actual array length', async () => {
      const response = await request(app)
        .get('/api/categories')
        .query({ user_id: 'user-demo' });

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(response.body.categories.length);
    });
  });

  describe('Response Format', () => {
    it('should have exactly two top-level properties', async () => {
      const response = await request(app)
        .get('/api/categories')
        .query({ user_id: 'user-demo' });

      expect(response.status).toBe(200);
      expect(Object.keys(response.body)).toEqual(['categories', 'count']);
    });

    it('should return count as number', async () => {
      const response = await request(app)
        .get('/api/categories')
        .query({ user_id: 'user-demo' });

      expect(response.status).toBe(200);
      expect(typeof response.body.count).toBe('number');
      expect(Number.isInteger(response.body.count)).toBe(true);
    });

    it('should return categories as array', async () => {
      const response = await request(app)
        .get('/api/categories')
        .query({ user_id: 'user-demo' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.categories)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in user_id', async () => {
      const response = await request(app)
        .get('/api/categories')
        .query({ user_id: 'user-with-special-chars!@#' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('categories');
    });

    it('should handle very long user_id', async () => {
      const longUserId = 'user-' + 'a'.repeat(1000);
      
      const response = await request(app)
        .get('/api/categories')
        .query({ user_id: longUserId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('categories');
    });

    it('should handle UUID format user_id', async () => {
      const response = await request(app)
        .get('/api/categories')
        .query({ user_id: '550e8400-e29b-41d4-a716-446655440000' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('categories');
    });
  });

  describe('POST /api/categories', () => {
    it('should create a new category with valid name', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ name: 'Test Category' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('category');
      expect(response.body.category).toHaveProperty('id');
      expect(response.body.category.name).toBe('Test Category');
      expect(response.body.category).toHaveProperty('created_at');
    });

    it('should create a category with name and description', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ name: 'Category with Description', description: 'Test description' });

      expect(response.status).toBe(201);
      expect(response.body.category.name).toBe('Category with Description');
      expect(response.body.category.description).toBe('Test description');
    });

    it('should trim whitespace from category name', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ name: '  Spaced Category  ' });

      expect(response.status).toBe(201);
      expect(response.body.category.name).toBe('Spaced Category');
    });

    it('should return 400 for missing name', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing or invalid required parameter: name');
    });

    it('should return 400 for empty name', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing or invalid required parameter: name');
    });

    it('should return 400 for whitespace-only name', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ name: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing or invalid required parameter: name');
    });

    it('should return 400 for invalid name type', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({ name: 123 });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing or invalid required parameter: name');
    });
  });
});
