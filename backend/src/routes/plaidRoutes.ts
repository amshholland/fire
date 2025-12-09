/**
 * Plaid Routes
 * 
 * API routes for Plaid integration using the sandbox environment.
 */

import { Router } from 'express';
import {
  createLinkToken,
  exchangePublicToken,
  getTransactions,
  getAccounts,
  removeItem,
} from '../controllers/plaidController.js';

const router = Router();

// Link token creation (Sandbox)
router.post('/create_link_token', async (req, res) => {
  try {
    // Ensure the createLinkToken function is configured for sandbox
    await createLinkToken(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create link token in sandbox' });
  }
});

// Public token exchange (Sandbox)
router.post('/exchange_public_token', async (req, res) => {
  try {
    // Ensure the exchangePublicToken function is configured for sandbox
    await exchangePublicToken(req, res);
  } catch (error) {
    res.status(500).json({ error: 'Failed to exchange public token in sandbox' });
  }
});

// Additional routes can be added here for transactions, accounts, etc.

export default router;