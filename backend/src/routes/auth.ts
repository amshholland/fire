import { Router, Request, Response, NextFunction } from 'express';
import { plaidClient } from '../clients/plaidClient';
import { state } from '../state/store';
import { prettyPrint } from '../utils/logger';
import { db } from '../db/database';

export const authRouter = Router();

/**
 * GET /api/auth
 * 
 * Fetch auth data from Plaid
 */
authRouter.get('/auth', async (_req, res, next) => {
  try {
    const r = await plaidClient.authGet({ access_token: state.ACCESS_TOKEN! });
    prettyPrint(r.data);
    res.json(r.data);
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/auth/user
 * 
 * Create or update a user after Google OAuth authentication
 * 
 * Request Body:
 * - user_id: string (required) - User ID from Google token (e.g., sub claim)
 * - email: string (required) - User email
 * - name: string (optional) - User display name
 * 
 * Response:
 * - 201: User created/updated successfully
 * - 400: Missing required fields
 * - 500: Server error
 */
authRouter.post('/auth/user', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id, email, name } = req.body;

    // Validate required fields
    if (!user_id || !email) {
      return res.status(400).json({
        error: 'Missing required fields: user_id, email'
      });
    }

    // Create or update user (UPSERT)
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO users (id, email, name, created_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(user_id, email, name || null);
    console.log('✅ Google user saved to database:', { user_id, email, name });

    res.status(201).json({
      success: true,
      user_id,
      email,
      name: name || null,
      message: 'User created or already exists'
    });
  } catch (error) {
    console.error('Error in POST /api/auth/user:', error);
    next(error);
  }
});