/**
 * Plaid Controller
 * 
 * Handles all Plaid API operations including link token creation,
 * public token exchange, and transaction retrieval
 */

import { Request, Response } from 'express';
import { plaidClient } from '../config/plaid.js';
import {
  Products,
  CountryCode,
  LinkTokenCreateRequest,
  ItemPublicTokenExchangeRequest,
  TransactionsGetRequest,
  AccountsGetRequest,
  ItemRemoveRequest,
} from 'plaid';

// In-memory storage for access tokens (replace with database in production)
const accessTokens = new Map<string, string>();

/**
 * Create a link token for initializing Plaid Link
 */
export async function createLinkToken(req: Request, res: Response) {
  try {
    const request: LinkTokenCreateRequest = {
      user: {
        client_user_id: req.body.user_id || 'default-user',
      },
      client_name: 'FIRE App',
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: 'en',
    };

    const response = await plaidClient.linkTokenCreate(request);
    res.json({
      link_token: response.data.link_token,
      expiration: response.data.expiration,
    });
  } catch (error: any) {
    console.error('Error creating link token:', error);
    res.status(500).json({
      error: error.response?.data?.error_message || 'Failed to create link token',
    });
  }
}

/**
 * Exchange public token for access token
 */
export async function exchangePublicToken(req: Request, res: Response) {
  try {
    const { public_token } = req.body;

    if (!public_token) {
      return res.status(400).json({ error: 'public_token is required' });
    }

    const request: ItemPublicTokenExchangeRequest = {
      public_token,
    };

    const response = await plaidClient.itemPublicTokenExchange(request);
    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    // Store access token (in production, save to database with user association)
    accessTokens.set(itemId, accessToken);

    res.status(201).json({
      access_token: accessToken,
      item_id: itemId,
    });
  } catch (error: any) {
    console.error('Error exchanging public token:', error);
    res.status(500).json({
      error: error.response?.data?.error_message || 'Failed to exchange public token',
    });
  }
}

/**
 * Get transactions for a date range
 */
export async function getTransactions(req: Request, res: Response) {
  try {
    const { start_date, end_date, access_token } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        error: 'start_date and end_date are required',
      });
    }

    // Get access token from query or use stored token
    const token = access_token as string || Array.from(accessTokens.values())[0];

    if (!token) {
      return res.status(400).json({
        error: 'No access token available. Please connect a bank account first.',
      });
    }

    const request: TransactionsGetRequest = {
      access_token: token,
      start_date: start_date as string,
      end_date: end_date as string,
    };

    const response = await plaidClient.transactionsGet(request);

    res.json({
      transactions: response.data.transactions,
      accounts: response.data.accounts,
      total_transactions: response.data.total_transactions,
    });
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      error: error.response?.data?.error_message || 'Failed to fetch transactions',
    });
  }
}

/**
 * Get account balances
 */
export async function getAccounts(req: Request, res: Response) {
  try {
    const { access_token } = req.query;

    // Get access token from query or use stored token
    const token = access_token as string || Array.from(accessTokens.values())[0];

    if (!token) {
      return res.status(400).json({
        error: 'No access token available. Please connect a bank account first.',
      });
    }

    const request: AccountsGetRequest = {
      access_token: token,
    };

    const response = await plaidClient.accountsGet(request);

    res.json({
      accounts: response.data.accounts,
      item: response.data.item,
    });
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({
      error: error.response?.data?.error_message || 'Failed to fetch accounts',
    });
  }
}

/**
 * Remove a Plaid item (disconnect bank account)
 */
export async function removeItem(req: Request, res: Response) {
  try {
    const { access_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ error: 'access_token is required' });
    }

    const request: ItemRemoveRequest = {
      access_token,
    };

    await plaidClient.itemRemove(request);

    // Remove from in-memory storage
    for (const [itemId, token] of accessTokens.entries()) {
      if (token === access_token) {
        accessTokens.delete(itemId);
        break;
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error removing item:', error);
    res.status(500).json({
      error: error.response?.data?.error_message || 'Failed to remove item',
    });
  }
}
