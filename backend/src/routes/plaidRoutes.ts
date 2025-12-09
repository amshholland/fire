/**
 * Plaid Routes
 * 
 * API routes for Plaid integration
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

// Link token creation
router.post('/create_link_token', createLinkToken);

// Public token exchange
router.post('/exchange_public_token', exchangePublicToken);

// Get transactions
router.get('/transactions', getTransactions);

// Get accounts
router.get('/accounts', getAccounts);

// Remove item
router.post('/item/remove', removeItem);

export default router;
