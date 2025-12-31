import { Router, Request, Response, NextFunction } from 'express';
import { plaidClient } from '../clients/plaidClient';
import { state } from '../state/store';
import { db } from '../db/database';
import { prettyPrint } from '../utils/logger';

export const tokenRouter = Router();

/**
 * POST /set_access_token
 * 
 * Exchange Plaid public token for access token and save to database
 * 
 * Request Body:
 * - public_token: string - Token from Plaid Link
 * - user_id: string (optional) - User ID to associate with token
 * 
 * Response:
 * - access_token: string
 * - item_id: string
 * - error: null
 */
tokenRouter.post('/set_access_token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    state.PUBLIC_TOKEN = req.body.public_token;
    const tokenResp = await plaidClient.itemPublicTokenExchange({ public_token: state.PUBLIC_TOKEN! });
    prettyPrint(tokenResp.data);
    state.ACCESS_TOKEN = tokenResp.data.access_token;
    state.ITEM_ID = tokenResp.data.item_id;

    // Save access token to database if user_id is provided
    if (req.body.user_id) {
      const updateStmt = db.prepare(`
        UPDATE users 
        SET plaid_access_token = ?
        WHERE id = ?
      `);
      updateStmt.run(state.ACCESS_TOKEN, req.body.user_id);
      console.log(`✅ Plaid access token saved for user: ${req.body.user_id}`);
    }

    res.json({ access_token: state.ACCESS_TOKEN, item_id: state.ITEM_ID, error: null });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /restore_access_token/:user_id
 * 
 * Restore previously saved Plaid access token for a user
 * 
 * Request Params:
 * - user_id: string - User ID
 * 
 * Response:
 * - access_token: string | null - Saved access token or null if not found
 * - restored: boolean - Whether token was successfully restored
 */
tokenRouter.get('/restore_access_token/:user_id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.params;

    // Fetch user's saved access token
    const user = db.prepare(`
      SELECT plaid_access_token FROM users WHERE id = ?
    `).get(user_id) as { plaid_access_token: string | null } | undefined;

    if (user && user.plaid_access_token) {
      state.ACCESS_TOKEN = user.plaid_access_token;
      console.log(`✅ Plaid access token retrieved from database for user: ${user_id}`);
      res.json({
        access_token: user.plaid_access_token,
        restored: true
      });
    } else {
      console.log(`ℹ️ No Plaid access token found for user: ${user_id}`);
      res.json({
        access_token: null,
        restored: false
      });
    }
  } catch (e) {
    next(e);
  }
});