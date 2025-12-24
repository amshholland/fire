/**
 * User Management API Routes
 * 
 * Endpoints for user profile and onboarding state management
 */

import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  createUser,
  getUserById,
  getUserByEmail,
  getUserByGoogleId,
  updateUser,
  updateUserPlaidStatus,
  updateUserOnboardingStatus
} from '../data-access/user-dal';

export const userRouter = Router();

/**
 * POST /api/users
 * Create a new user (local/manual registration)
 */
userRouter.post('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    
    if (!email || email.trim() === '') {
      return res.status(400).json({ error: 'email is required' });
    }
    
    // Check if user already exists
    const existing = getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    const userId = uuidv4();
    const user = createUser(userId, email, null, 'local');
    
    res.status(201).json({ user });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/users/google-auth
 * Create or login user via Google OAuth
 * Expects: { googleId, email } from Google OAuth token
 */
userRouter.post('/users/google-auth', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { googleId, email } = req.body;
    
    if (!googleId || !email) {
      return res.status(400).json({ error: 'googleId and email are required' });
    }
    
    // Check if user exists by Google ID
    let user = getUserByGoogleId(googleId);
    
    if (user) {
      // User exists, return existing user (login)
      return res.json({ user, isNewUser: false });
    }
    
    // Check if user exists by email (link accounts scenario)
    user = getUserByEmail(email);
    
    if (user) {
      // Email exists but different auth provider
      // For security, don't auto-link - require explicit action
      return res.status(409).json({ 
        error: 'An account with this email already exists with a different login method',
        existingProvider: user.auth_provider
      });
    }
    
    // Create new user with Google auth
    const userId = uuidv4();
    user = createUser(userId, email, googleId, 'google');
    
    res.status(201).json({ user, isNewUser: true });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/users/:userId
 * Get user by ID
 */
userRouter.get('/users/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const user = getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/users/by-email/:email
 * Get user by email
 */
userRouter.get('/users/by-email/:email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.params;
    const user = getUserByEmail(email);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

/**
 * PATCH /api/users/:userId
 * Update user information
 */
userRouter.patch('/users/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    
    const user = updateUser(userId, updates);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/users/:userId/plaid-linked
 * Update user's Plaid linkage status
 */
userRouter.post('/users/:userId/plaid-linked', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { hasLinked } = req.body;
    
    if (hasLinked === undefined) {
      return res.status(400).json({ error: 'hasLinked is required' });
    }
    
    const user = updateUserPlaidStatus(userId, hasLinked);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (e) {
    next(e);
  }
});

/**
 * POST /api/users/:userId/onboarding-complete
 * Update user's onboarding completion status
 */
userRouter.post('/users/:userId/onboarding-complete', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { completed } = req.body;
    
    if (completed === undefined) {
      return res.status(400).json({ error: 'completed is required' });
    }
    
    const user = updateUserOnboardingStatus(userId, completed);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (e) {
    next(e);
  }
});
