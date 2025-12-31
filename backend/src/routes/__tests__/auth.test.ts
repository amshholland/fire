import request from 'supertest';
import express from 'express';
import { authRouter } from '../auth';
import { initializeDatabase, seedDatabase } from '../../db/database';
import { db } from '../../db/database';

describe('Auth Routes', () => {
  let app: express.Application;

  beforeAll(() => {
    // Initialize test database
    initializeDatabase();
    seedDatabase();

    // Create express app with auth router
    app = express();
    app.use(express.json());
    app.use('/api', authRouter);
  });

  afterAll(() => {
    db.close();
  });

  describe('POST /api/auth/user', () => {
    it('should create a new user with all fields', async () => {
      const response = await request(app)
        .post('/api/auth/user')
        .send({
          user_id: 'google-user-123',
          email: 'testuser@gmail.com',
          name: 'Test User'
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        user_id: 'google-user-123',
        email: 'testuser@gmail.com',
        name: 'Test User',
        message: 'User created or already exists'
      });

      // Verify user was inserted into database
      const user = db
        .prepare('SELECT * FROM users WHERE id = ?')
        .get('google-user-123');
      expect(user).toBeDefined();
      expect(user.email).toBe('testuser@gmail.com');
      expect(user.name).toBe('Test User');
    });

    it('should create a new user without name field', async () => {
      const response = await request(app)
        .post('/api/auth/user')
        .send({
          user_id: 'google-user-456',
          email: 'anotheruser@gmail.com'
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        user_id: 'google-user-456',
        email: 'anotheruser@gmail.com',
        name: null,
        message: 'User created or already exists'
      });

      // Verify user was inserted
      const user = db
        .prepare('SELECT * FROM users WHERE id = ?')
        .get('google-user-456');
      expect(user).toBeDefined();
      expect(user.email).toBe('anotheruser@gmail.com');
      expect(user.name).toBeNull();
    });

    it('should handle duplicate user (INSERT OR IGNORE)', async () => {
      const response1 = await request(app)
        .post('/api/auth/user')
        .send({
          user_id: 'google-user-789',
          email: 'duplicateuser@gmail.com',
          name: 'First Time'
        });

      expect(response1.status).toBe(201);

      // Try to create the same user again
      const response2 = await request(app)
        .post('/api/auth/user')
        .send({
          user_id: 'google-user-789',
          email: 'different@gmail.com', // Different email (should be ignored)
          name: 'Second Time'
        });

      expect(response2.status).toBe(201);

      // Verify the original user data is unchanged
      const user = db
        .prepare('SELECT * FROM users WHERE id = ?')
        .get('google-user-789');
      expect(user.email).toBe('duplicateuser@gmail.com');
      expect(user.name).toBe('First Time');
    });

    it('should return 400 when user_id is missing', async () => {
      const response = await request(app)
        .post('/api/auth/user')
        .send({
          email: 'nouser@gmail.com',
          name: 'No User ID'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toContain('user_id');
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/user')
        .send({
          user_id: 'google-user-999',
          name: 'No Email'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
      expect(response.body.error).toContain('email');
    });

    it('should return 400 when both user_id and email are missing', async () => {
      const response = await request(app)
        .post('/api/auth/user')
        .send({
          name: 'No IDs'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it('should handle empty string user_id (should fail validation)', async () => {
      const response = await request(app)
        .post('/api/auth/user')
        .send({
          user_id: '',
          email: 'test@gmail.com',
          name: 'Empty ID'
        });

      expect(response.status).toBe(400);
    });

    it('should handle empty string email (should fail validation)', async () => {
      const response = await request(app)
        .post('/api/auth/user')
        .send({
          user_id: 'google-user-empty-email',
          email: '',
          name: 'Empty Email'
        });

      expect(response.status).toBe(400);
    });
  });
});
